import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { propostaLiberada } from '@/lib/crm'
import { semDadosDaProposta } from '@/lib/portalReuniao'
import { DEFAULT_CONTENT } from '@/app/r/[token]/LeadPageClient'
import PrintView from '@/app/crm/[id]/proposta-pdf/PrintView'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('nome')
    .eq('page_token', token)
    .single()

  return {
    title: contact?.nome ? `Proposta — ${contact.nome}` : 'Proposta RL Photo · Video',
  }
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('page_token', token)
    .single()

  if (!contact) notFound()
  // Antes de a RL apresentar a proposta, só o admin a abre
  const admin = (await cookies()).get('rl_auth')?.value === process.env.AUTH_SECRET
  if (!admin && !propostaLiberada(contact)) notFound()

  const saved = typeof contact.page_content === 'string'
    ? JSON.parse(contact.page_content || '{}')
    : (contact.page_content || {})

  const content = {
    ...DEFAULT_CONTENT,
    ...semDadosDaProposta(saved, true),
    propostas: saved?.propostas || DEFAULT_CONTENT.propostas,
    extras_proposta: saved?.extras_proposta || [],
  }

  // autoPrint=false: o cliente não tem o diálogo de impressão automático
  // Só o que o PDF mostra: tudo o que se passa ao componente chega ao browser
  const { nome, data_casamento, local_casamento } = contact
  return <PrintView contact={{ nome, data_casamento, local_casamento }} content={content} autoPrint={false} />
}
