'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import type { Projeto, FaseEstado } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableSelect from './EditableSelect'
import EditableDateField from './EditableDateField'
import HeroUploadBlock from './HeroUploadBlock'

/* Identidade rlprod.pt: concluído = azul cheio, em curso = azul claro a pulsar, pendente = cinza */
const ESTADO_CFG = {
  concluido: { label: 'Concluído', node: 'bg-[#2e6cf6] border-[#2e6cf6]', dot: 'bg-white',                   card: 'border-white/[0.1] bg-[#00141f]/70',  pill: 'bg-[#2e6cf6] border-[#2e6cf6] text-white' },
  em_curso:  { label: 'Em Curso',  node: 'bg-[#00141f] border-[#5a8bff]', dot: 'bg-[#5a8bff] animate-pulse', card: 'border-[#5a8bff]/55 bg-[#0c2236]/70', pill: 'bg-[#5a8bff]/[0.1] border-[#5a8bff]/60 text-[#5a8bff]' },
  pendente:  { label: 'Pendente',  node: 'bg-[#00141f] border-[#7c8893]', dot: 'bg-[#7c8893]',               card: 'border-white/[0.1] bg-[#00141f]/70',  pill: 'bg-transparent border-white/[0.14] text-[#7c8893]' },
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


  const feitas = projeto.fases.filter(f => f.estado === 'concluido').length
  const pct = projeto.fases.length ? Math.round((feitas / projeto.fases.length) * 100) : 0
  const atual = projeto.fases.find(f => f.estado === 'em_curso')

  return (
    <div className="rlp text-white">
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-8 pt-6 pb-24">

        {/* Back */}
        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-[12px] text-white/50 hover:text-white transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal · {projeto.nome}
        </Link>

        {/* Header */}
        <div className="mt-6 mb-8">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · {projeto.nome}</p>
          <h1 className="rlp-t mt-3 text-[44px] sm:text-[60px] leading-[0.95]">
            Work<span className="text-[#5a8bff]">flow</span>
          </h1>
        </div>

        {/* Progresso */}
        {projeto.fases.length > 0 && (
          <div className="mb-6 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="rlp-m text-[10px] text-white/45">Progresso</p>
              <span className="text-[12px] text-white/55">{feitas}/{projeto.fases.length} fases <span className="text-[#5a8bff]">{pct}%</span></span>
            </div>
            <div className="mt-3 flex gap-1">
              {projeto.fases.map(f => (
                <span key={f.id} title={f.nome}
                  className={`h-1.5 flex-1 rounded-full ${f.estado === 'concluido' ? 'bg-[#2e6cf6]' : f.estado === 'em_curso' ? 'bg-[#5a8bff]/60 animate-pulse' : 'bg-white/[0.08]'}`} />
              ))}
            </div>
            <p className="mt-3 text-[13px] text-white/60">
              <span className="rlp-m text-[9.5px] text-white/40 mr-2">Fase atual</span>
              <span className={atual ? 'text-[#5a8bff]' : 'text-[#7c8893]'}>{atual ? atual.nome : 'Sem fase em curso'}</span>
            </p>
          </div>
        )}

        {/* Intro */}
        <div className="mb-8 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5 sm:p-6 flex flex-col gap-3">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Sobre o workflow</p>
          <p className="text-[15.5px] text-white/85 leading-relaxed">
            Este é o nosso workflow na sua versão mais completa.
          </p>
          <p className="text-[14.5px] text-white/55 leading-relaxed">
            Em alguns projetos não passamos exactamente por todos os passos, mas a nossa atenção e dedicação será a mesma, bem como a qualidade do trabalho que vamos entregar.
          </p>
          <p className="text-[14.5px] text-white/55 leading-relaxed">
            A flexibilidade que aplicamos no número de etapas é uma característica da nossa personalidade, que procura eficiência em cada projeto, garantindo sempre o foco nos objetivos e resultados.
          </p>
        </div>

        {/* Timeline */}
        {projeto.fases.length === 0 && !isEditing ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 rounded-2xl border border-dashed border-white/[0.15] bg-[#00141f]/60 text-center px-6">
            <p className="rlp-m text-[11px] text-white/45">Sem fases</p>
            <p className="text-[14px] text-white/55">As fases do projeto vão aparecer aqui em breve.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-white/[0.1]" />
            <div className="flex flex-col gap-3">
              {projeto.fases.map((fase, i) => {
                const cfg = ESTADO_CFG[fase.estado]
                return (
                  <div key={fase.id} className="relative flex gap-4 sm:gap-6">
                    <div className="relative z-10 mt-[18px] shrink-0">
                      <div className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center ${cfg.node}`}>
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      </div>
                    </div>

                    <div className={`flex-1 min-w-0 rounded-2xl border p-4 sm:p-5 ${cfg.card}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="rlp-m text-[10px] text-white/35 tracking-[0.15em] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                          <EditableField
                            value={fase.nome}
                            isEditing={isEditing}
                            onChange={v => updateFase(i, 'nome', v)}
                            className={`rlp-t text-[18px] leading-tight ${fase.estado === 'pendente' ? 'text-white/70' : 'text-white'}`}
                          />
                        </div>
                        <div className={`shrink-0 self-start inline-flex items-center rounded-full border px-3 py-1 ${cfg.pill}`}>
                          <EditableSelect
                            value={fase.estado}
                            options={ESTADO_OPTIONS}
                            isEditing={isEditing}
                            onChange={v => updateFase(i, 'estado', v)}
                            className="text-[11.5px]"
                          />
                        </div>
                      </div>
                      <EditableField
                        value={fase.descricao}
                        isEditing={isEditing}
                        onChange={v => updateFase(i, 'descricao', v)}
                        className="text-[14px] text-white/55 leading-relaxed sm:pl-8 block"
                        placeholder="Descrição da fase"
                        multiline
                      />
                      <EditableDateField
                        value={fase.data ?? ''}
                        isEditing={isEditing}
                        onChange={v => updateFase(i, 'data', v)}
                        className={`text-[12px] mt-2 sm:pl-8 block ${fase.estado === 'pendente' ? 'text-white/35' : 'text-white/55'}`}
                        placeholder="Data estimada"
                      />
                      {/* Notification button — admin only */}
                      {isAdmin && (
                        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-3">
                          {fase.notificacaoEnviada ? (
                            <span className="flex items-center gap-1.5 text-[12px] text-[#a9c1ff]">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                              Notificado em {fase.notificacaoEnviada}
                            </span>
                          ) : (
                            <button
                              onClick={() => sendNotification(i)}
                              disabled={sendingId === fase.id}
                              className="flex items-center gap-1.5 rounded-full border border-white/25 hover:border-[#2e6cf6] hover:bg-[#2e6cf6]/15
                                         px-4 py-1.5 text-[12.5px] text-white/80 hover:text-white
                                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                          className="rlp-m mt-3 text-[9.5px] text-[#ff4747]/60 hover:text-[#ff4747] transition-colors">
                          Remover fase
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isEditing && (
          <button onClick={addFase}
            className="mt-4 w-full rounded-2xl border border-dashed border-white/20 hover:border-[#2e6cf6] py-3
                       text-[13px] text-white/60 hover:text-white transition-colors">
            + Adicionar Fase
          </button>
        )}

        {/* Nota datas */}
        <div className="mt-8 rounded-2xl border border-white/[0.1] bg-[#0c2236]/70 px-5 py-4">
          <p className="text-[13.5px] text-white/60 leading-relaxed">
            As datas indicadas são estimativas e podem ser ajustadas conforme o avanço do projeto.
            Serás notificado em cada transição de fase.
          </p>
        </div>

        {/* Timings */}
        <div className="mt-3 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5 sm:p-6 flex flex-col gap-3">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Timings</p>
          <p className="text-[14.5px] text-white/60 leading-relaxed">
            No projeto tens todos os timings associados, bem como cada passo que damos até à conclusão do mesmo.
          </p>
          <p className="text-[14.5px] text-white/60 leading-relaxed">
            O compromisso entre ambas as partes com estes timings é fundamental para que tenhas os conteúdos do teu lado dentro do prazo estabelecido.
          </p>
          <p className="text-[14.5px] text-white/50 leading-relaxed">
            No entanto deverá haver sempre alguma flexibilidade para imprevistos.
          </p>
          <div className="pt-3 border-t border-white/[0.08]">
            <p className="rlp-t text-[18px] text-white">
              Contamos contigo para nos ajudares neste processo<span className="text-[#5a8bff]">.</span>
            </p>
          </div>
        </div>

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </div>
  )
}
