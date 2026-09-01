'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PROJECTS as MOCK_PROJECTS } from '../_data/projects'
import { getEditorId } from '../_data/freelancer-profile'

// Parse do bloco __META__…__/META__ nas mensagens das notificações da RL.
function parseNotifMeta(mensagem: string): any {
  const m = (mensagem ?? '').match(/^__META__(.*?)__\/META__/s)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

const SEEN_TRABALHOS_KEY = 'painel-editor-seen-trabalhos'

// ──────────────────────────────────────────────────────────────────────
//  Sineta de notificações — shared component
//  Mostra unseen projects + unseen tasks de localStorage.
//  Usado em todas as páginas de /painel-editor.
// ──────────────────────────────────────────────────────────────────────

type Notif = {
  id: string
  type: 'projeto' | 'tarefa' | 'mensagem' | 'trabalho' | 'decisao'
  title: string
  sub: string
  href: string
}

const SEEN_DECISOES_KEY = 'painel-editor-seen-decisoes'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [mounted, setMounted] = useState(false)
  // Trabalhos reais enviados pela RL (tabela freelancer_notificacoes, tipo relatorio_editor)
  const [trabalhos, setTrabalhos] = useState<any[]>([])
  // Decisões do admin sobre o vídeo (aprovado / rever alterações)
  const [decisoes, setDecisoes] = useState<any[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number; left?: number }>({ top: 0, right: 0 })

  useEffect(() => { setMounted(true) }, [])

  // Calcula a posição do popover relativa ao botão (para usar fixed via portal)
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
        top: rect.bottom + 8,                          // 8px abaixo do botão
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

  // Re-fetch on mount + on window focus (cobre mudanças em outras tabs/páginas)
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

  // Busca os trabalhos reais que a RL enviou a este editor (sino acende quando
  // chega trabalho novo). Refaz no mount e sempre que o tick muda (focus/storage).
  useEffect(() => {
    const id = getEditorId()
    if (!id) return
    let cancelled = false
    fetch(`/api/painel-editor/projetos?freelancer=${id}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setTrabalhos(Array.isArray(d?.jobs) ? d.jobs : []) })
      .catch(() => {})
    fetch(`/api/painel-editor/minhas-notificacoes?freelancer=${id}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setDecisoes(Array.isArray(d?.notifs) ? d.notifs : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tick])

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-notif-root]')) return
      setOpen(false)
    }
    const id = setTimeout(() => document.addEventListener('click', close), 0)
    return () => { clearTimeout(id); document.removeEventListener('click', close) }
  }, [open])

  const notifications = useMemo<Notif[]>(() => {
    if (typeof window === 'undefined') return []
    const items: Notif[] = []
    try {
      // 0) Trabalhos reais enviados pela RL (notificações da BD) ainda não vistos
      const seenTrabRaw = localStorage.getItem(SEEN_TRABALHOS_KEY)
      const seenTrab = new Set<string>(seenTrabRaw ? JSON.parse(seenTrabRaw) : [])
      trabalhos.forEach(j => {
        const tid = j.notifId ?? j.referencia ?? j.evento_id
        if (!tid || seenTrab.has(tid)) return
        const dia = j.data_casamento
          ? new Date(j.data_casamento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
          : null
        items.push({
          id: `trab-${tid}`,
          type: 'trabalho',
          title: j.noivos || j.local || 'Novo trabalho de edição',
          sub: [j.local, dia].filter(Boolean).join(' · ') || 'Conteúdo para editar disponível',
          href: '/painel-editor',
        })
      })

      // 0b) Decisões do admin sobre o vídeo (aprovado / rever alterações)
      const seenDecRaw = localStorage.getItem(SEEN_DECISOES_KEY)
      const seenDec = new Set<string>(seenDecRaw ? JSON.parse(seenDecRaw) : [])
      decisoes.forEach(d => {
        if (!d?.id || seenDec.has(d.id)) return
        const aprovado = d.tipo === 'video_aprovado'
        items.push({
          id: `dec-${d.id}`,
          type: 'decisao',
          title: aprovado ? 'Vídeo aprovado ✅' : 'Vídeo — rever alterações',
          sub: [d.noivos || d.local, aprovado ? 'O admin aprovou o teu vídeo' : (d.feedback || 'O admin pediu alterações')].filter(Boolean).join(' · '),
          href: d.referencia ? `/painel-editor/novos-projetos?open=${d.referencia}` : '/painel-editor/novos-projetos',
        })
      })

      // 1) Projetos não vistos
      const unseenProjRaw = localStorage.getItem('painel-editor-unseen-projects')
      const unseenProjIds: string[] = unseenProjRaw ? JSON.parse(unseenProjRaw) : []
      const userProjRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userProjRaw ? JSON.parse(userProjRaw) : []

      unseenProjIds.forEach(id => {
        // procura primeiro nos user-projects, depois nos mocks
        const up = userProjects.find(p => p.id === id)
        const mp = up || MOCK_PROJECTS.find(p => p.id === id)
        if (!mp) return
        items.push({
          id: `proj-${id}`,
          type: 'projeto',
          title: (mp as any).noivos || 'Novo projeto',
          sub: (mp as any).dataCasamento
            ? `Casamento · ${(mp as any).dataCasamento}`
            : 'Novo projeto recebido',
          href: `/painel-editor/novos-projetos?open=${id}`,
        })
      })

      // 2) Tarefas não vistas
      const unseenTaskRaw = localStorage.getItem('painel-editor-unseen-tasks')
      const unseenTaskIds = new Set<string>(unseenTaskRaw ? JSON.parse(unseenTaskRaw) : [])
      const userTasksRaw = localStorage.getItem('painel-editor-user-tasks')
      const userTasks: any[] = userTasksRaw ? JSON.parse(userTasksRaw) : []
      const delRaw = localStorage.getItem('painel-editor-deleted-tasks')
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])

      userTasks
        .filter(t => unseenTaskIds.has(t.id) && !deleted.has(t.id))
        .forEach(t => {
          const projNome = t.projectId
            ? (userProjects.find(up => up.id === t.projectId)?.noivos
                || MOCK_PROJECTS.find(p => p.id === t.projectId)?.noivos)
            : null
          items.push({
            id: `task-${t.id}`,
            type: 'tarefa',
            title: t.title,
            sub: projNome ? `${projNome} · Prazo ${t.deadline || '—'}` : `Prazo ${t.deadline || '—'}`,
            href: '/painel-editor/tarefas',
          })
        })

      // 3) Mensagens não lidas (varre todas as chaves painel-editor-mensagens-{projectId})
      const projectNameById = new Map<string, { nome: string; foto?: string }>()
      userProjects.forEach((p: any) => { if (p?.id) projectNameById.set(p.id, { nome: p.noivos || 'Projeto', foto: p.foto }) })
      MOCK_PROJECTS.forEach(p => { if (!projectNameById.has(p.id)) projectNameById.set(p.id, { nome: p.noivos, foto: p.foto }) })

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('painel-editor-mensagens-')) continue
        if (key.includes('-seen-')) continue   // skip seen counters
        const projectId = key.replace('painel-editor-mensagens-', '')
        try {
          const arr: any[] = JSON.parse(localStorage.getItem(key) || '[]')
          if (arr.length === 0) continue
          const seenAdmin = Number(localStorage.getItem(`painel-editor-mensagens-seen-admin-${projectId}`) ?? 0)
          const seenFree  = Number(localStorage.getItem(`painel-editor-mensagens-seen-freelancer-${projectId}`) ?? 0)
          const minSeen = Math.min(seenAdmin, seenFree)
          const unread = arr.length - minSeen
          if (unread <= 0) continue
          const proj = projectNameById.get(projectId)
          if (!proj) continue
          // Mostra a última mensagem como preview
          const last = arr[arr.length - 1]
          const preview = (last?.texto || '').slice(0, 60) + ((last?.texto || '').length > 60 ? '…' : '')
          items.push({
            id: `msg-${projectId}`,
            type: 'mensagem',
            title: proj.nome,
            sub: `${unread} nova${unread === 1 ? '' : 's'} · ${preview}`,
            href: `/painel-editor/novos-projetos?open=${projectId}&chat=1`,
          })
        } catch {}
      }
    } catch {}
    return items
  }, [tick, trabalhos, decisoes])

  function clearOne(notifId: string) {
    try {
      if (notifId.startsWith('trab-')) {
        const id = notifId.replace('trab-', '')
        const raw = localStorage.getItem(SEEN_TRABALHOS_KEY)
        const arr: string[] = raw ? JSON.parse(raw) : []
        if (!arr.includes(id)) arr.push(id)
        localStorage.setItem(SEEN_TRABALHOS_KEY, JSON.stringify(arr))
      } else if (notifId.startsWith('dec-')) {
        const id = notifId.replace('dec-', '')
        const raw = localStorage.getItem(SEEN_DECISOES_KEY)
        const arr: string[] = raw ? JSON.parse(raw) : []
        if (!arr.includes(id)) arr.push(id)
        localStorage.setItem(SEEN_DECISOES_KEY, JSON.stringify(arr))
      } else if (notifId.startsWith('proj-')) {
        const id = notifId.replace('proj-', '')
        const raw = localStorage.getItem('painel-editor-unseen-projects')
        const arr: string[] = raw ? JSON.parse(raw) : []
        localStorage.setItem('painel-editor-unseen-projects', JSON.stringify(arr.filter(x => x !== id)))
      } else if (notifId.startsWith('task-')) {
        const id = notifId.replace('task-', '')
        const raw = localStorage.getItem('painel-editor-unseen-tasks')
        const arr: string[] = raw ? JSON.parse(raw) : []
        localStorage.setItem('painel-editor-unseen-tasks', JSON.stringify(arr.filter(x => x !== id)))
      } else if (notifId.startsWith('msg-')) {
        // Marca msgs do projeto como vistas pelos dois lados
        const projectId = notifId.replace('msg-', '')
        const arr: any[] = JSON.parse(localStorage.getItem(`painel-editor-mensagens-${projectId}`) || '[]')
        localStorage.setItem(`painel-editor-mensagens-seen-admin-${projectId}`, String(arr.length))
        localStorage.setItem(`painel-editor-mensagens-seen-freelancer-${projectId}`, String(arr.length))
      }
      setTick(t => t + 1)
    } catch {}
  }

  function clearAll() {
    try {
      // Marca todos os trabalhos atuais como vistos
      const trabIds = trabalhos.map(j => j.notifId ?? j.referencia ?? j.evento_id).filter(Boolean)
      if (trabIds.length) {
        const raw = localStorage.getItem(SEEN_TRABALHOS_KEY)
        const arr: string[] = raw ? JSON.parse(raw) : []
        localStorage.setItem(SEEN_TRABALHOS_KEY, JSON.stringify(Array.from(new Set([...arr, ...trabIds]))))
      }
      const decIds = decisoes.map(d => d.id).filter(Boolean)
      if (decIds.length) {
        const raw = localStorage.getItem(SEEN_DECISOES_KEY)
        const arr: string[] = raw ? JSON.parse(raw) : []
        localStorage.setItem(SEEN_DECISOES_KEY, JSON.stringify(Array.from(new Set([...arr, ...decIds]))))
      }
      localStorage.setItem('painel-editor-unseen-projects', JSON.stringify([]))
      localStorage.setItem('painel-editor-unseen-tasks', JSON.stringify([]))
      // Marca todas as conversas como totalmente lidas
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

  const count = notifications.length

  // Popover JSX (renderizado via portal para escapar de overflow:hidden dos pais)
  const popover = open && (
    <div
      data-notif-root
      className="fixed max-h-[400px] rounded-2xl border border-gold/25 overflow-hidden"
      style={{
        top: pos.top,
        right: pos.right,
        left: pos.left,
        width: pos.left !== undefined ? undefined : 340,
        zIndex: 9999,
        background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.7), 0 0 30px -8px rgba(201,164,92,0.3)',
      }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <p className="text-[11px] tracking-[0.3em] uppercase text-gold/70 font-bold">Notificações</p>
        {count > 0 && (
          <button onClick={clearAll}
            className="text-[10px] tracking-widest uppercase text-white/40 hover:text-gold transition-colors">
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {count === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-gold/30 text-3xl font-serif mb-2">✓</p>
            <p className="text-[12px] text-white/45">Tudo em dia.</p>
            <p className="text-[10px] text-white/25 mt-1">Sem notificações novas.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map(n => (
              <Link key={n.id} href={n.href}
                onClick={() => { clearOne(n.id); setOpen(false) }}
                className="block px-4 py-3 hover:bg-gold/[0.04] transition-colors group">
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold shrink-0 mt-0.5 ${
                    n.type === 'trabalho'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : n.type === 'projeto'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : n.type === 'tarefa'
                          ? 'bg-gold/15 text-gold border-gold/30'
                          : n.type === 'decisao'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {n.type === 'trabalho' ? '🎬 Trabalho' : n.type === 'projeto' ? '◫ Projeto' : n.type === 'tarefa' ? '◷ Tarefa' : n.type === 'decisao' ? '🎞 Vídeo' : '💬 Mensagem'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0 animate-pulse"
                    style={{ boxShadow: '0 0 6px rgba(201,164,92,0.7)' }} />
                </div>
                <p className="text-[13px] font-medium text-white/90 mt-1.5 leading-tight">{n.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{n.sub}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {count > 0 && (
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/30 flex items-center justify-between">
          <p className="text-[10px] text-white/35">{count} nova{count === 1 ? '' : 's'}</p>
          <Link href="/painel-editor/tarefas" onClick={() => setOpen(false)}
            className="text-[10px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">
            Ver todas →
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
        data-notif-root
        onClick={() => setOpen(v => !v)}
        className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center group">
        <span className={`text-lg ${count > 0 ? 'text-gold animate-pulse' : 'text-white/70 group-hover:text-gold'}`}>🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black"
            style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}>
            {count}
          </span>
        )}
      </button>

      {mounted && popover && createPortal(popover, document.body)}
    </>
  )
}
