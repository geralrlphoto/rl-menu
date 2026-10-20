import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { ETAPAS_FOTO } from '@/lib/fotografiaFluxo'
import { enviarTicketFotos, type TicketFoto } from '@/lib/ticketFotos'
import { registarFoto } from '@/lib/fotografiaHistorico'

// Departamento de Fotografia › ações de cada cartão.
// POST { referencia, etapa, url? }
//   etapa sneakpeek | galerias | selecao | entregue → email aos noivos + link no portal
//     (as mesmas chaves de portais.settings que a ficha do evento usa)
//   etapa recebida → marca a seleção dos noivos como recebida hoje (selecao_recebida)
//   etapa lembrete → regista no histórico o lembrete enviado por WhatsApp
//   etapa retirar / repor → tira ou volta a pôr o casamento no departamento
//   etapa sem-sneakpeek → este casamento não tem sneak peek · sneakpeek-whatsapp → enviado por WhatsApp

export const maxDuration = 60

/** Nome no histórico (igual ao que a página do departamento mostra) */
const ENVIADO: Record<string, string> = {
  sneakpeek: 'Sneak peek enviado', galerias: 'Galeria online enviada', selecao: 'Fotos p/ seleção enviadas', entregue: 'Fotos editadas entregues',
}


export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { referencia, etapa, url } = await req.json().catch(() => ({}))
  if (!referencia || !etapa) return NextResponse.json({ error: 'Falta a referência ou a etapa.' }, { status: 400 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Retirar / repor o casamento no departamento (não é da responsabilidade da RL)
  if (etapa === 'retirar' || etapa === 'repor') {
    const { error } = etapa === 'retirar'
      ? await sb.from('fotografia_excluidos').upsert({ referencia }, { onConflict: 'referencia' })
      : await sb.from('fotografia_excluidos').delete().eq('referencia', referencia)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await registarFoto(referencia, etapa === 'retirar' ? 'Retirado do departamento' : 'Reposto no departamento', 'RL')
    return NextResponse.json({ ok: true })
  }

  const { data: p } = await sb.from('portais').select('id, noiva, noivo, settings').eq('referencia', referencia).maybeSingle()
  if (!p) return NextResponse.json({ error: 'Este casamento não tem portal.' }, { status: 404 })
  const hoje = new Date().toISOString().slice(0, 10)
  const settings = { ...(p.settings ?? {}) }

  // Lembrete por WhatsApp (aberto no browser da RL): só fica no histórico
  if (etapa === 'lembrete') {
    await registarFoto(referencia, 'Lembrete WhatsApp', 'RL')
    return NextResponse.json({ ok: true })
  }
  // Aviso de atraso ao membro responsável (WhatsApp aberto no browser da RL)
  if (etapa === 'aviso') {
    await registarFoto(referencia, 'Aviso de atraso por WhatsApp', String(url ?? '').trim() || 'Equipa')
    return NextResponse.json({ ok: true })
  }

  // Sneak peek: este casamento não tem (passa à galeria) / enviado por WhatsApp
  if (etapa === 'sem-sneakpeek' || etapa === 'sneakpeek-whatsapp') {
    const link = String(url ?? '').trim()
    if (etapa === 'sneakpeek-whatsapp' && !/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'Cola o link do sneak peek (https://…).' }, { status: 400 })
    const { data: pt } = await sb.from('portais').select('id, settings').eq('referencia', referencia).maybeSingle()
    if (!pt) return NextResponse.json({ error: 'Este casamento não tem portal.' }, { status: 404 })
    const hojeSp = new Date().toISOString().slice(0, 10)
    const novo = etapa === 'sem-sneakpeek'
      ? { sneakpeek_dispensado: true }
      : { sneakpeek_url: link, sneakpeek_enviada: hojeSp }
    await sb.from('portais').update({ settings: { ...(pt.settings ?? {}), ...novo } }).eq('id', pt.id)
    await registarFoto(referencia, etapa === 'sem-sneakpeek' ? 'Sem sneak peek' : 'Sneak peek enviado (WhatsApp)', 'RL')
    return NextResponse.json({ ok: true })
  }

  // Seleção dos noivos recebida (normalmente chega pelo formulário; aqui é à mão)
  if (etapa === 'recebida') {
    await sb.from('portais').update({ settings: { ...settings, selecao_recebida: hoje } }).eq('id', p.id)
    await registarFoto(referencia, 'Seleção recebida', 'RL')
    await enviarTicketFotos('recebida', referencia)   // "Recebemos a vossa seleção"
    return NextResponse.json({ ok: true })
  }

  const e = ETAPAS_FOTO.find(x => x.k === etapa)
  const link = String(url ?? '').trim()
  if (!e?.enviada || !e.url) return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 })
  if (!/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'Cola o link da galeria (https://…).' }, { status: 400 })

  // 1) Ticket das Fotografias aos noivos (lib/ticketFotos.ts); só marca o envio se o email sair
  const envio = await enviarTicketFotos(etapa as TicketFoto, referencia, { url: link })
  if (!envio.ok) return NextResponse.json({ error: envio.erro || 'Não foi possível enviar o email aos noivos.' }, { status: 502 })

  // 2) portal: o cartão fica Disponível (as mesmas chaves da ficha do evento)
  const extra: Record<string, unknown> = {}
  if (etapa === 'selecao') extra.sel_fotos_entregue_em = hoje
  await sb.from('portais').update({ settings: { ...settings, [e.enviada]: hoje, [e.url]: link, ...extra } }).eq('id', p.id)

  // 3) estado no evento (ficha, Notion e /photo)
  const estado = etapa === 'selecao' ? { sel_fotos_estado: 'Entregue' } : etapa === 'entregue' ? { fotos_edicao_estado: 'Entregue' } : null
  if (estado) {
    const { data: ev } = await sb.from('eventos_2026').select('notion_id, id').eq('referencia', referencia).maybeSingle()
    const id = ev?.notion_id || (ev?.id ? String(ev.id) : null)
    if (id) await fetch(`${req.nextUrl.origin}/api/eventos-notion/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() }, body: JSON.stringify(estado),
    }).catch(() => {})
  }

  await registarFoto(referencia, ENVIADO[etapa] ?? e.titulo, 'RL')
  return NextResponse.json({ ok: true })
}
