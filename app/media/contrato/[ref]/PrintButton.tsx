'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-2 text-[12.5px] font-medium text-white transition-colors"
    >
      Imprimir / PDF
    </button>
  )
}
