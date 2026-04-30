import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function AtendimentoPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  return (
    <main className="min-h-screen bg-[#050507] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Atendimento</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Gestor de conta */}
        <div className="border border-white/[0.08] bg-white/[0.02] p-7 mb-4">
          <p className="text-xs tracking-[0.5em] text-white/20 uppercase mb-5">Gestor de Conta</p>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-12 h-12 border border-white/10 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 20px rgba(180,200,255,0.06)' }}>
              <span className="text-lg text-white/20 select-none">◈</span>
            </div>
            <div>
              <p className="text-sm tracking-[0.2em] text-white/65 uppercase font-light">{projeto.gestorNome}</p>
              <p className="text-sm tracking-[0.2em] text-white/25 mt-0.5">RL Media · Audiovisual</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <a href={`mailto:${projeto.gestorEmail}`}
              className="group flex items-center gap-4 border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] px-5 py-3 transition-colors">
              <span className="text-xs tracking-[0.4em] text-white/20 uppercase w-14 shrink-0">Email</span>
              <span className="text-sm tracking-[0.15em] text-white/45 group-hover:text-white/65 transition-colors">{projeto.gestorEmail}</span>
              <span className="ml-auto text-white/15 group-hover:text-white/40 transition-colors">→</span>
            </a>
            <a href={`tel:${projeto.gestorTelefone}`}
              className="group flex items-center gap-4 border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] px-5 py-3 transition-colors">
              <span className="text-xs tracking-[0.4em] text-white/20 uppercase w-14 shrink-0">Tel.</span>
              <span className="text-sm tracking-[0.15em] text-white/45 group-hover:text-white/65 transition-colors">{projeto.gestorTelefone}</span>
              <span className="ml-auto text-white/15 group-hover:text-white/40 transition-colors">→</span>
            </a>
          </div>
        </div>

        {/* Site RL Media */}
        <a href="https://www.rlmedia.pt" target="_blank" rel="noopener noreferrer"
          className="group flex items-center justify-between border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/15 px-6 py-4 transition-all">
          <div>
            <p className="text-sm tracking-[0.3em] text-white/40 uppercase group-hover:text-white/60 transition-colors">RL Media · Audiovisual</p>
            <p className="text-sm tracking-[0.15em] text-white/20 mt-0.5">www.rlmedia.pt</p>
          </div>
          <span className="text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">↗</span>
        </a>
      </div>
    </main>
  )
}
