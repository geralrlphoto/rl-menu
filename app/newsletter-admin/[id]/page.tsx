import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NewsletterEditor from './editor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function NewsletterDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: newsletter }, { count: activeCount }] = await Promise.all([
    supabase.from('newsletters').select('*').eq('id', id).maybeSingle(),
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  if (!newsletter) notFound()

  return (
    <NewsletterEditor
      initialData={newsletter}
      activeSubscribers={activeCount || 0}
    />
  )
}

// Helper para percentagem
function pct(a: number, b: number): string {
  if (!b) return '0%'
  return `${Math.round((a / b) * 100)}%`
}

