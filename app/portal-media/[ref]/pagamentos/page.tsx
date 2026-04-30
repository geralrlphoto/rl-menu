import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

type Props = { params: Promise<{ ref: string }> }

const PAG_CFG = {
  pago:      { label: 'Pago',      color: 'text-emerald-400/80', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5'  },
  pendente:  { label: 'Pendente',  color: 'text-white/30',       border: 'border-white/[0.06]',   bg: 'bg-white/[0.015]' },
  em_atraso: { label: 'Em Atraso', color: 'text-red-400/80',     border: 'border-red-400/20',     bg: 'bg-red-400/5'     },
}

export default async function PagamentosPage({ params }: Props) {
  const { ref } = await params
  const projeto = getProjeto(ref)
  if (!projeto) notFound()

  const total = projeto.pagamentos.reduce((s, p) => s + p.valor, 0)
  const pago  = projeto.pagamentos.filter(p => p.estado === 'pago').reduce((s, p) => s + p.valor, 0)

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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Pagamentos</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Total',   value: `${total.toLocaleString('pt-PT')} €` },
            { label: 'Pago',    value: `${pago.toLocaleString('pt-PT')} €`  },
            { label: 'Restante',value: `${(total - pago).toLocaleString('pt-PT')} €` },
          ].map(s => (
            <div key={s.label} className="border border-white/[0.07] bg-white/[0.02] px-4 py-4 text-center">
              <p className="text-[8px] tracking-[0.4em] text-white/25 uppercase mb-1">{s.label}</p>
              <p className="text-[13px] tracking-[0.1em] text-white/65 font-light">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Payments */}
        <div className="flex flex-col gap-3">
          {projeto.pagamentos.map((pag, i) => {
            const cfg = PAG_CFG[pag.estado]
            return (
              <div key={i} className={`flex items-center justify-between border ${cfg.border} ${cfg.bg} px-6 py-5`}>
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-white/60 uppercase font-medium">{pag.descricao}</p>
                  <p className="text-[9px] tracking-[0.2em] text-white/20 mt-1">{pag.data}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] tracking-[0.1em] text-white/60 font-light">{pag.valor.toLocaleString('pt-PT')} €</p>
                  <p className={`text-[8px] tracking-[0.3em] uppercase mt-1 ${cfg.color}`}>{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-[9px] tracking-[0.2em] text-white/15 leading-relaxed">
          Para questões relacionadas com faturação contacta financeiro@rlmedia.pt
        </p>
      </div>
    </main>
  )
}
