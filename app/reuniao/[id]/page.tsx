import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { EVENTO_ABRIU_LINK, colunaDe } from '@/lib/crm'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'
import { camposPublicar } from '@/lib/portalReuniao'
import MarcarLead from './MarcarLead'

/* Link pessoal das mensagens de WhatsApp à lead (boas-vindas, marcar reunião, follow-ups).
   O id da lead serve de token: leva ao portal da reunião (criado aqui no 1.º acesso, com password
   nas propostas), que mostra o calendário até escolherem horário.
   Com o portal desligado ou a lead encerrada e sem portal, fica o calendário simples de sempre. */

export const metadata: Metadata = { title: 'RL Photo.Video · Marcar reunião' }
export const dynamic = 'force-dynamic'

export default async function ReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { data: lead } = await sbAdmin().from('crm_contacts')
    .select('nome, status, tipo_evento, data_casamento, reuniao_data, reuniao_hora, page_token, page_publicada, page_content').eq('id', id).maybeSingle()
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

  const pc = (typeof lead.page_content === 'string' ? JSON.parse(lead.page_content || '{}') : lead.page_content) ?? {}
  const batizado = pc.tipo ? pc.tipo === 'batizado' : /^batizado/i.test(lead.tipo_evento ?? '')
  const sb = sbAdmin()
  let token: string | null = lead.page_publicada ? lead.page_token : null
  if (!lead.page_token && colunaDe(lead.status) !== 'encerrada') {
    const { token: novo, campos } = await camposPublicar(sb, id, true)
    const page_content = { ...(campos.page_content as object), tipo: batizado ? 'batizado' : 'casamento' }
    const { error } = await sb.from('crm_contacts').update({ ...campos, page_content }).eq('id', id)
    if (!error) token = novo
  }
  if (token) redirect(`/${batizado ? 'b' : 'r'}/${token}`)

  return <MarcarLead leadId={id} nome={lead.nome ?? ''} dataCasamento={lead.data_casamento ?? ''}
    reuniaoData={lead.reuniao_data ?? ''} reuniaoHora={String(lead.reuniao_hora ?? '').slice(0, 5)} />
}
