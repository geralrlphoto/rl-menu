import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function EntregasPage({ params }: Props) {
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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Entregas</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {projeto.entregas.map((e, i) => (
            <div key={i}
              className={`border px-6 py-5 flex items-center justify-between gap-4
                ${e.estado === 'disponivel' ? 'border-emerald-400/25 bg-emerald-400/5' : 'border-white/[0.06] bg-white/[0.015]'}`}>
              <div className="flex items-start gap-4">
                <span className="text-sm font-mono text-white/15 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-sm tracking-[0.25em] text-white/65 uppercase font-medium">{e.titulo}</p>
                  <p className="text-sm tracking-[0.15em] text-white/25 mt-1">{e.formato} · {e.duracao}</p>
                </div>
              </div>
              {e.estado === 'disponivel' && e.linkUrl ? (
                <a href={e.linkUrl} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm tracking-[0.3em] text-white/60 uppercase transition-colors">
                  Descarregar →
                </a>
              ) : (
                <span className="shrink-0 text-xs tracking-[0.35em] text-white/20 uppercase">Pendente</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-sm tracking-[0.2em] text-white/20 leading-relaxed">
            Os ficheiros ficarão disponíveis após a aprovação da entrega final. Os links expiram 30 dias após disponibilização.
          </p>
        </div>
      </div>
    </main>
  )
}
