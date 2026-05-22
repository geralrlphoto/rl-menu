'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ────────────────────────────────────────────────────────────────────────────
//  NOVOS PROJETOS — RL Photo.Video (premium cinematic editor workspace)
// ────────────────────────────────────────────────────────────────────────────

type WorkflowStage =
  | 'Novo Projeto' | 'Em Edição' | 'Color Grading' | 'Trailer em Produção'
  | 'Áudio / Sincronização' | 'Para Revisão' | 'Correções' | 'Finalizado' | 'Entregue'

type Approval = 'Aguardando Revisão' | 'Aprovado Cliente' | 'Requer Alterações' | 'Não Aprovado'

type ProjectFile = { name: string; size: string; date: string }
type Version    = { tag: string; date: string; nota: string }
type DeliveryItem = { type: string; status: 'Não enviado'|'Enviado'|'Aprovado'|'Necessita alterações' }

type Project = {
  id: string
  noivos: string
  foto: string
  recebido: string      // dd/mm/yyyy HH:MM
  dataCasamento: string // dd/mm/yyyy
  entregaPrevista: string
  pacote: 'Pacote Premium 👑' | 'Pacote Essencial'
  duracao: string       // ~12 min
  stage: WorkflowStage
  approval: Approval
  observacoes: string[]
  clientLink: string
  materialStatus: 'Material pendente'|'Material recebido'|'Material descarregado'
  downloadStatus: 'Não descarregado'|'Em download'|'Material recebido'|'Download concluído'
  ultimoDownload: string | null
  files: ProjectFile[]
  finalLink: string
  deliveries: DeliveryItem[]
  versions: Version[]
  feedback: string[]
}

const PROJECTS: Project[] = [
  {
    id: 'p1',
    noivos: 'Amanda & Lucas',
    foto: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
    recebido: '18/05/2026 — 14:32',
    dataCasamento: '28/06/2026',
    entregaPrevista: '15/07/2026',
    pacote: 'Pacote Premium 👑',
    duracao: '~12 min',
    stage: 'Em Edição',
    approval: 'Aguardando Revisão',
    observacoes: [],
    clientLink: 'https://drive.google.com/drive/folders/AmandaLucas2026',
    materialStatus: 'Material descarregado',
    downloadStatus: 'Download concluído',
    ultimoDownload: '19/05/2026 — 15:42',
    files: [
      { name: 'Cerimonia_A.mov',       size: '4.2 GB', date: '19/05/2026' },
      { name: 'Drone_01.mp4',          size: '1.8 GB', date: '19/05/2026' },
      { name: 'Audio_Cerimonia.wav',   size: '420 MB', date: '19/05/2026' },
      { name: 'Bride_Preparation.mp4', size: '3.1 GB', date: '19/05/2026' },
      { name: 'MakingOf.mov',          size: '2.4 GB', date: '19/05/2026' },
    ],
    finalLink: '',
    deliveries: [
      { type: 'Trailer Final',       status: 'Não enviado' },
      { type: 'Filme Completo',      status: 'Não enviado' },
      { type: 'Instagram Reels',     status: 'Não enviado' },
      { type: 'Teaser',              status: 'Não enviado' },
      { type: 'Cerimónia Completa',  status: 'Não enviado' },
      { type: 'Discursos',           status: 'Não enviado' },
      { type: 'RAW Export',          status: 'Não enviado' },
    ],
    versions: [],
    feedback: [],
  },
  {
    id: 'p2',
    noivos: 'Beatriz & Gabriel',
    foto: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&h=600&fit=crop',
    recebido: '17/05/2026 — 09:12',
    dataCasamento: '31/05/2026',
    entregaPrevista: '20/06/2026',
    pacote: 'Pacote Premium 👑',
    duracao: '~14 min',
    stage: 'Para Revisão',
    approval: 'Requer Alterações',
    observacoes: ['Mudar música do trailer', 'Adicionar mais planos drone', 'Reduzir cena de discursos'],
    clientLink: 'https://www.dropbox.com/sh/abc123/BeatrizGabriel',
    materialStatus: 'Material descarregado',
    downloadStatus: 'Download concluído',
    ultimoDownload: '18/05/2026 — 11:20',
    files: [
      { name: 'Ceremony_Master.mov',   size: '5.6 GB', date: '18/05/2026' },
      { name: 'Drone_Reception.mp4',   size: '2.2 GB', date: '18/05/2026' },
      { name: 'Speech_Father.wav',     size: '180 MB', date: '18/05/2026' },
      { name: 'FirstDance.mov',        size: '1.9 GB', date: '18/05/2026' },
    ],
    finalLink: 'https://vimeo.com/beatriz-gabriel-v2',
    deliveries: [
      { type: 'Trailer Final',  status: 'Enviado' },
      { type: 'Filme Completo', status: 'Necessita alterações' },
      { type: 'Instagram Reels', status: 'Aprovado' },
      { type: 'Teaser',          status: 'Não enviado' },
    ],
    versions: [
      { tag: 'V1',           date: '15/06/2026', nota: 'V1 enviada para revisão' },
      { tag: 'Feedback',     date: '16/06/2026', nota: 'Cliente pediu alterações na música' },
      { tag: 'V2',           date: '18/06/2026', nota: 'V2 enviada com nova música' },
    ],
    feedback: ['Gostámos muito mas alterar música', 'Diminuir cena de entrada', 'Adicionar mais drone na receção'],
  },
  {
    id: 'p3',
    noivos: 'Juliana & Matheus',
    foto: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&h=600&fit=crop',
    recebido: '16/05/2026 — 18:45',
    dataCasamento: '07/06/2026',
    entregaPrevista: '28/06/2026',
    pacote: 'Pacote Essencial',
    duracao: '~8 min',
    stage: 'Novo Projeto',
    approval: 'Aguardando Revisão',
    observacoes: [],
    clientLink: 'https://wetransfer.com/downloads/juliana-matheus',
    materialStatus: 'Material pendente',
    downloadStatus: 'Não descarregado',
    ultimoDownload: null,
    files: [],
    finalLink: '',
    deliveries: [
      { type: 'Trailer Final', status: 'Não enviado' },
      { type: 'Filme Completo', status: 'Não enviado' },
    ],
    versions: [],
    feedback: [],
  },
  {
    id: 'p4',
    noivos: 'Carolina & Felipe',
    foto: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&h=600&fit=crop',
    recebido: '14/05/2026 — 11:08',
    dataCasamento: '14/06/2026',
    entregaPrevista: '05/07/2026',
    pacote: 'Pacote Premium 👑',
    duracao: '~15 min',
    stage: 'Entregue',
    approval: 'Aprovado Cliente',
    observacoes: [],
    clientLink: 'https://frame.io/carolinafelipe',
    materialStatus: 'Material descarregado',
    downloadStatus: 'Download concluído',
    ultimoDownload: '15/05/2026 — 09:32',
    files: [
      { name: 'Final_Master.mp4', size: '8.4 GB', date: '04/07/2026' },
    ],
    finalLink: 'https://vimeo.com/carolina-felipe-final',
    deliveries: [
      { type: 'Trailer Final',     status: 'Aprovado' },
      { type: 'Filme Completo',    status: 'Aprovado' },
      { type: 'Instagram Reels',   status: 'Aprovado' },
      { type: 'Cerimónia Completa', status: 'Enviado' },
    ],
    versions: [
      { tag: 'V1',           date: '20/06/2026', nota: 'V1 enviada' },
      { tag: 'V2',           date: '25/06/2026', nota: 'V2 com ajustes' },
      { tag: 'Versão Final', date: '04/07/2026', nota: 'Entrega final' },
    ],
    feedback: ['Adorámos! Está perfeito 💛'],
  },
]

// Helpers
const WORKFLOW_STAGES: WorkflowStage[] = ['Novo Projeto','Em Edição','Color Grading','Trailer em Produção','Áudio / Sincronização','Para Revisão','Correções','Finalizado','Entregue']
const APPROVAL_OPTIONS: { value: Approval; emoji: string; color: string }[] = [
  { value: 'Aguardando Revisão',  emoji: '🟡', color: 'text-yellow-300' },
  { value: 'Aprovado Cliente',    emoji: '🟢', color: 'text-emerald-300' },
  { value: 'Requer Alterações',   emoji: '🟠', color: 'text-orange-300' },
  { value: 'Não Aprovado',        emoji: '🔴', color: 'text-red-300' },
]

function progressFromStage(s: WorkflowStage): number {
  if (s === 'Novo Projeto') return 5
  if (s === 'Em Edição' || s === 'Color Grading' || s === 'Trailer em Produção' || s === 'Áudio / Sincronização') return 35
  if (s === 'Para Revisão' || s === 'Correções') return 70
  if (s === 'Finalizado') return 90
  return 100
}

function shortBadge(s: WorkflowStage): { label: string; cls: string } {
  if (s === 'Novo Projeto') return { label: 'Novo', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
  if (s === 'Para Revisão' || s === 'Correções') return { label: 'Revisão', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' }
  if (s === 'Entregue') return { label: 'Entregue', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
  return { label: 'Em Edição', cls: 'bg-gold/15 text-gold border-gold/30' }
}

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos', active: true },
  { key: 'edicao',      label: 'Em Edição',           icon: '✎' },
  { key: 'finalizados', label: 'Finalizados',         icon: '✓' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉' },
  { key: 'clientes',    label: 'Clientes',            icon: '☉' },
  { key: 'templates',   label: 'Templates',           icon: '◫' },
  { key: 'config',      label: 'Configurações',       icon: '⚙' },
]

const FILTER_TABS = ['Todos','Novo Projeto','Em Edição','Para Revisão','Aprovados','Não Aprovados','Entregues','Aguardando Cliente']

// ──────────────────────────────────────────────────────────────────────────
//  PAGE
// ──────────────────────────────────────────────────────────────────────────
export default function NovosProjetosPage() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [activeTab, setActiveTab] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [sort, setSort] = useState('Mais recentes')
  const [expanded, setExpanded] = useState<string | null>('p1')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let arr = [...projects]
    if (search.trim()) arr = arr.filter(p => p.noivos.toLowerCase().includes(search.toLowerCase()))
    if (activeTab !== 'Todos') {
      const tab = activeTab.toLowerCase()
      arr = arr.filter(p => {
        if (tab === 'aprovados') return p.approval === 'Aprovado Cliente'
        if (tab === 'não aprovados') return p.approval === 'Não Aprovado'
        if (tab === 'aguardando cliente') return p.approval === 'Aguardando Revisão'
        if (tab === 'entregues') return p.stage === 'Entregue'
        if (tab === 'novo projeto') return p.stage === 'Novo Projeto'
        if (tab === 'em edição') return ['Em Edição','Color Grading','Trailer em Produção','Áudio / Sincronização'].includes(p.stage)
        if (tab === 'para revisão') return p.stage === 'Para Revisão' || p.stage === 'Correções'
        return true
      })
    }
    if (showOnlyActive) arr = arr.filter(p => p.stage !== 'Entregue')
    return arr
  }, [projects, search, activeTab, showOnlyActive])

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10))

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      {/* Atmosfera */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[230px] z-30 flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(201,164,92,0.12)',
        }}
      >
        {/* Logo */}
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

        {/* Profile + Quote */}
        <div className="px-5 py-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold font-bold">E</div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate">Editor Pro</p>
              <p className="text-[10px] text-white/35 truncate">editorpro@mail.com</p>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-gold/15"
            style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.05), transparent)' }}>
            <p className="text-gold/40 text-2xl font-serif leading-none mb-1">&ldquo;</p>
            <p className="text-[11px] text-white/55 italic leading-relaxed font-light">Cada frame conta uma parte da história.</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="relative z-10 lg:pl-[230px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1500px] mx-auto">

          {/* HERO */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-7"
            style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&h=400&fit=crop"
                alt=""
                className="w-full h-full object-cover scale-105"
                style={{ filter: 'blur(2px)' }}
              />
            </div>
            <div className="absolute inset-0 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.15) 100%)' }} />
            <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-10 sm:py-12">
              <div className="max-w-xl">
                <p className="text-[12px] tracking-[0.5em] text-gold/70 uppercase mb-2">Editorial Workspace</p>
                <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  NOVOS <span className="italic text-gold">Projetos</span>
                </h1>
                <div className="mt-4 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
                <p className="text-[14px] text-white/55 mt-4 leading-relaxed max-w-md">
                  Acompanhe todos os projetos recebidos e o fluxo completo de edição — da chegada do material à entrega final.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/65 hover:text-gold relative">
                  🔔
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-black">2</span>
                </button>
                <button className="w-10 h-10 rounded-xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/65 hover:text-gold">
                  ◉
                </button>
                <button
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
                  style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
                  <span className="text-lg leading-none">+</span> Novo Projeto
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS BAR */}
          <div className="rounded-2xl border border-white/[0.06] p-4 mb-6 backdrop-blur-md"
            style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTER_TABS.map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] tracking-wide transition-all ${
                      activeTab === t
                        ? 'bg-gold/15 text-gold border border-gold/35'
                        : 'border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Search + Sort + Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar projeto…"
                    className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-56"
                  />
                </div>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white/70 focus:outline-none focus:border-gold/40 cursor-pointer">
                  <option>Mais recentes</option>
                  <option>Mais antigos</option>
                  <option>Entrega mais próxima</option>
                  <option>A → Z</option>
                </select>
                <button className="px-3 py-1.5 rounded-lg text-[12px] border border-white/[0.08] text-white/55 hover:text-gold hover:border-gold/30 transition-all">⚙ Filtros</button>
              </div>
            </div>

            {/* Toggle ativos */}
            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span className="relative inline-block w-9 h-5">
                  <input type="checkbox" className="peer sr-only" checked={showOnlyActive} onChange={e => setShowOnlyActive(e.target.checked)} />
                  <span className="absolute inset-0 rounded-full bg-white/[0.08] peer-checked:bg-gold/30 transition-colors" />
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/60 peer-checked:left-[18px] peer-checked:bg-gold transition-all" />
                </span>
                <span className="text-[12px] text-white/55">Mostrar apenas projetos ativos</span>
              </label>
              <span className="text-[11px] text-white/30">·</span>
              <p className="text-[11px] text-white/35">{filtered.length} projetos · {projects.filter(p => p.stage !== 'Entregue').length} ativos</p>
            </div>
          </div>

          {/* PROJECT LIST */}
          <div className="space-y-5">
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                p={p}
                expanded={expanded === p.id}
                onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
                onChange={(patch) => updateProject(p.id, patch)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-20">
                <p className="text-gold/40 text-4xl font-serif leading-none mb-3">∅</p>
                <p className="text-[14px] text-white/35">Sem projetos com este filtro.</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
            <p className="text-[12px] text-white/35">Mostrando 1–{filtered.length} de {projects.length} projetos</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} className="w-9 h-9 rounded-lg border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all">‹</button>
              {[1,2,3,'…',totalPages].map((n, i) => (
                <button key={i} onClick={() => typeof n === 'number' && setPage(n)}
                  className={`min-w-[36px] h-9 px-2.5 rounded-lg text-[12px] transition-all ${
                    n === page
                      ? 'bg-gold/20 border border-gold/40 text-gold font-bold'
                      : 'border border-white/10 text-white/50 hover:text-gold hover:border-gold/30'
                  }`}>{n}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="w-9 h-9 rounded-lg border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all">›</button>
            </div>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Wedding Moments Films</p>
        </div>
      </main>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
//  PROJECT CARD
// ──────────────────────────────────────────────────────────────────────────
function ProjectCard({
  p, expanded, onToggle, onChange,
}: {
  p: Project
  expanded: boolean
  onToggle: () => void
  onChange: (patch: Partial<Project>) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = shortBadge(p.stage)
  const progress = progressFromStage(p.stage)

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(20,15,8,0.5), rgba(11,11,11,0.85))',
        borderColor: expanded ? 'rgba(201,164,92,0.4)' : 'rgba(255,255,255,0.06)',
        boxShadow: expanded
          ? '0 30px 70px -20px rgba(0,0,0,0.6), 0 0 30px -8px rgba(201,164,92,0.25)'
          : '0 10px 30px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* Hover glow sweep */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.04] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

      {/* TOP — compact view */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[280px_1fr_auto] gap-5 p-5">
        {/* Thumb */}
        <button onClick={onToggle} className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10 group/img">
          <img src={p.foto} alt={p.noivos} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        </button>

        {/* Info */}
        <div className="flex flex-col gap-2 min-w-0">
          <div>
            <h2 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{p.noivos}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-widest font-bold">Novo Projeto</span>
              <span className="text-[11px] text-white/40">· {p.pacote}</span>
              <span className="text-[11px] text-white/40">· {p.duracao}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-1">
            <Meta label="Recebido"     value={p.recebido} />
            <Meta label="Data Casamento" value={p.dataCasamento} />
            <Meta label="Entrega Prevista" value={p.entregaPrevista} />
          </div>

          {/* Progress */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] tracking-widest uppercase text-white/40">Progresso · {p.stage}</p>
              <p className="text-[12px] font-bold text-gold">{progress}%</p>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #C9A45C, #E8C76D, #C9A45C)',
                  boxShadow: '0 0 12px rgba(201,164,92,0.5)',
                }} />
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end justify-between gap-3">
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)}
              className="w-9 h-9 rounded-lg border border-white/10 text-white/60 hover:text-gold hover:border-gold/30 transition-all flex items-center justify-center text-lg">⋮</button>
            {menuOpen && (
              <div className="absolute top-11 right-0 w-56 rounded-xl border border-gold/20 backdrop-blur-xl p-1.5 z-30"
                style={{ background: 'rgba(15,12,8,0.95)', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)' }}>
                {[
                  'Abrir Projeto','Editar Dados','Adicionar Observações','Enviar Revisão',
                  'Marcar Entrega','Arquivar Projeto','Abrir Material Original','Download Material',
                  'Abrir Projeto Final','Copiar Link Final',
                ].map(a => (
                  <button key={a} onClick={() => setMenuOpen(false)}
                    className="w-full text-left text-[12px] px-3 py-2 rounded-lg text-white/65 hover:text-gold hover:bg-gold/10 transition-all">
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onToggle}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gold/30 text-gold text-[12px] tracking-wider uppercase font-semibold hover:bg-gold/10 transition-all">
            {expanded ? 'Fechar' : 'Abrir Projeto'} <span>{expanded ? '⌃' : '⌄'}</span>
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {expanded && (
        <div className="relative border-t border-white/[0.06] px-5 sm:px-8 py-7 space-y-7"
          style={{ background: 'linear-gradient(180deg, rgba(11,11,11,0.4), rgba(11,11,11,0.7))' }}>

          {/* Workflow */}
          <Section title="Status do Vídeo">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {WORKFLOW_STAGES.map(s => {
                const active = p.stage === s
                return (
                  <button key={s} onClick={() => onChange({ stage: s })}
                    className={`px-3 py-2.5 rounded-xl border text-[11px] text-left transition-all flex items-center gap-2 ${
                      active
                        ? 'bg-gold/15 border-gold/45 text-gold'
                        : 'border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                    }`}
                    style={active ? { boxShadow: '0 0 14px -2px rgba(201,164,92,0.4)' } : {}}>
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-gold' : 'bg-white/15'}`} style={active ? { boxShadow: '0 0 8px rgba(201,164,92,0.7)' } : {}} />
                    {s}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Approval */}
          <Section title="Aprovação do Cliente">
            <div className="flex flex-wrap gap-2">
              {APPROVAL_OPTIONS.map(a => {
                const active = p.approval === a.value
                return (
                  <button key={a.value} onClick={() => onChange({ approval: a.value })}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] transition-all ${
                      active ? 'border-gold/40 bg-gold/[0.06] text-white' : 'border-white/[0.06] text-white/55 hover:text-white hover:bg-white/[0.03]'
                    }`}>
                    <span>{a.emoji}</span> {a.value}
                  </button>
                )
              })}
            </div>

            {(p.approval === 'Requer Alterações' || p.approval === 'Não Aprovado') && (
              <div className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/[0.04] p-4">
                <p className="text-[11px] tracking-[0.3em] uppercase text-orange-300/70 font-bold mb-2">Observações do Cliente</p>
                {p.observacoes.length > 0 ? (
                  <ul className="space-y-1">
                    {p.observacoes.map((o, i) => (
                      <li key={i} className="text-[13px] text-white/75 flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">→</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-white/35 italic">Sem observações registadas.</p>
                )}
              </div>
            )}
          </Section>

          {/* Files & Links */}
          <Section title="Ficheiros e Links">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cliente link */}
              <Card>
                <Label>Link enviado pelo cliente</Label>
                <p className="text-[10px] text-white/30 mb-2">Drive · Dropbox · Frame.io · WeTransfer · Mega</p>
                <div className="flex items-center gap-2">
                  <input
                    defaultValue={p.clientLink}
                    placeholder="https://drive.google.com/…"
                    className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-gold/40 truncate"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <PillBtn label="Abrir Link" />
                  <PillBtn label="Copiar Link" />
                  <PillBtn label="Download Material" gold />
                  <PillBtn label="Download All" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${
                    p.materialStatus === 'Material descarregado' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                    p.materialStatus === 'Material recebido' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                  }`}>{p.materialStatus}</span>
                </div>
              </Card>

              {/* Download status */}
              <Card>
                <Label>Estado do Download (freelancer)</Label>
                <div className="space-y-2 mt-2">
                  {(['Não descarregado','Em download','Material recebido','Download concluído'] as const).map(s => {
                    const active = p.downloadStatus === s
                    return (
                      <button key={s} onClick={() => onChange({ downloadStatus: s, ultimoDownload: s === 'Download concluído' ? '24/05/2026 — 18:30' : p.ultimoDownload })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-[12px] transition-all ${
                          active ? 'bg-gold/10 border-gold/30 text-gold' : 'border-white/[0.06] text-white/55 hover:bg-white/[0.03]'
                        }`}>
                        <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${active ? 'bg-gold border-gold' : 'border-white/25'}`}>
                          {active && <span className="text-[10px] text-black font-bold">✓</span>}
                        </span>
                        {s}
                      </button>
                    )
                  })}
                </div>
                {p.ultimoDownload && (
                  <p className="text-[11px] text-white/40 mt-3">Último download: <span className="text-gold/80">{p.ultimoDownload}</span></p>
                )}
              </Card>
            </div>
          </Section>

          {/* Project files */}
          <Section title="Material do Projeto">
            {p.files.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
                <p className="text-[12px] text-white/35">Sem ficheiros descarregados ainda.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] tracking-widest uppercase text-white/35 bg-white/[0.02]">
                      <th className="text-left px-4 py-2.5 font-medium">Ficheiro</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tamanho</th>
                      <th className="text-left px-4 py-2.5 font-medium">Data</th>
                      <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.files.map((f, i) => (
                      <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5 text-[12px] text-white/85 font-mono">{f.name}</td>
                        <td className="px-4 py-2.5 text-[12px] text-white/55">{f.size}</td>
                        <td className="px-4 py-2.5 text-[12px] text-white/55">{f.date}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button className="text-[11px] text-white/50 hover:text-gold transition-colors mr-3">Preview</button>
                          <button className="text-[11px] text-gold/70 hover:text-gold transition-colors">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Final Delivery */}
          <Section title="Entrega Final">
            <Card>
              <Label>Link do Projeto Final</Label>
              <p className="text-[10px] text-white/30 mb-2">Drive · Dropbox · Frame.io · Vimeo · Wedding Gallery</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  defaultValue={p.finalLink}
                  placeholder="Adicionar link final…"
                  className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-gold/40 min-w-[260px]"
                />
                <PillBtn label="Guardar link" gold />
                <PillBtn label="Abrir link" />
                <PillBtn label="Copiar link" />
                <PillBtn label="Enviar cliente" />
                <PillBtn label="Substituir versão" />
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {p.deliveries.map((d, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] p-3 bg-white/[0.02]">
                  <p className="text-[12px] font-medium text-white/85 mb-1.5">{d.type}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-bold ${
                    d.status === 'Aprovado' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                    d.status === 'Enviado'  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                    d.status === 'Necessita alterações' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                    'bg-white/[0.06] text-white/40 border-white/15'
                  }`}>{d.status}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Review timeline */}
          <Section title="Workflow de Revisão">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/15 border border-gold/40 text-gold text-[12px] tracking-wider uppercase font-semibold hover:bg-gold/25 transition-all"
                style={{ boxShadow: '0 0 16px -4px rgba(201,164,92,0.4)' }}>
                ↗ Enviar Para Revisão
              </button>
              <PillBtn label="Criar V1" />
              <PillBtn label="Criar V2" />
              <PillBtn label="Versão Final" />
            </div>

            {p.versions.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />
                {p.versions.map((v, i) => (
                  <div key={i} className="relative mb-3 last:mb-0">
                    <span className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-gold border-2 border-black" style={{ boxShadow: '0 0 8px rgba(201,164,92,0.7)' }} />
                    <p className="text-[12px] text-white/85"><span className="text-gold font-bold">{v.date}</span> · <span className="text-white/60">{v.tag}</span></p>
                    <p className="text-[11px] text-white/45">{v.nota}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-white/35 italic">Sem versões enviadas ainda.</p>
            )}
          </Section>

          {/* Client feedback */}
          <Section title="Feedback do Cliente">
            {p.feedback.length > 0 ? (
              <div className="space-y-2">
                {p.feedback.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-start gap-3">
                    <span className="text-gold/60 text-xl leading-none">&ldquo;</span>
                    <p className="flex-1 text-[13px] text-white/75 italic">{f}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-white/35 italic">Sem feedback registado.</p>
            )}
            <textarea
              placeholder="Adicionar nota do cliente…"
              rows={2}
              className="mt-3 w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[12px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none leading-relaxed"
            />
          </Section>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
//  Helpers (UI)
// ──────────────────────────────────────────────────────────────────────────
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] tracking-widest uppercase text-white/35 mb-0.5">{label}</p>
      <p className="text-[13px] font-medium text-white/85 truncate">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-3">{title}</p>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02]">{children}</div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{children}</p>
}

function PillBtn({ label, gold }: { label: string; gold?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-[11px] tracking-wider uppercase font-semibold transition-all border ${
        gold
          ? 'bg-gold text-black border-gold hover:bg-gold/90'
          : 'border-white/[0.08] text-white/55 hover:text-gold hover:border-gold/30'
      }`}
      style={gold ? { boxShadow: '0 0 14px -4px rgba(201,164,92,0.5)' } : {}}>
      {label}
    </button>
  )
}
