'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PROJECTS as MOCK_PROJECTS } from '../_data/projects'

// ──────────────────────────────────────────────────────────────────────
//  Sineta de Mensagens — componente partilhado
//  Mostra conversas com mensagens não lidas (em qualquer dos lados).
//  Click numa conversa → abre o chat desse projeto.
// ──────────────────────────────────────────────────────────────────────

type Conversa = {
  projectId: string
  projectName: string
  projectFoto?: string
  unreadCount: number
  lastTexto: string
  lastAutor: 'Admin' | 'Freelancer'
  lastTs: number
}

export function MessagesBell() {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number; left?: number }>({ top: 0, right: 0 })

  useEffect(() => { setMounted(true) }, [])

  // Refresh on focus + storage event (cross-tab)
  useEffect(() => {
    setTick(t => t + 1)
    const onFocus = () => setTick(t => t + 1)
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [])

  // Posição do popover (fixed via portal — evita overflow:hidden dos pais)
  useEffect(() => {
    if (!open) return
    function updatePos() {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      // Em ecrã estreito o painel não cabe alinhado pelo botão: ancorado à
      // direita do sino, transbordava para fora do ecrã pela esquerda. Aí
      // ocupa a largura toda, com margem dos dois lados.
      const estreito = window.innerWidth < 640
      setPos({
        top: rect.bottom + 8,
        right: estreito ? 12 : Math.max(8, window.innerWidth - rect.right),
        left: estreito ? 12 : undefined,
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open])

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-messages-root]')) return
      setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener('click', close), 0)
    return () => { clearTimeout(id); document.removeEventListener('click', close) }
  }, [open])

  const conversas = useMemo<Conversa[]>(() => {
    if (typeof window === 'undefined') return []
    const out: Conversa[] = []
    try {
      const userProjRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userProjRaw ? JSON.parse(userProjRaw) : []
      const projectLookup = new Map<string, { nome: string; foto?: string }>()
      userProjects.forEach(p => { if (p?.id) projectLookup.set(p.id, { nome: p.noivos || 'Projeto', foto: p.foto }) })
      MOCK_PROJECTS.forEach(p => { if (!projectLookup.has(p.id)) projectLookup.set(p.id, { nome: p.noivos, foto: p.foto }) })

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('painel-editor-mensagens-')) continue
        if (key.includes('-seen-')) continue
        const projectId = key.replace('painel-editor-mensagens-', '')
        try {
          const arr: any[] = JSON.parse(localStorage.getItem(key) || '[]')
          if (arr.length === 0) continue
          const seenAdmin = Number(localStorage.getItem(`painel-editor-mensagens-seen-admin-${projectId}`) ?? 0)
          const seenFree  = Number(localStorage.getItem(`painel-editor-mensagens-seen-freelancer-${projectId}`) ?? 0)
          const unread = arr.length - Math.min(seenAdmin, seenFree)
          if (unread <= 0) continue
          const proj = projectLookup.get(projectId)
          if (!proj) continue
          const last = arr[arr.length - 1]
          out.push({
            projectId,
            projectName: proj.nome,
            projectFoto: proj.foto,
            unreadCount: unread,
            lastTexto: String(last?.texto || ''),
            lastAutor: last?.autor === 'Freelancer' ? 'Freelancer' : 'Admin',
            lastTs: Number(last?.ts || 0),
          })
        } catch {}
      }
    } catch {}
    // Mais recentes em cima
    return out.sort((a, b) => b.lastTs - a.lastTs)
  }, [tick])

  function clearOne(projectId: string) {
    try {
      const arr: any[] = JSON.parse(localStorage.getItem(`painel-editor-mensagens-${projectId}`) || '[]')
      localStorage.setItem(`painel-editor-mensagens-seen-admin-${projectId}`, String(arr.length))
      localStorage.setItem(`painel-editor-mensagens-seen-freelancer-${projectId}`, String(arr.length))
      setTick(t => t + 1)
    } catch {}
  }

  function clearAll() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('painel-editor-mensagens-') || key.includes('-seen-')) continue
        const projectId = key.replace('painel-editor-mensagens-', '')
        const arr: any[] = JSON.parse(localStorage.getItem(key) || '[]')
        localStorage.setItem(`painel-editor-mensagens-seen-admin-${projectId}`, String(arr.length))
        localStorage.setItem(`painel-editor-mensagens-seen-freelancer-${projectId}`, String(arr.length))
      }
      setTick(t => t + 1)
    } catch {}
  }

  function fmtTime(ts: number): string {
    if (!ts) return ''
    const d = new Date(ts)
    const today = new Date()
    const sameDay = d.toDateString() === today.toDateString()
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    if (sameDay) return `${hh}:${mi}`
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  }

  const count = conversas.length

  // Popover renderizado via portal (evita overflow:hidden dos pais)
  const popover = open && (
    <div
      data-messages-root
      className="fixed max-h-[440px] rounded-2xl border border-emerald-500/30 overflow-hidden"
      style={{
        top: pos.top,
        right: pos.right,
        left: pos.left,
        width: pos.left !== undefined ? undefined : 360,
        zIndex: 9999,
        background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.7), 0 0 30px -8px rgba(52,211,153,0.25)',
      }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <p className="text-[11px] tracking-[0.3em] uppercase text-emerald-300/80 font-bold">Mensagens</p>
        {count > 0 && (
          <button onClick={clearAll}
            className="text-[10px] tracking-widest uppercase text-white/40 hover:text-emerald-300 transition-colors">
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
        {count === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-emerald-300/30 text-3xl font-serif mb-2">💬</p>
            <p className="text-[12px] text-white/45">Sem mensagens novas.</p>
            <p className="text-[10px] text-white/25 mt-1">Quando o freelancer ou admin escreve, aparece aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {conversas.map(c => (
              <Link key={c.projectId} href={`/painel-editor/novos-projetos?open=${c.projectId}&chat=1`}
                onClick={() => { clearOne(c.projectId); setOpen(false) }}
                className="block px-4 py-3 hover:bg-emerald-500/[0.04] transition-colors group">
                <div className="flex items-center gap-3">
                  {/* Thumb */}
                  {c.projectFoto ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/30 shrink-0">
                      <img src={c.projectFoto} alt={c.projectName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-300 shrink-0">💬</div>
                  )}
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-white truncate">{c.projectName}</p>
                      <span className="text-[10px] text-white/30 shrink-0 tabular-nums">{fmtTime(c.lastTs)}</span>
                    </div>
                    <p className="text-[11px] text-white/55 truncate">
                      <span className={c.lastAutor === 'Admin' ? 'text-gold/85' : 'text-blue-300/85'}>
                        {c.lastAutor === 'Admin' ? '👑' : '✎'}
                      </span>{' '}
                      {c.lastTexto}
                    </p>
                  </div>
                  {/* Badge unread */}
                  <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold"
                    style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }}>
                    {c.unreadCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {count > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/30 flex items-center justify-between">
          <p className="text-[10px] text-white/35">{count} conversa{count === 1 ? '' : 's'}</p>
          <Link href="/painel-editor/novos-projetos" onClick={() => setOpen(false)}
            className="text-[10px] tracking-widest uppercase text-emerald-300/80 hover:text-emerald-300 transition-colors">
            Ver projetos →
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-messages-root
        onClick={() => setOpen(v => !v)}
        title="Mensagens"
        className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-emerald-500/40 transition-all flex items-center justify-center group">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`${count > 0 ? 'text-emerald-300 animate-pulse' : 'text-white/70 group-hover:text-emerald-300'}`}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center border border-black"
            style={{ boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}>
            {count}
          </span>
        )}
      </button>

      {mounted && popover && createPortal(popover, document.body)}
    </>
  )
}
