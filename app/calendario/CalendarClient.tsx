'use client'

import { useState } from 'react'
import Link from 'next/link'

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

type SelectedItem =
  | { kind: 'event'; data: CalEvent }
  | { kind: 'pw'; data: PreWeddingEvent }
  | { kind: 'team'; data: TeamEntry }

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
}: {
  events: CalEvent[]
  preWeddings: PreWeddingEvent[]
  teamEntries: TeamEntry[]
}) {
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected]   = useState<SelectedItem | null>(null)

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
    // team entries: count unique dates with at least 1 confirmed (not indisponivel)
    const te = teamEntries.filter(t => {
      if (t.status !== 'confirmado') return false
      const d = new Date(t.data_calendar + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    return ev + pw + te
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

              const dayEvents = isCurrentMonth ? events.filter(e => startsOn(e.data_evento, viewYear, viewMonth, day)) : []
              const dayPws    = isCurrentMonth ? preWeddings.filter(p => startsOn(p.data_evento, viewYear, viewMonth, day)) : []
              const dayTeam   = isCurrentMonth ? teamEntries.filter(t => startsOn(t.data_calendar, viewYear, viewMonth, day)) : []

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
              ]
              const visible  = allItems.slice(0, MAX)
              const overflow = allItems.length - MAX

              return (
                <div key={i}
                  className={`relative min-h-[96px] p-1.5 flex flex-col
                    ${!isLastRow ? 'border-b border-white/[0.04]' : ''}
                    ${!isLastCol ? 'border-r border-white/[0.04]' : ''}
                    ${isCurrentMonth ? '' : 'bg-white/[0.01]'}
                  `}>
                  {/* Day number */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1 flex-shrink-0
                    ${isToday ? 'bg-[#C9A84C] text-black font-semibold' : ''}
                    ${!isToday && isCurrentMonth && !isSunday ? 'text-white/60' : ''}
                    ${!isToday && isCurrentMonth && isSunday ? 'text-red-400/60' : ''}
                    ${!isCurrentMonth ? 'text-white/15' : ''}
                  `}>
                    {day}
                  </div>

                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {visible.map((item, idx) => {
                      if (item.kind === 'event') {
                        const ev = item.e
                        return (
                          <button key={`ev-${ev.id}`} onClick={() => setSelected({ kind: 'event', data: ev })} className="text-left w-full">
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
                          <button key={`pw-${pw.id}`} onClick={() => setSelected({ kind: 'pw', data: pw })} className="text-left w-full">
                            <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight truncate"
                              style={{ background: 'rgba(79,195,195,0.10)', border: '1px solid rgba(79,195,195,0.25)', color: '#4FC3C3' }}>
                              📷 {pw.nomes}
                            </div>
                          </button>
                        )
                      }
                      // team entry
                      const t = item.t
                      const col = TIPO_COLORS[t.tipo]
                      const isIndis = t.status === 'indisponivel'
                      return (
                        <button key={`te-${t.id}`} onClick={() => setSelected({ kind: 'team', data: t })} className="text-left w-full">
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
          <span className="ml-auto text-white/20">
            {events.length} eventos · {preWeddings.length} pré-weddings · {teamEntries.filter(t => t.status === 'confirmado').length} confirmações
          </span>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6"
            style={{
              border: `1px solid ${
                selected.kind === 'pw'   ? 'rgba(79,195,195,0.25)' :
                selected.kind === 'team' ? (
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
