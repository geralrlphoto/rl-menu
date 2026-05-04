'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Projeto, RoadmapColuna, RoadmapTarefa, TarefaEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

/* ────────────────────────────────────────────────────────── */
/*  DEFAULT — 7 colunas padrão para qualquer projeto          */
/* ────────────────────────────────────────────────────────── */

const DEFAULT_ROADMAP: RoadmapColuna[] = [
  { id: 'briefing',      titulo: 'Briefing',       cor: 'blue',    tarefas: [] },
  { id: 'proposta',      titulo: 'Proposta',        cor: 'cyan',    tarefas: [] },
  { id: 'planeamento',   titulo: 'Planeamento',     cor: 'yellow',  tarefas: [] },
  { id: 'pre-producao',  titulo: 'Pré-Produção',    cor: 'purple',  tarefas: [] },
  { id: 'producao',      titulo: 'Produção',        cor: 'orange',  tarefas: [] },
  { id: 'pos-producao',  titulo: 'Pós-Produção',    cor: 'violet',  tarefas: [] },
  { id: 'entrega',       titulo: 'Entrega',         cor: 'emerald', tarefas: [] },
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

/* ────────────────────────────────────────────────────────── */
/*  COMPONENT                                                 */
/* ────────────────────────────────────────────────────────── */

interface Props { projeto: Projeto; isAdmin: boolean }

export default function RoadmapClient({ projeto: initial, isAdmin }: Props) {
  const [colunas, setColunas] = useState<RoadmapColuna[]>(
    (initial.roadmap && initial.roadmap.length > 0) ? initial.roadmap : DEFAULT_ROADMAP
  )
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [heroUrl, setHeroUrl]     = useState(initial.roadmapImageUrl ?? '')

  /* Auto-inicializar: guarda as 7 colunas default no Supabase
     na primeira vez que o portal não tem roadmap ainda */
  useEffect(() => {
    if (!initial.roadmap || initial.roadmap.length === 0) {
      fetch(`/api/media-portal/${initial.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap: DEFAULT_ROADMAP }),
      }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* totais para o header */
  const totalTarefas   = colunas.reduce((s, c) => s + c.tarefas.length, 0)
  const totalConcluidas = colunas.reduce((s, c) => s + c.tarefas.filter(t => t.estado === 'concluido').length, 0)
  const progresso      = totalTarefas > 0 ? Math.round((totalConcluidas / totalTarefas) * 100) : 0

  /* ── persistência ── */
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${initial.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmap: colunas, roadmapImageUrl: heroUrl }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setColunas((initial.roadmap && initial.roadmap.length > 0) ? initial.roadmap : DEFAULT_ROADMAP)
    setHeroUrl(initial.roadmapImageUrl ?? '')
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

  /* ────────────────────────────────────────────────────────── */
  /*  RENDER                                                    */
  /* ────────────────────────────────────────────────────────── */
  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="relative z-10 px-6 sm:px-10 py-10">

        {/* ── Back link ── */}
        <Link href={`/portal-media/${initial.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {initial.nome}
        </Link>

        {/* ── Board header ── */}
        <div className="border border-white/[0.07] bg-white/[0.015] px-6 py-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-1">RL Media · {initial.nome}</p>
            <h1 className="text-2xl font-extralight tracking-[0.35em] text-white/80 uppercase">Road Map</h1>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
              <span className="text-sm text-white/25 tracking-[0.2em] uppercase">Fases</span>
              <span className="text-sm font-mono text-white/55">{colunas.length}</span>
            </div>
            <div className="flex items-center gap-2 border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
              <span className="text-sm text-white/25 tracking-[0.2em] uppercase">Tarefas</span>
              <span className="text-sm font-mono text-white/55">{totalConcluidas}/{totalTarefas}</span>
            </div>
            <div className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-mono text-emerald-400/80">{progresso}%</span>
            </div>
            {isAdmin && isEditing && (
              <button onClick={addColuna}
                className="border border-dashed border-white/20 hover:border-white/40 px-4 py-1.5 text-sm tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors">
                + Coluna
              </button>
            )}
          </div>
        </div>

        {/* ── Barra de progresso global ── */}
        <div className="h-px w-full bg-white/[0.05] relative mb-8">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400/60 to-emerald-400/20 transition-all duration-700"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* ── Legenda de estados ── */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {ESTADO_OPTIONS.map(opt => {
            const cfg = ESTADO_CFG[opt.value]
            return (
              <span key={opt.value}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${cfg.pill} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot.replace(' animate-pulse', '')}`} />
                {cfg.label}
              </span>
            )
          })}
        </div>

        {/* ── Board ── */}
        {colunas.length === 0 ? (
          <div className="border border-dashed border-white/[0.07] px-6 py-20 text-center">
            <p className="text-sm tracking-[0.4em] text-white/20 uppercase mb-2">Road map vazio</p>
            {isAdmin && <p className="text-sm text-white/15">Clica em "Editar" e depois em "+ Coluna" para começar</p>}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 sm:-mx-10 sm:px-10 pb-8">
            <div className="flex gap-5 pb-2" style={{ minWidth: 'max-content' }}>

              {colunas.map(coluna => {
                const dot      = corDot[coluna.cor] ?? 'bg-white/30'
                const lane     = corLane[coluna.cor] ?? 'bg-white/[0.02] border-white/[0.06]'
                const concluidas = coluna.tarefas.filter(t => t.estado === 'concluido').length

                return (
                  <div key={coluna.id} className="w-[285px] flex-shrink-0 flex flex-col">

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
                            className="ml-auto text-sm text-red-400/40 hover:text-red-400/70 transition-colors">✕</button>
                        </div>
                        <input
                          value={coluna.titulo}
                          onChange={e => updateColuna(coluna.id, 'titulo', e.target.value)}
                          className="w-full bg-transparent text-sm tracking-[0.3em] text-white/70 uppercase font-medium focus:outline-none border-b border-white/10 focus:border-white/30 pb-0.5"
                          placeholder="Nome da fase"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 mb-3 px-0.5">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                        <span className="text-sm tracking-[0.3em] text-white/60 uppercase font-medium flex-1 truncate">{coluna.titulo}</span>
                        <span className={`text-sm font-mono rounded-full px-2.5 py-0.5 shrink-0
                          ${concluidas === coluna.tarefas.length && coluna.tarefas.length > 0
                            ? 'bg-emerald-400/15 text-emerald-400/80'
                            : 'bg-white/[0.06] text-white/35'}`}>
                          {coluna.tarefas.length}
                        </span>
                      </div>
                    )}

                    {/* ── Lane ── */}
                    <div className={`border rounded-none p-2.5 flex flex-col gap-2 flex-1 min-h-[80px] ${lane}`}>

                      {/* ── Cards de tarefa ── */}
                      {coluna.tarefas.map(tarefa => {
                        const cfg = ESTADO_CFG[tarefa.estado]
                        return (
                          <div key={tarefa.id}
                            className="bg-[#060b15] border border-white/[0.07] hover:border-white/[0.14] transition-all duration-200 px-4 py-4">

                            {isEditing ? (
                              /* ── Modo edição ── */
                              <div className="flex flex-col gap-2.5">
                                <input
                                  value={tarefa.titulo}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'titulo', e.target.value)}
                                  className="w-full bg-transparent text-sm text-white/70 focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5 placeholder:text-white/15"
                                  placeholder="Título da tarefa"
                                />
                                <select
                                  value={tarefa.estado}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'estado', e.target.value)}
                                  className="bg-[#04080f] border border-white/[0.08] text-sm text-white/50 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full rounded-none"
                                >
                                  {ESTADO_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                <input
                                  type="date"
                                  value={tarefa.data ?? ''}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'data', e.target.value)}
                                  className="bg-[#04080f] border border-white/[0.08] text-sm text-white/40 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full"
                                />
                                <button onClick={() => removeTarefa(coluna.id, tarefa.id)}
                                  className="text-sm tracking-[0.25em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors self-end">
                                  Remover
                                </button>
                              </div>
                            ) : (
                              /* ── Modo visualização ── */
                              <>
                                <p className="text-sm text-white/72 font-medium leading-snug mb-3">{tarefa.titulo}</p>

                                {/* Status pill arredondado */}
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm ${cfg.pill} ${cfg.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                  {cfg.label}
                                </span>

                                {/* Data */}
                                {tarefa.data && (
                                  <p className="flex items-center gap-1.5 text-sm text-white/22 mt-2.5">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-50">
                                      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                                      <path d="M5 1.5V4M11 1.5V4M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    {fmtDate(tarefa.data)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}

                      {/* Botão adicionar tarefa */}
                      {isEditing && (
                        <button onClick={() => addTarefa(coluna.id)}
                          className="border border-dashed border-white/[0.08] hover:border-white/20 py-3 text-sm tracking-[0.35em] text-white/20 hover:text-white/45 uppercase transition-colors w-full">
                          + Tarefa
                        </button>
                      )}

                      {/* Estado vazio (não edição) */}
                      {coluna.tarefas.length === 0 && !isEditing && (
                        <div className="py-6 text-center">
                          <p className="text-sm text-white/12 tracking-[0.3em] uppercase">Sem tarefas</p>
                        </div>
                      )}
                    </div>

                    {/* Barra de progresso da coluna */}
                    {!isEditing && coluna.tarefas.length > 0 && (
                      <div className="h-[2px] bg-white/[0.04] mt-1 relative overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full transition-all duration-500 ${dot}`}
                          style={{ width: `${Math.round((concluidas / coluna.tarefas.length) * 100)}%`, opacity: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
