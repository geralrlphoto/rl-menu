import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import PortalLoginClient from '@/app/portal-media/_components/PortalLoginClient'
import PortalHamburger from '@/app/portal-media/_components/PortalHamburger'

type Props = {
  children: React.ReactNode
  params: Promise<{ ref: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }): Promise<Metadata> {
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
  const nomeProjeto = (dados as any)?.nome ?? ref

  return {
    title: `${nomeProjeto} · RL PROD`,
    description: 'Portal exclusivo RL PROD · Photography & Video',
    openGraph: {
      title: `${nomeProjeto} · RL PROD`,
      description: 'Portal exclusivo RL PROD · Photography & Video',
      siteName: 'RL PROD',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nomeProjeto} · RL PROD`,
      description: 'Portal exclusivo RL PROD · Photography & Video',
    },
  }
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
        <div className="min-h-screen bg-[#02060f]">
          {/* mesh gradient também na tela de login */}
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'linear-gradient(180deg, #06122a 0%, #030814 55%, #02060f 100%)' }} />
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(37,99,235,0.32) 0%, rgba(37,99,235,0.08) 35%, transparent 60%)' }} />
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 55% 70% at 0% 40%, rgba(56,189,248,0.14) 0%, transparent 55%)' }} />
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(59,130,246,0.16) 0%, transparent 60%)' }} />
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)' }} />
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
    <div className="min-h-screen" style={{ background: '#0e1b27' /* navy-950 */ }}>
      {/* ── Background navy v2: gradiente + accent breathing ── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: `
          radial-gradient(120% 80% at 80% -10%, #274458 0%, transparent 45%),
          radial-gradient(110% 70% at 0% 0%, #1f3647 0%, transparent 40%),
          linear-gradient(180deg, #122230, #0e1b27 60%)
        `,
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '4px 4px',
        opacity: 0.6,
        mixBlendMode: 'overlay',
      }} />

      {/* Hambúrguer de navegação do portal */}
      <PortalHamburger portalRef={ref.toUpperCase()} nomeProjeto={nomeProjeto} />

      {/* Espaço top para a barra fixa de cabeçalho */}
      <div className="pt-11 relative z-10">
        {children}
      </div>

      {/* Rodapé global — tom navy v2 (Space Grotesk + accent-bright) */}
      <div className="relative z-10 w-full py-12 px-6 flex flex-col items-center gap-2.5"
        style={{ borderTop: '1px solid oklch(0.50 0.03 245 / 0.18)' }}>
        <p className="text-center leading-tight tracking-[0.06em]"
          style={{ fontFamily: 'Space Grotesk, Manrope, sans-serif', fontSize: 'clamp(15px, 3.5vw, 20px)' }}>
          <span style={{ color: 'oklch(0.70 0.03 245)', fontWeight: 400 }}>More than a product,&nbsp;</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>an experience.</span>
        </p>
        <p className="text-[10.5px] tracking-[0.24em] uppercase font-semibold"
          style={{ color: 'oklch(0.58 0.03 245)' }}>
          RL PROD · Photography &amp; Video
        </p>
      </div>
    </div>
  )
}
