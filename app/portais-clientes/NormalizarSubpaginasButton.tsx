'use client'

import { useState } from 'react'

const TEMPLATE_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const DESIRED_KEYWORDS = [
  'SOBRE', 'ATEND', 'CONTRATO', 'PAGAMENTO',
  'GUIA', 'FOTOGRAF', 'FILME', 'VIDEO',
  'BRIEFING', 'SAT', 'ÁREA', 'AREA', 'CRONOGRAMA',
]

function isDesiredSubpage(title: string): boolean {
  const t = title.toUpperCase()
  return DESIRED_KEYWORDS.some(kw => t.includes(kw))
}

export default function NormalizarSubpaginasButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)
  const [msg, setMsg] = useState('')

  async function handleNormalizar() {
    setState('loading')
    setMsg('')
    try {
      // 1. Fetch template blocks to compute hiddenNav
      const templateData = await fetch(`/api/portais-clientes?id=${TEMPLATE_PAGE_ID}`).then(r => r.json())
      const allChildPages: Array<{ id: string; title: string }> = (templateData.blocks ?? [])
        .filter((b: any) => b.type === 'child_page')
        .map((b: any) => ({ id: b.id, title: b.child_page?.title ?? '' }))

      const hiddenNav = allChildPages
        .filter(p => !isDesiredSubpage(p.title))
        .map(p => p.id)

      // 2. Fetch all portals
      const portaisData = await fetch('/api/portais').then(r => r.json())
      const portais: Array<{ referencia: string }> = portaisData.portais ?? []

      // 3. PATCH each portal with the correct hiddenNav
      let updated = 0
      for (const portal of portais) {
        await fetch('/api/portais', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referencia: portal.referencia,
            updates: { settings: { hiddenNav } },
          }),
        })
        updated++
      }

      setCount(updated)
      setState('done')
      setTimeout(() => setState('idle'), 4000)
    } catch (e: any) {
      setMsg(e.message ?? 'Erro desconhecido')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <button
      onClick={handleNormalizar}
      disabled={state === 'loading'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all border ${
        state === 'done'
          ? 'border-green-400/40 text-green-400 bg-green-400/10'
          : state === 'error'
          ? 'border-red-400/40 text-red-400 bg-red-400/10'
          : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 disabled:opacity-40'
      }`}
    >
      {state === 'loading' ? (
        <><span className="animate-spin inline-block w-3 h-3 border border-white/30 border-t-white/70 rounded-full" />A normalizar...</>
      ) : state === 'done' ? (
        <>✓ {count} portais atualizados</>
      ) : state === 'error' ? (
        <>✕ Erro</>
      ) : (
        <>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Sub-páginas
        </>
      )}
    </button>
  )
}
