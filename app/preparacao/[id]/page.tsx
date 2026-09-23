'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

/* Página pública (link do WhatsApp): os noivos escolhem o dia e a hora da
   reunião de preparação do casamento a partir da disponibilidade da RL. */

type Slot = { id: string; data: string; hora: string }
type Reserva = { data: string; hora: string; formato: string }

const SERIF = { fontFamily: "'Cormorant Garamond', serif" }
const GOLD = '#C9A84C'

function diaLongo(iso: string) {
  const t = new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function partes(iso: string) {
  const d = new Date(iso + 'T12:00:00Z')
  return {
    semana: d.toLocaleDateString('pt-PT', { weekday: 'short', timeZone: 'UTC' }).replace('.', '').slice(0, 3),
    dia: d.getUTCDate(),
    mes: d.toLocaleDateString('pt-PT', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
  }
}

export default function PreparacaoPage() {
  const { id } = useParams<{ id: string }>()
  const [estado, setEstado] = useState<'carregar' | 'erro' | 'ok'>('carregar')
  const [nome, setNome] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [dia, setDia] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [formato, setFormato] = useState<'Presencial' | 'Videochamada'>('Videochamada')
  const [aEnviar, setAEnviar] = useState(false)
  const [aviso, setAviso] = useState('')

  const carregar = () => {
    fetch(`/api/preparacao-publico?e=${id}`).then(r => r.json()).then(d => {
      if (!d.ok) { setEstado('erro'); return }
      setNome(d.nome); setSlots(d.slots ?? []); setReserva(d.reserva)
      setDia(prev => prev && (d.slots ?? []).some((s: Slot) => s.data === prev) ? prev : (d.slots?.[0]?.data ?? null))
      setEstado('ok')
    }).catch(() => setEstado('erro'))
  }
  useEffect(carregar, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dias = useMemo(() => [...new Set(slots.map(s => s.data))], [slots])
  const horas = slots.filter(s => s.data === dia)
  const escolhido = slots.find(s => s.id === slotId)

  async function confirmar() {
    if (!slotId) return
    setAEnviar(true); setAviso('')
    const d = await fetch('/api/preparacao-publico', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e: id, slotId, formato }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação. Tentem de novo.' }))
    setAEnviar(false)
    if (d.ok) { setReserva(d.reserva); return }
    setAviso(d.error || 'Não foi possível marcar.')
    setSlotId(null); carregar()
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-[640px]">
        <p className="text-[10px] tracking-[0.45em] uppercase text-center" style={{ color: GOLD }}>RL PhotoVideo</p>
        <h1 className="text-4xl sm:text-6xl font-light text-center mt-4 leading-tight" style={{ ...SERIF, color: GOLD }}>
          Reunião de preparação
        </h1>
        <div className="w-16 h-px mx-auto my-6" style={{ background: GOLD }} />

        {estado === 'carregar' && <p className="text-center text-white/40 text-sm">A carregar…</p>}
        {estado === 'erro' && (
          <p className="text-center text-white/60 italic text-lg" style={SERIF}>Este link não é válido. Falem connosco pelo WhatsApp, por favor.</p>
        )}

        {estado === 'ok' && reserva && (
          <div className="text-center animate-[fadeUp_.5s_ease-out]">
            <div className="mx-auto w-14 h-14 rounded-full border flex items-center justify-center text-2xl" style={{ borderColor: GOLD, color: GOLD }}>✓</div>
            <p className="text-white/70 italic text-xl mt-6" style={SERIF}>{nome ? `${nome}, está` : 'Está'} marcado!</p>
            <p className="text-3xl sm:text-4xl font-light mt-3" style={SERIF}>{diaLongo(reserva.data)}</p>
            <p className="text-white/80 mt-2 tracking-[0.2em] uppercase text-sm">às {reserva.hora} · {reserva.formato}</p>
            <p className="text-white/45 text-sm mt-8 leading-relaxed max-w-md mx-auto">
              Vamos falar sobre os horários do vosso dia, partilhar algumas dicas e sugestões e ajustar os últimos detalhes.
              Se precisarem de mudar alguma coisa, é só dizerem-nos pelo WhatsApp.
            </p>
          </div>
        )}

        {estado === 'ok' && !reserva && (
          <>
            <p className="text-center text-white/70 italic text-lg sm:text-xl leading-relaxed" style={SERIF}>
              {nome ? `Olá ${nome}! ` : ''}Escolham o dia e a hora que vos dá mais jeito para conversarmos sobre o vosso dia.
            </p>

            {aviso && <p className="mt-6 text-center text-sm text-amber-300/90">{aviso}</p>}

            {dias.length === 0 ? (
              <p className="mt-10 text-center text-white/50 text-sm">De momento não temos horários disponíveis. Respondam-nos pelo WhatsApp e combinamos juntos.</p>
            ) : (
              <>
                {/* Dias */}
                <p className="mt-10 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/35">1 · O dia</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {dias.map(d => {
                    const p = partes(d); const ativo = d === dia
                    return (
                      <button key={d} onClick={() => { setDia(d); setSlotId(null) }}
                        className="snap-start shrink-0 w-[76px] rounded-xl border py-3 flex flex-col items-center transition-all"
                        style={{ borderColor: ativo ? GOLD : 'rgba(255,255,255,0.1)', background: ativo ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)' }}>
                        <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: ativo ? GOLD : 'rgba(255,255,255,0.4)' }}>{p.semana}</span>
                        <span className="text-3xl font-light leading-none mt-1" style={SERIF}>{p.dia}</span>
                        <span className="text-[10px] uppercase text-white/40 mt-1">{p.mes}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Horas */}
                <p className="mt-8 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/35">2 · A hora{dia ? ` · ${diaLongo(dia)}` : ''}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {horas.map(s => {
                    const ativo = s.id === slotId
                    return (
                      <button key={s.id} onClick={() => setSlotId(s.id)}
                        className="rounded-lg border py-3 text-lg tabular-nums transition-all"
                        style={{ borderColor: ativo ? GOLD : 'rgba(255,255,255,0.1)', background: ativo ? GOLD : 'transparent', color: ativo ? '#000' : 'rgba(255,255,255,0.85)' }}>
                        {s.hora}
                      </button>
                    )
                  })}
                </div>

                {/* Formato */}
                <p className="mt-8 mb-3 text-[10px] tracking-[0.35em] uppercase text-white/35">3 · Como preferem</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Videochamada', 'Presencial'] as const).map(f => (
                    <button key={f} onClick={() => setFormato(f)}
                      className="rounded-lg border py-3 text-sm tracking-[0.15em] uppercase transition-all"
                      style={{ borderColor: formato === f ? GOLD : 'rgba(255,255,255,0.1)', color: formato === f ? GOLD : 'rgba(255,255,255,0.5)', background: formato === f ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
                      {f}
                    </button>
                  ))}
                </div>

                <button onClick={confirmar} disabled={!slotId || aEnviar}
                  className="mt-10 w-full rounded-xl py-4 text-sm font-semibold tracking-[0.3em] uppercase transition-all disabled:opacity-30"
                  style={{ background: GOLD, color: '#000' }}>
                  {aEnviar ? 'A marcar…' : escolhido ? `Confirmar ${partes(escolhido.data).dia} ${partes(escolhido.data).mes} às ${escolhido.hora}` : 'Escolham um horário'}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`}</style>
    </main>
  )
}
