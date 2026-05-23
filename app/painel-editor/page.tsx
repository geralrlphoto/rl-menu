'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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
  { key: 'notas',       label: 'Notas',               icon: '✦' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

function fmtDate(d: string) {
  const [y,m,dd] = d.split('-').map(Number)
  return `${String(dd).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`
}

// Foto fallback para o caso de o freelancer não ter foto
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=face'

export default function PainelEditor() {
  const params = useSearchParams()
  const freelancerId = params?.get('freelancer') ?? null
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null)

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

  const displayName  = freelancer?.nome?.split(' ')[0] ?? 'Editor'
  const displayFull  = freelancer?.nome ?? 'Editor Pro'
  const displayEmail = freelancer?.email ?? 'editorpro@mail.com'
  const displayRole  = freelancer?.status ?? 'Editor de Vídeo'
  const displayPhoto = freelancer?.foto_url ?? DEFAULT_AVATAR

  const [active, setActive] = useState('dashboard')

  // ── Novos Projetos (lê localStorage + mock) — máximo 4 mais recentes ──
  const [novosProjetos, setNovosProjetos] = useState<NovoMini[]>(MOCK_NOVOS)
  const [finalizadosProjetos, setFinalizadosProjetos] = useState<typeof MOCK_FINALIZADOS>(MOCK_FINALIZADOS)
  const [unseenIds, setUnseenIds] = useState<Set<string>>(new Set())
  const [storageTick, setStorageTick] = useState(0)  // refresh signal para useMemos que leem localStorage
  // Inicializa com contagens calculadas dos defaults do mock
  const initialKpis = (() => {
    const stages = Object.values(MOCK_PROJECTS_STAGES)
    return {
      novos:       stages.filter(s => s === 'Novo Projeto').length,
      andamento:   stages.filter(s => EDITING_STAGES.includes(s)).length,
      finalizados: stages.filter(s => s === 'Entregue').length,
    }
  })()
  const [kpiCounts, setKpiCounts] = useState(initialKpis)

  function loadFromStorage() {
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

  // Calendário
  const today = new Date(2026, 4, 20) // Maio 2026 dia 20 (mock)
  const [view, setView] = useState({ y: 2026, m: 4 })

  // ── Marcas no calendário: criações + entregas + tarefas ───────────────
  // Mapa: 'YYYY-MM-DD' → { creations: string[], deliveries: string[], tasks: string[] }
  const calendarMarks = useMemo(() => {
    const marks: Record<string, { creations: string[]; deliveries: string[]; tasks: string[] }> = {}
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

    // 3) Tarefas criadas em /painel-editor/tarefas (filtra eliminadas)
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('painel-editor-user-tasks') : null
      const userTasks: any[] = raw ? JSON.parse(raw) : []
      const delRaw = typeof window !== 'undefined' ? localStorage.getItem('painel-editor-deleted-tasks') : null
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
      userTasks
        .filter(t => !deleted.has(t.id) && t.deadline)
        .forEach(t => {
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
    const max = Math.max(...MOCK_REVENUE)
    const step = (w - pad*2) / (MOCK_REVENUE.length - 1)
    const pts = MOCK_REVENUE.map((v, i) => {
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
  }, [])

  // ── Próximos compromissos: tarefas reais de /painel-editor/tarefas ──────
  // Filtra: não concluídas, deadline >= hoje, ordena por data+hora, limita a 5
  const compromissos = useMemo(() => {
    if (typeof window === 'undefined') return [] as { hora: string; titulo: string; sub: string; overdue: boolean; dateMs: number }[]
    try {
      const raw = localStorage.getItem('painel-editor-user-tasks')
      const userTasks: any[] = raw ? JSON.parse(raw) : []
      const delRaw = localStorage.getItem('painel-editor-deleted-tasks')
      const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : [])
      const userProjRaw = localStorage.getItem('painel-editor-user-projects')
      const userProj: any[] = userProjRaw ? JSON.parse(userProjRaw) : []

      const todayMs = (() => {
        const t = new Date(2026, 4, 24)  // mock today
        return t.getTime()
      })()

      const parseMs = (d: string, h?: string): number => {
        const [dd, mm, yyyy] = (d || '').split('/').map(Number)
        if (!dd || !mm || !yyyy) return 0
        const [hh, mi] = (h || '').split(':').map(Number)
        return new Date(yyyy, mm - 1, dd, hh || 0, mi || 0).getTime()
      }

      return userTasks
        .filter(t => !deleted.has(t.id))
        .filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada')
        .map(t => {
          const projeto = t.projectId ? userProj.find(p => p.id === t.projectId)?.noivos : null
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

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0B0B0B' }}>
      {/* Animação gold pulse para projetos novos não-abertos */}
      <style jsx global>{`
        @keyframes unseenGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 16px -4px rgba(201,164,92,0.25); }
          50%      { box-shadow: 0 0 0 rgba(201,164,92,0), 0 0 32px 0 rgba(201,164,92,0.55); }
        }
        .unseen-glow { animation: unseenGlow 2.4s ease-in-out infinite; }
      `}</style>
      {/* ── Background atmosférico (radial gold + grid sutil) ─────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.06), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,164,92,0.04), transparent 70%)' }} />

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[220px] z-30 flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(15,12,8,0.95) 0%, rgba(11,9,5,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(201,164,92,0.12)',
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-8 pb-8 flex flex-col items-center border-b border-white/[0.04]">
          <div className="w-14 h-14 rounded-2xl border border-gold/40 flex items-center justify-center mb-2"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
            <span className="text-2xl font-serif italic" style={{ color: '#C9A45C', fontFamily: 'Georgia, serif' }}>W</span>
          </div>
          <p className="text-[10px] tracking-[0.4em] text-gold/70 font-light uppercase mt-1">Video Editor</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          {NAV_ITEMS.map(it => {
            const isActive = active === it.key
            const cls = `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
              isActive
                ? 'bg-gold/10 border border-gold/30 text-gold'
                : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
            }`
            const inner = (
              <>
                <span className={`w-5 text-center text-base ${isActive ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
                <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
              </>
            )

            if (it.href) {
              return (
                <Link key={it.key} href={it.href} className={cls}>{inner}</Link>
              )
            }
            return (
              <button
                key={it.key}
                onClick={() => setActive(it.key)}
                className={cls}
                style={isActive ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.35)' } : {}}
              >
                {inner}
              </button>
            )
          })}
        </nav>

        {/* Quote */}
        <div className="px-5 py-5 border-t border-white/[0.04]">
          <p className="text-gold/40 text-2xl font-serif leading-none mb-2">&ldquo;</p>
          <p className="text-[11px] text-white/35 italic leading-relaxed">Cada corte conta uma história.</p>
          <p className="text-[11px] text-white/35 italic leading-relaxed">Cada história merece emoção.</p>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────── */}
      <main className="relative z-10 lg:pl-[220px]">
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
                <button className="relative w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center group">
                  <span className="text-lg text-white/70 group-hover:text-gold">🔔</span>
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black">3</span>
                </button>
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
              { label: 'Recebimentos',   value: '24.850,00 €',                    sub: 'Este mês',          icon: '€', href: '/painel-editor/pagamentos' },
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

              {/* Tarefas */}
              <div className="rounded-2xl border border-white/[0.08] p-5"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold text-white">Tarefas</h3>
                  <button className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">Ver todas →</button>
                </div>
                <div className="space-y-4">
                  {MOCK_TAREFAS.map(t => (
                    <div key={t.id} className="group">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          t.done ? 'bg-gold/20 border-gold' : 'border-white/30'
                        }`}>
                          {t.done && <span className="text-[10px] text-gold">✓</span>}
                        </div>
                        <p className="flex-1 text-[12px] text-white/85 truncate">{t.label}</p>
                        <p className="text-[12px] text-white/70 font-medium">{t.pct}%</p>
                        <button className="text-white/30 group-hover:text-gold transition-colors text-sm">›</button>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] ml-8 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${t.pct}%`,
                            background: 'linear-gradient(90deg, #C9A45C, #E8C76D)',
                            boxShadow: '0 0 10px rgba(201,164,92,0.5)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
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

                  {/* Tooltip do último valor */}
                  <div className="absolute top-1 right-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-gold/30">
                    <p className="text-[11px] text-gold font-bold leading-none">24.850,00 €</p>
                    <p className="text-[9px] text-white/40 mt-0.5">Receitas</p>
                  </div>
                </div>

                {/* Eixo X labels (simplificado) */}
                <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
                  <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>31</span>
                </div>
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
