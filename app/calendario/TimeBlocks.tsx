'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { CalEvent, TarefaEvent } from './CalendarClient'
import HistoricoTimeBlocks from './HistoricoTimeBlocks'
import ResumoDia from './ResumoDia'

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

type Preset = { id?: string; key: string; label: string; cor: string; defaultDur: number; fixo?: boolean }

// Defaults used as fallback if the API returns nothing (e.g. before the
// migration is run). Once the categorias table is seeded, these are
// replaced by the server values.
const DEFAULT_PRESETS: Preset[] = [
  { key: 'editar',     label: 'Editar trabalhos (prioridade)',                cor: '#8B5CF6', defaultDur: 90, fixo: true },
  { key: 'plataforma', label: 'Plataforma',                                    cor: '#0EA5A0', defaultDur: 60, fixo: true },
  { key: 'redes',      label: 'Redes sociais',                                 cor: '#E11D48', defaultDur: 60, fixo: true },
  { key: 'almoco',     label: 'Almoço + treino',                               cor: '#D97706', defaultDur: 90, fixo: true },
  { key: 'clientes',   label: 'Clientes + arranque / encerramento (fixo)',     cor: '#3B82F6', defaultDur: 60, fixo: true },
  { key: 'pausa',      label: 'Pausa / Intervalo',                             cor: '#71717A', defaultDur: 15, fixo: true },
]
const CUSTOM_PRESET: Preset = { key: 'custom', label: 'Outro (à medida)', cor: '#A1A1AA', defaultDur: 30, fixo: true }

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

export default function TimeBlocks({
  events, tarefas: initialTarefas,
}: { events: CalEvent[]; tarefas?: TarefaEvent[] }) {
  const [day, setDay]               = useState<string>(todayStr())
  const [blocks, setBlocks]         = useState<Block[]>([])
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [showLegend, setShowLegend] = useState(true)
  const [historicoOpen, setHistoricoOpen] = useState(false)
  const [resumoOpen, setResumoOpen]       = useState(false)
  // Hora a que o utilizador começa o dia. Default 09:30. Lê/escreve localStorage
  // para manter a preferência entre sessões.
  const [startHour, setStartHour]   = useState<string>('09:30')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('tb_start_hour')
    if (saved && /^\d{2}:\d{2}$/.test(saved)) setStartHour(saved)
  }, [])
  function handleStartHourChange(v: string) {
    if (!/^\d{2}:\d{2}$/.test(v)) return
    setStartHour(v)
    try { window.localStorage.setItem('tb_start_hour', v) } catch {}
  }
  // Local copy of tarefas for optimistic toggle from inside the hero clock.
  const [tarefas, setTarefas]       = useState<TarefaEvent[]>(initialTarefas ?? [])
  useEffect(() => { setTarefas(initialTarefas ?? []) }, [initialTarefas])

  async function toggleTarefaStatus(id: string, currentStatus: TarefaEvent['status']) {
    const newStatus: TarefaEvent['status'] = currentStatus === 'CONCLUIDA' ? 'NOVA' : 'CONCLUIDA'
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await fetch(`/api/tarefas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }
  // Bumped whenever blocks change in the daily list so the open Histórico
  // modal re-fetches and stays in sync.
  const [historicoVersion, setHistoricoVersion] = useState(0)
  const bumpHistorico = () => setHistoricoVersion(v => v + 1)

  // ─── Categorias (presets) loaded from the server ────────────────────────
  const [serverPresets, setServerPresets] = useState<Preset[]>([])
  // PRESETS used everywhere = server presets (without 'custom') + custom at the end
  const PRESETS: Preset[] = useMemo(() => {
    const real = serverPresets.length > 0 ? serverPresets : DEFAULT_PRESETS
    return [...real, CUSTOM_PRESET]
  }, [serverPresets])

  // Add-categoria form state
  const [addingCategoria, setAddingCategoria] = useState(false)
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatCor, setNewCatCor]     = useState('#7C3AED')
  const [newCatDur, setNewCatDur]     = useState<number>(60)
  const [catSaving, setCatSaving]     = useState(false)

  // Edit-categoria inline state (uses the categoria id, null when no row is being edited)
  const [editCatId, setEditCatId]     = useState<string | null>(null)
  const [editCatLabel, setEditCatLabel] = useState('')
  const [editCatCor, setEditCatCor]     = useState('#7C3AED')
  const [editCatDur, setEditCatDur]     = useState<number>(60)
  const [editCatSaving, setEditCatSaving] = useState(false)

  function startEditCategoria(p: Preset) {
    if (!p.id) return
    setEditCatId(p.id)
    setEditCatLabel(p.label)
    setEditCatCor(p.cor)
    setEditCatDur(p.defaultDur)
  }
  function cancelEditCategoria() {
    setEditCatId(null)
  }
  async function saveEditCategoria() {
    if (!editCatId || !editCatLabel.trim() || editCatDur <= 0) return
    setEditCatSaving(true)
    try {
      const res = await fetch(`/api/time-block-categorias/${editCatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editCatLabel.trim(),
          cor: editCatCor,
          duracao_default_minutos: editCatDur,
        }),
      })
      if (res.ok) {
        setServerPresets(prev => prev.map(p => p.id === editCatId
          ? { ...p, label: editCatLabel.trim(), cor: editCatCor, defaultDur: editCatDur }
          : p
        ))
        setEditCatId(null)
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d.error ?? 'Erro ao guardar')
      }
    } finally {
      setEditCatSaving(false)
    }
  }

  async function loadCategorias() {
    try {
      const res = await fetch('/api/time-block-categorias', { cache: 'no-store' })
      const d = await res.json()
      const rows = (d.categorias ?? []) as any[]
      setServerPresets(rows.map(r => ({
        id: r.id, key: r.key, label: r.label, cor: r.cor,
        defaultDur: r.duracao_default_minutos ?? 60, fixo: !!r.fixo,
      })))
    } catch {}
  }

  useEffect(() => { loadCategorias() }, [])

  async function handleCreateCategoria() {
    if (!newCatLabel.trim()) return
    setCatSaving(true)
    try {
      const res = await fetch('/api/time-block-categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newCatLabel, cor: newCatCor, duracao_default_minutos: newCatDur }),
      })
      const d = await res.json()
      if (d.categoria) {
        setServerPresets(prev => [...prev, {
          id: d.categoria.id, key: d.categoria.key, label: d.categoria.label,
          cor: d.categoria.cor, defaultDur: d.categoria.duracao_default_minutos, fixo: !!d.categoria.fixo,
        }])
        setAddingCategoria(false)
        setNewCatLabel(''); setNewCatCor('#7C3AED'); setNewCatDur(60)
      } else if (d.error) {
        alert(d.error)
      }
    } finally {
      setCatSaving(false)
    }
  }

  async function handleDeleteCategoria(p: Preset) {
    if (!p.id) return
    if (p.fixo) { alert('Esta categoria é um preset fixo e não pode ser eliminada.'); return }
    if (!confirm(`Eliminar a categoria "${p.label}"?\nOs blocos já criados com esta categoria mantêm-se com a mesma cor.`)) return
    const res = await fetch(`/api/time-block-categorias/${p.id}`, { method: 'DELETE' })
    if (res.ok) {
      setServerPresets(prev => prev.filter(x => x.id !== p.id))
      if (presetKey === p.key) setPresetKey(DEFAULT_PRESETS[0].key)
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Erro ao eliminar')
    }
  }

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

  // All events for the dropdown, sorted chronologically (Jan → Dec).
  // Events without a date go to the end, sorted alphabetically by reference.
  // `refDate` is kept in the signature for API compatibility but no longer used.
  function nearbyEvents(_refDate: string | null) {
    return [...events].sort((a, b) => {
      if (!a.data_evento && !b.data_evento) return (a.referencia || '').localeCompare(b.referencia || '')
      if (!a.data_evento) return 1
      if (!b.data_evento) return -1
      return a.data_evento.localeCompare(b.data_evento)  // ascending: Jan → Dec
    })
  }

  // Add form
  const [presetKey, setPresetKey] = useState<string>('editar')
  // Fall back to first preset if the current key no longer exists (e.g. the
  // categoria was just deleted by the user).
  const preset = PRESETS.find(p => p.key === presetKey) ?? PRESETS[0]
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

  /** Open the "+ Adicionar Bloco" form, pre-filling the Início with a smart
   *  default:
   *  - If there are already blocks today → use the end of the LAST block so
   *    the user chains new blocks after the previous ones.
   *  - Otherwise → use the user's preferred start hour (configurable in the
   *    header, default 09:30).
   *  Fim defaults to Início + the current preset's default duration. */
  function openAddBlockForm() {
    const sortedEnds = blocks
      .map(b => hms(b.hora_fim))
      .sort((a, b) => b.localeCompare(a))   // descending
    const defaultInicio = sortedEnds.length > 0 ? sortedEnds[0] : hms(startHour)
    const defaultFim    = addSeconds(defaultInicio, preset.defaultDur * 60)
    setNewInicio(defaultInicio)
    setNewFim(defaultFim)
    setAdding(true)
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
   *  - Arranque 09:30 · Almoço 12:00–14:00 · Encerramento 18:00
   *  - Pausa de 15 min a meio da manhã + Pausa de 20 min a meio da tarde
   *  - Editar trabalhos é prioridade (3h55 / dia em dias normais; 5h55 em dia forte)
   *  - Redes sociais e Plataforma têm 1h cada / dia (excepto em dia forte)
   *  - 6 templates rotativos pelo dia-do-ano + 1 template raro "FORTE em Edição"
   *    (apresentado com alerta) */
  async function handleAutoCreateDay() {
    const presetEditar     = PRESETS.find(p => p.key === 'editar')!
    const presetRedes      = PRESETS.find(p => p.key === 'redes')!
    const presetPlataforma = PRESETS.find(p => p.key === 'plataforma')!
    const presetAlmoco     = PRESETS.find(p => p.key === 'almoco')!
    const presetClientes   = PRESETS.find(p => p.key === 'clientes')!
    const presetPausa      = PRESETS.find(p => p.key === 'pausa')
      ?? { key: 'pausa', label: 'Pausa', cor: '#71717A', defaultDur: 15, fixo: true }

    type Slot = { key: string; title: string; cor: string; inicio: string; fim: string }

    const EDITAR     = (inicio: string, fim: string): Slot => ({ key: 'editar',     title: 'Editar trabalhos (prioridade)', cor: presetEditar.cor,     inicio, fim })
    const REDES      = (inicio: string, fim: string): Slot => ({ key: 'redes',      title: 'Redes sociais',                  cor: presetRedes.cor,      inicio, fim })
    const PLATAFORMA = (inicio: string, fim: string): Slot => ({ key: 'plataforma', title: 'Plataforma',                      cor: presetPlataforma.cor, inicio, fim })
    const PAUSA_M    = (): Slot => ({ key: 'pausa', title: '☕ Pausa (15 min)', cor: presetPausa.cor, inicio: '11:00:00', fim: '11:15:00' })
    const PAUSA_T    = (): Slot => ({ key: 'pausa', title: '☕ Pausa (20 min)', cor: presetPausa.cor, inicio: '16:00:00', fim: '16:20:00' })

    /**
     * 7 templates (índices 0–6). Estrutura comum:
     *   Manhã: 09:30–11:00 (1h30) + ☕ 11:00–11:15 + 11:15–12:00 (45 min)
     *   Tarde: 14:00–16:00 (2h) + ☕ 16:00–16:20 + 16:20–18:00 (1h40)
     * Tempo útil total: 5h55 (manhã 2h15 + tarde 3h40).
     * Distribuição padrão: Editar 3h55, Redes 1h, Plataforma 1h.
     * Templates 0–5 = rotação normal.
     * Template 6 = "FORTE em Edição" (só Editar) → mostra alerta.
     */
    const templates: { label: string; forte?: boolean; slots: Slot[] }[] = [
      // T0 — Editar inteiro manhã | tarde Plataforma+Editar+Redes+Editar
      { label: 'Clássico', slots: [
        EDITAR('09:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        PLATAFORMA('14:00:00', '15:00:00'), EDITAR('15:00:00', '16:00:00'), PAUSA_T(),
        REDES('16:20:00', '17:20:00'), EDITAR('17:20:00', '18:00:00'),
      ] },

      // T1 — Plataforma cedo
      { label: 'Plataforma cedo', slots: [
        PLATAFORMA('09:30:00', '10:30:00'), EDITAR('10:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        EDITAR('14:00:00', '16:00:00'), PAUSA_T(),
        REDES('16:20:00', '17:20:00'), EDITAR('17:20:00', '18:00:00'),
      ] },

      // T2 — Redes cedo
      { label: 'Redes cedo', slots: [
        REDES('09:30:00', '10:30:00'), EDITAR('10:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        EDITAR('14:00:00', '16:00:00'), PAUSA_T(),
        PLATAFORMA('16:20:00', '17:20:00'), EDITAR('17:20:00', '18:00:00'),
      ] },

      // T3 — Redes a meio da tarde
      { label: 'Redes meio-tarde', slots: [
        EDITAR('09:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        REDES('14:00:00', '15:00:00'), EDITAR('15:00:00', '16:00:00'), PAUSA_T(),
        PLATAFORMA('16:20:00', '17:20:00'), EDITAR('17:20:00', '18:00:00'),
      ] },

      // T4 — Plataforma fim da tarde
      { label: 'Plataforma fim-tarde', slots: [
        EDITAR('09:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        EDITAR('14:00:00', '16:00:00'), PAUSA_T(),
        EDITAR('16:20:00', '17:00:00'), PLATAFORMA('17:00:00', '18:00:00'),
      ] /* ← faltava Redes: mover para outra altura, ver abaixo */ },

      // T5 — Misto (Plataforma cedo, Redes pós-pausa-tarde)
      { label: 'Misto', slots: [
        PLATAFORMA('09:30:00', '10:30:00'), EDITAR('10:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        EDITAR('14:00:00', '15:00:00'), REDES('15:00:00', '16:00:00'), PAUSA_T(),
        EDITAR('16:20:00', '18:00:00'),
      ] },

      // T6 — FORTE em Edição (sem Redes, sem Plataforma) — apresentado com alerta
      { label: 'FORTE em Edição', forte: true, slots: [
        EDITAR('09:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
        EDITAR('14:00:00', '16:00:00'), PAUSA_T(),
        EDITAR('16:20:00', '18:00:00'),
      ] },
    ]

    // Corrige T4 — adiciona Redes no início da tarde
    templates[4].slots = [
      EDITAR('09:30:00', '11:00:00'), PAUSA_M(), EDITAR('11:15:00', '12:00:00'),
      REDES('14:00:00', '15:00:00'), EDITAR('15:00:00', '16:00:00'), PAUSA_T(),
      EDITAR('16:20:00', '17:00:00'), PLATAFORMA('17:00:00', '18:00:00'),
    ]

    // Day-of-year as template index (deterministic, different across the week).
    // We rotate 6 normal templates first (0..5) and only ~1 in 7 days fica FORTE (idx 6).
    const d = new Date(day + 'T00:00:00')
    const start = new Date(d.getFullYear(), 0, 0)
    const diff  = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000)
    const dayOfYear = Math.floor(diff / 86400000)
    const tplIdx = ((dayOfYear % templates.length) + templates.length) % templates.length
    const chosen = templates[tplIdx]

    // If day already has blocks → confirm replacement
    if (blocks.length > 0) {
      const ok = confirm(`Já existem ${blocks.length} bloco${blocks.length === 1 ? '' : 's'} neste dia. Substituir por uma rotina automática?`)
      if (!ok) return
    }

    setSaving(true)
    try {
      // 1) Delete existing
      await Promise.all(blocks.map(b => fetch(`/api/time-blocks/${b.id}`, { method: 'DELETE' })))

      // 2) Build all blocks: work template + fixed lunch + fixed closure
      const work = chosen.slots
      let toCreate: Slot[] = [
        // Manhã + tarde do template escolhido — só os blocos antes do almoço
        ...work.filter(s => s.inicio < '12:00:00'),
        // 12:00–14:00 Almoço + treino (fixo)
        { key: 'almoco', title: 'Almoço + treino', cor: presetAlmoco.cor, inicio: '12:00:00', fim: '14:00:00' },
        // Tarde do template (>= 14:00)
        ...work.filter(s => s.inicio >= '14:00:00'),
        // 18:00–18:30 Clientes — encerramento (fixo)
        { key: 'clientes', title: 'Clientes — encerramento', cor: presetClientes.cor, inicio: '18:00:00', fim: '18:30:00' },
      ]

      // 2b) Aplica deslocamento se o utilizador definiu uma hora de arranque
      // diferente das 09:30 (default dos templates).
      const baseStartSec   = toSeconds('09:30:00')
      const userStartSec   = toSeconds(hms(startHour))
      const offsetSec      = userStartSec - baseStartSec
      if (offsetSec !== 0) {
        toCreate = toCreate.map(s => ({
          ...s,
          inicio: addSeconds(s.inicio, offsetSec),
          fim:    addSeconds(s.fim, offsetSec),
        }))
      }

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
      bumpHistorico()

      // ── Alerta especial quando o dia rotativo calhou em "FORTE em Edição" ──
      if (chosen.forte) {
        alert(
          '⚠️ Hoje calhou DIA FORTE em Edição (sem Redes nem Plataforma).\n\n' +
          'Tens 5h55 dedicadas só a editar trabalhos.\n' +
          'Lembra-te de fazer Redes e Plataforma noutro dia desta semana.'
        )
      }
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
        bumpHistorico()
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
    if (d.block) { load(); bumpHistorico() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este time block?')) return
    setBlocks(prev => prev.filter(b => b.id !== id))
    await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' })
    bumpHistorico()
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

  // Tarefas linked to the same casamento as the hero block (pendentes primeiro,
  // depois concluídas). Mostra até 5 — fecha o ciclo entre time blocks e tarefas.
  const heroTarefas: TarefaEvent[] = useMemo(() => {
    if (!heroBlock?.evento_id) return []
    const linked = tarefas.filter(t => t.evento_id === heroBlock.evento_id)
    return [...linked].sort((a, b) => {
      // Concluídas no fim
      if (a.status === 'CONCLUIDA' && b.status !== 'CONCLUIDA') return 1
      if (a.status !== 'CONCLUIDA' && b.status === 'CONCLUIDA') return -1
      // Pendentes mais próximas primeiro
      const da = a.data_prazo ?? '9999-12-31'
      const db = b.data_prazo ?? '9999-12-31'
      return da.localeCompare(db)
    }).slice(0, 5)
  }, [tarefas, heroBlock?.evento_id])

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

          {/* Hora de arranque do dia — usada pelo Auto-criar dia */}
          <label className="flex items-center gap-2 ml-1">
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/30 whitespace-nowrap">Iniciar às</span>
            <input type="time" value={startHour}
              onChange={e => handleStartHourChange(e.target.value)}
              title="Hora a que começas o dia (usada no Auto-criar dia)"
              className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]/40" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 tracking-wider">
            {blocks.length} bloco{blocks.length === 1 ? '' : 's'} · {totalPlannedH}h{String(totalPlannedM).padStart(2, '0')} planeados
          </span>
          {!adding && (
            <>
              <button onClick={() => setResumoOpen(true)}
                title="Resumo do tempo gasto neste dia"
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}>
                📋 Resumo do dia
              </button>
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
              <button onClick={openAddBlockForm}
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

              {/* Tarefas do casamento — só aparecem quando o bloco está ligado a um evento */}
              {heroBlock.evento_id && heroTarefas.length > 0 && (
                <div className="w-full max-w-xl mt-4 px-3 py-3 rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.30)', border: `1px solid ${heroBlock.cor}30` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: heroBlock.cor + 'C0' }}>
                      📋 Tarefas deste casamento
                    </span>
                    <Link href={`/eventos-2026/${heroBlock.evento_id}`}
                      className="text-[10px] tracking-wider text-white/40 hover:text-white/80 transition-colors">
                      Ver tudo →
                    </Link>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {heroTarefas.map(t => {
                      const done = t.status === 'CONCLUIDA'
                      return (
                        <li key={t.id} className="flex items-center gap-2 text-sm">
                          <button onClick={() => toggleTarefaStatus(t.id, t.status)}
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors text-[10px]"
                            style={{
                              border: `1px solid ${done ? 'rgba(134,239,172,0.5)' : 'rgba(255,255,255,0.25)'}`,
                              background: done ? 'rgba(74,222,128,0.20)' : 'transparent',
                              color: done ? '#86EFAC' : 'transparent',
                            }}
                            title={done ? 'Marcar por fazer' : 'Marcar como feita'}>
                            ✓
                          </button>
                          <span className="text-left flex-1"
                            style={{
                              color: done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                              textDecoration: done ? 'line-through' : 'none',
                            }}>
                            {t.titulo}
                          </span>
                          {t.hora && (
                            <span className="text-[10px] text-white/40 tracking-wider">
                              {t.hora.slice(0, 5)}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {heroBlock.evento_id && heroTarefas.length === 0 && (
                <div className="text-[10px] text-white/30 tracking-wider mt-2 text-center max-w-xl">
                  Sem tarefas pendentes para este casamento.{' '}
                  <Link href={`/eventos-2026/${heroBlock.evento_id}`} className="text-white/55 hover:text-white">criar nova →</Link>
                </div>
              )}
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

      {/* Legend — managed (add/delete categorias) */}
      {showLegend && (
        <div className="mt-2 p-4 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.35em] uppercase text-white/40">Legenda</span>
            <div className="flex items-center gap-3">
              {!addingCategoria && (
                <button onClick={() => setAddingCategoria(true)}
                  className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded border border-[#C9A84C]/30 text-[#C9A84C]/70 hover:text-[#C9A84C] hover:border-[#C9A84C]/60 transition-colors">
                  + Nova categoria
                </button>
              )}
              <button onClick={() => setShowLegend(false)} className="text-[10px] text-white/30 hover:text-white/60">esconder</button>
            </div>
          </div>

          {addingCategoria && (
            <div className="mb-3 p-3 rounded-lg flex flex-wrap items-end gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Nome</label>
                <input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
                  placeholder="ex.: Newsletter, Treino, Leitura…"
                  autoFocus
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40"
                  onKeyDown={e => { if (e.key === 'Enter' && newCatLabel.trim() && !catSaving) handleCreateCategoria() }}
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Cor</label>
                <input type="color" value={newCatCor} onChange={e => setNewCatCor(e.target.value)}
                  className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Duração default (min)</label>
                <input type="number" min={1} value={newCatDur} onChange={e => setNewCatDur(parseInt(e.target.value || '0', 10))}
                  className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
              <button onClick={() => { setAddingCategoria(false); setNewCatLabel(''); setNewCatCor('#7C3AED'); setNewCatDur(60) }}
                className="px-3 py-2 text-xs text-white/40 hover:text-white/70">Cancelar</button>
              <button onClick={handleCreateCategoria} disabled={catSaving || !newCatLabel.trim() || newCatDur <= 0}
                className="px-4 py-2 rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
                {catSaving ? 'A criar…' : 'Adicionar'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/65">
            {PRESETS.filter(p => p.key !== 'custom').map(p => {
              const isEditing = editCatId === p.id
              if (isEditing) {
                return (
                  <div key={p.key} className="col-span-1 sm:col-span-2 p-2 rounded-lg flex flex-wrap items-end gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${editCatCor}50` }}>
                    <input value={editCatLabel} onChange={e => setEditCatLabel(e.target.value)}
                      placeholder="Nome"
                      autoFocus
                      className="flex-1 min-w-[180px] bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                      onKeyDown={e => { if (e.key === 'Enter' && !editCatSaving) saveEditCategoria(); if (e.key === 'Escape') cancelEditCategoria() }}
                    />
                    <input type="color" value={editCatCor} onChange={e => setEditCatCor(e.target.value)}
                      className="w-10 h-9 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                    <input type="number" min={1} value={editCatDur}
                      onChange={e => setEditCatDur(parseInt(e.target.value || '0', 10))}
                      title="Duração default (min)"
                      className="w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
                    <button onClick={cancelEditCategoria}
                      className="px-2 py-1.5 text-xs text-white/40 hover:text-white/70">Cancelar</button>
                    <button onClick={saveEditCategoria}
                      disabled={editCatSaving || !editCatLabel.trim() || editCatDur <= 0}
                      className="px-3 py-1.5 rounded-lg text-xs tracking-wider transition-colors disabled:opacity-50"
                      style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
                      {editCatSaving ? 'A guardar…' : 'Guardar'}
                    </button>
                  </div>
                )
              }
              return (
                <div key={p.key} className="group flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-sm flex-shrink-0" style={{ background: p.cor }} />
                  <span className="flex-1 truncate">{p.label}</span>
                  {p.fixo && <span className="text-[9px] text-white/25 tracking-wider uppercase">fixo</span>}
                  {p.id && (
                    <button onClick={() => startEditCategoria(p)}
                      title={`Editar "${p.label}"`}
                      className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-[#C9A84C] hover:bg-white/5 transition-colors text-xs opacity-0 group-hover:opacity-100">
                      ✎
                    </button>
                  )}
                  {!p.fixo && p.id && (
                    <button onClick={() => handleDeleteCategoria(p)}
                      title={`Eliminar "${p.label}"`}
                      className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs opacity-0 group-hover:opacity-100">
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <HistoricoTimeBlocks
        open={historicoOpen}
        onClose={() => setHistoricoOpen(false)}
        events={events}
        refreshSignal={historicoVersion}
      />

      <ResumoDia
        open={resumoOpen}
        onClose={() => setResumoOpen(false)}
        day={day}
        blocks={blocks}
        events={events}
      />
    </section>
  )
}
