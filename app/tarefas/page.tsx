'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Status = 'NOVA' | 'PENDENTE' | 'CONCLUIDA'

type Tarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: Status
  data_prazo: string | null
  created_at: string
  updated_at: string
}

type Freelancer = {
  id: string
  nome: string | null
  email: string | null
  status: string | null
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string; badge: string; border: string }> = {
  NOVA:     { label: 'NOVA TAREFA', dot: 'bg-blue-400',   badge: 'text-blue-400/80 bg-blue-500/10',   border: 'border-l-blue-500/60' },
  PENDENTE: { label: 'PENDENTE',    dot: 'bg-orange-400', badge: 'text-orange-400/80 bg-orange-500/10', border: 'border-l-orange-500/60' },
  CONCLUIDA:{ label: 'CONCLUÍDA',   dot: 'bg-green-400',  badge: 'text-green-400/80 bg-green-500/10',  border: 'border-l-green-500/60' },
}

const STATUS_ORDER: Status[] = ['NOVA', 'PENDENTE', 'CONCLUIDA']

function fmtDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(dt.getDate()).padStart(2,'0')} ${meses[dt.getMonth()]} ${dt.getFullYear()}`
}

function isOverdue(data_prazo: string | null, status: Status) {
  if (!data_prazo || status === 'CONCLUIDA') return false
  return new Date(data_prazo + 'T00:00:00') < new Date(new Date().toDateString())
}

/** Dias úteis (skip Sat/Sun) entre hoje e data_prazo. Negativo se prazo passou. */
function workingDaysUntil(data_prazo: string | null): number | null {
  if (!data_prazo) return null
  const target = new Date(data_prazo + 'T00:00:00')
  const today  = new Date(new Date().toDateString())
  if (target.getTime() === today.getTime()) return 0
  const past = target < today
  let count = 0
  const cur = new Date(today)
  while ((past ? cur > target : cur < target)) {
    cur.setDate(cur.getDate() + (past ? -1 : 1))
    const wd = cur.getDay()
    if (wd !== 0 && wd !== 6) count++
  }
  return past ? -count : count
}

/** True se faltam <= 2 dias úteis (mas ainda dentro do prazo) — alerta amarelo. */
function isAtRisk(data_prazo: string | null, status: Status): boolean {
  if (!data_prazo || status === 'CONCLUIDA') return false
  const d = workingDaysUntil(data_prazo)
  return d !== null && d >= 0 && d <= 2
}

export default function TarefasPage() {
  const [tarefas, setTarefas]       = useState<Tarefa[]>([])
  const [loading, setLoading]       = useState(true)
  const [filtro, setFiltro]         = useState<Status | 'TODAS'>('TODAS')

  // Form nova tarefa
  const [showForm, setShowForm]     = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoDesc, setNovoDesc]     = useState('')
  const [novoPrazo, setNovoPrazo]   = useState('')
  const [novoStatus, setNovoStatus] = useState<Status>('NOVA')
  const [saving, setSaving]         = useState(false)

  // Edição inline
  const [editId, setEditId]         = useState<string | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editDesc, setEditDesc]     = useState('')
  const [editPrazo, setEditPrazo]   = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Resposta a mensagens dos noivos
  const [replyId, setReplyId]       = useState<string | null>(null)
  const [replyText, setReplyText]   = useState('')
  const [replySending, setReplySending] = useState(false)

  // Enviar tarefa a membros da equipa
  const [freelancers, setFreelancers]   = useState<Freelancer[]>([])
  const [assignId, setAssignId]         = useState<string | null>(null)
  const [assignSelection, setAssignSelection] = useState<Set<string>>(new Set())
  const [assignSending, setAssignSending]     = useState(false)
  const [assignDone, setAssignDone]           = useState<{ tarefaId: string; nomes: string[] } | null>(null)
  async function handleSendReply(tarefaId: string) {
    if (!replyText.trim()) return
    setReplySending(true)
    try {
      await fetch(`/api/tarefas/${encodeURIComponent(tarefaId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta: replyText.trim(), status: 'CONCLUIDA' }),
      })
      setReplyId(null); setReplyText('')
      load()
    } catch { /* ignore */ }
    setReplySending(false)
  }

  useEffect(() => { load() }, [])

  /* Carrega lista de membros para o popover de Enviar tarefa */
  useEffect(() => {
    fetch('/api/freelancers')
      .then(r => r.json())
      .then(d => {
        const list: Freelancer[] = Array.isArray(d?.freelancers) ? d.freelancers : []
        // ordenar por nome (já vem ordenado por order_index + nome no API)
        setFreelancers(list.filter(f => f?.nome))
      })
      .catch(() => setFreelancers([]))
  }, [])

  /* Abre o popover de envio para uma tarefa */
  function openAssign(t: Tarefa) {
    setAssignId(t.id)
    setAssignSelection(new Set())
  }

  /* Toggle membro na seleção */
  function toggleMember(id: string) {
    setAssignSelection(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  /* Envia o email a todos os selecionados (fan-out paralelo) */
  async function handleSendToMembers(t: Tarefa) {
    if (assignSelection.size === 0) return
    setAssignSending(true)
    const ids = Array.from(assignSelection)
    const prazoLabel = t.data_prazo ? fmtDate(t.data_prazo) ?? '' : ''
    const results = await Promise.all(ids.map(fid =>
      fetch('/api/send-nova-tarefa-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freelancer_id: fid,
          titulo: t.titulo,
          descricao: t.descricao ?? '',
          prazo: prazoLabel,
          prioridade: 'NORMAL',
        }),
      }).then(r => r.ok ? fid : null).catch(() => null)
    ))
    const okIds = results.filter(Boolean) as string[]
    const nomes = okIds.map(id => freelancers.find(f => f.id === id)?.nome ?? id)
    setAssignSending(false)
    setAssignId(null)
    setAssignSelection(new Set())
    setAssignDone({ tarefaId: t.id, nomes })
    setTimeout(() => setAssignDone(null), 3500)
  }

  function load() {
    setLoading(true)
    fetch('/api/tarefas')
      .then(r => r.json())
      .then(d => { setTarefas(d.tarefas ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function handleCreate() {
    if (!novoTitulo.trim()) return
    setSaving(true)
    const res = await fetch('/api/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: novoTitulo, descricao: novoDesc, status: novoStatus, data_prazo: novoPrazo || null }),
    })
    const d = await res.json()
    if (d.tarefa) {
      setTarefas(prev => [d.tarefa, ...prev])
      setNovoTitulo(''); setNovoDesc(''); setNovoPrazo(''); setNovoStatus('NOVA')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleStatusChange(tarefa: Tarefa, status: Status) {
    setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, status } : t))
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  function openEdit(t: Tarefa) {
    setEditId(t.id)
    setEditTitulo(t.titulo)
    setEditDesc(t.descricao ?? '')
    setEditPrazo(t.data_prazo ?? '')
  }

  async function handleEditSave(t: Tarefa) {
    setEditSaving(true)
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, titulo: editTitulo, descricao: editDesc || null, data_prazo: editPrazo || null } : x))
    await fetch(`/api/tarefas/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: editTitulo, descricao: editDesc || null, data_prazo: editPrazo || null }),
    })
    setEditId(null)
    setEditSaving(false)
  }

  async function handleDelete(id: string) {
    setTarefas(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
  }

  const visíveis = filtro === 'TODAS' ? tarefas : tarefas.filter(t => t.status === filtro)
  const counts: Record<string, number> = { TODAS: tarefas.length }
  STATUS_ORDER.forEach(s => { counts[s] = tarefas.filter(t => t.status === s).length })

  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      {/* Voltar */}
      <Link href="/photo" className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-12 uppercase">
        ‹ Voltar ao Menu
      </Link>

      {/* Header */}
      <header className="mb-10">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">Tarefas</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="group flex items-center gap-2 px-4 py-2 border border-gold/30 hover:border-gold/60 bg-gold/5 hover:bg-gold/10 transition-all duration-200"
          >
            <span className="text-gold/70 group-hover:text-gold text-lg leading-none">{showForm ? '×' : '+'}</span>
            <span className="text-[10px] tracking-[0.25em] text-gold/60 group-hover:text-gold uppercase">Nova Tarefa</span>
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-gold/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {/* Form nova tarefa */}
      {showForm && (
        <div className="mb-8 border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col gap-4">
          <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase">Nova Tarefa</p>
          <input
            type="text"
            value={novoTitulo}
            onChange={e => setNovoTitulo(e.target.value)}
            placeholder="Título da tarefa"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
          />
          <textarea
            value={novoDesc}
            onChange={e => setNovoDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-4 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none transition-colors resize-none"
          />
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase">Prazo</span>
              <input
                type="date"
                value={novoPrazo}
                onChange={e => setNovoPrazo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-3 py-2 text-sm text-white/60 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase">Estado</span>
              <select
                value={novoStatus}
                onChange={e => setNovoStatus(e.target.value as Status)}
                className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-3 py-2 text-sm text-white/60 focus:outline-none transition-colors"
              >
                {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={!novoTitulo.trim() || saving}
              className="flex-1 py-2.5 bg-gold/80 hover:bg-gold text-black text-[10px] tracking-[0.3em] font-semibold uppercase transition-colors disabled:opacity-40"
            >
              {saving ? '…' : 'Criar Tarefa'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNovoTitulo(''); setNovoDesc(''); setNovoPrazo('') }}
              className="px-4 text-[10px] text-white/30 hover:text-white/60 border border-white/10 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-px mb-6">
        {(['TODAS', ...STATUS_ORDER] as (Status | 'TODAS')[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`flex-1 py-2 text-[9px] tracking-[0.25em] uppercase transition-colors border
              ${filtro === f
                ? 'bg-white/[0.06] border-white/15 text-white/70'
                : 'bg-transparent border-white/[0.05] text-white/25 hover:text-white/40 hover:border-white/10'
              }`}
          >
            {f === 'TODAS' ? 'Todas' : STATUS_CONFIG[f].label}
            <span className="ml-1.5 opacity-50">({counts[f] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-[10px] tracking-[0.4em] text-white/20 uppercase">A carregar…</div>
      ) : visíveis.length === 0 ? (
        <div className="text-center py-20 text-[10px] tracking-[0.4em] text-white/15 uppercase">Sem tarefas</div>
      ) : (
        <div className="flex flex-col gap-px">
          {visíveis.map(t => {
            const cfg = STATUS_CONFIG[t.status]
            const overdue = isOverdue(t.data_prazo, t.status)
            const atRisk  = !overdue && isAtRisk(t.data_prazo, t.status)
            const daysLeft = workingDaysUntil(t.data_prazo)
            const isEditing = editId === t.id

            return (
              <div
                key={t.id}
                className={`group relative border ${
                  overdue ? 'border-red-500/40 border-l-2 border-l-red-500' :
                  atRisk  ? 'border-amber-500/40 border-l-2 border-l-amber-400' :
                  `border-white/[0.06] border-l-2 ${cfg.border}`
                } ${overdue ? 'bg-red-500/[0.04]' : atRisk ? 'bg-amber-500/[0.03]' : 'bg-white/[0.02]'} transition-all duration-200`}
              >
                {atRisk && !isEditing && (
                  <div className="absolute -top-px right-3 px-2 py-0.5 bg-amber-500/90 text-black text-[9px] tracking-widest font-bold uppercase">
                    ⚠ Faltam {daysLeft}d
                  </div>
                )}
                {overdue && !isEditing && (
                  <div className="absolute -top-px right-3 px-2 py-0.5 bg-red-500/90 text-white text-[9px] tracking-widest font-bold uppercase">
                    Atrasada {Math.abs(daysLeft ?? 0)}d
                  </div>
                )}
                {isEditing ? (
                  /* ── Modo edição ── */
                  <div className="p-5 flex flex-col gap-3">
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={e => setEditTitulo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Descrição (opcional)"
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-3 py-2 text-sm text-white/60 placeholder-white/20 focus:outline-none resize-none"
                    />
                    <input
                      type="date"
                      value={editPrazo}
                      onChange={e => setEditPrazo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 px-3 py-2 text-sm text-white/60 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(t)}
                        disabled={editSaving}
                        className="flex-1 py-2 bg-gold/80 hover:bg-gold text-black text-[10px] tracking-[0.25em] font-semibold uppercase transition-colors disabled:opacity-40"
                      >
                        {editSaving ? '…' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="px-4 text-[10px] text-white/30 hover:text-white/60 border border-white/10 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Vista normal ── */
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Status dot */}
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-medium leading-snug ${t.status === 'CONCLUIDA' ? 'line-through text-white/30' : 'text-white/80'}`}>
                          {t.titulo}
                        </p>
                        {/* Actions — aparecem no hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openAssign(t)}
                            className="p-1 text-white/25 hover:text-gold transition-colors"
                            title="Enviar a Membro"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="5" width="18" height="14" rx="2"/>
                              <path d="M3 7l9 6 9-6"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1 text-white/25 hover:text-gold transition-colors"
                            title="Editar"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 text-white/25 hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {t.descricao && (
                        <p className="mt-1 text-[11px] text-white/30 leading-relaxed whitespace-pre-line">{t.descricao}</p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                        {/* Badge de status clicável (roda entre estados) */}
                        <button
                          onClick={() => {
                            const idx = STATUS_ORDER.indexOf(t.status)
                            const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
                            handleStatusChange(t, next)
                          }}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase transition-all hover:ring-1 hover:ring-white/20 ${cfg.badge}`}
                          title="Clique para mudar estado"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </button>

                        {/* Prazo */}
                        {t.data_prazo && (
                          <span className={`text-[10px] tracking-wider ${overdue ? 'text-red-400/70' : 'text-white/25'}`}>
                            {overdue ? '⚠ ' : ''}{fmtDate(t.data_prazo)}
                          </span>
                        )}

                        {/* Botão Responder — só para mensagens dos noivos pendentes */}
                        {t.id.startsWith('noivos_msg::') && t.status !== 'CONCLUIDA' && replyId !== t.id && (
                          <button
                            onClick={() => { setReplyId(t.id); setReplyText('') }}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] tracking-widest font-bold uppercase text-black bg-gold/90 hover:bg-gold transition-colors"
                          >
                            ✉ Responder
                          </button>
                        )}

                        {/* Botão Enviar a Membros — só p/ tarefas reais (não msg
                            de noivos) e quando o popover ainda não está aberto. */}
                        {!t.id.startsWith('noivos_msg::') && assignId !== t.id && (
                          <button
                            onClick={() => openAssign(t)}
                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] tracking-widest font-bold uppercase text-gold border border-gold/40 bg-gold/10 hover:bg-gold/20 hover:border-gold/70 transition-all"
                            title="Enviar tarefa por email a membros da equipa"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="5" width="18" height="14" rx="2"/>
                              <path d="M3 7l9 6 9-6"/>
                            </svg>
                            Enviar
                          </button>
                        )}
                      </div>

                      {/* Painel: Enviar a Membros da Equipa */}
                      {assignId === t.id && (
                        <div className="mt-4 p-4 border border-gold/30 rounded-lg bg-gold/[0.03]">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] tracking-widest uppercase text-gold/70 font-semibold">
                              ✉ Enviar tarefa a membros
                            </p>
                            <button
                              onClick={() => { setAssignId(null); setAssignSelection(new Set()) }}
                              className="text-[10px] tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors"
                            >
                              ✕ Fechar
                            </button>
                          </div>

                          {freelancers.length === 0 ? (
                            <p className="text-[11px] text-white/40 py-3 text-center">
                              Ainda não há membros registados.
                            </p>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                                {freelancers.map(f => {
                                  const checked = assignSelection.has(f.id)
                                  const noEmail = !f.email
                                  return (
                                    <button
                                      key={f.id}
                                      type="button"
                                      disabled={noEmail}
                                      onClick={() => toggleMember(f.id)}
                                      className={`flex items-center gap-2.5 px-3 py-2 border text-left transition-all
                                        ${checked
                                          ? 'border-gold/50 bg-gold/[0.08]'
                                          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'}
                                        ${noEmail ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                      title={noEmail ? 'Membro sem email definido' : ''}
                                    >
                                      <span className={`w-3.5 h-3.5 shrink-0 border flex items-center justify-center
                                        ${checked ? 'border-gold bg-gold' : 'border-white/30 bg-transparent'}`}>
                                        {checked && (
                                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                          </svg>
                                        )}
                                      </span>
                                      <span className="flex-1 min-w-0">
                                        <span className="block text-[12.5px] text-white/80 truncate">{f.nome}</span>
                                        {f.email && (
                                          <span className="block text-[10px] text-white/35 truncate">{f.email}</span>
                                        )}
                                        {!f.email && (
                                          <span className="block text-[10px] text-red-400/60">sem email</span>
                                        )}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-2">
                                <span className="text-[10px] tracking-widest uppercase text-white/30">
                                  {assignSelection.size} selecionado{assignSelection.size === 1 ? '' : 's'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => { setAssignId(null); setAssignSelection(new Set()) }}
                                    disabled={assignSending}
                                    className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-white/40 hover:text-white/70 border border-white/10 rounded transition-colors disabled:opacity-30"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleSendToMembers(t)}
                                    disabled={assignSending || assignSelection.size === 0}
                                    className="px-4 py-1.5 text-[10px] tracking-widest font-bold uppercase text-black bg-gold hover:brightness-110 rounded transition-all disabled:opacity-40"
                                  >
                                    {assignSending
                                      ? 'A enviar…'
                                      : `Enviar ${assignSelection.size > 0 ? `(${assignSelection.size})` : ''} →`}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Feedback de envio bem-sucedido */}
                      {assignDone?.tarefaId === t.id && (
                        <div className="mt-3 p-2.5 border border-emerald-500/30 bg-emerald-500/[0.06] rounded">
                          <p className="text-[11px] text-emerald-300/80">
                            ✓ Tarefa enviada por email a {assignDone.nomes.length > 0 ? assignDone.nomes.join(', ') : '—'}
                          </p>
                        </div>
                      )}

                      {/* Painel de resposta inline */}
                      {t.id.startsWith('noivos_msg::') && replyId === t.id && (
                        <div className="mt-4 p-4 border border-gold/30 rounded-lg bg-gold/[0.03]">
                          <p className="text-[10px] tracking-widest uppercase text-gold/70 font-semibold mb-3">
                            ✉ Responder à noiva — enviado por e-mail
                          </p>
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Escreve a tua resposta…"
                            rows={4}
                            maxLength={3000}
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 focus:border-gold/40 px-3 py-2.5 text-sm text-white/85 placeholder-white/25 focus:outline-none rounded resize-none"
                          />
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setReplyId(null); setReplyText('') }}
                              disabled={replySending}
                              className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-white/40 hover:text-white/70 border border-white/10 rounded transition-colors disabled:opacity-30"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSendReply(t.id)}
                              disabled={replySending || !replyText.trim()}
                              className="px-4 py-1.5 text-[10px] tracking-widest font-bold uppercase text-black bg-gold hover:brightness-110 rounded transition-all disabled:opacity-40"
                            >
                              {replySending ? 'A enviar…' : 'Enviar e Concluir →'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
