'use client'

import Link from 'next/link'

export function BatizadoButton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4
                    border border-[#C9A84C]/20 bg-[#C9A84C]/[0.03]
                    px-6 sm:px-8 py-5 rounded-sm">
      {/* Texto */}
      <div className="flex items-center gap-4">
        {/* Ícone vela/batizado */}
        <div className="shrink-0 w-9 h-9 border border-[#C9A84C]/25 flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M12 2c0 0-2 2-2 4s2 2 2 2 2-1 2-2-2-4-2-4z"/>
            <path d="M12 8v14"/>
            <path d="M8 22h8"/>
            <path d="M5 22c0-3.87 3.13-7 7-7s7 3.13 7 7"/>
          </svg>
        </div>
        <div>
          <p className="text-[8px] tracking-[0.5em] text-[#C9A84C]/40 uppercase mb-0.5">
            Formulário de Pedido
          </p>
          <p className="text-[11px] tracking-[0.3em] text-white/55 uppercase font-medium">
            Batizado · Fotografia & Vídeo
          </p>
        </div>
      </div>

      {/* Botão */}
      <Link
        href="/batizado"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 px-6 py-3 shrink-0
                   border border-[#C9A84C]/40 bg-[#C9A84C]/[0.06]
                   hover:bg-[#C9A84C]/[0.14] hover:border-[#C9A84C]/70
                   transition-all duration-300"
      >
        <span className="text-[9px] tracking-[0.45em] text-[#C9A84C]/60
                         group-hover:text-[#C9A84C]/90 uppercase transition-colors whitespace-nowrap">
          Abrir Formulário
        </span>
        <span className="text-[#C9A84C]/40 group-hover:text-[#C9A84C]/80 group-hover:translate-x-0.5
                         transition-all duration-300 text-sm">→</span>
      </Link>
    </div>
  )
}
