'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { TODAY as TODAY_PT, TASKS as MOCK_TASKS, PROJECTS as MOCK_PROJECTS, paymentPlanFor, type Project as DataProject } from './_data/projects'
import { NotificationBell } from './_components/NotificationBell'
import { MessagesBell } from './_components/MessagesBell'
import { loadFreelancerProfile, rememberEditorId, rememberAdminMode, getEditorId } from './_data/freelancer-profile'

// Hoje (derivado da constante canónica)
const [_TD, _TM, _TY] = TODAY_PT.split('/').map(Number)
const TODAY_DAY_NUM = _TD
const TODAY_MONTH_IDX = _TM - 1
const TODAY_YEAR_NUM = _TY

type FreelancerData = {
  id: string
  nome: string
  email: string | null
  status: string | null
  foto_url: string | null
}

// ──────────────────────────────────────────────────────────────────────────
//  PAINEL EDITOR — Premium Internal Dashboard for RL PHOTO.VIDEO
//  Dark · Cinematic · Gold accents · Glassmorphism
// ──────────────────────────────────────────────────────────────────────────

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DIAS = ['D','S','T','Q','Q','S','S']

// Mock data — default novos projetos (usados se não houver dados no localStorage)
type NovoMini = { id: string; noivos: string; data: string; entrega: string; foto: string; status: string; createdAt?: string }
const MOCK_NOVOS: NovoMini[] = [
  { id: '1', noivos: 'Amanda & Lucas',     data: '2026-05-24', entrega: '2026-06-02', foto: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop', status: 'Novo' },
  { id: '2', noivos: 'Beatriz & Gabriel',  data: '2026-05-31', entrega: '2026-06-09', foto: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=300&fit=crop', status: 'Novo' },
  { id: '3', noivos: 'Juliana & Matheus',  data: '2026-06-07', entrega: '2026-06-16', foto: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=300&fit=crop', status: 'Novo' },
  { id: '4', noivos: 'Carolina & Felipe',  data: '2026-06-14', entrega: '2026-06-23', foto: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop', status: 'Novo' },
]

/** Converte 'DD/MM/YYYY' (formato dos novos projetos) para 'YYYY-MM-DD' (usado por fmtDate) */
function ptToISODate(pt: string): string {
  if (!pt) return ''
  const datePart = pt.split('—')[0].trim() // remove " — HH:MM" se existir
  const [d, m, y] = datePart.split('/')
  if (!d || !m || !y) return pt
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const MOCK_FINALIZADOS = [
  { id: 'f1', noivos: 'Pedro & Mariana',   entrega: '2026-05-12', foto: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop' },
  { id: 'f2', noivos: 'Isabela & Rafael',  entrega: '2026-05-08', foto: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
  { id: 'f3', noivos: 'Larissa & Thiago',  entrega: '2026-05-05', foto: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=300&fit=crop' },
  { id: 'f4', noivos: 'Fernanda & Bruno',  entrega: '2026-04-30', foto: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop' },
]

const MOCK_TAREFAS = [
  { id: 't1', label: 'Edição Amanda & Lucas',           pct: 60, done: true  },
  { id: 't2', label: 'Color Grading — Beatriz & Gabriel', pct: 35, done: true },
  { id: 't3', label: 'Montagem Trailer — Juliana & Matheus', pct: 80, done: false },
  { id: 't4', label: 'Revisão Final — Pedro & Mariana',  pct: 15, done: false },
]

const MOCK_COMPROMISSOS = [
  { hora: '10:00', titulo: 'Reunião com cliente', sub: 'Amanda & Lucas',     cor: 'gold'    },
  { hora: '14:00', titulo: 'Revisão de Corte',     sub: 'Beatriz & Gabriel',  cor: 'gold'    },
  { hora: '18:00', titulo: 'Entrega Final',        sub: 'Pedro & Mariana',    cor: 'gold'    },
]

// Pontos do gráfico (R$ por dia)
const MOCK_REVENUE = [3000, 4500, 6200, 5800, 8400, 12500, 14200, 12800, 16000, 18500, 19200, 21000, 22400, 21800, 23500, 24850]

// Stages atuais dos projetos mock em /novos-projetos (sincronizados manualmente)
// Quando o user altera o stage de um mock, o patch é guardado em localStorage e aplicado por cima
const MOCK_PROJECTS_STAGES: Record<string, string> = {
  p1: 'Em Edição',         // Amanda & Lucas
  p2: 'Para Revisão',      // Beatriz & Gabriel
  p3: 'Novo Projeto',      // Juliana & Matheus
  p4: 'Entregue',          // Carolina & Felipe
  p5: 'Finalizado',        // Sofia & Ricardo
}
const EDITING_STAGES = ['Em Edição','Color Grading','Trailer em Produção','Áudio / Sincronização','Para Revisão','Correções','Finalizado']

type NavItem = { key: string; label: string; icon: string; href?: string }
const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

function fmtDate(d: string) {
  const [y,m,dd] = d.split('-').map(Number)
  return `${String(dd).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`
}

// Foto fallback para o caso de o freelancer não ter foto
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=face'

// ── Trabalhos reais enviados pela RL a este editor (Fase 2) ──────────────────
function TrabalhosRLSection({ freelancerId }: { freelancerId: string | null }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!freelancerId) { setLoaded(true); return }
    let cancelled = false
    fetch(`/api/painel-editor/projetos?freelancer=${freelancerId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setJobs(Array.isArray(d?.jobs) ? d.jobs : []); setLoaded(true) } })
      .catch(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [freelancerId])

  if (!loaded || jobs.length === 0) return null

  return (
    <div className="rounded-2xl border border-gold/25 p-5 mb-5"
      style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.5), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold text-lg">🎬</span>
        <h3 className="text-[15px] font-semibold text-white">Trabalhos da RL para Editar</h3>
        <span className="text-[10px] text-white/35 tracking-widest uppercase">{jobs.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {jobs.map((j, i) => {
          const dia = j.data_casamento ? new Date(j.data_casamento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null
          const downloads: string[] = Array.isArray(j.downloads) ? j.downloads : []
          return (
            <div key={j.notifId ?? i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[14px] text-white font-medium">{j.noivos || j.local || 'Evento'}</p>
                {!j.lida && <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold text-black uppercase tracking-widest font-bold">Novo</span>}
              </div>
              {(j.local || dia) && <p className="text-[11px] text-white/45">{[j.local, dia].filter(Boolean).join(' · ')}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {downloads.length > 0
                  ? downloads.map((u, k) => (
                      <a key={k} href={u} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/35 text-gold font-semibold tracking-wider uppercase hover:bg-gold/25 transition-all">
                        ↓ Download{downloads.length > 1 ? ` ${k + 1}` : ''}
                      </a>
                    ))
                  : <span className="text-[11px] text-white/30 italic">Sem link de download ainda.</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PainelEditor() {
  const params = useSearchParams()
  // Mantém o editor mesmo quando a navegação volta a /painel-editor sem o
  // ?freelancer na URL (lê do localStorage, tal como as sub-páginas via
  // getEditorId). Sem isto, voltar ao Dashboard caía no modo demo.
  const freelancerId = (params?.get('freelancer') ?? null) || getEditorId()
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null)

  // Memoriza o id do editor para as sub-páginas o lerem (getEditorId).
  useEffect(() => { rememberEditorId(freelancerId) }, [freelancerId])

  // Modo admin (maquete): se entrou com ?admin=1, memoriza para a sessão toda
  // (as sub-páginas lêem via isAdminMode e mantêm a edição ativa).
  useEffect(() => { rememberAdminMode(params?.get('admin') === '1') }, [params])

  // Buscar freelancer da BD se o id estiver na URL
  useEffect(() => {
    if (!freelancerId) { setFreelancer(null); return }
    let cancelled = false
    fetch('/api/freelancers')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const f = (d.freelancers ?? []).find((x: any) => x.id === freelancerId)
        if (f) setFreelancer({ id: f.id, nome: f.nome, email: f.email, status: f.status, foto_url: f.foto_url })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [freelancerId])

  // Foto do perfil guardada em Dados Pessoais (freelancers.perfil_editor.foto).
  // Sem isto o avatar caía no localStorage do browser, que é partilhado e
  // mostrava a foto de outra pessoa a quem abrisse o painel.
  const [perfilFoto, setPerfilFoto] = useState<string>('')
  useEffect(() => {
    if (!freelancerId) { setPerfilFoto(''); return }
    let cancelled = false
    fetch(`/api/painel-editor/perfil?freelancer=${freelancerId}&only=foto`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.foto) setPerfilFoto(d.foto) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [freelancerId])

  // Lê perfil de localStorage (definido em /painel-editor/dados-pessoais)
  // — tem prioridade sobre nome/foto do API freelancer
  const [profileNome, setProfileNome] = useState<string>('')
  const [profileFoto, setProfileFoto] = useState<string>('')
  const [profileFuncao, setProfileFuncao] = useState<string>('Editor de Vídeo')
  useEffect(() => {
    function refresh() {
      try {
        const p = loadFreelancerProfile()
        setProfileNome(p.nome || '')
        setProfileFoto(p.foto || '')
        setProfileFuncao(p.funcao || 'Editor de Vídeo')
      } catch {}
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [])

  // Hierarquia: 1) Freelancer real da BD (por ?freelancer=<id>) — fonte de verdade
  //   2) Profile do localStorage (só como fallback; é partilhado no browser, por
  //      isso NÃO pode sobrepor-se ao membro carregado) 3) fallback genérico.
  const effectiveNome = (freelancer?.nome || profileNome.trim() || 'Editor Pro').trim()
  const displayName  = effectiveNome.split(' ')[0]
  const displayFull  = effectiveNome
  const displayEmail = freelancer?.email ?? 'editorpro@mail.com'
  // Cargo a partir do status REAL da BD (mapeado); só usa o profileFuncao do
  // localStorage como fallback quando não há freelancer carregado.
  const STATUS_FUNCAO: Record<string, string> = {
    FOTOGRAFO: 'Fotógrafo', VIDEOGRAFO: 'Videógrafo', EDITORES: 'Editor de Vídeo',
    EDITOR: 'Editor de Vídeo', ASSISTENTE: 'Assistente', OUTRO: 'Equipa',
  }
  const displayFuncao = freelancer?.status
    ? (STATUS_FUNCAO[freelancer.status] ?? freelancer.status)
    : (profileFuncao || 'Editor de Vídeo')
  const displayRole  = displayFuncao
  // Com um editor real carregado (?freelancer=<id>) a foto vem só da BD: o
  // localStorage é do browser, não da pessoa, e mostrava a foto errada.
  const displayPhoto = freelancerId
    ? (freelancer?.foto_url || perfilFoto.trim() || DEFAULT_AVATAR)
    : (profileFoto.trim() || DEFAULT_AVATAR)

  const [active, setActive] = useState('dashboard')

  // ── Novos Projetos — mock só quando NÃO há editor real (?freelancer=) ──
  const hasEditor = !!freelancerId
  const [novosProjetos, setNovosProjetos] = useState<NovoMini[]>(hasEditor ? [] : MOCK_NOVOS)
  const [finalizadosProjetos, setFinalizadosProjetos] = useState<typeof MOCK_FINALIZADOS>(hasEditor ? [] : MOCK_FINALIZADOS)
  const [unseenIds, setUnseenIds] = useState<Set<string>>(new Set())
  const [storageTick, setStorageTick] = useState(0)  // refresh signal para useMemos que leem localStorage
  // Inicializa com contagens calculadas dos defaults do mock (0 quando há editor real)
  const initialKpis = hasEditor ? { novos: 0, andamento: 0, finalizados: 0 } : (() => {
    const stages = Object.values(MOCK_PROJECTS_STAGES)
    return {
      novos:       stages.filter(s => s === 'Novo Projeto').length,
      andamento:   stages.filter(s => EDITING_STAGES.includes(s)).length,
      finalizados: stages.filter(s => s === 'Entregue').length,
    }
  })()
  const [kpiCounts, setKpiCounts] = useState(initialKpis)

  // ── DADOS REAIS do editor (substituem o mock quando há ?freelancer=<id>) ──
  const realMode = !!freelancerId
  const [realPagamentos, setRealPagamentos] = useState<any[]>([])
  const FINALIZADO_STAGES = ['Finalizado', 'Entregue']
  useEffect(() => {
    if (!freelancerId) return
    let cancelled = false
    Promise.all([
      fetch(`/api/painel-editor/projetos?freelancer=${freelancerId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/painel-editor/workflow?freelancer=${freelancerId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/freelancer-pagamentos?freelancer_id=${freelancerId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([p, w, pg]) => {
      if (cancelled) return
      const jobs: any[] = Array.isArray(p?.jobs) ? p.jobs : []
      const wf: Record<string, string> = (w?.workflow && typeof w.workflow === 'object') ? w.workflow : {}
      const pagamentos: any[] = Array.isArray(pg?.pagamentos) ? pg.pagamentos : []
      setRealPagamentos(pagamentos)
      const stageOf = (j: any) => wf[j.referencia || j.notifId] || 'Novo'
      const novos = jobs.filter(j => stageOf(j) === 'Novo')
      const andamento = jobs.filter(j => { const s = stageOf(j); return s !== 'Novo' && !FINALIZADO_STAGES.includes(s) })
      const finalizados = jobs.filter(j => FINALIZADO_STAGES.includes(stageOf(j)))
      setNovosProjetos(novos.map(j => ({
        id: j.referencia || j.notifId, noivos: j.noivos || j.local || 'Evento',
        data: j.data_casamento ?? '', entrega: '', foto: '', status: 'Novo', createdAt: j.sentAt ?? '',
      })) as NovoMini[])
      setFinalizadosProjetos(finalizados.map(j => ({
        id: j.referencia || j.notifId, noivos: j.noivos || j.local || 'Evento', entrega: '', foto: '',
      })) as any)
      setKpiCounts({ novos: novos.length, andamento: andamento.length, finalizados: finalizados.length })
    })
    return () => { cancelled = true }
  }, [freelancerId])

  // Recebimentos reais (soma dos pagamentos pagos) — usado no KPI e financeiro.
  const realRecebido = useMemo(
    () => realPagamentos.filter(p => String(p.status ?? '').toUpperCase() === 'PAGO').reduce((s, p) => s + (Number(p.valor) || 0), 0),
    [realPagamentos],
  )

  function loadFromStorage() {
    if (freelancerId) {
      // Editor real: os dados vêm da BD (efeito acima). Não usar mock/localStorage.
      return
    }
    try {
      const raw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = raw ? JSON.parse(raw) : []

      // ── NOVOS (top 4 mais recentes — só os que estão em 'Novo Projeto') ──
      const novosUser = userProjects.filter(p => p.stage === 'Novo Projeto')
      const mapped: NovoMini[] = novosUser.map(p => ({
        id:        p.id,
        noivos:    p.noivos,
        data:      ptToISODate(p.dataCasamento || ''),
        entrega:   ptToISODate(p.entregaPrevista || ''),
        foto:      p.foto || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
        status:    'Novo',
        createdAt: ptToISODate(p.recebido || ''),
      }))
      const merged = [...mapped, ...MOCK_NOVOS].slice(0, 4)
      setNovosProjetos(merged)

      // ── FINALIZADOS (user-projects com stage='Entregue' + mocks, top 4) ──
      const userFinalizados = userProjects
        .filter(p => p.stage === 'Entregue')
        .map(p => ({
          id:      p.id,
          noivos:  p.noivos,
          entrega: ptToISODate(p.entregaPrevista || ''),
          foto:    p.foto || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
        }))
      const mergedFinalizados = [...userFinalizados, ...MOCK_FINALIZADOS]
        .sort((a, b) => (b.entrega || '').localeCompare(a.entrega || ''))
        .slice(0, 4)
      setFinalizadosProjetos(mergedFinalizados)

      // ── KPI counts (mocks + patches + user-projects) ─────────────────
      // 1) Estado atual dos mocks (aplica patches por cima) — exclui eliminados
      let patches: Record<string, any> = {}
      try {
        const patchesJson = localStorage.getItem('painel-editor-project-patches')
        patches = patchesJson ? JSON.parse(patchesJson) : {}
      } catch {}

      const mockStages: string[] = Object.keys(MOCK_PROJECTS_STAGES)
        .filter(id => !(patches[id]?.archived || patches[id]?.cancelled))
        .map(id => patches[id]?.stage ?? MOCK_PROJECTS_STAGES[id])
      const userStages: string[] = userProjects.map(p => p.stage)
      const allStages: string[] = [...mockStages, ...userStages]

      setKpiCounts({
        novos:       allStages.filter(s => s === 'Novo Projeto').length,
        andamento:   allStages.filter(s => EDITING_STAGES.includes(s)).length,
        finalizados: allStages.filter(s => s === 'Entregue').length,
      })

      // Ler unseen ids
      const unseenJson = localStorage.getItem('painel-editor-unseen-projects')
      const unseen: string[] = unseenJson ? JSON.parse(unseenJson) : []
      setUnseenIds(new Set(unseen))
    } catch {}
  }

  useEffect(() => {
    loadFromStorage()
    setStorageTick(t => t + 1)
    // Refresh quando voltas à tab (cobre mudanças em /novos-projetos noutra aba)
    const onFocus = () => { loadFromStorage(); setStorageTick(t => t + 1) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Calendário — hoje derivado de TODAY canónico
  const today = new Date(TODAY_YEAR_NUM, TODAY_MONTH_IDX, TODAY_DAY_NUM)
  const [view, setView] = useState({ y: 2026, m: 4 })

  // ── Marcas no calendário: criações + entregas + tarefas ───────────────
  // Mapa: 'YYYY-MM-DD' → { creations: string[], deliveries: string[], tasks: string[] }
  const calendarMarks = useMemo(() => {
    const marks: Record<string, { creations: string[]; deliveries: string[]; tasks: string[] }> = {}
    if (hasEditor) return marks  // editor real: sem marcas mock no calendário
    const ensure = (k: string) => { if (!marks[k]) marks[k] = { creations: [], deliveries: [], tasks: [] }; return marks[k] }

    // 1) Projetos criados pelo utilizador (localStorage) — têm recebido + entregaPrevista
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('painel-editor-user-projects') : null
      const userProjects: any[] = raw ? JSON.parse(raw) : []
      userProjects.forEach(p => {
        const recIso = ptToISODate(p.recebido || '')
        if (recIso) ensure(recIso).creations.push(p.noivos)
        const entIso = ptToISODate(p.entregaPrevista || '')
        if (entIso) ensure(entIso).deliveries.push(p.noivos)
      })
    } catch {}

    // 2) Mocks (MOCK_NOVOS) — usa 'data' como criação aproximada + 'entrega' como entrega
    MOCK_NOVOS.forEach(m => {
      if (m.data)    ensure(m.data).creations.push(m.noivos)
      if (m.entrega) ensure(m.entrega).deliveries.push(m.noivos)
    })

    // 3) TODAS as tarefas: user-criadas + auto-geradas para user-projects + mocks TASKS
    //    (filtra eliminadas + projetos eliminados)
    try {
      const w = typeof window !== 'undefined' ? window : null
      const userTasksRaw = w ? localStorage.getItem('painel-editor-user-tasks') : null
      const userTasks: any[] = userTasksRaw ? JSON.parse(userTasksRaw) : []
      const delRaw = w ? localStorage.getItem('painel-editor-deleted-tasks') : null
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
      const userProjRaw = w ? localStorage.getItem('painel-editor-user-projects') : null
      const userProj: any[] = userProjRaw ? JSON.parse(userProjRaw) : []
      const patchesRaw = w ? localStorage.getItem('painel-editor-project-patches') : null
      const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}
      const deletedProjIds = new Set<string>()
      Object.entries(patches).forEach(([id, patch]) => {
        if (patch?.archived || patch?.cancelled) deletedProjIds.add(id)
      })

      // Auto-tarefas: 5 por user-project com offsets 0/1/3/7/14 a partir do recebido
      const autoUserTasks: { id: string; title: string; deadline: string; projectId: string }[] = []
      userProj.forEach(p => {
        const recebido = (p.recebido || '').split('—')[0].trim()
        const [d, m, y] = (recebido || '').split('/').map(Number)
        if (!d || !m || !y) return
        const offsets = [
          { title: 'Importar material',     days: 0 },
          { title: 'Organizar ficheiros',   days: 1 },
          { title: 'Iniciar edição',        days: 3 },
          { title: 'Color grading',         days: 7 },
          { title: 'Enviar primeira versão', days: 14 },
        ]
        offsets.forEach((o, i) => {
          const dt = new Date(y, m-1, d); dt.setDate(dt.getDate() + o.days)
          const deadline = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
          autoUserTasks.push({ id: `${p.id}-task-${i}`, title: o.title, deadline, projectId: p.id })
        })
      })

      // Mocks TASKS + user-criadas + auto-geradas
      const all: { id: string; title: string; deadline: string; projectId?: string }[] = [
        ...userTasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, projectId: t.projectId })),
        ...autoUserTasks,
        ...MOCK_TASKS.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, projectId: t.projectId })),
      ]
      const seen = new Set<string>()
      all
        .filter(t => t && !deleted.has(t.id) && (!t.projectId || !deletedProjIds.has(t.projectId)))
        .filter(t => t.deadline && t.title)
        .forEach(t => {
          if (seen.has(t.id)) return
          seen.add(t.id)
          const iso = ptToISODate(t.deadline)
          if (iso) ensure(iso).tasks.push(t.title)
        })
    } catch {}

    return marks
  }, [novosProjetos, storageTick])

  const firstDay = new Date(view.y, view.m, 1).getDay()
  const lastDate = new Date(view.y, view.m + 1, 0).getDate()
  const prevLastDate = new Date(view.y, view.m, 0).getDate()
  type Cell = { day: number; current: boolean; isToday: boolean; iso?: string; hasCreation?: boolean; hasDelivery?: boolean; hasTask?: boolean; creationNames?: string[]; deliveryNames?: string[]; taskNames?: string[] }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevLastDate - i, current: false, isToday: false })
  for (let d = 1; d <= lastDate; d++) {
    const iso = `${view.y}-${String(view.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const mark = calendarMarks[iso]
    const isToday = view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate()
    cells.push({
      day: d, current: true, isToday, iso,
      hasCreation: (mark?.creations.length ?? 0) > 0,
      hasDelivery: (mark?.deliveries.length ?? 0) > 0,
      hasTask:     (mark?.tasks.length ?? 0) > 0,
      creationNames: mark?.creations,
      deliveryNames: mark?.deliveries,
      taskNames:     mark?.tasks,
    })
  }
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - lastDate - firstDay + 1, current: false, isToday: false })

  // Gráfico (SVG path)
  const chartPath = useMemo(() => {
    const w = 320, h = 90, pad = 6
    // Editor real: linha plana no valor real recebido (sem curva fictícia).
    const revenue = hasEditor ? new Array(MOCK_REVENUE.length).fill(realRecebido) : MOCK_REVENUE
    const max = Math.max(...revenue, 1)
    const step = (w - pad*2) / (revenue.length - 1)
    const pts = revenue.map((v, i) => {
      const x = pad + i * step
      const y = h - pad - (v / max) * (h - pad*2)
      return { x, y }
    })
    // smooth curve
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i-1], p1 = pts[i]
      const cx = (p0.x + p1.x) / 2
      d += ` Q ${cx} ${p0.y}, ${cx} ${(p0.y + p1.y) / 2}`
      d += ` T ${p1.x} ${p1.y}`
    }
    const last = pts[pts.length - 1]
    return { path: d, last, points: pts, w, h }
  }, [hasEditor, realRecebido])

  // ── Stats de Performance: total + on-time + late + média de dias ─────
  const performanceStats = useMemo(() => {
    if (typeof window === 'undefined' || hasEditor) return { total: 0, onTime: 0, late: 0, emCurso: 0, mediaDias: 0 }
    try {
      const userRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
      const patchesRaw = localStorage.getItem('painel-editor-project-patches')
      const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}

      const mockData = MOCK_PROJECTS
        .map(p => patches[p.id] ? { ...p, ...patches[p.id] } : p)
        .filter(p => !(p as any).archived && !(p as any).cancelled)

      const all: any[] = [
        ...userProjects.filter(p => !p.archived && !p.cancelled),
        ...mockData,
      ]
      // Deduplica por id
      const seen = new Set<string>()
      const projects = all.filter(p => { if (!p?.id || seen.has(p.id)) return false; seen.add(p.id); return true })

      const parse = (s: string): Date | null => {
        if (!s) return null
        const cleaned = s.split('—')[0].trim()
        const [d, m, y] = cleaned.split('/').map(Number)
        if (!d || !m || !y) return null
        return new Date(y, m-1, d)
      }

      let onTime = 0
      let late = 0
      let emCurso = 0
      let somaDias = 0
      let countEntregues = 0

      projects.forEach(p => {
        const isDelivered = p.stage === 'Entregue'
        if (!isDelivered) {
          emCurso += 1
          return
        }
        const recebido = parse(p.recebido)
        const prazo = parse(p.entregaPrevista)
        const entregueEm = parse(p.entregueEm) || prazo  // mocks sem entregueEm: usa o prazo
        if (!recebido || !entregueEm) return

        const dias = Math.max(0, Math.floor((entregueEm.getTime() - recebido.getTime()) / 86400000))
        somaDias += dias
        countEntregues += 1

        if (!prazo) {
          onTime += 1
          return
        }
        if (entregueEm.getTime() <= prazo.getTime()) onTime += 1
        else late += 1
      })

      const mediaDias = countEntregues > 0 ? Math.round(somaDias / countEntregues) : 0
      return { total: projects.length, onTime, late, emCurso, mediaDias }
    } catch { return { total: 0, onTime: 0, late: 0, emCurso: 0, mediaDias: 0 } }
  }, [storageTick, hasEditor])

  // ── Alertas críticos: projetos com prazo de entrega ultrapassado ──────
  // Aparece a brilhar vermelho até o admin marcar o projeto como Entregue.
  const projetosAtrasados = useMemo(() => {
    if (typeof window === 'undefined' || hasEditor) return [] as { id: string; noivos: string; entregaPrevista: string; diasAtraso: number; foto?: string }[]
    try {
      const userRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
      const patchesRaw = localStorage.getItem('painel-editor-project-patches')
      const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}

      const todayMs = new Date(TODAY_YEAR_NUM, TODAY_MONTH_IDX, TODAY_DAY_NUM).getTime()
      const parsePt = (s: string): number => {
        const cleaned = (s || '').split('—')[0].trim()
        const [d, m, y] = cleaned.split('/').map(Number)
        if (!d || !m || !y) return 0
        return new Date(y, m-1, d).getTime()
      }

      // Mocks (com patches aplicados) + user-projects
      const mockData = MOCK_PROJECTS
        .map(p => patches[p.id] ? { ...p, ...patches[p.id] } : p)
        .filter(p => !(p as any).archived && !(p as any).cancelled)

      const all: any[] = [
        ...userProjects.filter(p => !p.archived && !p.cancelled),
        ...mockData,
      ]

      const result: { id: string; noivos: string; entregaPrevista: string; diasAtraso: number; foto?: string }[] = []
      const seen = new Set<string>()
      all.forEach(p => {
        if (!p?.id || seen.has(p.id)) return
        seen.add(p.id)
        if (p.stage === 'Entregue') return
        const epMs = parsePt(p.entregaPrevista || '')
        if (!epMs || epMs >= todayMs) return
        const diasAtraso = Math.floor((todayMs - epMs) / 86400000)
        result.push({
          id: p.id,
          noivos: p.noivos || 'Projeto',
          entregaPrevista: p.entregaPrevista,
          diasAtraso,
          foto: p.foto,
        })
      })
      // Mais atrasado primeiro
      return result.sort((a, b) => b.diasAtraso - a.diasAtraso)
    } catch { return [] as any[] }
  }, [storageTick])

  // ── Auto-notificação: envia email ao freelancer quando há projetos
  //    atrasados ainda não notificados. Evita duplicados via localStorage.
  useEffect(() => {
    if (projetosAtrasados.length === 0) return
    if (typeof window === 'undefined') return

    let cancelled = false
    ;(async () => {
      try {
        const profile = loadFreelancerProfile()
        if (!profile.email || !profile.email.includes('@')) return

        // IDs já notificados (não voltar a enviar)
        const raw = localStorage.getItem('painel-editor-notified-overdue')
        const notified = new Set<string>(raw ? JSON.parse(raw) : [])

        // Filtra os que faltam notificar
        const pending = projetosAtrasados.filter(p => !notified.has(p.id))
        if (pending.length === 0) return

        // Dispara em série (sem bloquear) para não saturar API
        for (const proj of pending) {
          if (cancelled) break
          try {
            const res = await fetch('/api/painel-editor/notify-projeto-atrasado', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: profile.email,
                freelancerNome: profile.nome,
                noivos: proj.noivos,
                entregaPrevista: proj.entregaPrevista,
                diasAtraso: proj.diasAtraso,
                foto: proj.foto,
              }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && data?.ok) {
              notified.add(proj.id)
              localStorage.setItem('painel-editor-notified-overdue', JSON.stringify([...notified]))
            }
          } catch {}
        }
      } catch {}
    })()

    return () => { cancelled = true }
  }, [projetosAtrasados])

  // ── Próximos compromissos: TODAS as tarefas (user + auto + mocks) ──────
  // Filtra: não concluídas, ordena por data+hora ASC, limita a 5
  const compromissos = useMemo(() => {
    if (typeof window === 'undefined' || hasEditor) return [] as { hora: string; titulo: string; sub: string; overdue: boolean; dateMs: number }[]
    try {
      const raw = localStorage.getItem('painel-editor-user-tasks')
      const userTasks: any[] = raw ? JSON.parse(raw) : []
      const delRaw = localStorage.getItem('painel-editor-deleted-tasks')
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
      const userProjRaw = localStorage.getItem('painel-editor-user-projects')
      const userProj: any[] = userProjRaw ? JSON.parse(userProjRaw) : []
      const patchesRaw = localStorage.getItem('painel-editor-project-patches')
      const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}
      const deletedProjIds = new Set<string>()
      Object.entries(patches).forEach(([id, p]) => { if (p?.archived || p?.cancelled) deletedProjIds.add(id) })

      const todayMs = new Date(TODAY_YEAR_NUM, TODAY_MONTH_IDX, TODAY_DAY_NUM).getTime()
      const parseMs = (d: string, h?: string): number => {
        const [dd, mm, yyyy] = (d || '').split('/').map(Number)
        if (!dd || !mm || !yyyy) return 0
        const [hh, mi] = (h || '').split(':').map(Number)
        return new Date(yyyy, mm - 1, dd, hh || 0, mi || 0).getTime()
      }

      // Auto-tasks dos user-projects
      const autoUserTasks: any[] = []
      userProj.forEach(p => {
        const recebido = (p.recebido || '').split('—')[0].trim()
        const [d, m, y] = (recebido || '').split('/').map(Number)
        if (!d || !m || !y) return
        const offsets = [
          { title: 'Importar material',     days: 0 },
          { title: 'Organizar ficheiros',   days: 1 },
          { title: 'Iniciar edição',        days: 3 },
          { title: 'Color grading',         days: 7 },
          { title: 'Enviar primeira versão', days: 14 },
        ]
        offsets.forEach((o, i) => {
          const dt = new Date(y, m-1, d); dt.setDate(dt.getDate() + o.days)
          const deadline = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
          autoUserTasks.push({ id: `${p.id}-task-${i}`, title: o.title, deadline, projectId: p.id, status: 'Pendente' })
        })
      })

      // Lookup nome de projeto (user + mocks via PROJECTS importado em outras páginas)
      // No dashboard só temos userProj — para mocks usamos um lookup adicional via MOCK_TASKS.projectId+title
      const projectNameLookup = new Map<string, string>()
      userProj.forEach(p => projectNameLookup.set(p.id, p.noivos || ''))
      // Mocks: usamos os projectIds p1..p5 mapeados aos nomes em MOCK_TASKS (sem PROJECTS importado, usamos t.projectId)
      const allRaw = [...userTasks, ...autoUserTasks, ...MOCK_TASKS]

      const seen = new Set<string>()
      return allRaw
        .filter(t => !deleted.has(t.id))
        .filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada')
        .filter(t => !t.projectId || !deletedProjIds.has(t.projectId))
        .filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true })
        .map(t => {
          const projeto = t.projectId ? projectNameLookup.get(t.projectId) || '' : ''
          const dateMs = parseMs(t.deadline, t.hora)
          return {
            hora: t.hora || '—',
            titulo: t.title,
            sub: projeto || (t.projectId ? '' : 'Sem projeto associado'),
            overdue: dateMs > 0 && dateMs < todayMs,
            dateMs,
          }
        })
        .sort((a, b) => a.dateMs - b.dateMs)
        .slice(0, 5)
    } catch { return [] as any[] }
  }, [storageTick])

  // ── Widget Tarefas (lateral): 2 últimas concluídas + 3 mais recentes ─────
  const tarefasWidget = useMemo(() => {
    if (typeof window === 'undefined' || hasEditor) return [] as { id: string; label: string; pct: number; done: boolean; ts: number }[]
    try {
      const raw = localStorage.getItem('painel-editor-user-tasks')
      const userTasks: any[] = raw ? JSON.parse(raw) : []
      const delRaw = localStorage.getItem('painel-editor-deleted-tasks')
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
      const userProjRaw = localStorage.getItem('painel-editor-user-projects')
      const userProj: any[] = userProjRaw ? JSON.parse(userProjRaw) : []

      const alive = userTasks.filter(t => !deleted.has(t.id))

      const labelOf = (t: any) => {
        const proj = t.projectId ? userProj.find((p: any) => p.id === t.projectId)?.noivos : null
        return proj ? `${t.title} — ${proj}` : t.title
      }

      // Timestamp do id `user-task-${Date.now()}`
      const tsOf = (id: string) => {
        const n = Number((id || '').split('-').pop())
        return Number.isFinite(n) ? n : 0
      }

      const concluidas = alive
        .filter((t: any) => t.status === 'Concluída')
        .sort((a: any, b: any) => tsOf(b.id) - tsOf(a.id))
        .slice(0, 2)
        .map((t: any) => ({ id: t.id, label: labelOf(t), pct: 100, done: true, ts: tsOf(t.id) }))

      const recentes = alive
        .filter((t: any) => t.status !== 'Concluída' && t.status !== 'Cancelada')
        .sort((a: any, b: any) => tsOf(b.id) - tsOf(a.id))
        .slice(0, 3)
        .map((t: any) => {
          const pct = t.progress ?? (t.status === 'Em andamento' ? 30 : t.status === 'Em revisão' ? 70 : 0)
          return { id: t.id, label: labelOf(t), pct, done: false, ts: tsOf(t.id) }
        })

      // 3 mais recentes primeiro (incluindo "Novo" badge), depois as últimas concluídas
      return [...recentes, ...concluidas]
    } catch { return [] as any[] }
  }, [storageTick])

  // ── Recebimentos Total Anual (mesmo cálculo do /painel-editor/pagamentos) ──
  // Soma das parcelas com status 'Recebido' no ano corrente, aplicando overrides
  const totalAnualEuros = useMemo(() => {
    if (typeof window === 'undefined') return 0
    if (hasEditor) return realRecebido  // editor real: soma dos pagamentos reais
    try {
      // 1) user-projects do localStorage
      const userRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
      // 2) Patches sobre mocks (preço/stage etc.)
      const patchesRaw = localStorage.getItem('painel-editor-project-patches')
      const patches: Record<string, Partial<DataProject>> = patchesRaw ? JSON.parse(patchesRaw) : {}
      // 3) Payment overrides (Aguarda/Pago manual via dropdown)
      const ovRaw = localStorage.getItem('painel-editor-payment-overrides')
      const overrides: Record<string, { status: 'A receber'|'Recebido'; paidDate?: string; metodo?: string }> = ovRaw ? JSON.parse(ovRaw) : {}

      // user-mapped (formato Project) — mantém preço definido pelo user
      const userMapped: DataProject[] = userProjects.map(p => ({
        id: p.id, noivos: p.noivos ?? '—', foto: p.foto || '',
        email: p.email || '', telefone: p.telefone || '',
        recebido: (p.recebido || '').split('—')[0].trim(),
        dataCasamento: p.dataCasamento || '',
        entregaPrevista: p.entregaPrevista || '',
        pacote: p.pacote ?? 'Pacote Premium 👑',
        preco: typeof p.preco === 'number' && p.preco > 0 ? p.preco : (p.pacote === 'Pacote Essencial' ? 1800 : 3500),
        duracao: p.duracao || '',
        stage: p.stage ?? 'Novo Projeto',
        approval: p.approval ?? 'Aguardando Revisão',
        progress: 0, editor: p.editor || 'Editor Pro',
        finalEntregue: p.stage === 'Entregue',
        finalLink: p.finalLink || '',
        archived: p.archived, cancelled: p.cancelled,
      })) as any

      // Merge: user + mocks com patches (filtra eliminados)
      const merged: DataProject[] = [
        ...userMapped,
        ...MOCK_PROJECTS
          .map(p => patches[p.id] ? { ...p, ...patches[p.id] } : p)
          .filter(p => !(p as any).archived && !(p as any).cancelled),
      ]

      // Soma das parcelas Recebido no ano corrente
      const year = String(TODAY_YEAR_NUM)
      let total = 0
      merged.forEach(p => {
        const plan = paymentPlanFor(p)
        plan.forEach(inst => {
          const ov = overrides[p.id]
          const status = ov ? ov.status : inst.status
          const paidDate = ov ? ov.paidDate ?? null : inst.paidDate
          if (status === 'Recebido' && (paidDate ?? '').split('/')[2] === year) {
            total += inst.value
          }
        })
      })
      return total
    } catch { return 0 }
  }, [storageTick, hasEditor, realRecebido])

  const totalAnualLabel = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAnualEuros) + ' €'

  // ── Unseen tasks (glow gold até clicar) ──────────────────────────────
  const [unseenTaskIds, setUnseenTaskIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem('painel-editor-unseen-tasks')
      const arr: string[] = raw ? JSON.parse(raw) : []
      setUnseenTaskIds(new Set(arr))
    } catch {}
    // Re-load também quando storageTick muda (criação de nova tarefa noutra tab/page)
  }, [storageTick])

  function markTaskSeen(id: string) {
    setUnseenTaskIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev); next.delete(id)
      try { localStorage.setItem('painel-editor-unseen-tasks', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function markProjectSeen(id: string) {
    setUnseenIds(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev); next.delete(id)
      try { localStorage.setItem('painel-editor-unseen-projects', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // Notificações: ver componente partilhado NotificationBell (sino + popover)

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0B0B0B' }}>
      {/* Animação gold pulse para projetos novos não-abertos + alert red pulse para projetos atrasados */}
      <style jsx global>{`
        @keyframes unseenGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 16px -4px rgba(201,164,92,0.25); }
          50%      { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 32px 0 rgba(201,164,92,0.55); }
        }
        .unseen-glow { animation: unseenGlow 2.4s ease-in-out infinite; }
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(239,68,68,0), 0 0 24px -4px rgba(239,68,68,0.35), inset 0 0 0 1px rgba(239,68,68,0.15); }
          50%      { box-shadow: 0 0 0 rgba(239,68,68,0), 0 0 48px 0 rgba(239,68,68,0.7), inset 0 0 0 1px rgba(239,68,68,0.45); }
        }
        .alert-glow { animation: alertPulse 1.8s ease-in-out infinite; }
      `}</style>
      {/* ── Background atmosférico (radial gold + grid sutil) ─────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.06), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,164,92,0.04), transparent 70%)' }} />

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className="flex fixed top-0 left-0 bottom-0 w-[240px] z-30 flex-col"
        style={{
          background: 'linear-gradient(180deg, #0a0805 0%, #0e0b07 50%, #0a0805 100%)',
          borderRight: '0.5px solid rgba(201,164,92,0.18)',
          boxShadow: 'inset -1px 0 30px rgba(201,164,92,0.04), 4px 0 24px rgba(0,0,0,0.45)',
        }}
      >
        {/* Top corner ornaments */}
        <div className="absolute top-0 left-0 w-[28px] h-[28px] pointer-events-none" style={{ borderTop: '0.5px solid rgba(201,164,92,0.25)', borderLeft: '0.5px solid rgba(201,164,92,0.25)' }} />
        <div className="absolute top-0 right-0 w-[28px] h-[28px] pointer-events-none" style={{ borderTop: '0.5px solid rgba(201,164,92,0.25)', borderRight: '0.5px solid rgba(201,164,92,0.25)' }} />

        {/* Logo */}
        <div className="px-6 pt-10 pb-7 flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center mb-3 overflow-hidden relative"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.03))', border: '0.5px solid #c9a96e', boxShadow: '0 0 22px rgba(201,164,92,0.18)' }}>
            <div className="absolute top-0 left-0 w-2 h-2" style={{ borderTop: '0.5px solid #c9a96e', borderLeft: '0.5px solid #c9a96e' }} />
            <div className="absolute top-0 right-0 w-2 h-2" style={{ borderTop: '0.5px solid #c9a96e', borderRight: '0.5px solid #c9a96e' }} />
            <div className="absolute bottom-0 left-0 w-2 h-2" style={{ borderBottom: '0.5px solid #c9a96e', borderLeft: '0.5px solid #c9a96e' }} />
            <div className="absolute bottom-0 right-0 w-2 h-2" style={{ borderBottom: '0.5px solid #c9a96e', borderRight: '0.5px solid #c9a96e' }} />
            <img src="/logo_rl_gold.png" alt="RL" className="w-11 h-11 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px w-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.45))' }} />
            <p className="text-[9px] tracking-[0.5em] uppercase font-light italic" style={{ color: '#c9a96e', opacity: 0.85 }}>{displayFuncao}</p>
            <div className="h-px w-3" style={{ background: 'linear-gradient(90deg, rgba(201,164,92,0.45), transparent)' }} />
          </div>
        </div>

        <div className="h-px mx-7" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.25), transparent)' }} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-0.5">
          {NAV_ITEMS.map(it => {
            const isActive = active === it.key
            const inner = (
              <>
                <span className="w-5 text-center text-[14px] transition-colors"
                  style={{ color: isActive ? '#c9a96e' : 'rgba(255,255,255,0.30)' }}>{it.icon}</span>
                {isActive ? (
                  <span className="flex-1 text-[14px] italic" style={{ color: '#c9a96e' }}>{it.label}</span>
                ) : (
                  <span className="flex-1 text-[10px] tracking-[0.3em] uppercase font-light text-white/45 group-hover:text-white/85 transition-colors">{it.label}</span>
                )}
              </>
            )
            const styleProps = {
              background: isActive ? 'linear-gradient(90deg, rgba(201,164,92,0.10) 0%, rgba(201,164,92,0.02) 60%, transparent 100%)' : 'transparent',
              borderLeft: isActive ? '1.5px solid #c9a96e' : '1.5px solid transparent',
              boxShadow: isActive ? 'inset 12px 0 24px -16px rgba(201,164,92,0.5)' : 'none',
            }
            const cls = 'group w-full flex items-center gap-3 pl-4 pr-3 py-2.5 text-left transition-all'

            if (it.href) {
              const href = freelancerId ? `${it.href}?freelancer=${freelancerId}` : it.href
              return (
                <Link key={it.key} href={href} className={cls} style={styleProps}>{inner}</Link>
              )
            }
            return (
              <button
                key={it.key}
                onClick={() => setActive(it.key)}
                className={cls}
                style={styleProps}
              >
                {inner}
              </button>
            )
          })}
        </nav>

        {/* Quote */}
        <div className="px-6 py-5 mt-auto">
          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,164,92,0.25), transparent)' }} />
          <div className="text-center text-[10px] tracking-[0.4em] mb-2" style={{ color: '#5a4828' }}>—&nbsp;·&nbsp;◆&nbsp;·&nbsp;—</div>
          <p className="text-[11px] italic leading-relaxed text-center" style={{ color: '#7a6340' }}>Cada corte conta uma história.</p>
          <p className="text-[11px] italic leading-relaxed text-center" style={{ color: '#7a6340' }}>Cada história merece emoção.</p>
        </div>

        {/* Bottom corner ornaments */}
        <div className="absolute bottom-0 left-0 w-[28px] h-[28px] pointer-events-none" style={{ borderBottom: '0.5px solid rgba(201,164,92,0.25)', borderLeft: '0.5px solid rgba(201,164,92,0.25)' }} />
        <div className="absolute bottom-0 right-0 w-[28px] h-[28px] pointer-events-none" style={{ borderBottom: '0.5px solid rgba(201,164,92,0.25)', borderRight: '0.5px solid rgba(201,164,92,0.25)' }} />
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="relative z-10 pl-[240px]">
        <div className="px-6 sm:px-8 py-6">

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-6"
            style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)' }}>
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&h=400&fit=crop"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 z-[1]"
              style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.96) 0%, rgba(11,11,11,0.85) 35%, rgba(11,11,11,0.45) 65%, rgba(11,11,11,0.1) 100%)' }} />
            <div className="relative z-10 flex items-start justify-between gap-6 px-8 sm:px-12 py-12 sm:py-16">
              <div className="max-w-xl flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/50 shrink-0"
                  style={{ boxShadow: '0 0 28px -4px rgba(201,164,92,0.4)' }}>
                  <img src={displayPhoto}
                    alt={displayFull} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight">
                    Olá, <span className="font-semibold">{displayName}</span>!
                  </h1>
                  <p className="text-[16px] text-white/65 mt-3 leading-relaxed font-light">
                    Que hoje seja mais um dia de transformar momentos<br />em memórias inesquecíveis.
                  </p>
                  <div className="mt-5 h-px w-20 bg-gradient-to-r from-gold/70 via-gold/30 to-transparent" />
                  <p className="text-[12px] tracking-[0.4em] text-gold/70 uppercase mt-4">Painel criativo RL Photo.Video</p>
                </div>
              </div>

              {/* Top-right: notif + profile */}
              <div className="flex items-center gap-3 shrink-0">
                <NotificationBell />
                <MessagesBell />
                <div className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-gold/40 shrink-0">
                    <img src={displayPhoto} alt={displayFull} className="w-full h-full object-cover" />
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate max-w-[140px]">{displayName}</p>
                    <p className="text-[10px] text-white/40 tracking-wide truncate max-w-[140px]">{displayRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI CARDS (clicáveis e dinâmicos) ───────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {([
              { label: 'Novos Projetos', value: kpiCounts.novos.toString(),       sub: 'Aguardando início', icon: '◫', href: '/painel-editor/novos-projetos' },
              { label: 'Em Andamento',   value: kpiCounts.andamento.toString(),   sub: 'Em edição ativa',   icon: '✎', href: '/painel-editor/novos-projetos' },
              { label: 'Finalizados',    value: kpiCounts.finalizados.toString(), sub: 'Este mês',          icon: '✓', href: '/painel-editor/novos-projetos' },
              { label: 'Recebimentos',   value: totalAnualLabel,                  sub: `Total ${TODAY_YEAR_NUM}`, icon: '€', href: '/painel-editor/pagamentos' },
            ]).map((k, i) => (
              <Link key={i} href={k.href}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-5 hover:border-gold/30 transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-gold/30 flex items-center justify-center text-2xl text-gold"
                      style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.25)' }}>
                      {k.icon}
                    </div>
                    <div>
                      <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{k.label}</p>
                      <p className="text-3xl font-bold text-white leading-none">{k.value}</p>
                      <p className="text-[11px] text-white/35 mt-1.5">{k.sub}</p>
                    </div>
                  </div>
                  <span className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold/60 group-hover:text-gold group-hover:bg-gold/10 transition-all">›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Trabalhos reais enviados pela RL (Fase 2) ── */}
          <TrabalhosRLSection freelancerId={freelancerId} />

          {/* ── GRID 3-col: Projetos | Calendário | Tarefas/Financeiro ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* COLUNA ESQUERDA — Projetos */}
            <div className="lg:col-span-1 flex flex-col gap-5">

              {/* Novos Projetos */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-white">Novos Projetos</h3>
                    {(() => {
                      const unseenInList = novosProjetos.filter(p => unseenIds.has(p.id)).length
                      return unseenInList > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-gold text-black uppercase tracking-widest font-bold"
                          style={{ boxShadow: '0 0 10px rgba(201,164,92,0.7)' }}>
                          <span className="w-1 h-1 rounded-full bg-black animate-pulse" />
                          {unseenInList} novo{unseenInList > 1 ? 's' : ''}
                        </span>
                      )
                    })()}
                  </div>
                  <Link href="/painel-editor/novos-projetos" className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todos →</Link>
                </div>
                <div className="space-y-3">
                  {novosProjetos.map(p => {
                    const unseen = unseenIds.has(p.id)
                    return (
                      <Link key={p.id}
                        href={`/painel-editor/novos-projetos?open=${p.id}`}
                        className={`relative group flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${unseen ? 'unseen-glow border-gold/55' : 'border-white/[0.04] hover:border-gold/25 hover:bg-white/[0.02]'}`}>
                        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <img src={p.foto} alt={p.noivos} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[13px] font-medium text-white truncate">{p.noivos}</p>
                            {unseen ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-gold text-black uppercase tracking-wider shrink-0 font-bold"
                                style={{ boxShadow: '0 0 10px rgba(201,164,92,0.7)' }}>
                                <span className="w-1 h-1 rounded-full bg-black animate-pulse" />
                                Novo
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold uppercase tracking-wider shrink-0">{p.status}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/35">Casamento · {fmtDate(p.data)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-white/35 mb-0.5">Entrega prevista</p>
                          <p className="text-[12px] font-semibold text-gold">{fmtDate(p.entrega)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Projetos Finalizados */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Projetos Finalizados</h3>
                  <Link href="/painel-editor/novos-projetos" className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todos →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {finalizadosProjetos.map(p => (
                    <Link key={p.id} href={`/painel-editor/novos-projetos?open=${p.id}`} className="group cursor-pointer">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.08] mb-2 group-hover:border-gold/30 transition-all">
                        <img src={p.foto} alt={p.noivos} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-black">✓</div>
                      </div>
                      <p className="text-[12px] font-medium text-white truncate group-hover:text-gold transition-colors">{p.noivos}</p>
                      <p className="text-[10px] text-white/35">Entrega: {fmtDate(p.entrega)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA CENTRAL — Calendário + Compromissos */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Calendário</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { const d = new Date(view.y, view.m - 1, 1); setView({ y: d.getFullYear(), m: d.getMonth() }) }}
                      className="w-7 h-7 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all">‹</button>
                    <button onClick={() => { const d = new Date(view.y, view.m + 1, 1); setView({ y: d.getFullYear(), m: d.getMonth() }) }}
                      className="w-7 h-7 rounded-md border border-white/10 text-white/50 hover:text-gold hover:border-gold/30 transition-all">›</button>
                  </div>
                </div>
                <p className="text-center text-[15px] font-light tracking-wider text-white/85 mb-4">{MESES[view.m]} {view.y}</p>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DIAS.map((d, i) => <div key={i} className="text-center text-[10px] tracking-widest uppercase text-white/30 py-1.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((c, i) => {
                    const tooltip = [
                      ...(c.creationNames ?? []).map(n => `📅 Criado: ${n}`),
                      ...(c.deliveryNames ?? []).map(n => `🎯 Entrega: ${n}`),
                      ...(c.taskNames ?? []).map(n => `◷ Tarefa: ${n}`),
                    ].join('\n')
                    return (
                      <button key={i}
                        title={tooltip || undefined}
                        className={`relative aspect-square flex items-center justify-center text-[12px] rounded-lg transition-all ${
                          c.isToday
                            ? 'bg-gold text-black font-bold shadow-lg'
                            : c.current
                              ? 'text-white/70 hover:bg-white/[0.05]'
                              : 'text-white/15'
                        }`}
                        style={c.isToday ? { boxShadow: '0 0 16px rgba(201,164,92,0.5)' } : {}}
                      >
                        {c.day}
                        {/* Dot azul top-left: criação de projeto */}
                        {c.hasCreation && c.current && !c.isToday && (
                          <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-blue-400"
                            style={{ boxShadow: '0 0 6px rgba(96,165,250,0.8)' }} />
                        )}
                        {/* Dot gold bottom-right: entrega prevista */}
                        {c.hasDelivery && c.current && !c.isToday && (
                          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gold"
                            style={{ boxShadow: '0 0 6px rgba(201,164,92,0.9)' }} />
                        )}
                        {/* Dot dourado top-right: tarefa */}
                        {c.hasTask && c.current && !c.isToday && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold/80"
                            style={{ boxShadow: '0 0 6px rgba(201,164,92,0.7)' }} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-white/45 pt-3 border-t border-white/[0.04] flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow: '0 0 5px rgba(96,165,250,0.7)' }} />
                    Criação
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" style={{ boxShadow: '0 0 5px rgba(201,164,92,0.8)' }} />
                    Entrega
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/80" style={{ boxShadow: '0 0 5px rgba(201,164,92,0.6)' }} />
                    Tarefa
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-gold" />
                    Hoje
                  </span>
                </div>
              </div>

              {/* ALERTAS CRÍTICOS — projetos com prazo de entrega ultrapassado */}
              {projetosAtrasados.length > 0 && (
                <div className="alert-glow rounded-2xl border border-red-500/40 p-5 mb-5"
                  style={{ background: 'linear-gradient(180deg, rgba(40,8,8,0.6), rgba(11,11,11,0.85))' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl animate-pulse text-red-400">⚠</span>
                      <div>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-red-300/80 font-bold">Alertas Críticos</p>
                        <h3 className="text-[15px] font-semibold text-white">
                          {projetosAtrasados.length} projeto{projetosAtrasados.length === 1 ? '' : 's'} com entrega atrasada
                        </h3>
                      </div>
                    </div>
                    <Link href="/painel-editor/novos-projetos"
                      className="text-[11px] tracking-widest uppercase text-red-300/80 hover:text-red-200 transition-colors">
                      Resolver →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {projetosAtrasados.slice(0, 5).map(p => (
                      <Link key={p.id} href={`/painel-editor/novos-projetos?open=${p.id}`}
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-red-500/[0.06] transition-colors group">
                        {p.foto ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-red-500/30 shrink-0">
                            <img src={p.foto} alt={p.noivos} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-300 shrink-0">⚠</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{p.noivos}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            Entrega prevista: <span className="text-white/65">{p.entregaPrevista}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[16px] font-bold text-red-300 leading-none">{p.diasAtraso}d</p>
                          <p className="text-[9px] tracking-widest uppercase text-red-300/60 mt-1">atraso</p>
                        </div>
                        <span className="text-red-300/40 group-hover:text-red-200 text-lg">›</span>
                      </Link>
                    ))}
                  </div>
                  {projetosAtrasados.length > 5 && (
                    <p className="text-[10px] text-red-300/60 mt-3 text-center">
                      +{projetosAtrasados.length - 5} outros projetos atrasados
                    </p>
                  )}
                </div>
              )}

              {/* Próximos compromissos — tarefas reais criadas em /painel-editor/tarefas */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Próximos compromissos</h3>
                  <Link href="/painel-editor/tarefas" className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todas →</Link>
                </div>
                <div className="space-y-3">
                  {compromissos.length === 0 ? (
                    <p className="text-[12px] text-white/30 italic py-2">Sem compromissos próximos. <Link href="/painel-editor/tarefas" className="text-gold/70 hover:text-gold underline">Criar tarefa →</Link></p>
                  ) : compromissos.map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <p className="text-[13px] text-white/60 w-12 shrink-0 font-mono">{c.hora}</p>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{c.titulo}</p>
                        <p className="text-[11px] text-white/40 truncate">{c.sub}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${c.overdue ? 'bg-red-400' : 'bg-gold'}`}
                        style={{ boxShadow: c.overdue ? '0 0 6px rgba(248,113,113,0.7)' : '0 0 6px rgba(201,164,92,0.7)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA — Tarefas + Resumo Financeiro */}
            <div className="lg:col-span-1 flex flex-col gap-5">

              {/* Tarefas — 2 últimas concluídas + 3 mais recentes (novas brilham até clicar) */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Tarefas</h3>
                  <Link href="/painel-editor/tarefas" className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todas →</Link>
                </div>
                <div className="space-y-4">
                  {tarefasWidget.length === 0 ? (
                    <p className="text-[12px] text-white/30 italic py-2">Sem tarefas. <Link href="/painel-editor/tarefas" className="text-gold/70 hover:text-gold underline">Criar tarefa →</Link></p>
                  ) : tarefasWidget.map(t => {
                    const isUnseen = unseenTaskIds.has(t.id) && !t.done
                    return (
                      <Link key={t.id} href={`/painel-editor/tarefas`}
                        onClick={() => markTaskSeen(t.id)}
                        className={`block group rounded-lg p-2 -m-2 transition-all ${isUnseen ? 'unseen-glow border border-gold/30 bg-gold/[0.03]' : ''}`}>
                        <div className="flex items-center gap-3 mb-1.5">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            t.done ? 'bg-emerald-500/20 border-emerald-500' : isUnseen ? 'border-gold/70' : 'border-white/30'
                          }`}>
                            {t.done && <span className="text-[10px] text-emerald-300">✓</span>}
                            {isUnseen && !t.done && <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
                          </div>
                          <p className={`flex-1 text-[12px] truncate ${t.done ? 'text-white/55 line-through' : 'text-white/85'}`}>{t.label}</p>
                          {isUnseen && !t.done && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30 text-gold tracking-widest uppercase font-bold">Novo</span>
                          )}
                          <p className={`text-[12px] font-medium ${t.done ? 'text-emerald-300/80' : 'text-white/70'}`}>{t.pct}%</p>
                          <span className="text-white/30 group-hover:text-gold transition-colors text-sm">›</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] ml-8 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${t.pct}%`,
                              background: t.done
                                ? 'linear-gradient(90deg, #34d399, #6ee7b7)'
                                : 'linear-gradient(90deg, #C9A45C, #E8C76D)',
                              boxShadow: t.done ? '0 0 10px rgba(52,211,153,0.5)' : '0 0 10px rgba(201,164,92,0.5)',
                            }} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Resumo Financeiro */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Resumo Financeiro</h3>
                  <button className="text-[11px] tracking-wider text-white/40 hover:text-gold transition-colors px-2 py-1 rounded-md border border-white/10 hover:border-gold/30">Este mês ▾</button>
                </div>

                {/* SVG chart */}
                <div className="relative">
                  <svg viewBox={`0 0 ${chartPath.w} ${chartPath.h}`} className="w-full h-32">
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#C9A45C" />
                        <stop offset="50%" stopColor="#E8C76D" />
                        <stop offset="100%" stopColor="#C9A45C" />
                      </linearGradient>
                    </defs>
                    {/* Filled area below curve */}
                    <path d={`${chartPath.path} L ${chartPath.last.x} ${chartPath.h} L 6 ${chartPath.h} Z`} fill="url(#goldGrad)" />
                    {/* Line */}
                    <path d={chartPath.path} fill="none" stroke="url(#goldLine)" strokeWidth="2.2" strokeLinecap="round" />
                    {/* Last point */}
                    <circle cx={chartPath.last.x} cy={chartPath.last.y} r="4" fill="#C9A45C" />
                    <circle cx={chartPath.last.x} cy={chartPath.last.y} r="9" fill="#C9A45C" opacity="0.18" />
                  </svg>

                  {/* Tooltip — Total Anual real (alinhado com /pagamentos) */}
                  <div className="absolute top-1 right-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-gold/30">
                    <p className="text-[11px] text-gold font-bold leading-none">{totalAnualLabel}</p>
                    <p className="text-[9px] text-white/40 mt-0.5">Total {TODAY_YEAR_NUM}</p>
                  </div>
                </div>

                {/* Eixo X labels (simplificado) */}
                <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
                  <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>31</span>
                </div>
              </div>

              {/* PERFORMANCE — total + on-time + late + média dias (debaixo do Resumo Financeiro) */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Performance</h3>
                  <Link href="/painel-editor/novos-projetos" className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver →</Link>
                </div>

                {(() => {
                  const { total, onTime, late, emCurso, mediaDias } = performanceStats
                  const totalEntregues = onTime + late
                  const pctOn = totalEntregues > 0 ? Math.round((onTime / totalEntregues) * 100) : 0
                  const segs = [
                    { value: onTime,  color: '#34d399', label: 'No prazo' },
                    { value: late,    color: '#ef4444', label: 'Fora prazo' },
                    { value: emCurso, color: '#C9A45C', label: 'Em curso' },
                  ]
                  const sumAll = segs.reduce((s, x) => s + x.value, 0) || 1

                  // Donut SVG (90px)
                  let cumPct = 0
                  const radius = 36, cx = 50, cy = 50
                  const polar = (deg: number) => {
                    const r = (deg - 90) * Math.PI / 180
                    return [cx + radius * Math.cos(r), cy + radius * Math.sin(r)] as const
                  }
                  const arcs = segs.map(s => {
                    const pct = s.value / sumAll
                    if (pct === 0) return null
                    const startDeg = cumPct * 360
                    const endDeg = (cumPct + pct) * 360
                    cumPct += pct
                    const [x1, y1] = polar(startDeg)
                    const [x2, y2] = polar(endDeg)
                    const largeArc = endDeg - startDeg > 180 ? 1 : 0
                    return { path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, color: s.color }
                  }).filter(Boolean) as { path: string; color: string }[]

                  return (
                    <>
                      {/* Top row: donut + média lado a lado */}
                      <div className="flex items-center gap-4 mb-5">
                        {/* Donut com total no centro */}
                        <div className="relative w-[100px] h-[100px] shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="11" />
                            {arcs.map((a, i) => (
                              <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="11" strokeLinecap="butt"
                                style={{ filter: `drop-shadow(0 0 4px ${a.color}80)` }} />
                            ))}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-[8px] tracking-widest uppercase text-white/35 leading-none">Total</p>
                            <p className="text-[22px] font-bold text-white leading-none mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>{total}</p>
                          </div>
                        </div>

                        {/* Média dias */}
                        <div className="flex-1 min-w-0 border-l border-white/[0.06] pl-4">
                          <p className="text-[9px] tracking-[0.3em] uppercase text-gold/70 font-bold mb-1.5 leading-tight">Tempo médio</p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-[36px] font-bold text-gold leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                              {mediaDias}
                            </p>
                            <p className="text-[11px] text-white/55 font-light">{mediaDias === 1 ? 'dia' : 'dias'}</p>
                          </div>
                          <p className="text-[10px] text-white/40 mt-1 leading-snug">
                            Recebido → Entrega final
                          </p>
                        </div>
                      </div>

                      {/* Stats verticais com barras */}
                      <div className="space-y-2.5">
                        {segs.map((s, i) => {
                          const pct = sumAll > 0 ? Math.round((s.value / sumAll) * 100) : 0
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="flex items-center gap-1.5 text-white/65">
                                  <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}99` }} />
                                  {s.label}
                                </span>
                                <span className="font-bold tabular-nums" style={{ color: s.color }}>
                                  {s.value} <span className="text-white/30 font-normal text-[10px]">· {pct}%</span>
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                                <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {totalEntregues > 0 && (
                        <p className="text-[10px] text-white/40 pt-3 mt-3 border-t border-white/[0.04]">
                          <span className="text-emerald-300 font-bold">{pctOn}%</span> dos entregues no prazo
                        </p>
                      )}
                      {totalEntregues === 0 && (
                        <p className="text-[10px] text-white/25 italic mt-3 text-center">Sem projetos entregues ainda</p>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 mb-4 flex items-center justify-between">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20">RL Photo.Video · Painel Editor</p>
            <Link href="/photo" className="text-[11px] tracking-widest uppercase text-white/30 hover:text-gold transition-colors">← Voltar ao Menu Principal</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
