'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, RoadmapColuna, RoadmapTarefa, TarefaEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

const ESTADO_OPTIONS: { value: TarefaEstado; label: string }[] = [
  { value: 'concluido',    label: 'Concluído'    },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'aguardar',     label: 'Aguardar'     },
  { value: 'enviado',      label: 'Enviado'      },
]

const ESTADO_CFG: Record<TarefaEstado, { bg: string; text: string; border: string; dot: string; label: string }> = {
  concluido:    { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/20', dot: 'bg-emerald-400', label: 'Concluído'    },
  em_andamento: { bg: 'bg-blue-400/10',    text: 'text-blue-400',    border: 'border-blue-400/20',    dot: 'bg-blue-400 animate-pulse',    label: 'Em andamento' },
  nao_iniciada: { bg: 'bg-white/[0.03]',   text: 'text-white/30',    border: 'border-white/[0.08]',   dot: 'bg-white/20',    label: 'Não iniciada' },
  aguardar:     { bg: 'bg-amber-400/10',   text: 'text-amber-400',   border: 'border-amber-400/20',   dot: 'bg-amber-400',   label: 'Aguardar'     },
  enviado:      { bg: 'bg-violet-400/10',  text: 'text-violet-400',  border: 'border-violet-400/20',  dot: 'bg-violet-400',  label: 'Enviado'      },
}

const CORES = [
  { value: 'blue',    cls: 'bg-blue-400'    },
  { value: 'cyan',    cls: 'bg-cyan-400'    },
  { value: 'emerald', cls: 'bg-emerald-400' },
  { value: 'yellow',  cls: 'bg-yellow-400'  },
  { value: 'amber',   cls: 'bg-amber-400'   },
  { value: 'orange',  cls: 'bg-orange-400'  },
  { value: 'red',     cls: 'bg-red-400'     },
  { value: 'purple',  cls: 'bg-purple-400'  },
  { value: 'violet',  cls: 'bg-violet-400'  },
  { value: 'white',   cls: 'bg-white/40'    },
]

const corDot: Record<string, string> = Object.fromEntries(CORES.map(c => [c.value, c.cls]))

const fmtDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props { projeto: Projeto; isAdmin: boolean }

export default function RoadmapClient({ projeto: initial, isAdmin }: Props) {
  const [colunas, setColunas] = useState<RoadmapColuna[]>(initial.roadmap ?? [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.roadmapImageUrl ?? '')

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
    setColunas(initial.roadmap ?? [])
    setHeroUrl(initial.roadmapImageUrl ?? '')
    setIsEditing(false)
  }

  /* ── Colunas ── */
  const addColuna = () =>
    setColunas(c => [...c, {
      id: Date.now().toString(),
      titulo: `Fase ${c.length + 1}`,
      cor: 'blue',
      tarefas: [],
    }])

  const removeColuna = (id: string) =>
    setColunas(c => c.filter(col => col.id !== id))

  const updateColuna = (id: string, field: 'titulo' | 'cor', value: string) =>
    setColunas(c => c.map(col => col.id === id ? { ...col, [field]: value } : col))

  /* ── Tarefas ── */
  const addTarefa = (colunaId: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: [...col.tarefas, { id: Date.now().toString(), titulo: 'Nova tarefa', estado: 'nao_iniciada' as TarefaEstado, data: '' }] }
      : col
    ))

  const removeTarefa = (colunaId: string, tarefaId: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: col.tarefas.filter(t => t.id !== tarefaId) }
      : col
    ))

  const updateTarefa = (colunaId: string, tarefaId: string, field: keyof RoadmapTarefa, value: string) =>
    setColunas(c => c.map(col => col.id === colunaId
      ? { ...col, tarefas: col.tarefas.map(t => t.id === tarefaId ? { ...t, [field]: value } : t) }
      : col
    ))

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="relative z-10 px-6 sm:px-10 py-10">

        {/* Cabeçalho */}
        <div className="max-w-5xl mx-auto">
          <Link href={`/portal-media/${initial.ref}`}
            className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
            <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
            Portal {initial.nome}
          </Link>

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {initial.nome}</p>
              <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Road Map</h1>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px w-12 bg-white/25" />
                <div className="h-px w-48 bg-white/[0.04]" />
              </div>
            </div>
            {isAdmin && isEditing && (
              <button onClick={addColuna}
                className="border border-dashed border-white/20 hover:border-white/40 px-4 py-2 text-sm tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors shrink-0">
                + Coluna
              </button>
            )}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 pb-8 border-b border-white/[0.05]">
            {ESTADO_OPTIONS.map(opt => {
              const cfg = ESTADO_CFG[opt.value]
              return (
                <div key={opt.value} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot.replace(' animate-pulse', '')}`} />
                  <span className={`text-sm tracking-[0.2em] uppercase ${cfg.text}`}>{opt.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Board */}
        {colunas.length === 0 ? (
          <div className="max-w-3xl mx-auto border border-dashed border-white/[0.07] px-6 py-16 text-center">
            <p className="text-sm tracking-[0.4em] text-white/20 uppercase mb-2">Road map vazio</p>
            {isAdmin && (
              <p className="text-sm text-white/15">Clica em "Editar" e depois em "+ Coluna" para começar</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto pb-6 -mx-6 px-6 sm:-mx-10 sm:px-10">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {colunas.map(coluna => {
                const dot = corDot[coluna.cor] ?? 'bg-white/20'
                return (
                  <div key={coluna.id} className="w-[272px] flex-shrink-0 flex flex-col">

                    {/* Header coluna */}
                    <div className="mb-3">
                      {isEditing ? (
                        <div className="border border-white/[0.08] bg-white/[0.02] px-3 pt-3 pb-2 flex flex-col gap-2.5">
                          {/* Seletor de cor */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {CORES.map(co => (
                              <button
                                key={co.value}
                                onClick={() => updateColuna(coluna.id, 'cor', co.value)}
                                title={co.value}
                                className={`w-3 h-3 rounded-full shrink-0 ${co.cls} transition-all
                                  ${coluna.cor === co.value
                                    ? 'ring-1 ring-white/60 ring-offset-[1.5px] ring-offset-[#04080f] scale-125'
                                    : 'opacity-35 hover:opacity-80'}`}
                              />
                            ))}
                            <button
                              onClick={() => removeColuna(coluna.id)}
                              className="ml-auto text-sm text-red-400/40 hover:text-red-400/70 transition-colors leading-none">✕</button>
                          </div>
                          <input
                            value={coluna.titulo}
                            onChange={e => updateColuna(coluna.id, 'titulo', e.target.value)}
                            className="w-full bg-transparent text-sm tracking-[0.3em] text-white/70 uppercase font-medium focus:outline-none border-b border-white/10 focus:border-white/30 pb-0.5"
                            placeholder="Nome da coluna"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 px-1">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                          <span className="text-sm tracking-[0.35em] text-white/55 uppercase font-medium flex-1 truncate">{coluna.titulo}</span>
                          <span className="text-sm font-mono text-white/20 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 shrink-0">{coluna.tarefas.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Tarefas */}
                    <div className="flex flex-col gap-2">
                      {coluna.tarefas.map(tarefa => {
                        const cfg = ESTADO_CFG[tarefa.estado]
                        return (
                          <div key={tarefa.id}
                            className="border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-4 py-3.5">
                            {isEditing ? (
                              <div className="flex flex-col gap-2.5">
                                {/* Título */}
                                <input
                                  value={tarefa.titulo}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'titulo', e.target.value)}
                                  className="w-full bg-transparent text-sm text-white/70 focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5 placeholder:text-white/15"
                                  placeholder="Título da tarefa"
                                />
                                {/* Estado */}
                                <select
                                  value={tarefa.estado}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'estado', e.target.value)}
                                  className="bg-[#04080f] border border-white/[0.08] text-sm text-white/50 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full"
                                >
                                  {ESTADO_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                                {/* Data */}
                                <input
                                  type="date"
                                  value={tarefa.data ?? ''}
                                  onChange={e => updateTarefa(coluna.id, tarefa.id, 'data', e.target.value)}
                                  className="bg-[#04080f] border border-white/[0.08] text-sm text-white/40 px-2 py-1.5 focus:outline-none focus:border-white/25 w-full"
                                />
                                <button
                                  onClick={() => removeTarefa(coluna.id, tarefa.id)}
                                  className="text-sm tracking-[0.25em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors self-end">
                                  Remover
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-white/65 font-light mb-2.5 leading-snug">{tarefa.titulo}</p>
                                <div className={`inline-flex items-center gap-1.5 border px-2 py-1 ${cfg.bg} ${cfg.border}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                  <span className={`text-sm tracking-[0.15em] uppercase ${cfg.text}`}>{cfg.label}</span>
                                </div>
                                {tarefa.data && (
                                  <p className="text-sm text-white/25 mt-2">{fmtDate(tarefa.data)}</p>
                                )}
                              </>
                            )}
                          </div>
                        )
                      })}

                      {isEditing && (
                        <button
                          onClick={() => addTarefa(coluna.id)}
                          className="border border-dashed border-white/[0.08] hover:border-white/20 py-2.5 text-sm tracking-[0.35em] text-white/20 hover:text-white/45 uppercase transition-colors">
                          + Tarefa
                        </button>
                      )}
                    </div>
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
