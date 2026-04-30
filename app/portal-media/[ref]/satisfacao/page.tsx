import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function SatisfacaoPage({ params }: Props) {
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
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        <div className="mb-10">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Satisfação</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="border border-white/[0.07] bg-white/[0.02] p-8 flex flex-col items-center text-center gap-6">
          <div className="w-14 h-14 border border-white/[0.08] flex items-center justify-center"
            style={{ boxShadow: '0 0 30px rgba(180,200,255,0.05)' }}>
            <span className="text-2xl text-white/15 select-none">◒</span>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3em] text-white/50 uppercase mb-2">Avaliação do Projeto</p>
            <p className="text-[10px] text-white/25 leading-relaxed max-w-sm">
              No final do projeto pedimos que avalies a tua experiência com a RL Media.
              A tua opinião ajuda-nos a melhorar continuamente.
            </p>
          </div>
          <button disabled
            className="border border-white/[0.08] bg-white/[0.02] px-6 py-3
                       text-[9px] tracking-[0.4em] text-white/20 uppercase cursor-not-allowed">
            Disponível após entrega final
          </button>
        </div>
      </div>
    </main>
  )
}
