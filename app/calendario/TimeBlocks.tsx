'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

export default function TimeBlocks() {
  const [day, setDay]               = useState<string>(todayStr())
  const [blocks, setBlocks]         = useState<Block[]>([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [showLegend, setShowLegend] = useState(true)

  // Add form
  const [presetKey, setPresetKey] = useState<string>('editar')
  const preset = PRESETS.find(p => p.key === presetKey)!
  const [newTitle, setNewTitle]   = useState('')
  const [titleEdited, setTitleEdited] = useState(false)  // true once the user types manually
  const [newCor, setNewCor]       = useState(preset.cor)
  const [newInicio, setNewInicio] = useState<string>('09:00:00')
  const [newFim, setNewFim]       = useState<string>(addSeconds('09:00:00', preset.defaultDur * 60))
  const [saving, setSaving]       = useState(false)

  const [tick, setTick] = useState(0)
  const completedAlerted = useRef<Set<string>>(new Set())

  useEffect(() => {
    setNewCor(preset.cor)
    setNewFim(addSeconds(newInicio || '09:00:00', preset.defaultDur * 60))
    // Always sync title to the selected preset (unless user manually edited it
    // or picked 'custom'). This way switching from "Editar" to "Redes sociais"
    // updates the title to "Redes sociais" — not "Editar trabalhos".
    if (presetKey !== 'custom' && !titleEdited) {
      setNewTitle(preset.label.replace(/ \(.*\)$/, ''))
    }
    if (presetKey === 'custom' && !titleEdited) {
      setNewTitle('')
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

  async function handleCreate() {
    if (!newTitle.trim()) return
    const dur = diffSeconds(newInicio, newFim)
    if (dur <= 0) { alert('A hora de fim tem de ser posterior à de início.'); return }
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
        }),
      })
      const d = await res.json()
      if (d.block) {
        setBlocks(prev => [...prev, d.block].sort((a, b) => hms(a.hora_inicio).localeCompare(hms(b.hora_inicio))))
        setAdding(false)
        setNewTitle('')
        setTitleEdited(false)
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
            <button onClick={() => setAdding(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
              + Adicionar Bloco
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-white/40 tracking-wider">{fmtDateLong(day)}</div>

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
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Fim (hh:mm:ss)</label>
              <input type="time" step={1} value={newFim} onChange={e => setNewFim(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
            </div>
            <div className="text-[10px] text-white/40 tracking-wider pb-2.5">
              {newDurSec > 0 ? fmtDuration(newDurSec) : '—'}
            </div>
            <div>
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Cor</label>
              <input type="color" value={newCor} onChange={e => setNewCor(e.target.value)}
                className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
            </div>
            <button onClick={() => { setAdding(false); setNewTitle(''); setTitleEdited(false) }}
              className="px-3 py-2 text-xs text-white/40 hover:text-white/70">Cancelar</button>
            <button onClick={handleCreate} disabled={saving || !newTitle.trim() || newDurSec <= 0}
              className="px-4 py-2 rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
              {saving ? 'A guardar…' : 'Adicionar'}
            </button>
          </div>
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
            const remaining = remainingSeconds(b, nowMs)
            const total = totalSecondsOf(b)
            const progress = total > 0 ? 1 - remaining / total : 0
            const isRunning = b.timer_state === 'running'
            const isPaused = b.timer_state === 'paused'
            const isDone = b.timer_state === 'completed'
            const dimmed = isDone

            return (
              <div key={b.id}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  background: dimmed ? 'rgba(255,255,255,0.02)' : b.cor + '0F',
                  border: `1px solid ${dimmed ? 'rgba(255,255,255,0.05)' : b.cor + '50'}`,
                  opacity: dimmed ? 0.55 : 1,
                }}>

                <div className="absolute inset-y-0 left-0 transition-all"
                  style={{ width: `${Math.min(100, progress * 100)}%`, background: b.cor + (isRunning ? '24' : '15') }} />

                <div className="relative flex items-center gap-4 p-4">
                  <div className="w-1.5 self-stretch rounded-full" style={{ background: b.cor }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-white truncate" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                        {b.titulo}
                      </span>
                      {isRunning && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded" style={{ background: b.cor + '30', color: b.cor }}>A correr</span>}
                      {isPaused  && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">Em pausa</span>}
                      {isDone    && <span className="text-[9px] tracking-[0.3em] uppercase px-1.5 py-0.5 rounded bg-green-500/15 text-green-400/70">Concluído</span>}
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

                  {/* Countdown */}
                  <div className="font-mono text-2xl tabular-nums tracking-tight"
                    style={{ color: isRunning ? b.cor : 'rgba(255,255,255,0.85)' }}>
                    {fmtHMS(remaining)}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1.5">
                    {!isRunning ? (
                      <button onClick={() => timerAction(b, 'start')}
                        title={isPaused ? 'Retomar' : 'Iniciar'}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors"
                        style={{ background: b.cor + '25', border: `1px solid ${b.cor}80`, color: b.cor }}>
                        ▶
                      </button>
                    ) : (
                      <button onClick={() => timerAction(b, 'pause')}
                        title="Pausar"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', color: 'white' }}>
                        ⏸
                      </button>
                    )}
                    <button onClick={() => timerAction(b, 'stop')}
                      title="Parar e repor"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors text-white/50 hover:text-white/90 hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                      ⏹
                    </button>
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
    </section>
  )
}
