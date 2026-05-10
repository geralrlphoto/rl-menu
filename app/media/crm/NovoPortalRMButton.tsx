'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NovoPortalRMButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    // Gerar UUID v4
    const token = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    router.push(`/rm/${token}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group flex items-center gap-3 border border-emerald-400/25 bg-emerald-400/[0.04] hover:bg-emerald-400/[0.10]
                 hover:border-emerald-400/45 px-6 py-4 transition-all duration-300 disabled:opacity-40"
    >
      <svg className="w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-300/80 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
      </svg>
      <span className="text-[9px] tracking-[0.45em] text-emerald-400/50 group-hover:text-emerald-300/80 uppercase transition-colors whitespace-nowrap">
        {loading ? 'A criar...' : 'Novo Portal Reunião'}
      </span>
    </button>
  )
}
