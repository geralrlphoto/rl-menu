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

const TIPO_LABEL: Record<string, string> = {
  video:      'Vídeo',
  fotografia: 'Fotografia',
  outro:      'Outro',
}

/* ── identidade rlprod.pt ── */
const CARD  = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const TILE  = 'rounded-xl border border-white/[0.08] bg-[#0c2236]/70'
const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white/85 placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] transition-colors'
const BTN_PRIMARIO = 'rlp-m inline-flex items-center justify-center gap-2 rounded-md bg-[#2e6cf6] hover:bg-[#2e6cf6]/85 px-5 py-3 text-[11px] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_CONTORNO = 'rlp-m inline-flex items-center justify-center gap-2 rounded-md border border-[#2e6cf6]/60 hover:bg-[#2e6cf6]/15 px-4 py-2.5 text-[11px] text-[#a9c1ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_TEXTO = 'rlp-m inline-flex items-center justify-center px-3 py-2.5 text-[11px] text-white/45 hover:text-white/80 transition-colors'

type EstadoVisual = 'pendente' | 'revisao' | 'entregue'

const PILL: Record<EstadoVisual, { label: string; cls: string }> = {
  pendente: { label: 'Pendente',   cls: 'border-[#7c8893]/50 text-[#7c8893]' },
  revisao:  { label: 'Em revisão', cls: 'border-[#5a8bff]/60 bg-[#5a8bff]/10 text-[#5a8bff]' },
  entregue: { label: 'Entregue',   cls: 'border-[#2e6cf6] bg-[#2e6cf6] text-white' },
}

function IconeTipo({ tipo }: { tipo?: string }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (tipo === 'video') return (
    <svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg>
  )
  if (tipo === 'fotografia') return (
    <svg {...p}><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
  )
  return (
    <svg {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
  )
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
  const [notificandoIdx, setNotificandoIdx] = useState<number | null>(null)

  // Inicializar da data persistida (entrega mais recente notificada)
  const lastNotifIso = initial.entregas
    .map(e => e.notificacaoEnviada)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null
  const [notificado, setNotificado] = useState<string | null>(
    lastNotifIso
      ? new Date(lastNotifIso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : null
  )

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
    const indices = projeto.entregas
      .map((e, i) => e.linkUrl ? i : -1)
      .filter(i => i !== -1)
    const disponiveis = indices.map(i => projeto.entregas[i])
    if (disponiveis.length === 0) {
      alert('Nenhuma entrega tem URL de download. Adiciona pelo menos um link antes de notificar.')
      return
    }
    setNotifying(true)
    try {
      const res = await fetch('/api/media-portal/notify-entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          entregas: disponiveis,
          entregaIndices: indices,
        }),
      })
      const json = await res.json().catch(() => ({}))
      const iso = json.notificadoEm ?? new Date().toISOString()
      const label = new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      setNotificado(label)
      // Actualizar estado local das entregas
      setProjeto(p => ({
        ...p,
        entregas: p.entregas.map((e, i) =>
          indices.includes(i) ? { ...e, notificacaoEnviada: iso } : e
        ),
      }))
    } catch {}
    setNotifying(false)
  }

  /* ── notificação por entrega individual (admin) ── */
  const notificarEntrega = async (idx: number) => {
    const emailCliente = initial.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }
    const e = projeto.entregas[idx]
    if (!e.linkUrl) return
    setNotificandoIdx(idx)
    try {
      const res = await fetch('/api/media-portal/notify-entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          entregas: [e],
          entregaIndices: [idx],
        }),
      })
      const json = await res.json().catch(() => ({}))
      const iso = json.notificadoEm ?? new Date().toISOString()
      setProjeto(p => ({
        ...p,
        entregas: p.entregas.map((ent, i) =>
          i === idx ? { ...ent, notificacaoEnviada: iso } : ent
        ),
      }))
    } catch {}
    setNotificandoIdx(null)
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
  const pctRevisoes = total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0
  const revisoesExcedidas = total > 0 && usadas > total

  const estadoDe = (e: Projeto['entregas'][number]): EstadoVisual => {
    if (!e.linkUrl) return 'pendente'
    const emAberto = (e.feedbacks ?? []).some(f => !f.resposta)
    return emAberto ? 'revisao' : 'entregue'
  }

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        <Link href={`/portal-media/${projeto.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white/80 transition-colors mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {projeto.nome}
        </Link>

        {/* ── ENTREGAS ── */}
        <header className="mb-8">
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">RL PROD · {projeto.nome}</p>
          <h1 className="rlp-t text-4xl sm:text-5xl text-white leading-none">Entregas</h1>
          <p className="mt-4 text-[15px] text-white/60 leading-relaxed max-w-xl">
            Aqui encontras todos os ficheiros do teu projeto. Cada entrega fica disponível para ver e descarregar assim que estiver pronta.
          </p>
        </header>

        {/* ── Resumo ── */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {[
              { l: 'Entregas',    v: projeto.entregas.length, c: 'text-white' },
              { l: 'Disponíveis', v: entregasComUrl,          c: 'text-[#2e6cf6]' },
              { l: 'Pendentes',   v: projeto.entregas.length - entregasComUrl, c: 'text-[#7c8893]' },
            ].map(k => (
              <div key={k.l} className={`${TILE} px-3 sm:px-4 py-4`}>
                <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2 truncate">{k.l}</p>
                <p className={`rlp-t text-3xl leading-none ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Explicação ao cliente */}
        {!isEditing && (
          <div className={`${CARD} mb-8 px-5 sm:px-6 py-6`}>
            <p className="rlp-m traco text-[11px] text-white/50 mb-4">Como funciona</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { n: '01', t: 'Ver e descarregar', d: 'Quando o ficheiro estiver pronto, o botão fica ativo. Até lá, a entrega aparece como pendente.' },
                { n: '02', t: 'Feedback',          d: 'Depois de veres a entrega, deixa o teu feedback diretamente no cartão. Respondemos a cada comentário.' },
                { n: '03', t: 'Revisões',          d: 'As revisões incluídas no teu projeto estão no fim desta página. Usa-as quando precisares.' },
              ].map(({ n, t, d }) => (
                <div key={n} className={`${TILE} px-4 py-4`}>
                  <span className="rlp-m text-[10px] text-[#5a8bff]">{n}</span>
                  <p className="rlp-t text-lg text-white mt-1 mb-1">{t}</p>
                  <p className="text-[14px] text-white/55 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Estado das Entregas ── */}
        {!isEditing && projeto.entregas.length > 0 && (
          <div className={`${CARD} mb-8 px-5 sm:px-6 py-5`}>
            <p className="rlp-m traco text-[11px] text-white/50 mb-4">Estado das Entregas</p>
            <div className="flex flex-col">
              {projeto.entregas.map((e, i) => {
                const est = estadoDe(e)
                return (
                  <div key={i} className="flex items-center justify-between gap-3 py-3 border-t border-white/[0.06] first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rlp-m text-[10px] text-white/35 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[15px] text-white/80 truncate">{e.titulo}</span>
                    </div>
                    <span className={`rlp-m shrink-0 rounded-full border px-3 py-1 text-[9px] ${PILL[est].cls}`}>
                      {PILL[est].label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Lista de entregas ── */}
        {projeto.entregas.length === 0 && !isEditing && (
          <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-14 text-center mb-6">
            <p className="rlp-t text-2xl text-white/80 mb-2">Ainda sem entregas</p>
            <p className="text-[15px] text-white/50 max-w-sm mx-auto leading-relaxed">
              Assim que começarmos a preparar os teus ficheiros, vais vê-los aqui com o estado de cada um.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-4">
          {projeto.entregas.map((e, i) => {
            const temUrl    = !!e.linkUrl
            const feedbacks = e.feedbacks ?? []
            const hasFeedbacks = feedbacks.length > 0
            const est = estadoDe(e)

            return (
              <article key={i} className={`${CARD} overflow-hidden ${est === 'entregue' ? 'border-[#2e6cf6]/40' : ''}`}>

                {/* ── Cabeçalho ── */}
                <div className="px-5 sm:px-6 pt-5 pb-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                        temUrl ? 'border-[#2e6cf6]/50 bg-[#2e6cf6]/15 text-[#a9c1ff]' : 'border-white/[0.1] bg-[#0c2236]/70 text-white/45'
                      }`}>
                        <IconeTipo tipo={e.tipo} />
                      </span>
                      <div className="min-w-0">
                        <p className="rlp-m text-[10px] text-white/40">
                          {String(i + 1).padStart(2, '0')}{e.tipo && !isEditing ? ` · ${TIPO_LABEL[e.tipo] ?? e.tipo}` : ''}
                        </p>
                        {isEditing && (
                          <select
                            value={e.tipo ?? ''}
                            onChange={ev => updateEntrega(i, 'tipo', ev.target.value)}
                            className="mt-1 rounded-md border border-white/[0.12] bg-[#00141f] text-[13px] text-white/75 px-3 py-1.5 focus:outline-none focus:border-[#2e6cf6]"
                          >
                            {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <button onClick={() => removeEntrega(i)}
                        className="rlp-m shrink-0 text-[10px] text-[#ff4747]/80 hover:text-[#ff4747] transition-colors py-1">
                        Remover
                      </button>
                    ) : (
                      <span className={`rlp-m shrink-0 rounded-full border px-3 py-1 text-[9px] ${PILL[est].cls}`}>
                        {PILL[est].label}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <EditableField
                        value={e.titulo}
                        isEditing={true}
                        onChange={v => updateEntrega(i, 'titulo', v)}
                        className="!rounded-md !border-white/[0.12] !bg-[#00141f]/70 !px-4 !py-2.5 focus:!border-[#2e6cf6]"
                        placeholder="Título"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <EditableField
                          value={e.formato}
                          isEditing={true}
                          onChange={v => updateEntrega(i, 'formato', v)}
                          className="!rounded-md !border-white/[0.12] !bg-[#00141f]/70 !px-4 !py-2.5 focus:!border-[#2e6cf6]"
                          placeholder="Formato (ex: MP4 · 16:9 · 4K)"
                        />
                        <EditableField
                          value={e.duracao}
                          isEditing={true}
                          onChange={v => updateEntrega(i, 'duracao', v)}
                          className="!rounded-md !border-white/[0.12] !bg-[#00141f]/70 !px-4 !py-2.5 focus:!border-[#2e6cf6]"
                          placeholder="Duração (ex: 2 a 3 min)"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={e.linkUrl ?? ''}
                          onChange={ev => updateEntrega(i, 'linkUrl', ev.target.value)}
                          placeholder="URL de download (https://...)"
                          className={INPUT}
                        />
                        {e.linkUrl && (
                          <button onClick={() => updateEntrega(i, 'linkUrl', '')}
                            title="Limpar link"
                            className="shrink-0 w-11 h-11 rounded-md border border-white/[0.12] text-white/45 hover:text-white/80 transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="rlp-t text-2xl sm:text-[28px] text-white leading-tight">{e.titulo || 'Sem título'}</h2>
                      {(e.formato || e.duracao) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {e.formato && (
                            <span className="rlp-m rounded-md border border-white/[0.1] bg-[#0c2236]/70 px-2.5 py-1 text-[9px] text-white/60">{e.formato}</span>
                          )}
                          {e.duracao && (
                            <span className="rlp-m rounded-md border border-white/[0.1] bg-[#0c2236]/70 px-2.5 py-1 text-[9px] text-white/60">{e.duracao}</span>
                          )}
                        </div>
                      )}

                      {/* Ação principal */}
                      <div className="mt-5">
                        {temUrl ? (
                          <a href={e.linkUrl} target="_blank" rel="noopener noreferrer"
                            className={`${BTN_PRIMARIO} w-full sm:w-auto py-3.5 text-[12px]`}>
                            Ver / Descarregar <span aria-hidden>↓</span>
                          </a>
                        ) : (
                          <span className="rlp-m inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-white/[0.1] bg-[#0c2236]/60 px-5 py-3.5 text-[12px] text-[#7c8893] cursor-not-allowed">
                            Em preparação
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Linha de feedback ── */}
                {!isEditing && (
                  <div className="px-5 sm:px-6 py-4 border-t border-white/[0.07] bg-[#0c2236]/40 flex flex-wrap items-center justify-between gap-3">
                    <p className="rlp-m text-[10px] text-white/45">
                      {feedbacks.length > 0
                        ? `${feedbacks.length} feedback${feedbacks.length !== 1 ? 's' : ''} registado${feedbacks.length !== 1 ? 's' : ''}`
                        : 'Sem feedback ainda'}
                    </p>

                    {/* Cliente */}
                    {!isAdmin && (
                      temUrl ? (
                        feedbackAberto !== i && (
                          <button
                            onClick={() => { setFeedbackAberto(i); setFeedbackTexto('') }}
                            className={BTN_CONTORNO}
                          >
                            Dar feedback
                          </button>
                        )
                      ) : (
                        <span className="rlp-m text-[10px] text-[#7c8893]">Feedback disponível com o ficheiro</span>
                      )
                    )}

                    {/* Admin: estado + notificação individual */}
                    {isAdmin && (
                      temUrl ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span className="rlp-m rounded-full border border-[#2e6cf6]/50 px-3 py-1 text-[9px] text-[#a9c1ff]">Ativo</span>
                            <button
                              onClick={() => notificarEntrega(i)}
                              disabled={notificandoIdx === i}
                              className={BTN_CONTORNO}
                            >
                              {notificandoIdx === i ? 'A enviar...' : 'Notificar'}
                            </button>
                          </div>
                          {e.notificacaoEnviada && (
                            <p className="rlp-m text-[9px] text-white/40">
                              Notificado em {new Date(e.notificacaoEnviada).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="rlp-m text-[10px] text-[#7c8893]">Sem URL · feedback bloqueado</span>
                      )
                    )}
                  </div>
                )}

                {/* ── Formulário de feedback (cliente) ── */}
                {!isAdmin && feedbackAberto === i && (
                  <div className="px-5 sm:px-6 py-5 border-t border-white/[0.07]">
                    <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-3">O teu feedback</p>
                    <textarea
                      value={feedbackTexto}
                      onChange={ev => setFeedbackTexto(ev.target.value)}
                      placeholder="Escreve aqui os teus comentários, aprovação ou sugestões de alteração..."
                      rows={4}
                      className={`${INPUT} resize-none leading-relaxed`}
                    />
                    {feedbackErro && (
                      <p className="mt-3 text-[14px] text-[#ff4747] leading-relaxed">{feedbackErro}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => submitFeedback(i)}
                        disabled={enviandoFeedback || !feedbackTexto.trim()}
                        className={BTN_PRIMARIO}
                      >
                        {enviandoFeedback ? 'A enviar...' : 'Enviar feedback'}
                      </button>
                      <button
                        onClick={() => { setFeedbackAberto(null); setFeedbackTexto(''); setFeedbackErro(null) }}
                        className={BTN_TEXTO}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Histórico de feedbacks ── */}
                {(hasFeedbacks || isAdmin) && (
                  <div className="px-5 sm:px-6 py-5 border-t border-white/[0.07]">
                    <p className="rlp-m traco text-[10px] text-white/45 mb-4">Registos de feedback</p>
                    {!hasFeedbacks && isAdmin && (
                      <p className="text-[14px] text-white/40">Sem feedbacks do cliente ainda.</p>
                    )}
                    <div className="flex flex-col gap-4">
                      {feedbacks.map(fb => (
                        <div key={fb.id} className="flex flex-col gap-2">

                          {/* Mensagem do cliente */}
                          <div className={`${TILE} px-4 py-3`}>
                            <div className="flex items-center justify-between mb-2 gap-4">
                              <span className="rlp-m text-[10px] text-[#a9c1ff] shrink-0">Cliente</span>
                              <div className="flex items-center gap-3">
                                <span className="rlp-m text-[9px] text-white/40 tracking-[0.1em]">{formatDateTime(fb.criadoEm)}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => removerFeedback(i, fb.id)}
                                    title="Remover feedback"
                                    className="text-[13px] text-white/35 hover:text-[#ff4747] transition-colors leading-none"
                                  >✕</button>
                                )}
                              </div>
                            </div>
                            <p className="text-[15px] text-white/80 leading-relaxed">{fb.texto}</p>
                          </div>

                          {/* Resposta do admin */}
                          {fb.resposta ? (
                            <div className="ml-4 sm:ml-6 rounded-xl border border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.08] px-4 py-3">
                              <div className="flex items-center justify-between mb-2 gap-4">
                                <span className="rlp-m text-[10px] text-[#5a8bff] shrink-0">↩ RL PROD</span>
                                <div className="flex items-center gap-3">
                                  <span className="rlp-m text-[9px] text-white/40 tracking-[0.1em]">{formatDateTime(fb.resposta.criadoEm)}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={() => removerResposta(i, fb.id)}
                                      title="Remover resposta"
                                      className="text-[13px] text-white/35 hover:text-[#ff4747] transition-colors leading-none"
                                    >✕</button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[15px] text-white/80 leading-relaxed">{fb.resposta.texto}</p>
                            </div>
                          ) : isAdmin ? (
                            respostaAberta === `${i}-${fb.id}` ? (
                              <div className="ml-4 sm:ml-6 rounded-xl border border-[#2e6cf6]/40 bg-[#00141f]/70 px-4 py-4">
                                <p className="rlp-m text-[10px] text-[#5a8bff] mb-3">Resposta</p>
                                <textarea
                                  value={respostaTexto}
                                  onChange={ev => setRespostaTexto(ev.target.value)}
                                  placeholder="Escreve a tua resposta ao cliente..."
                                  rows={3}
                                  className={`${INPUT} resize-none leading-relaxed mb-3`}
                                />
                                {respostaErro && (
                                  <p className="text-[14px] text-[#ff4747] mb-3">{respostaErro}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => submitResposta(i, fb.id)}
                                    disabled={enviandoResposta || !respostaTexto.trim()}
                                    className={BTN_PRIMARIO}
                                  >
                                    {enviandoResposta ? 'A enviar...' : 'Responder'}
                                  </button>
                                  <button
                                    onClick={() => { setRespostaAberta(null); setRespostaTexto(''); setRespostaErro(null) }}
                                    className={BTN_TEXTO}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="ml-4 sm:ml-6">
                                <button
                                  onClick={() => { setRespostaAberta(`${i}-${fb.id}`); setRespostaTexto('') }}
                                  className={BTN_CONTORNO}
                                >
                                  ↩ Responder
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="ml-4 sm:ml-6 flex items-center gap-2 px-1 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5a8bff] animate-pulse" />
                              <p className="rlp-m text-[10px] text-[#5a8bff]">A aguardar resposta da RL PROD</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </article>
            )
          })}
        </div>

        {isEditing && (
          <button onClick={addEntrega}
            className="rlp-m w-full rounded-2xl border border-dashed border-[#2e6cf6]/50 hover:border-[#2e6cf6] hover:bg-[#2e6cf6]/10
                       py-4 text-[11px] text-[#a9c1ff] transition-colors mb-6">
            + Adicionar entrega
          </button>
        )}

        {/* ── Notificação ao cliente (admin) ── */}
        {isAdmin && !isEditing && (
          <div className={`${CARD} mt-6 mb-6 px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div>
              <p className="rlp-m traco text-[11px] text-white/50 mb-2">Notificar cliente</p>
              <p className="text-[15px] text-white/60 leading-relaxed">
                {notificado
                  ? `Notificação enviada em ${notificado}`
                  : `Envia um email ao cliente com os links de download disponíveis (${entregasComUrl} entrega${entregasComUrl !== 1 ? 's' : ''}).`}
              </p>
            </div>
            <button
              onClick={notificarCliente}
              disabled={notifying || entregasComUrl === 0}
              className={notificado ? `${BTN_CONTORNO} shrink-0` : `${BTN_PRIMARIO} shrink-0`}
            >
              {notifying ? 'A enviar...' : notificado ? '✓ Enviado' : 'Notificar'}
            </button>
          </div>
        )}

        <div className={`${TILE} mb-12 px-5 py-4`}>
          <p className="text-[14px] text-white/55 leading-relaxed">
            Os ficheiros ficam disponíveis após a aprovação da entrega final. Os links expiram 30 dias após a disponibilização.
          </p>
        </div>

        {/* ── REVISÕES ── */}
        <section className={`${CARD} px-5 sm:px-6 py-6 mb-10`}>
          <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">Revisões</p>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <p className="rlp-t text-3xl sm:text-4xl text-white leading-none">
              {usadas} <span className="text-white/40">de {total}</span>
            </p>
            <p className={`rlp-m text-[10px] ${revisoesExcedidas ? 'text-[#ff4747]' : 'text-white/50'}`}>
              {revisoesExcedidas
                ? 'Limite de revisões ultrapassado'
                : `${total === 1 ? 'revisão usada' : 'revisões usadas'} · ${Math.max(0, restantes)} ${restantes === 1 ? 'restante' : 'restantes'}`}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-[#0c2236] overflow-hidden border border-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${revisoesExcedidas ? 'bg-[#ff4747]' : 'bg-[#2e6cf6]'}`}
              style={{ width: `${revisoesExcedidas ? 100 : pctRevisoes}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Incluídas</p>
              {isEditing ? (
                <EditableField value={String(total)} isEditing={true} type="number"
                  onChange={v => setRevisoes('total', v)}
                  className="!rounded-md !border-white/[0.12] !bg-[#00141f]/70 text-center focus:!border-[#2e6cf6]" />
              ) : (
                <p className="rlp-t text-3xl text-white leading-none">{total}</p>
              )}
            </div>
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Usadas</p>
              {isEditing ? (
                <EditableField value={String(usadas)} isEditing={true} type="number"
                  onChange={v => setRevisoes('usadas', v)}
                  className="!rounded-md !border-white/[0.12] !bg-[#00141f]/70 text-center focus:!border-[#2e6cf6]" />
              ) : (
                <p className="rlp-t text-3xl text-[#5a8bff] leading-none">{usadas}</p>
              )}
            </div>
            <div className={`${TILE} px-3 sm:px-4 py-4 text-center`}>
              <p className="rlp-m text-[9px] sm:text-[10px] text-white/45 mb-2">Restantes</p>
              <p className={`rlp-t text-3xl leading-none ${restantes < 0 ? 'text-[#ff4747]' : 'text-white'}`}>{restantes}</p>
            </div>
          </div>
        </section>

      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
