import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import SatisfacaoClient from '@/app/portal-media/_components/SatisfacaoClient'

type Props = { params: Promise<{ ref: string }> }

export default async function SatisfacaoPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  return (
    <main className="min-h-screen bg-[#050507] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <SatisfacaoClient projeto={projeto} isAdmin={isAdmin} />
    </main>
  )
}
