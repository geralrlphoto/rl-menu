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

  let q = supabase
    .from('evento_historico')
    .select('id,tipo,titulo,detalhe,created_at')
    .order('created_at', { ascending: false })
    .limit(150)

  // A sintaxe do .or() não aceita vírgulas nem aspas no valor
  const refSeguro = ref && /^[\w.\- ]+$/.test(ref) ? ref : null

  if (eventoId && refSeguro) q = q.or(`evento_id.eq.${eventoId},referencia.eq.${refSeguro}`)
  else if (eventoId) q = q.eq('evento_id', eventoId)
  else if (refSeguro) q = q.eq('referencia', refSeguro)
  else return NextResponse.json({ historico: [] })

  const { data, error } = await q
  if (error) return NextResponse.json({ historico: [], error: error.message }, { status: 500 })

  const linhas: Linha[] = (data ?? []).map((h: any) => ({ ...h, origem: 'evento' as const }))

  // ── Fase de lead ──────────────────────────────────────────────────────────
  // O evento guarda o lead em crm_contact_id. Um gatilho preenche-o quando a
  // data do casamento e o nome dão um único candidato; o resto liga-se à mão
  // na ficha (POST abaixo).
  let lead: { id: string; nome: string } | null = null
  if (eventoId) {
    const { data: ev } = await supabase
      .from('eventos_2026').select('crm_contact_id').eq('id', eventoId).single()
    if (ev?.crm_contact_id) {
      const { data: c } = await supabase
        .from('crm_contacts').select('id,nome').eq('id', ev.crm_contact_id).single()
      if (c) lead = c as any
    }
  }

  if (lead) {
    const { data: hl } = await supabase
      .from('crm_status_history')
      .select('id,status_de,status_para,evento,created_at')
      .eq('contact_id', lead.id)
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
  }

  linhas.sort((a, b) => b.created_at.localeCompare(a.created_at))

  return NextResponse.json({ historico: linhas, lead: lead ? { id: lead.id, nome: lead.nome } : null })
}

// Liga (ou desliga, com crm_contact_id null) o evento ao seu lead do CRM
export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio

  const { evento_id, crm_contact_id } = await req.json().catch(() => ({}))
  if (!evento_id) return NextResponse.json({ error: 'falta evento_id' }, { status: 400 })

  const { error } = await sb()
    .from('eventos_2026').update({ crm_contact_id: crm_contact_id ?? null }).eq('id', evento_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
