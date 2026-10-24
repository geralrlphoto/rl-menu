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
  const [viewMode, setViewMode] = useState<'new' | 'history'>('new')
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const prevOpenRef = useRef(false)

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
    setOpen(o => !o)
  }

  // Marca tudo como lido só QUANDO o dropdown fecha — assim o user
  // vê as mensagens novas ao abrir, e elas só "desaparecem" do tab
  // Novas no próximo open (mas continuam no Histórico).
  useEffect(() => {
    if (prevOpenRef.current && !open && mensagens.length > 0) {
      const latest = mensagens[0]?.criadoEm ?? new Date().toISOString()
      setReadAt(latest)
      try { localStorage.setItem(STORAGE_KEY_PREFIX + portalRef, latest) } catch { /* noop */ }
      setViewMode('new')
    }
    prevOpenRef.current = open
  }, [open, mensagens, portalRef])

  const unread = readAt
    ? mensagens.filter(m => String(m?.criadoEm ?? '') > readAt).length
    : mensagens.length

  // Lista visível
  const visible = viewMode === 'history'
    ? mensagens
    : (readAt
        ? mensagens.filter(m => String(m?.criadoEm ?? '') > readAt)
        : mensagens)

  return (
    <div ref={wrapperRef} className="relative rlp">
      {/* Botão de mensagens: contorno azul quando há por ler */}
      <button
        onClick={handleOpen}
        aria-label={`Mensagens${unread > 0 ? ` (${unread} não lidas)` : ''}`}
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
          <path d="M4 5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5Z" />
          <path d="M8 10h8M8 13h5" />
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
              <p className="rlp-t text-[16px] leading-none text-white">Mensagens</p>
              <span className="rlp-m text-[9px] tracking-[0.15em] text-[#7c8893]">
                {viewMode === 'new' ? `${visible.length} novas` : `${mensagens.length} no total`}
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0c2236]/70">
              <TabBtn active={viewMode === 'new'} onClick={() => setViewMode('new')}>
                Novas {viewMode === 'new' && visible.length > 0 ? `· ${visible.length}` : ''}
              </TabBtn>
              <TabBtn active={viewMode === 'history'} onClick={() => setViewMode('history')}>
                Histórico {viewMode === 'history' && mensagens.length > 0 ? `· ${mensagens.length}` : ''}
              </TabBtn>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="max-h-[360px] overflow-y-auto p-1.5" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <EmptyMsg text="A carregar…" />
            ) : visible.length === 0 ? (
              viewMode === 'new' ? (
                <EmptyMsg text={mensagens.length > 0
                  ? `Sem novas. Há ${mensagens.length} no histórico.`
                  : 'Sem mensagens por agora'} />
              ) : (
                <EmptyMsg text="Sem histórico" />
              )
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                {visible.slice(0, viewMode === 'history' ? 30 : 8).map((m, i) => {
                  const isRead = readAt ? String(m?.criadoEm ?? '') <= readAt : false
                  return (
                    <MsgRow key={m.id ?? i} m={m}
                      fresh={!isRead}
                      faded={viewMode === 'history' && isRead} />
                  )
                })}
              </ul>
            )}
          </div>

          {/* Rodapé: conversa completa */}
          <Link
            href={`/portal-media/${portalRef}/atendimento`}
            onClick={() => setOpen(false)}
            className="rlp-m block text-center px-4 py-3.5 text-[10px] tracking-[0.22em] text-[#5a8bff] border-t border-white/[0.08] hover:bg-[#2e6cf6]/15 hover:text-white transition-colors"
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
      <svg className="mx-auto mb-3" width={30} height={30} viewBox="0 0 24 24"
        fill="none" stroke="#5a8bff" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5Z" />
      </svg>
      <p className="text-[13px] leading-snug text-[#7c8893]">{text}</p>
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

function MsgRow({ m, fresh, faded }: { m: Mensagem; fresh: boolean; faded?: boolean }) {
  const isAdminMsg = !!m.isAdmin
  const autor = (m.autor ?? '').trim() || (isAdminMsg ? 'RL PROD' : 'Cliente')
  const texto = String(m.texto ?? '').trim() || '—'
  const when = formatRelative(m.criadoEm)

  return (
    <li className={`relative rounded-xl pl-7 pr-3 py-2.5 hover:bg-[#0c2236]/70 transition-colors ${faded ? 'opacity-55' : ''}`}>
      {fresh && (
        <span aria-label="Não lida" className="absolute left-3 top-[15px] w-2 h-2 rounded-full bg-[#2e6cf6]" />
      )}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <p className={`rlp-m text-[9px] tracking-[0.18em] truncate ${isAdminMsg ? 'text-[#5a8bff]' : 'text-[#a9c1ff]'}`}>
          {autor}
        </p>
        <span className="text-[11px] text-[#7c8893] shrink-0">{when}</span>
      </div>
      <p className={`text-[13.5px] leading-snug ${fresh ? 'text-white' : 'text-white/75'}`}
        style={{
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
