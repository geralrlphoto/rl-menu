'use client'

// Agenda dos próximos 30 dias no portal do membro (mesmo desenho da agenda do /photo):
// casamentos, pré-weddings, prazos (alertas) e dias indisponíveis.

import TempoChip from '@/app/photo/TempoChip'

export type AgendaCasamento = { id: string; iso: string; nome: string; local: string | null; confirmado: boolean }
export type AgendaPreWedding = { id: string; iso: string; nome: string; hora: string | null; local: string | null }
export type AgendaPrazo = { key: string; iso: string; acao: string; nome: string; dias: number; abrir: () => void }

const DIAS_SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_AGENDA = 30

export default function AgendaMembro({ casamentos, preWeddings, prazos, indisponiveis, abrirCasamento, abrirCalendario, verAtrasos }: {
  casamentos: AgendaCasamento[]
  preWeddings: AgendaPreWedding[]
  prazos: AgendaPrazo[]
  indisponiveis: Set<string>
  abrirCasamento: (id: string) => void
  abrirCalendario: () => void
  verAtrasos: () => void
}) {
  const hojeLx = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
  const dias = Array.from({ length: DIAS_AGENDA }).map((_, i) => {
    const d = new Date(hojeLx + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      iso,
      rotulo: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIAS_SEM[d.getUTCDay()],
      dia: d.getUTCDate(),
      mes: MESES[d.getUTCMonth()],
      fimDeSemana: d.getUTCDay() === 0 || d.getUTCDay() === 6,
      novoMes: i === 0 || d.getUTCDate() === 1,
      mesLongo: MESES_LONGOS[d.getUTCMonth()],
      casamentos: casamentos.filter(c => c.iso === iso),
      preWeddings: preWeddings.filter(p => p.iso === iso),
      prazos: prazos.filter(p => p.iso === iso),
      // Prazos já passados: um só cartão no "Hoje"
      atrasos: i === 0 ? prazos.filter(p => p.iso < iso) : [],
      indisponivel: indisponiveis.has(iso),
    }
  })
  const fim = dias[DIAS_AGENDA - 1].iso
  const total = (arr: Array<{ iso: string }>) => arr.filter(x => x.iso >= hojeLx && x.iso <= fim).length
  const nCasamentos = total(casamentos)
  const nPreWeddings = total(preWeddings)
  const nPrazos = prazos.filter(p => p.iso >= hojeLx && p.iso <= fim).length

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 mb-5">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Agenda</p>
          <h2 className="font-semibold text-white text-3xl sm:text-[34px] leading-tight mt-1">Próximos 30 dias</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1.5 text-[13px]">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
            {nCasamentos} casamento{nCasamentos !== 1 ? 's' : ''}
          </span>
          {nPreWeddings > 0 && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/70">
              {nPreWeddings} pré-wedding{nPreWeddings !== 1 ? 's' : ''}
            </span>
          )}
          {nPrazos > 0 && (
            <span className="rounded-full border px-3 py-1" style={{ borderColor: 'rgba(232,182,121,0.35)', background: 'rgba(232,182,121,0.08)', color: '#e8b679' }}>
              {nPrazos} prazo{nPrazos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 pb-1.5">
          <span className="hidden sm:inline text-[12px] text-white/30">desliza →</span>
          <button onClick={abrirCalendario} className="text-[13px] text-white/60 hover:text-[#C9A84C] transition-colors">
            Calendário →
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Esbatido na ponta direita: indica que há mais para a frente */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-16 z-10 bg-gradient-to-l from-[#0b0b0b] to-transparent" />

        <div className="agenda-scroll flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
          {dias.map((d, i) => {
            const cheio = d.casamentos.length > 0 || d.preWeddings.length > 0 || d.prazos.length > 0 || d.atrasos.length > 0
            return (
              <div key={d.iso} className="snap-start shrink-0 w-[150px] sm:w-[158px] flex flex-col">
                <p className="h-5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#C9A84C]/75 pl-1">
                  {d.novoMes ? d.mesLongo : ''}
                </p>
                <div
                  className="flex-1 rounded-[18px] border px-3 py-3 min-h-[124px] flex flex-col bg-[#141414]/90"
                  style={{
                    borderColor: i === 0 ? 'rgba(201,168,76,0.55)' : cheio ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                    borderLeft: `2px solid ${i === 0 ? '#C9A84C' : cheio ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: i === 0 ? '0 0 40px -18px rgba(201,168,76,0.6)' : undefined,
                  }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-medium"
                      style={{ color: i === 0 ? '#C9A84C' : d.fimDeSemana ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
                      {d.rotulo}
                    </span>
                    <span className="font-semibold text-[22px] leading-none" style={{ color: cheio ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                      {d.dia} <span className="text-[11px] font-normal text-white/35">{d.mes}</span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {/* Dia sem casamentos: tempo em Palmela (onde ficam quase todas as quintas) */}
                    {d.casamentos.length === 0 && <TempoChip local="Palmela" data={d.iso} rotulo="Palmela" vazio={!cheio && !d.indisponivel ? <span className="text-[10px] text-white/15">-</span> : null} />}
                    {d.indisponivel && (
                      <p className="rounded-lg px-2 py-1 border border-dashed text-[8px] tracking-[0.25em] uppercase"
                        style={{ borderColor: 'rgba(248,113,113,0.3)', color: 'rgba(248,113,113,0.75)' }}>
                        Indisponível
                      </p>
                    )}
                    {d.casamentos.map(c => (
                      <button key={c.id} onClick={() => abrirCasamento(c.id)}
                        className="group block w-full text-left rounded-lg px-2 py-1.5 bg-white/[0.03] hover:bg-[#C9A84C]/10 border border-white/[0.05] hover:border-[#C9A84C]/35 transition-all">
                        <p className="text-[11px] text-white/85 group-hover:text-white leading-tight truncate uppercase tracking-wide">{c.nome}</p>
                        {c.local && <p className="text-[9px] text-white/35 truncate mt-0.5">{c.local}</p>}
                        {!c.confirmado && <p className="text-[8px] tracking-[0.2em] uppercase mt-1" style={{ color: '#e8b679' }}>Por confirmar</p>}
                        <TempoChip local={c.local} data={c.iso} />
                      </button>
                    ))}
                    {/* Pré-weddings atribuídos: tracejado dourado */}
                    {d.preWeddings.map(p => (
                      <div key={p.id} className="rounded-lg px-2 py-1.5 border border-dashed"
                        style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.04)' }}>
                        <p className="text-[8px] tracking-[0.25em] uppercase" style={{ color: 'rgba(201,168,76,0.8)' }}>
                          Pré-wedding{p.hora ? ` ${p.hora}` : ''}
                        </p>
                        <p className="text-[11px] text-white/80 leading-tight truncate mt-0.5">{p.nome}</p>
                        {p.local && <p className="text-[9px] text-white/35 truncate mt-0.5">{p.local}</p>}
                      </div>
                    ))}
                    {/* Prazos já passados: um cartão vermelho que leva à lista Por fazer */}
                    {d.atrasos.length > 0 && (
                      <button onClick={verAtrasos}
                        className="group block w-full text-left rounded-lg px-2 py-1.5 border border-dashed transition-all hover:bg-white/[0.04]"
                        style={{ borderColor: 'rgba(240,161,150,0.45)', background: 'rgba(240,161,150,0.06)' }}>
                        <p className="text-[8px] tracking-[0.25em] uppercase" style={{ color: '#f0a196' }}>Em atraso</p>
                        <p className="text-[11px] text-white/85 group-hover:text-white leading-tight mt-0.5">
                          {d.atrasos.length} prazo{d.atrasos.length !== 1 ? 's' : ''} passado{d.atrasos.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[9px] text-white/35 mt-0.5">Ver em Por fazer ↓</p>
                      </button>
                    )}
                    {/* Prazos (alertas): âmbar tracejado */}
                    {d.prazos.map(p => (
                      <button key={p.key} onClick={p.abrir}
                        className="group block w-full text-left rounded-lg px-2 py-1.5 border border-dashed transition-all hover:bg-white/[0.04]"
                        style={{ borderColor: 'rgba(232,182,121,0.4)', background: 'rgba(232,182,121,0.05)' }}>
                        <p className="text-[8px] tracking-[0.25em] uppercase" style={{ color: '#e8b679' }}>Prazo</p>
                        <p className="text-[11px] text-white/85 group-hover:text-white leading-tight mt-0.5 line-clamp-2">{p.acao}</p>
                        <p className="text-[9px] text-white/35 truncate mt-0.5">{p.nome}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
