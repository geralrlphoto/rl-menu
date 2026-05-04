'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto, EntregaFeedback } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import HeroUploadBlock from './HeroUploadBlock'

const TIPO_OPTIONS = [
  { value: '',           label: 'Tipo'        },
  { value: 'video',      label: 'Vídeo'       },
  { value: 'fotografia', label: 'Fotografia'  },
  { value: 'outro',      label: 'Outro'       },
]

const TIPO_ICON: Record<string, string> = {
  video:      '🎬',
  fotografia: '📷',
  outro:      '📁',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props { projeto: Projeto; isAdmin: boolean }

export default function EntregasClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto]       = useState(initial)
  const [isEditing, setIsEditing]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [heroUrl, setHeroUrl]       = useState(initial.entregasImageUrl ?? '')
  const [notifying, setNotifying]   = useState(false)
  const [notificado, setNotificado] = useState<string | null>(null)

  /* ── feedback state ── */
  const [feedbackAberto, setFeedbackAberto]   = useState<number | null>(null)
  const [feedbackTexto, setFeedbackTexto]     = useState('')
  const [enviandoFeedback, setEnviandoFeedback] = useState(false)
  const [feedbackErro, setFeedbackErro]       = useState<string | null>(null)
  const [respostaAberta, setRespostaAberta]   = useState<string | null>(null)  // `${entregaIdx}-${feedbackId}`
  const [respostaTexto, setRespostaTexto]     = useState('')
  const [enviandoResposta, setEnviandoResposta] = useState(false)
  const [respostaErro, setRespostaErro]       = useState<string | null>(null)

  /* ── persistência ── */
  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${projeto.ref}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entregas: projeto.entregas,
          revisoes: projeto.revisoes,
          entregasImageUrl: heroUrl,
        }),
      })
    } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  /* ── entregas ── */
  const updateEntrega = (idx: number, field: string, value: string) =>
    setProjeto(p => ({
      ...p,
      entregas: p.entregas.map((e, i) => i === idx ? { ...e, [field]: value } : e),
    }))

  const addEntrega = () =>
    setProjeto(p => ({
      ...p,
      entregas: [...p.entregas, { titulo: 'Nova Entrega', tipo: 'video' as const, formato: '', duracao: '', estado: 'pendente' as const }],
    }))

  const removeEntrega = (idx: number) =>
    setProjeto(p => ({ ...p, entregas: p.entregas.filter((_, i) => i !== idx) }))

  const setRevisoes = (field: 'usadas' | 'total', value: string) =>
    setProjeto(p => ({ ...p, revisoes: { ...p.revisoes, [field]: Number(value) || 0 } }))

  /* ── notificação ── */
  const notificarCliente = async () => {
    const emailCliente = initial.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }
    const disponiveis = projeto.entregas.filter(e => e.linkUrl)
    if (disponiveis.length === 0) {
      alert('Nenhuma entrega tem URL de download. Adiciona pelo menos um link antes de notificar.')
      return
    }
    setNotifying(true)
    try {
      await fetch('/api/media-portal/notify-entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          entregas: disponiveis,
        }),
      })
      const agora = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      setNotificado(agora)
    } catch {}
    setNotifying(false)
  }

  /* ── feedback do cliente ── */
  const submitFeedback = async (entregaIdx: number) => {
    if (!feedbackTexto.trim()) return
    setEnviandoFeedback(true)
    setFeedbackErro(null)
    const novoFeedback: EntregaFeedback = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      texto: feedbackTexto.trim(),
      criadoEm: new Date().toISOString(),
    }
    try {
      const res = await fetch(`/api/media-portal/${projeto.ref}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          entregaIndex: entregaIdx,
          texto: feedbackTexto.trim(),
        }),
      })
      if (res.ok) {
        setProjeto(p => ({
          ...p,
          entregas: p.entregas.map((e, i) => i === entregaIdx
            ? { ...e, feedbacks: [...(e.feedbacks ?? []), novoFeedback] }
            : e
          ),
        }))
        setFeedbackTexto('')
        setFeedbackAberto(null)
      } else {
        const err = await res.json().catch(() => ({}))
        setFeedbackErro(err?.error ?? 'Erro ao enviar. Tenta novamente.')
      }
    } catch {
      setFeedbackErro('Sem ligação. Verifica a internet e tenta novamente.')
    }
    setEnviandoFeedback(false)
  }

  /* ── remover feedback completo (admin) ── */
  const removerFeedback = async (entregaIdx: number, feedbackId: string) => {
    if (!confirm('Remover este feedback e resposta? Não é possível desfazer.')) return
    try {
      const res = await fetch(`/api/media-portal/${projeto.ref}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remover-feedback', entregaIndex: entregaIdx, feedbackId }),
      })
      if (res.ok) {
        setProjeto(p => ({
          ...p,
          entregas: p.entregas.map((e, i) => i === entregaIdx
            ? { ...e, feedbacks: (e.feedbacks ?? []).filter(f => f.id !== feedbackId) }
            : e
          ),
        }))
      }
    } catch {}
  }

  /* ── remover resposta do admin ── */
  const removerResposta = async (entregaIdx: number, feedbackId: string) => {
    if (!confirm('Remover a tua resposta?')) return
    try {
      const res = await fetch(`/api/media-portal/${projeto.ref}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remover-resposta', entregaIndex: entregaIdx, feedbackId }),
      })
      if (res.ok) {
        setProjeto(p => ({
          ...p,
          entregas: p.entregas.map((e, i) => i === entregaIdx
            ? {
                ...e,
                feedbacks: (e.feedbacks ?? []).map(f =>
                  f.id === feedbackId ? { ...f, resposta: undefined } : f
                ),
              }
            : e
          ),
        }))
      }
    } catch {}
  }

  /* ── resposta do admin ── */
  const submitResposta = async (entregaIdx: number, feedbackId: string) => {
    if (!respostaTexto.trim()) return
    setEnviandoResposta(true)
    const novaResposta = { texto: respostaTexto.trim(), criadoEm: new Date().toISOString() }
    try {
      const res = await fetch(`/api/media-portal/${projeto.ref}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resposta',
          entregaIndex: entregaIdx,
          feedbackId,
          texto: respostaTexto.trim(),
        }),
      })
      if (res.ok) {
        setProjeto(p => ({
          ...p,
          entregas: p.entregas.map((e, i) => i === entregaIdx
            ? {
                ...e,
                feedbacks: (e.feedbacks ?? []).map(f =>
                  f.id === feedbackId ? { ...f, resposta: novaResposta } : f
                ),
              }
            : e
          ),
        }))
        setRespostaTexto('')
        setRespostaAberta(null)
        setRespostaErro(null)
      } else {
        const err = await res.json().catch(() => ({}))
        setRespostaErro(err?.error ?? 'Erro ao enviar resposta. Tenta novamente.')
      }
    } catch {
      setRespostaErro('Sem ligação. Verifica a internet e tenta novamente.')
    }
    setEnviandoResposta(false)
  }

  const { usadas, total } = projeto.revisoes
  const restantes = total - usadas
  const entregasComUrl = projeto.entregas.filter(e => e.linkUrl).length

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        <Link href={`/portal-media/${projeto.ref}`}
          className="inline-flex items-center gap-2 text-sm tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* ── ENTREGAS ── */}
        <div className="mb-10">
          <p className="text-sm tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {projeto.nome}</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Entregas</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex flex-col gap-0 mb-4">
          {projeto.entregas.map((e, i) => {
            const temUrl    = !!e.linkUrl
            const feedbacks = e.feedbacks ?? []
            const hasFeedbacks = feedbacks.length > 0
            const feedbackKey  = `fb-${i}`

            return (
              <div key={i} className="mb-5">

                {/* ── Card principal ── */}
                <div className={`border px-6 py-5 transition-colors ${
                  temUrl
                    ? 'border-emerald-400/25 bg-emerald-400/5'
                    : 'border-white/[0.06] bg-white/[0.015]'
                }`}>
                  <div className="flex items-start justify-between gap-4">

                    {/* Esquerdo */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="text-sm font-mono text-white/15 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 mb-0.5">
                          {e.tipo && !isEditing && (
                            <span className="text-sm opacity-60">{TIPO_ICON[e.tipo] ?? '📁'}</span>
                          )}
                          {isEditing ? (
                            <select
                              value={e.tipo ?? ''}
                              onChange={ev => updateEntrega(i, 'tipo', ev.target.value)}
                              className="bg-[#04080f] border border-white/[0.08] text-sm text-white/45 px-2 py-1 focus:outline-none focus:border-white/20 mr-2"
                            >
                              {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : e.tipo ? (
                            <span className="text-sm tracking-[0.2em] text-white/25 uppercase">{e.tipo}</span>
                          ) : null}
                        </div>

                        <EditableField
                          value={e.titulo}
                          isEditing={isEditing}
                          onChange={v => updateEntrega(i, 'titulo', v)}
                          className="text-sm tracking-[0.25em] text-white/65 uppercase font-medium block"
                          placeholder="Título"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <EditableField
                            value={e.formato}
                            isEditing={isEditing}
                            onChange={v => updateEntrega(i, 'formato', v)}
                            className="text-sm tracking-[0.15em] text-white/25 block"
                            placeholder="Formato (ex: MP4 · 16:9 · 4K)"
                          />
                          {!isEditing && e.duracao && <span className="text-white/15">·</span>}
                          <EditableField
                            value={e.duracao}
                            isEditing={isEditing}
                            onChange={v => updateEntrega(i, 'duracao', v)}
                            className="text-sm tracking-[0.15em] text-white/25 block"
                            placeholder="Duração (ex: 2–3 min)"
                          />
                        </div>

                        {isEditing && (
                          <div className="mt-3 flex items-center gap-2 border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                            <span className="text-sm text-white/20 shrink-0">🔗</span>
                            <input
                              value={e.linkUrl ?? ''}
                              onChange={ev => updateEntrega(i, 'linkUrl', ev.target.value)}
                              placeholder="URL de download (https://...)"
                              className="flex-1 bg-transparent text-sm text-white/50 placeholder:text-white/15 focus:outline-none"
                            />
                            {e.linkUrl && (
                              <button onClick={() => updateEntrega(i, 'linkUrl', '')}
                                className="text-white/20 hover:text-white/50 text-sm shrink-0">✕</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direito — Download */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {!isEditing ? (
                        temUrl ? (
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-emerald-400/50 bg-emerald-400/10
                                       hover:bg-emerald-400/20 px-4 py-2 text-sm tracking-[0.3em]
                                       text-emerald-400 uppercase transition-colors">
                            ↓ Download
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 border border-red-500/35
                                           bg-red-500/5 px-4 py-2 text-sm tracking-[0.3em]
                                           text-red-400/55 uppercase cursor-not-allowed">
                            ↓ Download
                          </span>
                        )
                      ) : (
                        <button onClick={() => removeEntrega(i)}
                          className="text-sm tracking-[0.3em] text-red-400/50 hover:text-red-400/80 uppercase transition-colors">
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Linha de feedback ── */}
                  {!isEditing && (
                    <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between gap-4">
                      <p className="text-xs tracking-[0.3em] text-white/18 uppercase">
                        {feedbacks.length > 0
                          ? `${feedbacks.length} feedback${feedbacks.length !== 1 ? 's' : ''} registado${feedbacks.length !== 1 ? 's' : ''}`
                          : 'Sem feedback ainda'}
                      </p>

                      {/* Cliente — botão activo/inactivo */}
                      {!isAdmin && (
                        temUrl ? (
                          feedbackAberto !== i && (
                            <button
                              onClick={() => { setFeedbackAberto(i); setFeedbackTexto('') }}
                              className="shrink-0 inline-flex items-center gap-2 border border-emerald-400/40
                                         bg-emerald-400/[0.08] hover:bg-emerald-400/15 px-4 py-2
                                         text-sm tracking-[0.35em] text-emerald-400/80 uppercase transition-colors"
                            >
                              ◎ Dar Feedback
                            </button>
                          )
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-2 border border-red-500/20
                                           bg-red-500/[0.03] px-4 py-2 text-sm tracking-[0.35em]
                                           text-red-400/35 uppercase cursor-not-allowed">
                            ⏳ Aguardar Ficheiro
                          </span>
                        )
                      )}

                      {/* Admin — estado (só informação) */}
                      {isAdmin && (
                        temUrl ? (
                          <span className="shrink-0 inline-flex items-center gap-2 border border-emerald-400/20
                                           bg-emerald-400/[0.04] px-4 py-2 text-sm tracking-[0.35em]
                                           text-emerald-400/45 uppercase">
                            ◎ Feedback Activo
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-2 border border-white/[0.07]
                                           bg-white/[0.02] px-4 py-2 text-sm tracking-[0.35em]
                                           text-white/20 uppercase">
                            ⊘ Sem URL · Feedback Bloqueado
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* ── Formulário de feedback (cliente) ── */}
                {!isAdmin && feedbackAberto === i && (
                  <div className="border-x border-b border-emerald-400/15 bg-emerald-400/[0.02] px-5 py-4">
                    <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-3">O teu feedback</p>
                    <textarea
                      value={feedbackTexto}
                      onChange={ev => setFeedbackTexto(ev.target.value)}
                      placeholder="Escreve aqui os teus comentários, aprovação ou sugestões de alteração..."
                      rows={4}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/60
                                 placeholder:text-white/15 px-4 py-3 focus:outline-none focus:border-white/20
                                 resize-none leading-relaxed"
                    />
                    {feedbackErro && (
                      <p className="text-xs text-red-400/70 mb-3 leading-relaxed">⚠ {feedbackErro}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => submitFeedback(i)}
                        disabled={enviandoFeedback || !feedbackTexto.trim()}
                        className="px-5 py-2 text-sm tracking-[0.35em] uppercase border border-emerald-400/40
                                   bg-emerald-400/10 text-emerald-400/80 hover:bg-emerald-400/20 transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {enviandoFeedback ? '⏳ A enviar...' : '✓ Enviar Feedback'}
                      </button>
                      <button
                        onClick={() => { setFeedbackAberto(null); setFeedbackTexto(''); setFeedbackErro(null) }}
                        className="px-4 py-2 text-sm tracking-[0.35em] uppercase text-white/25 hover:text-white/50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Histórico de feedbacks ── */}
                {(hasFeedbacks || isAdmin) && (
                  <div className="border-x border-b border-white/[0.05] bg-white/[0.01] px-5 py-4">
                    <p className="text-xs tracking-[0.45em] text-white/15 uppercase mb-4">Registos de Feedback</p>
                    {!hasFeedbacks && isAdmin && (
                      <p className="text-xs text-white/15 italic">Sem feedbacks do cliente ainda.</p>
                    )}
                    <div className="flex flex-col gap-4">
                      {feedbacks.map((fb, fi) => (
                        <div key={fb.id} className="flex flex-col gap-2">

                          {/* Mensagem do cliente */}
                          <div className="border border-amber-400/15 bg-amber-400/[0.03] px-4 py-3">
                            <div className="flex items-center justify-between mb-2 gap-4">
                              <span className="text-xs tracking-[0.35em] text-amber-400/60 uppercase shrink-0">
                                ◎ Cliente
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-white/18 font-mono">{formatDateTime(fb.criadoEm)}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => removerFeedback(i, fb.id)}
                                    title="Remover feedback"
                                    className="text-xs text-red-400/30 hover:text-red-400/70 transition-colors leading-none"
                                  >✕</button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-white/55 leading-relaxed">{fb.texto}</p>
                          </div>

                          {/* Resposta do admin */}
                          {fb.resposta ? (
                            <div className="border border-blue-500/18 bg-blue-500/[0.03] px-4 py-3 ml-5">
                              <div className="flex items-center justify-between mb-2 gap-4">
                                <span className="text-xs tracking-[0.35em] text-blue-400/70 uppercase shrink-0">
                                  ↩ RL Media
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-white/18 font-mono">{formatDateTime(fb.resposta.criadoEm)}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => removerResposta(i, fb.id)}
                                      title="Remover resposta"
                                      className="text-xs text-red-400/30 hover:text-red-400/70 transition-colors leading-none"
                                    >✕</button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-white/55 leading-relaxed">{fb.resposta.texto}</p>
                            </div>
                          ) : isAdmin ? (
                            /* Admin — responder */
                            respostaAberta === `${i}-${fb.id}` ? (
                              <div className="ml-5 border border-blue-500/20 bg-blue-500/[0.03] px-4 py-4">
                                <p className="text-xs tracking-[0.4em] text-blue-400/50 uppercase mb-3">Resposta</p>
                                <textarea
                                  value={respostaTexto}
                                  onChange={ev => setRespostaTexto(ev.target.value)}
                                  placeholder="Escreve a tua resposta ao cliente..."
                                  rows={3}
                                  className="w-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/60
                                             placeholder:text-white/15 px-4 py-3 focus:outline-none focus:border-white/20
                                             resize-none leading-relaxed mb-3"
                                />
                                {respostaErro && (
                                  <p className="text-xs text-red-400/70 mb-3">⚠ {respostaErro}</p>
                                )}
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => submitResposta(i, fb.id)}
                                    disabled={enviandoResposta || !respostaTexto.trim()}
                                    className="px-5 py-2 text-sm tracking-[0.35em] uppercase border border-blue-400/40
                                               bg-blue-400/10 text-blue-400/80 hover:bg-blue-400/20 transition-colors
                                               disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {enviandoResposta ? '⏳ A enviar...' : '↩ Responder'}
                                  </button>
                                  <button
                                    onClick={() => { setRespostaAberta(null); setRespostaTexto(''); setRespostaErro(null) }}
                                    className="px-4 py-2 text-sm tracking-[0.35em] uppercase text-white/25 hover:text-white/50 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="ml-5">
                                <button
                                  onClick={() => { setRespostaAberta(`${i}-${fb.id}`); setRespostaTexto('') }}
                                  className="text-sm tracking-[0.35em] uppercase text-blue-400/50 hover:text-blue-400/80
                                             border border-blue-400/20 hover:border-blue-400/40 px-4 py-2 transition-colors"
                                >
                                  ↩ Responder
                                </button>
                              </div>
                            )
                          ) : (
                            /* Cliente — aguardar resposta */
                            <div className="ml-5 px-4 py-3 border border-white/[0.04] bg-white/[0.01]">
                              <p className="text-xs text-white/20 tracking-[0.25em]">⏳ Aguardar resposta da RL Media</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>

        {isEditing && (
          <button onClick={addEntrega}
            className="w-full border border-dashed border-white/15 hover:border-white/30 bg-white/[0.01]
                       hover:bg-white/[0.03] py-3 text-sm tracking-[0.4em] text-white/30 uppercase
                       transition-colors mb-4">
            + Adicionar Entrega
          </button>
        )}

        {/* ── Legenda ── */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-sm text-white/30">Com download ({entregasComUrl})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500/60 shrink-0" />
              <span className="text-sm text-white/30">Aguarda link ({projeto.entregas.length - entregasComUrl})</span>
            </div>
          </div>
        </div>

        {/* ── Notificação ao cliente (admin) ── */}
        {isAdmin && !isEditing && (
          <div className="mb-8 border border-white/[0.07] bg-white/[0.02] px-5 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.35em] text-white/35 uppercase mb-1">Notificar Cliente</p>
              <p className="text-sm text-white/20 leading-relaxed">
                {notificado
                  ? `✓ Notificação enviada em ${notificado}`
                  : `Envia um email ao cliente com os links de download disponíveis (${entregasComUrl} entrega${entregasComUrl !== 1 ? 's' : ''}).`}
              </p>
            </div>
            <button
              onClick={notificarCliente}
              disabled={notifying || entregasComUrl === 0}
              className={`shrink-0 px-5 py-2.5 text-sm tracking-[0.35em] uppercase border transition-colors
                ${notificado
                  ? 'border-emerald-400/20 text-emerald-400/40 cursor-default'
                  : entregasComUrl === 0
                    ? 'border-white/10 text-white/15 cursor-not-allowed'
                    : 'border-white/25 text-white/50 hover:border-white/50 hover:text-white/80 cursor-pointer'}
                disabled:opacity-50`}
            >
              {notifying ? '⏳ A enviar...' : notificado ? '✓ Enviado' : 'Notificar'}
            </button>
          </div>
        )}

        <div className="mb-12 border border-white/[0.05] bg-white/[0.01] px-5 py-4">
          <p className="text-sm tracking-[0.2em] text-white/20 leading-relaxed">
            Os ficheiros ficarão disponíveis após a aprovação da entrega final. Os links expiram 30 dias após disponibilização.
          </p>
        </div>

        {/* ── REVISÕES ── */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-sm tracking-[0.5em] text-white/15 uppercase">Revisões</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-2">Incluídas</p>
            {isEditing ? (
              <EditableField value={String(total)} isEditing={true} type="number"
                onChange={v => setRevisoes('total', v)}
                className="text-3xl font-extralight text-white/60 text-center" />
            ) : (
              <p className="text-3xl font-extralight text-white/60">{total}</p>
            )}
          </div>
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-2">Usadas</p>
            {isEditing ? (
              <EditableField value={String(usadas)} isEditing={true} type="number"
                onChange={v => setRevisoes('usadas', v)}
                className="text-3xl font-extralight text-white/60 text-center" />
            ) : (
              <p className="text-3xl font-extralight text-white/60">{usadas}</p>
            )}
          </div>
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-5 text-center">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-2">Restantes</p>
            <p className="text-3xl font-extralight text-white/60">{restantes}</p>
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
