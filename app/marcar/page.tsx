'use client'

import { useEffect, useMemo, useState } from 'react'

/* Página pública para marcar uma reunião com a RL quem não é noivo.
   Mesma disponibilidade e mesmo layout da reunião de preparação (/preparacao/<id>):
   foto + gradiente à esquerda, calendário à direita. Pede nome, contacto e assunto. */

type Slot = { id: string; data: string; hora: string }
type Reserva = { data: string; hora: string }

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'
// Foto 18 do portfólio Wfolio (servida pelo i.wfolio.com)
const HERO = 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqqXF-nkolK8KtGIG1Vea6I/nXJ4oTdrFWyFGuaG9KwDZvaU4wvQ0aQs/vHlNvjfYk_wxmkEUhSxqJZLGmPs5B-Ed/1Akl-ZG4LTSL3SzpaBY_5Qzt33q2Iq_L/pHSH1J526lkSCzGjCQ2e3EKnEE3-V2YJ/t51aG5gvFKOyYgjiz0uN96WFhJKJcbhL/VFxbmRXwibit9ttQN81Y06bhw4N6jeBA/ZR3fm62-taLTPDnGaex0aT113BBIGCSB/XbGKUHAHYevjxoiAB4vCHjj0RotPke4E/i_9JDb8cICRgFpgA9aLRi3ov0RLapw34/8Yd7kARjJZ0.jpg'
const SEMANA = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

const ymd = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
const dUTC = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const diaLongo = (iso: string) => cap(dUTC(iso).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }))
const mesAno = (y: number, m: number) => cap(new Date(Date.UTC(y, m, 15)).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric', timeZone: 'UTC' }))

const CAMPO = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C] transition-colors'

export default function MarcarPage() {
  const [estado, setEstado] = useState<'carregar' | 'erro' | 'ok'>('carregar')
  const [slots, setSlots] = useState<Slot[]>([])
  const [dia, setDia] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [mes, setMes] = useState<{ y: number; m: number } | null>(null)
  const [nome, setNome] = useState('')
  const [contacto, setContacto] = useState('')
  const [assunto, setAssunto] = useState('')
  const [site, setSite] = useState('') // campo escondido contra robôs
  const [aEnviar, setAEnviar] = useState(false)
  const [aviso, setAviso] = useState('')
  const [reserva, setReserva] = useState<Reserva | null>(null)

  const carregar = () => {
    fetch('/api/marcar').then(r => r.json()).then(d => {
      if (!d.ok) { setEstado('erro'); return }
      setSlots(d.slots ?? [])
      const primeiro: string | undefined = d.slots?.[0]?.data
      if (primeiro) setMes(prev => prev ?? { y: +primeiro.slice(0, 4), m: +primeiro.slice(5, 7) - 1 })
      setEstado('ok')
    }).catch(() => setEstado('erro'))
  }
  useEffect(carregar, [])

  const diasComSlots = useMemo(() => new Set(slots.map(s => s.data)), [slots])
  const meses = useMemo(() => [...new Set(slots.map(s => s.data.slice(0, 7)))].sort(), [slots])
  const horas = slots.filter(s => s.data === dia)
  const escolhido = slots.find(s => s.id === slotId) ?? null
  const completo = !!escolhido && !!nome.trim() && !!contacto.trim() && !!assunto.trim()

  const grelha = useMemo(() => {
    if (!mes) return []
    const primeiro = new Date(Date.UTC(mes.y, mes.m, 1, 12))
    const desloc = (primeiro.getUTCDay() + 6) % 7
    const nDias = new Date(Date.UTC(mes.y, mes.m + 1, 0, 12)).getUTCDate()
    const cel: (string | null)[] = Array(desloc).fill(null)
    for (let d = 1; d <= nDias; d++) cel.push(ymd(new Date(Date.UTC(mes.y, mes.m, d, 12))))
    while (cel.length % 7) cel.push(null)
    return cel
  }, [mes])

  const chaveMes = mes ? `${mes.y}-${String(mes.m + 1).padStart(2, '0')}` : ''
  const idxMes = meses.indexOf(chaveMes)
  const irMes = (delta: number) => {
    const alvo = meses[idxMes + delta]
    if (alvo) setMes({ y: +alvo.slice(0, 4), m: +alvo.slice(5, 7) - 1 })
  }

  async function confirmar() {
    if (!completo) return
    setAEnviar(true); setAviso('')
    const d = await fetch('/api/marcar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, nome, contacto, assunto, site }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação. Tente de novo.' }))
    setAEnviar(false)
    if (d.ok) { setReserva(d.reserva ?? escolhido); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setAviso(d.error || 'Não foi possível marcar.')
    setSlotId(null); carregar()
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <link rel="stylesheet" precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" />
      {/* ── Foto (fixa no desktop) ── */}
      <section className="relative h-[40vh] min-h-[300px] lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 animate-[kenburns_18s_ease-out_forwards]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent lg:hidden" />
        <div className="relative h-full flex flex-col justify-end lg:justify-center px-6 sm:px-12 pb-10 lg:pb-0 max-w-xl">
          <p className="text-[10px] tracking-[0.5em] uppercase animate-[fadeUp_.7s_ease-out_both]" style={{ color: GOLD }}>RL PhotoVideo</p>
          <h1 className="text-[44px] sm:text-6xl xl:text-7xl font-light leading-[0.95] mt-4 animate-[fadeUp_.7s_.1s_ease-out_both]" style={{ ...SERIF, color: GOLD }}>
            Marcar<br />reunião
          </h1>
          <div className="h-px mt-6 mb-5 origin-left animate-[linha_.9s_.35s_ease-out_both]" style={{ background: GOLD, width: 72 }} />
          <p className="text-white/80 text-lg sm:text-xl italic leading-relaxed animate-[fadeUp_.7s_.25s_ease-out_both]" style={SERIF}>
            Escolha o dia e a hora que lhe dão mais jeito. Falamos por videochamada.
          </p>
        </div>
      </section>

      {/* ── Marcação ── */}
      <section className="relative px-5 sm:px-10 xl:px-16 py-10 lg:py-16 flex flex-col">
        <div className="w-full max-w-[560px] mx-auto lg:mx-0">
          {estado === 'carregar' && (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-4 w-40 rounded bg-white/5" /><div className="h-72 rounded-2xl bg-white/[0.03]" />
            </div>
          )}
          {estado === 'erro' && (
            <p className="text-white/60 italic text-xl" style={SERIF}>Não foi possível carregar os horários. Tente de novo daqui a pouco.</p>
          )}

          {/* ── Confirmado ── */}
          {estado === 'ok' && reserva && (
            <div className="flex flex-col items-center text-center pt-4 lg:pt-16">
              <svg viewBox="0 0 96 96" className="w-24 h-24">
                <circle cx="48" cy="48" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="277" strokeDashoffset="277" className="animate-[desenha_.8s_ease-out_forwards]" />
                <path d="M30 49 l12 12 l24 -26" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="60" className="animate-[desenha_.5s_.6s_ease-out_forwards]" />
              </svg>
              <p className="text-white/60 italic text-xl mt-8" style={SERIF}>{nome.trim() ? `${nome.trim().split(' ')[0]}, está` : 'Está'} marcado!</p>
              <p className="text-4xl sm:text-5xl font-light mt-3 leading-tight" style={SERIF}>{diaLongo(reserva.data)}</p>
              <p className="mt-3 text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>{reserva.hora} · Videochamada</p>
              <p className="text-white/45 text-sm mt-8 leading-relaxed max-w-sm">
                Vamos enviar-lhe o link da videochamada para o contacto que indicou. Até breve!
              </p>
            </div>
          )}

          {/* ── Escolher ── */}
          {estado === 'ok' && !reserva && (
            slots.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-2xl font-light" style={SERIF}>Sem horários de momento</p>
                <p className="text-white/45 text-sm mt-3">Volte a espreitar daqui a uns dias ou fale connosco pelo geral.rlphoto@gmail.com.</p>
              </div>
            ) : (
              <>
                {aviso && <p className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{aviso}</p>}

                {/* Calendário */}
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
                      const tem = diasComSlots.has(iso)
                      const sel = iso === dia
                      return (
                        <button key={iso} disabled={!tem} onClick={() => { setDia(iso); setSlotId(null) }}
                          className={`relative aspect-square rounded-xl text-base sm:text-lg tabular-nums transition-all duration-200 ${tem ? 'hover:scale-105' : 'cursor-default'}`}
                          style={{
                            ...SERIF,
                            background: sel ? GOLD : tem ? 'rgba(201,168,76,0.08)' : 'transparent',
                            color: sel ? '#000' : tem ? '#fff' : 'rgba(255,255,255,0.18)',
                            border: `1px solid ${sel ? GOLD : tem ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
                          }}>
                          {+iso.slice(8)}
                          {tem && !sel && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: GOLD }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Horas */}
                <div className={`transition-all duration-500 ${dia ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <p className="mt-8 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/40">{dia ? diaLongo(dia) : 'Escolha primeiro o dia'}</p>
                  <div key={dia ?? 'nenhum'} className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {horas.map((s, i) => {
                      const ativo = s.id === slotId
                      return (
                        <button key={s.id} onClick={() => setSlotId(s.id)}
                          className="rounded-xl border py-3.5 text-xl tabular-nums transition-all duration-200 hover:-translate-y-0.5 animate-[fadeUp_.35s_ease-out_both]"
                          style={{ ...SERIF, animationDelay: `${i * 45}ms`, borderColor: ativo ? GOLD : 'rgba(255,255,255,0.1)', background: ativo ? GOLD : 'rgba(255,255,255,0.02)', color: ativo ? '#000' : 'rgba(255,255,255,0.9)' }}>
                          {s.hora}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dados + confirmar */}
                <div className={`mt-8 rounded-2xl border p-5 transition-all duration-500 ${escolhido ? 'border-[#C9A84C]/50 bg-[#C9A84C]/[0.06]' : 'border-white/[0.06]'}`}>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">Videochamada</p>
                  <p className="text-2xl font-light mt-1 truncate" style={SERIF}>
                    {escolhido ? `${diaLongo(escolhido.data)} · ${escolhido.hora}` : 'Escolha um horário'}
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <input value={nome} onChange={e => setNome(e.target.value.slice(0, 120))} placeholder="Nome" autoComplete="name" className={CAMPO} />
                    <input value={contacto} onChange={e => setContacto(e.target.value.slice(0, 160))} placeholder="Email ou telefone" autoComplete="email" className={CAMPO} />
                    <textarea value={assunto} onChange={e => setAssunto(e.target.value.slice(0, 1000))} rows={3}
                      placeholder="Sobre o que quer falar?" className={`${CAMPO} resize-none`} />
                    <input value={site} onChange={e => setSite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
                      className="absolute -left-[9999px] w-px h-px opacity-0" />
                  </div>
                  <button onClick={confirmar} disabled={!completo || aEnviar}
                    className="mt-5 w-full rounded-xl py-4 text-[12px] font-semibold tracking-[0.3em] uppercase transition-all disabled:opacity-25 enabled:hover:shadow-[0_0_30px_rgba(201,168,76,0.35)]"
                    style={{ background: GOLD, color: '#000' }}>
                    {aEnviar ? 'A marcar…' : 'Confirmar reunião'}
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </section>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        @keyframes linha { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes kenburns { from { transform: scale(1.12) } to { transform: scale(1.02) } }
        @keyframes desenha { to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-delay: 0ms !important } }
      `}</style>
    </main>
  )
}
