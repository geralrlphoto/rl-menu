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
      className={`mt-2 flex items-center gap-1 text-[9px] tracking-widest uppercase transition-all ${
        copied ? 'text-green-400/70' : 'text-white/20 hover:text-white/50'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Copiado!
        </>
      ) : (
        <>
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copiar link
        </>
      )}
    </button>
  )
}
