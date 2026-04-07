'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { NotionBlocks, type Block } from '../NotionRenderer'
import BlockEditor from '../BlockEditor'

function notionUrl(id: string) {
  return `https://www.notion.so/${id.replace(/-/g, '')}`
}

// Collect all image blocks recursively, returning {id, url}
function findImageBlocks(
  blocks: Block[],
  parentId: string | null = null
): Array<{ id: string; url: string; parentId: string | null; imageType: string; prevSiblingId: string | null }> {
  const out: Array<{ id: string; url: string; parentId: string | null; imageType: string; prevSiblingId: string | null }> = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const prevSiblingId = i > 0 ? blocks[i - 1].id : null
    if (b.type === 'image') {
      const imageType = b.image?.type ?? 'external'
      const url = imageType === 'external' ? b.image?.external?.url : b.image?.file?.url
      if (url) out.push({ id: b.id, url, parentId, imageType, prevSiblingId })
    }
    if (b.children) out.push(...findImageBlocks(b.children, b.id))
  }
  return out
}

function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try { resolve(JSON.parse(xhr.responseText).url ?? '') } catch { reject(new Error('Upload falhou')) }
    }
    xhr.onerror = () => reject(new Error('Erro de rede'))
    xhr.open('POST', '/api/upload-image')
    xhr.send(fd)
  })
}

function patchBlockUrl(blocks: Block[], blockId: string, newUrl: string): Block[] {
  return blocks.map(b => {
    if (b.id === blockId && b.type === 'image') {
      return { ...b, image: { type: 'external' as const, external: { url: newUrl } } }
    }
    if (b.children) return { ...b, children: patchBlockUrl(b.children, blockId, newUrl) }
    return b
  })
}

function ImageEditor({ blocks, pageId, onBlocksUpdated, onDone }: {
  blocks: Block[]
  pageId: string
  onBlocksUpdated: (newBlocks: Block[]) => void
  onDone: () => void
}) {
  const images = findImageBlocks(blocks)
  const [urls, setUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(images.map(img => [img.id, img.url]))
  )
  const [progress, setProgress] = useState<Record<string, number | null>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleUpload(blockId: string, file: File) {
    setProgress(p => ({ ...p, [blockId]: 0 }))
    try {
      const url = await uploadWithProgress(file, pct => setProgress(p => ({ ...p, [blockId]: pct })))
      if (url) setUrls(u => ({ ...u, [blockId]: url }))
    } finally {
      setProgress(p => ({ ...p, [blockId]: null }))
    }
  }

  async function handleSave(blockId: string) {
    const newUrl = urls[blockId]
    if (!newUrl) return
    const img = images.find(i => i.id === blockId)
    if (!img) return

    setSaving(s => ({ ...s, [blockId]: true }))
    setErrors(e => ({ ...e, [blockId]: '' }))

    let ok = false

    if (img.imageType === 'external') {
      // External image: simple PATCH
      const res = await fetch('/api/notion-block', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId, type: 'image', imageUrl: newUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaving(s => ({ ...s, [blockId]: false }))
        setErrors(e => ({ ...e, [blockId]: data.error ?? 'Erro ao guardar' }))
        return
      }
      ok = true
    } else {
      // File-type image: Notion doesn't allow PATCH — delete + recreate
      const parentId = img.parentId ?? pageId
      const delRes = await fetch('/api/notion-block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId }),
      })
      if (!delRes.ok) {
        const d = await delRes.json()
        setSaving(s => ({ ...s, [blockId]: false }))
        setErrors(e => ({ ...e, [blockId]: d.error ?? 'Erro ao apagar bloco antigo' }))
        return
      }
      const postRes = await fetch('/api/notion-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          type: 'image',
          imageUrl: newUrl,
          after: img.prevSiblingId ?? undefined,
        }),
      })
      if (!postRes.ok) {
        const d = await postRes.json()
        setSaving(s => ({ ...s, [blockId]: false }))
        setErrors(e => ({ ...e, [blockId]: d.error ?? 'Erro ao criar novo bloco' }))
        return
      }
      ok = true
    }

    setSaving(s => ({ ...s, [blockId]: false }))
    if (ok) {
      onBlocksUpdated(patchBlockUrl(blocks, blockId, newUrl))
      setSaved(s => ({ ...s, [blockId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [blockId]: false })), 2500)
    }
  }

  if (images.length === 0) return (
    <div className="text-center py-12 text-white/30 text-sm">Esta página não tem fotografias.</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gold/20">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-gold/70 tracking-widest uppercase mr-auto">Editar Fotografias</span>
        <button onClick={onDone} className="px-4 py-1.5 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30">
          ✓ Concluído
        </button>
      </div>

      {images.map((img, i) => {
        const pct = progress[img.id]
        const isSaving = saving[img.id]
        const isDone = saved[img.id]
        const currentUrl = urls[img.id]

        return (
          <div key={img.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <p className="text-[10px] text-white/30 tracking-widest uppercase px-4 pt-3 mb-2">Fotografia {i + 1}</p>

            {/* Preview */}
            <div className="relative mx-4 mb-3 rounded-lg overflow-hidden bg-black/20 aspect-video bg-cover bg-center"
              style={{ backgroundImage: `url(${currentUrl})` }}>
              {!currentUrl && <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">sem imagem</div>}
            </div>

            <div className="px-4 pb-4 space-y-2">
              {/* Upload */}
              <label className={`relative flex items-center justify-center w-full py-2.5 rounded-lg border border-dashed cursor-pointer transition-all overflow-hidden
                ${pct !== null && pct !== undefined ? 'border-gold/40 bg-gold/5 text-gold/70' : 'border-white/15 hover:border-gold/40 hover:bg-gold/5 text-white/35 hover:text-gold/70'}`}>
                <input type="file" accept="image/*" className="hidden"
                  disabled={pct !== null && pct !== undefined}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(img.id, f); e.target.value = '' }} />
                {pct !== null && pct !== undefined ? (
                  <>
                    <div className="absolute inset-0 bg-gold/10 transition-all duration-200" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span className="text-[11px] font-medium">{pct}%</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-[11px] tracking-wide">Carregar fotografia</span>
                  </div>
                )}
              </label>

              {/* URL input */}
              <input
                value={currentUrl}
                onChange={e => setUrls(u => ({ ...u, [img.id]: e.target.value }))}
                placeholder="ou cola um URL..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
              />

              {/* Save button */}
              <button
                onClick={() => handleSave(img.id)}
                disabled={isSaving || (pct !== null && pct !== undefined)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all border
                  ${isDone
                    ? 'border-green-500/40 bg-green-500/10 text-green-400'
                    : 'border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-40'}`}
              >
                {isDone ? '✓ Guardado!' : isSaving ? 'A guardar...' : 'Guardar foto'}
              </button>
              {errors[img.id] && (
                <p className="text-[11px] text-red-400/80 text-center">{errors[img.id]}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PortalSubPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [settings, setSettings] = useState<{ hiddenNav: string[] }>({ hiddenNav: [] })
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [title, setTitle] = useState(searchParams.get('title') ?? '')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingPhotos, setEditingPhotos] = useState(false)
  const [error, setError] = useState('')

  const loadBlocks = useCallback(async (bust = false) => {
    if (!id) return
    const url = `/api/portais-clientes?id=${id}${bust ? '&bust=1' : ''}`
    const d = await fetch(url).then(r => r.json())
    if (d.error) setError(d.error)
    else {
      setBlocks(d.blocks ?? [])
      setSettings(d.settings ?? { hiddenNav: [] })
      setSettingsBlockId(d.settingsBlockId ?? null)
    }
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

  function handlePhotosDone() {
    setEditingPhotos(false)
    // Bust cache in background — don't reload into state (would overwrite local updates)
    fetch(`/api/portais-clientes?id=${id}&bust=1`)
  }

  const hasImages = findImageBlocks(blocks).length > 0

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[860px] mx-auto">
      <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
        <Link href="/portal-cliente" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors">
          ‹ PORTAL DOS NOIVOS
        </Link>
        <div className="flex items-center gap-2">
          {!editing && !editingPhotos && (
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
          {!editing && !editingPhotos && !loading && !error && hasImages && (
            <button
              onClick={() => setEditingPhotos(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Fotos
            </button>
          )}
          {!editing && !editingPhotos && !loading && !error && (
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
          {editingPhotos
            ? <ImageEditor blocks={blocks} pageId={id!} onBlocksUpdated={setBlocks} onDone={handlePhotosDone} />
            : editing && id
              ? <BlockEditor blocks={blocks} pageId={id} settings={settings} settingsBlockId={settingsBlockId} onSaved={handleSaved} />
              : <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} />
          }
        </div>
      )}
    </main>
  )
}
