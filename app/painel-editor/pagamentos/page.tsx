'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PROJECTS, paymentPlanFor, comparePtDate, TODAY, type Project, type Installment } from '../_data/projects'

/** Limpa horário "DD/MM/YYYY — HH:MM" → "DD/MM/YYYY" */
function stripTime(d: string): string {
  return (d || '').split('—')[0].trim()
}

/** Converte user-project (formato do /novos-projetos) → Project do _data/projects.ts */
function userProjectToDataProject(p: any): Project {
  const pacote = p.pacote ?? 'Pacote Premium 👑'
  const preco = pacote === 'Pacote Essencial' ? 1800 : 3500
  return {
    id:              p.id,
    noivos:          p.noivos ?? '—',
    foto:            p.foto || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
    email:           p.email || `${(p.noivos ?? 'cliente').toLowerCase().replace(/[^a-z]/g,'')}@mail.com`,
    telefone:        p.telefone || '+351 9XX XXX XXX',
    recebido:        stripTime(p.recebido || ''),
    dataCasamento:   p.dataCasamento || '',
    entregaPrevista: p.entregaPrevista || '',
    pacote,
    preco,
    duracao:         p.duracao || (pacote === 'Pacote Premium 👑' ? '~12 min' : '~8 min'),
    stage:           p.stage ?? 'Novo Projeto',
    approval:        p.approval ?? 'Aguardando Revisão',
    progress:        progressFromStage(p.stage),
    editor:          p.editor || 'Editor Pro',
    finalEntregue:   p.stage === 'Entregue',
    finalLink:       p.finalLink || '',
    archived:        p.archived,
    cancelled:       p.cancelled,
  }
}

function progressFromStage(stage: string): number {
  if (stage === 'Novo Projeto') return 5
  if (stage === 'Em Edição' || stage === 'Color Grading' || stage === 'Trailer em Produção' || stage === 'Áudio / Sincronização') return 35
  if (stage === 'Para Revisão' || stage === 'Correções') return 70
  if (stage === 'Finalizado') return 90
  if (stage === 'Entregue') return 100
  return 5
}

// ────────────────────────────────────────────────────────────────────────
//  PAGAMENTOS — Wedding Moments Films
//  Sincronizado em real-time com os projetos
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos', active: true },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

const FILTERS = ['Todos','Recebidos','A receber','Atrasados','Parciais','Cancelados'] as const
type FilterTab = typeof FILTERS[number]

// Tipo "row" — uma installment + o seu projeto (para a tabela "flat")
type Row = { project: Project; inst: Installment; idx: number; totalParcels: number }

function fmtEUR(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}
function statusBadge(s: Installment['status']) {
  if (s === 'Recebido')   return { label: 'Recebido',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' }
  if (s === 'A receber')  return { label: 'A receber', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',   dot: 'bg-yellow-400' }
  if (s === 'Parcial')    return { label: 'Parcial',   cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30',   dot: 'bg-orange-400' }
  if (s === 'Atrasado')   return { label: 'Atrasado',  cls: 'bg-red-500/15 text-red-300 border-red-500/30',             dot: 'bg-red-400' }
  return { label: 'Cancelado', cls: 'bg-white/[0.06] text-white/40 border-white/15', dot: 'bg-white/30' }
}
function stageBadge(s: Project['stage']) {
  if (s === 'Novo Projeto') return { label: 'Novo',       cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
  if (s === 'Entregue')      return { label: 'Entregue',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  if (s === 'Finalizado')    return { label: 'Finalizado', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  if (s === 'Para Revisão' || s === 'Correções') return { label: 'Revisão', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' }
  return { label: 'Em Edição', cls: 'bg-gold/15 text-gold border-gold/30' }
}

// ────────────────────────────────────────────────────────────────────────
//  PAGE
// ────────────────────────────────────────────────────────────────────────
export default function PagamentosPage() {
  const [filter, setFilter] = useState<FilterTab>('Todos')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>('p1')
  const [allProjects, setAllProjects] = useState<Project[]>(PROJECTS)

  // ── Sincroniza com user-projects (localStorage) + patches sobre mocks ──
  useEffect(() => {
    function load() {
      try {
        const userRaw = localStorage.getItem('painel-editor-user-projects')
        const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
        const userMapped: Project[] = userProjects.map(userProjectToDataProject)

        const patchesRaw = localStorage.getItem('painel-editor-project-patches')
        const patches: Record<string, Partial<Project>> = patchesRaw ? JSON.parse(patchesRaw) : {}

        // user-created no topo + mocks com patches aplicados (filtra eliminados)
        const merged: Project[] = [
          ...userMapped,
          ...PROJECTS
            .map(p => patches[p.id] ? { ...p, ...patches[p.id], finalEntregue: (patches[p.id] as any).stage === 'Entregue' || p.finalEntregue } : p)
            .filter(p => !(p as any).archived && !(p as any).cancelled),
        ]
        setAllProjects(merged)
      } catch {
        setAllProjects(PROJECTS)
      }
    }
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Construir todas as rows (uma por installment)
  const allRows: Row[] = useMemo(() => {
    const rows: Row[] = []
    allProjects.forEach(p => {
      const plan = paymentPlanFor(p)
      plan.forEach((inst, idx) => rows.push({ project: p, inst, idx, totalParcels: plan.length }))
    })
    return rows
  }, [allProjects])

  const filteredRows = useMemo(() => {
    let arr = allRows
    if (filter !== 'Todos') {
      const map: Record<FilterTab, Installment['status'] | null> = {
        'Todos': null, 'Recebidos': 'Recebido', 'A receber': 'A receber',
        'Atrasados': 'Atrasado', 'Parciais': 'Parcial', 'Cancelados': 'Cancelado',
      }
      const target = map[filter]
      if (target) arr = arr.filter(r => r.inst.status === target)
    }
    if (search.trim()) arr = arr.filter(r => r.project.noivos.toLowerCase().includes(search.toLowerCase()))
    return arr
  }, [allRows, filter, search])

  // KPIs
  const kpis = useMemo(() => {
    const month = TODAY.split('/')[1]
    const year  = TODAY.split('/')[2]
    const recebidosMes = allRows
      .filter(r => r.inst.status === 'Recebido' && r.inst.paidDate)
      .filter(r => (r.inst.paidDate ?? '').split('/')[1] === month && (r.inst.paidDate ?? '').split('/')[2] === year)
      .reduce((s, r) => s + r.inst.value, 0)
    const aReceber = allRows.filter(r => r.inst.status === 'A receber').reduce((s, r) => s + r.inst.value, 0)
    const atrasados = allRows.filter(r => r.inst.status === 'Atrasado').reduce((s, r) => s + r.inst.value, 0)
    const totalAnual = allRows
      .filter(r => r.inst.status === 'Recebido' && (r.inst.paidDate ?? '').split('/')[2] === year)
      .reduce((s, r) => s + r.inst.value, 0)

    const facturasPendentes = allRows.filter(r => r.inst.status === 'A receber' || r.inst.status === 'Atrasado').length
    const aguardamPagamento = allRows.filter(r => r.inst.key === 'entrega' && r.project.approval === 'Aprovado Cliente' && r.inst.status !== 'Recebido').length

    return { recebidosMes, aReceber, atrasados, totalAnual, facturasPendentes, aguardamPagamento }
  }, [allRows])

  // Próximos pagamentos (right panel)
  const upcoming = useMemo(() => allRows
    .filter(r => r.inst.status === 'A receber')
    .sort((a, b) => comparePtDate(a.inst.dueDate, b.inst.dueDate))
    .slice(0, 5)
  , [allRows])

  // Gráfico — 12 meses (mock)
  const monthlyRevenue = [1800, 2300, 3600, 4500, 7800, 12500, 14200, 12800, 15600, 18500, 19200, 21450]
  const chartPath = useMemo(() => {
    const w = 460, h = 110, pad = 8
    const max = Math.max(...monthlyRevenue)
    const step = (w - pad*2) / (monthlyRevenue.length - 1)
    const pts = monthlyRevenue.map((v, i) => ({ x: pad + i * step, y: h - pad - (v / max) * (h - pad*2) }))
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i-1], p1 = pts[i]
      const cx = (p0.x + p1.x) / 2
      d += ` Q ${cx} ${p0.y}, ${cx} ${(p0.y + p1.y) / 2} T ${p1.x} ${p1.y}`
    }
    return { path: d, last: pts[pts.length-1], pts, w, h }
  }, [])

  const selectedProject = allProjects.find(p => p.id === selectedId) ?? null
  const selectedPlan    = selectedProject ? paymentPlanFor(selectedProject) : []

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      {/* Atmosfera */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="relative z-10 lg:pl-[230px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1600px] mx-auto">

          {/* HERO */}
          <Hero
            total={kpis.totalAnual}
            facturasPendentes={kpis.facturasPendentes}
            aguardamPagamento={kpis.aguardamPagamento}
          />

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon="↘" label="Recebido este mês" value={fmtEUR(kpis.recebidosMes)} sub="Maio 2026"               trend={+12.4} />
            <KpiCard icon="◷" label="A receber"          value={fmtEUR(kpis.aReceber)}     sub={`${allRows.filter(r=>r.inst.status==='A receber').length} parcelas`} trend={+5.2} />
            <KpiCard icon="!" label="Atrasados"          value={fmtEUR(kpis.atrasados)}    sub={`${allRows.filter(r=>r.inst.status==='Atrasado').length} parcelas`}  trend={-3.1} red />
            <KpiCard icon="€" label="Total anual"        value={fmtEUR(kpis.totalAnual)}   sub="2026"                  trend={+28.7} />
          </div>

          {/* GRID Principal: tabela (2/3) + right panel (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* LEFT — Tabela + Detail */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Filtros + Search */}
              <div className="rounded-2xl border border-white/[0.06] p-4 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FILTERS.map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] tracking-wide transition-all ${
                          filter === f
                            ? 'bg-gold/15 text-gold border border-gold/35'
                            : 'border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}>{f}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar projeto…"
                        className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-52" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela */}
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))' }}>
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] tracking-widest uppercase text-white/35 bg-white/[0.02] border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 font-medium">Projeto / Casal</th>
                      <th className="text-left px-3 py-3 font-medium">Pacote</th>
                      <th className="text-left px-3 py-3 font-medium">Parcela</th>
                      <th className="text-right px-3 py-3 font-medium">Valor</th>
                      <th className="text-left px-3 py-3 font-medium">Vencimento</th>
                      <th className="text-left px-3 py-3 font-medium">Estado</th>
                      <th className="text-left px-3 py-3 font-medium">Workflow</th>
                      <th className="text-right px-4 py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => {
                      const sb = statusBadge(r.inst.status)
                      const wb = stageBadge(r.project.stage)
                      const selected = selectedId === r.project.id
                      return (
                        <tr key={i}
                          onClick={() => setSelectedId(r.project.id)}
                          className={`border-b border-white/[0.04] last:border-0 cursor-pointer transition-all ${
                            selected ? 'bg-gold/[0.04]' : 'hover:bg-white/[0.02]'
                          }`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <img src={r.project.foto} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{r.project.noivos}</p>
                                <p className="text-[10px] text-white/40">Casamento {r.project.dataCasamento}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px] text-white/70">{r.project.pacote.replace(' 👑','')}</td>
                          <td className="px-3 py-3 text-[12px] text-white/70">
                            <span className="text-gold/80">{r.idx + 1}/{r.totalParcels}</span> · {r.inst.label.replace(/\d+%/, '').trim()}
                          </td>
                          <td className="px-3 py-3 text-[13px] text-white font-semibold text-right">{fmtEUR(r.inst.value)}</td>
                          <td className="px-3 py-3 text-[12px] text-white/65">{r.inst.dueDate}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${sb.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />
                              {sb.label}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${wb.cls}`}>
                              {wb.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={e => { e.stopPropagation() }} className="w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 transition-all">⋮</button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredRows.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-10 text-[12px] text-white/35">Sem pagamentos com este filtro.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* DETAIL PANEL — projeto sincronizado */}
              {selectedProject && (
                <DetailPanel project={selectedProject} plan={selectedPlan} />
              )}
            </div>

            {/* RIGHT — Upcoming + Chart */}
            <aside className="lg:col-span-1 flex flex-col gap-5">

              {/* Upcoming */}
              <Panel title="Próximos Recebimentos">
                <div className="space-y-2">
                  {upcoming.map((r, i) => (
                    <button key={i} onClick={() => setSelectedId(r.project.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-gold/30 hover:bg-white/[0.03] transition-all text-left">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={r.project.foto} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{r.project.noivos}</p>
                        <p className="text-[10px] text-white/45">{r.inst.label} · {r.inst.dueDate}</p>
                      </div>
                      <p className="text-[13px] font-bold text-gold">{fmtEUR(r.inst.value)}</p>
                    </button>
                  ))}
                  {upcoming.length === 0 && (
                    <p className="text-[12px] text-white/30 italic text-center py-4">Sem pagamentos a receber.</p>
                  )}
                </div>
              </Panel>

              {/* Chart */}
              <Panel title="Receitas Mensais" right={<button className="text-[10px] tracking-widest uppercase text-white/35 hover:text-gold transition-colors border border-white/10 px-2 py-1 rounded-md">2026 ▾</button>}>
                <div className="relative">
                  <svg viewBox={`0 0 ${chartPath.w} ${chartPath.h}`} className="w-full h-32">
                    <defs>
                      <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#C9A45C" />
                        <stop offset="50%" stopColor="#E8C76D" />
                        <stop offset="100%" stopColor="#C9A45C" />
                      </linearGradient>
                    </defs>
                    <path d={`${chartPath.path} L ${chartPath.last.x} ${chartPath.h} L 8 ${chartPath.h} Z`} fill="url(#goldArea)" />
                    <path d={chartPath.path} fill="none" stroke="url(#goldStroke)" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx={chartPath.last.x} cy={chartPath.last.y} r="4" fill="#C9A45C" />
                    <circle cx={chartPath.last.x} cy={chartPath.last.y} r="9" fill="#C9A45C" opacity="0.18" />
                  </svg>
                  <div className="absolute top-1 right-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-gold/30">
                    <p className="text-[11px] text-gold font-bold leading-none">21.450 €</p>
                    <p className="text-[9px] text-white/40 mt-0.5">Maio 2026</p>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
                  <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
                </div>
              </Panel>

              {/* Resumo Estado */}
              <Panel title="Distribuição">
                <div className="space-y-3">
                  {[
                    { label: 'Recebidos', value: allRows.filter(r => r.inst.status === 'Recebido').reduce((s, r) => s + r.inst.value, 0), color: '#34d399' },
                    { label: 'A receber', value: allRows.filter(r => r.inst.status === 'A receber').reduce((s, r) => s + r.inst.value, 0), color: '#facc15' },
                    { label: 'Atrasados', value: allRows.filter(r => r.inst.status === 'Atrasado').reduce((s, r) => s + r.inst.value, 0), color: '#ef4444' },
                    { label: 'Cancelados', value: allRows.filter(r => r.inst.status === 'Cancelado').reduce((s, r) => s + r.inst.value, 0), color: '#737373' },
                  ].map((s, i) => {
                    const total = allRows.reduce((acc, r) => acc + r.inst.value, 0) || 1
                    const pct = (s.value / total) * 100
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <span className="flex items-center gap-2 text-white/65">
                            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.label}
                          </span>
                          <span className="text-white/85 font-medium">{fmtEUR(s.value)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>

            </aside>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Pagamentos sincronizados com Projetos</p>
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
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[230px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <div className="px-6 pt-8 pb-7 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl font-serif italic text-gold" style={{ fontFamily: 'Georgia, serif' }}>W</span>
          <p className="text-[12px] tracking-[0.4em] text-gold/70 font-light uppercase">Wedding</p>
        </div>
        <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase ml-9">Moments Films</p>
        <div className="mt-3 h-px w-8 bg-gold/40" />
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
      <div className="px-5 py-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold font-bold">E</div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">Editor Pro</p>
            <p className="text-[10px] text-white/35 truncate">editorpro@mail.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Hero({ total, facturasPendentes, aguardamPagamento }: { total: number; facturasPendentes: number; aguardamPagamento: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-6"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&h=400&fit=crop"
          alt="" className="w-full h-full object-cover scale-105" style={{ filter: 'blur(2px)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.15) 100%)' }} />
      <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-10">
        <div className="max-w-xl">
          <p className="text-[12px] tracking-[0.5em] text-gold/70 uppercase mb-2">Sincronizado com Projetos</p>
          <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            PAGA<span className="italic text-gold">mentos</span>
          </h1>
          <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
          <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-md">
            Acompanhe os recebimentos sincronizados com todos os projetos, casamentos, entregas e aprovações dos clientes.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/55">
              {facturasPendentes} faturas pendentes
            </span>
            <span className="text-[11px] tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
              {aguardamPagamento} entregas aprovadas a aguardar pagamento
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Novo Recebimento
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-white/15 text-white/75 text-[13px] font-medium tracking-wider hover:bg-white/[0.05] hover:border-white/30 transition-all">
            ↓ Exportar
          </button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, trend, red }: { icon: string; label: string; value: string; sub?: string; trend?: number; red?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
      <div className="relative flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl ${red ? 'border-red-500/30 text-red-300' : 'border-gold/30 text-gold'}`}
          style={{ background: red
            ? 'radial-gradient(circle at 30% 30%, rgba(239,68,68,0.15), rgba(239,68,68,0.04))'
            : 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))',
            boxShadow: red ? '0 0 20px -4px rgba(239,68,68,0.25)' : '0 0 22px -4px rgba(201,164,92,0.25)' }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-white leading-none">{value}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {sub && <p className="text-[11px] text-white/35">{sub}</p>}
            {trend !== undefined && (
              <span className={`text-[10px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
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
        <h3 className="text-[14px] font-semibold text-white">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

// Detail Panel — quando uma row é selecionada
function DetailPanel({ project, plan }: { project: Project; plan: Installment[] }) {
  const totalPago    = plan.filter(p => p.status === 'Recebido').reduce((s, i) => s + i.value, 0)
  const totalPendente = plan.filter(p => p.status === 'A receber' || p.status === 'Atrasado').reduce((s, i) => s + i.value, 0)
  const totalProjeto = project.preco

  // Timeline de eventos automáticos
  const eventos: { data: string; texto: string; tipo: string }[] = []
  if (plan[0]?.status === 'Recebido') eventos.push({ data: plan[0].paidDate ?? '', texto: '💰 Reserva recebida', tipo: 'reserva' })
  if (comparePtDate(project.dataCasamento, TODAY) < 0) eventos.push({ data: project.dataCasamento, texto: '💍 Casamento realizado', tipo: 'wedding' })
  if (project.stage === 'Para Revisão' || project.stage === 'Finalizado' || project.stage === 'Entregue') eventos.push({ data: '—', texto: '📤 Entrega enviada', tipo: 'delivery' })
  if (project.approval === 'Aprovado Cliente') eventos.push({ data: '—', texto: '✓ Cliente aprovou', tipo: 'approval' })
  const pagamentoFinalPendente = plan.find(i => i.key === 'entrega' && i.status !== 'Recebido')
  if (pagamentoFinalPendente && project.approval === 'Aprovado Cliente') eventos.push({ data: '—', texto: '⏳ Pagamento final pendente', tipo: 'final-pending' })
  if (plan[plan.length-1]?.status === 'Recebido') eventos.push({ data: plan[plan.length-1].paidDate ?? '', texto: '🏁 Pagamento concluído', tipo: 'final-done' })

  return (
    <div className="rounded-2xl border border-gold/20 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.55), rgba(11,11,11,0.85))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 30px -8px rgba(201,164,92,0.2)' }}>
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/15 shrink-0">
            <img src={project.foto} alt={project.noivos} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-1">Projeto Sincronizado</p>
            <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{project.noivos}</h2>
            <p className="text-[12px] text-white/45 mt-1">{project.pacote} · {fmtEUR(project.preco)} · {project.duracao}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] tracking-widest uppercase text-white/35">Pago</p>
            <p className="text-[20px] font-bold text-emerald-300 leading-none">{fmtEUR(totalPago)}</p>
            <p className="text-[10px] text-white/35 mt-1.5">Falta {fmtEUR(totalProjeto - totalPago)}</p>
          </div>
        </div>

        {/* Sync info chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <SyncChip label="Casamento"     value={project.dataCasamento} />
          <SyncChip label="Editor"        value={project.editor} />
          <SyncChip label="Workflow"      value={project.stage} highlight={['Em Edição','Color Grading','Para Revisão'].includes(project.stage) ? 'gold' : project.stage === 'Entregue' ? 'emerald' : 'white'} />
          <SyncChip label="Aprovação"     value={project.approval} highlight={project.approval === 'Aprovado Cliente' ? 'emerald' : project.approval === 'Requer Alterações' || project.approval === 'Não Aprovado' ? 'red' : 'yellow'} />
          <SyncChip label="Progresso"     value={`${project.progress}%`} />
          <SyncChip label="Entrega Final" value={project.finalEntregue ? 'Entregue' : 'Não entregue'} highlight={project.finalEntregue ? 'emerald' : 'red'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* PLANO DE PAGAMENTO */}
        <div className="p-5 sm:p-6 border-r border-white/[0.06]">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-3">Plano de Pagamento</p>
          <div className="space-y-2">
            {plan.map((inst, i) => {
              const sb = statusBadge(inst.status)
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold"
                    style={{
                      background: inst.status === 'Recebido' ? 'rgba(52,211,153,0.15)' : 'rgba(201,164,92,0.1)',
                      color: inst.status === 'Recebido' ? '#6ee7b7' : '#C9A45C',
                      border: `1px solid ${inst.status === 'Recebido' ? 'rgba(52,211,153,0.3)' : 'rgba(201,164,92,0.3)'}`,
                    }}>{inst.percent}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white">{inst.label}</p>
                    <p className="text-[11px] text-white/45 mt-0.5">Vence {inst.dueDate}{inst.paidDate ? ` · Pago ${inst.paidDate}` : ''}{inst.metodo ? ` · ${inst.metodo}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-white leading-none">{fmtEUR(inst.value)}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${sb.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />{sb.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <PillBtn label="Marcar recebido" gold disabled={totalPendente === 0} />
            <PillBtn label="Enviar fatura" />
            <PillBtn label="Abrir projeto" />
            <PillBtn label="Abrir cliente" />
          </div>
        </div>

        {/* TIMELINE + CLIENTE */}
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-3">Eventos Automáticos</p>
            {eventos.length === 0 ? (
              <p className="text-[12px] text-white/30 italic">Sem eventos registados.</p>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />
                {eventos.map((ev, i) => (
                  <div key={i} className="relative mb-2.5 last:mb-0">
                    <span className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-gold border-2 border-black"
                      style={{ boxShadow: '0 0 8px rgba(201,164,92,0.7)' }} />
                    <p className="text-[12px] text-white/85"><span className="text-gold/70 font-bold text-[11px] tracking-wider">{ev.data}</span></p>
                    <p className="text-[12px] text-white/65">{ev.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-3">Cliente</p>
            <div className="space-y-1.5 text-[12px]">
              <ClientRow label="Nome"      value={project.noivos} />
              <ClientRow label="Email"     value={project.email} />
              <ClientRow label="Telefone"  value={project.telefone} />
              <ClientRow label="Casamento" value={project.dataCasamento} />
              <ClientRow label="Total"     value={fmtEUR(project.preco)} />
              <ClientRow label="Pago"      value={fmtEUR(totalPago)} valueClass="text-emerald-300" />
              <ClientRow label="Em falta"  value={fmtEUR(totalProjeto - totalPago)} valueClass="text-yellow-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SyncChip({ label, value, highlight }: { label: string; value: string; highlight?: 'gold'|'emerald'|'red'|'yellow'|'white' }) {
  const color =
    highlight === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' :
    highlight === 'red'     ? 'border-red-500/30 bg-red-500/10 text-red-300' :
    highlight === 'yellow'  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' :
    highlight === 'gold'    ? 'border-gold/30 bg-gold/10 text-gold' :
                              'border-white/15 bg-white/[0.04] text-white/70'
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] ${color}`}>
      <span className="opacity-50 tracking-widest uppercase text-[9px]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function ClientRow({ label, value, valueClass = 'text-white/85' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/40 tracking-widest uppercase text-[10px]">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}

function PillBtn({ label, gold, disabled }: { label: string; gold?: boolean; disabled?: boolean }) {
  return (
    <button disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-[11px] tracking-wider uppercase font-semibold transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
        gold ? 'bg-gold text-black border-gold hover:bg-gold/90' : 'border-white/[0.08] text-white/55 hover:text-gold hover:border-gold/30'
      }`}
      style={gold ? { boxShadow: '0 0 14px -4px rgba(201,164,92,0.5)' } : {}}>
      {label}
    </button>
  )
}
