import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

const ESTADO_CFG = {
  concluido: { label: 'Concluído',  bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400',    text: 'text-emerald-400/80' },
  em_curso:  { label: 'Em Curso',   bg: 'bg-blue-400/10',    border: 'border-blue-400/30',    dot: 'bg-blue-400',       text: 'text-blue-400/80'    },
  pendente:  { label: 'Pendente',   bg: 'bg-white/[0.02]',   border: 'border-white/[0.06]',   dot: 'bg-white/15',       text: 'text-white/25'       },
}

export default async function WorkflowPage({ params }: Props) {
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

        {/* Back */}
        <Link href={`/portal-media/${ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Workflow</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />

          <div className="flex flex-col gap-4">
            {projeto.fases.map((fase, i) => {
              const cfg = ESTADO_CFG[fase.estado]
              return (
                <div key={fase.id} className="relative flex gap-6">
                  {/* Dot */}
                  <div className="relative z-10 mt-[18px] shrink-0">
                    <div className={`w-[23px] h-[23px] border flex items-center justify-center ${cfg.border} ${cfg.bg}`}>
                      <div className={`w-2 h-2 rounded-full ${cfg.dot} ${fase.estado === 'em_curso' ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 border ${cfg.border} ${cfg.bg} p-5`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-white/15">{String(i + 1).padStart(2, '0')}</span>
                        <h3 className={`text-base tracking-[0.3em] font-medium uppercase ${fase.estado === 'pendente' ? 'text-white/35' : 'text-white/75'}`}>
                          {fase.nome}
                        </h3>
                      </div>
                      <span className={`text-xs tracking-[0.3em] uppercase shrink-0 ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-base text-white/25 leading-relaxed pl-7">{fase.descricao}</p>
                    {fase.data && (
                      <p className={`text-base tracking-[0.2em] mt-2 pl-7 ${fase.estado === 'pendente' ? 'text-white/15' : 'text-white/35'}`}>
                        {fase.data}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-base tracking-[0.2em] text-white/20 leading-relaxed">
            As datas indicadas são estimativas e podem ser ajustadas conforme o avanço do projeto.
            Serás notificado em cada transição de fase.
          </p>
        </div>
      </div>
    </main>
  )
}
