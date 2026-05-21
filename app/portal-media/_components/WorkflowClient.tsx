'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import type { Projeto, FaseEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'
import EditableDateField from './EditableDateField'
import HeroUploadBlock from './HeroUploadBlock'

const ESTADO_CFG = {
  concluido: { label: 'Concluído', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400',  text: 'text-emerald-400/80' },
  em_curso:  { label: 'Em Curso',  bg: 'bg-blue-400/10',    border: 'border-blue-400/30',    dot: 'bg-blue-400',     text: 'text-blue-400/80'   },
  pendente:  { label: 'Pendente',  bg: 'bg-red-400/[0.03]',  border: 'border-red-400/20',    dot: 'bg-red-400/40',   text: 'text-red-400/50'    },
}

const ESTADO_OPTIONS = [
  { value: 'concluido', label: 'Concluído' },
  { value: 'em_curso',  label: 'Em Curso'  },
  { value: 'pendente',  label: 'Pendente'  },
]

interface Props { projeto: Projeto; isAdmin: boolean }

const PT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function nowPT() {
  const d = new Date()
  return `${d.getDate()} ${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export default function WorkflowClient({ projeto: initial, isAdmin }: Props) {
  // useRef so notification sends survive cancel
  const baseRef = useRef(initial)
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [heroUrl, setHeroUrl] = useState(initial.workflowImageUrl ?? '')

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fases: projeto.fases, workflowImageUrl: heroUrl }),
      })
      baseRef.current = { ...baseRef.current, fases: projeto.fases }
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(baseRef.current); setIsEditing(false) }

  const sendNotification = async (faseIdx: number) => {
    const fase = projeto.fases[faseIdx]
    if (fase.notificacaoEnviada) return

    const emailCliente = projeto.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }

    setSendingId(fase.id)
    const date = nowPT()
    const updatedFases = projeto.fases.map((f, i) =>
      i === faseIdx ? { ...f, notificacaoEnviada: date } : f
    )
    const updated = { ...projeto, fases: updatedFases }
    setProjeto(updated)
    baseRef.current = { ...baseRef.current, fases: updatedFases }
    try {
      await Promise.all([
        fetch('/api/media-portal/notify-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailCliente,
            ref: projeto.ref,
            nomeProjeto: projeto.nome,
            cliente: projeto.cliente,
            faseNome: fase.nome,
            faseDescricao: fase.descricao,
            faseData: fase.data ?? '',
            faseEstado: fase.estado,
          }),
        }),
        fetch(`/api/media-portal/${projeto.ref}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fases: updatedFases }),
        }),
      ])
    } catch {}
    setSendingId(null)
  }

  const updateFase = (idx: number, field: string, value: string) =>
    setProjeto(p => ({
      ...p,
      fases: p.fases.map((f, i) => i === idx ? { ...f, [field]: value } : f),
    }))

  const addFase = () =>
    setProjeto(p => ({
      ...p,
      fases: [...p.fases, {
        id: `fase-${Date.now()}`,
        nome: 'Nova Fase',
        descricao: '',
        estado: 'pendente' as FaseEstado,
        data: '',
      }],
    }))

  const removeFase = (idx: number) =>
    setProjeto(p => ({ ...p, fases: p.fases.filter((_, i) => i !== idx) }))

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL PROD · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Workflow</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Intro */}
        <div className="mb-10 border border-white/[0.07] bg-white/[0.02] px-6 py-6 flex flex-col gap-4">
          <p className="text-[11px] tracking-[0.5em] text-white/30 uppercase">Sobre o workflow</p>
          <p className="text-[15px] font-light text-white/65 leading-relaxed tracking-wide">
            Este é o nosso workflow na sua versão mais completa.
          </p>
          <p className="text-[15px] font-light text-white/40 leading-relaxed tracking-wide">
            Em alguns projetos não passamos exactamente por todos os passos, mas a nossa atenção e dedicação será a mesma, bem como a qualidade do trabalho que vamos entregar.
          </p>
          <p className="text-[15px] font-light text-white/40 leading-relaxed tracking-wide">
            A flexibilidade que aplicamos no número de etapas é uma característica da nossa personalidade, que procura eficiência em cada projeto, garantindo sempre o foco nos objetivos e resultados.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />
          <div className="flex flex-col gap-4">
            {projeto.fases.map((fase, i) => {
              const cfg = ESTADO_CFG[fase.estado]
              return (
                <div key={fase.id} className="relative flex gap-6">
                  <div className="relative z-10 mt-[18px] shrink-0">
                    <div className={`w-[23px] h-[23px] border flex items-center justify-center ${cfg.border} ${cfg.bg}`}>
                      <div className={`w-2 h-2 rounded-full ${cfg.dot} ${fase.estado === 'em_curso' ? 'animate-pulse' : ''}`} />
                    </div>
                  </div>

                  <div className={`flex-1 border ${cfg.border} ${cfg.bg} p-5`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-[12px] font-mono text-white/15 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <EditableField
                          value={fase.nome}
                          isEditing={isEditing}
                          onChange={v => updateFase(i, 'nome', v)}
                          className={`text-[13px] tracking-[0.35em] font-medium uppercase ${fase.estado === 'pendente' ? 'text-white/35' : 'text-white/75'}`}
                        />
                      </div>
                      <div className="shrink-0">
                        <EditableSelect
                          value={fase.estado}
                          options={ESTADO_OPTIONS}
                          isEditing={isEditing}
                          onChange={v => updateFase(i, 'estado', v)}
                          className={`text-[11px] tracking-[0.3em] uppercase ${cfg.text}`}
                        />
                      </div>
                    </div>
                    <EditableField
                      value={fase.descricao}
                      isEditing={isEditing}
                      onChange={v => updateFase(i, 'descricao', v)}
                      className="text-[14px] font-light text-white/30 leading-relaxed pl-7 block tracking-wide"
                      placeholder="Descrição da fase"
                      multiline
                    />
                    <EditableDateField
                      value={fase.data ?? ''}
                      isEditing={isEditing}
                      onChange={v => updateFase(i, 'data', v)}
                      className={`text-[11px] tracking-[0.3em] mt-2 pl-7 block ${fase.estado === 'pendente' ? 'text-white/15' : 'text-white/30'}`}
                      placeholder="Data estimada"
                    />
                    {/* Notification button — admin only */}
                    {isAdmin && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-3">
                        {fase.notificacaoEnviada ? (
                          <span className="flex items-center gap-1.5 text-[8px] tracking-[0.3em] text-emerald-400/60 uppercase">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Notificado em {fase.notificacaoEnviada}
                          </span>
                        ) : (
                          <button
                            onClick={() => sendNotification(i)}
                            disabled={sendingId === fase.id}
                            className="flex items-center gap-1.5 text-[8px] tracking-[0.3em] text-white/25
                                       hover:text-white/60 border border-white/[0.08] hover:border-white/20
                                       bg-white/[0.02] hover:bg-white/[0.04] px-3 py-1.5 uppercase
                                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a1 1 0 10-2 0v.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                            </svg>
                            {sendingId === fase.id ? 'A enviar...' : 'Notificar Cliente'}
                          </button>
                        )}
                      </div>
                    )}
                    {isEditing && (
                      <button onClick={() => removeFase(i)}
                        className="mt-3 text-[8px] tracking-[0.35em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors">
                        Remover fase
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {isEditing && (
          <button onClick={addFase}
            className="mt-4 w-full border border-dashed border-white/[0.08] hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03] py-3
                       text-[11px] tracking-[0.4em] text-white/25 uppercase transition-colors">
            + Adicionar Fase
          </button>
        )}

        {/* Nota datas */}
        <div className="mt-10 border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-[12px] tracking-[0.25em] text-white/20 leading-relaxed font-light">
            As datas indicadas são estimativas e podem ser ajustadas conforme o avanço do projeto.
            Serás notificado em cada transição de fase.
          </p>
        </div>

        {/* Timings */}
        <div className="mt-3 border border-white/[0.07] bg-white/[0.02] px-6 py-6 flex flex-col gap-4">
          <p className="text-[11px] tracking-[0.5em] text-white/30 uppercase">Timings</p>
          <p className="text-[15px] font-light text-white/40 leading-relaxed tracking-wide">
            No projeto tens todos os timings associados, bem como cada passo que damos até à conclusão do mesmo.
          </p>
          <p className="text-[15px] font-light text-white/40 leading-relaxed tracking-wide">
            O compromisso entre ambas as partes com estes timings é fundamental para que tenhas os conteúdos do teu lado dentro do prazo estabelecido.
          </p>
          <p className="text-[15px] font-light text-white/30 leading-relaxed tracking-wide">
            No entanto deverá haver sempre alguma flexibilidade para imprevistos.
          </p>
          <div className="pt-2 border-t border-white/[0.05]">
            <p className="text-[13px] tracking-[0.3em] text-white/50 uppercase font-light">
              Contamos contigo para nos ajudares neste processo.
            </p>
          </div>
        </div>

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}

