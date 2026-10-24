'use client'

// Gráfico mensal da RL PROD: receitas vs despesas por mês, com o balanço do mês por baixo.
// Só divs, sem bibliotecas.

export type MesGrafico = {
  chave: string
  rotulo: string
  ano: number
  receitas: number
  despesas: number
  atual: boolean
  futuro: boolean
}

export default function GraficoMensal({ meses, fmt, fmt0 }: {
  meses: MesGrafico[]
  fmt: (n: number) => string
  fmt0: (n: number) => string
}) {
  const max = Math.max(1, ...meses.map(m => Math.max(m.receitas, m.despesas)))
  const alt = (v: number) => (v > 0 ? `${Math.max(2, (v / max) * 100)}%` : '0%')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-6 text-[11px] text-white/50">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2e6cf6]" />Receitas</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-white/35" />Despesas</span>
        <span className="flex items-center gap-1.5"><span className="rlp-m text-[9px] tracking-[0.15em] text-[#5a8bff]">+0</span>Balanço do mês</span>
      </div>

      <div className="relative h-[180px]">
        {[0, 25, 50, 75].map(p => (
          <div key={p} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.05]" style={{ top: `${p}%` }} />
        ))}
        <span className="pointer-events-none absolute -top-4 right-0 text-[10px] text-white/30">{fmt0(max)}</span>

        <div className="relative h-full flex items-end gap-1 sm:gap-2">
          {meses.map((m, i) => {
            const lado = i < 2 ? 'left-0' : i > meses.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
            const bal = m.receitas - m.despesas
            return (
              <div key={m.chave}
                className={`group relative flex-1 h-full flex items-end justify-center gap-[3px] ${m.futuro ? 'opacity-35' : ''}`}>
                <div className={`pointer-events-none absolute top-0 -translate-y-full ${lado} z-20 whitespace-nowrap rounded-xl border border-white/15 bg-[#00141f] px-3 py-2 text-[11.5px] opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1">{m.rotulo} {m.ano}</p>
                  <p className="text-white/60">Receitas <span className="text-white">{fmt(m.receitas)}</span></p>
                  <p className="text-white/60">Despesas <span className="text-white">{fmt(m.despesas)}</span></p>
                  <p className="mt-1 pt-1 border-t border-white/10 text-white/60">Balanço <span className={bal < 0 ? 'text-[#ff4747]' : 'text-[#5a8bff]'}>{fmt(bal)}</span></p>
                </div>
                <div className="w-1/2 max-w-[18px] h-full flex flex-col justify-end">
                  {m.receitas > 0 && <div className="w-full rounded-t-[3px] bg-[#2e6cf6] group-hover:bg-[#5a8bff] transition-all duration-700" style={{ height: alt(m.receitas) }} />}
                </div>
                <div className="w-1/2 max-w-[18px] h-full flex flex-col justify-end">
                  {m.despesas > 0 && <div className="w-full rounded-t-[3px] bg-white/35 group-hover:bg-white/50 transition-all duration-700" style={{ height: alt(m.despesas) }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1 sm:gap-2 border-t border-white/[0.08] pt-2">
        {meses.map(m => (
          <span key={m.chave}
            className={`flex-1 min-w-0 text-center text-[9.5px] sm:text-[10.5px] leading-tight ${m.atual ? 'text-[#5a8bff] font-medium' : m.futuro ? 'text-white/30' : 'text-white/50'}`}>
            {m.rotulo}
            {(m.rotulo === 'jan' || m.atual) && <span className="block text-[9px] text-white/30">{m.ano}</span>}
          </span>
        ))}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-2">
        {meses.map(m => {
          const bal = m.receitas - m.despesas
          return (
            <span key={m.chave}
              className={`flex-1 min-w-0 truncate text-center text-[8.5px] sm:text-[10px] tabular-nums ${m.futuro || (m.receitas === 0 && m.despesas === 0) ? 'text-white/20' : bal < 0 ? 'text-[#ff4747]' : 'text-[#5a8bff]'}`}>
              {m.receitas === 0 && m.despesas === 0 ? '0' : compacto(bal)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// 1250 → "1,3k" ; -300 → "−300"
function compacto(n: number) {
  const s = n < 0 ? '−' : '+'
  const a = Math.abs(n)
  if (a >= 1000) return s + (a / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) + 'k'
  return s + Math.round(a).toLocaleString('pt-PT')
}
