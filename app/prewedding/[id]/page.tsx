'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

/* Página pública (link do WhatsApp): os noivos escolhem o dia, a hora e o local
   sugerido da sessão pré-wedding, a partir da disponibilidade da RL.
   Mesmo layout da reunião de preparação (foto + calendário interativo). */

type Slot = { id: string; data: string; hora: string; local: string | null }
type Reserva = { data: string; hora: string; local: string | null }

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'
const HERO = '/prewedding-hero.webp' // foto do Guia Pré-Wedding do portal (casal ao pôr do sol)
const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const DURACAO_MIN = 120

const ymd = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
const dUTC = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const diaLongo = (iso: string) => cap(dUTC(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }))
const mesAno = (y: number, m: number) => cap(new Date(Date.UTC(y, m, 15)).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }))
const hojeLisboa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

function googleCalUrl(r: Reserva, nome: string) {
  const [h, m] = r.hora.split(':').map(Number)
  const ini = r.data.replace(/-/g, '') + 'T' + String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00'
  const fimMin = h * 60 + m + DURACAO_MIN
  const fim = r.data.replace(/-/g, '') + 'T' + String(Math.floor(fimMin / 60) % 24).padStart(2, '0') + String(fimMin % 60).padStart(2, '0') + '00'
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Sessão pré-wedding · RL PhotoVideo',
    dates: `${ini}/${fim}`,
    ctz: 'Europe/Lisbon',
    details: `Sessão pré-wedding com a RL PhotoVideo${nome ? ` (${nome})` : ''}.`,
    ...(r.local ? { location: r.local } : {}),
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default function PreWeddingPage() {
  const { id } = useParams<{ id: string }>()
  const [estado, setEstado] = useState<'carregar' | 'erro' | 'ok'>('carregar')
  const [nome, setNome] = useState('')
  const [dataEvento, setDataEvento] = useState<string | null>(null)
  const [expirado, setExpirado] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [dia, setDia] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [mes, setMes] = useState<{ y: number; m: number } | null>(null)
  const [aEnviar, setAEnviar] = useState(false)
  const [aviso, setAviso] = useState('')
  const [acabouDeMarcar, setAcabouDeMarcar] = useState(false)
  const [aAlterar, setAAlterar] = useState(false)

  const carregar = () => {
    fetch(`/api/prewedding-publico?e=${id}`).then(r => r.json()).then(d => {
      if (!d.ok) { setEstado('erro'); return }
      setNome(d.nome); setDataEvento(d.dataEvento); setExpirado(!!d.expirado); setSlots(d.slots ?? []); setReserva(d.reserva)
      const primeiro: string | undefined = d.slots?.[0]?.data
      const base = primeiro ?? hojeLisboa()
      setMes(prev => prev ?? { y: +base.slice(0, 4), m: +base.slice(5, 7) - 1 })
      setEstado('ok')
    }).catch(() => setEstado('erro'))
  }
  useEffect(carregar, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const diasComSlots = useMemo(() => new Set(slots.map(s => s.data)), [slots])
  const meses = useMemo(() => [...new Set(slots.map(s => s.data.slice(0, 7)))].sort(), [slots])
  const horas = slots.filter(s => s.data === dia)
  const escolhido = slots.find(s => s.id === slotId) ?? null
  const passo = escolhido ? 3 : dia ? 2 : 1
  const faltam = dataEvento ? Math.round((dUTC(dataEvento).getTime() - dUTC(hojeLisboa()).getTime()) / 86400000) : null

  const grelha = useMemo(() => {
    if (!mes) return []
    const desloc = (new Date(Date.UTC(mes.y, mes.m, 1, 12)).getUTCDay() + 6) % 7
    const nDias = new Date(Date.UTC(mes.y, mes.m + 1, 0, 12)).getUTCDate()
    const cel: (string | null)[] = Array(desloc).fill(null)
    for (let d = 1; d <= nDias; d++) cel.push(ymd(new Date(Date.UTC(mes.y, mes.m, d, 12))))
    while (cel.length % 7) cel.push(null)
    return cel
  }, [mes])
  const chaveMes = mes ? `${mes.y}-${String(mes.m + 1).padStart(2, '0')}` : ''
  const idxMes = meses.indexOf(chaveMes)
  const irMes = (delta: number) => { const alvo = meses[idxMes + delta]; if (alvo) setMes({ y: +alvo.slice(0, 4), m: +alvo.slice(5, 7) - 1 }) }

  async function confirmar() {
    if (!slotId) return
    setAEnviar(true); setAviso('')
    const d = await fetch('/api/prewedding-publico', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e: id, slotId, alterar: aAlterar }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação. Tentem de novo.' }))
    setAEnviar(false)
    if (d.ok) { setReserva(d.reserva); setAcabouDeMarcar(true); setAAlterar(false); setSlotId(null); setDia(null); carregar(); return }
    setAviso(d.error || 'Não foi possível marcar.')
    setSlotId(null); carregar()
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" />

      {/* ── Foto ── */}
      <section className="relative h-[46vh] min-h-[320px] lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 animate-[kenburns_18s_ease-out_forwards]" style={{ objectPosition: '42% 50%' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent lg:hidden" />
        <div className="relative h-full flex flex-col justify-end lg:justify-center px-6 sm:px-12 pb-10 lg:pb-0 max-w-xl">
          <p className="text-[10px] tracking-[0.5em] uppercase animate-[fadeUp_.7s_ease-out_both]" style={{ color: GOLD }}>RL PhotoVideo</p>
          <h1 className="text-[44px] sm:text-6xl xl:text-7xl font-light leading-[0.95] mt-4 animate-[fadeUp_.7s_.1s_ease-out_both]" style={{ ...SERIF, color: GOLD }}>
            Sessão<br />pré-wedding
          </h1>
          <div className="h-px mt-6 mb-5 origin-left animate-[linha_.9s_.35s_ease-out_both]" style={{ background: GOLD, width: 72 }} />
          <p className="text-white/80 text-lg sm:text-xl italic leading-relaxed animate-[fadeUp_.7s_.25s_ease-out_both]" style={SERIF}>
            {nome ? `${nome}, ` : ''}chegou a altura de criarmos juntos as vossas primeiras memórias antes do grande dia.
          </p>
          {faltam !== null && faltam > 0 && (
            <div className="mt-7 flex items-baseline gap-3 animate-[fadeUp_.7s_.4s_ease-out_both]">
              <span className="text-5xl font-light tabular-nums" style={{ ...SERIF, color: GOLD }}>{faltam}</span>
              <span className="text-[10px] tracking-[0.35em] uppercase text-white/55">{faltam === 1 ? 'dia' : 'dias'} para o grande dia</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Marcação ── */}
      <section className="relative px-5 sm:px-10 xl:px-16 py-10 lg:py-16">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0">
          {estado === 'carregar' && <div className="h-72 rounded-2xl bg-white/[0.03] animate-pulse" />}
          {estado === 'erro' && <p className="text-white/60 italic text-xl" style={SERIF}>Este link não é válido. Falem connosco pelo WhatsApp, por favor.</p>}

          {estado === 'ok' && expirado && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-20">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center text-2xl" style={{ borderColor: 'rgba(201,168,76,0.5)', color: GOLD }}>✦</div>
              <p className="text-3xl sm:text-4xl font-light mt-8 leading-tight" style={SERIF}>{reserva ? 'A vossa sessão já aconteceu' : 'Este link já não está ativo'}</p>
              <p className="text-white/50 text-sm mt-5">Obrigado{nome ? `, ${nome}` : ''}! Qualquer alteração, falem connosco pelo WhatsApp.</p>
            </div>
          )}

          {/* ── Confirmado ── */}
          {estado === 'ok' && !expirado && reserva && !aAlterar && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-16">
              <div className="relative w-24 h-24">
                {acabouDeMarcar && Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full animate-[faisca_1.1s_ease-out_forwards]"
                    style={{ background: GOLD, ['--a' as any]: `${(360 / 14) * i}deg`, animationDelay: `${(i % 3) * 60}ms` }} />
                ))}
                <svg viewBox="0 0 96 96" className="w-24 h-24">
                  <circle cx="48" cy="48" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="277" strokeDashoffset="277" className="animate-[desenha_.8s_ease-out_forwards]" />
                  <path d="M30 49 l12 12 l24 -26" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60" className="animate-[desenha_.5s_.6s_ease-out_forwards]" />
                </svg>
              </div>
              <p className="text-white/60 italic text-xl mt-8" style={SERIF}>{nome ? `${nome}, está` : 'Está'} marcada!</p>
              <p className="text-4xl sm:text-5xl font-light mt-3 leading-tight" style={SERIF}>{diaLongo(reserva.data)}</p>
              <p className="mt-3 text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>{reserva.hora} · Sessão pré-wedding</p>
              {reserva.local && (
                <a href={mapsUrl(reserva.local)} target="_blank" rel="noopener noreferrer"
                  className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center gap-4 text-left hover:border-[#C9A84C]/50 transition-colors">
                  <span className="shrink-0 w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(201,168,76,0.4)', color: GOLD }}>⌖</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-[0.3em] uppercase text-white/40">Local</span>
                    <span className="block text-sm text-white/85 leading-snug mt-0.5">{reserva.local}</span>
                  </span>
                </a>
              )}
              <p className="text-white/45 text-sm mt-8 leading-relaxed max-w-sm">
                Vistam-se a vosso gosto e tragam a vossa energia. Nós tratamos do resto. Se precisarem de mudar alguma coisa, é só dizerem-nos pelo WhatsApp.
              </p>
              <a href={googleCalUrl(reserva, nome)} target="_blank" rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[11px] tracking-[0.25em] uppercase transition-all hover:bg-[#C9A84C] hover:text-black"
                style={{ borderColor: GOLD, color: GOLD }}>
                + Adicionar ao calendário
              </a>
              <button onClick={() => { setAAlterar(true); setAcabouDeMarcar(false); setAviso('') }}
                className="mt-4 text-[11px] tracking-[0.25em] uppercase text-white/45 hover:text-[#C9A84C] underline underline-offset-4 decoration-white/20 transition-colors">
                Alterar data da sessão
              </button>
            </div>
          )}

          {/* ── Escolher ── */}
          {estado === 'ok' && !expirado && (!reserva || aAlterar) && (
            <>
              {reserva && aAlterar && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Marcada atualmente</p>
                    <p className="text-xl font-light mt-0.5 truncate" style={SERIF}>{diaLongo(reserva.data)} · {reserva.hora}</p>
                  </div>
                  <button onClick={() => { setAAlterar(false); setSlotId(null); setDia(null) }} className="shrink-0 text-[10px] tracking-[0.25em] uppercase text-white/45 hover:text-[#C9A84C]">Manter</button>
                </div>
              )}

              {/* Progresso */}
              <div className="flex items-center gap-3 mb-8">
                {['O dia', 'A hora e o local', 'Confirmar'].map((t, i) => {
                  const n = i + 1; const feito = passo > n; const ativo = passo === n
                  return (
                    <div key={t} className="flex items-center gap-3 flex-1 last:flex-none">
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="w-6 h-6 rounded-full text-[11px] flex items-center justify-center border transition-all duration-300"
                          style={{ borderColor: ativo || feito ? GOLD : 'rgba(255,255,255,0.15)', background: feito ? GOLD : 'transparent', color: feito ? '#000' : ativo ? GOLD : 'rgba(255,255,255,0.35)' }}>{feito ? '✓' : n}</span>
                        <span className={`text-[10px] tracking-[0.25em] uppercase hidden sm:inline ${ativo ? 'text-white' : 'text-white/35'}`}>{t}</span>
                      </span>
                      {n < 3 && <span className="h-px flex-1 transition-colors duration-500" style={{ background: feito ? GOLD : 'rgba(255,255,255,0.1)' }} />}
                    </div>
                  )
                })}
              </div>

              {aviso && <p className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{aviso}</p>}

              {slots.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                  <p className="text-2xl font-light" style={SERIF}>Sem horários de momento</p>
                  <p className="text-white/45 text-sm mt-3">Respondam-nos pelo WhatsApp e combinamos juntos o melhor dia.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => irMes(-1)} disabled={idxMes <= 0} aria-label="Mês anterior"
                        className="w-9 h-9 rounded-full border border-white/10 text-white/60 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-20 transition-colors">‹</button>
                      <span className="text-2xl font-light" style={SERIF}>{mes ? mesAno(mes.y, mes.m) : ''}</span>
                      <button onClick={() => irMes(1)} disabled={idxMes === -1 || idxMes >= meses.length - 1} aria-label="Mês seguinte"
                        className="w-9 h-9 rounded-full border border-white/10 text-white/60 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-20 transition-colors">›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                      {SEMANA.map((s, i) => <span key={i} className="text-[10px] tracking-[0.2em] text-white/30 pb-2">{s}</span>)}
                      {grelha.map((iso, i) => {
                        if (!iso) return <span key={i} />
                        const tem = diasComSlots.has(iso); const sel = iso === dia; const casamento = iso === dataEvento
                        return (
                          <button key={iso} disabled={!tem} onClick={() => { setDia(iso); setSlotId(null) }}
                            className={`relative aspect-square rounded-xl text-base sm:text-lg tabular-nums transition-all duration-200 ${tem ? 'hover:scale-105' : 'cursor-default'}`}
                            style={{ ...SERIF, background: sel ? GOLD : tem ? 'rgba(201,168,76,0.08)' : 'transparent', color: sel ? '#000' : tem ? '#fff' : casamento ? GOLD : 'rgba(255,255,255,0.18)', border: `1px solid ${sel ? GOLD : tem ? 'rgba(201,168,76,0.35)' : casamento ? 'rgba(201,168,76,0.4)' : 'transparent'}`, boxShadow: sel ? '0 0 24px rgba(201,168,76,0.35)' : undefined }}
                            title={casamento ? 'O vosso casamento' : undefined}>
                            {+iso.slice(8)}
                            {tem && !sel && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: GOLD }} />}
                            {casamento && <span className="absolute -top-1 -right-1 text-[10px]" style={{ color: GOLD }}>♥</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Hora e local */}
                  <div className={`transition-all duration-500 ${dia ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <p className="mt-8 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/40">{dia ? diaLongo(dia) : 'Escolham primeiro o dia'}</p>
                    <div key={dia ?? 'nenhum'} className="flex flex-col gap-2">
                      {horas.map((s, i) => {
                        const ativo = s.id === slotId
                        return (
                          <button key={s.id} onClick={() => setSlotId(s.id)}
                            className="rounded-xl border px-4 py-3.5 flex items-center gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 animate-[fadeUp_.35s_ease-out_both]"
                            style={{ animationDelay: `${i * 45}ms`, borderColor: ativo ? GOLD : 'rgba(255,255,255,0.1)', background: ativo ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)' }}>
                            <span className="text-2xl tabular-nums w-16 shrink-0" style={{ ...SERIF, color: ativo ? GOLD : '#fff' }}>{s.hora}</span>
                            <span className="min-w-0">
                              <span className="block text-[10px] tracking-[0.3em] uppercase text-white/35">Local sugerido</span>
                              <span className="block text-sm text-white/80 truncate">{s.local || 'A combinar'}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className={`mt-8 rounded-2xl border p-5 transition-all duration-500 ${escolhido ? 'border-[#C9A84C]/50 bg-[#C9A84C]/[0.06]' : 'border-white/[0.06]'}`}>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Sessão pré-wedding · cerca de 2 horas</p>
                    <p className="text-2xl font-light mt-1" style={SERIF}>{escolhido ? `${diaLongo(escolhido.data)} · ${escolhido.hora}` : 'Escolham um horário'}</p>
                    {escolhido?.local && <p className="text-white/50 text-sm mt-1">{escolhido.local}</p>}
                    <button onClick={confirmar} disabled={!escolhido || aEnviar}
                      className="relative overflow-hidden mt-5 w-full rounded-xl py-4 text-[12px] font-semibold tracking-[0.3em] uppercase transition-all disabled:opacity-25 enabled:hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
                      style={{ background: GOLD, color: '#000' }}>
                      {escolhido && !aEnviar && <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 skew-x-[-20deg] animate-[brilho_2.4s_ease-in-out_infinite]" />}
                      <span className="relative">{aEnviar ? 'A marcar…' : aAlterar ? 'Confirmar nova data' : 'Confirmar sessão'}</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes linha { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes kenburns { from { transform: scale(1.12) } to { transform: scale(1.02) } }
        @keyframes desenha { to { stroke-dashoffset: 0 } }
        @keyframes brilho { 0% { left: -40% } 60%, 100% { left: 130% } }
        @keyframes faisca {
          0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0); opacity: 1 }
          100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(-70px); opacity: 0 }
        }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-delay: 0ms !important } }
      `}</style>
    </main>
  )
}
