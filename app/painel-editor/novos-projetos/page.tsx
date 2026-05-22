'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ────────────────────────────────────────────────────────────────────────────
//  NOVOS PROJETOS — RL Photo.Video (premium cinematic editor workspace)
// ────────────────────────────────────────────────────────────────────────────

type WorkflowStage =
  | 'Novo Projeto' | 'Em Edição' | 'Color Grading' | 'Trailer em Produção'
  | 'Áudio / Sincronização' | 'Para Revisão' | 'Correções' | 'Finalizado' | 'Entregue'

type Approval = 'Aguardando Revisão' | 'Aprovado Cliente' | 'Requer Alterações' | 'Não Aprovado'

type ProjectFile = { name: string; size: string; date: string }
type Version    = { tag: string; date: string; nota: string }

// ── Tipos de Entrega Final (selecionáveis no Novo Projeto) ─────────────
type EntregaTipo =
  | 'Trailer Final' | 'Filme Completo' | 'Instagram Reels' | 'Teaser'
  | 'Cerimónia Completa' | 'Discursos' | 'RAW Export'
  | 'Sessão Noivos' | 'Dança dos Noivos' | 'Filme Drone' | 'Versão Reduzida' | 'Pré-Wedding'

type DeliveryItem = {
  type: EntregaTipo
  status: 'Não enviado'|'Enviado'|'Aprovado'|'Necessita alterações'
}

const ENTREGAS_DISPONIVEIS: EntregaTipo[] = [
  'Trailer Final', 'Filme Completo', 'Instagram Reels', 'Teaser',
  'Cerimónia Completa', 'Discursos', 'Sessão Noivos', 'Dança dos Noivos',
  'Filme Drone', 'Versão Reduzida', 'Pré-Wedding', 'RAW Export',
]

const ENTREGA_ICONS: Record<EntregaTipo, string> = {
  'Trailer Final':       '▶',
  'Filme Completo':      '◫',
  'Instagram Reels':     '◯',
  'Teaser':              '◐',
  'Cerimónia Completa':  '⛪',
  'Discursos':           '🎤',
  'RAW Export':          '◇',
  'Sessão Noivos':       '◉',
  'Dança dos Noivos':    '♪',
  'Filme Drone':         '◇',
  'Versão Reduzida':     '◯',
  'Pré-Wedding':         '✿',
}

// ── Categorias de Material ──────────────────────────────────────────────
type MaterialCategoria =
  | 'Making Off Noivo' | 'Making Off Noiva' | 'Cerimónia' | 'Cocktail' | 'Festa'
  | 'Sessão Noivos' | 'Dança dos Noivos' | 'Votos dos Noivos' | 'Discursos'
  | 'Corte do Bolo' | 'Drone' | 'Áudio Geral' | 'Áudio Lapela'

type MaterialItem = {
  categoria: MaterialCategoria
  status: 'Pendente' | 'Recebido' | 'Descarregado'
  size?: string
  date?: string
}

const MATERIAL_CATEGORIAS: MaterialCategoria[] = [
  'Making Off Noivo', 'Making Off Noiva', 'Cerimónia', 'Cocktail', 'Festa',
  'Sessão Noivos', 'Dança dos Noivos', 'Votos dos Noivos', 'Discursos',
  'Corte do Bolo', 'Drone', 'Áudio Geral', 'Áudio Lapela',
]

const MATERIAL_ICONS: Record<MaterialCategoria, string> = {
  'Making Off Noivo': '◇', 'Making Off Noiva': '✿', 'Cerimónia': '⛪', 'Cocktail': '🥂', 'Festa': '✦',
  'Sessão Noivos': '◉', 'Dança dos Noivos': '♪', 'Votos dos Noivos': '♥', 'Discursos': '◐',
  'Corte do Bolo': '◍', 'Drone': '◇', 'Áudio Geral': '◯', 'Áudio Lapela': '◐',
}

// ── Referências de Eventos (vêm de /api/eventos-supabase) ────────────────
type EventReference = {
  ref: string
  ano: number
  noivos: string
  data: string   // dd/mm/yyyy (display)
  local: string
  foto: string
}

// Foto fallback aleatória (a API ainda não devolve foto de capa)
const FALLBACK_FOTOS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&h=600&fit=crop',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&h=600&fit=crop',
]

/** Converte YYYY-MM-DD da API para DD/MM/YYYY de display */
function isoToPt(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/** Converte DD/MM/YYYY para YYYY-MM-DD (formato HTML <input type='date'>) */
function ptToIso(pt: string): string {
  if (!pt) return ''
  const [d, m, y] = pt.split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

/** Mapeia evento da API para EventReference — aceita TODOS os eventos com referência */
function eventToRef(e: any, idx: number): EventReference | null {
  if (!e.referencia) return null  // só ignora eventos sem referência
  const dataPt = isoToPt(e.data_evento)
  const ano = parseInt((e.data_evento || '').slice(0,4)) || new Date().getFullYear()
  return {
    ref:    e.referencia,
    ano,
    noivos: e.cliente || '—',
    data:   dataPt,
    local:  e.local || '',
    foto:   FALLBACK_FOTOS[idx % FALLBACK_FOTOS.length],
  }
}

type Project = {
  id: string
  referencia?: string   // ex: CAS_001_26_RL
  noivos: string
  local?: string        // local do casamento
  foto: string
  recebido: string      // data de criação do projeto — dd/mm/yyyy HH:MM
  dataCasamento: string // dd/mm/yyyy
  entregaPrevista: string
  pacote: 'Pacote Premium 👑' | 'Pacote Essencial'
  preco?: number        // valor total do projeto em €
  duracao: string       // ~12 min
  stage: WorkflowStage
  approval: Approval
  observacoes: string[]
  clientLink: string
  materialStatus: 'Material pendente'|'Material recebido'|'Material descarregado'
  downloadStatus: 'Não descarregado'|'Em download'|'Material recebido'|'Download concluído'
  ultimoDownload: string | null
  materialItems: MaterialItem[]   // categorias seleccionadas para este projeto
  finalLink: string
  deliveries: DeliveryItem[]
  versions: Version[]
  feedback: string[]
}

const PROJECTS: Project[] = [
  {
    id: 'p1',
    referencia: 'CAS_001_26_RL',
    noivos: 'Amanda & Lucas',
    local: 'Quinta da Bichinha, Lisboa',
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
    materialItems: [
      { categoria: 'Making Off Noiva', status: 'Descarregado', size: '3.1 GB', date: '19/05/2026' },
      { categoria: 'Cerimónia',         status: 'Descarregado', size: '4.2 GB', date: '19/05/2026' },
      { categoria: 'Drone',             status: 'Descarregado', size: '1.8 GB', date: '19/05/2026' },
      { categoria: 'Áudio Geral',       status: 'Descarregado', size: '420 MB', date: '19/05/2026' },
      { categoria: 'Votos dos Noivos',  status: 'Descarregado', size: '2.4 GB', date: '19/05/2026' },
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
    referencia: 'CAS_002_26_RL',
    noivos: 'Beatriz & Gabriel',
    local: 'Solar do Pelourinho, Sintra',
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
    materialItems: [
      { categoria: 'Cerimónia',         status: 'Descarregado', size: '5.6 GB', date: '18/05/2026' },
      { categoria: 'Drone',             status: 'Descarregado', size: '2.2 GB', date: '18/05/2026' },
      { categoria: 'Discursos',         status: 'Descarregado', size: '180 MB', date: '18/05/2026' },
      { categoria: 'Dança dos Noivos',  status: 'Descarregado', size: '1.9 GB', date: '18/05/2026' },
      { categoria: 'Festa',             status: 'Recebido' },
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
    referencia: 'CAS_003_26_RL',
    noivos: 'Juliana & Matheus',
    local: 'Quinta da Lagoalva, Alpiarça',
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
    materialItems: [
      { categoria: 'Cerimónia',  status: 'Pendente' },
      { categoria: 'Cocktail',   status: 'Pendente' },
      { categoria: 'Festa',      status: 'Pendente' },
    ],
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
    referencia: 'CAS_004_26_RL',
    noivos: 'Carolina & Felipe',
    local: 'Quinta dos Lagares, Óbidos',
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
    materialItems: [
      { categoria: 'Making Off Noivo', status: 'Descarregado', size: '2.2 GB', date: '15/05/2026' },
      { categoria: 'Making Off Noiva', status: 'Descarregado', size: '3.4 GB', date: '15/05/2026' },
      { categoria: 'Cerimónia',         status: 'Descarregado', size: '6.8 GB', date: '15/05/2026' },
      { categoria: 'Cocktail',          status: 'Descarregado', size: '4.1 GB', date: '15/05/2026' },
      { categoria: 'Festa',             status: 'Descarregado', size: '8.4 GB', date: '15/05/2026' },
      { categoria: 'Drone',             status: 'Descarregado', size: '2.9 GB', date: '15/05/2026' },
      { categoria: 'Áudio Lapela',      status: 'Descarregado', size: '320 MB', date: '15/05/2026' },
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
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

const FILTER_TABS = ['Todos','Novo Projeto','Em Edição','Para Revisão','Aprovados','Não Aprovados','Entregues','Aguardando Cliente']

// ──────────────────────────────────────────────────────────────────────────
//  PAGE
// ──────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'painel-editor-user-projects'
const STORAGE_PATCHES_KEY = 'painel-editor-project-patches'
const STORAGE_UNSEEN_KEY = 'painel-editor-unseen-projects'

export default function NovosProjetosPage() {
  const searchParams = useSearchParams()
  const openParam = searchParams?.get('open') ?? null
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [unseenIds, setUnseenIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [sort, setSort] = useState('Mais recentes')
  const [expanded, setExpanded] = useState<string | null>(openParam || 'p1')

  // Se URL tiver ?open={id} → expande esse projeto + scroll
  useEffect(() => {
    if (!openParam) return
    setExpanded(openParam)
    // Marca como visto (remove o glow)
    setUnseenIds(prev => {
      if (!prev.has(openParam)) return prev
      const next = new Set(prev); next.delete(openParam); return next
    })
    // Scroll suave depois do render
    setTimeout(() => {
      const el = document.getElementById(`project-${openParam}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  }, [openParam])
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)

  // ── Carregar projetos criados pelo utilizador + patches sobre mocks ───
  useEffect(() => {
    try {
      const userJson = localStorage.getItem(STORAGE_KEY)
      const userProjects: Project[] = userJson ? JSON.parse(userJson) : []

      const patchesJson = localStorage.getItem(STORAGE_PATCHES_KEY)
      const patches: Record<string, Partial<Project>> = patchesJson ? JSON.parse(patchesJson) : {}

      // user-created projects no topo + mocks com patches aplicados + filtra eliminados
      const merged: Project[] = [
        ...userProjects,
        ...PROJECTS
          .map(p => patches[p.id] ? { ...p, ...patches[p.id] } : p)
          .filter(p => !(p as any).archived && !(p as any).cancelled),
      ]
      setProjects(merged)

      // Unseen: ids de projetos novos que ainda não foram abertos
      const unseenJson = localStorage.getItem(STORAGE_UNSEEN_KEY)
      const unseen: string[] = unseenJson ? JSON.parse(unseenJson) : []
      setUnseenIds(new Set(unseen))
    } catch (err) {
      console.warn('Erro ao carregar projetos guardados:', err)
    }
    setHydrated(true)
  }, [])

  // ── Persistir unseen ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_UNSEEN_KEY, JSON.stringify([...unseenIds]))
    } catch {}
  }, [unseenIds, hydrated])

  function markAsSeen(id: string) {
    setUnseenIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // ── Persistir alterações no localStorage ─────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    try {
      const mockIds = new Set(PROJECTS.map(p => p.id))
      // 1) Projetos criados pelo utilizador (não estão no mock)
      const userProjects = projects.filter(p => !mockIds.has(p.id))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProjects))

      // 2) Patches sobre projetos mock (alterações de stage/approval/etc)
      const patches: Record<string, Partial<Project>> = {}
      projects.forEach(p => {
        if (mockIds.has(p.id)) {
          const original = PROJECTS.find(x => x.id === p.id)!
          const diff: Partial<Project> = {}
          ;(Object.keys(p) as (keyof Project)[]).forEach(k => {
            if (JSON.stringify(p[k]) !== JSON.stringify(original[k])) {
              ;(diff as any)[k] = p[k]
            }
          })
          if (Object.keys(diff).length > 0) patches[p.id] = diff
        }
      })
      localStorage.setItem(STORAGE_PATCHES_KEY, JSON.stringify(patches))
    } catch (err) {
      console.warn('Erro ao guardar projetos:', err)
    }
  }, [projects, hydrated])

  function handleCreate(p: Project) {
    setProjects(prev => [p, ...prev])
    setUnseenIds(prev => new Set([...prev, p.id]))   // brilho gold até abrir
    setShowAddModal(false)
    // não dou setExpanded aqui — deixo o user clicar para "abrir" e tirar o glow
  }

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

  function deleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    // Limpa também os outros estados relacionados
    setUnseenIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev); next.delete(id); return next
    })
    if (expanded === id) setExpanded(null)
    // Para mocks: marca patches com archived/cancelled (porque o mock vai ser re-injectado na próxima carga)
    const isMock = PROJECTS.some(p => p.id === id)
    if (isMock) {
      try {
        const raw = localStorage.getItem('painel-editor-project-patches')
        const patches = raw ? JSON.parse(raw) : {}
        patches[id] = { ...(patches[id] || {}), archived: true, cancelled: true }
        localStorage.setItem('painel-editor-project-patches', JSON.stringify(patches))
      } catch {}
    }
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      {/* Animação gold pulse para projetos novos não-abertos */}
      <style jsx global>{`
        @keyframes unseenGlow {
          0%, 100% { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 rgba(201,164,92,0.0), 0 0 24px -4px rgba(201,164,92,0.25); }
          50%      { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 rgba(201,164,92,0.0), 0 0 48px 0 rgba(201,164,92,0.55); }
        }
        .unseen-glow { animation: unseenGlow 2.4s ease-in-out infinite; }
      `}</style>
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
                  onClick={() => setShowAddModal(true)}
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
              <div key={p.id} id={`project-${p.id}`} className="scroll-mt-6">
                <ProjectCard
                  p={p}
                  expanded={expanded === p.id}
                  isUnseen={unseenIds.has(p.id)}
                  onToggle={() => {
                    setExpanded(expanded === p.id ? null : p.id)
                    markAsSeen(p.id)
                  }}
                  onChange={(patch) => updateProject(p.id, patch)}
                  onDelete={() => deleteProject(p.id)}
                />
              </div>
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

      {/* MODAL — Novo Projeto */}
      {showAddModal && (
        <NewProjectModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
//  NEW PROJECT MODAL
// ──────────────────────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()} — ${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`

  const [ano, setAno] = useState<number>(2026)
  const [refId, setRefId] = useState<string>('')   // referência seleccionada
  const [refsForYear, setRefsForYear] = useState<EventReference[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [errorRefs, setErrorRefs] = useState<string | null>(null)
  const ref = refsForYear.find(e => e.ref === refId) ?? null

  // Fetch referências de /api/eventos-supabase?ano={ano}
  // Devolve TODOS os eventos do ano (incluindo passados) sem filtro de tipo
  useEffect(() => {
    let cancelled = false
    setLoadingRefs(true)
    setErrorRefs(null)
    fetch(`/api/eventos-supabase?ano=${ano}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        if (d.error) {
          setErrorRefs(d.error)
          setRefsForYear([])
          return
        }
        const events: any[] = d.events ?? []
        const refs: EventReference[] = events
          .map((e, i) => eventToRef(e, i))
          .filter((x): x is EventReference => x !== null)
        // Ordena por data (mais antigos → mais recentes) para mostrar TUDO, incluindo já passados
        refs.sort((a, b) => {
          const da = a.data.split('/').reverse().join('-')
          const db = b.data.split('/').reverse().join('-')
          return da.localeCompare(db)
        })
        setRefsForYear(refs)
      })
      .catch(err => {
        if (cancelled) return
        setErrorRefs(err.message ?? 'Erro ao carregar referências')
        setRefsForYear([])
      })
      .finally(() => { if (!cancelled) setLoadingRefs(false) })
    return () => { cancelled = true }
  }, [ano])

  const [form, setForm] = useState({
    dataCriacao:     `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`,
    entregaPrevista: '',
    duracao:         '',
    valor:           '',
    clientLink:      '',
    notas:           '',
  })
  const [categorias, setCategorias] = useState<MaterialCategoria[]>([])
  const [entregas, setEntregas] = useState<EntregaTipo[]>(['Trailer Final','Filme Completo'])
  const [saving, setSaving] = useState(false)

  // Quando muda a referência seleccionada, calcula sugestão de entrega prevista (data casamento + 30 dias)
  function updateRef(r: string) {
    setRefId(r)
    const target = refsForYear.find(e => e.ref === r)
    if (target && target.data && !form.entregaPrevista) {
      const [dd,mm,yy] = target.data.split('/').map(Number)
      const d = new Date(yy, mm-1, dd); d.setDate(d.getDate() + 30)
      const suggested = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      setForm(prev => ({ ...prev, entregaPrevista: suggested }))
    }
  }

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  function toggleCategoria(c: MaterialCategoria) {
    setCategorias(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }
  function selectAllCategorias() {
    setCategorias([...MATERIAL_CATEGORIAS])
  }
  function clearCategorias() {
    setCategorias([])
  }

  function toggleEntrega(e: EntregaTipo) {
    setEntregas(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }
  function selectAllEntregas() {
    setEntregas([...ENTREGAS_DISPONIVEIS])
  }
  function clearEntregas() {
    setEntregas([])
  }

  function valid() {
    const precoNum = Number(form.valor.replace(/[^\d,.]/g,'').replace(',','.')) || 0
    return !!ref && !!form.entregaPrevista.trim() && !!form.dataCriacao.trim() && precoNum > 0
  }

  function handleSubmit() {
    if (!valid() || !ref) return
    setSaving(true)
    const createdAt = `${form.dataCriacao} — ${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`
    // Parse valor (aceita "3500", "3500,00", "3500.00", "3 500 €" etc.)
    const precoNum = Number(form.valor.replace(/[^\d,.]/g,'').replace(',','.')) || 0

    const newProject: Project = {
      id:           `p${Date.now()}`,
      referencia:   ref.ref,
      noivos:       ref.noivos,
      local:        ref.local,
      foto:         ref.foto,
      recebido:     createdAt,
      dataCasamento:   ref.data,
      entregaPrevista: form.entregaPrevista,
      pacote:       'Pacote Premium 👑',
      preco:        precoNum,
      duracao:      form.duracao.trim() || '~12 min',
      stage:        'Novo Projeto',
      approval:     'Aguardando Revisão',
      observacoes:  [],
      clientLink:   form.clientLink.trim(),
      materialStatus: 'Material pendente',
      downloadStatus: 'Não descarregado',
      ultimoDownload: null,
      materialItems: categorias.map(c => ({ categoria: c, status: 'Pendente' as const })),
      finalLink:    '',
      deliveries:   entregas.map(e => ({ type: e, status: 'Não enviado' as const })),
      versions:     [],
      feedback:     [],
    }
    setTimeout(() => {
      onCreate(newProject)
      setSaving(false)
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" onClick={onClose}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-gold/25"
        style={{
          background: 'linear-gradient(135deg, rgba(20,15,8,0.97), rgba(11,11,11,0.97))',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 50px -8px rgba(201,164,92,0.25)',
        }}>

        {/* Header */}
        <div className="relative px-7 py-6 border-b border-white/[0.06]">
          <div className="absolute inset-0 opacity-30 pointer-events-none rounded-t-3xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=300&fit=crop" alt="" className="w-full h-full object-cover" style={{ filter: 'blur(8px)' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          </div>
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-1">Editorial Workspace</p>
              <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
                Novo <span className="italic text-gold">Projeto</span>
              </h2>
              <p className="text-[12px] text-white/55 mt-1">Adiciona um novo casamento ao teu workflow.</p>
            </div>
            <button onClick={onClose}
              className="w-10 h-10 rounded-xl border border-white/15 text-white/55 hover:text-gold hover:border-gold/30 transition-all flex items-center justify-center text-lg">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">

          {/* ─── REFERÊNCIA DO EVENTO (Supabase) ─── */}
          <div className="rounded-xl border border-gold/20 p-4"
            style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.05), transparent)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-bold">Referência do Evento</p>
              {loadingRefs && (
                <span className="text-[10px] text-gold/70 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  A carregar…
                </span>
              )}
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              {/* Ano */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/45 mb-1">Ano</label>
                <select value={ano} onChange={e => { setAno(Number(e.target.value)); setRefId('') }}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40 cursor-pointer">
                  {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {/* Referência */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/45 mb-1">Referência <span className="text-gold">*</span></label>
                <select value={refId} onChange={e => updateRef(e.target.value)} disabled={loadingRefs || refsForYear.length === 0}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40 cursor-pointer font-mono disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{loadingRefs ? '— A carregar… —' : refsForYear.length === 0 ? '— Sem eventos —' : '— Seleciona o evento —'}</option>
                  {refsForYear.map(r => (
                    <option key={r.ref} value={r.ref}>{r.ref}{r.data ? ` · ${r.data}` : ''} · {r.noivos}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Erro */}
            {errorRefs && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-[11px] text-red-300">Erro: {errorRefs}</p>
              </div>
            )}

            {/* Info de quantidade */}
            {!loadingRefs && !errorRefs && refsForYear.length > 0 && !refId && (
              <p className="text-[11px] text-white/45 mt-2">
                <span className="text-gold/80 font-semibold">{refsForYear.length}</span> {refsForYear.length === 1 ? 'casamento disponível' : 'casamentos disponíveis'} em {ano}
              </p>
            )}

            {/* Preview do evento seleccionado */}
            {ref && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg border border-gold/25 bg-black/30">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-gold/30 shrink-0">
                  <img src={ref.foto} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>{ref.noivos}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/55 mt-0.5">
                    {ref.data && <span className="flex items-center gap-1">📅 <span className="text-white/85 font-medium">{ref.data}</span></span>}
                    {ref.local && <span className="flex items-center gap-1">📍 <span className="text-white/75">{ref.local}</span></span>}
                  </div>
                  <p className="text-[10px] text-gold/70 tracking-widest uppercase mt-1 font-mono">{ref.ref}</p>
                </div>
              </div>
            )}
          </div>

          {/* DATAS — Criação + Entrega Prevista (date pickers) */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Criação do Projeto" required>
              <div className="relative">
                <input
                  type="date"
                  value={ptToIso(form.dataCriacao)}
                  onChange={e => update('dataCriacao', isoToPt(e.target.value))}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40 font-mono [color-scheme:dark]" />
              </div>
              {form.dataCriacao && (
                <p className="text-[10px] text-white/45 mt-1">📅 <span className="text-gold/80">{form.dataCriacao}</span></p>
              )}
            </Field>
            <Field label="Data Prevista de Entrega" required>
              <div className="relative">
                <input
                  type="date"
                  value={ptToIso(form.entregaPrevista)}
                  onChange={e => update('entregaPrevista', isoToPt(e.target.value))}
                  min={ref ? ptToIso(ref.data) : undefined}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40 font-mono [color-scheme:dark]" />
              </div>
              {form.entregaPrevista
                ? <p className="text-[10px] text-white/45 mt-1">📅 <span className="text-gold/80">{form.entregaPrevista}</span></p>
                : ref && <p className="text-[10px] text-gold/60 mt-1">Sugestão: data do casamento + 30 dias</p>
              }
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor do Projeto (€)" required>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.valor}
                  onChange={e => update('valor', e.target.value)}
                  placeholder="3500"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg pl-8 pr-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 font-mono" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/80 text-[14px]">€</span>
              </div>
              <p className="text-[10px] text-white/30 mt-1">Valor total cobrado ao cliente</p>
            </Field>
            <Field label="Duração Estimada">
              <input value={form.duracao} onChange={e => update('duracao', e.target.value)}
                placeholder="~12 min"
                className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40" />
            </Field>
          </div>

          <Field label="Link do Material do Cliente">
            <input value={form.clientLink} onChange={e => update('clientLink', e.target.value)}
              placeholder="https://drive.google.com/…"
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40" />
            <p className="text-[10px] text-white/30 mt-1">Drive · Dropbox · Frame.io · WeTransfer · Mega</p>
          </Field>

          {/* CATEGORIAS DE MATERIAL */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 font-medium">
                  Material do Projeto
                </label>
                <p className="text-[11px] text-white/35 mt-0.5">Seleciona as categorias que vão fazer parte deste casamento.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={selectAllCategorias}
                  className="text-[10px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors border border-gold/20 px-2 py-1 rounded-md">
                  Todas
                </button>
                <button type="button" onClick={clearCategorias}
                  className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors border border-white/10 px-2 py-1 rounded-md">
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MATERIAL_CATEGORIAS.map(c => {
                const selected = categorias.includes(c)
                return (
                  <button key={c} type="button" onClick={() => toggleCategoria(c)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                      selected
                        ? 'bg-gold/10 border-gold/40 text-gold'
                        : 'border-white/[0.06] text-white/55 hover:text-white hover:border-white/15 hover:bg-white/[0.02]'
                    }`}
                    style={selected ? { boxShadow: '0 0 14px -3px rgba(201,164,92,0.35)' } : {}}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-gold border-gold' : 'border-white/25'
                    }`}>
                      {selected && <span className="text-[10px] text-black font-bold">✓</span>}
                    </span>
                    <span className="text-base shrink-0 text-gold/80">{MATERIAL_ICONS[c]}</span>
                    <span className="text-[11.5px] font-medium leading-tight truncate">{c}</span>
                  </button>
                )
              })}
            </div>

            {categorias.length > 0 && (
              <p className="text-[11px] text-gold/70 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {categorias.length} {categorias.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
              </p>
            )}
          </div>

          {/* ENTREGAS AO CLIENTE */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 font-medium">
                  Entregas ao Cliente
                </label>
                <p className="text-[11px] text-white/35 mt-0.5">O que vais entregar ao cliente. Aparece na secção Entrega Final.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={selectAllEntregas}
                  className="text-[10px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors border border-gold/20 px-2 py-1 rounded-md">
                  Todas
                </button>
                <button type="button" onClick={clearEntregas}
                  className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors border border-white/10 px-2 py-1 rounded-md">
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ENTREGAS_DISPONIVEIS.map(e => {
                const selected = entregas.includes(e)
                return (
                  <button key={e} type="button" onClick={() => toggleEntrega(e)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                      selected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'border-white/[0.06] text-white/55 hover:text-white hover:border-white/15 hover:bg-white/[0.02]'
                    }`}
                    style={selected ? { boxShadow: '0 0 14px -3px rgba(52,211,153,0.3)' } : {}}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-emerald-400 border-emerald-400' : 'border-white/25'
                    }`}>
                      {selected && <span className="text-[10px] text-black font-bold">✓</span>}
                    </span>
                    <span className={`text-base shrink-0 ${selected ? 'text-emerald-300' : 'text-white/40'}`}>{ENTREGA_ICONS[e]}</span>
                    <span className="text-[11.5px] font-medium leading-tight truncate">{e}</span>
                  </button>
                )
              })}
            </div>

            {entregas.length > 0 && (
              <p className="text-[11px] text-emerald-300/80 mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {entregas.length} {entregas.length === 1 ? 'entrega selecionada' : 'entregas selecionadas'}
              </p>
            )}
          </div>

          <Field label="Observações">
            <textarea value={form.notas} onChange={e => update('notas', e.target.value)}
              placeholder="Detalhes adicionais sobre o projeto…"
              rows={3}
              className="w-full bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none leading-relaxed" />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-white/[0.06] flex items-center justify-between gap-3 bg-black/40">
          <p className="text-[11px] text-white/30 italic">O workflow começa em <span className="text-gold/80">Recebido</span> (5%)</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/[0.08] text-white/55 text-[12px] tracking-wider uppercase font-semibold hover:text-white hover:bg-white/[0.04] transition-all">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={!valid() || saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gold text-black text-[12px] tracking-wider uppercase font-semibold hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={!saving && valid() ? { boxShadow: '0 0 18px -2px rgba(201,164,92,0.5)' } : {}}>
              {saving ? 'A criar…' : <>+ Criar Projeto</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1.5">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
//  PROJECT CARD
// ──────────────────────────────────────────────────────────────────────────
function ProjectCard({
  p, expanded, isUnseen, onToggle, onChange, onDelete,
}: {
  p: Project
  expanded: boolean
  isUnseen?: boolean
  onToggle: () => void
  onChange: (patch: Partial<Project>) => void
  onDelete?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = shortBadge(p.stage)
  const progress = progressFromStage(p.stage)

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all ${isUnseen ? 'unseen-glow' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(20,15,8,0.5), rgba(11,11,11,0.85))',
        borderColor: expanded ? 'rgba(201,164,92,0.4)' : isUnseen ? 'rgba(201,164,92,0.55)' : 'rgba(255,255,255,0.06)',
        boxShadow: expanded
          ? '0 30px 70px -20px rgba(0,0,0,0.6), 0 0 30px -8px rgba(201,164,92,0.25)'
          : isUnseen
            ? '0 10px 30px -10px rgba(0,0,0,0.5)' // base — glow é animado via CSS abaixo
            : '0 10px 30px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* NOVO badge para projetos não-abertos */}
      {isUnseen && !expanded && (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold text-black text-[9px] tracking-[0.3em] uppercase font-bold"
          style={{ boxShadow: '0 0 14px rgba(201,164,92,0.7)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          Novo
        </span>
      )}

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {p.referencia && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gold/10 border border-gold/30 text-gold tracking-widest font-bold">
                  {p.referencia}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-widest font-bold">Novo Projeto</span>
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{p.noivos}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {p.local && <span className="text-[11px] text-white/55">📍 {p.local}</span>}
              <span className="text-[11px] text-white/30">·</span>
              <span className="text-[11px] text-white/40">{p.duracao}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-1">
            <Meta label="Criado em"     value={p.recebido} />
            <Meta label="Data Casamento" value={p.dataCasamento} />
            <Meta label="Entrega Prevista" value={p.entregaPrevista} />
            <ValorMeta projectId={p.id} value={p.preco} onSave={(v) => onChange({ preco: v })} />
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

                {/* Separador */}
                <div className="my-1 h-px bg-white/[0.08]" />

                {/* Eliminar Projeto (destrutivo, vermelho) */}
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    if (confirm(`Eliminar o projeto "${p.noivos}"? Esta acção não pode ser desfeita.`)) {
                      onDelete?.()
                    }
                  }}
                  className="w-full text-left text-[12px] px-3 py-2 rounded-lg text-red-400/85 hover:text-red-300 hover:bg-red-500/10 transition-all font-semibold flex items-center gap-2">
                  <span>🗑</span> Eliminar Projeto
                </button>
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

          {/* Material do Projeto (por categoria seleccionada) */}
          <Section title="Material do Projeto">
            {p.materialItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
                <p className="text-[12px] text-white/35">Nenhuma categoria de material selecionada.</p>
                <p className="text-[11px] text-white/25 mt-1">Edita o projeto e adiciona as categorias necessárias.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {p.materialItems.map((m, i) => {
                  const cls =
                    m.status === 'Descarregado' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 ring-emerald-500/15' :
                    m.status === 'Recebido'     ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 ring-blue-500/15' :
                                                  'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 ring-yellow-500/15'
                  return (
                    <div key={i} className="group rounded-xl border border-white/[0.06] p-3.5 bg-white/[0.02] hover:border-gold/25 transition-all flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg border border-gold/25 bg-gold/[0.06] text-gold flex items-center justify-center text-base shrink-0">
                        {MATERIAL_ICONS[m.categoria]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{m.categoria}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border tracking-widest uppercase font-bold ${cls}`}>
                            {m.status}
                          </span>
                          {m.size && <span className="text-[11px] text-white/40 font-mono">{m.size}</span>}
                        </div>
                        {m.date && <p className="text-[10px] text-white/30 mt-1">{m.date}</p>}
                      </div>
                      {m.status === 'Descarregado' && (
                        <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] text-gold/70 hover:text-gold transition-colors" title="Download">↓</button>
                          <button className="text-[10px] text-white/50 hover:text-gold transition-colors" title="Preview">◐</button>
                        </div>
                      )}
                    </div>
                  )
                })}
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

// Inline-editable do valor do projeto (€). Funciona em mocks (via patches) e em user-projects.
function ValorMeta({ projectId, value, onSave }: { projectId: string; value?: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(value && value > 0 ? String(value) : '')

  useEffect(() => {
    setDraft(value && value > 0 ? String(value) : '')
  }, [value])

  function commit() {
    const parsed = Number(String(draft).replace(/[^\d,.]/g, '').replace(',', '.')) || 0
    if (parsed !== (value || 0)) onSave(parsed)
    setEditing(false)
  }

  const formatted = value && value > 0
    ? new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(value) + ' €'
    : null

  return (
    <div className="min-w-0">
      <p className="text-[10px] tracking-widest uppercase text-white/35 mb-0.5">Valor do Projeto</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') { e.preventDefault(); setDraft(value && value > 0 ? String(value) : ''); setEditing(false) }
            }}
            placeholder="0"
            className="w-full bg-black/40 border border-gold/40 rounded-md px-2 py-1 text-[13px] font-medium text-gold outline-none focus:border-gold focus:bg-black/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[12px] text-gold/70">€</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="Clica para editar o valor"
          className={`text-left text-[13px] font-medium truncate w-full px-1.5 -mx-1.5 py-0.5 rounded-md transition-all border border-transparent hover:border-gold/30 hover:bg-gold/5 ${formatted ? 'text-gold' : 'text-white/30 italic'}`}
        >
          {formatted || 'Adicionar valor…'}
        </button>
      )}
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
