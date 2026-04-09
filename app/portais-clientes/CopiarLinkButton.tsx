'use client'

import { useState } from 'react'

export default function CopiarLinkButton({ referencia }: { referencia: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/portal-cliente/ref/${encodeURIComponent(referencia)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold tracking-widest uppercase transition-all border ${
        copied
          ? 'border-green-400/40 text-green-400 bg-green-400/10'
          : 'border-white/15 text-white/45 hover:border-white/35 hover:text-white/75 bg-white/[0.03]'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Copiado!
        </>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copiar link
        </>
      )}
    </button>
  )
}
