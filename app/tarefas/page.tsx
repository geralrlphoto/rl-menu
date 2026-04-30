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

  useEffect(() => { load() }, [])

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
            const isEditing = editId === t.id

            return (
              <div
                key={t.id}
                className={`group relative border border-white/[0.06] border-l-2 ${cfg.border} bg-white/[0.02] transition-all duration-200`}
              >
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
                        <p className="mt-1 text-[11px] text-white/30 leading-relaxed">{t.descricao}</p>
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
                      </div>
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
