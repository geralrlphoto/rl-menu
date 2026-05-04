import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import RoadmapClient from '@/app/portal-media/_components/RoadmapClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function RoadmapPage({ params }: Props) {
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
  /* Supabase sobrepõe o mock; campos novos do mock (ex: roadmap) ficam como fallback */
  const projeto = row?.dados
    ? { ...(mock ?? {}), ...row.dados }
    : mock
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen bg-[#04080f] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.055) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      <RoadmapClient projeto={projeto} isAdmin={isAdmin} />
    </main>
  )
}
