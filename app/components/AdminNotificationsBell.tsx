'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

type Notif = {
  id: string
  tipo: string
  tipo_label: string
  tipo_icon: string
  casamento_id: string
  freelancer_id: string
  freelancer_nome: string
  local: string
  data_casamento: string | null
  url: string
  sent_at: string
}

const LS_KEY = 'admin_notif_last_seen'

function fmtRel(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - t) / 1000
    if (diff < 60) return 'agora'
    if (diff < 3600) return `há ${Math.round(diff/60)} min`
    if (diff < 86400) return `há ${Math.round(diff/3600)} h`
    const dias = Math.round(diff/86400)
    if (dias < 7) return `há ${dias} ${dias===1?'dia':'dias'}`
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

export function AdminNotificationsBell() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Load last seen do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLastSeen(localStorage.getItem(LS_KEY))
  }, [])

  // Fetch notifs on mount + interval 60s
  useEffect(() => {
    let cancelled = false
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/admin-notifications', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setNotifs(data.notifications ?? [])
      } catch {}
    }
    fetchNotifs()
    const iv = setInterval(fetchNotifs, 60_000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  // Calcula posição do popover relativa ao botão
  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    // Posicionar à direita do sidebar, à mesma altura do botão
    setPopPos({
      top: rect.top,
      left: rect.right + 12, // 12px gap após o botão
    })
  }, [open])

  // Click fora fecha popover
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (popRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Esc fecha
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const unreadCount = lastSeen
    ? notifs.filter(n => (n.sent_at || '') > lastSeen).length
    : notifs.length

  function markAllAsRead() {
    const now = new Date().toISOString()
    if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, now)
    setLastSeen(now)
  }

  return (
    <>
      {/* Animação gold pulse */}
      <style jsx global>{`
        @keyframes adminBellPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 14px -2px rgba(201,164,92,0.4); }
          50%      { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 24px 0 rgba(201,164,92,0.75); }
        }
        .admin-bell-pulse { animation: adminBellPulse 2.2s ease-in-out infinite; }
      `}</style>

      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
          unreadCount > 0 ? 'admin-bell-pulse' : ''
        }`}
        style={{
          background: unreadCount > 0 ? 'rgba(201,164,92,0.10)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${unreadCount > 0 ? 'rgba(201,164,92,0.35)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <span className="shrink-0" style={{ color: unreadCount > 0 ? 'rgba(232,199,109,0.95)' : 'rgba(255,255,255,0.5)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        </span>
        <span className="text-[12px] tracking-wide font-medium flex-1 text-left"
          style={{ color: unreadCount > 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)' }}>
          Notificações
        </span>
        {unreadCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center"
            style={{ boxShadow: '0 0 8px rgba(201,164,92,0.7)' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover via Portal — fora do sidebar para não ser cortado */}
      {open && mounted && popPos && createPortal(
        <div
          ref={popRef}
          className="fixed z-[100] rounded-xl overflow-hidden"
          style={{
            top: popPos.top,
            left: popPos.left,
            width: '380px',
            maxHeight: 'calc(100vh - 40px)',
            background: 'linear-gradient(180deg, rgba(15,12,8,0.98), rgba(11,9,5,0.98))',
            border: '1px solid rgba(201,164,92,0.25)',
            boxShadow: '0 30px 70px -10px rgba(0,0,0,0.85), 0 0 24px -8px rgba(201,164,92,0.3)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold/85 font-semibold">Notificações</p>
              {unreadCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 tracking-wider uppercase font-bold">
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="text-[9px] tracking-wider uppercase text-white/40 hover:text-gold transition-colors">
                  Marcar como lidas
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                title="Fechar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl opacity-20 mb-2">✉</p>
                <p className="text-[11px] text-white/35 italic">Sem notificações</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {notifs.map(n => {
                  const isUnread = !lastSeen || (n.sent_at || '') > lastSeen
                  return (
                    <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                      className="block px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[14px] mt-0.5 ${
                          isUnread ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                        }`}>
                          {n.tipo_icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p className={`text-[12px] font-semibold truncate ${isUnread ? 'text-white' : 'text-white/65'}`}>
                              {n.tipo_label}
                            </p>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5"
                                style={{ boxShadow: '0 0 6px rgba(201,164,92,0.8)' }} />
                            )}
                          </div>
                          <p className="text-[11px] text-white/60 truncate">{n.freelancer_nome} · {n.local}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{fmtRel(n.sent_at)}</p>
                        </div>
                        <span className="text-[10px] text-white/20 group-hover:text-gold transition-colors mt-1">↗</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
