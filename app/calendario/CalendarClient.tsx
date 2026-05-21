'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TimeBlocks from './TimeBlocks'

export type CalEvent = {
  id: string
  referencia: string
  cliente: string
  data_evento: string | null
  local: string | null
  tipo_evento: string[]
  fotografo: string[]
  videografo: string[]
}

export type PreWeddingEvent = {
  id: string
  referencia: string
  nomes: string
  data_evento: string
  hora: string | null
  local: string | null
}

export type TeamEntry = {
  id: string
  freelancer_nome: string
  data_evento: string          // YYYY-MM-DD — the wedding/event date
  data_calendar: string        // YYYY-MM-DD — the date shown on calendar (confirmation date when available)
  local: string | null
  evento_id: string | null
  status: 'confirmado' | 'indisponivel'
  tipo: 'confirmacao' | 'edicao_fotos' | 'edicao_album' | 'edicao_video'
}

export type ReuniaoEvent = {
  id: string
  nome: string
  reuniao_data: string         // YYYY-MM-DD
  reuniao_hora: string | null
  reuniao_tipo: string | null  // Presencial | Videochamada
  reuniao_link: string | null
}

export type TarefaEvent = {
  id: string
  titulo: string
  descricao: string | null
  status: 'NOVA' | 'PENDENTE' | 'CONCLUIDA'
  data_prazo: string           // YYYY-MM-DD
  hora: string | null          // HH:MM or HH:MM:SS
  evento_id: string | null     // Notion event id (optional link)
}

type SelectedItem =
  | { kind: 'event'; data: CalEvent }
  | { kind: 'pw'; data: PreWeddingEvent }
  | { kind: 'team'; data: TeamEntry }
  | { kind: 'reuniao'; data: ReuniaoEvent }
  | { kind: 'tarefa'; data: TarefaEvent }

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TIPO_LABELS: Record<TeamEntry['tipo'], string> = {
  confirmacao:   '✓',
  edicao_fotos:  '🖼',
  edicao_album:  '📘',
  edicao_video:  '🎬',
}

const TIPO_COLORS: Record<TeamEntry['tipo'], { bg: string; border: string; text: string }> = {
  confirmacao:  { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.28)', text: '#4ADE80' },
  edicao_fotos: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.28)', text: '#FB923C' },
  edicao_album: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)', text: '#A78BFA' },
  edicao_video: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)', text: '#60A5FA' },
}

function startsOn(dateStr: string | null | undefined, year: number, month: number, day: number) {
  if (!dateStr) return false
  return dateStr.startsWith(
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  )
}

export default function CalendarClient({
  events,
  preWeddings,
  teamEntries,
  reunioes,
  tarefas: initialTarefas,
}: {
  events: CalEvent[]
  preWeddings: PreWeddingEvent[]
  teamEntries: TeamEntry[]
  reunioes: ReuniaoEvent[]
  tarefas: TarefaEvent[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected]   = useState<SelectedItem | null>(null)
  const [tarefas, setTarefas]     = useState<TarefaEvent[]>(initialTarefas)

  // Add-task modal state
  const [addTaskDate, setAddTaskDate]       = useState<string | null>(null)
  const [taskTitulo, setTaskTitulo]         = useState('')
  const [taskHora, setTaskHora]             = useState('')
  const [taskDesc, setTaskDesc]             = useState('')
  const [taskEventoId, setTaskEventoId]     = useState('')
  const [taskSaving, setTaskSaving]         = useState(false)

  // Edit-task modal state (reuses selected)
  const [editingTask, setEditingTask]       = useState(false)
  const [editTitulo, setEditTitulo]         = useState('')
  const [editHora, setEditHora]             = useState('')
  const [editDesc, setEditDesc]             = useState('')
  const [editStatus, setEditStatus]         = useState<TarefaEvent['status']>('NOVA')
  const [editEventoId, setEditEventoId]     = useState('')
  const [editSaving, setEditSaving]         = useState(false)

  // Build a fast lookup of events for chip label and dropdown
  const eventsById = new Map(events.map(e => [e.id, e]))

  // Sort events by absolute date proximity to addTaskDate (or today) so the
  // most-likely options appear at the top of the dropdown.
  function nearbyEvents(refDate: string | null) {
    const ref = refDate ? new Date(refDate + 'T00:00:00').getTime() : Date.now()
    return [...events]
      .filter(e => e.data_evento)
      .sort((a, b) => {
        const da = Math.abs(new Date(a.data_evento + 'T00:00:00').getTime() - ref)
        const db = Math.abs(new Date(b.data_evento + 'T00:00:00').getTime() - ref)
        return da - db
      })
  }

  function openAddTask(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setAddTaskDate(dateStr)
    setTaskTitulo('')
    setTaskHora('')
    setTaskDesc('')
    setTaskEventoId('')
  }

  // ── Chooser modal (Tarefa / Reunião / Pré-Wedding) ─────────────────────
  const [chooserDate, setChooserDate] = useState<string | null>(null)
  function openChooser(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setChooserDate(dateStr)
  }

  // ── Reunião CRM modal ──────────────────────────────────────────────────
  type CrmContacto = { id: string; nome: string; contato: string | null; status: string | null; reuniao_data: string | null; reuniao_hora: string | null }
  const [reuniaoOpen, setReuniaoOpen]       = useState(false)
  const [reuniaoDate, setReuniaoDate]       = useState<string>('')
  const [reuniaoContactos, setReuniaoContactos] = useState<CrmContacto[]>([])
  const [reuniaoCrmId, setReuniaoCrmId]     = useState<string>('')
  const [reuniaoHora, setReuniaoHora]       = useState<string>('15:00')
  const [reuniaoTipo, setReuniaoTipo]       = useState<'Presencial' | 'Videochamada'>('Presencial')
  const [reuniaoLink, setReuniaoLink]       = useState<string>('')
  const [reuniaoSaving, setReuniaoSaving]   = useState(false)
  const [reuniaoLoading, setReuniaoLoading] = useState(false)

  function openReuniao(dateStr: string) {
    setReuniaoDate(dateStr)
    setReuniaoCrmId(''); setReuniaoHora('15:00'); setReuniaoTipo('Presencial'); setReuniaoLink('')
    setReuniaoOpen(true)
    setChooserDate(null)
    // Carrega contactos só na primeira vez
    if (reuniaoContactos.length === 0) {
      setReuniaoLoading(true)
      fetch('/api/calendario-add/crm-list', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { setReuniaoContactos(d.contactos ?? []); setReuniaoLoading(false) })
        .catch(() => setReuniaoLoading(false))
    }
  }

  async function handleSaveReuniao() {
    if (!reuniaoCrmId || !reuniaoDate || !reuniaoHora) return
    setReuniaoSaving(true)
    try {
      const res = await fetch('/api/calendario-add/reuniao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_id: reuniaoCrmId,
          data: reuniaoDate,
          hora: reuniaoHora,
          tipo: reuniaoTipo,
          link: reuniaoLink || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setReuniaoOpen(false)
        startTransition(() => router.refresh())
      } else {
        alert(d.error ?? 'Erro ao guardar reunião')
      }
    } finally {
      setReuniaoSaving(false)
    }
  }

  // ── Pré-Wedding modal ──────────────────────────────────────────────────
  type PortalRow = { referencia: string; noiva: string; noivo: string; has_pw: boolean; pw_date: string | null; pw_time: string | null }
  const [pwOpen, setPwOpen]       = useState(false)
  const [pwDate, setPwDate]       = useState<string>('')
  const [pwPortais, setPwPortais] = useState<PortalRow[]>([])
  const [pwReferencia, setPwReferencia] = useState<string>('')
  const [pwHora, setPwHora]       = useState<string>('14:00')
  const [pwLocal, setPwLocal]     = useState<string>('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  function openPreWedding(dateStr: string) {
    setPwDate(dateStr)
    setPwReferencia(''); setPwHora('14:00'); setPwLocal('')
    setPwOpen(true)
    setChooserDate(null)
    if (pwPortais.length === 0) {
      setPwLoading(true)
      fetch('/api/calendario-add/portais-list', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { setPwPortais(d.portais ?? []); setPwLoading(false) })
        .catch(() => setPwLoading(false))
    }
  }

  async function handleSavePreWedding() {
    if (!pwReferencia || !pwDate) return
    setPwSaving(true)
    try {
      const res = await fetch('/api/calendario-add/pre-wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia: pwReferencia,
          data: pwDate,
          hora: pwHora || null,
          local: pwLocal || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setPwOpen(false)
        startTransition(() => router.refresh())
      } else {
        alert(d.error ?? 'Erro ao guardar pré-wedding')
      }
    } finally {
      setPwSaving(false)
    }
  }

  async function handleCreateTask() {
    if (!addTaskDate || !taskTitulo.trim()) return
    setTaskSaving(true)
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:     taskTitulo,
          descricao:  taskDesc || null,
          data_prazo: addTaskDate,
          hora:       taskHora || null,
          status:     'NOVA',
          evento_id:  taskEventoId || null,
        }),
      })
      const d = await res.json()
      if (d.tarefa) {
        setTarefas(prev => [...prev, {
          id:         d.tarefa.id,
          titulo:     d.tarefa.titulo,
          descricao:  d.tarefa.descricao,
          status:     d.tarefa.status,
          data_prazo: d.tarefa.data_prazo,
          hora:       d.tarefa.hora,
          evento_id:  d.tarefa.evento_id ?? null,
        }])
        setAddTaskDate(null)
        startTransition(() => router.refresh())
      }
    } finally {
      setTaskSaving(false)
    }
  }

  function startEditTask(t: TarefaEvent) {
    setEditTitulo(t.titulo)
    setEditHora(t.hora ? t.hora.slice(0, 5) : '')
    setEditDesc(t.descricao ?? '')
    setEditStatus(t.status)
    setEditEventoId(t.evento_id ?? '')
    setEditingTask(true)
  }

  async function handleUpdateTask() {
    if (selected?.kind !== 'tarefa') return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/tarefas/${selected.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:    editTitulo,
          descricao: editDesc || null,
          hora:      editHora || null,
          status:    editStatus,
          evento_id: editEventoId || null,
        }),
      })
      if (res.ok) {
        setTarefas(prev => prev.map(t => t.id === selected.data.id
          ? {
              ...t,
              titulo:    editTitulo,
              descricao: editDesc || null,
              hora:      editHora || null,
              status:    editStatus,
              evento_id: editEventoId || null,
            }
          : t
        ))
        setSelected(null)
        setEditingTask(false)
        startTransition(() => router.refresh())
      }
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Eliminar esta tarefa?')) return
    const res = await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTarefas(prev => prev.filter(t => t.id !== id))
      setSelected(null)
      setEditingTask(false)
      startTransition(() => router.refresh())
    }
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Month strip — count all types
  const monthCounts = Array.from({ length: 12 }, (_, i) => {
    const ev = events.filter(e => {
      if (!e.data_evento) return false
      const d = new Date(e.data_evento + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const pw = preWeddings.filter(p => {
      const d = new Date(p.data_evento + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const te = teamEntries.filter(t => {
      if (t.status !== 'confirmado') return false
      const d = new Date(t.data_calendar + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const re = reunioes.filter(r => {
      const d = new Date(r.reuniao_data + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const ta = tarefas.filter(t => {
      const d = new Date(t.data_prazo + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    return ev + pw + te + re + ta
  })

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-white/[0.06]">
        <h1 className="text-sm font-light tracking-[0.5em] text-white uppercase">
          RL <span className="text-[#C9A84C]">PHOTO</span>.VIDEO
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Voltar */}
        <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1"
          className="inline-flex items-center gap-2 text-xs tracking-widest text-white/30 hover:text-[#C9A84C] transition-colors mb-8">
          ‹ VOLTAR AO MENU
        </Link>

        {/* Título */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-1">RL PHOTO.VIDEO</p>
          <h1 className="text-2xl font-light tracking-widest text-[#C9A84C] uppercase">CALENDÁRIO</h1>
          <div className="mt-3 h-px w-16 bg-[#C9A84C]/40" />
        </div>

        {/* Month strip */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {MESES.map((m, i) => (
            <button key={i} onClick={() => setViewMonth(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                i === viewMonth
                  ? 'bg-[#C9A84C] text-black font-semibold'
                  : 'border border-white/[0.08] text-white/40 hover:border-[#C9A84C]/40 hover:text-white/70'
              }`}>
              <span className="tracking-wider uppercase">{m.slice(0, 3)}</span>
              {monthCounts[i] > 0 && (
                <span className={`text-[10px] mt-0.5 font-bold ${i === viewMonth ? 'text-black/70' : 'text-[#C9A84C]/60'}`}>
                  {monthCounts[i]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Nav + year */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center border border-white/10 rounded-lg text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all text-lg">
            ‹
          </button>
          <div className="text-center">
            <span className="text-white font-light text-lg tracking-widest uppercase">{MESES[viewMonth]}</span>
            <span className="text-[#C9A84C]/60 text-sm ml-3 tracking-wider">{viewYear}</span>
          </div>
          <button onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center border border-white/10 rounded-lg text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all text-lg">
            ›
          </button>
        </div>

        {/* Calendar grid */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-[10px] tracking-[0.2em] text-white/25 uppercase font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }, (_, i) => {
              const col = i % 7
              let day: number
              let isCurrentMonth = true

              if (i < firstDay) {
                day = daysInPrev - firstDay + i + 1
                isCurrentMonth = false
              } else if (i >= firstDay + daysInMonth) {
                day = i - firstDay - daysInMonth + 1
                isCurrentMonth = false
              } else {
                day = i - firstDay + 1
              }

              const dayEvents   = isCurrentMonth ? events.filter(e => startsOn(e.data_evento, viewYear, viewMonth, day)) : []
              const dayPws      = isCurrentMonth ? preWeddings.filter(p => startsOn(p.data_evento, viewYear, viewMonth, day)) : []
              const dayTeam     = isCurrentMonth ? teamEntries.filter(t => startsOn(t.data_calendar, viewYear, viewMonth, day)) : []
              const dayReunioes = isCurrentMonth ? reunioes.filter(r => startsOn(r.reuniao_data, viewYear, viewMonth, day)) : []
              const dayTarefas  = isCurrentMonth ? tarefas.filter(t => startsOn(t.data_prazo, viewYear, viewMonth, day)) : []

              const isToday = isCurrentMonth
                && day === today.getDate()
                && viewMonth === today.getMonth()
                && viewYear === today.getFullYear()
              const isSunday  = col === 0
              const isLastRow = i >= totalCells - 7
              const isLastCol = col === 6

              // max visible items
              const MAX = 4
              const allItems = [
                ...dayEvents.map(e => ({ kind: 'event' as const, e })),
                ...dayPws.map(p => ({ kind: 'pw' as const, p })),
                ...dayTeam.map(t => ({ kind: 'team' as const, t })),
                ...dayReunioes.map(r => ({ kind: 'reuniao' as const, r })),
                ...dayTarefas.map(t => ({ kind: 'tarefa' as const, t })),
              ]
              const visible  = allItems.slice(0, MAX)
              const overflow = allItems.length - MAX

              return (
                <div key={i}
                  onClick={() => { if (isCurrentMonth) openChooser(viewYear, viewMonth, day) }}
                  className={`group relative min-h-[96px] p-1.5 flex flex-col cursor-pointer transition-colors
                    ${!isLastRow ? 'border-b border-white/[0.04]' : ''}
                    ${!isLastCol ? 'border-r border-white/[0.04]' : ''}
                    ${isCurrentMonth ? 'hover:bg-white/[0.02]' : 'bg-white/[0.01]'}
                  `}>
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1 flex-shrink-0">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                      ${isToday ? 'bg-[#C9A84C] text-black font-semibold' : ''}
                      ${!isToday && isCurrentMonth && !isSunday ? 'text-white/60' : ''}
                      ${!isToday && isCurrentMonth && isSunday ? 'text-red-400/60' : ''}
                      ${!isCurrentMonth ? 'text-white/15' : ''}
                    `}>
                      {day}
                    </div>
                    {isCurrentMonth && (
                      <span className="text-[14px] leading-none text-white/0 group-hover:text-[#C9A84C]/70 transition-colors pr-0.5"
                        title="Adicionar tarefa">＋</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {visible.map((item, idx) => {
                      if (item.kind === 'event') {
                        const ev = item.e
                        return (
                          <button key={`ev-${ev.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'event', data: ev }) }} className="text-left w-full">
                            <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}>
                              {ev.cliente || ev.referencia}
                            </div>
                          </button>
                        )
                      }
                      if (item.kind === 'pw') {
                        const pw = item.p
                        return (
                          <button key={`pw-${pw.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'pw', data: pw }) }} className="text-left w-full">
                            <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                              style={{ background: 'rgba(79,195,195,0.10)', border: '1px solid rgba(79,195,195,0.25)', color: '#4FC3C3' }}>
                              📷 {pw.nomes}
                            </div>
                          </button>
                        )
                      }
                      if (item.kind === 'reuniao') {
                        const r = item.r
                        return (
                          <button key={`re-${r.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'reuniao', data: r }) }} className="text-left w-full">
                            <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                              style={{ background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.28)', color: '#C084FC' }}>
                              🤝 {r.nome.split(' ')[0]}
                            </div>
                          </button>
                        )
                      }
                      if (item.kind === 'tarefa') {
                        const ta = item.t
                        const linkedEvent = ta.evento_id ? eventsById.get(ta.evento_id) : null
                        // If linked to event → gold; otherwise color by status
                        const statusCol = ta.status === 'CONCLUIDA'
                          ? { bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)', text: '#86EFAC' }
                          : ta.status === 'PENDENTE'
                          ? { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.28)', text: '#FB923C' }
                          : linkedEvent
                          ? { bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.30)', text: '#C9A84C' }
                          : { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)', text: '#60A5FA' }
                        const horaStr = ta.hora ? ta.hora.slice(0, 5) : null
                        const icon = linkedEvent ? '🔗' : '📝'
                        return (
                          <button key={`ta-${ta.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'tarefa', data: ta }) }} className="text-left w-full">
                            <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                              style={{
                                background: statusCol.bg,
                                border: `1px solid ${statusCol.border}`,
                                color: statusCol.text,
                                textDecoration: ta.status === 'CONCLUIDA' ? 'line-through' : 'none',
                                opacity: ta.status === 'CONCLUIDA' ? 0.7 : 1,
                              }}>
                              {icon} {horaStr ? <span className="opacity-70">{horaStr}</span> : null} {ta.titulo}
                            </div>
                          </button>
                        )
                      }
                      // team entry
                      const t = item.t
                      const col = TIPO_COLORS[t.tipo]
                      const isIndis = t.status === 'indisponivel'
                      return (
                        <button key={`te-${t.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'team', data: t }) }} className="text-left w-full">
                          <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                            style={{
                              background: isIndis ? 'rgba(239,68,68,0.10)' : col.bg,
                              border: `1px solid ${isIndis ? 'rgba(239,68,68,0.25)' : col.border}`,
                              color: isIndis ? '#F87171' : col.text,
                            }}>
                            {isIndis ? '✕' : TIPO_LABELS[t.tipo]} {t.freelancer_nome.split(' ')[0]}
                          </div>
                        </button>
                      )
                    })}

                    {overflow > 0 && (
                      <div className="text-[9px] text-white/30 px-1">+{overflow} mais</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/30 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#C9A84C]" />Hoje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)' }} />
            Casamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(79,195,195,0.10)', border: '1px solid rgba(79,195,195,0.25)' }} />
            Pré-Wedding
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.28)' }} />
            🤝 Reunião CRM
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.28)' }} />
            ✓ Confirmado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }} />
            ✕ Indisponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }} />
            🖼 Ed. Fotos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)' }} />
            📘 Ed. Álbum
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)' }} />
            🎬 Ed. Vídeo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)' }} />
            📝 Tarefa
          </span>
          <span className="ml-auto text-white/20">
            {events.length} eventos · {preWeddings.length} pré-weddings · {teamEntries.filter(t => t.status === 'confirmado').length} confirmações · {tarefas.length} tarefas
          </span>
        </div>

        <div className="mt-3 text-[10px] text-white/30 tracking-wider">
          💡 Clica num dia para adicionar tarefa, reunião CRM ou pré-wedding — aparece logo nos Time Blocks.
        </div>

        {/* Time Blocks */}
        <TimeBlocks events={events} tarefas={tarefas} preWeddings={preWeddings} reunioes={reunioes} />
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6"
            style={{
              border: `1px solid ${
                selected.kind === 'pw'      ? 'rgba(79,195,195,0.25)' :
                selected.kind === 'reuniao' ? 'rgba(192,132,252,0.30)' :
                selected.kind === 'team'    ? (
                  selected.data.status === 'indisponivel'
                    ? 'rgba(239,68,68,0.25)'
                    : TIPO_COLORS[selected.data.tipo].border
                ) : 'rgba(201,168,76,0.2)'
              }`
            }}
            onClick={e => e.stopPropagation()}>

            {selected.kind === 'event' && (
              <>
                <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/50 uppercase mb-1">{selected.data.referencia}</div>
                <h2 className="text-xl font-light text-white tracking-wide mb-4">{selected.data.cliente || '—'}</h2>
                <div className="space-y-2 mb-6">
                  {selected.data.data_evento && <Row label="Data">{fmtDate(selected.data.data_evento)}</Row>}
                  {selected.data.local && <Row label="Local">{selected.data.local}</Row>}
                  {selected.data.tipo_evento?.length > 0 && <Row label="Tipo">{selected.data.tipo_evento.join(', ')}</Row>}
                  {selected.data.fotografo?.length > 0 && <Row label="Foto">{selected.data.fotografo.join(', ')}</Row>}
                  {selected.data.videografo?.length > 0 && <Row label="Vídeo">{selected.data.videografo.join(', ')}</Row>}
                </div>
                <ModalActions>
                  <Link href={`/eventos-2026/${selected.data.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                    style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
                    Ver Evento
                  </Link>
                  <CloseBtn onClose={() => setSelected(null)} />
                </ModalActions>
              </>
            )}

            {selected.kind === 'pw' && (
              <>
                <div className="text-[10px] tracking-[0.4em] text-[#4FC3C3]/50 uppercase mb-1">PRÉ-WEDDING · {selected.data.referencia}</div>
                <h2 className="text-xl font-light text-white tracking-wide mb-4">{selected.data.nomes}</h2>
                <div className="space-y-2 mb-6">
                  <Row label="Data">{fmtDate(selected.data.data_evento)}</Row>
                  {selected.data.hora && <Row label="Hora">{selected.data.hora}</Row>}
                  {selected.data.local && <Row label="Local">{selected.data.local}</Row>}
                </div>
                <ModalActions>
                  <Link href="/pre-wedding"
                    className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                    style={{ background: 'rgba(79,195,195,0.10)', border: '1px solid rgba(79,195,195,0.30)', color: '#4FC3C3' }}>
                    Ver Pré-Wedding
                  </Link>
                  <CloseBtn onClose={() => setSelected(null)} />
                </ModalActions>
              </>
            )}

            {selected.kind === 'reuniao' && (() => {
              const r = selected.data
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: 'rgba(192,132,252,0.6)' }}>
                    REUNIÃO CRM · {r.reuniao_tipo || 'Presencial'}
                  </div>
                  <h2 className="text-xl font-light text-white tracking-wide mb-4">{r.nome}</h2>
                  <div className="space-y-2 mb-6">
                    <Row label="Data">{fmtDate(r.reuniao_data)}</Row>
                    {r.reuniao_hora && <Row label="Hora">{r.reuniao_hora}</Row>}
                    <Row label="Tipo">{r.reuniao_tipo || 'Presencial'}</Row>
                    {r.reuniao_link && (
                      <Row label={r.reuniao_tipo === 'Videochamada' ? 'Meet' : 'Local'}>
                        <a href={r.reuniao_link} target="_blank" rel="noopener noreferrer"
                          className={`hover:opacity-80 transition-opacity break-all ${r.reuniao_tipo === 'Videochamada' ? 'text-green-400' : 'text-blue-400'}`}>
                          {r.reuniao_tipo === 'Videochamada' ? r.reuniao_link : '📍 Ver no Google Maps'}
                        </a>
                      </Row>
                    )}
                  </div>
                  <ModalActions>
                    <Link href={`/crm/${r.id}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                      style={{ background: 'rgba(192,132,252,0.10)', border: '1px solid rgba(192,132,252,0.30)', color: '#C084FC' }}>
                      Ver Ficha CRM
                    </Link>
                    <CloseBtn onClose={() => setSelected(null)} />
                  </ModalActions>
                </>
              )
            })()}

            {selected.kind === 'tarefa' && (() => {
              const ta = selected.data
              const statusCol = ta.status === 'CONCLUIDA'
                ? { text: '#86EFAC', border: 'rgba(74,222,128,0.30)', bg: 'rgba(74,222,128,0.10)' }
                : ta.status === 'PENDENTE'
                ? { text: '#FB923C', border: 'rgba(251,146,60,0.30)', bg: 'rgba(251,146,60,0.10)' }
                : { text: '#60A5FA', border: 'rgba(96,165,250,0.30)', bg: 'rgba(96,165,250,0.10)' }
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: statusCol.text + 'B0' }}>
                    📝 TAREFA · {ta.status}
                  </div>

                  {!editingTask ? (
                    <>
                      <h2 className="text-xl font-light text-white tracking-wide mb-4">{ta.titulo}</h2>
                      <div className="space-y-2 mb-6">
                        <Row label="Data">{fmtDate(ta.data_prazo)}</Row>
                        {ta.hora && <Row label="Hora">{ta.hora.slice(0, 5)}</Row>}
                        {ta.evento_id && eventsById.get(ta.evento_id) && (
                          <Row label="Evento">
                            <Link href={`/eventos-2026/${ta.evento_id}`}
                              className="text-[#C9A84C] hover:underline">
                              🔗 {eventsById.get(ta.evento_id)!.cliente || eventsById.get(ta.evento_id)!.referencia}
                            </Link>
                          </Row>
                        )}
                        {ta.descricao && <Row label="Notas">{ta.descricao}</Row>}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => startEditTask(ta)}
                          className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                          style={{ background: statusCol.bg, border: `1px solid ${statusCol.border}`, color: statusCol.text }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteTask(ta.id)}
                          className="px-4 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#F87171' }}>
                          Eliminar
                        </button>
                        <CloseBtn onClose={() => setSelected(null)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        value={editTitulo}
                        onChange={e => setEditTitulo(e.target.value)}
                        placeholder="Título"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3"
                      />
                      <div className="flex gap-2 mb-3">
                        <input
                          type="time"
                          value={editHora}
                          onChange={e => setEditHora(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                        />
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value as TarefaEvent['status'])}
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                        >
                          <option value="NOVA">Nova</option>
                          <option value="PENDENTE">Pendente</option>
                          <option value="CONCLUIDA">Concluída</option>
                        </select>
                      </div>
                      <select
                        value={editEventoId}
                        onChange={e => setEditEventoId(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40 mb-3"
                      >
                        <option value="">— Sem ligação a evento —</option>
                        {nearbyEvents(ta.data_prazo).map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.data_evento ? ev.data_evento.slice(0, 10) + ' · ' : ''}{ev.cliente || ev.referencia}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Notas (opcional)"
                        rows={3}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-4 resize-none"
                      />
                      <div className="flex gap-3">
                        <button onClick={handleUpdateTask} disabled={editSaving || !editTitulo.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                          style={{ background: statusCol.bg, border: `1px solid ${statusCol.border}`, color: statusCol.text }}>
                          {editSaving ? 'A guardar…' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingTask(false)}
                          className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {selected.kind === 'team' && (() => {
              const t = selected.data
              const isIndis = t.status === 'indisponivel'
              const c = isIndis
                ? { text: '#F87171', border: 'rgba(239,68,68,0.30)', bg: 'rgba(239,68,68,0.10)' }
                : { text: TIPO_COLORS[t.tipo].text, border: TIPO_COLORS[t.tipo].border, bg: TIPO_COLORS[t.tipo].bg }
              const tipoLabel = t.tipo === 'confirmacao' ? 'CONFIRMAÇÃO DE PRESENÇA'
                : t.tipo === 'edicao_fotos'  ? 'EDIÇÃO DE FOTOS'
                : t.tipo === 'edicao_album'  ? 'EDIÇÃO DE ÁLBUM'
                : 'EDIÇÃO DE VÍDEO'
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: c.text + '80' }}>
                    {tipoLabel}
                  </div>
                  <h2 className="text-xl font-light text-white tracking-wide mb-1">{t.freelancer_nome}</h2>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs mb-4"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {isIndis ? '✕ Indisponível' : '✓ Confirmado'}
                  </div>
                  <div className="space-y-2 mb-6">
                    <Row label="Confirmou em">{fmtDate(t.data_calendar)}</Row>
                    <Row label="Data evento">{fmtDate(t.data_evento)}</Row>
                    {t.local && <Row label="Local">{t.local}</Row>}
                  </div>
                  <ModalActions>
                    <Link href="/freelancers"
                      className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      Ver Equipa
                    </Link>
                    <CloseBtn onClose={() => setSelected(null)} />
                  </ModalActions>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskDate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setAddTaskDate(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border border-[#C9A84C]/25"
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/60 uppercase mb-1">📝 NOVA TAREFA</div>
            <h2 className="text-xl font-light text-white tracking-wide mb-4">{fmtDate(addTaskDate)}</h2>

            <input
              value={taskTitulo}
              onChange={e => setTaskTitulo(e.target.value)}
              placeholder="Título da tarefa"
              autoFocus
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3"
              onKeyDown={e => { if (e.key === 'Enter' && taskTitulo.trim() && !taskSaving) handleCreateTask() }}
            />

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input
                  type="time"
                  value={taskHora}
                  onChange={e => setTaskHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Ligar a evento (opcional)</label>
              <select
                value={taskEventoId}
                onChange={e => setTaskEventoId(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
              >
                <option value="">— Sem ligação —</option>
                {nearbyEvents(addTaskDate).map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.data_evento ? ev.data_evento.slice(0, 10) + ' · ' : ''}{ev.cliente || ev.referencia}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Notas (opcional)"
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-4 resize-none"
            />

            <div className="flex gap-3">
              <button onClick={handleCreateTask}
                disabled={taskSaving || !taskTitulo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
                {taskSaving ? 'A guardar…' : 'Adicionar Tarefa'}
              </button>
              <button onClick={() => setAddTaskDate(null)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Chooser ────────────────────────── */}
      {chooserDate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setChooserDate(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border border-white/15"
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] text-white/40 uppercase mb-1">+ NOVO EVENTO</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-5">{fmtDate(chooserDate)}</h2>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { openAddTask(parseInt(chooserDate.slice(0,4), 10), parseInt(chooserDate.slice(5,7), 10) - 1, parseInt(chooserDate.slice(8,10), 10)); setChooserDate(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
                <span className="text-2xl">📝</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Tarefa</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Pequena tarefa do dia com hora</div>
                </div>
              </button>

              <button
                onClick={() => openReuniao(chooserDate)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)' }}>
                <span className="text-2xl">🤝</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Reunião CRM</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Agendar reunião num contacto existente</div>
                </div>
              </button>

              <button
                onClick={() => openPreWedding(chooserDate)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(79,195,195,0.08)', border: '1px solid rgba(79,195,195,0.25)' }}>
                <span className="text-2xl">📷</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Pré-Wedding</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Marcar sessão pré-wedding num casamento</div>
                </div>
              </button>
            </div>

            <div className="mt-4 text-[10px] text-white/30 tracking-wider">
              Sai automaticamente para os Time Blocks deste dia.
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Reunião modal ────────────────────────── */}
      {reuniaoOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setReuniaoOpen(false)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(192,132,252,0.30)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#C084FCB0' }}>🤝 NOVA REUNIÃO CRM</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-4">{fmtDate(reuniaoDate)}</h2>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Contacto</label>
            <select value={reuniaoCrmId} onChange={e => setReuniaoCrmId(e.target.value)}
              disabled={reuniaoLoading}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40 mb-3">
              <option value="">{reuniaoLoading ? 'A carregar contactos…' : '— Escolhe contacto —'}</option>
              {reuniaoContactos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.contato ? ` · ${c.contato}` : ''}{c.reuniao_data ? `  (já tem reunião ${c.reuniao_data})` : ''}
                </option>
              ))}
            </select>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input type="time" value={reuniaoHora} onChange={e => setReuniaoHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40" />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Tipo</label>
                <select value={reuniaoTipo} onChange={e => setReuniaoTipo(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40">
                  <option value="Presencial">Presencial</option>
                  <option value="Videochamada">Videochamada</option>
                </select>
              </div>
            </div>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">
              {reuniaoTipo === 'Videochamada' ? 'Link Meet' : 'Local (opcional)'}
            </label>
            <input value={reuniaoLink} onChange={e => setReuniaoLink(e.target.value)}
              placeholder={reuniaoTipo === 'Videochamada' ? 'https://meet.google.com/…' : 'Morada / sala'}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C084FC]/40 mb-4" />

            <div className="flex gap-3">
              <button onClick={handleSaveReuniao}
                disabled={reuniaoSaving || !reuniaoCrmId}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.45)', color: '#C084FC' }}>
                {reuniaoSaving ? 'A guardar…' : 'Agendar Reunião'}
              </button>
              <button onClick={() => setReuniaoOpen(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Pré-Wedding modal ────────────────────────── */}
      {pwOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPwOpen(false)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(79,195,195,0.30)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#4FC3C3B0' }}>📷 NOVO PRÉ-WEDDING</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-4">{fmtDate(pwDate)}</h2>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Casamento</label>
            <select value={pwReferencia} onChange={e => setPwReferencia(e.target.value)}
              disabled={pwLoading}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4FC3C3]/40 mb-3">
              <option value="">{pwLoading ? 'A carregar portais…' : '— Escolhe casamento —'}</option>
              {pwPortais.map(p => {
                const nomes = [p.noiva, p.noivo].filter(Boolean).join(' & ')
                return (
                  <option key={p.referencia} value={p.referencia}>
                    {p.referencia}{nomes ? ` · ${nomes}` : ''}{p.has_pw ? `  (já tem PW ${p.pw_date})` : ''}
                  </option>
                )
              })}
            </select>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input type="time" value={pwHora} onChange={e => setPwHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4FC3C3]/40" />
              </div>
            </div>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Local (opcional)</label>
            <input value={pwLocal} onChange={e => setPwLocal(e.target.value)}
              placeholder="ex.: Quinta da Aroeira"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4FC3C3]/40 mb-4" />

            <div className="flex gap-3">
              <button onClick={handleSavePreWedding}
                disabled={pwSaving || !pwReferencia}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(79,195,195,0.15)', border: '1px solid rgba(79,195,195,0.45)', color: '#4FC3C3' }}>
                {pwSaving ? 'A guardar…' : 'Marcar Pré-Wedding'}
              </button>
              <button onClick={() => setPwOpen(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70">
                Cancelar
              </button>
            </div>

            <div className="mt-3 text-[10px] text-white/30 tracking-wider">
              ⚠️ Se o casamento já tem um PW marcado, este novo substitui o anterior.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-20 pt-0.5 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/70">{children}</span>
    </div>
  )
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3">{children}</div>
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose}
      className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
      Fechar
    </button>
  )
}
