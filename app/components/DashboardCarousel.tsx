'use client'

import Link from 'next/link'
import { useState } from 'react'

export type DashCol = {
  key: string
  title: string[]
  subtitle: string
  empty: string
  items: { main: string; sub: string; tag: string | null; tagColor: string }[]
  href: string
}

export function DashboardCarousel({ cols }: { cols: DashCol[] }) {
  const [page, setPage] = useState(0)
  const perPage = 4
  const totalPages = Math.ceil(cols.length / perPage)
  const visible = cols.slice(page * perPage, (page + 1) * perPage)
  // Pad to always show 4 columns
  const padded = [...visible, ...Array(perPage - visible.length).fill(null)]

  return (
    <div className="relative">
      {/* Seta esquerda */}
      {page > 0 && (
        <button
          onClick={() => setPage(p => p - 1)}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-[#0d0d0d] to-transparent text-white/30 hover:text-[#C9A84C] transition-colors text-2xl"
        >
          ‹
        </button>
      )}

      <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
        {padded.map((col, i) =>
          col ? (
            <Link key={col.key} href={col.href}
              className="group relative p-7 hover:bg-white/[0.02] transition-colors duration-300 min-h-[220px] flex flex-col">

              {/* Seta top-right */}
              <span className="absolute top-6 right-6 text-[#C9A84C]/50 group-hover:text-[#C9A84C] transition-colors text-base leading-none">↗</span>

              {/* Título */}
              <div className="mb-1">
                {col.title.map((line: string, j: number) => (
                  <p key={j} className="text-[22px] font-bold tracking-[0.08em] text-white uppercase leading-tight">{line}</p>
                ))}
              </div>

              {/* Subtítulo */}
              <p className="text-[11px] text-[#C9A84C]/70 italic font-semibold tracking-wider mb-5">{col.subtitle}</p>

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
            <div key={`empty-${i}`} className="min-h-[220px]" />
          )
        )}
      </div>

      {/* Seta direita */}
      {page < totalPages - 1 && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-[#0d0d0d] to-transparent text-white/30 hover:text-[#C9A84C] transition-colors text-2xl"
        >
          ›
        </button>
      )}

      {/* Indicadores de página */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2 border-t border-white/[0.04]">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === page ? 'bg-[#C9A84C]/70' : 'bg-white/15 hover:bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
