import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import EntregasClient from '@/app/portal-media/_components/EntregasClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function EntregasPage({ params }: Props) {
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

  const mock = getProjeto(ref)
  const projeto = row?.dados ? { ...(mock ?? {}), ...row.dados } : mock
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen relative">
      <EntregasClient projeto={projeto} isAdmin={isAdmin} />
    </main>
  )
}
