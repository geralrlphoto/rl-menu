'use client'

/* ============================================================
   NotificationsBell — sino no top bar do portal do cliente.
   Lê notificações do endpoint /api/media-portal/[ref]/notifications.
   Mostra badge com contador (max 9+), abre dropdown com lista.
   Tema navy v2, coerente com o resto do portal.
   ============================================================ */

import { useEffect, useRef, useState } from 'react'
import './portal-top-bar.css'

type Notification = {
  at: string
  type?: string                // 'fase' | 'roadmap-status' | 'generic' | ...
  title?: string
  body?: string
  meta?: any
  // backwards compat: notify_fase_log pode trazer { phase } directamente
  phase?: { n?: string; name?: string; state?: string; date?: string | null }
}

interface Props {
  portalRef: string
}

const STORAGE_KEY_PREFIX = 'pm-notif-read-'

export default function NotificationsBell({ portalRef }: Props) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [readAt, setReadAt] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Carrega notificações + último 'lido' do localStorage
  useEffect(() => {
    let cancelled = false
    fetch(`/api/media-portal/${portalRef}/notifications`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setNotifs(Array.isArray(d?.notifications) ? d.notifications : [])
      })
      .catch(() => { if (!cancelled) setNotifs([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    try {
      const v = localStorage.getItem(STORAGE_KEY_PREFIX + portalRef)
      if (v) setReadAt(v)
    } catch { /* noop */ }
    return () => { cancelled = true }
  }, [portalRef])

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Marcar como lido quando o user abre o dropdown
  const handleOpen = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && notifs.length > 0) {
      const latest = notifs[0]?.at ?? new Date().toISOString()
      setReadAt(latest)
      try { localStorage.setItem(STORAGE_KEY_PREFIX + portalRef, latest) } catch { /* noop */ }
    }
  }

  const unread = readAt
    ? notifs.filter(n => String(n?.at ?? '') > readAt).length
    : notifs.length

  return (
    <div ref={wrapperRef} className="relative">
      {/* Botão sino — contraste alto contra o top bar navy.
       *  Brilha em azul suave quando há por ler (pm-bell-glow). */}
      <button
        onClick={handleOpen}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
        className={'relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150' + (unread > 0 && !open ? ' pm-bell-glow' : '')}
        style={{
          border: '1px solid oklch(0.66 0.13 245 / 0.55)',
          color: '#fff',
          background: open
            ? 'oklch(0.66 0.13 245 / 0.30)'
            : (unread > 0 ? 'oklch(0.66 0.13 245 / 0.22)' : 'oklch(0.66 0.13 245 / 0.14)'),
          boxShadow: open
            ? '0 0 0 3px oklch(0.66 0.13 245 / 0.18), 0 0 12px oklch(0.66 0.13 245 / 0.4)'
            : (unread > 0 ? undefined : '0 0 10px oklch(0.66 0.13 245 / 0.18)'),
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.borderColor = 'oklch(0.80 0.11 245)'
            e.currentTarget.style.background = 'oklch(0.66 0.13 245 / 0.24)'
            e.currentTarget.style.boxShadow = '0 0 14px oklch(0.66 0.13 245 / 0.32)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.borderColor = 'oklch(0.66 0.13 245 / 0.55)'
            e.currentTarget.style.background = 'oklch(0.66 0.13 245 / 0.14)'
            e.currentTarget.style.boxShadow = '0 0 10px oklch(0.66 0.13 245 / 0.18)'
          }
        }}
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
        </svg>
        {unread > 0 && (
          <span aria-hidden
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[4px] rounded-full flex items-center justify-center text-[10px] font-bold leading-none"
            style={{
              background: 'oklch(0.66 0.16 30)' /* danger tone */,
              color: '#fff',
              border: '2px solid #122230',
              fontFamily: 'Manrope, system-ui, sans-serif',
              boxShadow: '0 0 8px oklch(0.66 0.16 30 / 0.6)',
            }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50"
          style={{
            width: 'min(320px, calc(100vw - 20px))',
            background: 'linear-gradient(180deg, #16293a, #122230 60%, #0e1b27)',
            border: '1px solid oklch(0.50 0.03 245 / 0.22)',
            borderRadius: 12,
            boxShadow: '0 18px 40px -12px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3)',
            fontFamily: 'Manrope, system-ui, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid oklch(0.50 0.03 245 / 0.18)' }}>
            <p className="text-[10.5px] tracking-[0.28em] uppercase font-semibold"
              style={{ fontFamily: 'Space Grotesk, Manrope, sans-serif', color: 'oklch(0.80 0.11 245)' }}>
              Notificações
            </p>
            {notifs.length > 0 && (
              <span className="text-[10px] tracking-[0.14em] uppercase font-semibold"
                style={{ color: 'oklch(0.58 0.03 245)' }}>
                {notifs.length}
              </span>
            )}
          </div>

          {/* Conteúdo */}
          <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <EmptyState text="A carregar…" />
            ) : notifs.length === 0 ? (
              <EmptyState text="Sem notificações por agora" />
            ) : (
              <ul className="m-0 p-0 list-none">
                {notifs.map((n, i) => (
                  <NotifRow key={i} n={n} fresh={!readAt || String(n?.at ?? '') > (readAt ?? '')} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────────── */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <svg className="mx-auto mb-3" width={32} height={32} viewBox="0 0 24 24"
        fill="none" stroke="oklch(0.50 0.03 245)" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
      </svg>
      <p className="text-[12px] leading-snug" style={{ color: 'oklch(0.58 0.03 245)' }}>
        {text}
      </p>
    </div>
  )
}

function NotifRow({ n, fresh }: { n: Notification; fresh: boolean }) {
  // Determina tipo + label + cor por defeito
  const type = String(n.type ?? (n.phase ? 'fase' : 'generic'))
  const isFase = type === 'fase' || !!n.phase
  const isRoadmap = type === 'roadmap-status' || type === 'roadmap'

  // Header label + cor
  let headerLabel = 'Notificação'
  let headerColor = 'oklch(0.80 0.11 245)' // accent navy default
  if (isFase) {
    const ps = n.phase?.state ?? ''
    headerLabel = n.phase?.n ? `Fase ${n.phase.n}` : 'Fase'
    if (ps) {
      const lbl = ps === 'done' ? 'Concluído' : ps === 'doing' ? 'Em curso' : ps === 'pending' ? 'Pendente' : ps
      headerLabel += ` · ${lbl}`
    }
    headerColor = ps === 'done' ? 'oklch(0.72 0.12 165)' : ps === 'doing' ? 'oklch(0.80 0.11 245)' : 'oklch(0.66 0.15 35)'
  } else if (isRoadmap) {
    headerLabel = 'Road Map · Estado'
    // Cor por novo estado
    const ne = String(n.meta?.novoEstado ?? '')
    headerColor = ne === 'concluido' ? 'oklch(0.72 0.12 165)'
      : ne === 'em_andamento' ? 'oklch(0.80 0.11 245)'
      : ne === 'aguardar' ? 'oklch(0.78 0.10 80)'
      : 'oklch(0.66 0.15 35)'
  }

  // Title + body
  const title = (n.title ?? '').trim() || (isFase ? (n.phase?.name ?? 'Atualização da fase') : 'Atualização')
  const body = (n.body ?? '').trim() || (isFase && n.phase?.date ? `Data: ${n.phase.date}` : '')
  const when = formatRelative(n.at)

  return (
    <li className="relative px-4 py-3"
      style={{ borderBottom: '1px solid oklch(0.50 0.03 245 / 0.12)' }}>
      {fresh && (
        <span aria-hidden className="absolute left-1.5 top-3 w-1.5 h-1.5 rounded-full"
          style={{ background: 'oklch(0.80 0.11 245)', boxShadow: '0 0 6px oklch(0.66 0.13 245 / .6)' }} />
      )}
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[10px] tracking-[0.2em] uppercase font-bold"
          style={{ fontFamily: 'Space Grotesk, Manrope, sans-serif', color: headerColor }}>
          {headerLabel}
        </p>
        <span className="text-[10px]" style={{ color: 'oklch(0.58 0.03 245)' }}>{when}</span>
      </div>
      <p className="text-[12.5px] leading-snug font-medium"
        style={{ color: '#fff' }}>
        {title}
      </p>
      {body && (
        <p className="text-[11px] mt-1" style={{ color: 'oklch(0.70 0.03 245)' }}>
          {body}
        </p>
      )}
    </li>
  )
}

/* "há X" em português, compacto */
function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const diff = Date.now() - t
  if (diff < 60_000) return 'agora'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `há ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d}d`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `há ${mo}mo`
  const y = Math.floor(mo / 12)
  return `há ${y}a`
}
