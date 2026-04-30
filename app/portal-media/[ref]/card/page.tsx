import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function CardPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-hidden flex flex-col items-center justify-center px-6 py-16">

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Radial glow center */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(180,200,255,0.05) 0%, transparent 70%)',
      }} />

      {/* Corner decorators */}
      <div className="fixed top-6 left-6 z-10 opacity-20">
        <div className="w-8 h-px bg-white/60" /><div className="w-px h-8 bg-white/60" />
      </div>
      <div className="fixed top-6 right-6 z-10 opacity-20 flex flex-col items-end">
        <div className="w-8 h-px bg-white/60" /><div className="w-px h-8 bg-white/60 ml-auto" />
      </div>
      <div className="fixed bottom-6 left-6 z-10 opacity-20 flex flex-col justify-end">
        <div className="w-px h-8 bg-white/60" /><div className="w-8 h-px bg-white/60" />
      </div>
      <div className="fixed bottom-6 right-6 z-10 opacity-20 flex flex-col items-end justify-end">
        <div className="w-px h-8 bg-white/60 ml-auto" /><div className="w-8 h-px bg-white/60" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* Top label */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <p className="text-xs tracking-[0.5em] text-white/20 uppercase">Portal do Cliente</p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Main card */}
        <div className="border border-white/[0.1] bg-white/[0.025] relative"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6)' }}>

          {/* Inner top border accent */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Logo */}
          <div className="flex justify-center pt-12 pb-7">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-white"
              style={{ boxShadow: '0 0 40px rgba(255,255,255,0.08)' }}>
              <img
                src="/logo-email.png"
                alt="RL Media"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-10 mb-8">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[8px] tracking-[0.55em] text-white/15 uppercase">Portal Criado</span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          {/* Project info */}
          <div className="px-10 text-center mb-8">
            <p className="text-[9px] tracking-[0.55em] text-white/20 uppercase mb-2">{projeto.tipo}</p>
            <h1 className="text-2xl font-extralight tracking-[0.45em] text-white/90 uppercase leading-tight mb-1">
              {projeto.nome}
            </h1>
            <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-8">{projeto.cliente}</p>

            <p className="text-sm text-white/40 leading-[1.8] font-light mb-2">
              O teu portal de projeto está pronto.
            </p>
            <p className="text-xs text-white/25 leading-[1.8] font-light">
              Aqui podes acompanhar em tempo real todas as fases,<br/>
              timings, pagamentos e entregas do teu projeto.
            </p>
          </div>

          {/* CTA button */}
          <div className="px-10 pb-8">
            <Link
              href={`/portal-media/${projeto.ref}`}
              className="block w-full border border-white/20 bg-white/[0.05] hover:bg-white/[0.1]
                         py-4 text-xs tracking-[0.55em] text-white/65 hover:text-white/90 uppercase
                         text-center transition-all duration-300"
              style={{ boxShadow: '0 0 20px rgba(255,255,255,0.04)' }}
            >
              Aceder ao Portal →
            </Link>
            <p className="mt-3 text-center text-[9px] tracking-[0.2em] text-white/15 font-mono">
              rlmedia.pt/portal-media/{projeto.ref.toLowerCase()}
            </p>
          </div>

          {/* Inner bottom border accent */}
          <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-[8px] tracking-[0.5em] text-white/10 uppercase">RL Media · Audiovisual</p>
          <p className="text-[8px] tracking-[0.3em] text-white/10 uppercase">www.rlmedia.pt</p>
        </div>
      </div>
    </main>
  )
}
