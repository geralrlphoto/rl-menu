'use client'

/* ============================================================
   MediaNotificationsBell — sineta global do admin em /media

   Agrega TODAS as notificações vindas dos clientes em portais
   /media/portal-cliente (lê de /api/media-portal/all-notifications).

   Mostra:
     - pedidos de sessão de briefing
     - mudanças de estado no roadmap
     - actualizações de fase (workflow v2)
     - mensagens de chat enviadas pelo cliente

   - Pulse azul + dot quando há novas (não lidas)
   - Dropdown com tabs "Novas / Histórico"
   - Click num item navega para o sítio relevante
   - localStorage: media-bell-read-at = ISO da última vista
   ============================================================ */

import { useEffect, useRef, useState } from 'react'

type Item = {
  id: string
  kind: 'briefing-pedido' | 'roadmap-status' | 'fase' | 'chat' | 'generic'
  portalRef: string
  portalNome: string
  title: string
  body: string
  at: string
  meta?: any
  href?: string
}

const STORAGE_KEY = 'media-bell-read-at'
const POLL_MS = 60_000

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso).getTime()
    if (!Number.isFinite(d)) return ''
    const diff = Math.max(0, Date.now() - d)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'agora'
    if (m < 60) return `há ${m} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `há ${h} h`
    const dias = Math.floor(h / 24)
    if (dias < 7) return `há ${dias} d`
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
  } catch { return '' }
}

function iconFor(kind: Item['kind']) {
  switch (kind) {
    case 'briefing-pedido':
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="5" width="16" height="16" rx="2.5"/>
          <path d="M4 9h16M8 3v4M16 3v4"/>
          <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-13 6.3L3 20l1.7-5A8 8 0 1 1 21 12Z" />
        </svg>
      )
    case 'roadmap-status':
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="6" height="16" rx="1.4" />
          <rect x="10" y="4" width="6" height="10" rx="1.4" />
          <rect x="17" y="4" width="4" height="6" rx="1.4" />
        </svg>
      )
    case 'fase':
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" /><circle cx="12" cy="16" r="0.6" fill="currentColor" />
        </svg>
      )
  }
}

function kindLabel(k: Item['kind']) {
  switch (k) {
    case 'briefing-pedido': return 'Pedido Briefing'
    case 'chat':            return 'Mensagem'
    case 'roadmap-status':  return 'Roadmap'
    case 'fase':            return 'Workflow'
    default:                return 'Atualização'
  }
}

export default function MediaNotificationsBell() {
  const [items, setItems]       = useState<Item[]>([])
  const [open, setOpen]         = useState(false)
  const [view, setView]         = useState<'new' | 'history'>('new')
  const [readAt, setReadAt]     = useState<string>('')
  const prevOpenRef             = useRef(false)
  const wrapperRef              = useRef<HTMLDivElement | null>(null)

  /* ── Carrega o readAt do localStorage ── */
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v) setReadAt(v)
    } catch {}
  }, [])

  /* ── Fetch periódico ── */
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('/api/media-portal/all-notifications', { cache: 'no-store' })
        const json = await r.json()
        if (alive) setItems(Array.isArray(json?.items) ? json.items : [])
      } catch {
        if (alive) setItems([])
      }
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  /* ── Click-outside fecha ── */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  /* ── Marcar como lidas ao FECHAR ── */
  useEffect(() => {
    if (prevOpenRef.current && !open && items.length > 0) {
      const latest = items[0]?.at ?? new Date().toISOString()
      setReadAt(latest)
      try { localStorage.setItem(STORAGE_KEY, latest) } catch {}
      setView('new')
    }
    prevOpenRef.current = open
  }, [open, items])

  const unread = items.filter(i => !readAt || String(i.at).localeCompare(readAt) > 0)
  const unreadCount = unread.length
  const shown = view === 'new' ? unread : items

  return (
    <div ref={wrapperRef} className="mn-wrap">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`mn-bell${unreadCount > 0 ? ' mn-bell--glow' : ''}`}
        aria-label="Notificações de clientes"
        title={unreadCount > 0 ? `${unreadCount} nova${unreadCount === 1 ? '' : 's'}` : 'Notificações'}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 17h5l-1.4-1.6A7 7 0 0 1 17 11V8a5 5 0 1 0-10 0v3a7 7 0 0 1-1.6 4.4L4 17h11Z" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {unreadCount > 0 && <span className="mn-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="mn-pop" role="dialog" aria-label="Notificações de clientes">
          <div className="mn-pop-head">
            <p className="mn-pop-title">Clientes · pedidos & mensagens</p>
            <div className="mn-pop-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'new'}
                className={`mn-tab${view === 'new' ? ' is-on' : ''}`}
                onClick={() => setView('new')}
              >
                Novas {unreadCount > 0 && <span className="mn-tab-num">{unreadCount}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'history'}
                className={`mn-tab${view === 'history' ? ' is-on' : ''}`}
                onClick={() => setView('history')}
              >
                Histórico
              </button>
            </div>
          </div>

          <div className="mn-pop-body">
            {shown.length === 0 ? (
              <div className="mn-empty">
                <span className="mn-empty-ic">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 7h14M5 12h14M5 17h8" />
                  </svg>
                </span>
                <p className="mn-empty-t">
                  {view === 'new' ? 'Nada de novo' : 'Sem histórico'}
                </p>
                <p className="mn-empty-d">
                  {view === 'new'
                    ? 'Quando um cliente pedir uma sessão ou enviar mensagem, aparece aqui.'
                    : 'As notificações antigas vão aparecer aqui assim que existirem.'}
                </p>
              </div>
            ) : (
              <ul className="mn-list">
                {shown.map(it => {
                  const faded = view === 'history' && readAt && String(it.at).localeCompare(readAt) <= 0
                  return (
                    <li key={it.id}>
                      <a
                        href={it.href ?? `/portal-media/${it.portalRef}?admin=1`}
                        className={`mn-row${faded ? ' mn-row--faded' : ''}`}
                      >
                        <span className={`mn-row-ic mn-row-ic--${it.kind}`}>
                          {iconFor(it.kind)}
                        </span>
                        <span className="mn-row-mid">
                          <span className="mn-row-meta">
                            <span className="mn-row-kind">{kindLabel(it.kind)}</span>
                            <span className="mn-row-portal">· {it.portalNome}</span>
                          </span>
                          <span className="mn-row-title">{it.title}</span>
                          {it.body && <span className="mn-row-body">{it.body}</span>}
                        </span>
                        <span className="mn-row-time">{timeAgo(it.at)}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────── */}
      <style jsx>{`
        .mn-wrap { position: relative; display: inline-block; font-family: 'Manrope', system-ui, sans-serif; }

        .mn-bell {
          position: relative;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.78);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .18s;
        }
        .mn-bell:hover { color: #fff; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.07); }
        .mn-bell--glow {
          color: #fff;
          border-color: oklch(0.66 0.13 245 / 0.55);
          background: oklch(0.40 0.08 245 / 0.18);
          animation: mnBellPulse 2.4s ease-in-out infinite;
        }
        @keyframes mnBellPulse {
          0%, 100% { box-shadow: 0 0 12px oklch(0.66 0.13 245 / 0.35), 0 0 0 0 oklch(0.80 0.11 245 / 0.55); }
          50%      { box-shadow: 0 0 22px oklch(0.66 0.13 245 / 0.55), 0 0 0 6px oklch(0.80 0.11 245 / 0.00); }
        }
        .mn-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 999px;
          background: oklch(0.80 0.11 245);
          color: #0e1b27;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0;
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px oklch(0.66 0.13 245 / 0.55);
        }

        .mn-pop {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: min(380px, 96vw);
          background: linear-gradient(180deg, #16293a, #122230 60%, #0e1b27);
          border: 1px solid oklch(0.50 0.03 245 / 0.30);
          border-radius: 14px;
          box-shadow: 0 24px 60px -16px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.35);
          z-index: 60;
          overflow: hidden;
          animation: mnPopIn .18s ease forwards;
        }
        @keyframes mnPopIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
        .mn-pop-head {
          padding: 14px 16px 0;
          border-bottom: 1px solid oklch(0.50 0.03 245 / 0.18);
        }
        .mn-pop-title {
          font-family: 'Space Grotesk', 'Manrope', sans-serif;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: oklch(0.66 0.03 245);
          margin: 0 0 10px;
        }
        .mn-pop-tabs { display: flex; gap: 16px; }
        .mn-tab {
          background: transparent; border: 0;
          padding: 8px 0 12px;
          font-family: 'Manrope', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em;
          color: oklch(0.60 0.03 245);
          cursor: pointer;
          position: relative;
          display: inline-flex; align-items: center; gap: 8px;
          transition: color .15s;
        }
        .mn-tab:hover { color: #fff; }
        .mn-tab.is-on { color: #fff; }
        .mn-tab.is-on::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px;
          background: oklch(0.80 0.11 245);
          border-radius: 2px;
        }
        .mn-tab-num {
          min-width: 18px; height: 18px; border-radius: 999px;
          background: oklch(0.66 0.13 245 / 0.25);
          border: 1px solid oklch(0.66 0.13 245 / 0.45);
          color: #fff;
          font-size: 10px; font-weight: 700;
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 5px;
        }

        .mn-pop-body { max-height: 440px; overflow-y: auto; padding: 6px 0; }
        .mn-pop-body::-webkit-scrollbar { width: 6px; }
        .mn-pop-body::-webkit-scrollbar-thumb { background: oklch(0.40 0.03 245 / 0.5); border-radius: 6px; }

        .mn-empty {
          padding: 32px 22px;
          text-align: center;
          color: oklch(0.66 0.03 245);
        }
        .mn-empty-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 42px; height: 42px;
          border-radius: 12px;
          margin-bottom: 12px;
          color: oklch(0.66 0.03 245);
          background: oklch(0.30 0.03 245 / 0.5);
          border: 1px solid oklch(0.50 0.03 245 / 0.20);
        }
        .mn-empty-t {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: oklch(0.78 0.025 245);
          margin: 0 0 6px;
        }
        .mn-empty-d {
          font-size: 12.5px; color: oklch(0.60 0.03 245);
          margin: 0;
        }

        .mn-list {
          list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column;
        }
        .mn-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 16px;
          color: #fff;
          text-decoration: none;
          border-bottom: 1px solid oklch(0.50 0.03 245 / 0.10);
          transition: background .15s;
          position: relative;
        }
        .mn-row:hover { background: oklch(0.40 0.04 245 / 0.30); }
        .mn-row::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 2px; background: transparent;
        }
        .mn-row--faded { opacity: 0.55; }
        .mn-row--faded:hover { opacity: 0.85; }

        .mn-row-ic {
          width: 28px; height: 28px;
          border-radius: 9px;
          flex: none;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid;
        }
        .mn-row-ic--briefing-pedido {
          color: oklch(0.80 0.13 80);
          background: oklch(0.80 0.13 80 / 0.12);
          border-color: oklch(0.80 0.13 80 / 0.30);
        }
        .mn-row-ic--chat {
          color: oklch(0.80 0.11 245);
          background: oklch(0.66 0.13 245 / 0.14);
          border-color: oklch(0.66 0.13 245 / 0.30);
        }
        .mn-row-ic--roadmap-status,
        .mn-row-ic--fase {
          color: oklch(0.72 0.12 165);
          background: oklch(0.72 0.12 165 / 0.12);
          border-color: oklch(0.72 0.12 165 / 0.30);
        }
        .mn-row-ic--generic {
          color: oklch(0.66 0.03 245);
          background: oklch(0.30 0.03 245 / 0.5);
          border-color: oklch(0.50 0.03 245 / 0.20);
        }

        .mn-row-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .mn-row-meta {
          display: flex; align-items: center; gap: 4px;
          font-family: 'Space Grotesk', 'Manrope', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: oklch(0.62 0.03 245);
        }
        .mn-row-kind { color: oklch(0.80 0.11 245); }
        .mn-row-portal { color: oklch(0.62 0.03 245); }
        .mn-row-title {
          font-size: 13px; font-weight: 600;
          color: #fff;
          line-height: 1.35;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mn-row-body {
          font-size: 12px; font-weight: 400;
          color: oklch(0.66 0.03 245);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .mn-row-time {
          flex: none;
          font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.04em;
          color: oklch(0.55 0.03 245);
          padding-top: 4px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
