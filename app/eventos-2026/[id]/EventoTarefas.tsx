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
  hora: string | null
  evento_id: string | null
}

const STATUS_COL: Record<Status, { bg: string; border: string; text: string }> = {
  NOVA:      { bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)',  text: '#60A5FA' },
  PENDENTE:  { bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.28)',  text: '#FB923C' },
  CONCLUIDA: { bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.28)',  text: '#86EFAC' },
}

function fmtDateShort(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(dt.getDate()).padStart(2,'0')} ${meses[dt.getMonth()]}`
}

export default function EventoTarefas({ eventoId }: { eventoId: string }) {
  const [tarefas, setTarefas]   = useState<Tarefa[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [novoTitulo, setNT]     = useState('')
  const [novaData, setND]       = useState('')
  const [novaHora, setNH]       = useState('')
  const [novaDesc, setNDesc]    = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eventoId])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/tarefas', { cache: 'no-store' })
      const d = await res.json()
      const all: Tarefa[] = d.tarefas ?? []
      setTarefas(all.filter(t => t.evento_id === eventoId))
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!novoTitulo.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:     novoTitulo,
          descricao:  novaDesc || null,
          status:     'NOVA',
          data_prazo: novaData || null,
          hora:       novaHora || null,
          evento_id:  eventoId,
        }),
      })
      const d = await res.json()
      if (d.tarefa) {
        setTarefas(prev => [...prev, d.tarefa])
        setNT(''); setND(''); setNH(''); setNDesc('')
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(t: Tarefa) {
    const newStatus: Status = t.status === 'CONCLUIDA' ? 'NOVA' : 'CONCLUIDA'
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x))
    await fetch(`/api/tarefas/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta tarefa?')) return
    setTarefas(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
  }

  const pendentes = tarefas.filter(t => t.status !== 'CONCLUIDA').length
  const concluidas = tarefas.filter(t => t.status === 'CONCLUIDA').length

  // Sort: not done first (by date asc), then done (by date desc)
  const sorted = [...tarefas].sort((a, b) => {
    if (a.status === 'CONCLUIDA' && b.status !== 'CONCLUIDA') return 1
    if (a.status !== 'CONCLUIDA' && b.status === 'CONCLUIDA') return -1
    const da = a.data_prazo ?? '9999-12-31'
    const db = b.data_prazo ?? '9999-12-31'
    return a.status === 'CONCLUIDA' ? db.localeCompare(da) : da.localeCompare(db)
  })

  return (
    <section className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.18)', boxShadow: '0 0 24px rgba(201,168,76,0.07), 0 0 6px rgba(201,168,76,0.05)' }}>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] tracking-[0.35em] uppercase text-[#C9A84C]/75">Tarefas deste casamento</h2>
          {!loading && tarefas.length > 0 && (
            <span className="text-[10px] text-white/30 tracking-wider">
              {pendentes} pendente{pendentes === 1 ? '' : 's'}{concluidas > 0 && ` · ${concluidas} feita${concluidas === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
            + Nova Tarefa
          </button>
        )}
      </div>

      {/* Add form (inline) */}
      {adding && (
        <div className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            autoFocus
            value={novoTitulo}
            onChange={e => setNT(e.target.value)}
            placeholder="Título da tarefa"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40"
            onKeyDown={e => { if (e.key === 'Enter' && novoTitulo.trim() && !saving) handleCreate() }}
          />
          <div className="flex gap-2">
            <input type="date" value={novaData} onChange={e => setND(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
            <input type="time" value={novaHora} onChange={e => setNH(e.target.value)}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
          </div>
          <textarea value={novaDesc} onChange={e => setNDesc(e.target.value)}
            placeholder="Notas (opcional)" rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setNT(''); setND(''); setNH(''); setNDesc('') }}
              className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70">Cancelar</button>
            <button onClick={handleCreate} disabled={saving || !novoTitulo.trim()}
              className="px-4 py-1.5 rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
              {saving ? 'A guardar…' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-xs text-white/30">A carregar tarefas…</div>
      ) : sorted.length === 0 && !adding ? (
        <div className="text-xs text-white/30 italic">Sem tarefas para este casamento. Clica em <span className="text-[#C9A84C]/70">+ Nova Tarefa</span> para começar.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map(t => {
            const col = STATUS_COL[t.status]
            const done = t.status === 'CONCLUIDA'
            return (
              <li key={t.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: done ? 'rgba(255,255,255,0.02)' : col.bg,
                  border: `1px solid ${done ? 'rgba(255,255,255,0.05)' : col.border}`,
                }}>
                <button onClick={() => toggleStatus(t)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    border: `1px solid ${done ? 'rgba(134,239,172,0.5)' : 'rgba(255,255,255,0.2)'}`,
                    background: done ? 'rgba(74,222,128,0.20)' : 'transparent',
                    color: done ? '#86EFAC' : 'transparent',
                  }}
                  title={done ? 'Marcar por fazer' : 'Marcar como feita'}>
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate"
                    style={{
                      color: done ? 'rgba(255,255,255,0.35)' : 'white',
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                    {t.titulo}
                  </div>
                  {(t.data_prazo || t.hora || t.descricao) && (
                    <div className="text-[10px] text-white/35 tracking-wider mt-0.5 truncate">
                      {t.data_prazo && fmtDateShort(t.data_prazo)}
                      {t.hora && (t.data_prazo ? ' · ' : '') + t.hora.slice(0, 5)}
                      {t.descricao && ((t.data_prazo || t.hora) ? ' · ' : '') + t.descricao}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(t.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs flex-shrink-0"
                  title="Eliminar">✕</button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="text-[10px] text-white/25 tracking-wider">
        💡 Vê todas as tarefas no <Link href="/calendario" className="text-[#C9A84C]/60 hover:text-[#C9A84C]">calendário</Link>.
      </div>
    </section>
  )
}
