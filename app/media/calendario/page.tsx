import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { FUNDO, FUNDO_TAMANHO, COR } from '@/app/media/_lib/estilo'
import { lerFontesMedia, montarEventos, chaveDia, hojeLisboa, TIPOS, type EventoMedia } from '@/app/media/_lib/eventos'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACCENT = '#5a8bff'
const AZUL = '#2e6cf6'
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Calendário do ano da RL PROD: os 12 meses, com os eventos de cada dia e a lista do mês
export default async function CalendarioMedia({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  const hoje = hojeLisboa()
  const { ano: anoParam } = await searchParams
  const ano = Number(anoParam) || hoje.getFullYear()

  const { portais, leads } = await lerFontesMedia(supabase)
  const eventos = montarEventos(portais, leads).filter(e => e.dia.startsWith(`${ano}-`))
  const porDia = new Map<string, EventoMedia[]>()
  for (const e of eventos) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e])
  const chaveHoje = chaveDia(hoje)

  return (
    <main className={`rlp min-h-screen text-white relative overflow-hidden`}>
      {/* ── Fundo do rlprod.pt: azul-marinho, brilho azul e grelha fina ── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO, backgroundSize: FUNDO_TAMANHO }} />

      <section className="relative z-10 px-4 pt-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ Voltar</Link>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rlp-m traco text-[10px] text-[#5a8bff]">Calendário RL Prod</p>
              <h1 className="mt-1 text-[40px] sm:text-[52px] rlp-t  leading-none">
                <span style={{ color: ACCENT }}>{ano}</span>
              </h1>
              <p className="mt-2 text-[13px] text-white/45">
                {eventos.length === 0 ? 'Nenhum evento neste ano' : eventos.length === 1 ? '1 evento' : `${eventos.length} eventos`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <Link href={`/media/calendario?ano=${ano - 1}`}
                  className="rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-white/70 hover:text-white hover:border-white/30">‹ {ano - 1}</Link>
                {ano !== hoje.getFullYear() && (
                  <Link href="/media/calendario"
                    className="rounded-full border px-4 py-1.5 text-[12.5px]" style={{ borderColor: `${ACCENT}80`, color: ACCENT }}>Este ano</Link>
                )}
                <Link href={`/media/calendario?ano=${ano + 1}`}
                  className="rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-white/70 hover:text-white hover:border-white/30">{ano + 1} ›</Link>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.values(TIPOS).map(t => (
                  <span key={t.nome} className="flex items-center gap-1.5 text-[11px] text-white/55">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.cor }} />{t.nome}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MESES.map((nomeMes, m) => {
              const nDias = new Date(ano, m + 1, 0).getDate()
              const vazios = (new Date(ano, m, 1).getDay() + 6) % 7
              const doMes = eventos.filter(e => +e.dia.slice(5, 7) === m + 1)
              const mesAtual = ano === hoje.getFullYear() && m === hoje.getMonth()
              return (
                <div key={m}
                  className={`rounded-2xl border bg-[#0c2236]/80 p-4 ${mesAtual ? 'border-[#2e6cf6]/60' : 'border-white/[0.08]'}`}>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-[15px] font-medium">{nomeMes}</h2>
                    <span className="text-[11px] text-white/35">{doMes.length || ''}</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] text-white/30 mb-1">
                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: vazios }, (_, i) => <span key={`v${i}`} />)}
                    {Array.from({ length: nDias }, (_, i) => {
                      const chave = `${ano}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                      const evs = porDia.get(chave) ?? []
                      const eHoje = chave === chaveHoje
                      return (
                        <div key={i} title={evs.map(e => `${TIPOS[e.tipo].nome}: ${e.titulo}`).join('\n') || undefined}
                          className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-[11px]
                            ${eHoje ? 'text-white font-semibold' : evs.length ? 'text-white bg-white/[0.06]' : 'text-white/45'}`}
                          style={eHoje ? { background: AZUL } : undefined}>
                          {i + 1}
                          {evs.length > 0 && (
                            <span className="flex gap-[2px]">
                              {evs.slice(0, 3).map((e, j) => <span key={j} className="w-1 h-1 rounded-full" style={{ background: TIPOS[e.tipo].cor }} />)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {doMes.length > 0 && (
                    <ul className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                      {doMes.map((e, i) => (
                        <li key={i}>
                          <Link href={e.href} className="flex items-center gap-2 text-[11.5px] text-white/70 hover:text-white">
                            <span className="w-7 shrink-0 text-white/40">{+e.dia.slice(8, 10)}</span>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TIPOS[e.tipo].cor }} />
                            <span className="truncate">{TIPOS[e.tipo].nome} · {e.titulo}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
