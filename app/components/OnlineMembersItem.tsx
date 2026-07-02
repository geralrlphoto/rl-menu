'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  OnlineMembersItem
 *
 *  Item da sidebar admin que mostra quantos membros estão online em tempo
 *  real (pulse verde + count). Clicar abre modal preview com a lista
 *  completa de membros e o último ping de cada um (Online · Há X min).
 *
 *  Online = last_seen dentro dos últimos 6 minutos.
 *  Auto-refresh: re-puxa de /api/freelancer-presence cada 30 segundos.
 * ─────────────────────────────────────────────────────────────────────────── */

type FreelancerRow = { id: string; nome: string; status: string | null; foto_url: string | null }

const ONLINE_WINDOW_MS = 360_000 // 6 min (ping do freelancer é a cada 3 min)

export default function OnlineMembersItem() {
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({})
  const [serverNow, setServerNow] = useState<number>(Date.now())
  const [freelancers, setFreelancers] = useState<FreelancerRow[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadPresence() {
    try {
      const r = await fetch('/api/freelancer-presence', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setLastSeen((j?.last_seen ?? {}) as Record<string, string>)
      if (j?.now) setServerNow(new Date(j.now).getTime())
      else setServerNow(Date.now())
      setLoaded(true)
    } catch { setLoaded(true) }
  }

  async function loadFreelancers() {
    try {
      const r = await fetch('/api/freelancers', { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      const list: FreelancerRow[] = (j?.freelancers ?? [])
        .filter((f: any) => f?.id && f?.nome)
        .map((f: any) => ({ id: f.id, nome: f.nome, status: f.status ?? null, foto_url: f.foto_url ?? null }))
      setFreelancers(list)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadPresence()
    loadFreelancers()
    // Poll a cada 3 min e só com o separador visível — poupa egress.
    const iv = setInterval(() => { if (!document.hidden) loadPresence() }, 180_000)
    const onVis = () => { if (!document.hidden) loadPresence() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Ao abrir o modal, refresca imediatamente
  useEffect(() => {
    if (open) { loadPresence(); loadFreelancers() }
  }, [open])

  // Conta online (devs presentes em lastSeen e dentro da janela 6min)
  const onlineCount = Object.entries(lastSeen).filter(([, ts]) => {
    const t = new Date(ts).getTime()
    return !isNaN(t) && serverNow - t < ONLINE_WINDOW_MS
  }).length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group hover:bg-white/[0.03]"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
        title="Quem está online"
      >
        <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ border: '1px solid rgba(110,231,183,0.30)', background: 'rgba(110,231,183,0.05)' }}>
          <span className="block w-2 h-2 rounded-full"
            style={{
              background: onlineCount > 0 ? '#34d399' : 'rgba(255,255,255,0.20)',
              boxShadow: onlineCount > 0 ? '0 0 8px #34d399, 0 0 14px rgba(52,211,153,0.55)' : undefined,
              animation: onlineCount > 0 ? 'onlinePulse 1.8s ease-in-out infinite' : undefined,
            }} />
        </span>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              Quem está online
            </p>
            {loaded && onlineCount > 0 && (
              <span className="inline-flex items-center justify-center text-[10px] font-bold rounded-full px-2 h-[18px] min-w-[18px]"
                style={{ background: '#34d399', color: '#04221a', boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}>
                {onlineCount}
              </span>
            )}
            {loaded && onlineCount === 0 && (
              <span className="text-[10px] text-white/30 tracking-widest uppercase">— ninguém</span>
            )}
          </div>
          <p className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Equipa em tempo real
          </p>
        </div>
      </button>

      {/* Keyframes do pulse (escopado global, só uma vez) */}
      <style jsx global>{`
        @keyframes onlinePulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.35); opacity: 0.6; }
        }
      `}</style>

      {open && typeof document !== 'undefined' && createPortal(
        <PresenceModal
          freelancers={freelancers}
          lastSeen={lastSeen}
          serverNow={serverNow}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </>
  )
}

function PresenceModal({
  freelancers, lastSeen, serverNow, onClose,
}: {
  freelancers: FreelancerRow[]
  lastSeen: Record<string, string>
  serverNow: number
  onClose: () => void
}) {
  // Ordenação: online primeiro, depois por last_seen desc, depois pelos sem registo
  const rows = [...freelancers].map(f => {
    const ts = lastSeen[f.id]
    const t = ts ? new Date(ts).getTime() : 0
    const isOnline = t > 0 && (serverNow - t) < ONLINE_WINDOW_MS
    return { ...f, ts, t, isOnline }
  }).sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    return b.t - a.t
  })

  const onlineCount = rows.filter(r => r.isOnline).length

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl mt-12"
        style={{
          background: 'linear-gradient(180deg, #0b1a14, #050a07)',
          borderColor: 'rgba(110,231,183,0.30)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), 0 0 28px -4px rgba(52,211,153,0.30)',
        }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)' }} />

        {/* Header */}
        <div className="px-6 sm:px-7 pt-6 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-bold" style={{ color: '#6ee7b7' }}>
              Equipa em Tempo Real
            </p>
            <h2 className="text-2xl font-light tracking-[0.06em] text-white mt-1.5" style={{ fontFamily: 'Georgia, serif' }}>
              Quem está <em className="italic" style={{ color: '#6ee7b7' }}>online</em>
            </h2>
            <p className="text-[12px] text-white/55 mt-1.5">
              {onlineCount === 0
                ? 'Nenhum membro está online neste momento.'
                : `${onlineCount} membro${onlineCount === 1 ? '' : 's'} online nos últimos 6 minutos.`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-7 py-5 max-h-[60vh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="text-[12px] text-white/40 italic text-center py-8">Sem freelancers carregados.</p>
          ) : (
            <ul className="space-y-1.5">
              {rows.map(r => (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                  style={{
                    background: r.isOnline ? 'rgba(110,231,183,0.06)' : 'rgba(255,255,255,0.015)',
                    borderColor: r.isOnline ? 'rgba(110,231,183,0.30)' : 'rgba(255,255,255,0.06)',
                  }}>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {r.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.foto_url} alt={r.nome} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold uppercase border border-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)' }}>
                        {(r.nome ?? '?').charAt(0)}
                      </div>
                    )}
                    {/* Pontinho de estado */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black"
                      style={{
                        background: r.isOnline ? '#34d399' : '#71717a',
                        boxShadow: r.isOnline ? '0 0 8px #34d399' : undefined,
                        animation: r.isOnline ? 'onlinePulse 1.8s ease-in-out infinite' : undefined,
                      }} />
                  </div>
                  {/* Nome + função */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-white font-medium truncate">{r.nome}</p>
                    {r.status && (
                      <p className="text-[10px] text-white/40 tracking-widest uppercase">{r.status}</p>
                    )}
                  </div>
                  {/* Estado */}
                  <div className="text-right shrink-0">
                    {r.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.25em] uppercase font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.35)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', animation: 'onlinePulse 1.8s ease-in-out infinite' }} />
                        Online
                      </span>
                    ) : r.ts ? (
                      <span className="text-[11px] text-white/45 italic">
                        Há {formatAgo(serverNow - r.t)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/25 tracking-widest uppercase italic">
                        Nunca entrou
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-7 py-3 border-t border-white/[0.05] flex items-center justify-between bg-black/30">
          <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase">
            Heartbeat 3min · janela online 6min
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

/** Formata um intervalo em ms como '12 min', '2 h', '3 dias' etc. */
function formatAgo(ms: number): string {
  if (ms < 60_000) return 'menos de 1 min'
  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} dia${days === 1 ? '' : 's'}`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} sem${weeks === 1 ? '' : ''}`
  const months = Math.round(days / 30)
  return `${months} mês${months === 1 ? '' : 'es'}`
}
