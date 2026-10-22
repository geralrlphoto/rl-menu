import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

type Linha = {
  id: string
  tipo: string
  titulo: string
  detalhe: string | null
  created_at: string
  origem: 'evento' | 'lead'
}

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Histórico de ações de um evento. As entradas chegam por gatilhos na base de
// dados: umas sabem o id do evento (eventos_2026, links do freelancer), outras
// só sabem a referência (portal dos noivos, pagamentos). Lê as duas, e junta
// ainda a fase de lead vinda do CRM quando consegue identificá-la sem dúvidas.
export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio

  const { searchParams } = new URL(req.url)
  const supabase = sb()

  // Procurar leads do CRM para ligar à mão (?procurar=nome)
  const procurar = searchParams.get('procurar')?.trim()
  if (procurar !== undefined) {
    if (procurar.length < 2) return NextResponse.json({ leads: [] })
    const { data } = await supabase
      .from('crm_contacts').select('id,nome,data_casamento,status')
      .ilike('nome', `%${procurar.replace(/[%_]/g, '')}%`)
      .order('created_at', { ascending: false })
      .limit(8)
    return NextResponse.json({ leads: data ?? [] })
  }

  const eventoId = searchParams.get('evento_id')
  const ref = searchParams.get('ref')
  if (!eventoId && !ref) return NextResponse.json({ historico: [] })

  // A sintaxe do .or() não aceita vírgulas nem aspas no valor
  const idSeguro = eventoId && /^[\w-]+$/.test(eventoId) ? eventoId : null
  const refSeguro = ref && /^[\w.\- ]+$/.test(ref) ? ref : null

  // A ficha pode chegar com o id do Notion (eventos_2026.notion_id) em vez do id
  // do Supabase: procura a linha pelos dois, e pela referência em último caso.
  const ev = await linhaEvento(supabase, idSeguro, refSeguro)
  const ids = [...new Set([idSeguro, ev?.id].filter(Boolean))] as string[]
  const referencia = refSeguro ?? ev?.referencia ?? null

  const filtros = [...ids.map(i => `evento_id.eq.${i}`), ...(referencia ? [`referencia.eq.${referencia}`] : [])]
  if (!filtros.length) return NextResponse.json({ historico: [] })
  const { data, error } = await supabase
    .from('evento_historico')
    .select('id,tipo,titulo,detalhe,created_at')
    .or(filtros.join(','))
    .neq('tipo', 'pagamento')   // os pagamentos vêm todos de pagamentos_noivos (abaixo)
    .order('created_at', { ascending: false })
    .limit(150)
  if (error) return NextResponse.json({ historico: [], error: error.message }, { status: 500 })

  const linhas: Linha[] = (data ?? []).map((h: any) => ({ ...h, origem: 'evento' as const }))

  // ── Pagamentos dos noivos (todos, incluindo os anteriores ao histórico) ──
  if (referencia) {
    const { data: pags } = await supabase
      .from('pagamentos_noivos')
      .select('id,data_pagamento,created_at,fase_pagamento,valor_liquidado,confirmado')
      .ilike('referencia', referencia)
    for (const p of pags ?? []) {
      const fase = Array.isArray(p.fase_pagamento) && p.fase_pagamento.length ? p.fase_pagamento.join(', ') : 'Pagamento'
      const valor = p.valor_liquidado != null ? euros(Number(p.valor_liquidado)) : null
      linhas.push({
        id: `pag-${p.id}`,
        tipo: 'pagamento',
        titulo: `Pagamento: ${fase.charAt(0) + fase.slice(1).toLowerCase()}`,
        detalhe: [valor, p.confirmado ? null : 'por confirmar'].filter(Boolean).join(' · ') || null,
        // Registado no próprio dia: a hora do registo é mais certa que só a data
        created_at: p.data_pagamento && String(p.created_at).slice(0, 10) !== p.data_pagamento ? `${p.data_pagamento}T12:00:00+00:00` : p.created_at,
        origem: 'evento',
      })
    }
  }

  // ── Fase de lead ──────────────────────────────────────────────────────────
  // O evento guarda o lead em crm_contact_id. Um gatilho preenche-o quando a
  // data do casamento e o nome dão um único candidato; o resto liga-se à mão
  // na ficha (POST abaixo).
  let lead: { id: string; nome: string } | null = null
  if (ev?.crm_contact_id) {
    const { data: c } = await supabase
      .from('crm_contacts')
      .select('id,nome,data_entrada,created_at,reuniao_data,reuniao_hora,reuniao_tipo,data_fecho')
      .eq('id', ev.crm_contact_id).single()
    if (c) {
      lead = { id: c.id, nome: c.nome }
      const { data: hl } = await supabase
        .from('crm_status_history')
        .select('id,status_de,status_para,evento,created_at')
        .eq('contact_id', c.id)
        .order('created_at', { ascending: false })
        .limit(60)

      for (const h of hl ?? []) {
        linhas.push({
          id: `lead-${h.id}`,
          tipo: 'lead',
          titulo: h.evento ? h.evento : h.status_de ? `${h.status_de} → ${h.status_para}` : `Entrou como ${h.status_para}`,
          detalhe: null,
          created_at: h.created_at,
          origem: 'lead',
        })
      }

      // Marcos guardados na ficha do lead (servem também os leads anteriores ao histórico)
      const entrada = c.data_entrada && c.data_entrada < String(c.created_at).slice(0, 10) ? `${c.data_entrada}T12:00:00+00:00` : c.created_at
      if (entrada && !(hl ?? []).some(h => !h.status_de && !h.evento)) {
        linhas.push({ id: 'lead-entrada', tipo: 'lead', titulo: 'Lead entrou no CRM', detalhe: null, created_at: entrada, origem: 'lead' })
      }
      if (c.reuniao_data) {
        linhas.push({
          id: 'lead-reuniao', tipo: 'lead',
          titulo: `Reunião${c.reuniao_tipo ? ` (${c.reuniao_tipo})` : ''}${c.reuniao_hora ? ` às ${String(c.reuniao_hora).slice(0, 5)}` : ''}`,
          detalhe: null,
          created_at: `${c.reuniao_data}T${c.reuniao_hora ? String(c.reuniao_hora).slice(0, 5) : '12:00'}:00`,
          origem: 'lead',
        })
      }
      if (c.data_fecho && !(hl ?? []).some(h => /fech/i.test(String(h.status_para ?? '')) && !/n[aã]o/i.test(String(h.status_para ?? '')))) {
        linhas.push({ id: 'lead-fecho', tipo: 'lead', titulo: 'Fechou contrato', detalhe: null, created_at: c.data_fecho, origem: 'lead' })
      }
    }
  }

  linhas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ historico: linhas, lead })
}

const euros = (v: number) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })

async function linhaEvento(supabase: ReturnType<typeof sb>, id: string | null, ref: string | null) {
  if (id) {
    const { data } = await supabase.from('eventos_2026').select('id,referencia,crm_contact_id')
      .or(`id.eq.${id},notion_id.eq.${id}`).limit(1).maybeSingle()
    if (data) return data as { id: string; referencia: string | null; crm_contact_id: string | null }
  }
  if (ref) {
    const { data } = await supabase.from('eventos_2026').select('id,referencia,crm_contact_id')
      .eq('referencia', ref).limit(1).maybeSingle()
    if (data) return data as { id: string; referencia: string | null; crm_contact_id: string | null }
  }
  return null
}

// Liga (ou desliga, com crm_contact_id null) o evento ao seu lead do CRM
export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio

  const { evento_id, crm_contact_id } = await req.json().catch(() => ({}))
  if (!evento_id) return NextResponse.json({ error: 'falta evento_id' }, { status: 400 })

  // A ficha pode mandar o id do Notion: liga a linha certa
  const ev = await linhaEvento(sb(), /^[\w-]+$/.test(String(evento_id)) ? String(evento_id) : null, null)
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  const { error } = await sb()
    .from('eventos_2026').update({ crm_contact_id: crm_contact_id ?? null }).eq('id', ev.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
