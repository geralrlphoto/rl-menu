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

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function getEventsForDate(events: CalEvent[], year: number, month: number, day: number) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return events.filter(e => e.data_evento?.startsWith(dateStr))
}

export default function CalendarClient({ events }: { events: CalEvent[] }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<CalEvent | null>(null)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Count events per month for the year strip
  const monthCounts = Array.from({ length: 12 }, (_, i) =>
    events.filter(e => {
      if (!e.data_evento) return false
      const d = new Date(e.data_evento + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
  )

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-white/[0.06] relative">
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
            <button
              key={i}
              onClick={() => setViewMonth(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                i === viewMonth
                  ? 'bg-[#C9A84C] text-black font-semibold'
                  : 'border border-white/[0.08] text-white/40 hover:border-[#C9A84C]/40 hover:text-white/70'
              }`}
            >
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
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-[10px] tracking-[0.2em] text-white/25 uppercase font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
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

              const dayEvents = isCurrentMonth
                ? getEventsForDate(events, viewYear, viewMonth, day)
                : []

              const isToday = isCurrentMonth
                && day === today.getDate()
                && viewMonth === today.getMonth()
                && viewYear === today.getFullYear()

              const isSunday = col === 0
              const isSaturday = col === 6
              const isLastRow = i >= totalCells - 7
              const isLastCol = col === 6

              return (
                <div
                  key={i}
                  className={`relative min-h-[90px] p-1.5 flex flex-col
                    ${!isLastRow ? 'border-b border-white/[0.04]' : ''}
                    ${!isLastCol ? 'border-r border-white/[0.04]' : ''}
                    ${isCurrentMonth ? 'bg-transparent' : 'bg-white/[0.01]'}
                  `}
                >
                  {/* Day number */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1 flex-shrink-0
                    ${isToday ? 'bg-[#C9A84C] text-black font-semibold' : ''}
                    ${!isToday && isCurrentMonth && !isSunday ? 'text-white/60' : ''}
                    ${!isToday && isCurrentMonth && isSunday ? 'text-red-400/60' : ''}
                    ${!isCurrentMonth ? 'text-white/15' : ''}
                  `}>
                    {day}
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelected(ev)}
                        className="text-left w-full"
                      >
                        <div className="px-1.5 py-0.5 rounded text-[10px] leading-tight bg-[#C9A84C]/15 border border-[#C9A84C]/20 hover:bg-[#C9A84C]/25 transition-colors truncate text-[#C9A84C]">
                          {ev.cliente || ev.referencia}
                        </div>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-white/30 px-1">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-[10px] text-white/25 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#C9A84C]"></span>
            Hoje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#C9A84C]/15 border border-[#C9A84C]/20"></span>
            Evento
          </span>
          <span className="ml-auto">{events.length} eventos no total</span>
        </div>
      </div>

      {/* Event detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md bg-[#111] border border-[#C9A84C]/20 rounded-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Ref */}
            <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/50 uppercase mb-1">{selected.referencia}</div>

            {/* Cliente */}
            <h2 className="text-xl font-light text-white tracking-wide mb-4">{selected.cliente || '—'}</h2>

            <div className="space-y-2 mb-6">
              {selected.data_evento && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-16">Data</span>
                  <span className="text-sm text-white/80">
                    {new Date(selected.data_evento + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {selected.local && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-16">Local</span>
                  <span className="text-sm text-white/80">{selected.local}</span>
                </div>
              )}
              {selected.tipo_evento?.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-16 pt-0.5">Tipo</span>
                  <span className="text-sm text-white/60">{selected.tipo_evento.join(', ')}</span>
                </div>
              )}
              {selected.fotografo?.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-16 pt-0.5">Foto</span>
                  <span className="text-sm text-white/60">{selected.fotografo.join(', ')}</span>
                </div>
              )}
              {selected.videografo?.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-16 pt-0.5">Vídeo</span>
                  <span className="text-sm text-white/60">{selected.videografo.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href={`/eventos-2026/${selected.id}`}
                className="flex-1 text-center py-2.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl text-sm text-[#C9A84C] tracking-wider hover:bg-[#C9A84C]/20 transition-colors"
              >
                Ver Evento
              </Link>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
