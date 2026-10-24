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
  const [viewMode, setViewMode] = useState<'new' | 'history'>('new')
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const prevOpenRef = useRef(false)

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
    setOpen(o => !o)
  }

  // Marca tudo como lido só QUANDO o dropdown fecha (assim o user
  // vê as novas notificações ao abrir, e elas só desaparecem no
  // próximo open).
  useEffect(() => {
    if (prevOpenRef.current && !open && notifs.length > 0) {
      const latest = notifs[0]?.at ?? new Date().toISOString()
      setReadAt(latest)
      try { localStorage.setItem(STORAGE_KEY_PREFIX + portalRef, latest) } catch { /* noop */ }
      setViewMode('new') // reset view mode para próxima abertura
    }
    prevOpenRef.current = open
  }, [open, notifs, portalRef])

  const unread = readAt
    ? notifs.filter(n => String(n?.at ?? '') > readAt).length
    : notifs.length

  // Lista visível: 'new' mostra só não-lidas; 'history' mostra todas
  const visible = viewMode === 'history'
    ? notifs
    : (readAt
        ? notifs.filter(n => String(n?.at ?? '') > readAt)
        : notifs)
  const historyCount = notifs.length - (readAt ? notifs.filter(n => String(n?.at ?? '') > readAt).length : notifs.length)

  return (
    <div ref={wrapperRef} className="relative rlp">
      {/* Botão sino: contorno azul quando há por ler */}
      <button
        onClick={handleOpen}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
        className={`relative w-9 h-9 flex items-center justify-center rounded-lg border text-white transition-colors ${
          open
            ? 'bg-[#2e6cf6] border-[#2e6cf6]'
            : unread > 0
              ? 'bg-[#2e6cf6]/20 border-[#2e6cf6] hover:bg-[#2e6cf6]/35'
              : 'bg-[#00141f]/70 border-white/[0.14] hover:border-[#5a8bff]'
        }`}
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
        </svg>
        {unread > 0 && (
          <span aria-hidden
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-[5px] rounded-full flex items-center justify-center text-[10px] font-semibold leading-none bg-[#ff4747] text-white border-2 border-[#00141f]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/[0.14] bg-[#00141f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          style={{ width: 'min(340px, calc(100vw - 20px))' }}
        >
          {/* Cabeçalho + Novas / Histórico */}
          <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="rlp-t text-[16px] leading-none text-white">Notificações</p>
              <span className="rlp-m text-[9px] tracking-[0.15em] text-[#7c8893]">
                {viewMode === 'new' ? `${visible.length} novas` : `${notifs.length} no total`}
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0c2236]/70">
              <TabBtn active={viewMode === 'new'} onClick={() => setViewMode('new')}>
                Novas {viewMode === 'new' && visible.length > 0 ? `· ${visible.length}` : ''}
              </TabBtn>
              <TabBtn active={viewMode === 'history'} onClick={() => setViewMode('history')}>
                Histórico {viewMode === 'history' && notifs.length > 0 ? `· ${notifs.length}` : ''}
              </TabBtn>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="max-h-[380px] overflow-y-auto p-1.5" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <EmptyState text="A carregar…" />
            ) : visible.length === 0 ? (
              viewMode === 'new' ? (
                <EmptyState text={notifs.length > 0
                  ? `Sem novas. Há ${notifs.length} no histórico.`
                  : 'Sem notificações por agora'} />
              ) : (
                <EmptyState text="Sem histórico" />
              )
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                {visible.map((n, i) => {
                  const isRead = readAt ? String(n?.at ?? '') <= readAt : false
                  return (
                    <NotifRow key={i} n={n}
                      fresh={!isRead}
                      faded={viewMode === 'history' && isRead} />
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rlp-m flex-1 px-2.5 py-1.5 rounded-md text-[9px] tracking-[0.18em] transition-colors ${
        active ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

/* ── Sub-componentes ─────────────────────────────────────────── */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <svg className="mx-auto mb-3" width={30} height={30} viewBox="0 0 24 24"
        fill="none" stroke="#5a8bff" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
      </svg>
      <p className="text-[13px] leading-snug text-[#7c8893]">{text}</p>
    </div>
  )
}

function NotifRow({ n, fresh, faded }: { n: Notification; fresh: boolean; faded?: boolean }) {
  // Determina tipo + etiqueta + cor
  const type = String(n.type ?? (n.phase ? 'fase' : 'generic'))
  const isFase = type === 'fase' || !!n.phase
  const isRoadmap = type === 'roadmap-status' || type === 'roadmap'

  // Concluído = azul pálido, em curso = azul, resto = cinza
  let headerLabel = 'Notificação'
  let headerColor = '#5a8bff'
  if (isFase) {
    const ps = n.phase?.state ?? ''
    headerLabel = n.phase?.n ? `Fase ${n.phase.n}` : 'Fase'
    if (ps) {
      const lbl = ps === 'done' ? 'Concluído' : ps === 'doing' ? 'Em curso' : ps === 'pending' ? 'Pendente' : ps
      headerLabel += ` · ${lbl}`
    }
    headerColor = ps === 'done' ? '#a9c1ff' : ps === 'doing' ? '#5a8bff' : '#7c8893'
  } else if (isRoadmap) {
    headerLabel = 'Road Map · Estado'
    const ne = String(n.meta?.novoEstado ?? '')
    headerColor = ne === 'concluido' ? '#a9c1ff'
      : ne === 'em_andamento' ? '#5a8bff'
      : '#7c8893'
  }

  const title = (n.title ?? '').trim() || (isFase ? (n.phase?.name ?? 'Atualização da fase') : 'Atualização')
  const body = (n.body ?? '').trim() || (isFase && n.phase?.date ? `Data: ${n.phase.date}` : '')
  const when = formatRelative(n.at)

  return (
    <li className={`relative rounded-xl pl-7 pr-3 py-2.5 hover:bg-[#0c2236]/70 transition-colors ${faded ? 'opacity-55' : ''}`}>
      {fresh && (
        <span aria-label="Não lida" className="absolute left-3 top-[15px] w-2 h-2 rounded-full bg-[#2e6cf6]" />
      )}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <p className="rlp-m text-[9px] tracking-[0.18em] truncate" style={{ color: headerColor }}>
          {headerLabel}
        </p>
        <span className="text-[11px] text-[#7c8893] shrink-0">{when}</span>
      </div>
      <p className={`text-[13.5px] leading-snug font-medium ${fresh ? 'text-white' : 'text-white/75'}`}>
        {title}
      </p>
      {body && (
        <p className="text-[12px] mt-0.5 text-white/55 leading-snug">{body}</p>
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
