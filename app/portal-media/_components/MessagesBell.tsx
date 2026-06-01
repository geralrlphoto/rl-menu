'use client'

/* ============================================================
   MessagesBell — sino de mensagens no top bar do portal.
   Lê /api/media-portal/[ref]/chat. Mostra últimas N mensagens
   em dropdown navy v2 + link "Ver conversa completa" para
   /portal-media/<ref>/atendimento (onde vive o ChatBox).
   ============================================================ */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './portal-top-bar.css'

type Mensagem = {
  id?: string
  texto?: string
  autor?: string
  isAdmin?: boolean
  criadoEm?: string
}

interface Props {
  portalRef: string
}

const STORAGE_KEY_PREFIX = 'pm-msg-read-'

export default function MessagesBell({ portalRef }: Props) {
  const [open, setOpen] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [readAt, setReadAt] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Carrega mensagens + último 'lido'
  useEffect(() => {
    let cancelled = false
    fetch(`/api/media-portal/${portalRef}/chat`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const all: Mensagem[] = Array.isArray(d?.mensagens) ? d.mensagens : []
        // Mais recentes primeiro
        const sorted = [...all].sort((a, b) =>
          String(b?.criadoEm ?? '').localeCompare(String(a?.criadoEm ?? ''))
        )
        setMensagens(sorted)
      })
      .catch(() => { if (!cancelled) setMensagens([]) })
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

  const handleOpen = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && mensagens.length > 0) {
      const latest = mensagens[0]?.criadoEm ?? new Date().toISOString()
      setReadAt(latest)
      try { localStorage.setItem(STORAGE_KEY_PREFIX + portalRef, latest) } catch { /* noop */ }
    }
  }

  // Não-lidas: do admin (cliente vê novas do admin) ou do cliente (admin vê do cliente)
  // Para simplificar mostra todas as posteriores ao último readAt.
  const unread = readAt
    ? mensagens.filter(m => String(m?.criadoEm ?? '') > readAt).length
    : mensagens.length

  return (
    <div ref={wrapperRef} className="relative">
      {/* Botão envelope/mensagem — brilha azul suave quando há por ler */}
      <button
        onClick={handleOpen}
        aria-label={`Mensagens${unread > 0 ? ` (${unread} não lidas)` : ''}`}
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
          <path d="M4 5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5Z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
        {unread > 0 && (
          <span aria-hidden
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-[4px] rounded-full flex items-center justify-center text-[10px] font-bold leading-none"
            style={{
              background: 'oklch(0.66 0.16 30)',
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
            width: 'min(340px, calc(100vw - 20px))',
            background: 'linear-gradient(180deg, #16293a, #122230 60%, #0e1b27)',
            border: '1px solid oklch(0.50 0.03 245 / 0.22)',
            borderRadius: 12,
            boxShadow: '0 18px 40px -12px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3)',
            fontFamily: 'Manrope, system-ui, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid oklch(0.50 0.03 245 / 0.18)' }}>
            <p className="text-[10.5px] tracking-[0.28em] uppercase font-semibold"
              style={{ fontFamily: 'Space Grotesk, Manrope, sans-serif', color: 'oklch(0.80 0.11 245)' }}>
              Mensagens
            </p>
            {mensagens.length > 0 && (
              <span className="text-[10px] tracking-[0.14em] uppercase font-semibold"
                style={{ color: 'oklch(0.58 0.03 245)' }}>
                {mensagens.length}
              </span>
            )}
          </div>

          {/* Conteúdo */}
          <div className="max-h-[360px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <EmptyMsg text="A carregar…" />
            ) : mensagens.length === 0 ? (
              <EmptyMsg text="Sem mensagens por agora" />
            ) : (
              <ul className="m-0 p-0 list-none">
                {mensagens.slice(0, 8).map((m, i) => (
                  <MsgRow key={m.id ?? i} m={m} fresh={!readAt || String(m?.criadoEm ?? '') > (readAt ?? '')} />
                ))}
              </ul>
            )}
          </div>

          {/* Footer com link para conversa completa */}
          <Link
            href={`/portal-media/${portalRef}/atendimento`}
            onClick={() => setOpen(false)}
            className="block text-center px-4 py-3 transition-all duration-150"
            style={{
              borderTop: '1px solid oklch(0.50 0.03 245 / 0.18)',
              fontFamily: 'Space Grotesk, Manrope, sans-serif',
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: 'oklch(0.80 0.11 245)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(0.66 0.13 245 / 0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Abrir conversa →
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────────── */
function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <svg className="mx-auto mb-3" width={32} height={32} viewBox="0 0 24 24"
        fill="none" stroke="oklch(0.50 0.03 245)" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5Z" />
      </svg>
      <p className="text-[12px] leading-snug" style={{ color: 'oklch(0.58 0.03 245)' }}>
        {text}
      </p>
    </div>
  )
}

function MsgRow({ m, fresh }: { m: Mensagem; fresh: boolean }) {
  const isAdminMsg = !!m.isAdmin
  const autor = (m.autor ?? '').trim() || (isAdminMsg ? 'RL PROD' : 'Cliente')
  const texto = String(m.texto ?? '').trim() || '—'
  const when = formatRelative(m.criadoEm)
  const tone = isAdminMsg ? 'oklch(0.80 0.11 245)' : 'oklch(0.72 0.12 165)'

  return (
    <li className="relative px-4 py-3"
      style={{ borderBottom: '1px solid oklch(0.50 0.03 245 / 0.12)' }}>
      {fresh && (
        <span aria-hidden className="absolute left-1.5 top-3 w-1.5 h-1.5 rounded-full"
          style={{ background: 'oklch(0.80 0.11 245)', boxShadow: '0 0 6px oklch(0.66 0.13 245 / .6)' }} />
      )}
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-[10.5px] tracking-[0.18em] uppercase font-bold"
          style={{ fontFamily: 'Space Grotesk, Manrope, sans-serif', color: tone }}>
          {autor}
        </p>
        <span className="text-[10px]" style={{ color: 'oklch(0.58 0.03 245)' }}>{when}</span>
      </div>
      <p className="text-[12.5px] leading-snug font-normal"
        style={{
          color: '#fff',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
        {texto}
      </p>
    </li>
  )
}

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
