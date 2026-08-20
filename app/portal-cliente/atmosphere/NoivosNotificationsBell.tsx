'use client'

/* ============================================================
   NoivosNotificationsBell — sino de notificações dos noivos,
   estilo card premium (gold/dark). Mostra as notificações
   enviadas pelo admin. "Lidas"/"apagadas" guardadas em
   localStorage por referência. O sino está SEMPRE visível
   (mesmo sem notificações).
   ============================================================ */

import { useState, useEffect } from 'react'

export function NoivosNotificationsBell({
  notifs,
  refKey,
}: {
  notifs: Array<{ id: string; titulo: string; texto: string; ts: string }>
  refKey: string
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const LS = `noivos_notif_seen_${refKey}`
  const LS_DEL = `noivos_notif_deleted_${refKey}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS)
      if (raw) setSeen(new Set(JSON.parse(raw)))
      const rawDel = localStorage.getItem(LS_DEL)
      if (rawDel) setDeleted(new Set(JSON.parse(rawDel)))
    } catch { /* ignore */ }
  }, [LS, LS_DEL])

  // Só conta as que não foram apagadas localmente pelos noivos.
  const ordered = [...(notifs ?? [])]
    .filter(n => !deleted.has(n.id))
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''))
  const unread = ordered.filter(n => !seen.has(n.id)).length

  function markAllSeen() {
    const next = new Set([...seen, ...ordered.map(n => n.id)])
    setSeen(next)
    try { localStorage.setItem(LS, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }

  // Apagar só no portal (localStorage) — não mexe na ficha/admin.
  function apagar(id: string) {
    const next = new Set(deleted); next.add(id)
    setDeleted(next)
    try { localStorage.setItem(LS_DEL, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }

  function toggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) markAllSeen()
  }

  const fmtData = (ts: string) => {
    try { return new Date(ts).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return '' }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', marginLeft: 'auto', zIndex: 60 }}>
      <style>{`
        @keyframes noivosBellGlow {
          0%, 100% { box-shadow: 0 8px 24px -6px rgba(0,0,0,0.6), 0 0 10px -4px rgba(201,164,92,0.45); border-color: rgba(201,164,92,0.45); }
          50%      { box-shadow: 0 8px 24px -6px rgba(0,0,0,0.6), 0 0 28px 3px rgba(201,164,92,0.9);  border-color: rgba(232,199,109,0.95); }
        }
        .noivos-bell-glow { animation: noivosBellGlow 1.7s ease-in-out infinite; }
      `}</style>
      {/* Botão sino — sempre visível */}
      <button
        onClick={toggle}
        aria-label="Notificações"
        className={unread > 0 ? 'noivos-bell-glow' : ''}
        style={{
          position: 'relative', width: 46, height: 46, borderRadius: 14,
          border: '1px solid rgba(201,164,92,0.45)',
          background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(15,12,8,0.92))',
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.6), 0 0 18px -6px rgba(201,164,92,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d8be93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
            borderRadius: 9, background: '#d8be93', color: '#0b0a08', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)',
          }}>{unread}</span>
        )}
      </button>

      {/* Painel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 59 }} />
          <div style={{
            position: 'fixed', top: 84, left: 16, zIndex: 61, width: 'min(340px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto',
            borderRadius: 18, border: '1px solid rgba(201,164,92,0.35)',
            background: 'linear-gradient(180deg, rgba(20,16,10,0.98), rgba(10,8,5,0.98))',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 24px -8px rgba(201,164,92,0.35)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid rgba(201,164,92,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(201,164,92,0.8)', fontWeight: 700 }}>
                Notificações
              </span>
            </div>
            {ordered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: 0, fontStyle: 'italic' }}>Sem notificações de momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ordered.map(n => (
                  <div key={n.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d8be93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f3ede2', fontFamily: 'var(--fd)', flex: 1 }}>{n.titulo}</span>
                      <button
                        onClick={() => apagar(n.id)}
                        aria-label="Apagar notificação"
                        title="Apagar"
                        style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                          color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', lineHeight: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{n.texto}</p>
                    {n.ts && <p style={{ fontSize: 10, color: 'rgba(201,164,92,0.55)', marginTop: 6, letterSpacing: '0.05em' }}>{fmtData(n.ts)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
