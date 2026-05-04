import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import PortalLoginClient from '@/app/portal-media/_components/PortalLoginClient'

type Props = {
  children: React.ReactNode
  params: Promise<{ ref: string }>
}

export default async function PortalMediaLayout({ children, params }: Props) {
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
  const dados = row?.dados ? { ...(mock ?? {}), ...row.dados } : mock

  const senha      = (dados as any)?.senha as string | undefined
  const nomeProjeto = (dados as any)?.nome  ?? ref
  const cliente    = (dados as any)?.cliente ?? ''

  const cookieStore = await cookies()
  const isAdmin     = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  /* ── Protecção por senha ── */
  if (senha && !isAdmin) {
    const portalCookie = cookieStore.get(`pm_${ref.toUpperCase()}`)?.value
    if (portalCookie !== senha) {
      return (
        <div className="min-h-screen bg-[#04080f]">
          <PortalLoginClient
            portalRef={ref.toUpperCase()}
            nomeProjeto={nomeProjeto}
            cliente={cliente}
          />
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#04080f]">
      {/* Neon topo */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.13) 0%, rgba(30,70,200,0.05) 45%, transparent 70%)',
      }} />
      {/* Neon esquerda */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at -6% 45%, rgba(60,130,255,0.07) 0%, transparent 55%)',
      }} />
      {/* Neon direita */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at 106% 55%, rgba(40,100,255,0.06) 0%, transparent 52%)',
      }} />
      {children}

      {/* Rodapé global */}
      <div className="relative z-10 w-full border-t border-white/[0.04] py-10 px-6 flex flex-col items-center gap-1">
        <p className="text-center leading-tight">
          <span className="text-lg sm:text-xl font-light tracking-[0.18em] uppercase" style={{ color: '#b06fd8' }}>
            More Than a Product,{' '}
          </span>
          <span className="text-lg sm:text-xl font-extrabold tracking-[0.18em] uppercase text-white">
            An Experience.
          </span>
        </p>
        <p className="text-sm tracking-[0.4em] text-white/12 uppercase mt-1">RL Media · Audiovisual</p>
      </div>
    </div>
  )
}
