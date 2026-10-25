'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { Projeto, RoadmapColuna, RoadmapTarefa, TarefaEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

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
  { value: 'aguardar',     label: 'A aguardar'   },
  { value: 'enviado',      label: 'Enviado'      },
]

/* Identidade rlprod.pt: concluído = azul cheio, em curso = azul claro a pulsar,
   pendente = cinza. Aguardar/Enviado em azul pálido (contorno tracejado / cheio suave). */
type EstadoCfg = { pill: string; dot: string; strip: string; label: string; hint: string }

const ESTADO_CFG: Record<TarefaEstado, EstadoCfg> = {
  concluido:    { pill: 'bg-[#2e6cf6] border-[#2e6cf6] text-white',                        dot: 'bg-white',                         strip: '#2e6cf6',               label: 'Concluído',    hint: 'Tarefa terminada' },
  em_andamento: { pill: 'bg-[#5a8bff]/[0.1] border-[#5a8bff]/60 text-[#5a8bff]',          dot: 'bg-[#5a8bff] animate-pulse',       strip: '#5a8bff',               label: 'Em andamento', hint: 'Estamos a trabalhar nisto' },
  nao_iniciada: { pill: 'bg-transparent border-white/[0.14] text-[#7c8893]',               dot: 'bg-[#7c8893]',                     strip: 'rgba(124,136,147,0.5)', label: 'Não iniciada', hint: 'Ainda por começar' },
  aguardar:     { pill: 'bg-transparent border-dashed border-[#a9c1ff]/55 text-[#a9c1ff]', dot: 'border border-[#a9c1ff] bg-transparent', strip: '#a9c1ff',      label: 'A aguardar',   hint: 'À espera de resposta ou material' },
  enviado:      { pill: 'bg-[#a9c1ff]/[0.12] border-[#a9c1ff]/40 text-[#a9c1ff]',          dot: 'bg-[#a9c1ff]',                     strip: '#a9c1ff',               label: 'Enviado',      hint: 'Enviado para ti' },
}

/* Cores das fases (valor guardado na coluna mantém-se; só a tradução visual muda) */
const CORES: { value: string; hex: string }[] = [
  { value: 'blue',    hex: '#2e6cf6' },
  { value: 'cyan',    hex: '#5a8bff' },
  { value: 'emerald', hex: '#a9c1ff' },
  { value: 'yellow',  hex: '#ffffff' },
  { value: 'amber',   hex: 'rgba(255,255,255,0.6)' },
  { value: 'orange',  hex: '#7c8893' },
  { value: 'red',     hex: 'rgba(46,108,246,0.55)' },
  { value: 'purple',  hex: 'rgba(90,139,255,0.55)' },
  { value: 'violet',  hex: 'rgba(169,193,255,0.55)' },
  { value: 'white',   hex: 'rgba(255,255,255,0.35)' },
]

const corHex: Record<string, string> = Object.fromEntries(CORES.map(c => [c.value, c.hex]))

const DEFAULT_ROADMAP_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80'

const fmtDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* Hoje em AAAA-MM-DD (local), para assinalar tarefas com a data ultrapassada */
const hojeISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SetaIcon = ({ dir }: { dir: 'up' | 'down' }) => (
  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'up' ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} />
  </svg>
)

const SETA_CLS = 'w-6 h-6 flex items-center justify-center rounded-md border border-white/[0.1] hover:border-[#2e6cf6] bg-[#00141f]/60 text-white/40 hover:text-white transition-colors'

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


  /* Data de hoje só no cliente (evita diferenças entre servidor e browser) */
  const [hoje, setHoje] = useState('')
  useEffect(() => { setHoje(hojeISO()) }, [])

  /* Fase atual = primeira coluna com tarefas que ainda não está toda concluída */
  const faseAtualIdx = colunas.findIndex(c => c.tarefas.length > 0 && c.tarefas.some(t => t.estado !== 'concluido'))
  const faseAtual = faseAtualIdx >= 0 ? colunas[faseAtualIdx] : null
  const emAtraso = hoje
    ? colunas.reduce((s, c) => s + c.tarefas.filter(t => t.data && t.data < hoje && t.estado !== 'concluido' && t.estado !== 'enviado').length, 0)
    : 0

  /* ────────────────────────────────────────────────────────── */
  /*  RENDER                                                    */
  /* ────────────────────────────────────────────────────────── */
  return (
    <div className="rlp relative text-white">

      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-8 lg:px-10 pt-6 pb-24">

        {/* ── Voltar ── */}
        <Link href={`/portal-media/${initial.ref}`}
          className="inline-flex items-center gap-2 text-[12px] text-white/50 hover:text-white transition-colors">
          <span aria-hidden>‹</span> Portal · {initial.nome}
        </Link>

        {/* ── Cabeçalho ── */}
        <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · {initial.nome}</p>
            <h1 className="rlp-t mt-3 text-[44px] sm:text-[60px] leading-[0.95]">
              Road <span className="text-[#5a8bff]">map</span>
            </h1>
            <p className="mt-3 text-[14px] text-white/55 max-w-[52ch]">
              {faseAtual
                ? <>Neste momento estamos na fase <span className="text-white">{faseAtual.titulo}</span>.</>
                : totalTarefas > 0
                  ? 'Todas as fases estão concluídas.'
                  : 'As fases do projeto vão aparecer aqui.'}
            </p>
          </div>
          {isAdmin && isEditing && (
            <button onClick={addColuna}
              className="rounded-full border border-dashed border-white/25 hover:border-[#2e6cf6] px-5 py-2.5 text-[13px] text-white/70 hover:text-white transition-colors">
              + Coluna
            </button>
          )}
        </header>

        {/* ── Resumo ── */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-4 sm:p-5">
            <p className="rlp-m text-[10px] text-white/45">Fases</p>
            <p className="rlp-t mt-2 text-[34px] sm:text-[40px] leading-none">{colunas.length}</p>
            <p className="mt-2 text-[12px] text-white/45">
              {faseAtual ? `Atual: ${faseAtual.titulo}` : 'sem fase em curso'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-4 sm:p-5">
            <p className="rlp-m text-[10px] text-white/45">Tarefas</p>
            <p className="rlp-t mt-2 text-[34px] sm:text-[40px] leading-none">
              {totalConcluidas}<span className="text-white/35 text-[22px]">/{totalTarefas}</span>
            </p>
            <p className="mt-2 text-[12px] text-white/45">concluídas</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="rlp-m text-[10px] text-white/45">Progresso</p>
              {/* Atrasos: só o admin vê (ao cliente não se mostra) */}
              {isAdmin && emAtraso > 0 && (
                <span className="text-[12px] text-[#ff4747]">{emAtraso} {emAtraso === 1 ? 'tarefa' : 'tarefas'} com data ultrapassada</span>
              )}
            </div>
            <p className="rlp-t mt-2 text-[34px] sm:text-[40px] leading-none text-[#5a8bff]">
              {progresso}<span className="text-[22px] text-white/40">%</span>
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-[#2e6cf6] transition-[width] duration-700" style={{ width: `${progresso}%` }} />
            </div>
            {colunas.length > 0 && (
              <div className="mt-2 flex gap-1">
                {colunas.map((c, i) => {
                  const feito = c.tarefas.length > 0 && c.tarefas.every(t => t.estado === 'concluido')
                  return (
                    <span key={c.id} title={c.titulo}
                      className={`h-1 flex-1 rounded-full ${feito ? 'bg-[#2e6cf6]' : i === faseAtualIdx ? 'bg-[#5a8bff]/60 animate-pulse' : 'bg-white/[0.08]'}`} />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Explicação ── */}
        <section className="mt-6 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5 sm:p-7">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">O que é o Road Map?</p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-white/75 max-w-[88ch]">
            O Road Map é o quadro visual que mostra, em tempo real, o estado de cada fase do seu projeto. Está organizado em colunas que representam as grandes etapas do processo, desde o briefing inicial até à entrega final.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: '01', t: 'Visão geral do projeto',   d: 'Num único ecrã tens o panorama completo: o que já foi concluído, o que está em curso e o que ainda está por fazer.' },
              { n: '02', t: 'Fases e tarefas',          d: 'Cada coluna é uma fase do projeto. Dentro de cada fase existem tarefas específicas, cada uma com o seu estado e data prevista.' },
              { n: '03', t: 'Estados em tempo real',    d: 'As tarefas atualizam o estado à medida que o trabalho avança: Concluído, Em andamento, A aguardar, Enviado ou Não iniciada.' },
              { n: '04', t: 'Transparência total',      d: 'O objetivo é garantir que estás sempre informado sobre o progresso. Tens acesso ao mesmo quadro que a nossa equipa.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="rounded-xl bg-[#0c2236]/70 border border-white/[0.06] p-4">
                <span className="rlp-t text-[22px] leading-none text-[#5a8bff]">{n}</span>
                <p className="rlp-t mt-2 text-[16px] leading-tight">{t}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Legenda de estados ── */}
        <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Quadro</p>
          <div className="flex flex-wrap gap-2">
            {ESTADO_OPTIONS.map(opt => {
              const c = ESTADO_CFG[opt.value]
              return (
                <span key={opt.value} title={c.hint}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] ${c.pill}`}>
                  <i className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{opt.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* ── Board ── */}
        {colunas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-2xl border border-dashed border-white/[0.15] bg-[#00141f]/60 text-center px-6">
            <p className="rlp-m text-[11px] text-white/45">Road map vazio</p>
            <p className="text-[14px] text-white/55">
              {isAdmin
                ? <>Clica em &ldquo;Editar&rdquo; e depois em &ldquo;+ Coluna&rdquo; para começar.</>
                : 'As fases do projeto vão aparecer aqui em breve.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-flow-col md:auto-cols-[minmax(268px,1fr)] md:overflow-x-auto md:pb-3">
            {colunas.map((coluna, ci) => {
              const concluidas = coluna.tarefas.filter(t => t.estado === 'concluido').length
              const total = coluna.tarefas.length
              const pctCol = total > 0 ? Math.round((concluidas / total) * 100) : 0
              const feita = total > 0 && concluidas === total
              const atual = ci === faseAtualIdx
              const cc = corHex[coluna.cor] ?? '#2e6cf6'

              return (
                <div key={coluna.id}
                  className={`flex flex-col rounded-2xl border bg-[#00141f]/70 overflow-hidden ${
                    atual && !isEditing ? 'border-[#5a8bff]/55' : 'border-white/[0.1]'}`}>

                  {/* ── Cabeçalho da coluna ── */}
                  {isEditing ? (
                    <div className="border-b border-white/[0.08] bg-[#0c2236]/70 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {CORES.map(co => (
                          <button key={co.value} onClick={() => updateColuna(coluna.id, 'cor', co.value)} title={co.value}
                            className={`w-4 h-4 rounded-full shrink-0 transition-all ${
                              coluna.cor === co.value ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-[#0c2236] scale-110' : 'opacity-40 hover:opacity-90'}`}
                            style={{ background: co.hex }}
                          />
                        ))}
                        <button onClick={() => removeColuna(coluna.id)} title="Remover coluna"
                          className="ml-auto text-[14px] text-[#ff4747]/60 hover:text-[#ff4747] transition-colors">✕</button>
                      </div>
                      <input
                        value={coluna.titulo}
                        onChange={e => updateColuna(coluna.id, 'titulo', e.target.value)}
                        className="rlp-t w-full bg-transparent text-[18px] text-white focus:outline-none border-b border-white/15 focus:border-[#2e6cf6] pb-1"
                        placeholder="Nome da fase"
                      />
                    </div>
                  ) : (
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rlp-m text-[10px] text-white/35 tracking-[0.15em]">{String(ci + 1).padStart(2, '0')}</span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cc }} />
                        <h3 className="rlp-t flex-1 min-w-0 truncate text-[18px] leading-tight">{coluna.titulo}</h3>
                        <span className="shrink-0 text-[12px] text-white/50">{concluidas}/{total}</span>
                      </div>
                      <div className="mt-3 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                        <div className="h-full rounded-full bg-[#2e6cf6]" style={{ width: `${pctCol}%` }} />
                      </div>
                      <p className={`rlp-m mt-2 text-[9px] tracking-[0.22em] ${
                        feita ? 'text-[#a9c1ff]' : atual ? 'text-[#5a8bff]' : 'text-[#7c8893]'}`}>
                        {feita ? 'Fase concluída' : atual ? 'Fase atual' : total === 0 ? 'Sem tarefas' : 'Por iniciar'}
                      </p>
                    </div>
                  )}

                  {/* ── Lane ── */}
                  <div className={`flex flex-col gap-2.5 flex-1 px-3 pb-3 ${isEditing ? 'pt-3' : 'pt-1'}`}>

                    {coluna.tarefas.map(tarefa => {
                      const cfg = ESTADO_CFG[tarefa.estado]
                      const atrasada = !!hoje && !!tarefa.data && tarefa.data < hoje && tarefa.estado !== 'concluido' && tarefa.estado !== 'enviado'
                      return (
                        <div key={tarefa.id}
                          className={`group/card relative overflow-hidden rounded-xl border bg-[#0c2236]/70 p-3.5 pl-4 ${
                            atrasada ? 'border-[#ff4747]/40' : 'border-white/[0.06]'}`}>
                          <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: atrasada ? '#ff4747' : cfg.strip }} />

                          {isEditing ? (
                            /* ── Modo edição ── */
                            <div className="flex gap-2">
                              <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                <button onClick={() => moveTarefa(coluna.id, tarefa.id, 'up')} className={SETA_CLS} title="Mover para cima">
                                  <SetaIcon dir="up" />
                                </button>
                                <button onClick={() => moveTarefa(coluna.id, tarefa.id, 'down')} className={SETA_CLS} title="Mover para baixo">
                                  <SetaIcon dir="down" />
                                </button>
                              </div>
                              <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <input
                                  value={tarefa.titulo}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'titulo', e.target.value)}
                                  className="w-full bg-transparent text-[14px] text-white focus:outline-none border-b border-white/[0.12] focus:border-[#2e6cf6] pb-1 placeholder:text-white/25"
                                  placeholder="Título da tarefa"
                                />
                                <select
                                  value={tarefa.estado}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'estado', e.target.value)}
                                  className="bg-[#00141f] border border-white/[0.12] rounded-lg text-[13.5px] text-white/80 px-2 py-1.5 focus:outline-none focus:border-[#2e6cf6] w-full"
                                >
                                  {ESTADO_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="date"
                                  value={tarefa.data ?? ''}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'data', e.target.value)}
                                  className="bg-[#00141f] border border-white/[0.12] rounded-lg text-[13.5px] text-white/70 px-2 py-1.5 focus:outline-none focus:border-[#2e6cf6] w-full [color-scheme:dark]"
                                />
                                <button onClick={() => removeTarefa(coluna.id, tarefa.id)}
                                  className="rlp-m text-[9.5px] text-[#ff4747]/60 hover:text-[#ff4747] transition-colors self-end">
                                  Remover
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── Modo visualização ── */
                            <div className="flex gap-2 items-start">
                              {isAdmin && (
                                <div className="flex flex-col gap-1 shrink-0 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-150">
                                  <button onClick={() => moveTarefa(coluna.id, tarefa.id, 'up')} className={SETA_CLS} title="Mover para cima">
                                    <SetaIcon dir="up" />
                                  </button>
                                  <button onClick={() => moveTarefa(coluna.id, tarefa.id, 'down')} className={SETA_CLS} title="Mover para baixo">
                                    <SetaIcon dir="down" />
                                  </button>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[14px] leading-snug ${tarefa.estado === 'nao_iniciada' ? 'text-white/65' : 'text-white'}`}>
                                  {tarefa.titulo}
                                </p>
                                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                  {isAdmin ? (
                                    <EstadoQuickChanger
                                      cfg={cfg}
                                      current={tarefa.estado}
                                      onChange={(novoEstado) => quickChangeEstado(coluna.id, tarefa.id, novoEstado)}
                                    />
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] ${cfg.pill}`}>
                                      <i className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                                    </span>
                                  )}
                                  {tarefa.data ? (
                                    <span className={`inline-flex items-center gap-1.5 text-[11.5px] whitespace-nowrap ${atrasada && isAdmin ? 'text-[#ff4747]' : 'text-white/50'}`}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="5" width="16" height="16" rx="2.5"/>
                                        <path d="M4 9h16M8 3v4M16 3v4"/>
                                      </svg>
                                      {fmtDate(tarefa.data)}{atrasada && isAdmin && ' · em atraso'}
                                    </span>
                                  ) : (
                                    <span className="text-[11.5px] text-white/30">Sem data</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {isEditing && (
                      <button onClick={() => addTarefa(coluna.id)}
                        className="w-full rounded-xl border border-dashed border-white/20 hover:border-[#2e6cf6] py-3 text-[13px] text-white/60 hover:text-white transition-colors">
                        + Tarefa
                      </button>
                    )}

                    {coluna.tarefas.length === 0 && !isEditing && (
                      <div className="rounded-xl border border-dashed border-white/[0.1] py-6 text-center">
                        <p className="rlp-m text-[9.5px] text-white/35">Sem tarefas</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Rodapé ── */}
        <footer className="mt-12 text-center">
          <p className="rlp-t text-[20px] sm:text-[24px] text-white/60">
            More than a product, <span className="text-white">an experience<span className="text-[#5a8bff]">.</span></span>
          </p>
          <p className="rlp-m mt-2 text-[9.5px] text-white/35">RL Prod · Photography &amp; Video</p>
        </footer>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
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
  cfg: EstadoCfg
  current: TarefaEstado
  onChange: (e: TarefaEstado) => void
}) {
  const [open, setOpen] = useState(false)
  // O menu abre por cima da página (portal), senão o cartão da tarefa (overflow-hidden) corta-o
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const abrir = () => {
    if (open) { setOpen(false); return }
    const r = wrapperRef.current?.getBoundingClientRect()
    if (!r) return
    const alturaMenu = ESTADO_OPTIONS.length * 42 + 8
    const left = Math.min(r.left, window.innerWidth - 200)
    // Sem espaço por baixo: abre para cima
    setPos(window.innerHeight - r.bottom < alturaMenu + 12 ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!wrapperRef.current?.contains(alvo) && !menuRef.current?.contains(alvo)) setOpen(false)
    }
    const fechar = () => setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', fechar, true)
    window.addEventListener('resize', fechar)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('scroll', fechar, true)
      window.removeEventListener('resize', fechar)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={abrir}
        title="Clica para alterar o estado"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] cursor-pointer transition-colors hover:border-white/40 ${cfg.pill}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-60 ml-0.5">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && pos && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom }}
          className="rlp z-[95] min-w-[190px] rounded-xl overflow-hidden border border-white/[0.12] bg-[#00141f] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.6)]">
          {ESTADO_OPTIONS.map(opt => {
            const optCfg = ESTADO_CFG[opt.value]
            const isActive = opt.value === current
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-[12.5px] text-white border-b border-white/[0.06] last:border-b-0 transition-colors ${
                  isActive ? 'bg-[#2e6cf6]/20' : 'hover:bg-[#0c2236]'}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${optCfg.dot}`} />
                <span className="flex-1">{opt.label}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a8bff"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
