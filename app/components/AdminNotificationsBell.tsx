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
  referencia?: string | null
  urls?: {
    selecao?: string | null
    provas?: string | null
    editadas?: string | null
    album?: string | null
  }
  status?: {
    selecao?: string | null
    provas?: string | null
    editadas?: string | null
    album?: string | null
  }
  mensagem?: string | null
}

const LS_KEY = 'admin_notif_last_seen'
const LS_DISMISSED = 'admin_notif_dismissed'

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_DISMISSED)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch { return new Set() }
}
function saveDismissed(s: Set<string>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_DISMISSED, JSON.stringify(Array.from(s))) } catch {}
}

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
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showHistory, setShowHistory] = useState(false)
  const [previewNotif, setPreviewNotif] = useState<Notif | null>(null)
  // Pesquisa + filtro de referência (só usado em modo histórico)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRef, setFilterRef] = useState<string>('')
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Load last seen + dismissed do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLastSeen(localStorage.getItem(LS_KEY))
    setDismissed(loadDismissed())
  }, [])

  function dismissOne(id: string) {
    setDismissed(prev => {
      const next = new Set(prev); next.add(id); saveDismissed(next); return next
    })
  }
  function restoreOne(id: string) {
    setDismissed(prev => {
      const next = new Set(prev); next.delete(id); saveDismissed(next); return next
    })
  }
  function restoreAll() {
    setDismissed(prev => { const next = new Set<string>(); saveDismissed(next); return next })
  }

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

  // Lista visível na vista principal (exclui dispensadas)
  const visibleNotifs = notifs.filter(n => !dismissed.has(n.id))
  // Contador de não lidas usa só as visíveis para não 'piscar' por notifs antigas dispensadas
  const unreadCount = lastSeen
    ? visibleNotifs.filter(n => (n.sent_at || '') > lastSeen).length
    : visibleNotifs.length

  // Lista a renderizar conforme o modo
  // No histórico aplicamos pesquisa de texto + filtro de referência
  const baseList = showHistory ? notifs : visibleNotifs
  const q = searchQuery.trim().toLowerCase()
  const listToRender = baseList.filter(n => {
    if (filterRef && (n.referencia ?? '') !== filterRef) return false
    if (!q) return true
    const haystack = [
      n.tipo_label, n.tipo, n.freelancer_nome, n.local, n.referencia, n.mensagem,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })
  // Lista única de referências disponíveis para o dropdown
  const refOptions = Array.from(new Set(baseList.map(n => n.referencia).filter(Boolean))) as string[]
  refOptions.sort()

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
              <p className="text-[11px] tracking-[0.35em] uppercase text-gold/85 font-semibold">
                {showHistory ? 'Histórico' : 'Notificações'}
              </p>
              {!showHistory && unreadCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 tracking-wider uppercase font-bold">
                  {unreadCount} novas
                </span>
              )}
              {showHistory && dismissed.size > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 border border-white/15 tracking-wider uppercase font-bold">
                  {dismissed.size} arquivada{dismissed.size === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!showHistory && unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="text-[9px] tracking-wider uppercase text-white/40 hover:text-gold transition-colors">
                  Marcar lidas
                </button>
              )}
              <button onClick={() => { setShowHistory(s => !s); setSearchQuery(''); setFilterRef('') }}
                className="text-[9px] tracking-wider uppercase text-white/40 hover:text-gold transition-colors">
                {showHistory ? '← Voltar' : 'Ver todas'}
              </button>
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                title="Fechar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Sub-header em modo histórico */}
          {showHistory && dismissed.size > 0 && (
            <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
              <p className="text-[10px] text-white/35 italic">Notificações arquivadas aparecem aqui. Carrega em ↺ para restaurar.</p>
              <button onClick={restoreAll}
                className="text-[9px] tracking-wider uppercase text-white/45 hover:text-gold transition-colors">
                Restaurar todas
              </button>
            </div>
          )}

          {/* ── Pesquisa + Filtro por referência (só em modo histórico) ── */}
          {showHistory && (
            <div className="px-4 py-3 border-b border-white/[0.05] bg-black/30 space-y-2">
              {/* Caixa pesquisa */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-[12px] pointer-events-none">🔍</span>
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar notificações…"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-7 pr-7 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-gold/45 transition-colors" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors text-[14px]"
                    title="Limpar pesquisa">×</button>
                )}
              </div>
              {/* Filtro referência */}
              <div className="flex items-center gap-2">
                <label className="text-[9px] tracking-[0.3em] uppercase text-gold/55 shrink-0">Referência</label>
                <select value={filterRef} onChange={e => setFilterRef(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-gold/45 [color-scheme:dark] transition-colors">
                  <option value="" className="bg-neutral-900">Todas ({refOptions.length})</option>
                  {refOptions.map(ref => (
                    <option key={ref} value={ref} className="bg-neutral-900">{ref}</option>
                  ))}
                </select>
                {(filterRef || searchQuery) && (
                  <button onClick={() => { setFilterRef(''); setSearchQuery('') }}
                    className="text-[9px] tracking-wider uppercase text-white/40 hover:text-gold transition-colors px-2 py-1 rounded border border-white/10 hover:border-gold/30 whitespace-nowrap">
                    Limpar
                  </button>
                )}
              </div>
              {/* Contagem dos resultados */}
              {(filterRef || searchQuery) && (
                <p className="text-[9px] text-white/40 italic">
                  {listToRender.length} resultado{listToRender.length === 1 ? '' : 's'}{filterRef ? ` para ${filterRef}` : ''}
                </p>
              )}
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {listToRender.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl opacity-20 mb-2">✉</p>
                <p className="text-[11px] text-white/35 italic">
                  {showHistory ? 'Sem histórico' : 'Sem notificações'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {listToRender.map(n => {
                  const isUnread = !lastSeen || (n.sent_at || '') > lastSeen
                  const isDismissed = dismissed.has(n.id)
                  return (
                    <div key={n.id}
                      className={`relative group transition-colors ${isDismissed ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
                      <div className="block px-4 py-3 pr-10">
                        <div className="flex items-start gap-3">
                          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[14px] mt-0.5 ${
                            isUnread && !isDismissed ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                          }`}>
                            {n.tipo_icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className={`text-[12px] font-semibold truncate ${isUnread && !isDismissed ? 'text-white' : 'text-white/65'}`}>
                                {n.tipo_label}
                              </p>
                              {isUnread && !isDismissed && (
                                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5"
                                  style={{ boxShadow: '0 0 6px rgba(201,164,92,0.8)' }} />
                              )}
                            </div>
                            <p className="text-[11px] text-white/60 truncate">{n.freelancer_nome} · {n.local}</p>
                            {/* Chip referência + botão Ver Mais */}
                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              {n.referencia ? (
                                <span className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded font-bold bg-gold/10 text-gold/85 border border-gold/30">
                                  {n.referencia}
                                </span>
                              ) : (
                                <span className="text-[10px] text-white/30">{fmtRel(n.sent_at)}</span>
                              )}
                              <button onClick={() => setPreviewNotif(n)}
                                className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/45 hover:text-gold border border-white/10 hover:border-gold/40 px-2 py-0.5 rounded transition-all">
                                Ver Mais
                              </button>
                            </div>
                            {n.referencia && <p className="text-[9px] text-white/30 mt-1">{fmtRel(n.sent_at)}</p>}
                          </div>
                        </div>
                      </div>
                      {/* Botão arquivar/restaurar — separado para não navegar */}
                      {isDismissed ? (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); restoreOne(n.id) }}
                          title="Restaurar"
                          className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors opacity-60 group-hover:opacity-100">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1015-6.7L21 8M21 3v5h-5"/></svg>
                        </button>
                      ) : (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissOne(n.id) }}
                          title="Arquivar (fica no histórico)"
                          className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal Preview · Ver Mais ──────────────────────────── */}
      {previewNotif && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setPreviewNotif(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden border border-gold/30"
            style={{ background: 'linear-gradient(180deg, #100c08, #0b0905)', boxShadow: '0 30px 70px -10px rgba(0,0,0,0.85), 0 0 30px -8px rgba(201,164,92,0.35)' }}
            onClick={e => e.stopPropagation()}>
            {/* Linha gold topo */}
            <div className="h-0.5 w-full bg-gold/65" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl border border-gold/35 bg-gold/[0.08] flex items-center justify-center text-gold text-base shrink-0"
                  style={{ boxShadow: '0 0 18px -6px rgba(201,164,92,0.5)' }}>
                  {previewNotif.tipo_icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.4em] text-gold/65 uppercase mb-1">{previewNotif.tipo_label}</p>
                  <h3 className="text-lg text-white font-light tracking-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
                    {previewNotif.local}
                  </h3>
                </div>
              </div>
              <button onClick={() => setPreviewNotif(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-all shrink-0"
                title="Fechar (Esc)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Meta info: referência · membro · data · sent */}
              <div className="grid grid-cols-2 gap-3">
                {previewNotif.referencia && (
                  <div className="p-3 rounded-xl border border-gold/25 bg-gold/[0.05]">
                    <p className="text-[9px] tracking-[0.35em] text-gold/65 uppercase mb-1">Referência</p>
                    <p className="text-[14px] text-gold font-bold tracking-wide font-mono">{previewNotif.referencia}</p>
                  </div>
                )}
                <div className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.025]">
                  <p className="text-[9px] tracking-[0.35em] text-white/45 uppercase mb-1">Membro</p>
                  <p className="text-[13px] text-white/90 font-medium truncate">{previewNotif.freelancer_nome}</p>
                </div>
                {previewNotif.data_casamento && (
                  <div className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.025]">
                    <p className="text-[9px] tracking-[0.35em] text-white/45 uppercase mb-1">Data do Evento</p>
                    <p className="text-[13px] text-white/90 font-medium tabular-nums">
                      {new Date(previewNotif.data_casamento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.025]">
                  <p className="text-[9px] tracking-[0.35em] text-white/45 uppercase mb-1">Enviado</p>
                  <p className="text-[13px] text-white/90 font-medium">{fmtRel(previewNotif.sent_at)}</p>
                </div>
              </div>

              {/* Mensagem (se existir) */}
              {previewNotif.mensagem && (
                <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-[9px] tracking-[0.35em] text-white/40 uppercase mb-1.5">Mensagem</p>
                  <p className="text-[12px] text-white/75 leading-relaxed whitespace-pre-wrap">{previewNotif.mensagem}</p>
                </div>
              )}

              {/* Entregas (URLs) */}
              {previewNotif.urls && Object.values(previewNotif.urls).some(u => !!u) && (
                <div>
                  <p className="text-[9px] tracking-[0.4em] text-gold/60 uppercase font-bold mb-2">Entregas do Evento</p>
                  <div className="space-y-1.5">
                    {([
                      { key: 'selecao',  label: 'Seleção de Fotos', icon: '◫', color: 'gold' },
                      { key: 'provas',   label: 'Fotos Prova',      icon: '◧', color: 'blue' },
                      { key: 'editadas', label: 'Fotos Editadas',   icon: '✓', color: 'emerald' },
                      { key: 'album',    label: 'Maquete Álbum',    icon: '◐', color: 'purple' },
                    ] as const).map(item => {
                      const url = previewNotif.urls?.[item.key]
                      const status = previewNotif.status?.[item.key]
                      const cls = {
                        gold:    'border-gold/30 bg-gold/[0.05] text-gold',
                        blue:    'border-blue-500/30 bg-blue-500/[0.05] text-blue-300',
                        emerald: 'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300',
                        purple:  'border-purple-500/30 bg-purple-500/[0.05] text-purple-300',
                      }[item.color]
                      return (
                        <div key={item.key} className={`rounded-lg border ${url ? cls : 'border-white/[0.05] bg-white/[0.015]'}`}>
                          {/* Cabeçalho da entrega */}
                          <div className="flex items-center justify-between gap-3 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[12px] ${url ? '' : 'text-white/25'}`}>{item.icon}</span>
                              <p className={`text-[11px] tracking-wider uppercase font-bold truncate ${url ? '' : 'text-white/30'}`}>{item.label}</p>
                              {status && (
                                <span className="text-[8px] tracking-wider uppercase font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-white/55 border border-white/10 shrink-0">
                                  {status}
                                </span>
                              )}
                            </div>
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer"
                                className="text-[9px] tracking-[0.2em] uppercase font-bold px-2.5 py-1 rounded-md border border-current opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
                                Abrir ↗
                              </a>
                            ) : (
                              <span className="text-[9px] text-white/25 italic">—</span>
                            )}
                          </div>
                          {/* URL copiável (só se houver) */}
                          {url && (
                            <div className="flex items-center gap-2 px-3 pb-2 pt-0">
                              <input type="text" readOnly value={url}
                                onClick={e => (e.target as HTMLInputElement).select()}
                                className="flex-1 bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-[10px] font-mono text-white/75 outline-none focus:border-white/25 truncate" />
                              <button
                                onClick={async (e) => {
                                  try {
                                    await navigator.clipboard.writeText(url)
                                    const btn = e.currentTarget
                                    const orig = btn.textContent
                                    btn.textContent = '✓'
                                    btn.classList.add('!text-emerald-300', '!border-emerald-500/40', '!bg-emerald-500/10')
                                    setTimeout(() => {
                                      btn.textContent = orig ?? '⎘'
                                      btn.classList.remove('!text-emerald-300', '!border-emerald-500/40', '!bg-emerald-500/10')
                                    }, 1500)
                                  } catch {}
                                }}
                                title="Copiar URL"
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/55 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all text-[12px] shrink-0">
                                ⎘
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/[0.05] bg-black/30 flex items-center justify-between gap-3">
              <a href={`/freelancers/${previewNotif.freelancer_id}`}
                className="text-[10px] tracking-[0.25em] uppercase font-bold text-gold/85 hover:text-gold transition-colors">
                Ir à ficha do membro →
              </a>
              <button onClick={() => setPreviewNotif(null)}
                className="px-4 py-1.5 rounded-lg text-[10px] tracking-widest uppercase font-bold text-white/55 hover:text-white border border-white/15 hover:border-white/30 transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
