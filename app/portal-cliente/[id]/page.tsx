'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { NotionBlocks, plainText, type Block } from '../NotionRenderer'
import BlockEditor from '../BlockEditor'

const PORTAL_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

// ─── helpers ─────────────────────────────────────────────────────────────────

function findImageBlocks(
  blocks: Block[],
  parentId: string | null = null
): Array<{ id: string; url: string; parentId: string | null; prevSiblingId: string | null }> {
  const out: Array<{ id: string; url: string; parentId: string | null; prevSiblingId: string | null }> = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const prevSiblingId = i > 0 ? blocks[i - 1].id : null
    if (b.type === 'image') {
      const src = b.image?.type === 'external' ? b.image?.external?.url : b.image?.file?.url
      if (src) out.push({ id: b.id, url: src, parentId, prevSiblingId })
    }
    if (b.children) out.push(...findImageBlocks(b.children, b.id))
  }
  return out
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

function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const fd = new FormData()
    fd.append('file', file)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (data.url) resolve(data.url)
        else reject(new Error(data.error ?? 'Upload falhou'))
      } catch { reject(new Error('Resposta inválida')) }
    }
    xhr.onerror = () => reject(new Error('Erro de rede'))
    xhr.open('POST', '/api/upload-image')
    xhr.send(fd)
  })
}

// ─── image editor ─────────────────────────────────────────────────────────────

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
  const [status, setStatus] = useState<Record<string, { state: 'idle' | 'saving' | 'ok' | 'err'; msg: string }>>({})

  function setErr(id: string, msg: string) {
    setStatus(s => ({ ...s, [id]: { state: 'err', msg } }))
  }
  function setOk(id: string) {
    setStatus(s => ({ ...s, [id]: { state: 'ok', msg: '✓ Guardado!' } }))
    setTimeout(() => setStatus(s => ({ ...s, [id]: { state: 'idle', msg: '' } })), 3000)
  }

  async function handleSave(blockId: string, urlOverride?: string) {
    const newUrl = (urlOverride ?? urls[blockId])?.trim()
    if (!newUrl) { setErr(blockId, 'Sem URL — carrega uma foto ou cola um URL.'); return }

    const img = images.find(x => x.id === blockId)
    if (!img) return

    setStatus(s => ({ ...s, [blockId]: { state: 'saving', msg: 'A apagar bloco antigo...' } }))

    // Step 1: delete old block
    const delRes = await fetch('/api/notion-block', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: blockId }),
    })
    if (!delRes.ok) {
      const d = await delRes.json().catch(() => ({}))
      setErr(blockId, `Erro ao apagar: ${d.error ?? delRes.status}`)
      return
    }

    setStatus(s => ({ ...s, [blockId]: { state: 'saving', msg: 'A criar nova imagem...' } }))

    // Step 2: create new image block
    const postRes = await fetch('/api/notion-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: img.parentId ?? pageId,
        type: 'image',
        imageUrl: newUrl,
        after: img.prevSiblingId ?? undefined,
      }),
    })
    if (!postRes.ok) {
      const d = await postRes.json().catch(() => ({}))
      setErr(blockId, `Erro ao criar: ${d.error ?? postRes.status}`)
      return
    }

    // Update local state immediately
    onBlocksUpdated(patchBlockUrl(blocks, blockId, newUrl))
    setOk(blockId)
  }

  async function handleUpload(blockId: string, file: File) {
    setStatus(s => ({ ...s, [blockId]: { state: 'idle', msg: '' } }))
    setProgress(p => ({ ...p, [blockId]: 0 }))
    try {
      const url = await uploadWithProgress(file, pct => setProgress(p => ({ ...p, [blockId]: pct })))
      setUrls(u => ({ ...u, [blockId]: url }))
      setProgress(p => ({ ...p, [blockId]: null }))
      // Auto-save immediately after upload so photo persists when leaving editor
      await handleSave(blockId, url)
    } catch (err: any) {
      setErr(blockId, `Upload falhou: ${err.message}. Tenta colar um URL directamente.`)
      setProgress(p => ({ ...p, [blockId]: null }))
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
        const st = status[img.id] ?? { state: 'idle', msg: '' }
        const currentUrl = urls[img.id]
        const uploading = pct !== null && pct !== undefined
        const saving = st.state === 'saving'

        return (
          <div key={img.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <p className="text-[10px] text-white/30 tracking-widest uppercase px-4 pt-3 mb-2">
              Fotografia {i + 1}
            </p>

            {/* Preview */}
            {currentUrl ? (
              <div className="mx-4 mb-3 rounded-lg aspect-video bg-cover bg-center border border-white/5"
                style={{ backgroundImage: `url(${currentUrl})` }} />
            ) : (
              <div className="mx-4 mb-3 rounded-lg aspect-video bg-white/[0.03] flex items-center justify-center">
                <span className="text-white/20 text-xs">sem imagem</span>
              </div>
            )}

            <div className="px-4 pb-4 space-y-2">
              {/* Upload */}
              <label className={`relative flex items-center justify-center w-full py-3 rounded-lg border border-dashed cursor-pointer transition-all overflow-hidden
                ${uploading || saving ? 'border-gold/40 bg-gold/5 text-gold/70 cursor-not-allowed' : 'border-white/15 hover:border-gold/40 hover:bg-gold/5 text-white/35 hover:text-gold/70'}`}>
                <input type="file" accept="image/*" className="hidden" disabled={uploading || saving}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(img.id, f); e.target.value = '' }} />
                {uploading ? (
                  <>
                    <div className="absolute inset-0 bg-gold/10 transition-all duration-150" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      <span className="text-sm font-medium">{pct}%</span>
                    </div>
                  </>
                ) : saving ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="text-sm font-medium">{st.msg}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm">Carregar fotografia do dispositivo</span>
                  </div>
                )}
              </label>

              {/* URL */}
              <input
                value={currentUrl ?? ''}
                onChange={e => setUrls(u => ({ ...u, [img.id]: e.target.value }))}
                placeholder="ou cola um URL público aqui..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
              />

              {/* Save */}
              <button
                onClick={() => handleSave(img.id)}
                disabled={saving || uploading}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all border
                  ${st.state === 'ok'
                    ? 'border-green-500/40 bg-green-500/10 text-green-400'
                    : st.state === 'err'
                    ? 'border-red-500/30 bg-red-500/5 text-gold border-gold/30 hover:bg-gold/20'
                    : 'border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-40'}`}
              >
                {st.state === 'saving' ? st.msg
                  : st.state === 'ok' ? st.msg
                  : 'Guardar foto'}
              </button>

              {/* Error */}
              {st.state === 'err' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <p className="text-xs text-red-400">{st.msg}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── payment phases ───────────────────────────────────────────────────────────

type Pagamento = {
  id: string
  fase_pagamento: string[]
  metodo_pagamento: string[]
  valor_liquidado: number | null
  data_pagamento: string | null
}

function PaymentPhasesSection({ referencia, valorTotal, pagamentos, onRefresh, refreshing }: {
  referencia: string
  valorTotal: number
  pagamentos: Pagamento[]
  onRefresh: () => void
  refreshing: boolean
}) {
  const adj = 400
  const remainder = Math.max(0, (valorTotal || 0) - adj)
  const faseValores: Record<string, number> = {
    'ADJUDICAÇÃO': valorTotal > 0 ? adj : 0,
    'REFORÇO':     valorTotal > 0 ? Math.round(remainder * 0.8 * 100) / 100 : 0,
    'FINAL':       valorTotal > 0 ? Math.round(remainder * 0.2 * 100) / 100 : 0,
  }
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const fmtD = (d: string | null) => {
    if (!d) return null
    const dt = new Date(d.split('T')[0] + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
  }

  const totalPagoGeral = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
  const faltaGeral = Math.max(0, (valorTotal || 0) - totalPagoGeral)

  return (
    <div className="mb-6 pb-6 border-b border-white/[0.06]">
      {/* Valor total */}
      {valorTotal > 0 && (
        <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Valor Total do Serviço</span>
          <div className="flex items-center gap-4">
            {totalPagoGeral > 0 && faltaGeral > 0 && (
              <span className="text-[10px] text-white/30">
                Falta: <span className="text-white/50 font-medium">{faltaGeral.toLocaleString('pt-PT')} €</span>
              </span>
            )}
            <span className="text-base font-semibold text-gold">{valorTotal.toLocaleString('pt-PT')} €</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Fases de Pagamento</span>
          <button onClick={onRefresh} title="Atualizar" className="text-white/20 hover:text-gold transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['ADJUDICAÇÃO','REFORÇO','FINAL'].map(label => {
          const pags = pagamentos.filter(p => p.fase_pagamento.includes(label))
          const totalPago = pags.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
          const valorFase = faseValores[label]
          const falta = Math.max(0, valorFase - totalPago)
          const liquidado = totalPago >= valorFase && valorFase > 0
          const parcial = totalPago > 0 && !liquidado
          const pct = valorFase > 0 ? Math.min(100, Math.round((totalPago / valorFase) * 100)) : 0
          const lastPag = pags[pags.length - 1]
          const metodos = Array.from(new Set(pags.flatMap(p => p.metodo_pagamento)))

          const borderCls = liquidado ? 'bg-green-500/8 border-green-500/25'
            : parcial ? 'bg-orange-500/5 border-orange-500/20'
            : 'bg-white/[0.02] border-white/[0.06]'
          const valorCls = liquidado ? 'text-green-400' : parcial ? 'text-orange-400' : 'text-white/50'
          const statusLabel = liquidado ? 'LIQUIDADO' : parcial ? 'PARCIAL' : 'PENDENTE'
          const statusCls = liquidado ? 'text-green-400/80 bg-green-500/10'
            : parcial ? 'text-orange-400/80 bg-orange-500/10'
            : 'text-white/20 bg-white/5'
          const dotCls = liquidado ? 'bg-green-400' : parcial ? 'bg-orange-400' : 'bg-white/20'

          return (
            <div key={label} className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${borderCls}`}>
              <span className="text-[9px] tracking-[0.35em] text-white/30 uppercase">{label}</span>
              <span className={`text-lg font-semibold ${valorCls}`}>{valorFase.toLocaleString('pt-PT')} €</span>
              <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${liquidado ? 'bg-green-400' : parcial ? 'bg-orange-400' : 'bg-white/10'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${statusCls}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                <span className="text-[9px] tracking-widest">{statusLabel}</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-1 border-t border-white/[0.05]">
                {totalPago > 0 && (
                  <span className="text-[10px] text-white/40">
                    Pago: <span className={`font-medium ${liquidado ? 'text-green-400' : 'text-orange-400'}`}>{totalPago.toLocaleString('pt-PT')} €</span>
                  </span>
                )}
                {!liquidado && falta > 0 && (
                  <span className="text-[10px] text-white/30">
                    Falta: <span className="text-white/50 font-medium">{falta.toLocaleString('pt-PT')} €</span>
                  </span>
                )}
                {lastPag?.data_pagamento && <span className="text-[10px] text-white/25">{fmtD(lastPag.data_pagamento)}</span>}
                {metodos.length > 0 && <span className="text-[10px] text-white/20">{metodos.join(', ')}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

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
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [portalRef, setPortalRef] = useState('')
  const [portalTotal, setPortalTotal] = useState(0)
  const [portalFoto, setPortalFoto] = useState<number | null>(null)
  const [portalVideo, setPortalVideo] = useState<number | null>(null)
  const [portalExtras, setPortalExtras] = useState<number | null>(null)
  const [pagRefreshing, setPagRefreshing] = useState(false)

  const isPaymentsPage = title.toUpperCase().includes('PAGAMENTO')

  const loadPagamentos = useCallback(async () => {
    setPagRefreshing(true)
    try {
      const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
      const ps = d.settings ?? {}
      let ref: string = ps.referencia ?? ''
      const total: number = ps.valorTotal ?? 0
      setPortalFoto(ps.valorFoto ?? null)
      setPortalVideo(ps.valorVideo ?? null)
      setPortalExtras(ps.valorExtras ?? null)

      // Auto-extract reference from portal page blocks if not in settings
      if (!ref) {
        for (const b of (d.blocks ?? []) as Block[]) {
          if (b.type === 'paragraph') {
            const text = plainText(b.paragraph?.rich_text ?? [])
            if (/^(referên|referência|referencia|ref\.?\s*:|ref\s+)/i.test(text.trim())) {
              ref = text.replace(/^.*?:\s*/i, '').trim()
              break
            }
          }
        }
      }

      if (ref) {
        setPortalRef(ref)
        setPortalTotal(total)
        const pd = await fetch(`/api/pagamentos-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json())
        setPagamentos(pd.payments ?? [])
      }
    } finally {
      setPagRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isPaymentsPage) loadPagamentos()
  }, [isPaymentsPage, loadPagamentos])

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

  async function handlePhotosDone() {
    setEditingPhotos(false)
    // Reload fresh blocks from Notion after a short delay (eventual consistency)
    setTimeout(() => loadBlocks(true), 1500)
  }

  const hasImages = findImageBlocks(blocks).length > 0

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[860px] mx-auto">
      <div className="flex items-center justify-end mb-8 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {!editing && !editingPhotos && (
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all">
              <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? 'A atualizar...' : 'Atualizar'}
            </button>
          )}
          {!editing && !editingPhotos && !loading && !error && hasImages && (
            <button onClick={() => setEditingPhotos(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Fotos
            </button>
          )}
          {!editing && !editingPhotos && !loading && !error && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 transition-all">
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
        <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-gold uppercase">
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
              : (
                <>
                  <div className="mb-6">
                    <Link href="/portal-cliente"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all text-sm tracking-wide">
                      ‹ Voltar
                    </Link>
                  </div>
                  {(() => {
                    if (!isPaymentsPage) return <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} />
                    const numerarioIdx = blocks.findIndex(b =>
                      plainText((b[b.type]?.rich_text ?? [])).toLowerCase().includes('numerário contatar')
                    )
                    const beforeNumerario = numerarioIdx !== -1 ? blocks.slice(0, numerarioIdx + 1) : blocks
                    const afterNumerario  = numerarioIdx !== -1 ? blocks.slice(numerarioIdx + 1) : []
                    return (
                      <>
                        <NotionBlocks blocks={beforeNumerario} hiddenNav={settings.hiddenNav} />
                        {numerarioIdx !== -1 && (
                          <div className="my-5">
                            <a href="https://tally.so" target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-black font-semibold text-sm tracking-wide hover:bg-gold/80 transition-all">
                              Registar Pagamento
                            </a>
                          </div>
                        )}
                        <NotionBlocks blocks={afterNumerario} hiddenNav={settings.hiddenNav} />
                        <div className="mb-6 pb-6 border-b border-white/[0.06]">
                          <span className="text-[10px] tracking-[0.3em] text-gold uppercase block mb-3">Financeiro</span>
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            {([['VALOR FOTOGRAFIA', portalFoto], ['VALOR VÍDEO', portalVideo], ['VALOR EXTRAS', portalExtras]] as [string, number | null][]).map(([lbl, val]) => (
                              <div key={lbl} className="flex flex-col gap-1 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{lbl}</span>
                                <span className="text-base font-semibold text-white/70">{val !== null ? `${val.toLocaleString('pt-PT')} €` : '—'}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between px-4 py-3 bg-gold/5 border border-gold/20 rounded-xl">
                            <div>
                              <span className="text-xs tracking-widest text-gold/60 uppercase block">Total do Serviço</span>
                              <span className="text-[10px] text-white/20">(Fotografia + Vídeo)</span>
                            </div>
                            <span className="text-gold font-bold text-lg">
                              {((portalFoto ?? 0) + (portalVideo ?? 0)).toLocaleString('pt-PT')} €
                            </span>
                          </div>
                        </div>
                        <PaymentPhasesSection
                          referencia={portalRef}
                          valorTotal={portalTotal}
                          pagamentos={pagamentos}
                          onRefresh={loadPagamentos}
                          refreshing={pagRefreshing}
                        />
                      </>
                    )
                  })()}
                </>
              )
          }
        </div>
      )}
    </main>
  )
}
