import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { ETAPAS_FOTO } from '@/lib/fotografiaFluxo'
import { registarFoto } from '@/lib/fotografiaHistorico'
import { resolveEmailNoiva } from '@/app/api/_lib/emailNoiva'
import { SITE_URL } from '@/lib/site-url'
import { portalPathFor } from '@/lib/noivos-session'

// Departamento de Fotografia › ações de cada cartão.
// POST { referencia, etapa, url? }
//   etapa sneakpeek | galerias | selecao | entregue → email aos noivos + link no portal
//     (as mesmas chaves de portais.settings que a ficha do evento usa)
//   etapa recebida → marca a seleção dos noivos como recebida hoje (selecao_recebida)
//   etapa lembrete → regista no histórico o lembrete enviado por WhatsApp
//   etapa retirar / repor → tira ou volta a pôr o casamento no departamento

export const maxDuration = 60

/** Nome no histórico (igual ao que a página do departamento mostra) */
const ENVIADO: Record<string, string> = {
  sneakpeek: 'Sneak peek enviado', galerias: 'Galeria online enviada', selecao: 'Fotos p/ seleção enviadas', entregue: 'Fotos editadas entregues',
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function sneakPeekHtml(nomes: string, url: string, portal: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
        <tr><td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;">Olá, ${esc(nomes)}!</p>
          <h1 style="margin:0;font-size:38px;font-weight:400;color:#ffffff;line-height:1.15;">As primeiras</h1>
          <h1 style="margin:0 0 22px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">fotografias do vosso dia.</h1>
          <p style="margin:0 0 32px;font-size:15px;color:#d4c9b0;line-height:1.7;">Não conseguimos esperar. Escolhemos algumas das fotografias<br>do vosso casamento para as verem já, enquanto tudo ainda está tão perto.</p>
          <a href="${esc(url)}" style="display:inline-block;padding:15px 34px;background:#c9a96e;color:#0e0b06;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;">Ver o sneak peek</a>
          <p style="margin:32px 0 0;font-size:13px;color:#8a7450;line-height:1.7;">A galeria completa chega nos próximos dias.<br>Fica tudo também no vosso <a href="${portal}" style="color:#c9a96e;">Portal dos Noivos</a>.</p>
          <p style="margin:40px 0 0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
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

  // Seleção dos noivos recebida (normalmente chega pelo formulário; aqui é à mão)
  if (etapa === 'recebida') {
    await sb.from('portais').update({ settings: { ...settings, selecao_recebida: hoje } }).eq('id', p.id)
    await registarFoto(referencia, 'Seleção recebida', 'RL')
    return NextResponse.json({ ok: true })
  }

  const e = ETAPAS_FOTO.find(x => x.k === etapa)
  const link = String(url ?? '').trim()
  if (!e?.enviada || !e.url) return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 })
  if (!/^https?:\/\//i.test(link)) return NextResponse.json({ error: 'Cola o link da galeria (https://…).' }, { status: 400 })

  // 1) email aos noivos (só marca o envio se o email sair)
  const nomes = [p.noiva, p.noivo].filter(Boolean).join(' & ') || 'Noivos'
  if (etapa === 'sneakpeek') {
    const email = await resolveEmailNoiva(null, referencia)
    if (!email) return NextResponse.json({ error: 'Email da noiva não encontrado. Preenche o email na ficha do evento.' }, { status: 400 })
    const portal = `${SITE_URL}${portalPathFor(referencia, referencia.startsWith('BAT_') ? 'batizado' : 'casamento')}`
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>', to: [email], reply_to: 'geral.rlphoto@gmail.com',
        subject: 'As primeiras fotografias do vosso casamento', html: sneakPeekHtml(nomes, link, portal),
      }),
    }).catch(() => null)
    if (!r?.ok) return NextResponse.json({ error: 'Não foi possível enviar o email aos noivos.' }, { status: 502 })
  } else {
    const r = await fetch(`${req.nextUrl.origin}${e.email}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
      body: JSON.stringify({ email_noiva: null, nome_noiva: p.noiva ?? null, nome_noivo: p.noivo ?? null, url: link, referencia }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (!r?.ok) return NextResponse.json({ error: (d as any).error || 'Não foi possível enviar o email aos noivos.' }, { status: 502 })
  }

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
