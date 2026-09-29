import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
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

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ portal?: string }> }) {
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

  // ── Auto-guardar URL público do PDF ──────────────────────────────────────────
  // Garante que o contacto tem token; se não tiver, cria um agora
  const token = contact.page_token || randomUUID()

  // Constrói o URL público a partir do host da request
  const hdrs = await headers()
  const host = hdrs.get('host') || 'portal.rlphotovideo.pt'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const publicPdfUrl = `${protocol}://${host}/r/${token}/proposta-pdf`

  // Guarda token + URL na BD (idempotente — não faz mal correr várias vezes)
  await supabase
    .from('crm_contacts')
    .update({ page_token: token, proposta_pdf_url: publicPdfUrl })
    .eq('id', id)
  // ─────────────────────────────────────────────────────────────────────────────

  const saved = typeof contact.page_content === 'string'
    ? JSON.parse(contact.page_content || '{}')
    : (contact.page_content || {})

  // "Gerar Proposta" (?portal=1): a proposta fica marcada como gerada e abre-se o
  // portal do cliente com as propostas desdobradas, em vez da página para imprimir
  if ((await searchParams).portal === '1') {
    redirect(`/${saved?.tipo === 'batizado' ? 'b' : 'r'}/${token}?proposta=1`)
  }

  const content = {
    ...DEFAULT_CONTENT,
    ...saved,
    propostas: saved?.propostas || DEFAULT_CONTENT.propostas,
    extras_proposta: saved?.extras_proposta || [],
  }

  return <PrintView contact={{ ...contact, page_token: token }} content={content} />
}
