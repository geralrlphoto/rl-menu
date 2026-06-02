'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Manrope, Space_Grotesk } from 'next/font/google'
import type { Projeto, RoadmapColuna, RoadmapTarefa, TarefaEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

/* ────────────────────────────────────────────────────────── */
/*  DEFAULT — 7 colunas padrão para qualquer projeto          */
/* ────────────────────────────────────────────────────────── */

const DEFAULT_ROADMAP: RoadmapColuna[] = [
  {
    id: 'briefing', titulo: 'Briefing', cor: 'blue',
    tarefas: [
      { id: 'b1', titulo: 'Primeiro Contato',    estado: 'nao_iniciada', data: '' },
      { id: 'b2', titulo: 'Formulário Briefing', estado: 'nao_iniciada', data: '' },
      { id: 'b3', titulo: 'Reunião de Briefing', estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'proposta', titulo: 'Proposta', cor: 'cyan',
    tarefas: [
      { id: 'p1', titulo: 'Análise de Requisitos', estado: 'nao_iniciada', data: '' },
      { id: 'p2', titulo: 'Criação da Proposta',   estado: 'nao_iniciada', data: '' },
      { id: 'p3', titulo: 'Apresentação',          estado: 'nao_iniciada', data: '' },
      { id: 'p4', titulo: 'Adjudicação',           estado: 'nao_iniciada', data: '' },
      { id: 'p5', titulo: 'CPS Assinado',          estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'planeamento', titulo: 'Planeamento', cor: 'yellow',
    tarefas: [
      { id: 'pl1', titulo: 'Definição de Datas',       estado: 'nao_iniciada', data: '' },
      { id: 'pl2', titulo: 'Seleção de Staff',          estado: 'nao_iniciada', data: '' },
      { id: 'pl3', titulo: 'Logística e Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pl4', titulo: 'Storytelling / Guião',      estado: 'nao_iniciada', data: '' },
      { id: 'pl5', titulo: 'Vistoria ao Local',         estado: 'nao_iniciada', data: '' },
      { id: 'pl6', titulo: 'Data Captação Confirmada',  estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pre-producao', titulo: 'Pré-Produção', cor: 'purple',
    tarefas: [
      { id: 'pr1', titulo: 'Briefing de Staff',            estado: 'nao_iniciada', data: '' },
      { id: 'pr2', titulo: 'Organização de Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pr3', titulo: 'Confirmar Datas com Cliente',  estado: 'nao_iniciada', data: '' },
      { id: 'pr4', titulo: 'Preparação de Materiais',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'producao', titulo: 'Produção', cor: 'orange',
    tarefas: [
      { id: 'prod1', titulo: 'Captação de Conteúdo', estado: 'nao_iniciada', data: '' },
      { id: 'prod2', titulo: 'Fotografia de Produto', estado: 'nao_iniciada', data: '' },
      { id: 'prod3', titulo: 'Vídeo Institucional',   estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pos-producao', titulo: 'Pós-Produção', cor: 'violet',
    tarefas: [
      { id: 'pp1', titulo: 'Arquivo e Organização', estado: 'nao_iniciada', data: '' },
      { id: 'pp2', titulo: 'Edição de Vídeo',        estado: 'nao_iniciada', data: '' },
      { id: 'pp3', titulo: 'Edição de Fotografias',  estado: 'nao_iniciada', data: '' },
      { id: 'pp4', titulo: 'Color Grading',           estado: 'nao_iniciada', data: '' },
      { id: 'pp5', titulo: 'Revisão Interna',         estado: 'nao_iniciada', data: '' },
      { id: 'pp6', titulo: 'Revisão do Cliente',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'entrega', titulo: 'Entrega', cor: 'emerald',
    tarefas: [
      { id: 'e1', titulo: 'Exportação Final',       estado: 'nao_iniciada', data: '' },
      { id: 'e2', titulo: 'Entrega de Ficheiros',   estado: 'nao_iniciada', data: '' },
      { id: 'e3', titulo: 'Fatura Final',           estado: 'nao_iniciada', data: '' },
      { id: 'e4', titulo: 'Avaliação / Satisfação', estado: 'nao_iniciada', data: '' },
    ],
  },
]

/* ────────────────────────────────────────────────────────── */
/*  CONFIG                                                    */
/* ────────────────────────────────────────────────────────── */

const ESTADO_OPTIONS: { value: TarefaEstado; label: string }[] = [
  { value: 'concluido',    label: 'Concluído'    },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'aguardar',     label: 'Aguardar'     },
  { value: 'enviado',      label: 'Enviado'      },
]

type EstadoCfg = { pill: string; dot: string; text: string; label: string }

const ESTADO_CFG: Record<TarefaEstado, EstadoCfg> = {
  concluido:    { pill: 'bg-emerald-400/15 border border-emerald-400/25', dot: 'bg-emerald-400',        text: 'text-emerald-400',  label: 'Concluído'    },
  em_andamento: { pill: 'bg-blue-400/15 border border-blue-400/25',       dot: 'bg-blue-400 animate-pulse', text: 'text-blue-400', label: 'Em andamento' },
  nao_iniciada: { pill: 'bg-white/[0.05] border border-white/10',         dot: 'bg-white/25',            text: 'text-white/35',     label: 'Não iniciada' },
  aguardar:     { pill: 'bg-amber-400/15 border border-amber-400/25',     dot: 'bg-amber-400',           text: 'text-amber-400',    label: 'Aguardar'     },
  enviado:      { pill: 'bg-violet-400/15 border border-violet-400/25',   dot: 'bg-violet-400',          text: 'text-violet-400',   label: 'Enviado'      },
}

const CORES = [
  { value: 'blue',    cls: 'bg-blue-400',    ring: 'ring-blue-400/60'    },
  { value: 'cyan',    cls: 'bg-cyan-400',    ring: 'ring-cyan-400/60'    },
  { value: 'emerald', cls: 'bg-emerald-400', ring: 'ring-emerald-400/60' },
  { value: 'yellow',  cls: 'bg-yellow-400',  ring: 'ring-yellow-400/60'  },
  { value: 'amber',   cls: 'bg-amber-400',   ring: 'ring-amber-400/60'   },
  { value: 'orange',  cls: 'bg-orange-400',  ring: 'ring-orange-400/60'  },
  { value: 'red',     cls: 'bg-red-400',     ring: 'ring-red-400/60'     },
  { value: 'purple',  cls: 'bg-purple-400',  ring: 'ring-purple-400/60'  },
  { value: 'violet',  cls: 'bg-violet-400',  ring: 'ring-violet-400/60'  },
  { value: 'white',   cls: 'bg-white/50',    ring: 'ring-white/40'       },
]

const corDot: Record<string, string> = Object.fromEntries(CORES.map(c => [c.value, c.cls]))

const DEFAULT_ROADMAP_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80'

/* Cor suave do lane (background da coluna) */
const corLane: Record<string, string> = {
  blue:    'bg-blue-400/[0.03]    border-blue-400/[0.08]',
  cyan:    'bg-cyan-400/[0.03]    border-cyan-400/[0.08]',
  emerald: 'bg-emerald-400/[0.03] border-emerald-400/[0.08]',
  yellow:  'bg-yellow-400/[0.03]  border-yellow-400/[0.08]',
  amber:   'bg-amber-400/[0.03]   border-amber-400/[0.08]',
  orange:  'bg-orange-400/[0.03]  border-orange-400/[0.08]',
  red:     'bg-red-400/[0.03]     border-red-400/[0.08]',
  purple:  'bg-purple-400/[0.03]  border-purple-400/[0.08]',
  violet:  'bg-violet-400/[0.03]  border-violet-400/[0.08]',
  white:   'bg-white/[0.02]       border-white/[0.06]',
}

const fmtDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* Map: estado da tarefa → oklch token --sc (cor do strip + badge) */
const ESTADO_OKLCH: Record<TarefaEstado, string> = {
  concluido:    'oklch(0.72 0.12 165)',
  em_andamento: 'oklch(0.80 0.12 245)',
  nao_iniciada: 'oklch(0.62 0.02 245)',
  aguardar:     'oklch(0.80 0.13 80)',
  enviado:      'oklch(0.70 0.13 300)',
}
/* Map: classe Tailwind de cor da coluna → oklch token --cc (dot + rail) */
const CORES_OKLCH: Record<string, string> = {
  blue:    'oklch(0.70 0.13 245)',
  cyan:    'oklch(0.74 0.12 210)',
  emerald: 'oklch(0.74 0.13 165)',
  yellow:  'oklch(0.80 0.13 90)',
  amber:   'oklch(0.78 0.14 75)',
  orange:  'oklch(0.72 0.15 50)',
  red:     'oklch(0.65 0.18 20)',
  purple:  'oklch(0.70 0.14 295)',
  violet:  'oklch(0.68 0.15 280)',
  white:   'oklch(0.85 0.02 245)',
}

/* ────────────────────────────────────────────────────────── */
/*  COMPONENT                                                 */
/* ────────────────────────────────────────────────────────── */

/* Roadmap válido = tem pelo menos uma coluna com pelo menos uma tarefa */
function roadmapValido(rm: RoadmapColuna[] | undefined): boolean {
  return !!(rm && rm.length > 0 && rm.some(c => c.tarefas && c.tarefas.length > 0))
}

interface Props { projeto: Projeto; isAdmin: boolean }

export default function RoadmapClient({ projeto: initial, isAdmin }: Props) {
  const [colunas, setColunas] = useState<RoadmapColuna[]>(
    roadmapValido(initial.roadmap) ? initial.roadmap! : DEFAULT_ROADMAP
  )
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [heroUrl, setHeroUrl]     = useState(initial.roadmapImageUrl || DEFAULT_ROADMAP_IMAGE)

  /* Auto-inicializar: guarda as colunas+tarefas default no Supabase
     quando o roadmap está ausente ou tem colunas mas sem tarefas */
  useEffect(() => {
    if (!roadmapValido(initial.roadmap)) {
      fetch(`/api/media-portal/${initial.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap: DEFAULT_ROADMAP, roadmapImageUrl: initial.roadmapImageUrl || DEFAULT_ROADMAP_IMAGE }),
      }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* totais para o header */
  const totalTarefas   = colunas.reduce((s, c) => s + c.tarefas.length, 0)
  const totalConcluidas = colunas.reduce((s, c) => s + c.tarefas.filter(t => t.estado === 'concluido').length, 0)
  const progresso      = totalTarefas > 0 ? Math.round((totalConcluidas / totalTarefas) * 100) : 0

  /* Baseline do roadmap (último estado guardado) — para detectar mudanças
     de estado das tarefas ao gravar e disparar notificações. */
  const baselineRef = useRef<RoadmapColuna[]>(
    roadmapValido(initial.roadmap) ? initial.roadmap! : DEFAULT_ROADMAP
  )

  /* Fire-and-forget: dispara uma notificação por cada tarefa cuja
     'estado' mudou desde o último save. Tolerante a falhas. */
  const notifyStatusChanges = async (prev: RoadmapColuna[], next: RoadmapColuna[]) => {
    const changes: { coluna: string; tarefa: string; from: TarefaEstado; to: TarefaEstado }[] = []
    const prevMap = new Map<string, { col: string; estado: TarefaEstado; titulo: string }>()
    for (const col of prev) {
      for (const t of col.tarefas) {
        prevMap.set(t.id, { col: col.titulo, estado: t.estado, titulo: t.titulo })
      }
    }
    for (const col of next) {
      for (const t of col.tarefas) {
        const p = prevMap.get(t.id)
        if (p && p.estado !== t.estado) {
          changes.push({ coluna: col.titulo, tarefa: t.titulo, from: p.estado, to: t.estado })
        }
      }
    }
    if (changes.length === 0) return
    const labels: Record<string, string> = {
      concluido: 'Concluído',
      em_andamento: 'Em andamento',
      nao_iniciada: 'Não iniciada',
      aguardar: 'Aguardar',
      enviado: 'Enviado',
    }
    await Promise.all(changes.map(c =>
      fetch(`/api/media-portal/${initial.ref}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roadmap-status',
          title: `${c.tarefa}`,
          body: `${c.coluna} · ${labels[c.from] ?? c.from} → ${labels[c.to] ?? c.to}`,
          meta: {
            coluna: c.coluna,
            tarefa: c.tarefa,
            estadoAnterior: c.from,
            novoEstado: c.to,
          },
        }),
      }).catch(() => {})
    ))
  }

  /* Mudança rápida de estado (a partir da view mode — só admin).
     Detecta estado anterior, atualiza local, PATCH imediato + notificação. */
  const quickChangeEstado = async (colunaId: string, tarefaId: string, novoEstado: TarefaEstado) => {
    let tarefaTitulo = ''
    let colunaTitulo = ''
    let estadoAnterior: TarefaEstado = 'nao_iniciada'
    const next = colunas.map(col => {
      if (col.id !== colunaId) return col
      colunaTitulo = col.titulo
      return {
        ...col,
        tarefas: col.tarefas.map(t => {
          if (t.id !== tarefaId) return t
          tarefaTitulo = t.titulo
          estadoAnterior = t.estado
          return { ...t, estado: novoEstado }
        }),
      }
    })
    if (estadoAnterior === novoEstado) return // sem mudança real
    setColunas(next)
    baselineRef.current = next // baseline avança aqui também
    // PATCH ao Supabase
    fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmap: next, roadmapImageUrl: heroUrl }),
    }).catch(() => {})
    // Notificação
    const labels: Record<string, string> = {
      concluido: 'Concluído',
      em_andamento: 'Em andamento',
      nao_iniciada: 'Não iniciada',
      aguardar: 'Aguardar',
      enviado: 'Enviado',
    }
    fetch(`/api/media-portal/${initial.ref}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'roadmap-status',
        title: tarefaTitulo,
        body: `${colunaTitulo} · ${labels[estadoAnterior] ?? estadoAnterior} → ${labels[novoEstado] ?? novoEstado}`,
        meta: {
          coluna: colunaTitulo,
          tarefa: tarefaTitulo,
          estadoAnterior,
          novoEstado,
        },
      }),
    }).catch(() => {})
  }

  /* ── persistência ── */
  const save = async () => {
    setSaving(true)
    const before = baselineRef.current
    const after = colunas
    try {
      await fetch(`/api/media-portal/${initial.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap: after, roadmapImageUrl: heroUrl }),
      })
      // Após guardar com sucesso, disparar notificações por estado alterado.
      // Só é o admin que edita (clientes não veem o botão Guardar) — isAdmin
      // será true neste caminho, mas ficamos defensivos.
      if (isAdmin) {
        notifyStatusChanges(before, after)
      }
      // Actualiza baseline para o próximo diff
      baselineRef.current = after
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setColunas(roadmapValido(initial.roadmap) ? initial.roadmap! : DEFAULT_ROADMAP)
    setHeroUrl(initial.roadmapImageUrl || DEFAULT_ROADMAP_IMAGE)
    setIsEditing(false)
  }

  /* ── colunas ── */
  const addColuna = () =>
    setColunas(c => [...c, { id: Date.now().toString(), titulo: `Fase ${c.length + 1}`, cor: 'blue', tarefas: [] }])

  const removeColuna = (id: string) =>
    setColunas(c => c.filter(col => col.id !== id))

  const updateColuna = (id: string, field: 'titulo' | 'cor', value: string) =>
    setColunas(c => c.map(col => col.id === id ? { ...col, [field]: value } : col))

  /* ── tarefas ── */
  const addTarefa = (colunaId: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: [...col.tarefas, { id: Date.now().toString(), titulo: 'Nova tarefa', estado: 'nao_iniciada' as TarefaEstado, data: '' }] }
      : col))

  const removeTarefa = (colunaId: string, tarefaId: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: col.tarefas.filter(t => t.id !== tarefaId) }
      : col))

  const updateTarefa = (colunaId: string, tarefaId: string, field: keyof RoadmapTarefa, value: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: col.tarefas.map(t => t.id === tarefaId ? { ...t, [field]: value } : t) }
      : col))

  const moveTarefa = async (colunaId: string, tarefaId: string, dir: 'up' | 'down') => {
    let novasColunas: RoadmapColuna[] = []
    setColunas(prev => {
      novasColunas = prev.map(col => {
        if (col.id !== colunaId) return col
        const idx = col.tarefas.findIndex(t => t.id === tarefaId)
        if (idx === -1) return col
        const newIdx = dir === 'up' ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= col.tarefas.length) return col
        const tarefas = [...col.tarefas]
        ;[tarefas[idx], tarefas[newIdx]] = [tarefas[newIdx], tarefas[idx]]
        return { ...col, tarefas }
      })
      return novasColunas
    })
    // Auto-save
    await fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmap: novasColunas }),
    }).catch(() => {})
  }

  /* ────────────────────────────────────────────────────────── */
  /*  RENDER                                                    */
  /* ────────────────────────────────────────────────────────── */
  return (
    <div className={`rl-roadmap ${manrope.variable} ${spaceGrotesk.variable}`}>
      {/* Background fx — radial accent breathing (fixed) */}
      <div className="rl-bg-fx" aria-hidden="true" />

      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="rl-page">

        {/* ── Crumb ── */}
        <p className="rl-crumb">
          <Link href={`/portal-media/${initial.ref}`}>› Portal · {initial.nome}</Link>
        </p>

        {/* ── Header (title left + stats right) ── */}
        <header className="rl-head">
          <div className="rl-head-l">
            <p className="rl-eyebrow">RL PROD · {initial.nome}</p>
            <h1 className="rl-title" aria-label="Road Map">
              {'ROAD MAP'.split('').map((ch, i) => ch === ' '
                ? <span key={i} className="sp" />
                : <span key={i} style={{ animationDelay: `${(0.2 + i * 0.06).toFixed(2)}s` }}>{ch}</span>
              )}
            </h1>
          </div>
          <div className="rl-stats">
            <div className="rl-stat">
              <span className="rl-stat-k">Fases</span>
              <span className="rl-stat-v">{colunas.length}</span>
            </div>
            <div className="rl-stat">
              <span className="rl-stat-k">Tarefas</span>
              <span className="rl-stat-v">{totalConcluidas}<small>/{totalTarefas}</small></span>
            </div>
            <div className="rl-stat is-pct">
              <span className="rl-stat-k">Concluído</span>
              <span className="rl-stat-v">{progresso}<small>%</small></span>
              <span className="rl-stat-bar"><i style={{ width: `${progresso}%` }} /></span>
            </div>
            {isAdmin && isEditing && (
              <button onClick={addColuna} className="rl-btn-dashed">+ Coluna</button>
            )}
          </div>
        </header>

        {/* ── Explainer ── */}
        <section className="rl-card rl-explain">
          <h2 className="rl-explain-h">O que é o Road Map?</h2>
          <p className="rl-explain-lead">
            O Road Map é o quadro visual que mostra, em tempo real, o estado de cada fase do seu projeto. Está organizado em colunas que representam as grandes etapas do processo, desde o briefing inicial até à entrega final.
          </p>
          <div className="rl-explain-grid">
            {[
              { n: '01', t: 'Visão geral do projeto',   d: 'Num único ecrã tens o panorama completo: o que já foi concluído, o que está em curso e o que ainda está por fazer.' },
              { n: '02', t: 'Fases e tarefas',          d: 'Cada coluna é uma fase do projeto. Dentro de cada fase existem tarefas específicas, cada uma com o seu estado e data prevista.' },
              { n: '03', t: 'Estados em tempo real',    d: 'As tarefas atualizam o estado à medida que o trabalho avança: Concluído, Em andamento, Aguardar, Enviado ou Não iniciada.' },
              { n: '04', t: 'Transparência total',      d: 'O objetivo é garantir que estás sempre informado sobre o progresso. Tens acesso ao mesmo quadro que a nossa equipa.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="rl-feat">
                <span className="rl-feat-n">{n}</span>
                <div>
                  <p className="rl-feat-t">{t}</p>
                  <p className="rl-feat-d">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Legenda de estados ── */}
        <div className="rl-legend">
          {ESTADO_OPTIONS.map(opt => (
            <span key={opt.value} className={`rl-chip rl-chip--${opt.value}`}>
              <i />{opt.label}
            </span>
          ))}
        </div>

        {/* ── Board ── */}
        {colunas.length === 0 ? (
          <div className="rl-empty">
            <p className="rl-empty-lbl">Road map vazio</p>
            {isAdmin && <p className="rl-empty-hint">Clica em &ldquo;Editar&rdquo; e depois em &ldquo;+ Coluna&rdquo; para começar</p>}
          </div>
        ) : (
          <div className="rl-board" style={{ ['--rl-cols' as any]: colunas.length }}>
              {colunas.map((coluna, ci) => {
                const dot      = corDot[coluna.cor] ?? 'bg-white/30'
                const lane     = corLane[coluna.cor] ?? 'bg-white/[0.02] border-white/[0.06]'
                const concluidas = coluna.tarefas.filter(t => t.estado === 'concluido').length
                const colCC = CORES_OKLCH[coluna.cor] ?? 'oklch(0.66 0.13 245)'

                return (
                  <div
                    key={coluna.id}
                    className="rl-col"
                    style={{
                      ['--cc' as any]: colCC,
                      animationDelay: `${(0.3 + ci * 0.09).toFixed(2)}s`,
                    }}
                  >

                    {/* ── Cabeçalho da coluna ── */}
                    {isEditing ? (
                      <div className="border border-white/[0.08] bg-white/[0.025] px-3 pt-3 pb-3 mb-3 flex flex-col gap-3">
                        {/* Seletor de cor */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {CORES.map(co => (
                            <button key={co.value} onClick={() => updateColuna(coluna.id, 'cor', co.value)} title={co.value}
                              className={`w-3.5 h-3.5 rounded-full shrink-0 ${co.cls} transition-all
                                ${coluna.cor === co.value ? `ring-1 ${co.ring} ring-offset-[2px] ring-offset-[#04080f] scale-125` : 'opacity-30 hover:opacity-80'}`}
                            />
                          ))}
                          <button onClick={() => removeColuna(coluna.id)}
                            className="ml-auto text-[14px] text-red-400/40 hover:text-red-400/70 transition-colors">✕</button>
                        </div>
                        <input
                          value={coluna.titulo}
                          onChange={e => updateColuna(coluna.id, 'titulo', e.target.value)}
                          className="w-full bg-transparent text-[13px] tracking-[0.3em] text-white/70 uppercase font-medium focus:outline-none border-b border-white/10 focus:border-white/30 pb-0.5"
                          placeholder="Nome da fase"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="rl-col-head">
                          <span className="rl-col-dot" />
                          <span className="rl-col-name">{coluna.titulo}</span>
                          <span className="rl-col-count">{coluna.tarefas.length}</span>
                        </div>
                        <div className="rl-col-rail" style={{ animationDelay: `${(0.6 + ci * 0.09).toFixed(2)}s` }} />
                      </>
                    )}

                    {/* ── Lane ── */}
                    <div className={isEditing ? `rl-col-body rl-col-body--edit ${lane}` : 'rl-col-body'}>

                      {/* ── Cards de tarefa ── */}
                      {coluna.tarefas.map((tarefa, ti) => {
                        const cfg = ESTADO_CFG[tarefa.estado]
                        const taskSC = ESTADO_OKLCH[tarefa.estado]
                        return (
                          <div
                            key={tarefa.id}
                            className="rl-task group/card"
                            style={{
                              ['--sc' as any]: taskSC,
                              animationDelay: `${(0.5 + ci * 0.08 + ti * 0.05).toFixed(2)}s`,
                            }}
                          >

                            {isEditing ? (
                              /* ── Modo edição ── */
                              <div className="flex gap-2">
                                {/* Setas de reordenação */}
                                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                  <button
                                    onClick={() => moveTarefa(coluna.id, tarefa.id, 'up')}
                                    className="w-5 h-5 flex items-center justify-center border border-white/[0.08] hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.06] transition-all text-white/25 hover:text-white/70"
                                    title="Mover para cima"
                                  >
                                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2 7l3-4 3 4"/>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveTarefa(coluna.id, tarefa.id, 'down')}
                                    className="w-5 h-5 flex items-center justify-center border border-white/[0.08] hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.06] transition-all text-white/25 hover:text-white/70"
                                    title="Mover para baixo"
                                  >
                                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2 3l3 4 3-4"/>
                                    </svg>
                                  </button>
                                </div>
                                {/* Campos de edição */}
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                  <input
                                    value={tarefa.titulo}
                                    onChange={e => updateTarefa(coluna.id, tarefa.id, 'titulo', e.target.value)}
                                    className="w-full bg-transparent text-[14px] text-white/70 focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5 placeholder:text-white/15"
                                    placeholder="Título da tarefa"
                                  />
                                  <select
                                    value={tarefa.estado}
                                    onChange={e => updateTarefa(coluna.id, tarefa.id, 'estado', e.target.value)}
                                    className="bg-[#04080f] border border-white/[0.08] text-[14px] text-white/50 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full rounded-none"
                                  >
                                    {ESTADO_OPTIONS.map(o => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="date"
                                    value={tarefa.data ?? ''}
                                    onChange={e => updateTarefa(coluna.id, tarefa.id, 'data', e.target.value)}
                                    className="bg-[#04080f] border border-white/[0.08] text-[14px] text-white/40 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full"
                                  />
                                  <button onClick={() => removeTarefa(coluna.id, tarefa.id)}
                                    className="text-[12px] tracking-[0.25em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors self-end">
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Modo visualização ── */
                              <div className="flex gap-2 items-start">
                                {/* Setas — só visíveis para admin */}
                                {isAdmin && (
                                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                                    <button
                                      onClick={() => moveTarefa(coluna.id, tarefa.id, 'up')}
                                      className="w-5 h-5 flex items-center justify-center border border-white/[0.08] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.08] transition-all text-white/25 hover:text-white/80"
                                      title="Mover para cima"
                                    >
                                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 7l3-4 3 4"/>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => moveTarefa(coluna.id, tarefa.id, 'down')}
                                      className="w-5 h-5 flex items-center justify-center border border-white/[0.08] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.08] transition-all text-white/25 hover:text-white/80"
                                      title="Mover para baixo"
                                    >
                                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 3l3 4 3-4"/>
                                      </svg>
                                    </button>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="rl-task-name">{tarefa.titulo}</p>
                                  <div className="rl-task-foot">
                                    {isAdmin ? (
                                      <EstadoQuickChanger
                                        cfg={cfg}
                                        current={tarefa.estado}
                                        onChange={(novoEstado) => quickChangeEstado(coluna.id, tarefa.id, novoEstado)}
                                      />
                                    ) : (
                                      <span className={`rl-badge rl-badge--${tarefa.estado}`}>
                                        <i />{cfg.label}
                                      </span>
                                    )}
                                    {tarefa.data ? (
                                      <span className="rl-task-date">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="4" y="5" width="16" height="16" rx="2.5"/>
                                          <path d="M4 9h16M8 3v4M16 3v4"/>
                                        </svg>
                                        {fmtDate(tarefa.data)}
                                      </span>
                                    ) : (
                                      <span className="rl-task-date" style={{ opacity: 0.6 }}>Sem data</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Botão adicionar tarefa */}
                      {isEditing && (
                        <button onClick={() => addTarefa(coluna.id)} className="rl-btn-dashed-block">
                          + Tarefa
                        </button>
                      )}

                      {/* Estado vazio (não edição) */}
                      {coluna.tarefas.length === 0 && !isEditing && (
                        <div className="rl-col-empty">
                          <p>Sem tarefas</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="rl-foot">
          <p className="rl-foot-tag">More than a product, <b>an experience.</b></p>
          <p className="rl-foot-sub">RL PROD · Photography &amp; Video</p>
        </footer>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}

      {/* ── Tokens + animations 1:1 ao roadmap.css do handoff RL PROD ── */}
      <style jsx>{`
        .rl-roadmap {
          --navy-950: #0e1b27;
          --navy-900: #122230;
          --navy-850: #16293a;
          --navy-800: #1f3647;
          --navy-700: #274458;
          --accent: oklch(0.66 0.13 245);
          --accent-bright: oklch(0.80 0.11 245);
          --done:  oklch(0.72 0.12 165);
          --doing: oklch(0.80 0.12 245);
          --wait:  oklch(0.80 0.13 80);
          --sent:  oklch(0.70 0.13 300);
          --none:  oklch(0.62 0.02 245);
          --ink:   #eaf1f7;
          --soft:  oklch(0.86 0.025 245);
          --muted: oklch(0.70 0.03 245);
          --faint: oklch(0.56 0.03 245);
          --line:  oklch(0.42 0.03 245 / 0.40);
          --line-soft: oklch(0.50 0.03 245 / 0.18);
          --rl-card-bg: oklch(0.30 0.035 245 / 0.34);
          --rl-r: 16px;
          --rl-r-sm: 12px;
          font-family: var(--font-manrope), Manrope, system-ui, sans-serif;
          color: var(--ink);
          position: relative;
        }
        .rl-bg-fx {
          position: fixed; inset: 0; z-index: -1;
          background:
            radial-gradient(120% 70% at 85% -8%, var(--navy-700) 0%, transparent 42%),
            radial-gradient(100% 60% at 0% 0%, var(--navy-800) 0%, transparent 38%),
            linear-gradient(180deg, var(--navy-900), var(--navy-950) 55%);
          pointer-events: none;
        }
        .rl-bg-fx::after {
          content: ""; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 4px 4px; opacity: .5; mix-blend-mode: overlay;
        }
        .rl-bg-fx::before {
          content: ""; position: absolute; left: 50%; top: -12%;
          width: 55vw; height: 55vw; transform: translateX(-50%);
          background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
          opacity: .09; filter: blur(40px);
          animation: rlBreathe 8s ease-in-out infinite;
        }
        @keyframes rlBreathe {
          0%,100% { opacity: .06; transform: translateX(-50%) scale(1); }
          50%     { opacity: .12; transform: translateX(-50%) scale(1.1); }
        }

        .rl-page {
          max-width: 1480px; margin: 0 auto;
          padding: 44px clamp(20px, 3.5vw, 48px) 64px;
          position: relative; z-index: 1;
        }

        .rl-crumb {
          font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
          margin: 0 0 22px;
          opacity: 0; animation: rlFadeUp .6s .05s forwards;
        }
        .rl-roadmap :global(.rl-crumb a) {
          color: inherit; text-decoration: none; transition: color .25s;
        }
        .rl-roadmap :global(.rl-crumb a:hover) { color: var(--soft); }
        @keyframes rlFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }

        .rl-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 26px; flex-wrap: wrap;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--line-soft);
        }
        .rl-eyebrow {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          text-transform: uppercase; letter-spacing: .26em;
          font-size: 10.5px; font-weight: 500;
          color: var(--muted);
          margin: 0 0 12px;
          opacity: 0; animation: rlFadeUp .6s .12s forwards;
        }
        .rl-title {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 5.5vw, 50px);
          letter-spacing: .16em; text-transform: uppercase;
          margin: 0; color: #fff;
          display: flex; flex-wrap: wrap;
          line-height: 1;
        }
        .rl-roadmap :global(.rl-title span) {
          display: inline-block;
          opacity: 0; transform: translateY(24px); filter: blur(10px);
          animation: rlFocusIn .6s forwards;
        }
        .rl-roadmap :global(.rl-title .sp) { width: .32em; }
        @keyframes rlFocusIn {
          to { opacity: 1; transform: none; filter: blur(0); }
        }

        .rl-stats {
          display: flex; align-items: stretch; gap: 12px;
          opacity: 0; animation: rlFadeUp .7s .4s forwards;
        }
        .rl-stat {
          display: flex; flex-direction: column; gap: 5px;
          padding: 12px 18px;
          border: 1px solid var(--line-soft);
          border-radius: 12px;
          background: oklch(0.30 0.035 245 / .3);
          min-width: 84px;
        }
        .rl-stat-k {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 9.5px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--faint);
        }
        .rl-stat-v {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 22px; font-weight: 600; color: #fff;
          line-height: 1;
        }
        .rl-stat-v small {
          font-size: 13px; color: var(--muted); font-weight: 500;
        }
        .rl-stat.is-pct .rl-stat-v { color: var(--done); }
        .rl-stat-bar {
          margin-top: 3px; height: 4px; border-radius: 4px;
          background: oklch(0.40 0.03 245 / .5);
          overflow: hidden; width: 74px; display: block;
        }
        .rl-stat-bar i {
          display: block; height: 100%; width: 0;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--done), var(--doing));
          transition: width 1.5s cubic-bezier(.3,.1,.2,1) .6s;
          animation: rlBarIn 1.5s cubic-bezier(.3,.1,.2,1) .6s forwards;
        }
        @keyframes rlBarIn { from { width: 0; } }

        .rl-btn-dashed {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
          font-weight: 600;
          padding: 8px 16px; border-radius: 999px;
          border: 1px dashed var(--line);
          color: var(--muted); background: transparent;
          cursor: pointer; transition: .2s;
        }
        .rl-btn-dashed:hover {
          border-color: var(--accent-bright);
          color: #fff;
          background: oklch(0.66 0.13 245 / 0.08);
        }

        .rl-card {
          background: var(--rl-card-bg);
          border: 1px solid var(--line-soft);
          border-radius: var(--rl-r);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .rl-explain {
          margin-top: 26px;
          padding: 26px 30px;
          opacity: 0; animation: rlFadeUp .7s .3s forwards;
        }
        .rl-explain-h {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--accent-bright);
          margin: 0 0 12px;
        }
        .rl-explain-lead {
          font-size: 14.5px; line-height: 1.6;
          color: var(--soft);
          margin: 0 0 22px; max-width: 88ch;
        }
        .rl-explain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px 34px;
        }
        .rl-feat { display: flex; gap: 13px; }
        .rl-feat-n {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          color: var(--faint);
          padding-top: 2px; flex: none;
        }
        .rl-feat-t {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: .02em;
          color: var(--ink);
          margin: 0 0 5px;
        }
        .rl-feat-d {
          font-size: 12.5px; line-height: 1.5;
          color: var(--muted);
          margin: 0;
        }

        .rl-legend {
          display: flex; flex-wrap: wrap; gap: 9px;
          margin: 32px 0 18px;
        }
        .rl-chip {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; letter-spacing: .04em;
          padding: 6px 13px; border-radius: 999px;
          border: 1px solid var(--line-soft);
          background: oklch(0.30 0.04 245 / .3);
          color: var(--soft);
        }
        .rl-chip i {
          width: 8px; height: 8px; border-radius: 50%;
          background: currentColor;
        }
        .rl-chip--concluido    { color: var(--done); }
        .rl-chip--em_andamento { color: var(--doing); }
        .rl-chip--nao_iniciada { color: var(--none); }
        .rl-chip--aguardar     { color: var(--wait); }
        .rl-chip--enviado      { color: var(--sent); }

        .rl-empty {
          border: 1px dashed var(--line);
          padding: 60px 24px; text-align: center;
          border-radius: var(--rl-r);
          background: var(--rl-card-bg);
        }
        .rl-empty-lbl {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 10.5px; letter-spacing: .36em; text-transform: uppercase;
          color: var(--faint); font-weight: 600; margin: 0 0 8px;
        }
        .rl-empty-hint {
          font-size: 15px; color: var(--muted); margin: 0;
        }

        .rl-board {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(248px, 1fr);
          gap: 16px;
          overflow-x: auto;
          padding: 6px 2px 18px;
          scrollbar-width: thin;
          scrollbar-color: var(--line) transparent;
        }
        .rl-board::-webkit-scrollbar { height: 9px; }
        .rl-board::-webkit-scrollbar-thumb {
          background: var(--line); border-radius: 9px;
        }
        .rl-col {
          display: flex; flex-direction: column;
          border: 1px solid var(--line-soft);
          border-radius: var(--rl-r);
          background: oklch(0.22 0.03 245 / .42);
          overflow: hidden;
          opacity: 0; transform: translateY(16px);
          animation: rlColIn .6s cubic-bezier(.2,.7,.2,1) forwards;
        }
        @keyframes rlColIn { to { opacity: 1; transform: none; } }

        .rl-col-head {
          display: flex; align-items: center; gap: 9px;
          padding: 15px 16px 13px;
        }
        .rl-col-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--cc, var(--accent));
          box-shadow: 0 0 10px var(--cc, var(--accent));
          flex: none;
        }
        .rl-col-name {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: .16em; text-transform: uppercase;
          color: var(--soft);
          flex: 1; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rl-col-count {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 600;
          color: var(--faint);
          background: oklch(0.34 0.03 245 / .5);
          border-radius: 999px;
          min-width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 6px; flex: none;
        }
        .rl-col-rail {
          height: 3px; border-radius: 3px;
          background: var(--cc, var(--accent));
          margin: 0 12px 12px;
          width: 0;
          animation: rlRailIn 1s ease .5s forwards;
          box-shadow: 0 0 10px var(--cc, var(--accent));
        }
        @keyframes rlRailIn { to { width: calc(100% - 24px); } }

        .rl-col-body {
          display: flex; flex-direction: column; gap: 11px;
          padding: 4px 12px 14px;
          flex: 1;
        }
        .rl-col-body--edit { padding-top: 12px; }

        .rl-col-empty {
          padding: 28px 0; text-align: center;
        }
        .rl-col-empty p {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 10.5px; letter-spacing: .26em; text-transform: uppercase;
          color: var(--faint); font-weight: 600; margin: 0;
        }

        .rl-task {
          position: relative;
          padding: 14px 15px;
          border-radius: var(--rl-r-sm);
          border: 1px solid var(--line-soft);
          background:
            linear-gradient(180deg, oklch(0.30 0.04 245 / .5), oklch(0.22 0.03 245 / .5));
          overflow: hidden;
          opacity: 0; transform: translateY(10px);
          animation: rlTaskIn .5s ease forwards;
        }
        @keyframes rlTaskIn { to { opacity: 1; transform: none; } }
        .rl-task::before {
          content: ""; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--sc, var(--none));
          opacity: .85;
        }
        .rl-task-name {
          font-size: 13.5px; font-weight: 600; letter-spacing: .01em;
          color: var(--ink);
          margin: 0 0 10px; line-height: 1.35;
        }
        .rl-task-foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
        }
        .rl-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
          padding: 5px 10px; border-radius: 999px;
          white-space: nowrap;
        }
        .rl-badge i {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
        }
        .rl-badge--concluido {
          color: var(--done);
          background: color-mix(in oklch, var(--done) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--done) 34%, transparent);
        }
        .rl-badge--em_andamento {
          color: var(--doing);
          background: color-mix(in oklch, var(--doing) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--doing) 34%, transparent);
        }
        .rl-badge--em_andamento i { animation: rlBpulse 1.8s infinite; }
        @keyframes rlBpulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
        .rl-badge--nao_iniciada {
          color: var(--none);
          background: color-mix(in oklch, var(--none) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--none) 34%, transparent);
        }
        .rl-badge--aguardar {
          color: var(--wait);
          background: color-mix(in oklch, var(--wait) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--wait) 34%, transparent);
        }
        .rl-badge--enviado {
          color: var(--sent);
          background: color-mix(in oklch, var(--sent) 14%, transparent);
          border: 1px solid color-mix(in oklch, var(--sent) 34%, transparent);
        }
        .rl-task-date {
          font-size: 10.5px; letter-spacing: .06em;
          color: var(--faint);
          display: inline-flex; align-items: center; gap: 5px;
          white-space: nowrap;
        }
        .rl-task-date :global(svg) {
          width: 11px; height: 11px; opacity: .8;
        }

        .rl-btn-dashed-block {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 11px; letter-spacing: .26em; text-transform: uppercase;
          font-weight: 600;
          padding: 12px; border-radius: var(--rl-r-sm);
          border: 1px dashed var(--line);
          color: var(--muted); background: transparent;
          cursor: pointer; transition: .2s;
          width: 100%;
        }
        .rl-btn-dashed-block:hover {
          border-color: var(--accent-bright);
          color: #fff;
          background: oklch(0.66 0.13 245 / 0.06);
        }

        .rl-foot {
          margin-top: 42px; text-align: center;
        }
        .rl-foot-tag {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: clamp(15px, 3vw, 19px);
          letter-spacing: .06em;
          color: var(--muted); font-weight: 400;
          margin: 0;
        }
        .rl-foot-tag b { color: #fff; font-weight: 600; }
        .rl-foot-sub {
          margin-top: 9px;
          font-size: 10px; letter-spacing: .24em; text-transform: uppercase;
          color: var(--faint); font-weight: 600;
        }

        @media (max-width: 760px) {
          .rl-head { align-items: flex-start; }
          .rl-stats { flex-wrap: wrap; }
          .rl-board {
            grid-auto-flow: row;
            grid-auto-columns: auto;
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rl-roadmap,
          .rl-roadmap :global(*) {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>
    </div>
  )
}

/* ============================================================
   EstadoQuickChanger — pill clicável (admin) que abre popover
   com os 5 estados. Click muda imediatamente + dispara
   notificação via onChange callback.
   ============================================================ */
function EstadoQuickChanger({
  cfg, current, onChange,
}: {
  cfg: { pill: string; dot: string; text: string; label: string }
  current: TarefaEstado
  onChange: (e: TarefaEstado) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Clica para alterar o estado"
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] cursor-pointer transition-all ${cfg.pill} ${cfg.text}`}
        style={{ border: '1px solid transparent' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-60 ml-0.5">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[180px] rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #16293a, #122230 60%, #0e1b27)',
            border: '1px solid oklch(0.50 0.03 245 / 0.30)',
            boxShadow: '0 14px 30px -10px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3)',
            fontFamily: 'Manrope, system-ui, sans-serif',
          }}
        >
          {ESTADO_OPTIONS.map(opt => {
            const optCfg = estadoCfg(opt.value)
            const isActive = opt.value === current
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-[12px] transition-all"
                style={{
                  background: isActive ? 'oklch(0.66 0.13 245 / 0.16)' : 'transparent',
                  borderBottom: '1px solid oklch(0.50 0.03 245 / 0.10)',
                  color: '#fff',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'oklch(0.40 0.04 245 / 0.40)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${optCfg.dot}`} />
                <span className="flex-1">{opt.label}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'oklch(0.80 0.11 245)' }}>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* Helper para ir buscar a config visual de um estado (cores) */
function estadoCfg(estado: TarefaEstado): { pill: string; dot: string; text: string; label: string } {
  switch (estado) {
    case 'concluido':    return { pill: 'bg-emerald-500/10',  dot: 'bg-emerald-400',  text: 'text-emerald-400',  label: 'Concluído' }
    case 'em_andamento': return { pill: 'bg-blue-500/10',     dot: 'bg-blue-400',     text: 'text-blue-400',     label: 'Em andamento' }
    case 'aguardar':     return { pill: 'bg-yellow-500/10',   dot: 'bg-yellow-400',   text: 'text-yellow-400',   label: 'Aguardar' }
    case 'enviado':      return { pill: 'bg-purple-500/10',   dot: 'bg-purple-400',   text: 'text-purple-400',   label: 'Enviado' }
    case 'nao_iniciada':
    default:             return { pill: 'bg-white/[0.03]',    dot: 'bg-white/30',     text: 'text-white/40',     label: 'Não iniciada' }
  }
}

