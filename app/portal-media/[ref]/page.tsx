import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import DashboardClient from '@/app/portal-media/_components/DashboardClient'

type Props = { params: Promise<{ ref: string }> }

export default async function PortalMediaPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(180,200,255,0.045) 0%, transparent 70%)',
      }} />
      <DashboardClient projeto={projeto} isAdmin={isAdmin} />
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none z-20" />
    </main>
  )
}
