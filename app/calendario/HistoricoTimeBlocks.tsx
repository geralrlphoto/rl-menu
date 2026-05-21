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
  open, onClose, events,
}: {
  open: boolean
  onClose: () => void
  events: CalEvent[]
}) {
  const [items, setItems] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
    setLoading(true)
    fetch('/api/time-blocks/historico', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open])

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
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">✕</button>
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
                    <button
                      onClick={() => setExpandedId(isOpen ? null : item.evento_id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
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

                    {isOpen && (
                      <div className="border-t border-white/[0.05] px-4 py-3 flex flex-col gap-1.5">
                        {item.blocks
                          .sort((a, b) => (a.data + a.hora_inicio).localeCompare(b.data + b.hora_inicio))
                          .map(b => (
                            <div key={b.id}
                              className="flex items-center gap-3 text-xs px-2 py-1.5 rounded"
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
