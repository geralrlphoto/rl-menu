import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'
import { limparRespostasNps, NOTA_INDICAR } from '@/lib/nps'

// Público: recebe o NPS (/nps) só de quem fechou e guarda-o na ficha da lead,
// com os noivos que indicaram (se a nota for alta).

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const leadId = String(body.leadId ?? '').trim()
  const limpo = limparRespostasNps(body.respostas)
  if (!UUID_RE.test(leadId) || !limpo) return NextResponse.json({ error: 'Resposta inválida' }, { status: 400 })
  const { respostas, nota } = limpo

  const indNome = nota >= NOTA_INDICAR ? String(body.indicacao?.nome ?? '').trim().slice(0, 160) : ''
  const indContacto = nota >= NOTA_INDICAR ? String(body.indicacao?.contacto ?? '').trim().slice(0, 160) : ''

  const sb = sbAdmin()
  const { data: lead } = await sb.from('crm_contacts').select('id, nome, status').eq('id', leadId).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })
  if (lead.status !== 'Fechou') return NextResponse.json({ error: 'O NPS é só para noivos que fecharam' }, { status: 403 })

  // Noivos indicados: entram no CRM como lead nova (mesmos valores por defeito do /crm/nova)
  if (indNome && indContacto) {
    const quemIndicou = lead.nome || 'noivos sem nome'
    const { data: nova } = await sb.from('crm_contacts').insert({
      nome: indNome,
      ...(indContacto.includes('@') ? { email: indContacto } : { contato: indContacto }),
      status: 'Por Contactar', lead_prioridade: 'Médio', tipo_evento: 'Casamento',
      data_entrada: new Date().toISOString().split('T')[0],
      como_chegou: 'Indicação',
      notas: `Indicados por ${quemIndicou} no NPS (nota ${nota}/10). Se fecharem, oferecer um serviço a ${quemIndicou}.`,
    }).select('id').single()
    if (nova) await sb.from('crm_status_history').insert({ contact_id: nova.id, evento: `Lead criada por indicação de ${quemIndicou} (NPS)` })
  }

  const { error } = await sb.from('crm_nps').insert({
    contact_id: lead.id, nota, respostas,
    porque: typeof respostas.melhorar === 'string' ? respostas.melhorar : null,
    status_lead: lead.status ?? null,
    indicacao_nome: indNome || null, indicacao_contacto: indContacto || null,
  })
  if (error) return NextResponse.json({ error: 'Não foi possível guardar' }, { status: 500 })
  await sb.from('crm_status_history').insert({
    contact_id: lead.id,
    evento: `NPS recebido: ${nota}/10${indNome || indContacto ? ` · indicaram ${indNome || indContacto}` : ''}`,
  })
  return NextResponse.json({ ok: true })
}
