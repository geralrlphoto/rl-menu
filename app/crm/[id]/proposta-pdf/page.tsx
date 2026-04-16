import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CONTENT } from '@/app/r/[token]/LeadPageClient'
import PrintView from './PrintView'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('nome')
    .eq('id', id)
    .single()

  return {
    title: contact?.nome ? `Proposta — ${contact.nome}` : 'Proposta',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Auth check
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('rl_auth')
  if (authCookie?.value !== process.env.AUTH_SECRET) {
    redirect('/login')
  }

  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (!contact) {
    redirect('/crm')
  }

  const saved = typeof contact.page_content === 'string'
    ? JSON.parse(contact.page_content || '{}')
    : (contact.page_content || {})

  const content = {
    ...DEFAULT_CONTENT,
    ...saved,
    propostas: saved?.propostas || DEFAULT_CONTENT.propostas,
    extras_proposta: saved?.extras_proposta || [],
  }

  return <PrintView contact={contact} content={content} />
}
