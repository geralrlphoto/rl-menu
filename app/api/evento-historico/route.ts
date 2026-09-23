import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Linha = {
  id: string
  tipo: string
  titulo: string
  detalhe: string | null
  created_at: string
  origem: 'evento' | 'lead'
}

// Tira acentos e maiúsculas, para "FíLIPA" casar com "Filipa"
const fold = (t: string) =>
  (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Histórico de ações de um evento. As entradas chegam por gatilhos na base de
// dados: umas sabem o id do evento (eventos_2026, links do freelancer), outras
// só sabem a referência (portal dos noivos, pagamentos). Lê as duas, e junta
// ainda a fase de lead vinda do CRM quando consegue identificá-la sem dúvidas.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventoId = searchParams.get('evento_id')
  const ref = searchParams.get('ref')
  if (!eventoId && !ref) return NextResponse.json({ historico: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
  // O CRM não guarda a referência do evento, por isso a ligação faz-se pela
  // data do casamento mais o nome. Só se usa quando dá um único candidato:
  // mostrar o histórico do casal errado seria pior do que não mostrar nada.
  let lead: { id: string; nome: string } | null = null
  if (eventoId) {
    try {
      const { data: ev } = await supabase
        .from('eventos_2026').select('cliente,data_evento').eq('id', eventoId).single()

      if (ev?.data_evento && ev?.cliente) {
        const { data: candidatos } = await supabase
          .from('crm_contacts').select('id,nome').eq('data_casamento', ev.data_evento)

        const alvo = fold(ev.cliente)
        const certos = (candidatos ?? []).filter(c => {
          const primeiro = fold(c.nome).split(' ')[0]
          return primeiro.length >= 3 && alvo.includes(primeiro)
        })
        if (certos.length === 1) lead = certos[0] as any
      }
    } catch { /* sem fase de lead, o histórico do evento chega */ }
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
