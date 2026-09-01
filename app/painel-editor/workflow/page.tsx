'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  PROJECTS,
  workflowStageFor,
  WORKFLOW_STEPS,
  WORKFLOW_PROGRESS,
  WORKFLOW_DESCRIPTIONS,
  comparePtDate,
  TODAY,
  type Project,
  type WorkflowStep,
  type WorkflowStage,
} from '../_data/projects'
import { NotificationBell } from '../_components/NotificationBell'
import { MessagesBell } from '../_components/MessagesBell'
import { BrandLogo } from '../_components/BrandLogo'
import { getEditorId } from '../_data/freelancer-profile'

// ── Estado de edição (workflow) dos trabalhos reais da RL ────────────────────
const WF_STAGES = ['Novo', 'Em Edição', 'Color Grading', 'Áudio', 'Para Revisão', 'Correções', 'Finalizado', 'Entregue']
function MeusTrabalhosWorkflow() {
  const [jobs, setJobs] = useState<any[]>([])
  const [wf, setWf] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    const id = getEditorId()
    idRef.current = id
    if (!id) { setLoaded(true); return }
    let cancelled = false
    Promise.all([
      fetch(`/api/painel-editor/projetos?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/painel-editor/workflow?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
    ]).then(([p, w]) => {
      if (cancelled) return
      setJobs(Array.isArray(p?.jobs) ? p.jobs : [])
      setWf((w?.workflow && typeof w.workflow === 'object') ? w.workflow : {})
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  function setStage(key: string, stage: string) {
    setWf(prev => ({ ...prev, [key]: stage }))
    const id = idRef.current
    if (id && key) {
      fetch('/api/painel-editor/workflow', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer: id, referencia: key, stage }),
      }).catch(() => {})
    }
  }

  if (!loaded || jobs.length === 0) return null

  return (
    <div className="rounded-2xl border border-gold/25 p-5 mb-5"
      style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.5), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold text-lg">☰</span>
        <h3 className="text-[15px] font-semibold text-white">Estado dos Meus Trabalhos</h3>
        <span className="text-[10px] text-white/35 tracking-widest uppercase">{jobs.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {jobs.map((j, i) => {
          const key = j.referencia || j.notifId || String(i)
          const stage = wf[key] || 'Novo'
          return (
            <div key={key} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex-wrap">
              <div className="min-w-0">
                <p className="text-[13px] text-white/90 truncate">{j.noivos || j.local || 'Evento'}</p>
                {j.local && <p className="text-[10px] text-white/40 truncate">{j.local}</p>}
              </div>
              <select value={stage} onChange={e => setStage(key, e.target.value)}
                className="bg-[#0e0c08] border border-gold/30 text-gold text-[11px] rounded-lg px-3 py-1.5 outline-none focus:border-gold/60 tracking-wider uppercase">
                {WF_STAGES.map(s => <option key={s} value={s} className="bg-[#0e0c08] text-white">{s}</option>)}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────
function stripTimeWF(d: string): string { return (d || '').split('—')[0].trim() }
function progressFromStageWF(stage: string): number {
  if (stage === 'Novo Projeto') return 5
  if (stage === 'Em Edição' || stage === 'Color Grading' || stage === 'Trailer em Produção' || stage === 'Áudio / Sincronização') return 35
  if (stage === 'Para Revisão' || stage === 'Correções') return 70
  if (stage === 'Finalizado') return 90
  if (stage === 'Entregue') return 100
  return 5
}

// ── Trabalhos reais → Project ────────────────────────────────────────────
// Mesma conversão que o Novos Projetos faz: a fase vem de
// freelancers.editor_workflow (por referência) e as edições do admin de
// META.overrides da notificação de envio.
const WF_TO_STAGE_WF: Record<string, WorkflowStage> = {
  'Novo': 'Novo Projeto', 'Em Edição': 'Em Edição', 'Color Grading': 'Color Grading',
  'Áudio': 'Áudio / Sincronização', 'Para Revisão': 'Para Revisão', 'Correções': 'Correções',
  'Finalizado': 'Finalizado', 'Entregue': 'Entregue',
}

function isoToPtWF(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function jobToProjectWF(j: any, wf: Record<string, string>, idx: number): Project {
  const key = j.referencia || j.notifId || String(idx)
  const stage: WorkflowStage = WF_TO_STAGE_WF[wf[key] ?? ''] ?? 'Novo Projeto'
  const base: Project = {
    id: key,
    noivos: j.noivos || j.local || 'Evento',
    foto: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
    email: '',
    telefone: '',
    recebido: isoToPtWF(j.sentAt || ''),
    dataCasamento: isoToPtWF(j.data_casamento || ''),
    // Prazo do vídeo (evento + 180 dias úteis) calculado na API.
    entregaPrevista: isoToPtWF(j.prazoVideo || ''),
    pacote: 'Pacote Premium 👑',
    preco: 0,
    duracao: '',
    stage,
    approval: 'Aguardando Revisão',
    progress: progressFromStageWF(stage),
    editor: '',
    finalEntregue: stage === 'Entregue',
    finalLink: j.revisao?.entregaLink || '',
  }
  // Edições do admin mandam sobre o que é derivado do envio.
  const merged: Project = j.overrides ? { ...base, ...j.overrides } : base
  return { ...merged, progress: progressFromStageWF(merged.stage) }
}

function userProjectToProject(p: any): Project {
  const pacote = p.pacote ?? 'Pacote Premium 👑'
  const preco = typeof p.preco === 'number' && p.preco > 0
    ? p.preco
    : (pacote === 'Pacote Essencial' ? 1800 : 3500)
  return {
    id: p.id,
    noivos: p.noivos ?? '—',
    foto: p.foto || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
    email: p.email || `${(p.noivos ?? 'cliente').toLowerCase().replace(/[^a-z]/g,'')}@mail.com`,
    telefone: p.telefone || '+351 9XX XXX XXX',
    recebido: stripTimeWF(p.recebido || ''),
    dataCasamento: p.dataCasamento || '',
    entregaPrevista: p.entregaPrevista || '',
    pacote,
    preco,
    duracao: p.duracao || '~12 min',
    stage: p.stage ?? 'Novo Projeto',
    approval: p.approval ?? 'Aguardando Revisão',
    progress: progressFromStageWF(p.stage),
    editor: p.editor || 'Editor Pro',
    finalEntregue: p.stage === 'Entregue',
    finalLink: p.finalLink || '',
    archived: p.archived,
    cancelled: p.cancelled,
  }
}

// ────────────────────────────────────────────────────────────────────────
//  WORKFLOW — Wedding Moments Films (master production workflow)
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow', active: true },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

// Ícone por etapa (visual mockup-style)
const STEP_ICONS: Record<WorkflowStep, string> = {
  'Recebido':      '↓',
  'Organização':   '◫',
  'Pré-Produção':  '◐',
  'Edição':        '✂',
  'Color Grading': '◉',
  'Áudio':         '◇',
  'Revisão':       '↻',
  'Aprovação':     '✓',
  'Entrega':       '↗',
}

function statusForProject(p: Project): { label: string; cls: string } {
  if (p.stage === 'Entregue')   return { label: 'Concluído',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  if (p.stage === 'Para Revisão' || p.stage === 'Correções' || p.stage === 'Finalizado') return { label: 'Aguardando', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' }
  return { label: 'Em andamento', cls: 'bg-gold/15 text-gold border-gold/30' }
}

function daysUntilPt(date: string): number {
  const [d,m,y] = date.split('/').map(Number)
  const [td,tm,ty] = TODAY.split('/').map(Number)
  return Math.round((new Date(y, m-1, d).getTime() - new Date(ty, tm-1, td).getTime()) / 86400000)
}

const PROGRESS_COLORS: Record<WorkflowStep, string> = {
  'Recebido':      '#94a3b8',
  'Organização':   '#34d399',
  'Pré-Produção':  '#facc15',
  'Edição':        '#a78bfa',
  'Color Grading': '#f472b6',
  'Áudio':         '#06b6d4',
  'Revisão':       '#fb923c',
  'Aprovação':     '#10b981',
  'Entrega':       '#C9A45C',
}

// Atividades de exemplo — só usadas no modo maquete (sem editor identificado).
const ACTIVIDADES_MAQUETE = [
  { ico: '↓', titulo: 'Projeto recebido',     noivos: 'Amanda & Lucas',    quando: 'Hoje, 14:32',       ord: 0 },
  { ico: '◫', titulo: 'Arquivos organizados', noivos: 'Beatriz & Gabriel', quando: 'Hoje, 11:15',       ord: 0 },
  { ico: '✂', titulo: 'Edição iniciada',      noivos: 'Juliana & Mateus',  quando: 'Ontem, 16:40',      ord: 0 },
  { ico: '↻', titulo: 'Revisão enviada',      noivos: 'Carolina & Felipe', quando: 'Ontem, 10:22',      ord: 0 },
  { ico: '↗', titulo: 'Projeto entregue',     noivos: 'Sofia & Ricardo',   quando: '18/05/2026, 18:10', ord: 0 },
]

export default function WorkflowPage() {
  const [stageFilter, setStageFilter] = useState<'Todos os Projetos' | WorkflowStep>('Todos os Projetos')
  const [search, setSearch] = useState('')
  const [allProjects, setAllProjects] = useState<Project[]>(PROJECTS)
  // Modo real: há editor identificado (?freelancer=<id> ou id já guardado).
  // Nesse caso a página inteira passa a espelhar os trabalhos da BD em vez
  // dos projetos de maquete.
  const [realMode, setRealMode] = useState(false)

  // ── Trabalhos reais do editor (BD) ────────────────────────────────────
  useEffect(() => {
    const id = getEditorId()
    if (!id) return
    let cancelled = false
    Promise.all([
      fetch(`/api/painel-editor/projetos?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/painel-editor/workflow?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
    ]).then(([pj, w]) => {
      if (cancelled) return
      const jobs: any[] = Array.isArray(pj?.jobs) ? pj.jobs : []
      const wf: Record<string, string> = (w?.workflow && typeof w.workflow === 'object') ? w.workflow : {}
      setRealMode(true)
      setAllProjects(
        jobs.map((j, i) => jobToProjectWF(j, wf, i)).filter(p => !(p as any).archived)
      )
    })
    return () => { cancelled = true }
  }, [])

  // ── Sincroniza com user-projects (localStorage) + patches sobre mocks ──
  //    Só em modo maquete: com editor real, a fonte é a BD.
  useEffect(() => {
    if (getEditorId()) return
    function load() {
      try {
        const userRaw = localStorage.getItem('painel-editor-user-projects')
        const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
        const userMapped: Project[] = userProjects.map(userProjectToProject)

        const patchesRaw = localStorage.getItem('painel-editor-project-patches')
        const patches: Record<string, Partial<Project>> = patchesRaw ? JSON.parse(patchesRaw) : {}

        const merged: Project[] = [
          ...userMapped,
          ...PROJECTS
            .map(p => patches[p.id] ? { ...p, ...patches[p.id], finalEntregue: (patches[p.id] as any).stage === 'Entregue' || p.finalEntregue, progress: progressFromStageWF((patches[p.id] as any).stage ?? p.stage) } : p)
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

  const enriched = useMemo(() => allProjects.map(p => ({
    p,
    step: workflowStageFor(p),
    progress: p.progress,
  })), [allProjects])

  const filtered = useMemo(() => {
    let arr = enriched
    if (stageFilter !== 'Todos os Projetos') arr = arr.filter(x => x.step === stageFilter)
    if (search.trim()) arr = arr.filter(x => x.p.noivos.toLowerCase().includes(search.toLowerCase()))
    return arr
  }, [enriched, stageFilter, search])

  // Progresso médio
  const overallProgress = useMemo(() => {
    if (filtered.length === 0) return 0
    const total = filtered.reduce((s, x) => s + x.progress, 0)
    return Math.round(total / filtered.length)
  }, [filtered])

  // Stage counts (resumo do workflow)
  const stageCounts = useMemo(() => {
    const counts: Record<WorkflowStep, number> = WORKFLOW_STEPS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<WorkflowStep, number>)
    enriched.forEach(x => { counts[x.step] += 1 })
    return counts
  }, [enriched])

  // Etapa em destaque (a primeira com >0 projetos é considerada "ativa")
  const activeStep = useMemo(() => {
    const found = WORKFLOW_STEPS.find(s => stageCounts[s] > 0 && s !== 'Entrega')
    return found ?? 'Edição'
  }, [stageCounts])

  // Atividades recentes — em modo real vêm dos trabalhos (envio e entrega);
  // em modo maquete mantêm-se os exemplos.
  const activities = useMemo(() => {
    if (!realMode) return ACTIVIDADES_MAQUETE
    const itens: { ico: string; titulo: string; noivos: string; quando: string; ord: number }[] = []
    allProjects.forEach(p => {
      const ordDe = (d: string) => {
        const [dd, mm, yy] = (d || '').split('/').map(Number)
        return (dd && mm && yy) ? new Date(yy, mm - 1, dd).getTime() : 0
      }
      if (p.recebido) itens.push({ ico: '↓', titulo: 'Trabalho recebido', noivos: p.noivos, quando: p.recebido, ord: ordDe(p.recebido) })
      if (p.finalEntregue) itens.push({ ico: '↗', titulo: 'Projeto entregue', noivos: p.noivos, quando: p.entregaPrevista || p.recebido, ord: ordDe(p.entregaPrevista || p.recebido) })
    })
    return itens.sort((a, b) => b.ord - a.ord).slice(0, 5)
  }, [realMode, allProjects])

  // Próximos prazos (top 3 ordenados)
  const proxPrazos = useMemo(() => enriched
    .map(x => ({ ...x, dias: daysUntilPt(x.p.entregaPrevista) }))
    .filter(x => x.dias >= 0)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 3)
  , [enriched])

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="painel-main relative z-10 pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          {/* HERO */}
          <Hero />

          {/* Estado dos trabalhos reais da RL */}
          <MeusTrabalhosWorkflow />

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5">

            {/* MAIN */}
            <div className="flex flex-col gap-5">

              {/* Timeline */}
              <div className="rounded-2xl border border-white/[0.06] p-6 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.6))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}>
                <p className="text-[10px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-5">Etapas do Fluxo de Produção</p>
                <WorkflowTimeline activeStep={activeStep} />

                {/* Overall progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] tracking-[0.4em] uppercase text-gold/70 font-bold">Progresso geral dos projetos</p>
                    <div className="flex items-center gap-3">
                      <p className="text-[14px] font-bold text-gold">{overallProgress}%</p>
                      <button className="text-[11px] tracking-wider text-white/50 hover:text-gold transition-colors border border-white/10 px-2 py-1 rounded-md flex items-center gap-1">
                        Ver por: Todos os Projetos <span>▾</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${overallProgress}%`,
                        background: 'linear-gradient(90deg, #C9A45C, #E8C76D, #C9A45C)',
                        boxShadow: '0 0 12px rgba(201,164,92,0.5)',
                      }} />
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="rounded-2xl border border-white/[0.06] p-3 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.5))' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['Todos os Projetos', ...WORKFLOW_STEPS] as const).map(t => (
                      <button key={t} onClick={() => setStageFilter(t as any)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] tracking-wide transition-all whitespace-nowrap ${
                          stageFilter === t
                            ? 'bg-gold/15 text-gold border border-gold/35'
                            : 'border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}>{t}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar projeto…"
                        className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-52" />
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[12px] border border-white/[0.08] text-white/55 hover:text-gold hover:border-gold/30 transition-all">⚙ Filtros</button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                {/* Header */}
                <div className="grid grid-cols-[1.7fr_1.4fr_1.5fr_1.2fr_1fr_0.9fr_0.3fr] gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  {['Projeto','Etapa Atual','Progresso','Prazo Entrega','Responsável','Status','Ações'].map(h => (
                    <p key={h} className="text-[10px] tracking-widest uppercase text-white/35 font-medium">{h}</p>
                  ))}
                </div>

                {/* Rows */}
                {filtered.map(({ p, step, progress }, i) => {
                  const status = statusForProject(p)
                  const dias = daysUntilPt(p.entregaPrevista)
                  const stepColor = PROGRESS_COLORS[step]
                  return (
                    <div key={p.id}
                      className="grid grid-cols-[1.7fr_1.4fr_1.5fr_1.2fr_1fr_0.9fr_0.3fr] gap-3 px-5 py-4 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-all">
                      {/* Projeto */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <img src={p.foto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{p.noivos}</p>
                          <p className="text-[10px] text-white/40">Casamento: {p.dataCasamento}</p>
                          <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-gold/10 border border-gold/25 text-gold uppercase tracking-widest font-bold">
                            {p.pacote.replace(' 👑','')}
                          </span>
                        </div>
                      </div>

                      {/* Etapa */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                          style={{ background: `${stepColor}1a`, borderColor: `${stepColor}55`, color: stepColor }}>
                          {STEP_ICONS[step]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{step}</p>
                          <p className="text-[10px] text-white/40 truncate">{WORKFLOW_DESCRIPTIONS[step]}</p>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-white">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full transition-all duration-700"
                            style={{ width: `${progress}%`, background: stepColor, boxShadow: `0 0 8px ${stepColor}80` }} />
                        </div>
                      </div>

                      {/* Prazo */}
                      <div>
                        <p className="text-[12px] text-white/85 font-medium">{p.entregaPrevista}</p>
                        <p className={`text-[10px] ${dias < 0 ? 'text-red-300' : 'text-white/40'}`}>
                          {dias < 0 ? `Atrasado ${Math.abs(dias)} dias` : `Faltam ${dias} dias`}
                        </p>
                      </div>

                      {/* Responsável */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 shrink-0">
                          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face" alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[12px] text-white/75 truncate">{p.editor}</p>
                      </div>

                      {/* Status */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${status.cls} text-center`}>
                        {status.label}
                      </span>

                      {/* Ações */}
                      <button className="w-8 h-8 rounded-lg text-white/50 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center justify-self-end">⋮</button>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[12px] text-white/35">Sem projetos nesta etapa.</p>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                <FeatureCard icon="◷" title="Transparência Total" desc="Acompanhe cada etapa em tempo real." />
                <FeatureCard icon="◫" title="Prazos Inteligentes" desc="Datas calculadas automaticamente com base no workflow." />
                <FeatureCard icon="✓" title="Qualidade Garantida" desc="Processos padronizados para entregas excepcionais." />
                <FeatureCard icon="↻" title="Sincronização Automática" desc="Workflow 100% integrado com projetos, tarefas e calendário." />
              </div>
            </div>

            {/* RIGHT PANEL */}
            <aside className="flex flex-col gap-4">

              {/* Resumo do Workflow */}
              <Panel title="Resumo do Workflow">
                <div className="flex items-center gap-4">
                  <Donut items={WORKFLOW_STEPS.map(s => ({ value: stageCounts[s], color: PROGRESS_COLORS[s] }))}
                    total={enriched.length}
                    label="Projetos" />
                  <div className="flex-1 space-y-1.5">
                    {WORKFLOW_STEPS.map(s => stageCounts[s] > 0 && (
                      <div key={s} className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full" style={{ background: PROGRESS_COLORS[s], boxShadow: `0 0 6px ${PROGRESS_COLORS[s]}99` }} />
                        <span className="font-semibold text-white tabular-nums w-3">{stageCounts[s]}</span>
                        <span className="text-white/55">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* Atividades Recentes */}
              <Panel title="Atividades Recentes" right={<button className="text-[11px] tracking-wider uppercase text-gold/70 hover:text-gold transition-colors">Ver todas</button>}>
                <div className="space-y-3">
                  {activities.length === 0 && (
                    <p className="text-[11px] text-white/30 italic">Ainda sem atividade registada.</p>
                  )}
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-gold/20 bg-gold/[0.06] text-gold text-base shrink-0">
                        {a.ico}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{a.titulo}</p>
                        <p className="text-[11px] text-white/45 truncate">{a.noivos}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{a.quando}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Próximos Prazos */}
              <Panel title="Próximos Prazos" right={<button className="text-[11px] tracking-wider uppercase text-gold/70 hover:text-gold transition-colors">Ver todos</button>}>
                <div className="space-y-3">
                  {proxPrazos.length === 0 && (
                    <p className="text-[11px] text-white/30 italic">Sem entregas nos próximos dias.</p>
                  )}
                  {proxPrazos.map(({ p, step, dias }) => (
                    <div key={p.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0"
                        style={{ background: `${PROGRESS_COLORS[step]}1a`, borderColor: `${PROGRESS_COLORS[step]}55`, color: PROGRESS_COLORS[step] }}>
                        {STEP_ICONS[step]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{step === 'Entrega' ? 'Entrega final' : `Próxima: ${step}`}</p>
                        <p className="text-[11px] text-white/45 truncate">{p.noivos}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{p.entregaPrevista}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold shrink-0 ${
                        dias <= 3 ? 'bg-red-500/15 text-red-300 border-red-500/30' :
                        dias <= 10 ? 'bg-gold/15 text-gold border-gold/30' :
                                     'bg-white/[0.04] text-white/55 border-white/15'
                      }`}>{dias === 0 ? 'Hoje' : `${dias} dias`}</span>
                    </div>
                  ))}
                </div>
              </Panel>

            </aside>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Workflow Master</p>
        </div>
      </main>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function WorkflowTimeline({ activeStep }: { activeStep: WorkflowStep }) {
  const activeIdx = WORKFLOW_STEPS.indexOf(activeStep)
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute top-7 left-7 right-7 h-px bg-white/[0.08]" />
      <div className="absolute top-7 left-7 h-px transition-all duration-1000"
        style={{
          width: `calc(${(activeIdx / (WORKFLOW_STEPS.length - 1)) * 100}% - ${activeIdx === 0 ? 0 : 14}px)`,
          background: 'linear-gradient(90deg, #C9A45C, #E8C76D, #C9A45C)',
          boxShadow: '0 0 10px rgba(201,164,92,0.5)',
        }} />

      <div className="relative grid grid-cols-9 gap-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const completed = i < activeIdx
          const active = i === activeIdx
          const pending = i > activeIdx
          return (
            <div key={step} className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all relative ${
                completed
                  ? 'bg-gold border-2 border-gold text-black'
                  : active
                    ? 'border-2 border-gold/70 text-gold bg-gold/[0.06]'
                    : 'border-2 border-white/[0.08] text-white/30 bg-black/30'
              }`}
                style={
                  active ? { boxShadow: '0 0 20px rgba(201,164,92,0.6), 0 0 40px rgba(201,164,92,0.25)' } :
                  completed ? { boxShadow: '0 0 14px rgba(201,164,92,0.4)' } :
                  {}
                }>
                {completed ? '✓' : STEP_ICONS[step]}
              </div>

              {/* Number badge */}
              <span className={`mt-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                completed || active ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-white/[0.04] text-white/30 border border-white/10'
              }`}>
                {i + 1}
              </span>

              {/* Label */}
              <p className={`mt-2 text-[11.5px] font-semibold leading-tight ${
                active ? 'text-gold' : completed ? 'text-white/85' : 'text-white/45'
              }`}>{step}</p>
              <p className="mt-1 text-[9.5px] text-white/35 leading-tight max-w-[100px]">{WORKFLOW_DESCRIPTIONS[step]}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside
      className="painel-sidebar flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <BrandLogo />
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

      <div className="px-4 pb-3">
        <div className="rounded-xl border border-gold/15 p-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), transparent)' }}>
          <p className="text-gold/40 text-xl font-serif leading-none mb-1.5">&ldquo;</p>
          <p className="text-[11px] text-white/55 italic leading-relaxed">Cada etapa nos aproxima de histórias eternas.</p>
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
        <img src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=280&fit=crop"
          alt="" className="w-full h-full object-cover" style={{ filter: 'blur(1.5px)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-7">
        <div className="flex items-center gap-5 max-w-xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-2xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>☰</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Workflow</h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed">Acompanhe todas as etapas do projeto até à entrega final.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          <MessagesBell />
          <button className="w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center">
            <span className="text-lg text-white/75">📅</span>
          </button>
          <button className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Novo Projeto
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
  const c = size / 2
  const strokeW = 14
  const innerR = (size / 2) - strokeW / 2

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

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-4 backdrop-blur-md hover:border-gold/25 transition-all"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.55))' }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base text-gold shrink-0"
          style={{ background: 'rgba(201,164,92,0.08)', border: '1px solid rgba(201,164,92,0.25)' }}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-white mb-0.5">{title}</p>
          <p className="text-[11px] text-white/45 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}
