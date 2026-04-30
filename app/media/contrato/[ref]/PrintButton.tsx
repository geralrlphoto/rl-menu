'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/60 border border-white/10
                 hover:border-white/25 px-4 py-2 uppercase transition-all duration-200"
    >
      Imprimir / PDF
    </button>
  )
}
