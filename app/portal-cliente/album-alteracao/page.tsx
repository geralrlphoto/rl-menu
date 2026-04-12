'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Content() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-0.5 h-12 bg-gold/40 mb-2" />
      <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase">RL PHOTO.VIDEO</p>
      <h1 className="text-2xl font-light tracking-[0.3em] text-white uppercase">Fazer Alteração</h1>
      <p className="text-sm text-white/40 max-w-sm leading-relaxed">
        Por favor contacte-nos para solicitar alterações ao seu álbum.
      </p>
      {ref && (
        <p className="text-[10px] text-gold/40 tracking-widest font-mono">{ref}</p>
      )}
      <div className="w-0.5 h-12 bg-gold/40 mt-2" />
    </main>
  )
}

export default function AlbumAlteracaoPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  )
}
