import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'
import MarcarLead from './MarcarLead'

/* Página pública aberta pelo botão "Marcar reunião" (WhatsApp) da ficha rápida do CRM.
   O id da lead serve de token: os noivos escolhem um horário livre (o mesmo calendário
   do /rollup) e a lead passa a "Reunião Agendada". */

export const metadata: Metadata = { title: 'RL Photo.Video · Marcar reunião' }
export const dynamic = 'force-dynamic'

export default async function ReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { data: lead } = await sbAdmin().from('crm_contacts')
    .select('nome, data_casamento, reuniao_data, reuniao_hora').eq('id', id).maybeSingle()
  if (!lead) notFound()
  return <MarcarLead leadId={id} nome={lead.nome ?? ''} dataCasamento={lead.data_casamento ?? ''}
    reuniaoData={lead.reuniao_data ?? ''} reuniaoHora={String(lead.reuniao_hora ?? '').slice(0, 5)} />
}
