'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { NotionBlocks, type Block } from '../NotionRenderer'
import BlockEditor from '../BlockEditor'

function notionUrl(id: string) {
  return `https://www.notion.so/${id.replace(/-/g, '')}`
}

export default function PortalSubPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [title, setTitle] = useState(searchParams.get('title') ?? '')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const loadBlocks = useCallback(async (bust = false) => {
    if (!id) return
    const url = `/api/portais-clientes?id=${id}${bust ? '&bust=1' : ''}`
    const d = await fetch(url).then(r => r.json())
    if (d.error) setError(d.error)
    else setBlocks(d.blocks ?? [])
  }, [id])

  useEffect(() => {
    if (!id) return
    loadBlocks().finally(() => setLoading(false))
    if (!title) {
      fetch(`/api/notion-page-title?id=${id}`)
        .then(r => r.json())
        .then(d => { if (d.title) setTitle(d.title) })
        .catch(() => {})
    }
  }, [id, loadBlocks])

  async function handleRefresh() {
    setRefreshing(true)
    await loadBlocks(true)
    setRefreshing(false)
  }

  async function handleSaved() {
    setEditing(false)
    setRefreshing(true)
    await loadBlocks(true)
    setRefreshing(false)
  }

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[860px] mx-auto">
      <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
        <Link href="/portal-cliente" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors">
          ‹ PORTAL DOS NOIVOS
        </Link>
        <div className="flex items-center gap-2">
          {/* Refresh */}
          {!editing && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar conteúdo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
            >
              <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? 'A atualizar...' : 'Atualizar'}
            </button>
          )}
          {/* Edit toggle */}
          {!editing && !loading && !error && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 transition-all"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editar
            </button>
          )}
        </div>
      </div>

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
          {editing && id
            ? <BlockEditor blocks={blocks} pageId={id} onSaved={handleSaved} />
            : <NotionBlocks blocks={blocks} />
          }
        </div>
      )}
    </main>
  )
}
