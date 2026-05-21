'use client'

import { useEffect, useState } from 'react'
import type { CalEvent } from './CalendarClient'

type HistoricoBlock = {
  id: string
  data: string
  categoria: string
  titulo: string
  cor: string
  hora_inicio: string
  hora_fim: string
  duracao_minutos: number
  evento_id: string
  tempo_real_segundos: number
  timer_state: 'idle' | 'running' | 'paused' | 'completed'
}

type HistoricoItem = {
  evento_id: string
  total_segundos: number
  sessoes: number
  dias: number
  ultima_data: string
  blocks: HistoricoBlock[]
}

function fmtTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function fmtDateShort(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(dt.getDate()).padStart(2,'0')} ${meses[dt.getMonth()]}`
}

export default function HistoricoTimeBlocks({
  open, onClose, events, refreshSignal = 0,
}: {
  open: boolean
  onClose: () => void
  events: CalEvent[]
  /** When this number changes and the modal is open, the list reloads.
   *  Used by the parent TimeBlocks to refresh history after a block is
   *  deleted/added in the daily list. */
  refreshSignal?: number
}) {
  const [items, setItems] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() {
    setLoading(true)
    try {
      const res = await fetch('/api/time-blocks/historico', { cache: 'no-store' })
      const d = await res.json()
      setItems(d.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteEvent(item: HistoricoItem) {
    const label = (() => {
      const ev = eventsById.get(item.evento_id)
      if (!ev) return 'este casamento'
      if (ev.referencia && ev.cliente) return `${ev.referencia} · ${ev.cliente}`
      return ev.cliente || ev.referencia || 'este casamento'
    })()
    const ok = confirm(
      `Apagar TODAS as ${item.sessoes} sessão${item.sessoes === 1 ? '' : 'ões'} de "${label}"?\n\n` +
      `Total: ${Math.floor(item.total_segundos / 3600)}h${String(Math.floor((item.total_segundos % 3600) / 60)).padStart(2, '0')}m de tempo registado.\n\n` +
      `Esta ação não pode ser desfeita.`
    )
    if (!ok) return
    setBusy(true)
    try {
      // Optimistic update
      setItems(prev => prev.filter(i => i.evento_id !== item.evento_id))
      // Delete each block linked to this event
      await Promise.all(item.blocks.map(b =>
        fetch(`/api/time-blocks/${b.id}`, { method: 'DELETE' })
      ))
      // Reload to sync with server state
      await reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteSession(item: HistoricoItem, block: HistoricoBlock) {
    const ok = confirm(`Apagar a sessão de ${block.data.slice(0,10)} (${block.hora_inicio.slice(0,5)}–${block.hora_fim.slice(0,5)})?`)
    if (!ok) return
    setBusy(true)
    try {
      // Optimistic update
      setItems(prev => prev.map(i => {
        if (i.evento_id !== item.evento_id) return i
        const remaining = i.blocks.filter(b => b.id !== block.id)
        if (remaining.length === 0) return null as any
        const total = remaining.reduce((acc, b) => acc + (b.tempo_real_segundos ?? 0), 0)
        const dias = new Set(remaining.map(b => b.data)).size
        const ultima = remaining.reduce((acc, b) => b.data > acc ? b.data : acc, remaining[0].data)
        return { ...i, blocks: remaining, sessoes: remaining.length, total_segundos: total, dias, ultima_data: ultima }
      }).filter(Boolean) as HistoricoItem[])
      await fetch(`/api/time-blocks/${block.id}`, { method: 'DELETE' })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const eventsById = new Map(events.map(e => [e.id, e]))
  function eventLabel(id: string): string {
    const ev = eventsById.get(id)
    if (!ev) return 'Casamento (sem dados)'
    if (ev.referencia && ev.cliente) return `${ev.referencia} · ${ev.cliente}`
    return ev.cliente || ev.referencia || 'Casamento'
  }
  function eventDate(id: string): string | null {
    return eventsById.get(id)?.data_evento ?? null
  }

  useEffect(() => {
    if (!open) return
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshSignal])

  if (!open) return null

  const grandTotal = items.reduce((acc, i) => acc + i.total_segundos, 0)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="w-full max-w-3xl bg-[#111] rounded-2xl p-6 max-h-[90vh] flex flex-col"
        style={{ border: '1px solid rgba(201,168,76,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/60 uppercase mb-1">📊 Histórico</div>
            <h2 className="text-xl font-light text-white tracking-wide">Tempo por casamento</h2>
            <p className="text-[11px] text-white/40 tracking-wider mt-1">
              {items.length} casamento{items.length === 1 ? '' : 's'} · {fmtTotal(grandTotal)} no total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reload}
              disabled={loading || busy}
              title="Recarregar do servidor"
              className="text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:border-white/30 transition-colors disabled:opacity-40">
              🔄 Recarregar
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">✕</button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="text-xs text-white/30 py-6 text-center">A carregar…</div>
          ) : items.length === 0 ? (
            <div className="text-xs text-white/30 italic py-12 text-center">
              Ainda não há tempo registado em nenhum casamento.<br/>
              Cria um bloco de <span className="text-[#C9A84C]/70">Editar trabalhos</span> ligado a um casamento e começa o timer.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map(item => {
                const isOpen = expandedId === item.evento_id
                const label = eventLabel(item.evento_id)
                const evDate = eventDate(item.evento_id)
                return (
                  <li key={item.evento_id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-full flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : item.evento_id)}
                        className="flex-1 min-w-0 text-left px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{label}</div>
                          <div className="text-[10px] text-white/40 tracking-wider mt-0.5">
                            {item.sessoes} sessão{item.sessoes === 1 ? '' : 'ões'} · {item.dias} dia{item.dias === 1 ? '' : 's'} · último em {fmtDateShort(item.ultima_data)}
                            {evDate && <> · casamento em {fmtDateShort(evDate)}</>}
                          </div>
                        </div>
                        <div className="font-mono text-lg tabular-nums text-[#C9A84C]">
                          {fmtTotal(item.total_segundos)}
                        </div>
                        <span className="text-white/30">{isOpen ? '▾' : '▸'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(item)}
                        disabled={busy}
                        title="Apagar todo o histórico deste casamento"
                        className="w-9 h-9 mr-3 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                        ✕
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-white/[0.05] px-4 py-3 flex flex-col gap-1.5">
                        {item.blocks
                          .sort((a, b) => (a.data + a.hora_inicio).localeCompare(b.data + b.hora_inicio))
                          .map(b => (
                            <div key={b.id}
                              className="flex items-center gap-3 text-xs px-2 py-1.5 rounded group"
                              style={{ background: b.cor + '0A', border: `1px solid ${b.cor}25` }}>
                              <span className="w-1 h-4 rounded" style={{ background: b.cor }} />
                              <span className="text-white/65 w-20 flex-shrink-0">{fmtDateShort(b.data)}</span>
                              <span className="text-white/45 w-28 flex-shrink-0">
                                {b.hora_inicio.slice(0,5)} – {b.hora_fim.slice(0,5)}
                              </span>
                              <span className="text-white/70 flex-1 truncate">{b.titulo}</span>
                              <span className="font-mono text-white/85 tabular-nums">
                                {fmtTotal(b.tempo_real_segundos)}
                              </span>
                              <button
                                onClick={() => handleDeleteSession(item, b)}
                                disabled={busy}
                                title="Apagar só esta sessão"
                                className="w-6 h-6 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100">
                                ✕
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 text-[10px] text-white/30 tracking-wider">
          O tempo é acumulado automaticamente em cada ▶/⏸. ⏹ guarda o tempo antes de repor o countdown.
        </div>
      </div>
    </div>
  )
}
