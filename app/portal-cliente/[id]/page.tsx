'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { NotionBlocks, type Block } from '../NotionRenderer'

export default function PortalSubPage() {
  const { id } = useParams<{ id: string }>()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/portais-clientes?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setBlocks(d.blocks ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erro ao carregar'); setLoading(false) })

    fetch(`/api/notion-page-title?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.title) setTitle(d.title) })
      .catch(() => {})
  }, [id])

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[860px] mx-auto">
      <Link href="/portal-cliente" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-8">
        ‹ PORTAL DOS NOIVOS
      </Link>

      <header className="mb-8">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-xl sm:text-2xl font-light tracking-widest text-gold uppercase">
          {title || '...'}
        </h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {loading && <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>}
      {error   && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-8">
          <NotionBlocks blocks={blocks} />
        </div>
      )}
    </main>
  )
}
