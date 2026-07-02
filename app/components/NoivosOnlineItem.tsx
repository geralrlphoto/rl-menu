'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  NoivosOnlineItem
 *
 *  Item da sidebar admin — paridade com OnlineMembersItem mas para casais
 *  (noivos / pais de batizado). Mostra quantos portais têm sessão activa
 *  agora, com pulse rosa-dourado. Click abre modal com:
 *    · Lista por referência (CAS_011_26_RL → "RUI & LILIANA")
 *    · Última entrada (Entrou hoje · Há 2 dias / Nunca entraram)
 *
 *  A presença é registada UMA vez por visita (ver portais). Aqui só lemos
 *  ao montar e ao abrir o modal — sem polling — para poupar egress.
 * ─────────────────────────────────────────────────────────────────────────── */

type PortalRow = {
  referencia: string
  noiva?: string | null
  noivo?: string | null
  data?: string | null
  data_formatada?: string | null
  tipoPortal?: 'casamento' | 'batizado' | null
}

// "Entrou hoje" = timestamp no mesmo dia de calendário (fuso do browser admin).
function isSameDay(a: number, b: number): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate()
}

export default function NoivosOnlineItem() {
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})
  const [serverNow, setServerNow] = useState<number>(Date.now())
  const [portais, setPortais] = useState<PortalRow[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadPresence() {
    try {
      const r = await fetch('/api/noivos-presence', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setLastSeen((j?.last_seen ?? {}) as Record<string, string>)
      setServerNow(j?.now ? new Date(j.now).getTime() : Date.now())
      setLoaded(true)
    } catch { setLoaded(true) }
  }

  async function loadPortais() {
    try {
      // Modo leve — não puxa o `settings` completo de cada portal.
      const r = await fetch('/api/portais?light=1', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      const list: PortalRow[] = (j?.portais ?? [])
        .filter((p: any) => p?.referencia && !p.referencia.startsWith('__'))
        .map((p: any) => ({
          referencia: p.referencia,
          noiva: p.noiva ?? null,
          noivo: p.noivo ?? null,
          data: p.data ?? null,
          data_formatada: p.dataFormatada ?? null,
          tipoPortal: p.tipoPortal ?? 'casamento',
        }))
      setPortais(list)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    // Sem polling: a presença é escrita 1x por visita nos portais, por isso
    // basta ler ao montar (e ao abrir o modal, abaixo). Poupa egress.
    loadPresence()
    loadPortais()
  }, [])

  useEffect(() => {
    if (open) { loadPresence(); loadPortais() }
  }, [open])

  const enteredTodayCount = Object.entries(lastSeen).filter(([, ts]) => {
    const t = new Date(ts).getTime()
    return !isNaN(t) && isSameDay(t, serverNow)
  }).length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group hover:bg-white/[0.03]"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
        title="Noivos que entraram hoje no portal"
      >
        <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ border: '1px solid rgba(201,164,92,0.30)', background: 'rgba(201,164,92,0.05)' }}>
          <span className="block w-2 h-2 rounded-full"
            style={{
              background: enteredTodayCount > 0 ? '#C9A84C' : 'rgba(255,255,255,0.20)',
              boxShadow: enteredTodayCount > 0 ? '0 0 8px #C9A84C, 0 0 14px rgba(201,164,92,0.55)' : undefined,
              animation: enteredTodayCount > 0 ? 'noivosPulse 1.8s ease-in-out infinite' : undefined,
            }} />
        </span>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Noivos hoje
            </p>
            {loaded && enteredTodayCount > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] font-bold rounded-full px-2 h-[18px] min-w-[18px]"
                style={{ background: '#C9A84C', color: '#1F1608', boxShadow: '0 0 10px rgba(201,164,92,0.5)' }}>
                {enteredTodayCount}
              </span>
            )}
            {loaded && enteredTodayCount === 0 && (
              <span className="text-[10px] text-white/30 tracking-widest uppercase">— ninguém hoje</span>
            )}
          </div>
          <p className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Entraram no portal
          </p>
        </div>
      </button>

      <style jsx global>{`
        @keyframes noivosPulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.35); opacity: 0.6; }
        }
      `}</style>

      {open && typeof document !== 'undefined' && createPortal(
        <NoivosPresenceModal
          portais={portais}
          lastSeen={lastSeen}
          serverNow={serverNow}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  )
}

function NoivosPresenceModal({
  portais, lastSeen, serverNow, onClose,
}: {
  portais: PortalRow[]
  lastSeen: Record<string, string>
  serverNow: number
  onClose: () => void
}) {
  const rows = [...portais].map(p => {
    const ts = lastSeen[p.referencia]
    const t = ts ? new Date(ts).getTime() : 0
    const enteredToday = t > 0 && isSameDay(t, serverNow)
    const labelCouple = [p.noiva, p.noivo].filter(Boolean).join(' & ') || p.referencia
    return { ...p, ts, t, enteredToday, labelCouple }
  }).sort((a, b) => {
    if (a.enteredToday !== b.enteredToday) return a.enteredToday ? -1 : 1
    return b.t - a.t
  })

  const todayCount = rows.filter(r => r.enteredToday).length

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl mt-12"
        style={{
          background: 'linear-gradient(180deg, #1a140b, #050402)',
          borderColor: 'rgba(201,164,92,0.30)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 28px -4px rgba(201,164,92,0.30)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

        <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-bold" style={{ color: '#D4B870' }}>
              Casais nos Portais
            </p>
            <h2 className="text-2xl font-light tracking-[0.06em] text-white mt-1.5" style={{ fontFamily: 'Georgia, serif' }}>
              Noivos <em className="italic" style={{ color: '#D4B870' }}>hoje</em>
            </h2>
            <p className="text-[12px] text-white/55 mt-1.5">
              {todayCount === 0
                ? 'Nenhum casal entrou no portal hoje.'
                : `${todayCount} casal${todayCount === 1 ? '' : 'ais'} ${todayCount === 1 ? 'entrou' : 'entraram'} no portal hoje.`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">
            ✕
          </button>
        </div>

        <div className="px-6 sm:px-7 py-5 max-h-[60vh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-[12px] text-white/40 italic text-center py-8">Sem portais activos.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map(r => {
                const isBatizado = r.tipoPortal === 'batizado'
                const portalUrl = isBatizado
                  ? `/portal-batizado/ref/${encodeURIComponent(r.referencia)}?admin=1`
                  : `/portal-cliente/ref/${encodeURIComponent(r.referencia)}?admin=1`
                return (
                  <li key={r.referencia}>
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:bg-white/[0.04]"
                      style={{
                        background: r.enteredToday ? 'rgba(201,164,92,0.06)' : 'rgba(255,255,255,0.015)',
                        borderColor: r.enteredToday ? 'rgba(201,164,92,0.35)' : 'rgba(255,255,255,0.06)',
                      }}>
                      <div className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[14px]"
                        style={{
                          background: r.enteredToday ? 'linear-gradient(135deg, #D4B870 0%, #C9A84C 100%)' : 'rgba(255,255,255,0.04)',
                          color: r.enteredToday ? '#1F1608' : 'rgba(255,255,255,0.65)',
                          border: r.enteredToday ? '1px solid rgba(201,164,92,0.50)' : '1px solid rgba(255,255,255,0.10)',
                        }}>
                        {isBatizado ? '👶' : '♡'}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black"
                          style={{
                            background: r.enteredToday ? '#C9A84C' : '#71717a',
                            boxShadow: r.enteredToday ? '0 0 8px #C9A84C' : undefined,
                            animation: r.enteredToday ? 'noivosPulse 1.8s ease-in-out infinite' : undefined,
                          }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] text-white font-medium truncate">{r.labelCouple}</p>
                        <p className="text-[10px] text-white/40 tracking-widest uppercase">
                          {r.referencia}
                          {r.data_formatada && ` · ${r.data_formatada}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {r.enteredToday ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase font-bold px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(201,164,92,0.15)', color: '#D4B870', border: '1px solid rgba(201,164,92,0.35)' }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C', animation: 'noivosPulse 1.8s ease-in-out infinite' }} />
                            Hoje
                          </span>
                        ) : r.ts ? (
                          <span className="text-[11px] text-white/45 italic">
                            Há {formatAgo(serverNow - r.t)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/25 tracking-widest uppercase italic">
                            Nunca entraram
                          </span>
                        )}
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="px-6 sm:px-7 py-3 border-t border-white/[0.05] flex items-center justify-between bg-black/30">
          <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase">
            Regista a última entrada de cada casal
          </p>
          <button onClick={onClose}
            className="text-[10px] tracking-widest uppercase text-white/45 hover:text-white transition-colors px-3 py-1">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatAgo(ms: number): string {
  if (ms < 60_000) return 'menos de 1 min'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} dia${days === 1 ? '' : 's'}`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} sem`
  const months = Math.round(days / 30)
  return `${months} mês${months === 1 ? '' : 'es'}`
}
