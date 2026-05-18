import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import SatisfacaoClient from '@/app/portal-media/_components/SatisfacaoClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function SatisfacaoPage({ params }: Props) {
  const { ref } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const projeto = row?.dados ?? getProjeto(ref)
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen relative">
      <SatisfacaoClient projeto={projeto} isAdmin={isAdmin} />
    </main>
  )
}
