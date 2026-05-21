'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CalEvent } from './CalendarClient'
import HistoricoTimeBlocks from './HistoricoTimeBlocks'

type TimerState = 'idle' | 'running' | 'paused' | 'completed'

type Block = {
  id: string
  data: string
  categoria: string
  titulo: string
  cor: string
  hora_inicio: string                // "HH:MM" or "HH:MM:SS"
  hora_fim: string
  duracao_minutos: number
  ordem: number
  timer_state: TimerState
  timer_started_at: string | null
  timer_elapsed_seconds: number
  evento_id?: string | null
  tempo_real_segundos?: number
}

const PRESETS = [
  { key: 'editar',     label: 'Editar trabalhos (prioridade)',          cor: '#8B5CF6', defaultDur: 90 },
  { key: 'plataforma', label: 'Plataforma',                              cor: '#0EA5A0', defaultDur: 60 },
  { key: 'redes',      label: 'Redes sociais',                           cor: '#E11D48', defaultDur: 60 },
  { key: 'almoco',     label: 'Almoço + treino',                         cor: '#D97706', defaultDur: 90 },
  { key: 'clientes',   label: 'Clientes + arranque / encerramento (fixo)', cor: '#3B82F6', defaultDur: 60 },
  { key: 'custom',     label: 'Outro (à medida)',                        cor: '#A1A1AA', defaultDur: 30 },
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function hms(t: string) {
  // Normalize to HH:MM:SS; legacy values may come as HH:MM
  if (!t) return '00:00:00'
  const parts = t.split(':')
  const h = (parts[0] ?? '00').padStart(2, '0')
  const m = (parts[1] ?? '00').padStart(2, '0')
  const s = (parts[2] ?? '00').padStart(2, '0')
  return `${h}:${m}:${s}`
}

function toSeconds(t: string): number {
  const parts = (t ?? '').split(':').map(n => parseInt(n, 10))
  const [h, m, s] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
  return h * 3600 + m * 60 + s
}

function diffSeconds(start: string, end: string): number {
  return Math.max(0, toSeconds(end) - toSeconds(start))
}

function addSeconds(t: string, seconds: number): string {
  const total = toSeconds(t) + seconds
  const wrapped = ((total % 86400) + 86400) % 86400
  const h = Math.floor(wrapped / 3600)
  const m = Math.floor((wrapped % 3600) / 60)
  const s = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${String(m).padStart(h > 0 ? 2 : 1, '0')}m`)
  if (s > 0 || parts.length === 0) parts.push(`${String(s).padStart(parts.length > 0 ? 2 : 1, '0')}s`)
  return parts.join('')
}

/** Returns the first block in `list` whose time range overlaps with [start, end].
 *  Half-open interval: touching ranges (10:00–11:00 and 11:00–12:00) do NOT clash.
 *  Pass `excludeId` when editing an existing block. */
function findOverlap(list: Block[], start: string, end: string, excludeId?: string): Block | null {
  const s = toSeconds(start)
  const e = toSeconds(end)
  if (e <= s) return null
  for (const b of list) {
    if (excludeId && b.id === excludeId) continue
    const bs = toSeconds(b.hora_inicio)
    const be = toSeconds(b.hora_fim)
    if (be <= bs) continue
    if (s < be && e > bs) return b
  }
  return null
}

function totalSecondsOf(b: Block): number {
  // Prefer computed diff from times (HH:MM:SS precision)
  const fromTimes = diffSeconds(b.hora_inicio, b.hora_fim)
  if (fromTimes > 0) return fromTimes
  // Legacy fallback
  return (b.duracao_minutos ?? 0) * 60
}

function remainingSeconds(b: Block, nowMs: number) {
  const total = totalSecondsOf(b)
  let elapsed = b.timer_elapsed_seconds
  if (b.timer_state === 'running' && b.timer_started_at) {
    elapsed += Math.max(0, Math.floor((nowMs - new Date(b.timer_started_at).getTime()) / 1000))
  }
  return Math.max(0, total - elapsed)
}

function playBeep() {
  try {
    const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.18
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    setTimeout(() => { osc.frequency.value = 660 }, 250)
    setTimeout(() => { osc.frequency.value = 880 }, 500)
    setTimeout(() => { osc.stop(); ctx.close() }, 900)
  } catch {}
}

function fmtDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function TimeBlocks({ events }: { events: CalEvent[] }) {
  const [day, setDay]               = useState<string>(todayStr())
  const [blocks, setBlocks]         = useState<Block[]>([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const [historicoOpen, setHistoricoOpen] = useState(false)

  // Fast event lookup
  const eventsById = useMemo(() => new Map(events.map(e => [e.id, e])), [events])
  function eventLabel(id?: string | null): string | null {
    if (!id) return null
    const ev = eventsById.get(id)
    if (!ev) return null
    const ref = ev.referencia
    const cli = ev.cliente
    if (ref && cli) return `${ref} · ${cli}`
    return cli || ref || null
  }

  // All events for the dropdown. Sorted by proximity to refDate for the ones
  // that have a date; events without a date go to the end.
  function nearbyEvents(refDate: string | null) {
    const ref = refDate ? new Date(refDate + 'T00:00:00').getTime() : Date.now()
    return [...events].sort((a, b) => {
      if (!a.data_evento && !b.data_evento) return (a.referencia || '').localeCompare(b.referencia || '')
      if (!a.data_evento) return 1
      if (!b.data_evento) return -1
      const da = Math.abs(new Date(a.data_evento + 'T00:00:00').getTime() - ref)
      const db = Math.abs(new Date(b.data_evento + 'T00:00:00').getTime() - ref)
      return da - db
    })
  }

  // Add form
  const [presetKey, setPresetKey] = useState<string>('editar')
  const preset = PRESETS.find(p => p.key === presetKey)!
  const [newTitle, setNewTitle]   = useState('')
  const [titleEdited, setTitleEdited] = useState(false)  // true once the user types manually
  const [newCor, setNewCor]       = useState(preset.cor)
  const [newInicio, setNewInicio] = useState<string>('09:00:00')
  const [newFim, setNewFim]       = useState<string>(addSeconds('09:00:00', preset.defaultDur * 60))
  const [newEventoId, setNewEventoId] = useState<string>('')
  const [saving, setSaving]       = useState(false)

  const [tick, setTick] = useState(0)
  const completedAlerted = useRef<Set<string>>(new Set())

  useEffect(() => {
    setNewCor(preset.cor)
    setNewFim(addSeconds(newInicio || '09:00:00', preset.defaultDur * 60))
    // Always sync title to the selected preset (unless user manually edited it).
    // For 'custom' we default to "Bloco personalizado" so the user can hit
    // Adicionar straight away, then rename if wanted.
    if (!titleEdited) {
      if (presetKey === 'custom') {
        setNewTitle('Bloco personalizado')
      } else {
        setNewTitle(preset.label.replace(/ \(.*\)$/, ''))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey])

  // When inicio changes manually, push fim forward by the same duration (seconds-precise)
  function handleChangeInicio(v: string) {
    const oldDur = diffSeconds(newInicio, newFim)
    setNewInicio(v)
    if (oldDur > 0) setNewFim(addSeconds(v, oldDur))
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [day])

  useEffect(() => {
    const anyRunning = blocks.some(b => b.timer_state === 'running')
    if (!anyRunning) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [blocks])

  useEffect(() => {
    const now = Date.now()
    for (const b of blocks) {
      if (b.timer_state === 'running' && remainingSeconds(b, now) <= 0 && !completedAlerted.current.has(b.id)) {
        completedAlerted.current.add(b.id)
        playBeep()
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Time block concluído', { body: b.titulo })
          }
        } catch {}
        fetch(`/api/time-blocks/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete' }),
        }).then(() => load())
      }
    }
  }, [tick, blocks])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/time-blocks?data=${day}`, { cache: 'no-store' })
      const d = await res.json()
      setBlocks(d.blocks ?? [])
    } finally {
      setLoading(false)
    }
  }

  /** Auto-build the day according to the rules:
   *  - 09:30–12:00 → Editar trabalhos (priority, single block) — arranque do dia
   *  - 12:00–14:00 → Almoço + treino
   *  - 14:00–18:00 → Editar (2h) + Redes sociais (1h) + Plataforma (1h)
   *    The afternoon order rotates between 6 permutations based on dayOfYear
   *    so different days have different layouts.
   *  - 18:00–18:30 → Clientes (encerramento) */
  async function handleAutoCreateDay() {
    const presetEditar     = PRESETS.find(p => p.key === 'editar')!
    const presetRedes      = PRESETS.find(p => p.key === 'redes')!
    const presetPlataforma = PRESETS.find(p => p.key === 'plataforma')!
    const presetAlmoco     = PRESETS.find(p => p.key === 'almoco')!
    const presetClientes   = PRESETS.find(p => p.key === 'clientes')!

    // Afternoon permutations
    const variants: Array<Array<{ key: string; title: string; cor: string; durSec: number }>> = [
      [ { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 },
        { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 },
        { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 } ],
      [ { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 },
        { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 },
        { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 } ],
      [ { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 },
        { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 },
        { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 } ],
      [ { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 },
        { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 },
        { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 } ],
      [ { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 },
        { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 },
        { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 } ],
      [ { key: 'plataforma', title: 'Plataforma',       cor: presetPlataforma.cor, durSec: 1 * 3600 },
        { key: 'redes',      title: 'Redes sociais',    cor: presetRedes.cor,      durSec: 1 * 3600 },
        { key: 'editar',     title: 'Editar trabalhos', cor: presetEditar.cor,     durSec: 2 * 3600 } ],
    ]

    // Day-of-year as variant index (deterministic, different across the week)
    const d = new Date(day + 'T00:00:00')
    const start = new Date(d.getFullYear(), 0, 0)
    const diff  = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000)
    const dayOfYear = Math.floor(diff / 86400000)
    const variantIdx = ((dayOfYear % variants.length) + variants.length) % variants.length

    // If day already has blocks → confirm replacement
    if (blocks.length > 0) {
      const ok = confirm(`Já existem ${blocks.length} bloco${blocks.length === 1 ? '' : 's'} neste dia. Substituir por uma rotina automática?`)
      if (!ok) return
    }

    setSaving(true)
    try {
      // 1) Delete existing
      await Promise.all(blocks.map(b => fetch(`/api/time-blocks/${b.id}`, { method: 'DELETE' })))

      // 2) Build all blocks
      const toCreate: Array<{ key: string; title: string; cor: string; inicio: string; fim: string }> = []

      // 09:30–12:00 — Editar trabalhos (prioridade) — arranque do dia
      toCreate.push({
        key: 'editar', title: 'Editar trabalhos (prioridade)',
        cor: presetEditar.cor, inicio: '09:30:00', fim: '12:00:00',
      })

      // 12:00–14:00 — Almoço + treino
      toCreate.push({
        key: 'almoco', title: 'Almoço + treino',
        cor: presetAlmoco.cor, inicio: '12:00:00', fim: '14:00:00',
      })

      // 14:00–18:00 — Editar (2h) + Redes (1h) + Plataforma (1h) na variação do dia
      let cursor = '14:00:00'
      for (const piece of variants[variantIdx]) {
        const fim = addSeconds(cursor, piece.durSec)
        toCreate.push({ key: piece.key, title: piece.title, cor: piece.cor, inicio: cursor, fim })
        cursor = fim
      }

      // 18:00–18:30 — Clientes (encerramento)
      toCreate.push({
        key: 'clientes', title: 'Clientes — encerramento',
        cor: presetClientes.cor, inicio: '18:00:00', fim: '18:30:00',
      })

      // 3) Insert sequentially to preserve order
      const created: Block[] = []
      let ordem = 1
      for (const item of toCreate) {
        const res = await fetch('/api/time-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: day,
            categoria: item.key,
            titulo: item.title,
            cor: item.cor,
            hora_inicio: item.inicio,
            hora_fim: item.fim,
            ordem: ordem++,
          }),
        })
        const d2 = await res.json()
        if (d2.block) created.push(d2.block)
      }

      setBlocks(created.sort((a, b) => hms(a.hora_inicio).localeCompare(hms(b.hora_inicio))))
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    if (presetKey === 'editar' && !newEventoId) {
      alert('Para "Editar trabalhos" tens de escolher o casamento.')
      return
    }
    const dur = diffSeconds(newInicio, newFim)
    if (dur <= 0) { alert('A hora de fim tem de ser posterior à de início.'); return }
    const clash = findOverlap(blocks, newInicio, newFim)
    if (clash) {
      alert(`Horário já preenchido por "${clash.titulo}" (${hms(clash.hora_inicio).slice(0, 5)}–${hms(clash.hora_fim).slice(0, 5)}).`)
      return
    }
    setSaving(true)
    try {
      const maxOrdem = blocks.reduce((m, b) => Math.max(m, b.ordem), 0)
      const res = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: day,
          categoria: presetKey,
          titulo: newTitle,
          cor: newCor,
          hora_inicio: hms(newInicio),
          hora_fim: hms(newFim),
          ordem: maxOrdem + 1,
          evento_id: newEventoId || null,
        }),
      })
      const d = await res.json()
      if (d.block) {
        setBlocks(prev => [...prev, d.block].sort((a, b) => hms(a.hora_inicio).localeCompare(hms(b.hora_inicio))))
        setAdding(false)
        setNewTitle('')
        setTitleEdited(false)
        setNewEventoId('')
      } else if (d.error) {
        alert(d.error)
      }
    } finally {
      setSaving(false)
    }
  }

  async function timerAction(b: Block, action: 'start' | 'pause' | 'stop') {
    if (action === 'start') {
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {})
        }
      } catch {}
      setBlocks(prev => prev.map(x => {
        if (x.id === b.id) return x
        if (x.timer_state === 'running') {
          const sec = x.timer_started_at
            ? Math.max(0, Math.floor((Date.now() - new Date(x.timer_started_at).getTime()) / 1000))
            : 0
          return { ...x, timer_state: 'paused', timer_started_at: null, timer_elapsed_seconds: x.timer_elapsed_seconds + sec }
        }
        return x
      }))
      completedAlerted.current.delete(b.id)
    }
    if (action === 'stop') completedAlerted.current.delete(b.id)

    const res = await fetch(`/api/time-blocks/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const d = await res.json()
    if (d.block) load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este time block?')) return
    setBlocks(prev => prev.filter(b => b.id !== id))
    await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' })
  }

  async function handleUpdateTimes(b: Block, inicio: string, fim: string) {
    const inicioN = hms(inicio)
    const fimN = hms(fim)
    const durSec = diffSeconds(inicioN, fimN)
    if (durSec <= 0) { alert('A hora de fim tem de ser posterior à de início.'); return }
    const clash = findOverlap(blocks, inicioN, fimN, b.id)
    if (clash) {
      alert(`Horário já preenchido por "${clash.titulo}" (${hms(clash.hora_inicio).slice(0, 5)}–${hms(clash.hora_fim).slice(0, 5)}).`)
      return
    }
    setBlocks(prev => prev.map(x => x.id === b.id
      ? { ...x, hora_inicio: inicioN, hora_fim: fimN, duracao_minutos: Math.round(durSec / 60) }
      : x))
    await fetch(`/api/time-blocks/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hora_inicio: inicioN, hora_fim: fimN }),
    })
  }

  function shiftDay(delta: number) {
    const d = new Date(day + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const totalPlannedSec = useMemo(() => blocks.reduce((acc, b) => acc + totalSecondsOf(b), 0), [blocks])
  const totalPlannedH = Math.floor(totalPlannedSec / 3600)
  const totalPlannedM = Math.floor((totalPlannedSec % 3600) / 60)
  const nowMs = Date.now()
  const newDurSec = diffSeconds(newInicio, newFim)
  // Check overlap with existing blocks of the same day (form)
  const addOverlap = newDurSec > 0 ? findOverlap(blocks, newInicio, newFim) : null

  // Hero clock: which block is currently "in focus"?
  // Priority: running > most-recent paused > first idle of today.
  const heroBlock: Block | null = useMemo(() => {
    const running = blocks.find(b => b.timer_state === 'running')
    if (running) return running
    const paused = blocks.find(b => b.timer_state === 'paused')
    if (paused) return paused
    return null
  }, [blocks])
  const heroRemaining = heroBlock ? remainingSeconds(heroBlock, nowMs) : 0
  const heroTotal     = heroBlock ? totalSecondsOf(heroBlock) : 0
  const heroProgress  = heroTotal > 0 ? 1 - heroRemaining / heroTotal : 0
  const heroIsRunning = heroBlock?.timer_state === 'running'
  const heroIsPaused  = heroBlock?.timer_state === 'paused'

  return (
    <section className="mt-8 rounded-2xl p-6 flex flex-col gap-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/60">Time Blocks</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDay(-1)}
              className="w-7 h-7 flex items-center justify-center border border-white/10 rounded-lg text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">‹</button>
            <button onClick={() => setDay(todayStr())}
              className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-white/10 rounded-lg text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">Hoje</button>
            <button onClick={() => shiftDay(1)}
              className="w-7 h-7 flex items-center justify-center border border-white/10 rounded-lg text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">›</button>
            <input type="date" value={day} onChange={e => setDay(e.target.value)}
              className="ml-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-[#C9A84C]/40" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 tracking-wider">
            {blocks.length} bloco{blocks.length === 1 ? '' : 's'} · {totalPlannedH}h{String(totalPlannedM).padStart(2, '0')} planeados
          </span>
          {!adding && (
            <>
              <button onClick={() => setHistoricoOpen(true)}
                title="Ver tempo total gasto por casamento"
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}>
                📊 Histórico
              </button>
              <button onClick={handleAutoCreateDay}
                disabled={saving}
                title="Cria automaticamente os blocos do dia conforme as regras"
                className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.30)', color: '#A78BFA' }}>
                {saving ? 'A gerar…' : '✨ Auto-criar dia'}
              </button>
              <button onClick={() => setAdding(true)}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
                + Adicionar Bloco
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-[11px] text-white/40 tracking-wider">{fmtDateLong(day)}</div>

      {/* ─────────────────────────  HERO CLOCK  ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: heroBlock
            ? `linear-gradient(135deg, ${heroBlock.cor}18, ${heroBlock.cor}06 50%, transparent)`
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${heroBlock ? heroBlock.cor + '50' : 'rgba(255,255,255,0.06)'}`,
        }}>
        {/* Progress bar background */}
        {heroBlock && (
          <div className="absolute inset-y-0 left-0 transition-all"
            style={{
              width: `${Math.min(100, heroProgress * 100)}%`,
              background: heroBlock.cor + (heroIsRunning ? '1F' : '12'),
            }} />
        )}

        <div className="relative flex flex-col items-center justify-center py-10 px-6 gap-4">
          {heroBlock ? (
            <>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: heroBlock.cor }} />
                <span className="text-xs tracking-[0.3em] uppercase" style={{ color: heroBlock.cor }}>
                  {heroBlock.titulo}
                </span>
                {heroIsRunning && (
                  <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded animate-pulse"
                    style={{ background: heroBlock.cor + '30', color: heroBlock.cor }}>A correr</span>
                )}
                {heroIsPaused && (
                  <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">Em pausa</span>
                )}
              </div>
              {heroBlock.evento_id && eventLabel(heroBlock.evento_id) && (
                <div className="text-xs tracking-wider text-white/60 text-center">
                  🔗 <span style={{ color: heroBlock.cor }}>{eventLabel(heroBlock.evento_id)}</span>
                </div>
              )}

              <div
                className="font-mono tabular-nums tracking-tight leading-none select-none"
                style={{
                  fontSize: 'clamp(56px, 14vw, 144px)',
                  color: heroIsRunning ? heroBlock.cor : 'rgba(255,255,255,0.92)',
                  textShadow: heroIsRunning ? `0 0 40px ${heroBlock.cor}40` : 'none',
                }}>
                {fmtHMS(heroRemaining)}
              </div>

              <div className="text-[11px] tracking-wider text-white/40">
                {hms(heroBlock.hora_inicio).slice(0, 5)} — {hms(heroBlock.hora_fim).slice(0, 5)} · {fmtDuration(heroTotal)} no total
              </div>

              <div className="flex items-center gap-3 mt-2">
                {!heroIsRunning ? (
                  <button onClick={() => timerAction(heroBlock, 'start')}
                    title={heroIsPaused ? 'Retomar' : 'Iniciar'}
                    className="w-14 h-14 flex items-center justify-center rounded-full text-2xl transition-all hover:scale-105"
                    style={{ background: heroBlock.cor + '30', border: `1px solid ${heroBlock.cor}`, color: heroBlock.cor }}>
                    ▶
                  </button>
                ) : (
                  <button onClick={() => timerAction(heroBlock, 'pause')}
                    title="Pausar"
                    className="w-14 h-14 flex items-center justify-center rounded-full text-2xl transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.30)', color: 'white' }}>
                    ⏸
                  </button>
                )}
                <button onClick={() => timerAction(heroBlock, 'stop')}
                  title="Parar e repor"
                  className="w-12 h-12 flex items-center justify-center rounded-full text-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                  ⏹
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/30">Nenhum bloco a correr</div>
              <div className="font-mono tabular-nums tracking-tight leading-none select-none text-white/15"
                style={{ fontSize: 'clamp(56px, 14vw, 144px)' }}>
                --:--:--
              </div>
              <div className="text-[11px] tracking-wider text-white/35">
                Carrega ▶ num bloco para começar
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => setPresetKey(p.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] tracking-wider transition-all flex items-center gap-2"
                style={{
                  background: presetKey === p.key ? p.cor + '25' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${presetKey === p.key ? p.cor + '70' : 'rgba(255,255,255,0.08)'}`,
                  color: presetKey === p.key ? p.cor : 'rgba(255,255,255,0.55)',
                }}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.cor }} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Título</label>
              <input value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setTitleEdited(true) }}
                placeholder={preset.label}
                autoFocus
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40"
                onKeyDown={e => { if (e.key === 'Enter' && newTitle.trim() && !saving) handleCreate() }}
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Início (hh:mm:ss)</label>
              <input type="time" step={1} value={newInicio} onChange={e => handleChangeInicio(e.target.value)}
                className="bg-black/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                style={{
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: addOverlap ? '#EF4444' : 'rgba(255,255,255,0.10)',
                }}
              />
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Fim (hh:mm:ss)</label>
              <input type="time" step={1} value={newFim} onChange={e => setNewFim(e.target.value)}
                className="bg-black/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                style={{
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: addOverlap ? '#EF4444' : 'rgba(255,255,255,0.10)',
                }}
              />
            </div>
            <div className="text-[10px] tracking-wider pb-2.5"
              style={{ color: addOverlap ? '#F87171' : 'rgba(255,255,255,0.40)' }}>
              {newDurSec > 0 ? fmtDuration(newDurSec) : '—'}
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Cor</label>
              <input type="color" value={newCor} onChange={e => setNewCor(e.target.value)}
                className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
            </div>
          </div>

          {/* Wedding/event picker — required for 'editar', optional otherwise */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] tracking-[0.3em] text-white/30 uppercase">
              Casamento {presetKey === 'editar' ? <span style={{ color: '#F87171' }}>*</span> : <span className="text-white/25">(opcional)</span>}
            </label>
            <select value={newEventoId} onChange={e => setNewEventoId(e.target.value)}
              className="w-full bg-black/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
              style={{
                borderWidth: 1, borderStyle: 'solid',
                borderColor: presetKey === 'editar' && !newEventoId ? '#F87171' : 'rgba(255,255,255,0.10)',
              }}>
              <option value="">— Nenhum —</option>
              {nearbyEvents(day).map(ev => {
                const ref = ev.referencia || '—'
                const cli = ev.cliente || ''
                const dt  = ev.data_evento ? ev.data_evento.slice(0, 10) : 'sem data'
                return (
                  <option key={ev.id} value={ev.id}>
                    {ref}{cli ? ` · ${cli}` : ''} · {dt}
                  </option>
                )
              })}
            </select>
            <span className="text-[10px] text-white/30 tracking-wider mt-0.5">
              {events.length} eventos carregados
            </span>
          </div>

          {/* Form actions */}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setNewTitle(''); setTitleEdited(false); setNewEventoId('') }}
              className="px-3 py-2 text-xs text-white/40 hover:text-white/70">Cancelar</button>
            <button onClick={handleCreate}
              disabled={
                saving ||
                !newTitle.trim() ||
                newDurSec <= 0 ||
                !!addOverlap ||
                (presetKey === 'editar' && !newEventoId)
              }
              className="px-4 py-2 rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
              {saving ? 'A guardar…' : 'Adicionar'}
            </button>
          </div>

          {addOverlap && (
            <div className="flex items-start gap-2 mt-1 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#F87171' }}>
              <span className="text-base leading-none">⚠</span>
              <div className="text-[11px] tracking-wider leading-tight">
                <span className="font-semibold">Horário já preenchido.</span>{' '}
                Cruza com <span className="text-white/85">{addOverlap.titulo}</span>{' '}
                ({hms(addOverlap.hora_inicio).slice(0, 5)}–{hms(addOverlap.hora_fim).slice(0, 5)}).
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-xs text-white/30">A carregar blocos…</div>
      ) : blocks.length === 0 && !adding ? (
        <div className="text-xs text-white/30 italic py-6 text-center">
          Sem time blocks neste dia. Clica em <span className="text-[#C9A84C]/70">+ Adicionar Bloco</span> para começar.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map(b => {
            const total = totalSecondsOf(b)
            const remaining = remainingSeconds(b, nowMs)
            const progress = total > 0 ? 1 - remaining / total : 0
            const isRunning = b.timer_state === 'running'
            const isPaused = b.timer_state === 'paused'
            const isDone = b.timer_state === 'completed'
            const dimmed = isDone
            const isHero = heroBlock?.id === b.id

            return (
              <div key={b.id}
                className={`relative rounded-xl overflow-hidden transition-all ${isHero ? 'ring-1' : ''}`}
                style={{
                  background: dimmed ? 'rgba(255,255,255,0.02)' : b.cor + '0F',
                  border: `1px solid ${dimmed ? 'rgba(255,255,255,0.05)' : b.cor + '50'}`,
                  opacity: dimmed ? 0.55 : 1,
                  ['--tw-ring-color' as any]: isHero ? b.cor + '70' : 'transparent',
                }}>

                {/* Subtle progress shade for paused/running blocks */}
                <div className="absolute inset-y-0 left-0 transition-all"
                  style={{
                    width: `${Math.min(100, progress * 100)}%`,
                    background: b.cor + (isRunning ? '18' : '0E'),
                  }} />

                <div className="relative flex items-center gap-3 p-3">
                  <div className="w-1.5 self-stretch rounded-full" style={{ background: b.cor }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm text-white truncate" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                        {b.titulo}
                      </span>
                      {b.evento_id && eventLabel(b.evento_id) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded truncate"
                          style={{ background: b.cor + '20', border: `1px solid ${b.cor}40`, color: b.cor }}>
                          🔗 {eventLabel(b.evento_id)}
                        </span>
                      )}
                      {isRunning && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded" style={{ background: b.cor + '30', color: b.cor }}>A correr</span>}
                      {isPaused  && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">Em pausa</span>}
                      {isDone    && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded bg-green-500/15 text-green-400/70">Concluído</span>}
                      {(b.tempo_real_segundos ?? 0) > 0 && (
                        <span className="text-[10px] text-white/40 tracking-wider">
                          · real: {fmtDuration(b.tempo_real_segundos ?? 0)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 tracking-wider flex items-center gap-1.5 flex-wrap">
                      <input type="time" step={1} value={hms(b.hora_inicio)}
                        onChange={e => handleUpdateTimes(b, e.target.value, hms(b.hora_fim))}
                        disabled={isRunning}
                        className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white/65 focus:outline-none focus:border-[#C9A84C]/40 disabled:opacity-50" />
                      <span>—</span>
                      <input type="time" step={1} value={hms(b.hora_fim)}
                        onChange={e => handleUpdateTimes(b, hms(b.hora_inicio), e.target.value)}
                        disabled={isRunning}
                        className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-white/65 focus:outline-none focus:border-[#C9A84C]/40 disabled:opacity-50" />
                      <span className="ml-1">({fmtDuration(total)})</span>
                    </div>
                  </div>

                  {/* Inline action: only ▶ (start/focus) + ✕ — hero handles pause/stop */}
                  <div className="flex items-center gap-1.5">
                    {!isRunning && !isDone && (
                      <button onClick={() => timerAction(b, 'start')}
                        title={isPaused ? 'Retomar (passa para o relógio em cima)' : 'Iniciar (passa para o relógio em cima)'}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors"
                        style={{ background: b.cor + '25', border: `1px solid ${b.cor}80`, color: b.cor }}>
                        ▶
                      </button>
                    )}
                    {isRunning && (
                      <span className="px-2 text-xs text-white/40 tracking-wider">no relógio ↑</span>
                    )}
                    <button onClick={() => handleDelete(b.id)}
                      title="Eliminar"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="mt-2 p-4 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.35em] uppercase text-white/40">Legenda</span>
            <button onClick={() => setShowLegend(false)} className="text-[10px] text-white/30 hover:text-white/60">esconder</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/65">
            {PRESETS.filter(p => p.key !== 'custom').map(p => (
              <div key={p.key} className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-sm" style={{ background: p.cor }} />
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <HistoricoTimeBlocks
        open={historicoOpen}
        onClose={() => setHistoricoOpen(false)}
        events={events}
      />
    </section>
  )
}
