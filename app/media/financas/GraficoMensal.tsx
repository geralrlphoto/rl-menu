'use client'

// Gráfico mensal da RL PROD: recebido (com o que falta receber por cima) vs despesas.
// Só divs, sem bibliotecas. Os meses fora do período escolhido ficam esbatidos.

export type MesGrafico = {
  chave: string
  rotulo: string
  ano: number
  recebido: number
  porReceber: number
  atraso: number
  despesas: number
  atual: boolean
  futuro: boolean
  noPeriodo: boolean
}

export default function GraficoMensal({ meses, fmt }: { meses: MesGrafico[]; fmt: (n: number) => string }) {
  const max = Math.max(1, ...meses.map(m => Math.max(m.recebido + m.porReceber + m.atraso, m.despesas)))
  const alt = (v: number) => (v > 0 ? `${Math.max(2, (v / max) * 100)}%` : '0%')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5 text-[11px] text-white/50">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2e6cf6]" />Recebido</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#5a8bff] bg-[#5a8bff]/10" />Por receber</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-[#ff4747]/80 bg-[#ff4747]/15" />Em atraso</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#a9c1ff]/45" />Despesas</span>
      </div>

      <div className="relative h-[190px]">
        {/* linhas de referência */}
        {[0, 25, 50, 75].map(p => (
          <div key={p} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.05]" style={{ top: `${p}%` }} />
        ))}
        <span className="pointer-events-none absolute -top-4 right-0 text-[10px] text-white/30">{fmt(max)}</span>

        <div className="relative h-full flex items-end gap-1 sm:gap-2">
          {meses.map((m, i) => {
            const lado = i < 2 ? 'left-0' : i > meses.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
            return (
              <div key={m.chave}
                className={`group relative flex-1 h-full flex items-end justify-center gap-[3px] transition-opacity ${m.noPeriodo ? '' : 'opacity-35 hover:opacity-80'}`}>
                {/* tooltip */}
                <div className={`pointer-events-none absolute top-0 -translate-y-full ${lado} z-20 whitespace-nowrap rounded-xl border border-white/15 bg-[#00141f] px-3 py-2 text-[11.5px] opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1">{m.rotulo} {m.ano}</p>
                  <p className="text-white/80">Recebido <span className="text-white">{fmt(m.recebido)}</span></p>
                  {m.porReceber > 0 && <p className="text-white/60">Por receber <span className="text-[#a9c1ff]">{fmt(m.porReceber)}</span></p>}
                  {m.atraso > 0 && <p className="text-[#ff4747]">Em atraso {fmt(m.atraso)}</p>}
                  <p className="text-white/60">Despesas <span className="text-[#a9c1ff]">{fmt(m.despesas)}</span></p>
                  {!m.futuro && <p className="mt-1 pt-1 border-t border-white/10 text-white/60">Saldo <span className={m.recebido - m.despesas < 0 ? 'text-[#ff4747]' : 'text-white'}>{fmt(m.recebido - m.despesas)}</span></p>}
                </div>

                {/* receita: recebido + por receber + atraso */}
                <div className="w-1/2 max-w-[16px] h-full flex flex-col justify-end">
                  {m.atraso > 0 && <div className="w-full rounded-t-[3px] border border-[#ff4747]/70 bg-[#ff4747]/15 transition-all duration-700" style={{ height: alt(m.atraso) }} />}
                  {m.porReceber > 0 && <div className="w-full rounded-t-[3px] border border-dashed border-[#5a8bff]/70 bg-[#5a8bff]/10 transition-all duration-700" style={{ height: alt(m.porReceber) }} />}
                  {m.recebido > 0 && <div className="w-full rounded-t-[3px] bg-[#2e6cf6] transition-all duration-700" style={{ height: alt(m.recebido) }} />}
                </div>
                {/* despesas */}
                <div className="w-1/2 max-w-[16px] h-full flex flex-col justify-end">
                  {m.despesas > 0 && <div className="w-full rounded-t-[3px] bg-[#a9c1ff]/45 transition-all duration-700" style={{ height: alt(m.despesas) }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1 sm:gap-2 border-t border-white/[0.08] pt-2">
        {meses.map(m => (
          <span key={m.chave}
            className={`flex-1 text-center text-[9.5px] sm:text-[10.5px] leading-tight ${m.atual ? 'text-[#5a8bff] font-medium' : m.futuro ? 'text-white/30' : 'text-white/50'}`}>
            {m.rotulo}
            {(m.rotulo === 'jan' || m.atual) && <span className="block text-[9px] text-white/30">{m.ano}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
