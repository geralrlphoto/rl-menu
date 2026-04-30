import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

export default async function RevisoesPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  const { usadas, total } = projeto.revisoes
  const restantes = total - usadas

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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Revisões</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Counter */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Incluídas', value: total       },
            { label: 'Usadas',    value: usadas      },
            { label: 'Restantes', value: restantes   },
          ].map(s => (
            <div key={s.label} className="border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-center">
              <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-2">{s.label}</p>
              <p className="text-3xl font-extralight text-white/60">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Rounds */}
        <div className="flex flex-col gap-3 mb-10">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 border px-6 py-4
              ${i < usadas ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-white/[0.06] bg-white/[0.015]'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${i < usadas ? 'bg-emerald-400' : 'bg-white/10'}`} />
              <p className={`text-base tracking-[0.25em] uppercase ${i < usadas ? 'text-white/55' : 'text-white/20'}`}>
                Revisão {i + 1}
              </p>
              <span className={`ml-auto text-xs tracking-[0.35em] uppercase ${i < usadas ? 'text-emerald-400/70' : 'text-white/15'}`}>
                {i < usadas ? 'Concluída' : 'Disponível'}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="border border-white/[0.07] bg-white/[0.02] px-6 py-6">
          <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-3">Dar Feedback</p>
          <p className="text-base text-white/35 leading-relaxed mb-4">
            Quando receberes o link do vídeo para revisão, usa o botão abaixo para enviar os teus comentários.
          </p>
          <button disabled
            className="border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm tracking-[0.4em] text-white/20 uppercase cursor-not-allowed">
            Aguardar Vídeo
          </button>
        </div>
      </div>
    </main>
  )
}
