'use client'

import { useEffect, useRef, useState } from 'react'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

// ─── TasksWidget ───────────────────────────────────────────────────────────
type TaskItem = { id: string; text: string; done: boolean }

export function TasksWidget({ freelancerId }: { freelancerId: string }) {
  const KEY = `freelancer_${freelancerId}_tasks`
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [novo, setNovo] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setTasks(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [KEY])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(tasks)) } catch {}
  }, [tasks, KEY, loaded])

  function adicionar() {
    const t = novo.trim()
    if (!t) return
    setTasks(prev => [...prev, { id: crypto.randomUUID(), text: t, done: false }])
    setNovo('')
  }
  function toggle(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  function remover(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const pend = tasks.filter(t => !t.done).length
  const concl = tasks.length - pend

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] tracking-[0.4em] text-gold uppercase font-bold">Tarefas</h3>
        <span className="text-[14px] text-white/40">{pend} pend · {concl} ok</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          value={novo}
          onChange={e => setNovo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') adicionar() }}
          placeholder="Nova tarefa…"
          className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40"
        />
        <button
          onClick={adicionar}
          className="px-3 py-2 rounded-lg bg-gold/15 border border-gold/30 text-gold text-[14px] hover:bg-gold/25 transition-all"
        >+</button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[14px] text-white/25 text-center py-3">Sem tarefas. Adiciona uma.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
          {tasks.map(t => (
            <li key={t.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all">
              <button
                onClick={() => toggle(t.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  t.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/20 hover:border-gold/50'
                }`}
              >
                {t.done ? <span className="text-[14px]">✓</span> : null}
              </button>
              <span className={`flex-1 text-[14px] leading-snug ${t.done ? 'line-through text-white/30' : 'text-white/80'}`}>{t.text}</span>
              <button
                onClick={() => remover(t.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-[14px] transition-all"
              >×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── MiniCalendar ──────────────────────────────────────────────────────────
type CasamentoLite = { id: string; data_casamento: string | null }

export function MiniCalendar({
  casamentos,
  taskDates,
  editionDates,
  albumDates,
  notifDates,
  onClickDate,
}: {
  casamentos: CasamentoLite[]
  taskDates?: string[]      // tarefas (azul)
  editionDates?: string[]   // edições concluídas / entregues (purple)
  albumDates?: string[]     // álbuns concluídos / entregues (magenta)
  notifDates?: string[]     // notificações recebidas (red)
  onClickDate?: (d: string) => void
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const datasCasamento  = new Set(casamentos.map(c => c.data_casamento).filter(Boolean) as string[])
  const datasTarefa     = new Set((taskDates ?? []).filter(Boolean))
  const datasEdicao     = new Set((editionDates ?? []).filter(Boolean))
  const datasAlbum      = new Set((albumDates ?? []).filter(Boolean))
  const datasNotif      = new Set((notifDates ?? []).filter(Boolean))

  function changeMonth(delta: number) {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  const first = new Date(view.y, view.m, 1)
  const lastDay = new Date(view.y, view.m + 1, 0).getDate()
  const startWeekday = first.getDay()

  type Cell = {
    day: number | null
    iso?: string
    isToday?: boolean
    hasEvent?: boolean
    hasTask?: boolean
    hasEdicao?: boolean
    hasAlbum?: boolean
    hasNotif?: boolean
  }
  const cells: Cell[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null })
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${view.y}-${String(view.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isTodayCell = (view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate())
    cells.push({
      day: d, iso, isToday: isTodayCell,
      hasEvent:  datasCasamento.has(iso),
      hasTask:   datasTarefa.has(iso),
      hasEdicao: datasEdicao.has(iso),
      hasAlbum:  datasAlbum.has(iso),
      hasNotif:  datasNotif.has(iso),
    })
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] tracking-[0.4em] text-gold uppercase font-bold">Calendário</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => changeMonth(-1)} className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-gold hover:border-gold/30 transition-all text-[14px]">‹</button>
          <span className="text-[14px] tracking-widest uppercase text-white/70 px-2">{MESES[view.m]} {view.y}</span>
          <button onClick={() => changeMonth(1)} className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-gold hover:border-gold/30 transition-all text-[14px]">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS.map(d => (
          <div key={d} className="text-center text-[14px] tracking-widest uppercase text-white/25 py-1">{d.charAt(0)}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.day === null) return <div key={i} />
          const hasAny = c.hasEvent || c.hasTask || c.hasEdicao || c.hasAlbum || c.hasNotif
          // Estilo: casamento (gold) tem prioridade visual; tarefa (azul), edição (roxo), álbum (magenta), notif (vermelho) seguem hierarquia
          const cls = c.isToday
            ? 'bg-gold text-black font-bold'
            : c.hasEvent
              ? 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 cursor-pointer'
              : c.hasNotif
                ? 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 cursor-pointer'
                : c.hasEdicao
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 cursor-pointer'
                  : c.hasAlbum
                    ? 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 cursor-pointer'
                    : c.hasTask
                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 cursor-pointer'
                      : 'text-white/35'
          return (
            <button
              key={i}
              onClick={() => hasAny && c.iso && onClickDate?.(c.iso)}
              disabled={!hasAny}
              className={`relative aspect-square flex items-center justify-center text-[14px] rounded-md transition-all ${cls}`}
            >
              {c.day}
              {/* Dots: todos os tipos presentes */}
              {!c.isToday && hasAny && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                  {c.hasEvent  && <span className="w-1 h-1 rounded-full bg-gold" />}
                  {c.hasNotif  && <span className="w-1 h-1 rounded-full bg-red-400" />}
                  {c.hasEdicao && <span className="w-1 h-1 rounded-full bg-purple-400" />}
                  {c.hasAlbum  && <span className="w-1 h-1 rounded-full bg-fuchsia-400" />}
                  {c.hasTask   && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-white/35 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gold" /> Hoje</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-gold/40 bg-gold/15" /> Casamento</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-purple-500/40 bg-purple-500/10" /> Edição</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-fuchsia-500/40 bg-fuchsia-500/10" /> Álbum</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-blue-500/40 bg-blue-500/10" /> Tarefa</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-red-500/40 bg-red-500/10" /> Notif.</span>
      </div>
    </div>
  )
}

// ─── NotesWidget ───────────────────────────────────────────────────────────
export function NotesWidget({ freelancerId }: { freelancerId: string }) {
  const KEY = `freelancer_${freelancerId}_notes`
  const [val, setVal] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setVal(raw)
    } catch {}
    setLoaded(true)
  }, [KEY])

  useEffect(() => {
    if (!loaded) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, val)
        const now = new Date()
        setSaved(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
      } catch {}
    }, 600)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [val, KEY, loaded])

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] tracking-[0.4em] text-gold uppercase font-bold">Notas</h3>
        {saved && <span className="text-[14px] text-emerald-400/70 tracking-widest uppercase">guardado {saved}</span>}
      </div>
      <textarea
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Escreve lembretes pessoais aqui…"
        rows={4}
        className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none leading-relaxed"
      />
    </div>
  )
}
