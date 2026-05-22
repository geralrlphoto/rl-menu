'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PROJECTS, TASKS, TODAY, comparePtDate, type Task, type Priority, type TaskStatus } from '../_data/projects'

// ────────────────────────────────────────────────────────────────────────
//  TAREFAS — Wedding Moments Films
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'edicao',      label: 'Em Edição',           icon: '✎' },
  { key: 'finalizados', label: 'Finalizados',         icon: '✓' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas', active: true },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'clientes',    label: 'Clientes',            icon: '☉' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'templates',   label: 'Templates',           icon: '◫' },
  { key: 'relatorios',  label: 'Relatórios',          icon: '◫' },
  { key: 'config',      label: 'Configurações',       icon: '⚙' },
]

const FILTERS = ['Todas','Pendentes','Em andamento','Concluídas','Atrasadas','Alta prioridade','Minha equipa'] as const
type FilterTab = typeof FILTERS[number]

function priorityBadge(p: Priority) {
  if (p === 'Alta')  return 'bg-red-500/15 text-red-300 border-red-500/30'
  if (p === 'Média') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
}

function projectFor(projectId: string) {
  return PROJECTS.find(p => p.id === projectId)
}

function isOverdue(t: Task) {
  return t.status !== 'Concluída' && t.status !== 'Cancelada' && comparePtDate(t.deadline, TODAY) < 0
}

function deadlineLabel(date: string): string {
  if (date === TODAY) return 'Hoje'
  const [d,m,y] = date.split('/').map(Number)
  const [td,tm,ty] = TODAY.split('/').map(Number)
  const target = new Date(y, m-1, d).getTime()
  const today = new Date(ty, tm-1, td).getTime()
  const diff = Math.round((target - today) / 86400000)
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  if (diff > 1 && diff < 8) return `${diff} dias`
  if (diff < 0 && diff > -8) return `${Math.abs(diff)} dias atrás`
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(d).padStart(2,'0')} ${meses[m-1]}`
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>(TASKS)
  const [filter, setFilter] = useState<FilterTab>('Todas')
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)

  // Filtros
  const filtered = useMemo(() => {
    let arr = tasks
    if (filter === 'Pendentes')       arr = arr.filter(t => t.status === 'Pendente')
    else if (filter === 'Em andamento') arr = arr.filter(t => t.status === 'Em andamento')
    else if (filter === 'Concluídas')   arr = arr.filter(t => t.status === 'Concluída')
    else if (filter === 'Atrasadas')    arr = arr.filter(t => isOverdue(t))
    else if (filter === 'Alta prioridade') arr = arr.filter(t => t.priority === 'Alta')
    else if (filter === 'Minha equipa') arr = arr.filter(t => t.assignee === 'Editor Pro')
    if (search.trim()) arr = arr.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    return arr
  }, [tasks, filter, search])

  // Agrupar
  const hoje      = filtered.filter(t => t.deadline === TODAY && (showCompleted || t.status !== 'Concluída'))
  const proximas  = filtered.filter(t => t.deadline !== TODAY && comparePtDate(t.deadline, TODAY) > 0 && t.status !== 'Concluída')
                            .sort((a, b) => comparePtDate(a.deadline, b.deadline))
  const atrasadas = filtered.filter(t => isOverdue(t) && t.deadline !== TODAY)
  const concluidas = filtered.filter(t => t.status === 'Concluída' && t.deadline !== TODAY)

  // Counts (todas, sem filtro)
  const counts = useMemo(() => ({
    total:        tasks.length,
    pendentes:    tasks.filter(t => t.status === 'Pendente').length,
    emAndamento:  tasks.filter(t => t.status === 'Em andamento').length,
    concluidas:   tasks.filter(t => t.status === 'Concluída').length,
    atrasadas:    tasks.filter(t => isOverdue(t)).length,
  }), [tasks])

  // Donut chart
  const donut = useMemo(() => {
    const total = counts.pendentes + counts.emAndamento + counts.concluidas + counts.atrasadas
    if (total === 0) return { segments: [], total: 0 }
    const segs: { color: string; from: number; to: number }[] = []
    let acc = 0
    const items = [
      { value: counts.pendentes,   color: '#94a3b8' }, // pendentes — cinza
      { value: counts.emAndamento, color: '#facc15' }, // gold/amarelo
      { value: counts.concluidas,  color: '#34d399' }, // verde
      { value: counts.atrasadas,   color: '#ef4444' }, // vermelho
    ]
    items.forEach(it => {
      if (it.value === 0) return
      const from = acc
      const to = acc + (it.value / total) * 360
      segs.push({ color: it.color, from, to })
      acc = to
    })
    return { segments: segs, total }
  }, [counts])

  // Toggle status
  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      if (t.status === 'Concluída') return { ...t, status: 'Pendente', progress: 0, completedAt: undefined }
      const now = new Date()
      const tm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      return { ...t, status: 'Concluída', progress: 100, completedAt: `${TODAY} — ${tm}` }
    }))
  }

  // Calendário (Maio 2026)
  const calToday = new Date(2026, 4, 24)
  const [calView, setCalView] = useState({ y: 2026, m: 4 })
  const firstDay = new Date(calView.y, calView.m, 1).getDay()
  const lastDate = new Date(calView.y, calView.m + 1, 0).getDate()
  const prevLastDate = new Date(calView.y, calView.m, 0).getDate()
  const cells: Array<{ day: number; current: boolean; isToday: boolean; hasTask: boolean }> = []
  const tasksByDay = new Set(tasks.map(t => {
    const [d,m,y] = t.deadline.split('/').map(Number)
    return y === calView.y && m-1 === calView.m ? d : null
  }).filter(Boolean) as number[])
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevLastDate - i, current: false, isToday: false, hasTask: false })
  for (let d = 1; d <= lastDate; d++) {
    const isToday = calView.y === calToday.getFullYear() && calView.m === calToday.getMonth() && d === calToday.getDate()
    cells.push({ day: d, current: true, isToday, hasTask: tasksByDay.has(d) })
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lastDate - firstDay + 1, current: false, isToday: false, hasTask: false })

  // Próximos Prazos (1 destacado como na screenshot)
  const proxPrazo = proximas[0] ?? atrasadas[0] ?? hoje[0]

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="relative z-10 lg:pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1600px] mx-auto">

          {/* HERO */}
          <Hero />

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

            {/* MAIN COLUMN — Lista de tarefas */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Filter Bar */}
              <div className="rounded-2xl border border-white/[0.06] p-4 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {FILTERS.slice(0, 5).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`relative px-3 py-2 text-[13px] tracking-wide transition-all ${
                          filter === f
                            ? 'text-gold'
                            : 'text-white/45 hover:text-white/80'
                        }`}>
                        {f}
                        {filter === f && <span className="absolute bottom-0 left-3 right-3 h-px bg-gold" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar tarefa…"
                        className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-60" />
                    </div>
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] text-white/55 hover:text-gold hover:border-gold/30 transition-all text-[12px]">
                      ⚙ Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Group: Tarefas de Hoje */}
              {hoje.length > 0 && (
                <Section title="Tarefas de Hoje" count={hoje.length}>
                  {hoje.map(t => <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} />)}
                </Section>
              )}

              {/* Group: Atrasadas */}
              {atrasadas.length > 0 && (
                <Section title="Atrasadas" count={atrasadas.length} accent="red">
                  {atrasadas.map(t => <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} />)}
                </Section>
              )}

              {/* Group: Próximas Tarefas */}
              {proximas.length > 0 && (
                <Section title="Próximas Tarefas" count={proximas.length}>
                  {proximas.map(t => <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} />)}
                </Section>
              )}

              {/* Mostrar concluídas */}
              {!showCompleted && concluidas.length > 0 && (
                <button onClick={() => setShowCompleted(true)}
                  className="w-full py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-[12px] tracking-widest uppercase text-white/45 hover:text-gold hover:border-gold/30 transition-all">
                  Mostrar concluídas ({concluidas.length}) ⌄
                </button>
              )}
              {showCompleted && concluidas.length > 0 && (
                <Section title="Concluídas" count={concluidas.length} accent="emerald">
                  {concluidas.map(t => <TaskRow key={t.id} t={t} onToggle={() => toggleTask(t.id)} />)}
                </Section>
              )}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-16">
                  <p className="text-gold/40 text-4xl font-serif leading-none mb-3">∅</p>
                  <p className="text-[14px] text-white/35">Sem tarefas com este filtro.</p>
                </div>
              )}
            </div>

            {/* RIGHT — Sidebar painéis */}
            <aside className="lg:col-span-1 flex flex-col gap-4">

              {/* Visão Geral (donut) */}
              <Panel title="Visão Geral">
                <div className="flex items-center gap-5">
                  <Donut segments={donut.segments} total={donut.total} />
                  <div className="flex-1 space-y-2.5">
                    <Legend color="#94a3b8" label="Pendentes"   value={counts.pendentes} />
                    <Legend color="#facc15" label="Em andamento" value={counts.emAndamento} />
                    <Legend color="#34d399" label="Concluídas"   value={counts.concluidas} />
                    <Legend color="#ef4444" label="Atrasada"     value={counts.atrasadas} />
                  </div>
                </div>
              </Panel>

              {/* Sincronização */}
              <div className="rounded-2xl border border-emerald-500/15 p-4 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(16,40,28,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg shrink-0">
                    ↻
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-white mb-0.5">Sincronização</p>
                    <p className="text-[11px] text-white/50 leading-relaxed">Todas as tarefas estão sincronizadas com os projetos e prazos.</p>
                    <p className="text-[11px] text-emerald-300 mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                      Sincronizado agora
                    </p>
                  </div>
                </div>
              </div>

              {/* Calendário */}
              <Panel title="Calendário" right={
                <div className="flex items-center gap-2">
                  <button onClick={() => { const d = new Date(calView.y, calView.m - 1, 1); setCalView({ y: d.getFullYear(), m: d.getMonth() }) }}
                    className="w-6 h-6 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all text-[12px]">‹</button>
                  <button onClick={() => { setCalView({ y: 2026, m: 4 }) }}
                    className="text-[11px] tracking-widest uppercase text-white/45 hover:text-gold transition-colors px-2 py-1 rounded-md border border-white/10">Hoje</button>
                  <button onClick={() => { const d = new Date(calView.y, calView.m + 1, 1); setCalView({ y: d.getFullYear(), m: d.getMonth() }) }}
                    className="w-6 h-6 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all text-[12px]">›</button>
                </div>
              }>
                <p className="text-center text-[14px] tracking-wider text-white/85 mb-3 font-light">
                  {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][calView.m]} {calView.y}
                </p>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] tracking-widest uppercase text-white/30 py-1.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((c, i) => (
                    <div key={i} className="aspect-square relative">
                      <button
                        className={`w-full h-full flex items-center justify-center text-[12px] rounded-md transition-all ${
                          c.isToday
                            ? 'bg-gold text-black font-bold'
                            : c.hasTask && c.current
                              ? 'text-gold border border-gold/30 hover:bg-gold/10'
                              : c.current
                                ? 'text-white/65 hover:bg-white/[0.04]'
                                : 'text-white/15'
                        }`}
                        style={c.isToday ? { boxShadow: '0 0 12px rgba(201,164,92,0.5)' } : {}}>
                        {c.day}
                      </button>
                      {c.hasTask && c.current && !c.isToday && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                      )}
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Próximos Prazos */}
              <Panel title="Próximos Prazos" right={<button className="text-[11px] tracking-wider uppercase text-white/40 hover:text-gold transition-colors">Ver todos</button>}>
                <div className="space-y-2">
                  {(proxPrazo ? [proxPrazo, ...proximas.slice(1, 3)] : proximas.slice(0, 3)).filter(Boolean).map((t, i) => {
                    const proj = projectFor(t.projectId)
                    const [d, m] = t.deadline.split('/').map(Number)
                    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-gold/30 hover:bg-white/[0.02] transition-all">
                        {proj && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img src={proj.foto} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-white/40 truncate">{proj?.noivos ?? '—'}</p>
                          <p className="text-[10px] text-white/35 mt-0.5">{String(d).padStart(2,'0')} {meses[m-1]}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${
                          isOverdue(t) ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-gold/15 text-gold border-gold/30'
                        }`}>
                          {deadlineLabel(t.deadline)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </aside>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Tarefas sincronizadas</p>
        </div>
      </main>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-gold/40 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.2), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
            <span className="text-xl">📷</span>
          </div>
          <div>
            <p className="text-[15px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Wedding</p>
            <p className="text-[15px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Moments</p>
            <p className="text-[9px] tracking-[0.35em] text-gold/70 uppercase mt-0.5">Films</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(it => {
          const isActive = !!it.active
          const cls = `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all group ${
            isActive ? 'bg-gold/10 border border-gold/30 text-gold' : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
          }`
          const inner = (
            <>
              <span className={`w-5 text-center text-base ${isActive ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
            </>
          )
          return it.href
            ? <Link key={it.key} href={it.href} className={cls} style={isActive ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.35)' } : {}}>{inner}</Link>
            : <button key={it.key} className={cls}>{inner}</button>
        })}
      </nav>

      {/* Quote */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-gold/15 p-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), transparent)' }}>
          <div className="flex items-start gap-2">
            <span className="text-gold text-base">📝</span>
            <p className="text-[10px] text-white/50 italic leading-relaxed">Todas as tarefas sincronizadas com os projetos.</p>
          </div>
          <button className="mt-2 text-[10px] tracking-widest uppercase text-gold/80 hover:text-gold transition-colors flex items-center gap-1">
            Saber mais <span>→</span>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold/40 shrink-0">
            <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face" alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">Editor Pro</p>
            <p className="text-[10px] text-white/35 truncate">editorpro@mail.com</p>
            <p className="text-[9px] text-emerald-400 mt-0.5">● Online</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&h=300&fit=crop"
          alt="" className="w-full h-full object-cover" style={{ filter: 'blur(1.5px)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-8">
        <div className="flex items-center gap-5 max-w-xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-3xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>📋</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Tarefas</h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed">Gerencia todas as tuas tarefas. Sincronizadas com os teus projetos e prazos.</p>
            <div className="mt-2 h-px w-14 bg-gradient-to-r from-gold/70 to-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center group">
            <span className="text-lg text-white/75 group-hover:text-gold">🔔</span>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">3</span>
          </button>
          <button className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Nova Tarefa
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, count, accent, children }: { title: string; count: number; accent?: 'red'|'emerald'; children: React.ReactNode }) {
  const accentCls =
    accent === 'red'     ? 'bg-red-500/15 text-red-300 border-red-500/30' :
    accent === 'emerald' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                           'bg-gold/15 text-gold border-gold/30'
  return (
    <div className="rounded-2xl border border-white/[0.06] backdrop-blur-md p-5"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[15px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        <span className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-[11px] font-bold border ${accentCls}`}>{count}</span>
      </div>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  )
}

function TaskRow({ t, onToggle }: { t: Task; onToggle: () => void }) {
  const proj = projectFor(t.projectId)
  const done = t.status === 'Concluída'
  const overdue = isOverdue(t)
  return (
    <div className="group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-gold/20 hover:bg-white/[0.02] transition-all">
      {/* Checkbox */}
      <button onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          done ? 'bg-gold border-gold' : 'border-white/25 hover:border-gold/60'
        }`}>
        {done && <span className="text-[12px] text-black font-bold">✓</span>}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium leading-tight ${done ? 'line-through text-white/35' : 'text-white'}`}>{t.title}</p>
        <p className="text-[11px] text-white/40 mt-0.5 truncate">{proj?.noivos ?? '—'}</p>
        {t.completedAt && <p className="text-[10px] text-emerald-400/70 mt-0.5">✓ Concluída · {t.completedAt}</p>}
      </div>

      {/* Priority */}
      <span className={`text-[10px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-bold shrink-0 ${priorityBadge(t.priority)}`}>
        {t.priority}
      </span>

      {/* Deadline */}
      <div className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] shrink-0 ${overdue ? 'text-red-300' : 'text-white/60'}`}>
        <span>📅</span>
        <span>{deadlineLabel(t.deadline)}</span>
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 shrink-0" title={t.assignee}>
        {t.assigneeAvatar ? (
          <img src={t.assigneeAvatar} alt={t.assignee} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gold/15 flex items-center justify-center text-gold text-xs font-bold">{t.assignee.charAt(0)}</div>
        )}
      </div>

      {/* Menu */}
      <button className="w-8 h-8 rounded-lg text-white/35 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center shrink-0">⋮</button>
    </div>
  )
}

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function Donut({ segments, total }: { segments: { color: string; from: number; to: number }[]; total: number }) {
  const size = 120
  const r = 50
  const c = size / 2
  const strokeW = 14
  const innerR = r - strokeW / 2

  function arc(from: number, to: number) {
    const a1 = (from - 90) * Math.PI / 180
    const a2 = (to - 90) * Math.PI / 180
    const x1 = c + innerR * Math.cos(a1), y1 = c + innerR * Math.sin(a1)
    const x2 = c + innerR * Math.cos(a2), y2 = c + innerR * Math.sin(a2)
    const large = to - from > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${innerR} ${innerR} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background ring */}
        <circle cx={c} cy={c} r={innerR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
        {segments.map((s, i) => (
          <path key={i} d={arc(s.from, s.to)} fill="none" stroke={s.color} strokeWidth={strokeW} strokeLinecap="round" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-white leading-none">{total}</p>
        <p className="text-[10px] tracking-widest uppercase text-white/40 mt-1">Tarefas</p>
      </div>
    </div>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}99` }} />
      <span className="font-semibold text-white tabular-nums">{value}</span>
      <span className="text-white/55">{label}</span>
    </div>
  )
}
