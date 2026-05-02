import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import ContratoClient from '@/app/portal-media/_components/ContratoClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function ContratoPage({ params }: Props) {
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

  const contratoGerado = row?.dados?.contrato ?? null

  return (
    <main className="min-h-screen bg-[#04080f] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.055) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      <ContratoClient projeto={projeto} isAdmin={isAdmin} contratoGerado={contratoGerado} />
    </main>
  )
}
