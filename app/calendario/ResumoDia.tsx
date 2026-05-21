'use client'

import { useMemo } from 'react'
import type { CalEvent } from './CalendarClient'

type TimerState = 'idle' | 'running' | 'paused' | 'completed'

type Block = {
  id: string
  data: string
  categoria: string
  titulo: string
  cor: string
  hora_inicio: string
  hora_fim: string
  duracao_minutos: number
  evento_id?: string | null
  tempo_real_segundos?: number
  timer_state: TimerState
  timer_started_at?: string | null
  timer_elapsed_seconds?: number
}

function fmtTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function fmtDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function ResumoDia({
  open, onClose, day, blocks, events,
}: {
  open: boolean
  onClose: () => void
  day: string
  blocks: Block[]
  events: CalEvent[]
}) {
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events])

  // Aggregations
  const stats = useMemo(() => {
    let totalPlanSec = 0
    let totalRealSec = 0
    const byCategoria = new Map<string, { cor: string; titulo: string; planSec: number; realSec: number }>()
    const byCasamento = new Map<string, { cor: string; planSec: number; realSec: number; blocos: number }>()

    for (const b of blocks) {
      const planSec = Math.max(0, (Number(b.duracao_minutos) || 0) * 60)
      const realSec = Math.max(0, Number(b.tempo_real_segundos) || 0)
      totalPlanSec += planSec
      totalRealSec += realSec

      const cat = byCategoria.get(b.categoria) ?? { cor: b.cor, titulo: b.titulo, planSec: 0, realSec: 0 }
      cat.planSec += planSec
      cat.realSec += realSec
      cat.titulo  = b.titulo  // last one wins (fine for display)
      cat.cor     = b.cor
      byCategoria.set(b.categoria, cat)

      if (b.evento_id) {
        const ev = byCasamento.get(b.evento_id) ?? { cor: b.cor, planSec: 0, realSec: 0, blocos: 0 }
        ev.planSec += planSec
        ev.realSec += realSec
        ev.blocos  += 1
        ev.cor      = b.cor
        byCasamento.set(b.evento_id, ev)
      }
    }

    const pct = totalPlanSec > 0 ? Math.round((totalRealSec / totalPlanSec) * 100) : 0
    return {
      totalPlanSec, totalRealSec, pct,
      byCategoria: Array.from(byCategoria.entries()).map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => b.realSec - a.realSec),
      byCasamento: Array.from(byCasamento.entries()).map(([evId, v]) => ({ evId, ...v }))
        .sort((a, b) => b.realSec - a.realSec),
    }
  }, [blocks])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#111] rounded-2xl p-6 max-h-[90vh] flex flex-col"
        style={{ border: '1px solid rgba(201,168,76,0.25)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/60 uppercase mb-1">📋 Resumo do dia</div>
            <h2 className="text-xl font-light text-white tracking-wide capitalize">{fmtDateLong(day)}</h2>
            <p className="text-[11px] text-white/40 tracking-wider mt-1">
              {blocks.length} bloco{blocks.length === 1 ? '' : 's'} planeados · {stats.byCasamento.length} casamento{stats.byCasamento.length === 1 ? '' : 's'} trabalhados
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 flex flex-col gap-5">

          {/* Top stat: real vs planeado */}
          <div className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-[10px] tracking-widest text-white/40 uppercase">Real / Planeado</div>
              <div className="font-mono text-2xl tabular-nums text-white mt-1">
                {fmtTotal(stats.totalRealSec)} <span className="text-white/40 text-base">/ {fmtTotal(stats.totalPlanSec)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] tracking-widest text-white/40 uppercase">Cumprido</div>
              <div className="font-mono text-2xl tabular-nums mt-1"
                style={{ color: stats.pct >= 80 ? '#86EFAC' : stats.pct >= 50 ? '#FB923C' : '#F87171' }}>
                {stats.pct}%
              </div>
            </div>
          </div>

          {/* Per categoria */}
          {stats.byCategoria.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-2">Por categoria</div>
              <ul className="flex flex-col gap-1.5">
                {stats.byCategoria.map(c => {
                  const pct = c.planSec > 0 ? Math.min(100, (c.realSec / c.planSec) * 100) : 0
                  return (
                    <li key={c.key} className="relative rounded-lg overflow-hidden"
                      style={{ background: c.cor + '10', border: `1px solid ${c.cor}30` }}>
                      <div className="absolute inset-y-0 left-0 transition-all"
                        style={{ width: `${pct}%`, background: c.cor + '20' }} />
                      <div className="relative flex items-center gap-3 px-3 py-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.cor }} />
                        <span className="flex-1 text-sm text-white truncate">{c.titulo}</span>
                        <span className="font-mono text-xs tabular-nums text-white/85">{fmtTotal(c.realSec)}</span>
                        <span className="text-[10px] text-white/40 tracking-wider w-12 text-right">/ {fmtTotal(c.planSec)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Per casamento */}
          {stats.byCasamento.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-2">Por casamento</div>
              <ul className="flex flex-col gap-1.5">
                {stats.byCasamento.map(c => {
                  const ev = eventsById.get(c.evId)
                  const label = ev
                    ? (ev.referencia && ev.cliente ? `${ev.referencia} · ${ev.cliente}` : (ev.cliente || ev.referencia || 'Casamento'))
                    : 'Casamento'
                  return (
                    <li key={c.evId} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: c.cor }} />
                      <span className="flex-1 text-sm text-white truncate">{label}</span>
                      <span className="text-[10px] text-white/40 tracking-wider">{c.blocos} bloco{c.blocos === 1 ? '' : 's'}</span>
                      <span className="font-mono text-sm tabular-nums text-[#C9A84C]">{fmtTotal(c.realSec)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {blocks.length === 0 && (
            <div className="text-xs text-white/30 italic py-8 text-center">
              Sem blocos planeados para este dia.
            </div>
          )}

        </div>

        <div className="mt-4 text-[10px] text-white/25 tracking-wider">
          Real = tempo registado pelo timer. Planeado = soma das durações dos blocos.
        </div>
      </div>
    </div>
  )
}
