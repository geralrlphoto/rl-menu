import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'

// Público: recebe o NPS (/nps) de quem fechou e de quem não fechou e guarda-o na ficha da lead.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const leadId = String(body.leadId ?? '').trim()
  const nota = Number(body.nota)
  const porque = String(body.porque ?? '').trim().slice(0, 2000) || null
  if (!UUID_RE.test(leadId) || !Number.isInteger(nota) || nota < 0 || nota > 10) {
    return NextResponse.json({ error: 'Resposta inválida' }, { status: 400 })
  }

  const sb = sbAdmin()
  const { data: lead } = await sb.from('crm_contacts').select('id, status').eq('id', leadId).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })

  const { error } = await sb.from('crm_nps').insert({ contact_id: lead.id, nota, porque, status_lead: lead.status ?? null })
  if (error) return NextResponse.json({ error: 'Não foi possível guardar' }, { status: 500 })
  await sb.from('crm_status_history').insert({ contact_id: lead.id, evento: `NPS recebido: ${nota}/10` })
  return NextResponse.json({ ok: true })
}
