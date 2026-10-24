import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getProjeto } from '@/app/portal-media/_data/mockProject'
import PortalLoginClient from '@/app/portal-media/_components/PortalLoginClient'
import PortalHamburger from '@/app/portal-media/_components/PortalHamburger'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'

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
        <div className="rlp min-h-screen bg-[#00141f] text-white">
          <EstiloRLProd />
          <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
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
    <div className="rlp min-h-screen text-white" style={{ background: '#00141f' }}>
      {/* Letras e fundo do rlprod.pt (os mesmos das páginas internas da RL PROD) */}
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      {/* Hambúrguer de navegação do portal */}
      <PortalHamburger portalRef={ref.toUpperCase()} nomeProjeto={nomeProjeto} />

      {/* Espaço top para a barra fixa de cabeçalho */}
      <div className="pt-[52px] relative z-10">
        {children}
      </div>

      {/* Rodapé global */}
      <footer className="relative z-10 w-full py-12 px-6 flex flex-col items-center gap-3 border-t border-white/[0.08]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-10 h-10 object-contain opacity-80" />
        <p className="rlp-t text-center leading-tight text-[clamp(20px,4vw,28px)]">
          <span className="text-white/55">More than a product,&nbsp;</span>
          <span className="text-white">an experience.</span>
        </p>
        <p className="rlp-m text-[10px] text-[#5a8bff]">RL PROD · Photography &amp; Video · Setúbal, Worldwide</p>
      </footer>
    </div>
  )
}
