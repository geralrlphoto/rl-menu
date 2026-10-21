import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { EVENTO_ABRIU_LINK } from '@/lib/crm'
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

  // Regista a 1.ª vez que a lead abre o link (aparece no cartão do CRM: "Abriu o link").
  // As aberturas do admin (com sessão) não contam.
  // A pré-visualização do link (feita pelo WhatsApp ao enviar) e os robôs também não contam.
  const admin = (await cookies()).get('rl_auth')?.value === process.env.AUTH_SECRET
  const ua = (await headers()).get('user-agent') ?? ''
  const preVisualizacao = /WhatsApp|facebookexternalhit|Facebot|TelegramBot|Slackbot|Twitterbot|bot\b|crawler|spider|preview/i.test(ua)
  if (!admin && !preVisualizacao) {
    const sb = sbAdmin()
    const { count } = await sb.from('crm_status_history').select('id', { count: 'exact', head: true })
      .eq('contact_id', id).eq('evento', EVENTO_ABRIU_LINK)
    if (!count) await sb.from('crm_status_history').insert({ contact_id: id, evento: EVENTO_ABRIU_LINK })
  }

  return <MarcarLead leadId={id} nome={lead.nome ?? ''} dataCasamento={lead.data_casamento ?? ''}
    reuniaoData={lead.reuniao_data ?? ''} reuniaoHora={String(lead.reuniao_hora ?? '').slice(0, 5)} />
}
