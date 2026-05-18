import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import DashboardClient from '@/app/portal-media/_components/DashboardClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ref: string }> }

export default async function PortalMediaPage({ params }: Props) {
  const { ref } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Tentar buscar da Supabase primeiro
  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  // 2. Fallback para mockProject (OLEOBIO, etc.)
  const projeto = row?.dados ?? getProjeto(ref)
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen relative overflow-x-hidden">
      {/* Background mesh gradient agora vem do layout — sem duplicação aqui */}
      <DashboardClient projeto={projeto} isAdmin={isAdmin} />
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none z-20" />
    </main>
  )
}
