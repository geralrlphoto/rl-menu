'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { eventsFromProjects, eventColorFor, PROJECTS, type CalendarEvent, type EventType } from '../_data/projects'

// ────────────────────────────────────────────────────────────────────────
//  CALENDÁRIO — Wedding Moments Films
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'edicao',      label: 'Em Edição',           icon: '✎' },
  { key: 'finalizados', label: 'Finalizados',         icon: '✓' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario', active: true },
  { key: 'clientes',    label: 'Clientes',            icon: '☉' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
]

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']

type ViewMode = 'Mês' | 'Semana' | 'Dia' | 'Agenda'

export default function CalendarioPage() {
  const allEvents = useMemo(() => eventsFromProjects(), [])
  const [view, setView] = useState<ViewMode>('Mês')
  const [calView, setCalView] = useState({ y: 2026, m: 4 }) // Maio 2026
  const [typeFilter, setTypeFilter] = useState<'Todos' | EventType>('Todos')
  const TODAY_DAY = 15  // matching screenshot — dia 15 destacado

  // Eventos do mês (filtrados)
  const eventsThisMonth = useMemo(() => {
    return allEvents.filter(e => {
      const [d, m, y] = e.date.split('/').map(Number)
      const sameMonth = y === calView.y && m - 1 === calView.m
      if (!sameMonth) return false
      if (typeFilter === 'Todos') return true
      return e.type === typeFilter
    })
  }, [allEvents, calView, typeFilter])

  // Grouping por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    eventsThisMonth.forEach(e => {
      const day = parseInt(e.date.split('/')[0], 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(e)
    })
    return map
  }, [eventsThisMonth])

  // Grid (5-6 weeks)
  const firstDay = new Date(calView.y, calView.m, 1).getDay()
  const lastDate = new Date(calView.y, calView.m + 1, 0).getDate()
  const prevLastDate = new Date(calView.y, calView.m, 0).getDate()

  type Cell = { day: number; current: boolean; month: number; year: number }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevLastDate - i, current: false, month: calView.m - 1, year: calView.y })
  for (let d = 1; d <= lastDate; d++) cells.push({ day: d, current: true, month: calView.m, year: calView.y })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lastDate - firstDay + 1, current: false, month: calView.m + 1, year: calView.y })

  // Próximos Eventos (todos os meses, ordenados, próximos 5)
  const proximos = useMemo(() => {
    const todayKey = `${calView.y}-${String(calView.m+1).padStart(2,'0')}-15` // mock today = 15 do mês actual
    return [...allEvents]
      .map(e => {
        const [d,m,y] = e.date.split('/').map(Number)
        return { e, key: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
      })
      .filter(x => x.key >= todayKey)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, 5)
      .map(x => x.e)
  }, [allEvents, calView])

  // Resumo do mês (donut)
  const summary = useMemo(() => {
    const types: EventType[] = ['Casamento','Prazo','Entrega','Revisão','Pagamento','Reunião']
    const items = types.map(t => ({
      type: t,
      label: t === 'Casamento' ? 'Casamentos' :
             t === 'Prazo'     ? 'Prazos' :
             t === 'Entrega'   ? 'Entregas' :
             t === 'Revisão'   ? 'Revisões' :
             t === 'Pagamento' ? 'Pagamentos' :
                                'Reunião',
      value: eventsThisMonth.filter(e => e.type === t).length,
      color: eventColorFor(t).dot,
    }))
    const total = items.reduce((s, it) => s + it.value, 0)
    return { items, total }
  }, [eventsThisMonth])

  function changeMonth(delta: number) {
    const d = new Date(calView.y, calView.m + delta, 1)
    setCalView({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="relative z-10 lg:pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          {/* HERO */}
          <Hero />

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5">

            {/* MAIN — Calendar */}
            <div className="flex flex-col gap-4">

              {/* View modes + Filters */}
              <div className="flex items-center justify-between gap-3 -mt-2 mb-1">
                <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.06] bg-black/30">
                  {(['Mês','Semana','Dia','Agenda'] as ViewMode[]).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={`px-4 py-1.5 rounded-lg text-[12px] tracking-wide transition-all ${
                        view === v ? 'bg-gold/15 text-gold border border-gold/35' : 'text-white/45 hover:text-white/85'
                      }`}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Calendar Card */}
              <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.6))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 transition-all">‹</button>
                    <button onClick={() => changeMonth(1)}  className="w-9 h-9 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 transition-all">›</button>
                    <button onClick={() => setCalView({ y: 2026, m: 4 })} className="px-4 h-9 rounded-lg border border-white/10 text-white/70 hover:text-gold hover:border-gold/30 transition-all text-[12px] tracking-widest uppercase">Hoje</button>
                    <p className="text-[18px] font-light text-white ml-3" style={{ fontFamily: 'Georgia, serif' }}>
                      {MESES[calView.m]} {calView.y} <span className="text-white/30 text-base">▾</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                      className="bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white/70 focus:outline-none focus:border-gold/40 cursor-pointer">
                      <option>Todos os tipos</option>
                      <option>Casamento</option>
                      <option>Prazo</option>
                      <option>Entrega</option>
                      <option>Revisão</option>
                      <option>Pagamento</option>
                      <option>Reunião</option>
                    </select>
                  </div>
                </div>

                {/* Dias semana */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DIAS.map((d, i) => (
                    <div key={i} className="text-center text-[10px] tracking-[0.3em] uppercase text-white/35 py-2">{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {cells.map((c, i) => {
                    const isToday = c.current && c.day === TODAY_DAY && c.month === 4 && c.year === 2026
                    const dayEvents = c.current ? (eventsByDay.get(c.day) ?? []) : []
                    return (
                      <div key={i}
                        className={`relative min-h-[110px] rounded-xl p-2 border transition-all ${
                          c.current
                            ? 'border-white/[0.05] hover:border-gold/20 hover:bg-white/[0.02]'
                            : 'border-transparent opacity-30'
                        }`}>
                        {/* Day number */}
                        <div className="flex items-center justify-between mb-1.5">
                          {isToday ? (
                            <span className="w-7 h-7 rounded-full bg-gold text-black text-[13px] font-bold flex items-center justify-center"
                              style={{ boxShadow: '0 0 14px rgba(201,164,92,0.55)' }}>{c.day}</span>
                          ) : (
                            <span className={`text-[13px] ${c.current ? 'text-white/85 font-medium' : 'text-white/30'}`}>{c.day}</span>
                          )}
                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-white/35">+{dayEvents.length - 2}</span>
                          )}
                        </div>

                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(ev => {
                            const color = eventColorFor(ev.type)
                            return (
                              <div key={ev.id} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color.dot }} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[10.5px] font-medium leading-tight truncate ${ev.completed ? 'line-through text-white/35' : 'text-white/85'}`}>
                                    {ev.hora ? <span className="text-white/55 mr-1">{ev.hora}</span> : null}
                                    {ev.title}
                                  </p>
                                  {ev.subtitle && (
                                    <p className="text-[10px] text-white/40 truncate">{ev.subtitle}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5 pt-5 border-t border-white/[0.04]">
                  {[
                    { type: 'Casamento' as EventType, label: 'Casamentos' },
                    { type: 'Prazo' as EventType,     label: 'Prazos' },
                    { type: 'Entrega' as EventType,   label: 'Entregas' },
                    { type: 'Revisão' as EventType,   label: 'Revisões' },
                    { type: 'Pagamento' as EventType, label: 'Pagamentos' },
                    { type: 'Reunião' as EventType,   label: 'Reuniões' },
                  ].map(l => {
                    const c = eventColorFor(l.type)
                    return (
                      <span key={l.type} className="inline-flex items-center gap-1.5 text-[11px] text-white/55">
                        <span className="w-2 h-2 rounded-full" style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}99` }} />
                        {l.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <aside className="flex flex-col gap-4">

              {/* Próximos Eventos */}
              <Panel title="Próximos Eventos" right={<button className="text-[11px] tracking-wider uppercase text-gold/70 hover:text-gold transition-colors">Ver todos</button>}>
                <div className="space-y-3">
                  {proximos.map(ev => {
                    const color = eventColorFor(ev.type)
                    const [d, m] = ev.date.split('/').map(Number)
                    return (
                      <div key={ev.id} className="flex items-start gap-3">
                        <div className="text-center shrink-0">
                          <p className="text-[18px] font-bold text-white leading-none">{String(d).padStart(2,'0')}</p>
                          <p className="text-[10px] text-gold tracking-widest uppercase">{MESES_SHORT[m-1].toUpperCase()}</p>
                        </div>
                        <div className="flex-1 min-w-0 pl-3 border-l border-white/[0.06]">
                          <p className="text-[12px] font-medium text-white truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color.dot }} />
                            {ev.title}
                          </p>
                          {ev.subtitle && <p className="text-[11px] text-white/50 truncate">{ev.subtitle}</p>}
                          <p className="text-[10px] text-white/30 mt-0.5">{ev.hora ?? 'Todo o dia'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${color.badge}`}>{ev.type}</span>
                      </div>
                    )
                  })}
                </div>
              </Panel>

              {/* Sincronização */}
              <div className="rounded-2xl border border-emerald-500/15 p-4 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(16,40,28,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>Sincronização</p>
                  <button className="w-8 h-8 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center justify-center">↻</button>
                </div>
                <p className="text-[12px] text-emerald-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
                  Sincronizado com o dashboard
                </p>
                <p className="text-[10px] text-white/40 mt-1">Última atualização: agora</p>
              </div>

              {/* Resumo do Mês */}
              <Panel title="Resumo do Mês">
                <div className="flex items-center gap-5">
                  <Donut items={summary.items.map(it => ({ value: it.value, color: it.color }))} total={summary.total} label="Eventos" />
                  <div className="flex-1 space-y-2">
                    {summary.items.map(it => (
                      <div key={it.type} className="flex items-center gap-2 text-[12px]">
                        <span className="w-2 h-2 rounded-full" style={{ background: it.color, boxShadow: `0 0 6px ${it.color}99` }} />
                        <span className="font-semibold text-white tabular-nums w-4">{it.value}</span>
                        <span className="text-white/55">{it.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* Google Calendar */}
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-gold/30 hover:bg-gold/[0.04] transition-all text-[12px] text-white/75">
                <span>📅</span>
                <span className="font-medium tracking-wider">Conectar ao Google Calendar</span>
              </button>

            </aside>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Calendário sincronizado</p>
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
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-gold/40 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.2), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
            <span className="text-xl">📷</span>
          </div>
          <div>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Wedding</p>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Moments</p>
            <p className="text-[9px] tracking-[0.35em] text-gold/70 uppercase mt-0.5">Films</p>
          </div>
        </div>
      </div>
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

      {/* Sync card */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-gold/15 p-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), transparent)' }}>
          <div className="flex items-start gap-2">
            <span className="text-gold text-base">📅</span>
            <p className="text-[11px] text-white/55 leading-relaxed">Tudo sincronizado com o dashboard</p>
          </div>
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
            Atualizado agora em tempo real
          </p>
        </div>
      </div>

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
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-7">
        <div className="flex items-center gap-5 max-w-xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-3xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>📅</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Calendário</h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed">Visualize todos os eventos, prazos e entregas sincronizados com os projetos.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center">
            <span className="text-lg text-white/75">🔔</span>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">3</span>
          </button>
          <button className="w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center">
            <span className="text-lg text-white/75">📅</span>
          </button>
          <button className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Novo Evento
          </button>
        </div>
      </div>
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

function Donut({ items, total, label }: { items: { value: number; color: string }[]; total: number; label: string }) {
  const size = 130
  const r = 55
  const c = size / 2
  const strokeW = 14
  const innerR = r - strokeW / 2

  const segs: { color: string; from: number; to: number }[] = []
  let acc = 0
  items.forEach(it => {
    if (it.value === 0 || total === 0) return
    const from = acc
    const to = acc + (it.value / total) * 360
    segs.push({ color: it.color, from, to })
    acc = to
  })

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
        <circle cx={c} cy={c} r={innerR} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
        {segs.map((s, i) => (
          <path key={i} d={arc(s.from, s.to)} fill="none" stroke={s.color} strokeWidth={strokeW} strokeLinecap="round" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-white leading-none">{total}</p>
        <p className="text-[10px] tracking-widest uppercase text-white/40 mt-1">{label}</p>
      </div>
    </div>
  )
}
