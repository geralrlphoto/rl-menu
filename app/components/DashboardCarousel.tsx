'use client'

import Link from 'next/link'
import { useState, useRef, useCallback, useEffect } from 'react'

export type DashCol = {
  key: string
  title: string[]
  subtitle: string
  empty: string
  items: { main: string; sub: string; tag: string | null; tagColor: string }[]
  href: string
}

function getPerPage() {
  if (typeof window === 'undefined') return 1
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 1024) return 2
  return 4
}

export function DashboardCarousel({ cols }: { cols: DashCol[] }) {
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(1) // mobile-first default

  useEffect(() => {
    function update() { setPerPage(getPerPage()) }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const totalPages = Math.ceil(cols.length / perPage)

  useEffect(() => {
    setPage(p => Math.min(p, Math.max(0, totalPages - 1)))
  }, [perPage, totalPages])

  const visible = cols.slice(page * perPage, (page + 1) * perPage)
  const padded = [...visible, ...Array(perPage - visible.length).fill(null)]

  const wheelAccum = useRef(0)
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0)
    if (delta === 0) return
    e.preventDefault()
    wheelAccum.current += delta
    if (wheelTimer.current) clearTimeout(wheelTimer.current)
    wheelTimer.current = setTimeout(() => { wheelAccum.current = 0 }, 300)
    if (wheelAccum.current > 80) {
      wheelAccum.current = 0
      setPage(p => Math.min(p + 1, totalPages - 1))
    } else if (wheelAccum.current < -80) {
      wheelAccum.current = 0
      setPage(p => Math.max(p - 1, 0))
    }
  }, [totalPages])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (dx < -40) setPage(p => Math.min(p + 1, totalPages - 1))
    else if (dx > 40) setPage(p => Math.max(p - 1, 0))
  }

  const gridClass =
    perPage === 1 ? 'grid-cols-1' :
    perPage === 2 ? 'grid-cols-2' :
    'grid-cols-4'

  return (
    <div
      className="relative select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Seta esquerda */}
      {page > 0 && (
        <button
          onClick={() => setPage(p => p - 1)}
          className="absolute left-0 top-0 bottom-8 z-10 w-8 sm:w-10 flex items-center justify-center bg-gradient-to-r from-[#0d0d0d] to-transparent text-white/40 hover:text-[#C9A84C] transition-colors text-2xl"
        >‹</button>
      )}

      <div className={`grid ${gridClass} divide-x divide-white/[0.06]`}>
        {padded.map((col, i) =>
          col ? (
            <Link key={col.key} href={col.href}
              className="group relative px-5 py-5 sm:p-7 hover:bg-white/[0.02] transition-colors duration-300 min-h-[200px] sm:min-h-[220px] flex flex-col">

              <span className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[#C9A84C]/40 group-hover:text-[#C9A84C] transition-colors text-sm leading-none">↗</span>

              {/* Título */}
              <div className="mb-1 pr-6">
                {col.title.map((line: string, j: number) => (
                  <p key={j} className="text-[20px] sm:text-[22px] font-bold tracking-[0.06em] sm:tracking-[0.08em] text-white uppercase leading-tight">{line}</p>
                ))}
              </div>

              {/* Subtítulo */}
              <p className="text-[11px] text-[#C9A84C]/70 italic font-semibold tracking-wider mb-4">{col.subtitle}</p>

              {/* Lista */}
              <div className="flex flex-col gap-2.5 flex-1">
                {col.items.length === 0 ? (
                  <p className="text-[11px] text-white/15 tracking-wider italic">{col.empty}</p>
                ) : (
                  col.items.map((item, k) => (
                    <div key={k} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/75 truncate leading-snug">{item.main}</p>
                        {item.sub && (
                          <p className="text-[10px] text-white/25 tracking-wider truncate mt-0.5">{item.sub}</p>
                        )}
                      </div>
                      {item.tag && (
                        <span className={`text-[10px] font-semibold tracking-wider shrink-0 mt-0.5 ${item.tagColor}`}>
                          {item.tag}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Link>
          ) : (
            <div key={`empty-${i}`} className="min-h-[200px] sm:min-h-[220px]" />
          )
        )}
      </div>

      {/* Seta direita */}
      {page < totalPages - 1 && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="absolute right-0 top-0 bottom-8 z-10 w-8 sm:w-10 flex items-center justify-center bg-gradient-to-l from-[#0d0d0d] to-transparent text-white/40 hover:text-[#C9A84C] transition-colors text-2xl"
        >›</button>
      )}

      {/* Indicadores */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 border-t border-white/[0.04]">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`rounded-full transition-all ${i === page ? 'w-4 h-1.5 bg-[#C9A84C]/70' : 'w-1.5 h-1.5 bg-white/15 hover:bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
