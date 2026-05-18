import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import ReproducaoClient from '@/app/portal-media/_components/ReproducaoClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function ReproducaoPage({ params }: Props) {
  const { ref } = await params

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  // Página exclusiva para admin
  if (!isAdmin) redirect(`/portal-media/${ref}`)

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
  const projeto = row?.dados ? { ...mock, ...row.dados } : mock
  if (!projeto) notFound()

  return (
    <main className="min-h-screen relative">
      <ReproducaoClient projeto={projeto} />
    </main>
  )
}
