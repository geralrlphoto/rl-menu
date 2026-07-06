'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { NotionBlocks, plainText, richText, type Block } from '../NotionRenderer'
import BlockEditor from '../BlockEditor'
import BriefingExtensions, { type BriefingExt } from './BriefingExtensions'
import '../atmosphere/atmosphere.css'
import { PortalShell, SidebarCouple, SidebarNav, SidebarMiniCountdown, type SidebarNavItem } from '../atmosphere/PortalShell'
import { ContratoView } from '../atmosphere/ContratoView'
import { PreWeddingView, DEFAULT_CENARIOS, DEFAULT_INTRO, type PwSection, type PwIntro, type PwCenario } from '../atmosphere/PreWeddingView'
import { SendMessageButton } from '../atmosphere/SendMessageButton'
import { AtendimentoThread } from '../atmosphere/AtendimentoThread'
import { NoivosNotificationsBell } from '../atmosphere/NoivosNotificationsBell'
import { FotografiasView, type FotografiasCard } from '../atmosphere/FotografiasView'

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

// ─── maquete album section ────────────────────────────────────────────────────

const MESES_AL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtAl(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d.split('T')[0] + 'T00:00:00')
  if (isNaN(dt.getTime())) return '—'
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES_AL[dt.getMonth()]} ${dt.getFullYear()}`
}

const STATUS_LABEL_AL: Record<string, string> = {
  'NOVO ÁLBUM':    'Aguardar',
  'EM EDIÇÃO':     'Em Edição',
  'PARA APROVAÇÃO':'Em Aprovação',
  'APROVADO':      'Aprovado',
  'ENTREGUE':      'Entregue',
}

function MaqueteAlbumSection({ portalRef, imgUrl }: { portalRef: string; imgUrl: string | null }) {
  const [open, setOpen]       = useState(false)
  const [album, setAlbum]     = useState<any>(null)
  const [saving, setSaving]   = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!portalRef) return
    fetch(`/api/albuns-by-ref?ref=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => setAlbum(d))
      .catch(() => {})
  }, [portalRef])

  async function handleAprovar() {
    if (!album?.id) return
    setSaving(true)
    setFeedback('')
    const res = await fetch('/api/albuns-casamento', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: album.id, status: 'APROVADO' }),
    }).then(r => r.json())
    if (res.row) {
      setAlbum((a: any) => ({ ...a, status: 'APROVADO', data_aprovacao: res.row.data_aprovacao, data_prevista_entrega: res.row.data_prevista_entrega }))
      setFeedback('✓ Álbum aprovado com sucesso!')
      setTimeout(() => setFeedback(''), 5000)
    }
    setSaving(false)
  }

  const labelStatus = album ? (STATUS_LABEL_AL[album.status] ?? album.status ?? 'Aguardar') : 'Aguardar'
  const isAprovado  = album?.status === 'APROVADO' || album?.status === 'ENTREGUE'

  return (
    <div className="mt-3 rounded-2xl border border-white/40 bg-black overflow-hidden"
      style={{ boxShadow: '0 0 18px 4px rgba(255,255,255,0.18), 0 0 6px 1px rgba(255,255,255,0.25), inset 0 0 20px 0 rgba(255,255,255,0.06)' }}>

      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-[10px] tracking-[0.35em] text-white/50 uppercase font-bold">Maquete Álbum</span>
        <div className="flex items-center gap-2">
          {album && (
            <span className={`text-[9px] px-2 py-0.5 rounded border tracking-widest ${isAprovado ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300/70'}`}>
              {labelStatus}
            </span>
          )}
          <button onClick={() => setOpen(o => !o)}
            className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-xl border border-white/40 bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
            style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.15)' }}>
            {open ? 'FECHAR' : 'VER MAIS →'}
          </button>
        </div>
      </div>

      {/* Inline panel */}
      {open && (
        <div className="p-4 flex flex-col gap-4">
          {/* Image */}
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="Maquete Álbum" className="w-full rounded-xl object-contain border border-white/10" />
          )}

          {/* Album info */}
          {album?.id ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Fotos p/Álbum</span>
                <span className="text-lg font-semibold text-white">{album.num_fotografias ?? '—'}</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Estado</span>
                <span className={`text-sm font-medium ${isAprovado ? 'text-green-300' : 'text-yellow-300/70'}`}>{labelStatus}</span>
              </div>
              {album.data_entrega_fotos && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Entrada de Fotos</span>
                  <span className="text-sm text-white/70">{fmtAl(album.data_entrega_fotos)}</span>
                </div>
              )}
              {album.data_aprovacao && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Data Aprovação</span>
                  <span className="text-sm text-white/70">{fmtAl(album.data_aprovacao)}</span>
                </div>
              )}
              {album.data_prevista_entrega && (
                <div className="col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Data Prevista Entrega</span>
                  <span className="text-sm text-white/70">{fmtAl(album.data_prevista_entrega)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/30 italic text-center py-2">A preparar o seu álbum...</p>
          )}

          {/* Feedback */}
          {feedback && (
            <p className="text-sm text-green-400 text-center tracking-wide">{feedback}</p>
          )}

          {/* Action buttons */}
          {album?.id && !isAprovado && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={handleAprovar} disabled={saving}
                className="py-3 rounded-xl border border-green-500/40 bg-green-500/10 text-green-300 font-bold text-xs tracking-widest uppercase hover:bg-green-500/20 transition-all disabled:opacity-50"
                style={{ boxShadow: '0 0 12px 2px rgba(74,222,128,0.12)' }}>
                {saving ? '...' : '✓ APROVADO'}
              </button>
              <a href={`/portal-cliente/album-alteracao?ref=${encodeURIComponent(portalRef)}`}
                className="py-3 rounded-xl border border-white/30 bg-white/5 text-white/70 font-bold text-xs tracking-widest uppercase hover:bg-white/10 transition-all text-center"
                style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.08)' }}>
                ✎ FAZER ALTERAÇÃO
              </a>
            </div>
          )}
          {isAprovado && (
            <div className="py-3 rounded-xl border border-green-500/30 bg-green-500/8 text-center">
              <span className="text-green-300 text-xs tracking-widest font-bold uppercase">✓ Álbum Aprovado</span>
            </div>
          )}
        </div>
      )}
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
  // Se soma total paga >= valor total do serviço → todas as fases liquidadas
  const tudoLiquidado = (valorTotal || 0) > 0 && totalPagoGeral >= (valorTotal || 0)

  // Cascata: ADJ → REFORÇO → FINAL — o totalPagoGeral preenche por ordem
  const cumAdj     = faseValores['ADJUDICAÇÃO']
  const cumReforco = cumAdj + faseValores['REFORÇO']
  const cumFinal   = cumReforco + faseValores['FINAL']
  const faseCum: Record<string, number> = {
    'ADJUDICAÇÃO': cumAdj,
    'REFORÇO':     cumReforco,
    'FINAL':       cumFinal,
  }

  return (
    <div className="mb-6 pb-6 border-b border-white/[0.06]">
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
          const valorFase  = faseValores[label]
          const cumThresh  = faseCum[label]
          const prevThresh = cumThresh - valorFase
          const totalPago = Math.max(0, Math.min(totalPagoGeral, cumThresh) - prevThresh)
          const falta = Math.max(0, valorFase - totalPago)
          const liquidado = tudoLiquidado || (valorFase > 0 && totalPagoGeral >= cumThresh)
          const parcial = totalPago > 0 && !liquidado
          const pct = valorFase > 0 ? Math.min(100, Math.round((totalPago / valorFase) * 100)) : 0
          const pagsByTag = pagamentos.filter(p => p.fase_pagamento.includes(label))
          const pags = pagsByTag.length > 0 ? pagsByTag : (totalPago > 0 ? pagamentos : [])
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

// ─── contrato proposta section ────────────────────────────────────────────────

function ContratoPropostaSection({ evento, blocks, settings, contratoDisponivel, contratoUrl, portalRef, pagamentos, loadPagamentos, pagRefreshing }: {
  evento: any
  blocks: Block[]
  settings: { hiddenNav: string[] }
  contratoDisponivel: boolean | null
  contratoUrl: string | null
  portalRef: string
  pagamentos: any[]
  loadPagamentos: () => void
  pagRefreshing: boolean
}) {
  const fotoItems: string[] = evento.servico_foto ?? []
  const videoItems: string[] = evento.servico_video ?? []
  const hasFoto  = fotoItems.length > 0
  const hasVideo = videoItems.length > 0
  const contratoHref = (contratoUrl ?? '/eventos-2026/' + evento.id + '/contrato') + '?readonly=1'

  return (
    <>
      {/* Contrato status banner */}
      {!contratoDisponivel && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border bg-white/[0.02] border-white/[0.08]">
          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-white/20" />
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wider text-white/30">CONTRATO INDISPONÍVEL</p>
            <p className="text-[10px] text-white/25 mt-0.5">O contrato ainda não foi disponibilizado. Será notificado quando estiver pronto.</p>
          </div>
        </div>
      )}
      {contratoDisponivel && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-xs font-semibold tracking-wider text-green-400">CONTRATO DISPONÍVEL</p>
            </div>
            <a href={contratoHref} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/50 text-[10px] hover:text-white/80 transition-all">
              Abrir em nova aba ↗
            </a>
          </div>
          <iframe
            src={contratoHref}
            className="w-full rounded-xl border border-white/10"
            style={{ height: '80vh', minHeight: '600px' }}
            title="Contrato de Prestação de Serviços"
          />
        </div>
      )}
      <NotionBlocks blocks={blocks.filter(b => b.type !== 'image')} hiddenNav={settings.hiddenNav} />
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 bg-gold rounded-full" />
          <span className="text-[11px] tracking-[0.4em] text-gold uppercase font-semibold">A Vossa Escolha</span>
          {evento.proposta && (
            <span className="ml-auto text-[9px] tracking-widest text-white/30 uppercase bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full">
              {evento.proposta}
            </span>
          )}
        </div>

        <div className={`grid gap-4 ${hasFoto && hasVideo ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {hasFoto && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <svg className="w-4 h-4 text-gold/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-[10px] tracking-[0.3em] text-white/50 uppercase font-semibold">Serviço de Fotografia</span>
              </div>
              <ul className="p-4 space-y-2">
                {fotoItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/50 flex-shrink-0" />
                    <span className="text-sm text-white/70 tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasVideo && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <svg className="w-4 h-4 text-gold/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[10px] tracking-[0.3em] text-white/50 uppercase font-semibold">Serviço de Vídeo</span>
              </div>
              <ul className="p-4 space-y-2">
                {videoItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/50 flex-shrink-0" />
                    <span className="text-sm text-white/70 tracking-wide">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {((evento.valor_foto as number ?? 0) + (evento.valor_video as number ?? 0)) > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gold/5 border border-gold/20">
              <span className="text-[10px] tracking-widest text-gold/60 uppercase">Total do Serviço</span>
              <span className="text-gold font-bold text-lg">
                {((evento.valor_foto as number ?? 0) + (evento.valor_video as number ?? 0)).toLocaleString('pt-PT')} €
              </span>
            </div>
            <PaymentPhasesSection
              referencia={portalRef}
              valorTotal={(evento.valor_foto as number ?? 0) + (evento.valor_video as number ?? 0)}
              pagamentos={pagamentos}
              onRefresh={loadPagamentos}
              refreshing={pagRefreshing}
            />
          </div>
        )}
      </div>
    </>
  )
}

// ─── pre-wedding calendar ─────────────────────────────────────────────────────

type PreWeddingSlot = { id: string; date: string; time: string; local: string }

function PreWeddingSection({ slots, reservedSlotId, reservingSlotId, showReservedWarning, blocks, settings, onReserve, onNotificarNoivos, sendingNotifNoivos, notifNoivosEnviado }: {
  slots: PreWeddingSlot[]
  reservedSlotId: string | null
  reservingSlotId: string | null
  showReservedWarning: boolean
  blocks: Block[]
  settings: { hiddenNav: string[] }
  onReserve: (slotId: string) => void
  onNotificarNoivos?: () => void
  sendingNotifNoivos?: boolean
  notifNoivosEnviado?: boolean
}) {
  const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const DIAS_ABBR  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const hasSlotDate = (dateStr: string) => slots.some(s => s.date === dateStr)

  function calDays(): Array<{ dateStr: string | null; day: number | null }> {
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: Array<{ dateStr: string | null; day: number | null }> = []
    for (let i = 0; i < firstDow; i++) cells.push({ dateStr: null, day: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ dateStr: ds, day: d })
    }
    return cells
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  // All upcoming slots sorted
  const upcomingSlots = [...slots]
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.time.localeCompare(b.time))

  const fmtSlotDate = (ds: string) => {
    const [y, m, d] = ds.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return {
      day: String(d).padStart(2, '0'),
      month: MESES_FULL[m - 1].slice(0, 3).toUpperCase(),
      weekday: DIAS_ABBR[dt.getDay()],
      full: `${String(d).padStart(2,'0')} ${MESES_FULL[m-1]} ${y}`,
    }
  }

  const cells = calDays()

  return (
    <>
      {/* NotionBlocks removido — conteúdo da página vem de portais.settings */}
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 bg-gold rounded-full" />
          <span className="text-[11px] tracking-[0.4em] text-gold uppercase font-semibold">Marcar Pré-Wedding</span>
        </div>

        {upcomingSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
            <svg className="w-8 h-8 text-white/15 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-xs text-white/25 tracking-wide">Ainda não há datas disponíveis.</p>
            <p className="text-[10px] text-white/15 mt-1">Em breve serão disponibilizadas datas para o pré-wedding.</p>
          </div>
        ) : (
          <>
            {/* Calendar overview */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden mb-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all text-lg">‹</button>
                <span className="text-xs tracking-[0.2em] text-white/60 uppercase font-medium">{MESES_FULL[month]} {year}</span>
                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all text-lg">›</button>
              </div>
              <div className="grid grid-cols-7 border-b border-white/[0.04]">
                {DIAS_ABBR.map(d => (
                  <div key={d} className="py-2 text-center text-[9px] tracking-widest text-white/20 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 p-2 gap-1">
                {cells.map((cell, idx) => {
                  if (!cell.dateStr) return <div key={idx} />
                  const active = hasSlotDate(cell.dateStr)
                  const isPast = cell.dateStr < todayStr
                  return (
                    <div key={cell.dateStr}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium
                        ${active ? 'bg-gold/15 border border-gold/30 text-gold font-bold'
                          : isPast ? 'text-white/10' : 'text-white/25'}`}
                    >
                      {cell.day}
                      {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Slots list with Reservar buttons */}
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase mb-4">Datas Disponíveis</p>
              {showReservedWarning && (
                <div className="flex items-start gap-3 px-4 py-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Já tens uma data reservada. Para alterar, por favor contacta-nos directamente.
                  </p>
                </div>
              )}
              {upcomingSlots.map(slot => {
                const d = fmtSlotDate(slot.date)
                return (
                  <div key={slot.id} className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] hover:border-gold/20 transition-all">
                    {/* Date badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gold/10 border border-gold/20">
                      <span className="text-base font-bold text-gold leading-none">{d.day}</span>
                      <span className="text-[9px] tracking-wider text-gold/60 uppercase">{d.month}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">{d.weekday}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-sm font-semibold text-white/80">{slot.time}</span>
                        {slot.local && (
                          <span className="text-xs text-white/40 truncate">📍 {slot.local}</span>
                        )}
                      </div>
                    </div>
                    {/* Reservar button */}
                    {(() => {
                      const isThisReserved   = reservedSlotId === slot.id
                      const isOtherReserved  = !!reservedSlotId && reservedSlotId !== slot.id
                      const isReserving      = reservingSlotId === slot.id
                      if (isThisReserved) return (
                        <button
                          onClick={() => onReserve(slot.id)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold tracking-wide cursor-default">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          Reservado
                        </button>
                      )
                      if (isOtherReserved) return (
                        <span className="flex-shrink-0 px-4 py-2 rounded-xl border border-white/[0.06] text-white/15 text-xs tracking-wide">
                          Reservar
                        </span>
                      )
                      return (
                        <button
                          onClick={() => onReserve(slot.id)}
                          disabled={isReserving}
                          className="flex-shrink-0 px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold tracking-wide hover:bg-gold/80 transition-all disabled:opacity-50">
                          {isReserving ? '...' : 'Reservar'}
                        </button>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {onNotificarNoivos && (
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col items-center gap-2">
            <button
              onClick={onNotificarNoivos}
              disabled={sendingNotifNoivos || notifNoivosEnviado}
              className="w-full py-3 rounded-xl border border-white/40 bg-white/5 text-white font-semibold text-xs tracking-widest uppercase hover:bg-white/10 transition-all disabled:opacity-50"
              style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.12)' }}>
              {notifNoivosEnviado ? '✓ CARD ENVIADO' : sendingNotifNoivos ? '...' : 'NOTIFICAR NOIVOS'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function PortalSubPageContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [settings, setSettings] = useState<{ hiddenNav: string[] }>({ hiddenNav: [] })
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [title, setTitle] = useState(searchParams.get('title') ?? '')
  const fromId = searchParams.get('from')
  const fromTitle = searchParams.get('fromTitle')
  const refParam = searchParams.get('portalRef')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Template sub-pages (no refParam) are always admin
    if (!refParam) { setIsAdmin(true); return }
    // ?admin=1 na URL → activa admin imediatamente E persiste em sessionStorage
    // para que continue activo nas navegações seguintes sem ter de incluir o
    // parâmetro em todas as URLs.
    if (searchParams.get('admin') === '1') {
      sessionStorage.setItem(`portalAdmin_${refParam}`, 'true')
      setIsAdmin(true)
      return
    }
    if (sessionStorage.getItem(`portalAdmin_${refParam}`) === 'true') setIsAdmin(true)
  }, [refParam, searchParams])

  const [editingPhotos, setEditingPhotos] = useState(false)
  const [error, setError] = useState('')
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [portalRef, setPortalRef] = useState('')

  // Also check admin when portalRef state loads (for portals without URL refParam)
  useEffect(() => {
    if (portalRef && !refParam) {
      const key = `portalAdmin_${portalRef}`
      // ?admin=1 também activa quando o portalRef carrega depois
      if (searchParams.get('admin') === '1') {
        sessionStorage.setItem(key, 'true')
        setIsAdmin(true)
        return
      }
      if (sessionStorage.getItem(key) === 'true') setIsAdmin(true)
    }
  }, [portalRef, refParam, searchParams])
  const [portalTotal, setPortalTotal] = useState(0)
  const [portalFoto, setPortalFoto] = useState<number | null>(null)
  const [portalVideo, setPortalVideo] = useState<number | null>(null)
  const [portalExtras, setPortalExtras] = useState<number | null>(null)
  const [pagRefreshing, setPagRefreshing] = useState(false)
  const DEFAULT_GUIA_LINKS = {
    blogUrl: 'https://www.rlprod.pt/blog-list1',
    fotosSelecaoUrl: 'https://tally.so/r/448PrO',
    fotosVerMaisUrl: '',
    fotosConvidadosUrl: 'https://tally.so/r/w56N86',
    dadosContratoUrl: '/contrato-cps/casamento',
    pagamentosRegistoUrl: 'https://tally.so/r/A72PQB',
  }
  const [guiaLinks, setGuiaLinks] = useState<{blogUrl?:string,fotosSelecaoUrl?:string,fotosVerMaisUrl?:string,fotosConvidadosUrl?:string,dadosContratoUrl?:string,pagamentosRegistoUrl?:string}>(DEFAULT_GUIA_LINKS)
  const [parceiros, setParceiros] = useState<Array<{imageUrl:string;url?:string}>>([])
  const [portalSettingsBlockId, setPortalSettingsBlockId] = useState<string|null>(null)
  const [editingParceiros, setEditingParceiros] = useState(false)
  const [parceirosForm, setParceirosForm] = useState<Array<{imageUrl:string;url?:string}>>([])
  const [savingParceiros, setSavingParceiros] = useState(false)
  const [subpageHeaderUrl, setSubpageHeaderUrl] = useState('')
  const [portalHeroImageUrl, setPortalHeroImageUrl] = useState('')
  const [designPremiumPages, setDesignPremiumPages] = useState<string[]>([])
  const [preWeddingSlots, setPreWeddingSlots] = useState<Array<{id:string;date:string;time:string;local:string}>>([])
  const [reservedSlotId, setReservedSlotId] = useState<string | null>(null)
  const [reservingSlotId, setReservingSlotId] = useState<string | null>(null)
  const [showReservedWarning, setShowReservedWarning] = useState(false)
  const [editingPreWedding, setEditingPreWedding] = useState(false)
  const [preWeddingForm, setPreWeddingForm] = useState<Array<{id:string;date:string;time:string;local:string}>>([])
  const [savingSlots, setSavingSlots] = useState(false)
  const [sendingNotifNoivos, setSendingNotifNoivos] = useState(false)
  const [notifNoivosEnviado, setNotifNoivosEnviado] = useState(false)

  const [eventoData, setEventoData] = useState<any>(null)
  const [contratoDisponivel, setContratoDisponivel] = useState<boolean | null>(null)
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)
  const [portalSettingsObj, setPortalSettingsObj] = useState<any>({})
  const [propostaData, setPropostaData] = useState<{ nome: string; servicos_foto: string[]; servicos_video: string[]; valor?: string | null } | null>(null)
  const [propostaToken, setPropostaToken] = useState('')
  const [savingPropostaToken, setSavingPropostaToken] = useState(false)
  const [editingPropostaToken, setEditingPropostaToken] = useState(false)
  const [propostaTokenForm, setPropostaTokenForm] = useState('')
  const [notionServicos, setNotionServicos] = useState<{ proposta: string | null; servico_foto: string[]; servico_video: string[] } | null>(null)
  const [pageTitles, setPageTitles] = useState<Record<string, string>>({})
  // Lista de sub-páginas do portal pai — para a sidebar Atmosphère
  const [parentNavPages, setParentNavPages] = useState<Array<{ id: string; title: string }>>([])
  useEffect(() => {
    let cancelled = false
    fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const out: Array<{ id: string; title: string }> = []
        const walk = (bs: any[]) => {
          for (const b of bs ?? []) {
            if (b.type === 'child_page') out.push({ id: b.id, title: b.child_page?.title ?? '' })
            if (b.children) walk(b.children)
          }
        }
        walk(d?.blocks ?? [])
        setParentNavPages(out)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)
  const [calloutLinks, setCalloutLinks] = useState<Record<string, Record<string, string>>>({})
  const [editingCalloutLinks, setEditingCalloutLinks] = useState(false)
  const [calloutLinksForm, setCalloutLinksForm] = useState<Record<string, string>>({})
  const [savingCalloutLinks, setSavingCalloutLinks] = useState(false)
  const [fotosVerMaisUrlForm, setFotosVerMaisUrlForm] = useState('')
  const [briefingLinks, setBriefingLinks] = useState<Record<string, string>>({})
  const [pageHeaders, setPageHeaders] = useState<Record<string, string>>({})
  const [uploadingPageHeader, setUploadingPageHeader] = useState(false)
  /** Map de fotos da página Pré-Wedding (slot → URL). Gerido 100% no app, sem Notion.
   *  Slots: 'hero', 'intro', 'tript-0', 'cen-0/1/2', 'custom-<id>' (secções custom). */
  const [pwPhotos, setPwPhotos] = useState<Record<string, string>>({})
  const [uploadingPwSlot, setUploadingPwSlot] = useState<string | null>(null)
  /** Secções personalizadas (texto + foto) adicionadas pelo admin na página. */
  const [pwSections, setPwSections] = useState<PwSection[]>([])
  /** Intro editável (substitui leitura do Notion após migração). */
  const [pwIntro, setPwIntro] = useState<PwIntro | null>(null)
  /** 3 cenários editáveis (substitui leitura do Notion após migração). */
  const [pwCenarios, setPwCenarios] = useState<PwCenario[] | null>(null)
  const [briefingInfo, setBriefingInfo] = useState<Record<string, BriefingExt>>({})

  // Fichas Individuais (NOIVO / NOIVA / etc.) — accordion editável com
  // caixas de texto label + value que o admin/cliente preenche.
  type FichaCampo = { id: string; label: string; value: string }
  const [briefingFichas, setBriefingFichas] = useState<Record<string, FichaCampo[]>>({})
  const [openFichaKey, setOpenFichaKey] = useState<string | null>(null)
  const [fichaSaving, setFichaSaving] = useState(false)
  const [editingBriefingInfo, setEditingBriefingInfo] = useState(false)
  const [briefingFieldsForm, setBriefingFieldsForm] = useState<Array<{ label: string; value: string }>>([])
  const [editingInfoGeral, setEditingInfoGeral] = useState(false)
  const [infoGeralForm, setInfoGeralForm] = useState('')
  const [savingInfoGeral, setSavingInfoGeral] = useState(false)
  const [savingBriefingInfo, setSavingBriefingInfo] = useState(false)
  const [editingEquipa, setEditingEquipa] = useState(false)
  const [equipaForm, setEquipaForm] = useState<Array<{ role: string; name: string }>>([])
  const [savingEquipa, setSavingEquipa] = useState(false)
  const [editingBriefing, setEditingBriefing] = useState(false)
  const [briefingForm, setBriefingForm] = useState<Record<string, string>>({})
  const [savingBriefing, setSavingBriefing] = useState(false)
  const [sendingBriefing, setSendingBriefing] = useState(false)
  const [briefingSent, setBriefingSent] = useState(false)
  const [cronogramaStatus, setCronogramaStatus] = useState<Record<string, boolean>>({})
  const [satisfacao, setSatisfacao] = useState<{ nota: number; comentario: string; submetidoEm: string } | null>(null)
  const [notaSat, setNotaSat] = useState(0)
  const [hoverNotaSat, setHoverNotaSat] = useState(0)
  const [comentarioSat, setComentarioSat] = useState('')
  const [enviandoSat, setEnviandoSat] = useState(false)
  const [enviadoSat, setEnviadoSat] = useState(false)
  const [erroSat, setErroSat] = useState<string | null>(null)

  const isSobrePage       = title.toUpperCase().includes('SOBRE')
  const isSobreViewMode   = isSobrePage && !editing && !editingPhotos && !editingParceiros && !editingBriefing && !editingCalloutLinks && !editingPreWedding

  // SOBRE O MENU é fullscreen 100vh/100vw — bloqueia scroll do body para garantir
  // que nunca aparecem barras de scroll, independentemente do conteúdo dos blocos.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isSobreViewMode) {
      const prevHtml = document.documentElement.style.overflow
      const prevBody = document.body.style.overflow
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.documentElement.style.overflow = prevHtml
        document.body.style.overflow = prevBody
      }
    }
  }, [isSobreViewMode])

  // Sobre o Menu → SEMPRE design premium (foto background fullscreen),
  // como o Pagamentos. Outras páginas podem ser marcadas via admin toggle.
  const isDesignPremium   = isSobrePage || (id ? designPremiumPages.includes(id) : false)
  const dpEffectivePhoto  = (() => {
    if (!isDesignPremium) return ''
    const perPage = id ? pageHeaders[id as string] : undefined
    return perPage === 'none' ? '' : (perPage || subpageHeaderUrl || portalHeroImageUrl)
  })()
  const isPaymentsPage    = title.toUpperCase().includes('PAGAMENTO')
  const isGuiaPage        = title.toUpperCase().includes('GUIA') && !title.toUpperCase().includes('WEDDING')
  const isPreWeddingPage  = title.toUpperCase().includes('WEDDING')
  const isContratoPage    = title.toUpperCase().includes('CONTRATO')
  const isBriefingPage    = title.toUpperCase().includes('BRIEFING')
  const isFotografiasPage = title.toUpperCase().includes('FOTOGRAF')
  // Vista bloqueada para freelancers: abrem o briefing via "Ver Briefing" no
  // seu portal e só podem ver MESMO o briefing — escondemos toda a navegação
  // (sidebar, menu, Voltar, sino de notificações) para não acederem ao portal
  // completo dos noivos. Ativada com ?freelancer=1 no URL do iframe.
  const isFreelancerView  = searchParams.get('freelancer') === '1'
  const isFilmePage       = title.toUpperCase().includes('FILME') || title.toUpperCase().includes('NOSSO FILME')
  const isSatisfacaoPage   = title.toUpperCase().includes('SAT.') || title.toUpperCase().includes('SATISF')
  const isCronogramaPage   = title.toUpperCase().includes('CRONOGRAMA')

  const loadPagamentos = useCallback(async () => {
    setPagRefreshing(true)
    try {
      let ps: Record<string, any> = {}
      let settingsBlockIdVal: string | null = null

      if (refParam) {
        // Ref-based portal: load settings from Supabase
        // E em PARALELO os settings do template-mestre (Notion) para usar
        // como fallback nos campos VISUAIS (fotos, layout, etc.) — assim
        // alterar o template propaga a todos os portais que não tenham
        // override pessoal para esse campo. Tudo o que é específico do
        // casal (referência, noivos, valores, datas, estados das
        // entregas, mensagens, URLs das galerias, password, etc.)
        // continua a ser preservado do portal individual.
        const [d, templateD] = await Promise.all([
          fetch(`/api/portais?ref=${encodeURIComponent(refParam)}`).then(r => r.json()),
          fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        ])
        ps = d.portal?.settings ?? {}

        // ── Apply template fallback APENAS para campos visuais ──
        const tmpl: Record<string, any> = templateD?.settings ?? {}
        const useTemplateIfEmpty = (campo: string) => {
          const cur = ps[campo]
          const isEmpty =
            cur === undefined || cur === null || cur === '' ||
            (Array.isArray(cur) && cur.length === 0)
          if (isEmpty && tmpl[campo] !== undefined && tmpl[campo] !== null && tmpl[campo] !== '') {
            ps[campo] = tmpl[campo]
          }
        }

        // Foto-hero global e das sub-páginas (placeholder se template
        // vazio também)
        useTemplateIfEmpty('heroImageUrl')
        useTemplateIfEmpty('subpageHeaderUrl')

        // pageHeaders: merge — overrides do portal vencem sobre template
        if (tmpl.pageHeaders && typeof tmpl.pageHeaders === 'object') {
          ps.pageHeaders = { ...(tmpl.pageHeaders ?? {}), ...(ps.pageHeaders ?? {}) }
        }

        // pwPhotos: merge — override pessoal vence; campos vazios herdam
        if (tmpl.pwPhotos && typeof tmpl.pwPhotos === 'object') {
          ps.pwPhotos = { ...(tmpl.pwPhotos ?? {}), ...(ps.pwPhotos ?? {}) }
        }
        // pwHeroPhoto (legacy single field) — só usa template se ambos
        // pwPhotos.hero e o legacy estão vazios
        if (!ps.pwHeroPhoto && tmpl.pwHeroPhoto) {
          ps.pwHeroPhoto = tmpl.pwHeroPhoto
        }

        // pwSections / pwIntro / pwCenarios: editoriais do Pré-Wedding —
        // só herdam se o portal individual NUNCA tocou neles
        useTemplateIfEmpty('pwSections')
        useTemplateIfEmpty('pwIntro')
        useTemplateIfEmpty('pwCenarios')

        // parceiros: lista global — só herda se o portal não tem própria
        useTemplateIfEmpty('parceiros')

        // guiaLinks: merge — campos default do template vêm como fallback;
        // links específicos do casal (já preenchidos no portal) ganham
        if (tmpl.guiaLinks && typeof tmpl.guiaLinks === 'object') {
          ps.guiaLinks = { ...(tmpl.guiaLinks ?? {}), ...(ps.guiaLinks ?? {}) }
        }
        // designPremiumPages: lista de páginas com design premium ON
        useTemplateIfEmpty('designPremiumPages')
      } else {
        // Main portal: load settings from Notion
        const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`, { cache: 'no-store' }).then(r => r.json())
        ps = d.settings ?? {}
        settingsBlockIdVal = d.settingsBlockId ?? null
        // Auto-extract reference from portal page blocks if not in settings
        if (!ps.referencia) {
          for (const b of (d.blocks ?? []) as Block[]) {
            if (b.type === 'paragraph') {
              const text = plainText(b.paragraph?.rich_text ?? [])
              if (/^(referên|referência|referencia|ref\.?\s*:|ref\s+)/i.test(text.trim())) {
                ps.referencia = text.replace(/^.*?:\s*/i, '').trim()
                break
              }
            }
          }
        }
      }

      const ref: string = ps.referencia ?? refParam ?? ''
      const total: number = ps.valorTotal ?? 0
      setPortalFoto(ps.valorFoto ?? null)
      setPortalVideo(ps.valorVideo ?? null)
      setPortalExtras(ps.valorExtras ?? null)
      const loadedGuiaLinks = { ...(ps.guiaLinks ?? {}) }
      // Migrate old payment URL to correct one
      if (loadedGuiaLinks.pagamentosRegistoUrl === 'https://tally.so/r/81Gxyo') {
        loadedGuiaLinks.pagamentosRegistoUrl = 'https://tally.so/r/A72PQB'
      }
      setGuiaLinks({ ...DEFAULT_GUIA_LINKS, ...loadedGuiaLinks })
      setParceiros(ps.parceiros ?? [])
      setPortalSettingsBlockId(settingsBlockIdVal)
      setSubpageHeaderUrl(ps.subpageHeaderUrl ?? '')
      setPortalHeroImageUrl(ps.heroImageUrl ?? '')
      setDesignPremiumPages(ps.designPremiumPages ?? [])
      // Unificado com a secção "Marcação" da ficha: quando o admin aprova
      // (bookingActive), usa os bookingSlots; senão cai para os preWeddingSlots antigos.
      const slots = ps.bookingActive && Array.isArray(ps.bookingSlots) && ps.bookingSlots.length
        ? ps.bookingSlots
        : (ps.preWeddingSlots ?? [])
      setPreWeddingSlots(slots)
      const savedId = ps.bookingReservedSlotId ?? ps.preWeddingReservedSlotId ?? null
      const validId = savedId && slots.some((s: {id: string}) => s.id === savedId) ? savedId : null
      setReservedSlotId(validId)
      setContratoDisponivel(ps.contratoDisponivel ?? false)
      setContratoUrl(ps.contratoUrl ?? null)
      setPortalSettingsObj(ps)
      const pt = ps.pageTitles ?? {}
      setPageTitles(pt)
      if (id && pt[id as string]) setTitle(pt[id as string])
      setCalloutLinks(ps.calloutLinks ?? {})
      setBriefingLinks(ps.briefingLinks ?? {})
      setPageHeaders(ps.pageHeaders ?? {})
      // pwPhotos é o novo formato; pwHeroPhoto era o legacy (foto abaixo do hero)
      const photos = { ...(ps.pwPhotos ?? {}) }
      if (ps.pwHeroPhoto && !photos.hero) photos.hero = ps.pwHeroPhoto
      setPwPhotos(photos)
      setPwSections(Array.isArray(ps.pwSections) ? ps.pwSections : [])
      setPwIntro(ps.pwIntro && typeof ps.pwIntro === 'object' ? ps.pwIntro : null)
      setPwCenarios(Array.isArray(ps.pwCenarios) ? ps.pwCenarios : null)
      setBriefingInfo(ps.briefingInfo ?? {})
      setBriefingFichas(ps.briefingFichas ?? {})
      setCronogramaStatus(ps.cronogramaStatus ?? {})
      setSatisfacao(ps.satisfacao ?? null)

      // Proposta token (links portal to CRM lead proposal)
      const propToken = ps.propostaToken ?? ''
      setPropostaToken(propToken)
      setPropostaTokenForm(propToken)

      if (ref) {
        setPortalRef(ref)
        setPortalTotal(total)
        const fetches: Promise<any>[] = [
          fetch(`/api/pagamentos-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json()),
          fetch(`/api/evento-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json()),
        ]
        if (propToken) fetches.push(fetch(`/api/crm-proposta-by-token?token=${encodeURIComponent(propToken)}`).then(r => r.json()))
        const results = await Promise.all(fetches)
        const [pd, ed, propd] = results
        setPagamentos(pd.payments ?? [])
        if (ed.found) {
          setEventoData(ed.evento)
          if ((ps.contratoDisponivel ?? false) && !ps.contratoUrl) {
            setContratoUrl(`/eventos-2026/${ed.evento.id}/contrato`)
          }
          // Serviços da proposta directamente do Notion
          setNotionServicos({
            proposta:      ed.evento.proposta      ?? null,
            servico_foto:  ed.evento.servico_foto  ?? [],
            servico_video: ed.evento.servico_video ?? [],
          })
        }
        if (propd?.found) {
          setPropostaData(propd.proposta)
          // Se o portal não tem valorTotal definido, usa o valor da proposta CRM
          if (!total && propd.proposta?.valor) {
            const v = parseFloat(String(propd.proposta.valor).replace(',', '.'))
            if (!isNaN(v) && v > 0) setPortalTotal(v)
          }
        }
      }
    } catch {
      // Silently fail — portal still renders with available data
    } finally {
      setPagRefreshing(false)
    }
  }, [refParam])

  useEffect(() => {
    loadPagamentos()
  }, [loadPagamentos])

  // Auto-refresh pagamentos a cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => { loadPagamentos() }, 30000)
    return () => clearInterval(id)
  }, [loadPagamentos])

  // Dedicated fetch for proposta data — runs immediately from refParam (URL param)
  // This is independent of loadPagamentos so it works even if other fetches fail
  useEffect(() => {
    if (!refParam) return
    fetch(`/api/evento-by-ref?ref=${encodeURIComponent(refParam)}`)
      .then(r => r.json())
      .then(ed => {
        if (ed.found) {
          setNotionServicos({
            proposta:      ed.evento.proposta      ?? null,
            servico_foto:  ed.evento.servico_foto  ?? [],
            servico_video: ed.evento.servico_video ?? [],
          })
        }
      })
      .catch(() => {})
  }, [refParam])

  const loadBlocks = useCallback(async (bust = false) => {
    if (!id) return
    const url = `/api/portais-clientes?id=${id}${bust ? '&bust=1' : ''}`
    try {
      const d = await fetch(url).then(r => r.json())
      if (d.error) {
        // API error — silently fail, portal renders without Notion blocks
        setBlocks([])
      } else {
        // Patch: para portais de casamento (CAS_*), substituir 'batizado' /
        // 'vosso bebé' por 'casamento' nos textos vindos do Notion.
        const ref = portalRef || refParam || ''
        const isCasamento = /^CAS[_-]/i.test(ref)
        const fixText = (text: string): string => isCasamento && text
          ? text
              .replace(/grande dia do vosso bebé/gi, 'grande dia do vosso casamento')
              .replace(/dia do vosso bebé/gi, 'dia do vosso casamento')
              .replace(/vosso bebé/gi, 'vosso casamento')
              .replace(/gestão do batizado/gi, 'gestão do casamento')
              .replace(/dia do batizado/gi, 'dia do casamento')
              .replace(/do batizado/gi, 'do casamento')
              .replace(/o batizado/gi, 'o casamento')
              .replace(/\bBatizado\b/g, 'Casamento')
              .replace(/\bBATIZADO\b/g, 'CASAMENTO')
              .replace(/\bbatizado\b/g, 'casamento')
          : text
        const patchBlocks = (bks: any[]): any[] => isCasamento
          ? bks.map(b => {
              const out: any = { ...b }
              const types = ['paragraph','heading_1','heading_2','heading_3','bulleted_list_item','numbered_list_item','quote','callout','to_do','toggle','code']
              for (const t of types) {
                if (out[t]?.rich_text && Array.isArray(out[t].rich_text)) {
                  out[t] = { ...out[t], rich_text: out[t].rich_text.map((rt: any) => rt ? {
                    ...rt,
                    plain_text: rt.plain_text ? fixText(rt.plain_text) : rt.plain_text,
                    text: rt.text ? { ...rt.text, content: rt.text.content ? fixText(rt.text.content) : rt.text.content } : rt.text,
                  } : rt) }
                }
              }
              if (out.child_page?.title) out.child_page = { ...out.child_page, title: fixText(out.child_page.title) }
              if (Array.isArray(out.children)) out.children = patchBlocks(out.children)
              return out
            })
          : bks
        setBlocks(patchBlocks(d.blocks ?? []))
        setSettings(d.settings ?? { hiddenNav: [] })
        setSettingsBlockId(d.settingsBlockId ?? null)
      }
    } catch {
      // Network error — portal still renders (payments, contrato, etc. work independently)
      setBlocks([])
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

  const [publishing, setPublishing] = useState(false)
  const [published,  setPublished]  = useState(false)

  async function handlePublicar() {
    setPublishing(true)
    try {
      await fetch('/api/portais', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Sincroniza fotos + lista de páginas em Design Premium
          photoSettings: {
            subpageHeaderUrl,
            pageHeaders,
            designPremiumPages,
          },
          tipoPortal: 'casamento',
        }),
      })
      setPublished(true)
      setTimeout(() => setPublished(false), 3000)
    } finally { setPublishing(false) }
  }

  async function savePortalSettings(newSettings: Record<string, any>) {
    if (refParam) {
      await fetch('/api/portais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: refParam, updates: { settings: newSettings } }),
      })
    } else {
      // Template sub-page: save to Notion
      const res = await fetch('/api/portal-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId: portalSettingsBlockId }),
      })
      const saved = await res.json().catch(() => ({}))
      if (saved.settingsBlockId) setPortalSettingsBlockId(saved.settingsBlockId)
      // Sync all photo fields to every casamento portal in Supabase
      const photoFields: Record<string, any> = {}
      if (newSettings.heroImageUrl     !== undefined) photoFields.heroImageUrl     = newSettings.heroImageUrl
      if (newSettings.galleryUrls      !== undefined) photoFields.galleryUrls      = newSettings.galleryUrls
      if (newSettings.subpageHeaderUrl !== undefined) photoFields.subpageHeaderUrl = newSettings.subpageHeaderUrl
      if (newSettings.pageHeaders      !== undefined) photoFields.pageHeaders      = newSettings.pageHeaders
      if (Object.keys(photoFields).length > 0) {
        fetch('/api/portais', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoSettings: photoFields, tipoPortal: 'casamento' }),
        })
      }
    }
  }

  async function handleSaveTitle() {
    if (!id || !titleInput.trim()) return
    setSavingTitle(true)
    const newPt = { ...pageTitles, [id as string]: titleInput.trim() }
    await savePortalSettings({ ...portalSettingsObj, pageTitles: newPt })
    setPageTitles(newPt)
    setTitle(titleInput.trim())
    setEditingTitle(false)
    setSavingTitle(false)
  }

  async function handleUploadPageHeader(file: File) {
    if (!id) return
    setUploadingPageHeader(true)
    try {
      const url = await uploadWithProgress(file, () => {})
      const newPH = { ...pageHeaders, [id as string]: url }
      await savePortalSettings({ ...portalSettingsObj, pageHeaders: newPH })
      setPageHeaders(newPH)
    } finally { setUploadingPageHeader(false) }
  }

  async function handleRemovePageHeader() {
    if (!id) return
    // 'none' sentinel = explicitly no photo (overrides global default)
    const newPH = { ...pageHeaders, [id as string]: 'none' }
    await savePortalSettings({ ...portalSettingsObj, pageHeaders: newPH })
    setPageHeaders(newPH)
  }

  // ── Fotos da página Pré-Wedding — geridas no app por slot, sem Notion ──
  async function handleUploadPwPhoto(slot: string, file: File) {
    setUploadingPwSlot(slot)
    try {
      const url = await uploadWithProgress(file, () => {})
      const next = { ...pwPhotos, [slot]: url }
      await savePortalSettings({ ...portalSettingsObj, pwPhotos: next })
      setPwPhotos(next)
    } finally { setUploadingPwSlot(null) }
  }
  async function handleRemovePwPhoto(slot: string) {
    const next = { ...pwPhotos }
    delete next[slot]
    await savePortalSettings({ ...portalSettingsObj, pwPhotos: next })
    setPwPhotos(next)
  }

  // ── Intro editável (substitui leitura do Notion) ──
  async function handleSavePwIntro(next: PwIntro) {
    await savePortalSettings({ ...portalSettingsObj, pwIntro: next })
    setPwIntro(next)
  }
  // ── Cenário editável: grava por índice ──
  async function handleSavePwCenario(idx: number, next: PwCenario) {
    const arr = pwCenarios ? [...pwCenarios] : []
    while (arr.length <= idx) arr.push({ num: String(arr.length + 1).padStart(2, '0'), title: '', paragraphs: [], bullets: [] })
    arr[idx] = next
    await savePortalSettings({ ...portalSettingsObj, pwCenarios: arr })
    setPwCenarios(arr)
  }

  // ── Secções personalizadas (texto + foto) na página Pré-Wedding ──
  async function handleChangePwSections(next: PwSection[]) {
    // Limpa fotos órfãs (slots custom-<id> que já não existem)
    const validIds = new Set(next.map(s => s.id))
    const cleanedPhotos: Record<string, string> = {}
    for (const [k, v] of Object.entries(pwPhotos)) {
      if (!k.startsWith('custom-')) { cleanedPhotos[k] = v; continue }
      const sid = k.slice('custom-'.length)
      if (validIds.has(sid)) cleanedPhotos[k] = v
    }
    // Liga as URLs de foto às secções para render directo
    const withPhotos = next.map(s => ({ ...s, photoUrl: cleanedPhotos[`custom-${s.id}`] || null }))
    await savePortalSettings({ ...portalSettingsObj, pwSections: withPhotos, pwPhotos: cleanedPhotos })
    setPwSections(withPhotos)
    setPwPhotos(cleanedPhotos)
  }

  async function handleToggleDesignPremium() {
    if (!id) return
    const already = designPremiumPages.includes(id)
    const newList = already ? designPremiumPages.filter(p => p !== id) : [...designPremiumPages, id]
    await savePortalSettings({ ...portalSettingsObj, designPremiumPages: newList })
    setDesignPremiumPages(newList)
  }

  async function handleSaveBriefingInfo() {
    if (!id) return
    setSavingBriefingInfo(true)
    const existing = briefingInfo[id as string] ?? {}
    const newBI = { ...briefingInfo, [id as string]: { ...existing, fields: briefingFieldsForm } }
    await savePortalSettings({ ...portalSettingsObj, briefingInfo: newBI })
    setBriefingInfo(newBI)
    setEditingBriefingInfo(false)
    setSavingBriefingInfo(false)
  }

  async function handleSaveInfoGeral() {
    if (!id) return
    setSavingInfoGeral(true)
    const existing = briefingInfo[id as string] ?? {}
    const newBI = { ...briefingInfo, [id as string]: { ...existing, infoGeral: infoGeralForm } }
    await savePortalSettings({ ...portalSettingsObj, briefingInfo: newBI })
    setBriefingInfo(newBI)
    setEditingInfoGeral(false)
    setSavingInfoGeral(false)
  }

  async function handleSaveEquipa() {
    if (!id) return
    setSavingEquipa(true)
    const existing = briefingInfo[id as string] ?? {}
    const newBI = { ...briefingInfo, [id as string]: { ...existing, equipa: equipaForm } }
    await savePortalSettings({ ...portalSettingsObj, briefingInfo: newBI })
    setBriefingInfo(newBI)
    setEditingEquipa(false)
    setSavingEquipa(false)
  }

  // Save genérico para todas as secções do BriefingExtensions
  async function handleSaveBriefingExt(patch: Partial<BriefingExt>) {
    if (!id) return
    const existing = briefingInfo[id as string] ?? {}
    const updated = { ...existing, ...patch }
    const newBI = { ...briefingInfo, [id as string]: updated }
    setBriefingInfo(newBI) // optimistic
    await savePortalSettings({ ...portalSettingsObj, briefingInfo: newBI })
  }

  async function handleSaveCalloutLinks() {
    if (!id) return
    setSavingCalloutLinks(true)
    const newCL = { ...calloutLinks, [id as string]: calloutLinksForm }
    const newGuiaLinks = isFotografiasPage
      ? { ...guiaLinks, fotosVerMaisUrl: fotosVerMaisUrlForm.trim() }
      : guiaLinks
    await savePortalSettings({ ...portalSettingsObj, calloutLinks: newCL, guiaLinks: newGuiaLinks })
    setCalloutLinks(newCL)
    setGuiaLinks(newGuiaLinks)
    setEditingCalloutLinks(false)
    setSavingCalloutLinks(false)
  }

  async function toggleCronogramaSection(blockId: string) {
    const newStatus = { ...cronogramaStatus, [blockId]: !cronogramaStatus[blockId] }
    setCronogramaStatus(newStatus)
    await savePortalSettings({ ...portalSettingsObj, cronogramaStatus: newStatus })
  }

  const SAT_LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito Bom', 'Excelente']

  async function submeterSatisfacao() {
    if (notaSat === 0) { setErroSat('Seleciona uma classificação.'); return }
    setEnviandoSat(true)
    setErroSat(null)
    try {
      const resposta = { nota: notaSat, comentario: comentarioSat.trim(), submetidoEm: new Date().toISOString() }
      const newSettings = { ...portalSettingsObj, satisfacao: resposta }
      await savePortalSettings(newSettings)
      setPortalSettingsObj(newSettings)

      // Notificar admin
      const nomePortal = portalSettingsObj.noiva && portalSettingsObj.noivo
        ? `${portalSettingsObj.noiva} & ${portalSettingsObj.noivo}`
        : portalRef || refParam || 'Portal Cliente'
      fetch('/api/media-portal/notify-satisfacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeProjeto: nomePortal,
          cliente:     nomePortal,
          ref:         portalRef || refParam || '',
          nota:        notaSat,
          comentario:  comentarioSat.trim(),
        }),
      }).catch(() => {})

      setSatisfacao(resposta)
      setEnviadoSat(true)
    } catch {
      setErroSat('Erro ao enviar. Tenta novamente.')
    }
    setEnviandoSat(false)
  }

  async function handleSaveBriefing() {
    setSavingBriefing(true)
    const newBL = { ...briefingLinks, ...briefingForm }
    await savePortalSettings({ ...portalSettingsObj, briefingLinks: newBL })
    setBriefingLinks(newBL)
    setEditingBriefing(false)
    setSavingBriefing(false)
  }

  async function handleEnviarBriefing() {
    const ref = portalRef || refParam
    if (!ref) return
    setSendingBriefing(true)
    try {
      // Get evento info (id, local, data) from referencia
      const ev = await fetch(`/api/evento-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json())
      const briefing_url = typeof window !== 'undefined' ? window.location.href : ''
      const evento_id = ev?.evento?.id ?? ev?.id ?? null
      const local = ev?.evento?.local ?? ev?.local ?? null
      const data_casamento = ev?.evento?.data_evento ?? ev?.data_evento ?? null
      // 1) Preparar: guardar o link do briefing no evento.
      await fetch('/api/evento-equipa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: ref, briefing_url, evento_id, local, data_casamento }),
      })
      // 2) Distribuir à equipa: desbloqueia "Ver Briefing" + notificação + email
      //    a todos os membros atribuídos a este evento (sem lista = todos).
      await fetch('/api/briefing-equipa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: ref, evento_id, local, data_casamento }),
      }).catch(() => {})
      setBriefingSent(true)
      setTimeout(() => setBriefingSent(false), 3000)
    } finally {
      setSendingBriefing(false)
    }
  }

  // Find all callout blocks (with images) across blocks tree
  function findCalloutCards(bks: Block[]): Block[] {
    const out: Block[] = []
    for (const b of bks) {
      if (b.type === 'callout') {
        const hasImg = (b.children ?? []).some((c: Block) => c.type === 'image')
        if (hasImg) out.push(b)
      }
      if (b.type === 'column_list' || b.type === 'column') {
        out.push(...findCalloutCards(b.children ?? []))
      }
    }
    return out
  }

  const hasImages = findImageBlocks(blocks).length > 0

  // ── Sidebar Atmosphère (presentation only) ────────────────────────────
  const _atmTitleFor = (p: { id: string; title: string }) =>
    (pageTitles[p.id] ?? p.title).replace(/\s*\(\d+\)\s*$/, '')
  const _atmHref = (pid: string, t: string) => {
    const qs = new URLSearchParams()
    qs.set('title', t)
    if (portalRef) qs.set('portalRef', portalRef)
    return `/portal-cliente/${pid}?${qs.toString()}`
  }
  // Item "Início" no topo da nav — leva à home do portal
  const _atmHomeHref = portalRef
    ? `/portal-cliente/ref/${encodeURIComponent(portalRef)}`
    : '/portal-cliente'
  const _atmInicioItem: SidebarNavItem = {
    id: '__inicio__',
    label: 'Início',
    href: _atmHomeHref,
    active: false,
  }
  const _atmNavItems: SidebarNavItem[] = [_atmInicioItem, ...parentNavPages
    .filter(p => !((portalSettingsObj?.hiddenNav ?? []) as string[]).includes(p.id))
    .filter(p => {
      // Ocultar "Guia dos Noivos" (mantém só Guia Pré-Wedding)
      const t = ((portalSettingsObj?.pageTitles?.[p.id] ?? p.title) || '').toUpperCase()
      if (t.includes('GUIA DOS NOIVOS')) return false
      return true
    })
    .map(p => {
      const t = _atmTitleFor(p)
      return {
        id: p.id,
        label: t,
        active: id === p.id,
        href: _atmHref(p.id, t),
      }
    })]
  const _atmWeddingIso: string | null = portalSettingsObj?.data ?? null
  const _atmWeddingDate = _atmWeddingIso
    ? (() => {
        const m = _atmWeddingIso.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (!m) return null
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)
      })()
    : null
  const _atmSidebar = (
    <>
      <SidebarCouple
        noiva={portalSettingsObj?.noiva ?? null}
        noivo={portalSettingsObj?.noivo ?? null}
        data={portalSettingsObj?.dataFormatada ?? null}
        fotoUrl={portalSettingsObj?.casalFotoUrl ?? null}
      />
      <SidebarNav items={_atmNavItems} />
      <SidebarMiniCountdown
        weddingDate={_atmWeddingDate}
        coupleCode={portalSettingsObj?.referencia ?? portalRef ?? null}
      />
    </>
  )

  // ── Atmosphère view (text-only sub-pages: Atendimento, Lista de Presentes, etc.)
  //    Aplica-se quando NÃO está em edit-mode, NÃO é Sobre (full-screen) e NÃO é design premium.
  //    Sub-páginas especiais (Pagamentos/Contrato/Pré-Wedding/Briefing/Guia) caem no render
  //    existente em baixo.
  const _atmIsSimple = !editing && !editingPhotos && !editingParceiros && !editingBriefing
    && !editingCalloutLinks && !editingPreWedding && !editingPropostaToken
    && !isSobreViewMode && !isDesignPremium
    && !isPaymentsPage && !isContratoPage && !isPreWeddingPage && !isBriefingPage && !isGuiaPage && !isSobrePage
    && !isFotografiasPage && !isFilmePage && !isSatisfacaoPage && !isCronogramaPage
    && !error
  const _atmEffectiveHeader = (() => {
    const perPage = id ? pageHeaders[id as string] : undefined
    return perPage === 'none' ? '' : (perPage || subpageHeaderUrl || portalHeroImageUrl)
  })()
  const _atmBackHref = fromId
    ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}`
    : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : '/portal-cliente'

  if (_atmIsSimple && !loading) {
    const handleEditTitle = () => {
      setTitleInput(title)
      setEditingTitle(true)
    }
    return (
      <PortalShell sidebar={_atmSidebar} headerRight={<NoivosNotificationsBell notifs={portalSettingsObj?.noivos_notifications ?? []} refKey={portalRef || refParam || 'portal'} />}>
        {/* Admin actions bar */}
        {isAdmin && (
          <div className="abar">
            <button type="button" className="abtn" onClick={handleRefresh} disabled={refreshing}>
              <svg className={refreshing ? 'animate-spin' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8 8 0 1 0-.6 4" /><path d="M20 5v6h-6" />
              </svg>
              {refreshing ? 'A atualizar' : 'Atualizar'}
            </button>
            {hasImages && (
              <button type="button" className="abtn" onClick={() => setEditingPhotos(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                Fotos
              </button>
            )}
            <button type="button" className="abtn primary" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" />
              </svg>
              Publicar
            </button>
            <button type="button" className="abtn accent" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.8 5.7L19.5 10l-5.7 1.3L12 17l-1.8-5.7L4.5 10l5.7-1.3Z" />
              </svg>
              Premium
            </button>
            <button type="button" className="abtn" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
              </svg>
              Editar
            </button>
          </div>
        )}

        {/* Hero */}
        <header className="subhero">
          {_atmEffectiveHeader ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={_atmEffectiveHeader} alt="" className="img" />
          ) : (
            <div className="ph img" data-label={`Fotografia · ${title}`} />
          )}
          <div className="scrim" />
          {/* Voltar — canto superior esquerdo do hero */}
          <a className="back back-hero" href={_atmBackHref}>
            <span className="chev">‹</span> Voltar
          </a>
          {isAdmin && (
            <div className="imgctrl">
              <button type="button" className="gbtn" onClick={() => setEditingPhotos(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                Trocar
              </button>
              {_atmEffectiveHeader && (
                <button type="button" className="gbtn danger" onClick={handleRemovePageHeader}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  Remover
                </button>
              )}
            </div>
          )}
          <div className="cap">
            <div className="eyebrow e">RL Photo · Video</div>
            <div className="title">
              <h1>{title || 'Atendimento'}</h1>
              {isAdmin && (
                <span className="pencil" onClick={handleEditTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Article */}
        <article className="subarticle">
          <div className="body">
            <NotionBlocks
              blocks={blocks.filter(b => b.type !== 'image')}
              hiddenNav={settings.hiddenNav}
              backUrl={_atmBackHref}
            />

            {/* Info + Botão Enviar Mensagem (só páginas Atendimento) */}
            {portalRef && title.toUpperCase().includes('ATEND') && (
              <div className="msg-info-wrap">
                <div className="msg-info">
                  <div className="msg-info-eyebrow">Canal Oficial dos Noivos</div>
                  <h3 className="msg-info-title">
                    Esta é a forma <em>mais organizada</em> de nos chegarem
                  </h3>
                  <p>
                    Em vez de mensagens que se perdem no WhatsApp,
                    podem (e devem) enviar todos os vossos pedidos por este canal.
                    Cada mensagem fica registada no vosso portal e <strong>tem sempre resposta da nossa parte</strong>.
                  </p>
                  <p className="msg-info-note">
                    O tempo de resposta poderá ir <strong>até 8 dias úteis</strong>.
                    Obrigado pela vossa compreensão e confiança.
                  </p>
                </div>
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <SendMessageButton
                    referencia={portalRef}
                    nomeNoivos={[portalSettingsObj?.noiva, portalSettingsObj?.noivo].filter(Boolean).join(' & ') || null}
                    emailNoiva={portalSettingsObj?.emailNoiva ?? null}
                  />
                </div>

                {/* Histórico de mensagens + respostas da RL */}
                <AtendimentoThread referencia={portalRef} />

                <style jsx>{`
                  .msg-info-wrap {
                    margin: 40px 0 10px;
                  }
                  .msg-info {
                    border: 1px solid rgba(200,168,102,.22);
                    border-left: 2px solid rgba(200,168,102,.6);
                    background: linear-gradient(180deg, rgba(200,168,102,.04), rgba(200,168,102,.01));
                    padding: 26px 30px 24px;
                    border-radius: 4px;
                    margin-bottom: 18px;
                  }
                  .msg-info-eyebrow {
                    font-family: 'Hanken Grotesk', sans-serif;
                    font-size: 10px;
                    letter-spacing: .42em;
                    text-transform: uppercase;
                    color: #c8a866;
                    font-weight: 600;
                    margin-bottom: 12px;
                  }
                  .msg-info-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 400;
                    font-size: 24px;
                    line-height: 1.25;
                    color: #efe7d6;
                    margin: 0 0 14px;
                  }
                  .msg-info-title em {
                    font-style: italic;
                    color: #d7bd87;
                  }
                  .msg-info p {
                    font-family: 'Hanken Grotesk', sans-serif !important;
                    font-size: 14.5px !important;
                    line-height: 1.75 !important;
                    color: #c3b8a3 !important;
                    margin: 0 0 12px !important;
                    font-weight: 400 !important;
                  }
                  .msg-info p strong {
                    color: #efe7d6;
                    font-weight: 600;
                  }
                  .msg-info-note {
                    margin: 14px 0 0 !important;
                    padding-top: 14px;
                    border-top: 1px solid rgba(239,231,214,.06);
                    font-size: 13.5px !important;
                    color: #8c8170 !important;
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Logo card final (mesmo que o template) */}
          <div className="logocard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/portal-noivos/logo-ink.png" alt="RL Photo Video" />
            <div className="url">www.rlphotovideo.pt</div>
          </div>
        </article>
      </PortalShell>
    )
  }

  // ── Atmosphère view · CONTRATO · CPS ──────────────────────────────────────
  const _atmIsContrato = isContratoPage && !editing && !editingPhotos
    && !editingParceiros && !editingBriefing && !editingCalloutLinks
    && !editingPreWedding && !editingPropostaToken && !error
  if (_atmIsContrato && !loading) {
    const handleEditTitle = () => { setTitleInput(title); setEditingTitle(true) }
    // Serviços vêm do CRM proposta (propostaData) ou do Notion (notionServicos)
    const servicosFoto =
      (propostaData?.servicos_foto && propostaData.servicos_foto.length > 0
        ? propostaData.servicos_foto
        : notionServicos?.servico_foto ?? [])
    const servicosVideo =
      (propostaData?.servicos_video && propostaData.servicos_video.length > 0
        ? propostaData.servicos_video
        : notionServicos?.servico_video ?? [])
    // Total — porta settings > evento (valor_foto + valor_video + valor_extras)
    const totalEur = (portalTotal && portalTotal > 0)
      ? portalTotal
      : (eventoData ? (eventoData.valor_foto ?? 0) + (eventoData.valor_video ?? 0) + (eventoData.valor_extras ?? 0) : 0)
    // Pagamentos mapped to ContratoView shape
    const planos = (pagamentos ?? []).map((p: any, i: number) => ({
      label: p.descricao || p.label || ['Assinatura', 'Entrada', 'Final'][i] || `Fase ${i + 1}`,
      roman: ['I', 'II', 'III', 'IV', 'V'][i] ?? `${i + 1}`,
      valor: Number(p.valor ?? p.amount ?? 0),
      paid: p.pago === true || p.status === 'pago' || p.estado === 'pago' || p.paid === true,
      when: p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-PT') : (p.previsao ?? undefined),
    }))
    // Investimento — para mostrar a copy "Mais do que um serviço…" usamos
    // os parágrafos do Notion (filtra h1/h2 e imagens, fica só texto).
    const investParagraphs: string[] = []
    for (const b of blocks) {
      if (b.type === 'paragraph') {
        const txt = plainText(b.paragraph?.rich_text ?? [])
        if (txt.trim()) investParagraphs.push(txt)
      }
    }

    return (
      <PortalShell sidebar={_atmSidebar} headerRight={<NoivosNotificationsBell notifs={portalSettingsObj?.noivos_notifications ?? []} refKey={portalRef || refParam || 'portal'} />}>
        <ContratoView
          title={title}
          heroImageUrl={_atmEffectiveHeader}
          backHref={_atmBackHref}
          contratoDisponivel={!!contratoDisponivel}
          contratoUrl={contratoUrl}
          onPrint={() => window.print()}
          investParagraphs={investParagraphs.slice(0, 5)}
          servicosFoto={servicosFoto}
          servicosVideo={servicosVideo}
          totalEur={totalEur}
          pagamentos={planos}
          isAdmin={isAdmin}
          onEditTitle={handleEditTitle}
          paymentPhasesNode={
            <PaymentPhasesSection
              referencia={portalRef}
              valorTotal={portalTotal}
              pagamentos={pagamentos}
              onRefresh={loadPagamentos}
              refreshing={pagRefreshing}
            />
          }
          adminActions={
            <>
              <button type="button" className="abtn" onClick={handleRefresh} disabled={refreshing}>
                <svg className={refreshing ? 'animate-spin' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 11a8 8 0 1 0-.6 4" /><path d="M20 5v6h-6" />
                </svg>
                {refreshing ? 'A atualizar' : 'Atualizar'}
              </button>
              {hasImages && (
                <button type="button" className="abtn" onClick={() => setEditingPhotos(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                  </svg>
                  Fotos
                </button>
              )}
              <button type="button" className="abtn primary" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" />
                </svg>
                Publicar
              </button>
              <button type="button" className="abtn accent" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 5.7L19.5 10l-5.7 1.3L12 17l-1.8-5.7L4.5 10l5.7-1.3Z" />
                </svg>
                Premium
              </button>
              <button type="button" className="abtn" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                </svg>
                Editar
              </button>
            </>
          }
        />
      </PortalShell>
    )
  }

  // ── Atmosphère view · GUIA PRÉ-WEDDING ────────────────────────────────────
  const _atmIsPreWedding = isPreWeddingPage && !editing && !editingPhotos
    && !editingParceiros && !editingBriefing && !editingCalloutLinks
    && !editingPreWedding && !editingPropostaToken && !error
  if (_atmIsPreWedding && !loading) {
    const handleEditTitlePW = () => { setTitleInput(title); setEditingTitle(true) }

    // Os textos vivem 100% em portais.settings. Notion já não é consultado.
    const introFinal: PwIntro = pwIntro ?? DEFAULT_INTRO
    const cenariosFinal: PwCenario[] = pwCenarios ?? (DEFAULT_CENARIOS as PwCenario[])

    return (
      <PortalShell sidebar={_atmSidebar} headerRight={<NoivosNotificationsBell notifs={portalSettingsObj?.noivos_notifications ?? []} refKey={portalRef || refParam || 'portal'} />}>
        <PreWeddingView
          title={title}
          heroImageUrl={_atmEffectiveHeader}
          backHref={_atmBackHref}
          isAdmin={isAdmin}
          onEditTitle={handleEditTitlePW}
          onUploadPhoto={isAdmin ? handleUploadPwPhoto : undefined}
          onRemovePhoto={isAdmin ? handleRemovePwPhoto : undefined}
          uploadingSlot={uploadingPwSlot}
          heroPhotoUrl={pwPhotos.hero || null}
          introPhotoUrl={pwPhotos.intro || null}
          introParagraphs={introFinal.paragraphs.slice(0, 4)}
          triptychUrls={[pwPhotos['tript-0']]}
          cenarios={cenariosFinal.map((c, i) => ({
            ...c,
            photoUrl: pwPhotos[`cen-${i}`] || null,
          })) as any}
          intro={introFinal}
          onSaveIntro={isAdmin ? handleSavePwIntro : undefined}
          onSaveCenario={isAdmin ? handleSavePwCenario : undefined}
          customSections={pwSections.map(s => ({ ...s, photoUrl: pwPhotos[`custom-${s.id}`] || null }))}
          onChangeCustomSections={isAdmin ? handleChangePwSections : undefined}
          adminActions={
            <>
              <button type="button" className="abtn" onClick={handleRefresh} disabled={refreshing}>
                <svg className={refreshing ? 'animate-spin' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 11a8 8 0 1 0-.6 4" /><path d="M20 5v6h-6" />
                </svg>
                {refreshing ? 'A atualizar' : 'Atualizar'}
              </button>
              {hasImages && (
                <button type="button" className="abtn" onClick={() => setEditingPhotos(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                  </svg>
                  Fotos
                </button>
              )}
              <button type="button" className="abtn primary" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" />
                </svg>
                Publicar
              </button>
              <button type="button" className="abtn accent" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.8 5.7L19.5 10l-5.7 1.3L12 17l-1.8-5.7L4.5 10l5.7-1.3Z" />
                </svg>
                Premium
              </button>
              <button type="button" className="abtn" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                </svg>
                Editar
              </button>
            </>
          }
          bookNode={
            <PreWeddingSection
              slots={preWeddingSlots}
              reservedSlotId={reservedSlotId}
              reservingSlotId={reservingSlotId}
              showReservedWarning={showReservedWarning}
              blocks={blocks}
              settings={settings}
              onReserve={async (slotId: string) => {
                setReservingSlotId(slotId)
                try {
                  // Grava só a parte alterada (merge no servidor) — escreve em
                  // bookingReservedSlotId para o admin ver na ficha + receber notif.
                  await fetch(`/api/portais?ref=${encodeURIComponent(portalRef)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      referencia: portalRef,
                      updates: {
                        settings: {
                          bookingReservedSlotId: slotId,
                          bookingReservedAt: new Date().toISOString(),
                          preWeddingReservedSlotId: slotId,
                          preWeddingReservedAt: new Date().toISOString(),
                        },
                      },
                    }),
                  })
                  // Email ao admin com a data/hora/local escolhidos
                  const s = preWeddingSlots.find(x => x.id === slotId)
                  if (s) {
                    fetch('/api/send-booking-reservation', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ referencia: portalRef, tipoEvento: 'casamento', bookingType: 'sessao', date: s.date, time: s.time, local: s.local }),
                    }).catch(() => {})
                  }
                  setReservedSlotId(slotId)
                  setShowReservedWarning(true)
                } finally { setReservingSlotId(null) }
              }}
              onNotificarNoivos={isAdmin ? async () => {
                setSendingNotifNoivos(true)
                try {
                  await fetch('/api/portal-notif-prewedding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referencia: portalRef }),
                  })
                  setNotifNoivosEnviado(true)
                } finally { setSendingNotifNoivos(false) }
              } : undefined}
              sendingNotifNoivos={sendingNotifNoivos}
              notifNoivosEnviado={notifNoivosEnviado}
            />
          }
        />
      </PortalShell>
    )
  }

  // ── Atmosphère view · FOTOGRAFIAS ─────────────────────────────────────────
  const _atmIsFotografias = isFotografiasPage && !editing && !editingPhotos
    && !editingParceiros && !editingBriefing && !editingCalloutLinks
    && !editingPreWedding && !editingPropostaToken && !error
  if (_atmIsFotografias && !loading) {
    const handleEditTitleFP = () => { setTitleInput(title); setEditingTitle(true) }
    const fpEnviarUrl = guiaLinks.fotosSelecaoUrl || 'https://tally.so/r/448PrO'
    const fpRef = portalRef || refParam || ''

    // Estado das URLs de cada card — vazio = bloqueado, presente = disponível
    const urlGalerias  = String(portalSettingsObj?.galerias_url     ?? '')
    const urlSelecao   = String(portalSettingsObj?.selecao_url      ?? '')
    const urlPrewed    = String(portalSettingsObj?.prewedding_url   ?? '')
    const urlEditadas  = String(portalSettingsObj?.fotos_finais_url ?? '')

    // Cálculo dos 30 dias para download de Fotos Editadas
    const fotosFinaisEnviadaIso: string = String(portalSettingsObj?.fotos_finais_enviada ?? '')
    let editadasFootnote: string | null = urlEditadas ? '30 dias para download' : null
    if (urlEditadas && fotosFinaisEnviadaIso) {
      const m = fotosFinaisEnviadaIso.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (m) {
        const enviada = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
        const limite  = new Date(enviada.getTime() + 30 * 86400000)
        const hoje    = new Date()
        const ms      = limite.getTime() - hoje.getTime()
        const dias    = Math.max(0, Math.ceil(ms / 86400000))
        editadasFootnote = dias > 0
          ? `Faltam ${dias} dia${dias === 1 ? '' : 's'} para download`
          : 'Período de download expirado'
      }
    }

    const fpCards: FotografiasCard[] = [
      {
        key: 'galerias',
        title: 'GALERIA ONLINE',
        heading: 'Galeria Online',
        caption: 'Vista completa para partilharem com família e amigos',
        mark: 'G',
        url: urlGalerias,
      },
      {
        key: 'selecao',
        title: 'GALERIA PARA SELEÇÃO',
        heading: 'Galeria para Seleção',
        caption: 'Escolham as fotos preferidas para o vosso álbum',
        mark: 'S',
        url: urlSelecao,
      },
      {
        key: 'prewedding',
        title: 'FOTOS PRÉ-WEDDING',
        heading: 'Fotos Pré-Wedding',
        caption: 'A sessão antes do grande dia',
        mark: 'P',
        url: urlPrewed,
      },
      {
        key: 'editadas',
        title: 'FOTOS EDITADAS',
        heading: 'Fotos Editadas',
        caption: 'Selecção final, editada, pronta para imprimir',
        mark: 'E',
        url: urlEditadas,
        footnote: editadasFootnote,
      },
    ]

    return (
      <PortalShell sidebar={_atmSidebar} headerRight={<NoivosNotificationsBell notifs={portalSettingsObj?.noivos_notifications ?? []} refKey={portalRef || refParam || 'portal'} />}>
        {/* Admin actions bar */}
        {isAdmin && (
          <div className="abar">
            <button type="button" className="abtn" onClick={handleRefresh} disabled={refreshing}>
              <svg className={refreshing ? 'animate-spin' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8 8 0 1 0-.6 4" /><path d="M20 5v6h-6" />
              </svg>
              {refreshing ? 'A atualizar' : 'Atualizar'}
            </button>
            {hasImages && (
              <button type="button" className="abtn" onClick={() => setEditingPhotos(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                Fotos
              </button>
            )}
            <button type="button" className="abtn primary" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 14v5h14v-5" />
              </svg>
              Publicar
            </button>
            <button type="button" className="abtn accent" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.8 5.7L19.5 10l-5.7 1.3L12 17l-1.8-5.7L4.5 10l5.7-1.3Z" />
              </svg>
              Premium
            </button>
            <button type="button" className="abtn" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
              </svg>
              Editar
            </button>
          </div>
        )}

        {/* Hero */}
        <header className="subhero">
          {_atmEffectiveHeader ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={_atmEffectiveHeader} alt="" className="img" />
          ) : (
            <div className="ph img" data-label={`Fotografia · ${title}`} />
          )}
          <div className="scrim" />
          <a className="back back-hero" href={_atmBackHref}>
            <span className="chev">‹</span> Voltar
          </a>
          {isAdmin && (
            <div className="imgctrl">
              <button type="button" className="gbtn" onClick={() => setEditingPhotos(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
                </svg>
                Trocar
              </button>
              {_atmEffectiveHeader && (
                <button type="button" className="gbtn danger" onClick={handleRemovePageHeader}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  Remover
                </button>
              )}
            </div>
          )}
          <div className="cap">
            <div className="eyebrow e">RL Photo · Video</div>
            <div className="title">
              <h1>{title || 'Fotografias'}</h1>
              {isAdmin && (
                <span className="pencil" onClick={handleEditTitleFP}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Article — body com FotografiasView */}
        <article className="subarticle">
          <div className="body">
            <FotografiasView
              enviarFotosUrl={fpEnviarUrl}
              selecaoAvailable={Boolean(urlSelecao)}
              cards={fpCards}
              separatorImageUrl={_atmEffectiveHeader || subpageHeaderUrl || portalHeroImageUrl || null}
              portalRef={fpRef}
              maqueteUrl={String(portalSettingsObj?.maquete_url ?? '') || null}
            />
          </div>

          {/* Logo card final (mesmo template das outras Atmosphère) */}
          <div className="logocard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/portal-noivos/logo-ink.png" alt="RL Photo Video" />
            <div className="url">www.rlphotovideo.pt</div>
          </div>
        </article>
      </PortalShell>
    )
  }

  return (
    <PortalShell sidebar={_atmSidebar} headerRight={isFreelancerView ? undefined : <NoivosNotificationsBell notifs={portalSettingsObj?.noivos_notifications ?? []} refKey={portalRef || refParam || 'portal'} />}>
    {/* Vista freelancer: esconde toda a navegação para só se ver o briefing */}
    {isFreelancerView && (
      <style dangerouslySetInnerHTML={{ __html: `
        .portal-atmosphere .sidebar nav,
        .portal-atmosphere .sidebar .nav-label,
        .portal-atmosphere .sidebar .mini,
        .portal-atmosphere .menu-toggle,
        .portal-atmosphere .atm-back,
        .portal-atmosphere .cards-head,
        .portal-atmosphere .cards-grid { display: none !important; }
      ` }} />
    )}
    <main className={isSobreViewMode ? 'relative sobre-view' : 'relative max-w-[860px] mx-auto px-3 sm:px-6 py-6 sm:py-10'}>
      {/* ── Design premium: fundo fixo cobre o viewport inteiro ── */}
      {isDesignPremium && (
        <>
          <div className="fixed inset-0" style={{ zIndex: -2 }}>
            {dpEffectivePhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dpEffectivePhoto} alt="" className="w-full h-full object-cover object-center" />
            )}
          </div>
          <div className="fixed inset-0" style={{
            zIndex: -1,
            background: dpEffectivePhoto
              ? 'linear-gradient(to right, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.88) 28%, rgba(10,8,6,0.55) 55%, rgba(10,8,6,0.10) 80%, transparent 100%)'
              : 'rgba(10,8,6,0.96)',
          }} />
        </>
      )}
      <div className={`flex items-center justify-end gap-2 flex-wrap z-30 ${isSobreViewMode ? 'fixed top-4 right-4' : 'mb-8'}`}>
        <div className="flex items-center gap-2">
          {isAdmin && !editing && !editingPhotos && (
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all">
              <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? 'A atualizar...' : 'Atualizar'}
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && hasImages && (
            <button onClick={() => setEditingPhotos(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Fotos
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && isGuiaPage && (
            <button onClick={() => { setParceirosForm(parceiros.length > 0 ? parceiros : []); setEditingParceiros(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Parceiros
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && (() => {
            const calloutCards = findCalloutCards(blocks)
            return calloutCards.length > 0 && (
              <button onClick={() => { setCalloutLinksForm({ ...(calloutLinks[id as string] ?? {}) }); setFotosVerMaisUrlForm(guiaLinks.fotosVerMaisUrl ?? ''); setEditingCalloutLinks(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Links
              </button>
            )
          })()}
          {isAdmin && !editing && !editingPhotos && !loading && !error && isPreWeddingPage && (
            <button onClick={() => { setPreWeddingForm(preWeddingSlots.map(s => ({...s}))); setEditingPreWedding(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Agenda
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && (
            <button onClick={handlePublicar} disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-400/70 hover:text-emerald-400 border border-emerald-400/20 hover:border-emerald-400/40 transition-all disabled:opacity-40">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"/>
              </svg>
              {published ? '✓ Publicado' : publishing ? 'A publicar...' : 'Publicar'}
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && !isSobrePage && (
            <button onClick={handleToggleDesignPremium}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${isDesignPremium ? 'text-amber-300 border-amber-300/40 bg-amber-300/10' : 'text-white/30 border-white/10 hover:text-amber-300/70 hover:border-amber-300/30'}`}>
              ◆ Premium
            </button>
          )}
          {isAdmin && !editing && !editingPhotos && !loading && !error && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 transition-all">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ✎ Editar
            </button>
          )}
        </div>
      </div>

      {!isSobreViewMode && <header className="mb-8">
        {editingTitle ? (
          <div className="flex flex-col gap-3 max-w-sm">
            <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
            <input
              autoFocus
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
              className="bg-white/[0.06] border border-gold/30 rounded-lg px-3 py-2 text-sm text-white tracking-widest uppercase outline-none focus:border-gold/60"
              placeholder={title}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveTitle} disabled={savingTitle}
                className="px-4 py-1.5 rounded-lg text-xs bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-all disabled:opacity-50">
                {savingTitle ? 'A guardar...' : 'Guardar'}
              </button>
              <button onClick={() => setEditingTitle(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-white/40 border border-white/10 hover:border-white/20 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        ) : (() => {
          // 'none' sentinel = user explicitly cleared the photo
          const perPage = id ? pageHeaders[id as string] : undefined
          const effectiveHeader = perPage === 'none' ? '' : (perPage || subpageHeaderUrl || portalHeroImageUrl)
          // SOBRE O MENU uses the photo in the content area — skip banner here
          if (isDesignPremium) {
            return (
              <>
                {/* ‹ Voltar — fixed top-left */}
                <Link href={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : '/portal-cliente'}
                  className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/40 hover:text-gold transition-colors uppercase">
                  ‹ Voltar
                </Link>
                {/* Title block — fluxo normal, conteúdo rola abaixo */}
                <div className="mb-8 pt-10">
                  <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-3">RL PHOTO.VIDEO</p>
                  <h1 className="font-cormorant font-light uppercase text-gold mb-3"
                    style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)', letterSpacing: '0.18em', lineHeight: 1.1 }}>
                    {title || '...'}
                  </h1>
                  <div className="w-10 h-px bg-gold/50" />
                  {/* Admin: trocar foto de fundo */}
                  {isAdmin && (
                    <div className="mt-4 flex items-center gap-2">
                      {dpEffectivePhoto && (
                        <button onClick={handleRemovePageHeader} disabled={uploadingPageHeader}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/50 border border-red-400/30 text-red-400/50 text-xs hover:text-red-400 transition-colors backdrop-blur-sm">
                          ✕ Remover foto
                        </button>
                      )}
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white/40 text-[11px] hover:text-white/70 transition-colors cursor-pointer backdrop-blur-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        {uploadingPageHeader ? 'A carregar...' : dpEffectivePhoto ? '+ Trocar foto' : '+ Foto de fundo'}
                        <input type="file" accept="image/*" className="hidden" disabled={uploadingPageHeader}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPageHeader(f) }} />
                      </label>
                    </div>
                  )}
                </div>
              </>
            )
          }
          return effectiveHeader && !isSobrePage ? (
          <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectiveHeader} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 flex items-end gap-3">
              <div>
                <p className="text-[10px] tracking-[0.4em] text-white/50 uppercase mb-1">RL PHOTO.VIDEO</p>
                <h1 className="font-cormorant font-light text-2xl sm:text-3xl tracking-[0.2em] text-white uppercase drop-shadow-lg">
                  {title || '...'}
                </h1>
              </div>
              {isAdmin && (
                <button onClick={() => { setTitleInput(title); setEditingTitle(true) }}
                  className="mb-1 text-white/30 hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Admin photo controls — always visible */}
            {isAdmin && (
              <div className="absolute top-3 right-3 flex gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/25 text-white/75 text-xs hover:text-white transition-colors">
                    {uploadingPageHeader ? 'A carregar...' : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Trocar
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingPageHeader}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPageHeader(f) }} />
                </label>
                <button
                  onClick={handleRemovePageHeader}
                  disabled={uploadingPageHeader}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/70 border border-red-400/30 text-red-400/60 text-xs hover:text-red-400 hover:border-red-400/60 transition-colors disabled:opacity-40">
                  ✕ Remover
                </button>
              </div>
            )}
          </div>
          ) : (
          <>
            <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
            <div className="flex items-center gap-2">
              <h1 className="font-cormorant font-light text-xl sm:text-2xl tracking-[0.2em] text-gold uppercase">
                {title || '...'}
              </h1>
              {isAdmin && (
                <button onClick={() => { setTitleInput(title); setEditingTitle(true) }}
                  className="text-white/20 hover:text-gold/60 transition-colors mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-3 h-px w-16 bg-gold/40" />
            {/* Admin: add header photo */}
            {isAdmin && (
              <label className="mt-3 inline-flex items-center gap-1.5 cursor-pointer text-[10px] text-white/25 hover:text-white/50 border border-dashed border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {uploadingPageHeader ? 'A carregar...' : '+ Foto de cabeçalho'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingPageHeader}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPageHeader(f) }} />
              </label>
            )}
          </>
          )
        })()}
      </header>}

      {loading && <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>}
      {error   && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}
      {!loading && !error && (
        <div className={
          isSobrePage && !editing && !editingPhotos && !editingParceiros && !editingBriefing && !editingCalloutLinks && !editingPreWedding
            ? ''
            : isDesignPremium
              ? 'bg-black/60 border border-white/[0.08] rounded-2xl p-5 sm:p-8 backdrop-blur-sm'
              : 'bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-8'
        }>
          {editingPhotos
            ? <ImageEditor blocks={blocks} pageId={id!} onBlocksUpdated={setBlocks} onDone={handlePhotosDone} />
            : editingParceiros
              ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Gerir Parceiros</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingParceiros(false)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                        Cancelar
                      </button>
                      <button
                        disabled={savingParceiros}
                        onClick={async () => {
                          setSavingParceiros(true)
                          try {
                            const newSettings = { ...portalSettingsObj, parceiros: parceirosForm }
                            await savePortalSettings(newSettings)
                            setPortalSettingsObj(newSettings)
                            setParceiros(parceirosForm)
                            setEditingParceiros(false)
                          } finally { setSavingParceiros(false) }
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                        {savingParceiros ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  {parceirosForm.map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 tracking-widest uppercase">Parceiro {i+1}</span>
                        <button onClick={() => setParceirosForm(prev => prev.filter((_,j) => j!==i))}
                          className="text-white/20 hover:text-red-400 transition-colors text-sm">✕ Remover</button>
                      </div>
                      {/* Image upload */}
                      <div>
                        {p.imageUrl
                          ? (
                            <div className="relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imageUrl} alt="" className="w-full max-h-40 object-contain rounded-xl bg-white/[0.03]" />
                              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                                <span className="text-xs text-white font-semibold tracking-widest">TROCAR FOTO</span>
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={async e => {
                                    const file = e.target.files?.[0]; if (!file) return
                                    setParceirosForm(prev => { const a=[...prev]; a[i]={...a[i],imageUrl:'uploading'}; return a })
                                    const fd = new FormData(); fd.append('file', file)
                                    const res = await fetch('/api/upload-image', { method:'POST', body: fd }).then(r => r.json())
                                    if (res.url) setParceirosForm(prev => { const a=[...prev]; a[i]={...a[i],imageUrl:res.url}; return a })
                                  }}
                                />
                              </label>
                              {p.imageUrl === 'uploading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                                  <span className="text-xs text-white/60 animate-pulse">A carregar...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border border-dashed border-white/10 hover:border-gold/30 bg-white/[0.02] cursor-pointer transition-all group">
                              <svg className="w-6 h-6 text-white/20 group-hover:text-gold/40 mb-1 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              <span className="text-[10px] text-white/20 group-hover:text-gold/40 tracking-widest transition-colors">CARREGAR FOTO</span>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={async e => {
                                  const file = e.target.files?.[0]; if (!file) return
                                  setParceirosForm(prev => { const a=[...prev]; a[i]={...a[i],imageUrl:'uploading'}; return a })
                                  const fd = new FormData(); fd.append('file', file)
                                  const res = await fetch('/api/upload-image', { method:'POST', body: fd }).then(r => r.json())
                                  if (res.url) setParceirosForm(prev => { const a=[...prev]; a[i]={...a[i],imageUrl:res.url}; return a })
                                }}
                              />
                            </label>
                          )
                        }
                      </div>
                      {/* URL do site */}
                      <input
                        value={p.url ?? ''}
                        onChange={e => setParceirosForm(prev => { const a=[...prev]; a[i]={...a[i],url:e.target.value}; return a })}
                        placeholder="URL do site do parceiro (https://...)"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setParceirosForm(prev => [...prev, { imageUrl: '', url: '' }])}
                    className="w-full py-3 rounded-xl border border-dashed border-gold/20 text-gold/40 hover:text-gold/70 hover:border-gold/40 text-xs tracking-widest transition-all">
                    + ADICIONAR PARCEIRO
                  </button>
                </div>
              )
            : editingBriefing
              ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Secções do Briefing</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingBriefing(false)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                        Cancelar
                      </button>
                      <button onClick={handleSaveBriefing} disabled={savingBriefing}
                        className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                        {savingBriefing ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 tracking-wide">Cola o URL da sub-página do portal ou link externo para cada secção.</p>
                  {(['NOIVO', 'NOIVA', 'CERIMÓNIA', 'QUINTA'] as const).map(section => (
                    <div key={section} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                      <label className="block text-[10px] text-white/40 tracking-widest uppercase">{section}</label>
                      <input
                        value={briefingForm[section] ?? ''}
                        onChange={e => setBriefingForm(prev => ({ ...prev, [section]: e.target.value }))}
                        placeholder="https://... ou /portal-cliente/..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
                      />
                    </div>
                  ))}
                </div>
              )
            : editingCalloutLinks
              ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Gerir Links dos Cards</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingCalloutLinks(false)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                        Cancelar
                      </button>
                      <button onClick={handleSaveCalloutLinks} disabled={savingCalloutLinks}
                        className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                        {savingCalloutLinks ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  {findCalloutCards(blocks).map(callout => {
                    const cardTitle = plainText(callout.callout?.rich_text ?? []).trim()
                    return (
                      <div key={cardTitle} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                        <label className="block text-[10px] text-white/40 tracking-widest uppercase">{cardTitle}</label>
                        <input
                          value={calloutLinksForm[cardTitle] ?? ''}
                          onChange={e => setCalloutLinksForm(prev => ({ ...prev, [cardTitle]: e.target.value }))}
                          placeholder="https://..."
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
                        />
                      </div>
                    )
                  })}
                </div>
              )
            : editingPreWedding
              ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Gerir Disponibilidade Pré-Wedding</span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPreWedding(false)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                        Cancelar
                      </button>
                      <button
                        disabled={savingSlots}
                        onClick={async () => {
                          setSavingSlots(true)
                          try {
                            const newSettings = { ...portalSettingsObj, preWeddingSlots: preWeddingForm }
                            await savePortalSettings(newSettings)
                            setPortalSettingsObj(newSettings)
                            setPreWeddingSlots(preWeddingForm)
                            setEditingPreWedding(false)
                          } finally { setSavingSlots(false) }
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                        {savingSlots ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 tracking-wide mb-4">Adiciona os dias e horários que disponibilizas para o pré-wedding. Apenas tu vês este painel.</p>
                  {preWeddingForm.map((slot, i) => (
                    <div key={slot.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 tracking-widest uppercase">Slot {i+1}</span>
                        <button onClick={() => setPreWeddingForm(prev => prev.filter(s => s.id !== slot.id))}
                          className="text-white/20 hover:text-red-400 transition-colors text-sm">✕ Remover</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Data</label>
                          <input type="date"
                            value={slot.date}
                            onChange={e => setPreWeddingForm(prev => prev.map(s => s.id===slot.id ? {...s, date: e.target.value} : s))}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Hora</label>
                          <input type="time"
                            value={slot.time}
                            onChange={e => setPreWeddingForm(prev => prev.map(s => s.id===slot.id ? {...s, time: e.target.value} : s))}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Local</label>
                          <input type="text"
                            value={slot.local}
                            onChange={e => setPreWeddingForm(prev => prev.map(s => s.id===slot.id ? {...s, local: e.target.value} : s))}
                            placeholder="ex: Sintra"
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setPreWeddingForm(prev => [...prev, { id: `slot-${Date.now()}`, date: '', time: '', local: '' }])}
                    className="w-full py-3 rounded-xl border border-dashed border-gold/20 text-gold/40 hover:text-gold/70 hover:border-gold/40 text-xs tracking-widest transition-all">
                    + ADICIONAR SLOT
                  </button>
                </div>
              )
            : editing && id
              ? <BlockEditor blocks={blocks} pageId={id} settings={settings} settingsBlockId={settingsBlockId} onSaved={handleSaved} />
              : (
                <>
                  {!isSobrePage && !isDesignPremium && (
                  <div className="mb-6">
                    <Link href={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : '/portal-cliente'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all text-sm tracking-wide">
                      ‹ Voltar
                    </Link>
                  </div>
                  )}
                  {(() => {
                    if (isContratoPage && eventoData) {
                      return <ContratoPropostaSection evento={eventoData} blocks={blocks} settings={settings} contratoDisponivel={contratoDisponivel} contratoUrl={contratoUrl} portalRef={portalRef} pagamentos={pagamentos} loadPagamentos={loadPagamentos} pagRefreshing={pagRefreshing} />
                    }
                    if (isContratoPage) {
                      // No evento linked yet — show status banner + blocks
                      return (
                        <>
                          {!contratoDisponivel && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border bg-white/[0.02] border-white/[0.08]">
                              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-white/20" />
                              <p className="text-xs font-semibold tracking-wider text-white/30">CONTRATO INDISPONÍVEL</p>
                            </div>
                          )}
                          {contratoDisponivel && contratoUrl && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                  <p className="text-xs font-semibold tracking-wider text-green-400">CONTRATO DISPONÍVEL</p>
                                </div>
                                <a href={`${contratoUrl}?readonly=1`} target="_blank" rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/50 text-[10px] hover:text-white/80 transition-all">
                                  Abrir em nova aba ↗
                                </a>
                              </div>
                              <iframe
                                src={`${contratoUrl}?readonly=1`}
                                className="w-full rounded-xl border border-white/10"
                                style={{ height: '80vh', minHeight: '600px' }}
                                title="Contrato de Prestação de Serviços"
                              />
                            </div>
                          )}
                          <NotionBlocks blocks={blocks.filter(b => b.type !== 'image')} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                        </>
                      )
                    }
                    if (isCronogramaPage) {
                      const backUrlCron = fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined
                      return (
                        <div className="space-y-2">
                          {blocks.map((b) => {
                            if (b.type !== 'callout') {
                              return (
                                <div key={b.id}>
                                  <NotionBlocks blocks={[b]} hiddenNav={settings.hiddenNav} backUrl={backUrlCron} neutralCallout />
                                </div>
                              )
                            }
                            const done = !!cronogramaStatus[b.id]
                            return (
                              <div key={b.id} className="relative rounded-2xl overflow-hidden transition-all duration-300"
                                style={done ? {
                                  border: '1px solid rgba(74,222,128,0.5)',
                                  boxShadow: '0 0 18px 4px rgba(74,222,128,0.2), 0 0 6px 1px rgba(74,222,128,0.3), inset 0 0 20px 0 rgba(74,222,128,0.06)',
                                  background: 'rgba(0,0,0,0.95)',
                                } : {
                                  border: '1px solid rgba(239,68,68,0.45)',
                                  boxShadow: '0 0 18px 4px rgba(239,68,68,0.15), 0 0 6px 1px rgba(239,68,68,0.25), inset 0 0 20px 0 rgba(239,68,68,0.04)',
                                  background: 'rgba(0,0,0,0.95)',
                                }}>
                                <div className="pr-28">
                                  <NotionBlocks blocks={[b]} hiddenNav={settings.hiddenNav} backUrl={backUrlCron} neutralCallout />
                                </div>
                                <button
                                  onClick={() => toggleCronogramaSection(b.id)}
                                  className={`absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${
                                    done
                                      ? 'border border-green-400/50 text-green-400 bg-green-400/10 hover:bg-green-400/20'
                                      : 'border border-red-500/40 text-red-400/70 bg-red-500/5 hover:bg-red-500/15'
                                  }`}>
                                  {done
                                    ? <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Concluído</>
                                    : <>○ Pendente</>
                                  }
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    if (isSatisfacaoPage) {
                      const backUrlSat = fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined
                      const firstImgIdx = blocks.findIndex(b => b.type === 'image')
                      const textBlocks = firstImgIdx !== -1 ? blocks.slice(0, firstImgIdx) : blocks
                      const afterTextBlocks = firstImgIdx !== -1 ? blocks.slice(firstImgIdx) : []
                      return (
                        <>
                          <NotionBlocks blocks={textBlocks} hiddenNav={settings.hiddenNav} backUrl={backUrlSat} />
                          {/* ── Satisfação ── */}
                          {(satisfacao || enviadoSat) ? (
                            /* Já submetido */
                            <div className="mt-6 rounded-xl border border-emerald-400/30 bg-black overflow-hidden"
                              style={{ boxShadow: '0 0 18px 2px rgba(52,211,153,0.08), inset 0 0 16px 0 rgba(52,211,153,0.03)' }}>
                              <div className="px-6 py-6 flex flex-col items-center text-center gap-4">
                                <span className="text-emerald-400/70 text-2xl">✓</span>
                                <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-emerald-400/70">Obrigado pelo teu feedback</p>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(i => (
                                    <span key={i} className="text-2xl leading-none select-none"
                                      style={{ color: i <= (satisfacao?.nota ?? notaSat) ? '#f59e0b' : 'rgba(255,255,255,0.10)' }}>★</span>
                                  ))}
                                </div>
                                {(satisfacao?.nota ?? notaSat) > 0 && (
                                  <p className="text-[10px] tracking-[0.3em] text-amber-400/60 uppercase -mt-1">
                                    {SAT_LABELS[satisfacao?.nota ?? notaSat]}
                                  </p>
                                )}
                                {(satisfacao?.comentario || (enviadoSat && comentarioSat.trim())) && (
                                  <div className="border border-white/10 bg-white/[0.02] rounded-lg px-5 py-4 max-w-sm w-full text-left">
                                    <p className="text-[9px] tracking-[0.35em] uppercase text-white/25 mb-2">Comentário</p>
                                    <p className="text-[13px] font-light text-white/50 leading-relaxed italic">
                                      &ldquo;{satisfacao?.comentario || comentarioSat.trim()}&rdquo;
                                    </p>
                                  </div>
                                )}
                                <p className="text-[11px] text-white/25 font-light">A tua avaliação foi registada. Obrigado pela confiança.</p>
                              </div>
                            </div>
                          ) : (
                            /* Formulário */
                            <div className="mt-6 rounded-xl border border-white/40 bg-black overflow-hidden"
                              style={{ boxShadow: '0 0 14px 3px rgba(255,255,255,0.12), inset 0 0 16px 0 rgba(255,255,255,0.03)' }}>
                              <div className="px-6 py-6 flex flex-col items-center gap-6">
                                <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/70 self-start">Dar Satisfação</p>

                                {/* Estrelas */}
                                <div className="flex flex-col items-center gap-2">
                                  <p className="text-[9px] tracking-[0.4em] uppercase text-white/30">Classificação</p>
                                  <div className="flex gap-1.5">
                                    {[1,2,3,4,5].map(i => (
                                      <button key={i}
                                        onClick={() => setNotaSat(i)}
                                        onMouseEnter={() => setHoverNotaSat(i)}
                                        onMouseLeave={() => setHoverNotaSat(0)}
                                        className="text-4xl leading-none transition-all duration-100"
                                        style={{ color: i <= (hoverNotaSat || notaSat) ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}
                                      >★</button>
                                    ))}
                                  </div>
                                  <p className={`text-[10px] tracking-[0.3em] uppercase transition-all duration-150 ${
                                    (hoverNotaSat || notaSat) > 0 ? 'text-amber-400/60 opacity-100' : 'opacity-0'
                                  }`}>
                                    {SAT_LABELS[hoverNotaSat || notaSat] ?? ''}
                                  </p>
                                </div>

                                {/* Comentário */}
                                <div className="w-full max-w-md">
                                  <p className="text-[9px] tracking-[0.4em] uppercase text-white/30 mb-2">
                                    Comentário <span className="normal-case tracking-normal text-white/15">(opcional)</span>
                                  </p>
                                  <textarea
                                    value={comentarioSat}
                                    onChange={e => setComentarioSat(e.target.value)}
                                    placeholder="Partilha a tua experiência..."
                                    rows={4}
                                    className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-4 py-3
                                               text-[13px] font-light text-white/60 placeholder:text-white/15
                                               focus:outline-none focus:border-white/25 resize-none leading-relaxed transition-colors"
                                  />
                                </div>

                                {erroSat && (
                                  <p className="text-[11px] text-red-400/70 -mt-2">⚠ {erroSat}</p>
                                )}

                                <button
                                  onClick={submeterSatisfacao}
                                  disabled={enviandoSat || notaSat === 0}
                                  className="rounded-lg border border-white/30 bg-white/[0.05] hover:bg-white/[0.12]
                                             px-10 py-3 text-[9px] tracking-[0.45em] text-white/70 hover:text-white
                                             uppercase transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                  style={{ boxShadow: notaSat > 0 ? '0 0 16px rgba(255,255,255,0.07)' : 'none' }}
                                >
                                  {enviandoSat ? '⏳ A enviar...' : 'Submeter Avaliação'}
                                </button>
                              </div>
                            </div>
                          )}
                          {afterTextBlocks.length > 0 && (
                            <NotionBlocks blocks={afterTextBlocks} hiddenNav={settings.hiddenNav} backUrl={backUrlSat} />
                          )}
                        </>
                      )
                    }
                    if (isPreWeddingPage) {
                      return (
                        <PreWeddingSection
                          slots={preWeddingSlots}
                          reservedSlotId={reservedSlotId}
                          reservingSlotId={reservingSlotId}
                          showReservedWarning={showReservedWarning}
                          blocks={blocks}
                          settings={settings}
                          sendingNotifNoivos={sendingNotifNoivos}
                          notifNoivosEnviado={notifNoivosEnviado}
                          onNotificarNoivos={async () => {
                            setSendingNotifNoivos(true)
                            try {
                              await fetch('/api/portal-notif-prewedding', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ emailNoiva: portalSettingsObj.emailNoiva ?? null, referencia: refParam ?? portalSettingsObj.referencia ?? null }),
                              })
                              setNotifNoivosEnviado(true)
                              setTimeout(() => setNotifNoivosEnviado(false), 5000)
                            } catch (e) { console.error('[notif-noivos]', e) }
                            setSendingNotifNoivos(false)
                          }}
                          onReserve={async (slotId) => {
                            if (reservedSlotId) { setShowReservedWarning(true); setTimeout(() => setShowReservedWarning(false), 4000); return }
                            setReservingSlotId(slotId)
                            try {
                              const newSettings = { ...portalSettingsObj, preWeddingReservedSlotId: slotId, preWeddingReservedAt: new Date().toISOString() }
                              await savePortalSettings(newSettings)
                              setReservedSlotId(slotId)
                              // Notificação ao admin
                              const slot = preWeddingSlots.find(s => s.id === slotId)
                              const nomeNoivos = portalSettingsObj.noiva && portalSettingsObj.noivo
                                ? `${portalSettingsObj.noiva} & ${portalSettingsObj.noivo}`
                                : portalSettingsObj.noiva ?? portalSettingsObj.noivo ?? refParam ?? 'Noivos'
                              fetch('/api/send-admin-notification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  tipo: 'prewedding_reserva',
                                  nome_noivos: nomeNoivos,
                                  referencia: refParam ?? portalSettingsObj.referencia ?? null,
                                  data_evento: slot?.date ?? null,
                                  local: slot ? `${slot.time}${slot.local ? ' · ' + slot.local : ''}` : null,
                                  email_noiva: portalSettingsObj.emailNoiva ?? null,
                                }),
                              }).catch(() => {})
                            } finally { setReservingSlotId(null) }
                          }}
                        />
                      )
                    }
                    if (isBriefingPage) {
                      const childPages = blocks.filter(b => b.type === 'child_page')
                      // Find range of "Acesso" section to hide from site
                      const allOther = blocks.filter(b => b.type !== 'child_page')
                      const aceIdx = allOther.findIndex(b =>
                        ['heading_1','heading_2','heading_3','paragraph'].includes(b.type) &&
                        plainText(b[b.type]?.rich_text ?? []).toUpperCase().includes('ACESSO')
                      )
                      const aceEnd = aceIdx !== -1
                        ? (() => {
                            let i = aceIdx + 1
                            while (i < allOther.length && (allOther[i].type === 'callout' || allOther[i].type === 'paragraph')) i++
                            return i
                          })()
                        : -1
                      // Em modo equipa (freelancer, ?freelancer=1) mostra-se TUDO,
                      // incluindo a secção "ACESSO" que normalmente é escondida do
                      // portal dos noivos — é a informação que só a equipa deve ver.
                      const aceHidden = new Set(
                        isFreelancerView ? [] : (aceIdx !== -1 ? allOther.slice(aceIdx, aceEnd).map(b => b.id) : [])
                      )
                      const otherBlocks = allOther.filter(b =>
                        !aceHidden.has(b.id) &&
                        !(b.type === 'callout' && (b.children ?? []).some((c: Block) => c.type === 'image')) &&
                        !(b.type === 'column_list' && (b.children ?? []).some((col: Block) =>
                          (col.children ?? []).some((c: Block) => c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image'))
                        ))
                      )
                      // Mapeia título do card → ícone + descrição (fallback genérico se outro título)
                      const CARD_META: Record<string, { icon: string; desc: string }> = {
                        'NOIVO':     { icon: '♂', desc: 'Detalhes do noivo · contactos e logística' },
                        'NOIVA':     { icon: '♀', desc: 'Detalhes da noiva · contactos e logística' },
                        'CERIMÓNIA': { icon: '✦', desc: 'Local, horário e detalhes da cerimónia' },
                        'CERIMONIA': { icon: '✦', desc: 'Local, horário e detalhes da cerimónia' },
                        'QUINTA':    { icon: '◇', desc: 'Recinto, copo-de-água e espaços' },
                        'FESTA':     { icon: '◈', desc: 'Música, ambiente e momentos especiais' },
                      }
                      const cardsGrid = childPages.length > 0 && (
                        <div className="mt-8">
                          <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
                            <div>
                              <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase mb-1.5">Briefing por Área</p>
                              <h3 className="text-xl text-white font-light tracking-tight" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                                Fichas <span className="italic text-gold/80">individuais</span>
                              </h3>
                            </div>
                            <span className="text-[10px] tracking-widest text-white/30 uppercase">
                              {childPages.filter(cp => {
                                const k = (cp.child_page?.title ?? '').toUpperCase().trim()
                                return k !== 'CERIMÓNIA' && k !== 'CERIMONIA' && k !== 'QUINTA'
                              }).length} secções
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {childPages
                              .filter(cp => {
                                const k = (cp.child_page?.title ?? '').toUpperCase().trim()
                                return k !== 'CERIMÓNIA' && k !== 'CERIMONIA' && k !== 'QUINTA'
                              })
                              .map(cp => {
                              const pageTitle = cp.child_page?.title ?? ''
                              const key = pageTitle.toUpperCase().trim()
                              const meta = CARD_META[key] ?? { icon: '◆', desc: 'Aceder a esta secção do briefing' }
                              const isOpen = openFichaKey === key
                              // Default fields se ainda não houver
                              const defaultCampos: FichaCampo[] = [
                                { id: 'nome',    label: 'Nome',     value: '' },
                                { id: 'contato', label: 'Contacto', value: '' },
                              ]
                              const campos = briefingFichas[key] ?? defaultCampos

                              const updateCampo = (idx: number, field: 'label' | 'value', val: string) => {
                                setBriefingFichas(prev => ({
                                  ...prev,
                                  [key]: (prev[key] ?? defaultCampos).map((c, i) =>
                                    i === idx ? { ...c, [field]: val } : c
                                  ),
                                }))
                              }
                              const addCampo = () => {
                                const newCampo: FichaCampo = {
                                  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                  label: 'Novo campo',
                                  value: '',
                                }
                                setBriefingFichas(prev => ({
                                  ...prev,
                                  [key]: [...(prev[key] ?? defaultCampos), newCampo],
                                }))
                              }
                              const removeCampo = (idx: number) => {
                                setBriefingFichas(prev => ({
                                  ...prev,
                                  [key]: (prev[key] ?? defaultCampos).filter((_, i) => i !== idx),
                                }))
                              }
                              const saveFicha = async () => {
                                setFichaSaving(true)
                                try {
                                  const newSettings = { ...portalSettingsObj, briefingFichas }
                                  await savePortalSettings(newSettings)
                                  setPortalSettingsObj(newSettings)
                                } finally { setFichaSaving(false) }
                              }

                              return (
                                <div key={cp.id} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.025] to-transparent overflow-hidden transition-all duration-300"
                                  style={{ boxShadow: '0 12px 30px -16px rgba(0,0,0,0.5)' }}>
                                  {/* Header da ficha (clicável) */}
                                  <button
                                    type="button"
                                    onClick={() => setOpenFichaKey(prev => prev === key ? null : key)}
                                    className="w-full text-left relative group px-5 py-5 hover:bg-gold/[0.04] transition-all"
                                  >
                                    <span className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                      style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
                                    <div className="relative flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl border border-gold/30 bg-gold/[0.06] flex items-center justify-center text-gold text-lg shrink-0 group-hover:bg-gold/[0.12] group-hover:border-gold/50 transition-all"
                                        style={{ boxShadow: '0 0 14px -6px rgba(201,164,92,0.5)' }}>
                                        {meta.icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] tracking-[0.35em] text-gold/65 uppercase mb-1.5 group-hover:text-gold/85 transition-colors">{pageTitle}</p>
                                        <p className="text-[12px] text-white/55 leading-relaxed">{meta.desc}</p>
                                      </div>
                                      <span className={`text-gold/60 text-xl transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                                    </div>
                                  </button>

                                  {/* Painel expansível com formulário */}
                                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                      <div className="px-5 pb-5 pt-2 border-t border-white/[0.06]">
                                        <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-4">Caixas de Texto</p>
                                        <div className="flex flex-col gap-3">
                                          {campos.map((campo, idx) => (
                                            <div key={campo.id} className="flex flex-col sm:flex-row gap-2 items-start group/row">
                                              {/* Label */}
                                              <input
                                                value={campo.label}
                                                onChange={e => updateCampo(idx, 'label', e.target.value)}
                                                placeholder="Etiqueta"
                                                className="sm:w-44 shrink-0 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[11px] tracking-[0.18em] uppercase text-gold/80 placeholder:text-white/20 focus:outline-none focus:border-gold/50 transition-colors font-semibold"
                                              />
                                              {/* Value */}
                                              <input
                                                value={campo.value}
                                                onChange={e => updateCampo(idx, 'value', e.target.value)}
                                                placeholder="Conteúdo"
                                                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/85 placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors"
                                              />
                                              {/* Remover */}
                                              {isAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={() => removeCampo(idx)}
                                                  title="Remover este campo"
                                                  className="opacity-0 group-hover/row:opacity-100 w-9 h-9 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all flex items-center justify-center"
                                                >
                                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          ))}

                                          {/* Botão Adicionar */}
                                          <button
                                            type="button"
                                            onClick={addCampo}
                                            className="mt-1 self-start inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] tracking-[0.25em] uppercase font-bold text-gold/85 border border-dashed border-gold/35 hover:border-gold/65 hover:bg-gold/[0.06] transition-all"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                              <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            Adicionar Caixa de Texto
                                          </button>
                                        </div>

                                        {/* Footer com Guardar */}
                                        <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between gap-3">
                                          <span className="text-[10px] text-white/30 italic">
                                            {campos.length} caixa{campos.length === 1 ? '' : 's'} · guarda para persistir
                                          </span>
                                          <button
                                            type="button"
                                            onClick={saveFicha}
                                            disabled={fichaSaving}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.22em] uppercase font-bold text-black bg-gold hover:brightness-110 transition-all disabled:opacity-50"
                                            style={{ boxShadow: '0 0 18px -8px rgba(201,164,92,0.55)' }}
                                          >
                                            {fichaSaving ? 'A guardar…' : '✓ Guardar Ficha'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                      return (
                        <>
                          {(() => {
                            const ROLES = ['Fotógrafo', 'Videógrafo', 'Assistente', 'Editor']
                            const equipaBI = briefingInfo[id as string] ?? {}
                            const equipa = equipaBI.equipa ?? []
                            const ROLE_ICONS: Record<string, string> = {
                              'Fotógrafo':  '◉',
                              'Videógrafo': '▶',
                              'Assistente': '◇',
                              'Editor':     '✎',
                            }
                            const equipaBox = (
                              <div className="mb-6 rounded-2xl border border-white/[0.08] overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.45), rgba(11,11,11,0.55))', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)' }}>
                                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.05]">
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg border border-gold/35 bg-gold/[0.08] flex items-center justify-center text-gold text-sm">⌘</span>
                                    <div>
                                      <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase">Equipa Atribuída</p>
                                      <p className="text-[11px] text-white/40 mt-0.5">{equipa.length > 0 ? `${equipa.length} profissional${equipa.length === 1 ? '' : 'is'}` : 'Define os profissionais deste evento'}</p>
                                    </div>
                                  </div>
                                  {!editingEquipa && (
                                    <button onClick={() => { setEquipaForm(equipa.length ? equipa.map(e => ({ ...e })) : [{ role: 'Fotógrafo', name: '' }]); setEditingEquipa(true) }}
                                      className="px-2.5 py-1.5 rounded-md text-[9px] tracking-[0.25em] uppercase font-bold border border-gold/30 bg-gold/[0.06] text-gold/85 hover:bg-gold/15 hover:border-gold/55 transition-all flex items-center gap-1.5">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                      </svg>
                                      Editar
                                    </button>
                                  )}
                                </div>
                                <div className="px-5 py-4">
                                  {editingEquipa ? (
                                    <div className="space-y-2">
                                      {equipaForm.map((member, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                          <select value={member.role}
                                            onChange={e => setEquipaForm(f => f.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-2.5 text-[12px] text-white/85 outline-none focus:border-gold/50 transition-colors shrink-0 [color-scheme:dark]">
                                            {ROLES.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
                                          </select>
                                          <input type="text" value={member.name}
                                            onChange={e => setEquipaForm(f => f.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                            placeholder="Nome do profissional"
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold/50 transition-colors placeholder:text-white/20" />
                                          <button onClick={() => setEquipaForm(f => f.filter((_, i) => i !== idx))}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all shrink-0">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                          </button>
                                        </div>
                                      ))}
                                      <button onClick={() => setEquipaForm(f => [...f, { role: 'Fotógrafo', name: '' }])}
                                        className="w-full py-2.5 rounded-xl border border-dashed border-gold/25 text-gold/60 hover:text-gold hover:border-gold/50 hover:bg-gold/[0.04] text-[11px] tracking-[0.3em] uppercase font-bold transition-all">
                                        + Adicionar Membro
                                      </button>
                                      <div className="flex gap-2 pt-1.5">
                                        <button onClick={handleSaveEquipa} disabled={savingEquipa}
                                          className="flex-1 py-2.5 rounded-xl bg-gold text-black font-bold text-[11px] tracking-[0.25em] uppercase hover:bg-gold/90 transition-all disabled:opacity-50"
                                          style={!savingEquipa ? { boxShadow: '0 0 14px -4px rgba(201,164,92,0.55)' } : undefined}>
                                          {savingEquipa ? 'A guardar…' : '✓ Guardar'}
                                        </button>
                                        <button onClick={() => setEditingEquipa(false)}
                                          className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/60 text-[11px] tracking-[0.25em] uppercase font-bold hover:bg-white/[0.04] hover:text-white/85 transition-all">
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : equipa.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {equipa.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-gold/25 hover:bg-gold/[0.03] transition-colors">
                                          <span className="w-9 h-9 rounded-lg border border-gold/30 bg-gold/[0.06] flex items-center justify-center text-gold text-base shrink-0">
                                            {ROLE_ICONS[member.role] ?? '◆'}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[9px] tracking-[0.3em] text-gold/60 uppercase mb-0.5">{member.role}</p>
                                            <p className="text-[13px] text-white/85 font-medium truncate">{member.name || <span className="text-white/25 italic text-[12px]">Sem nome</span>}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-6">
                                      <span className="text-3xl opacity-15 block mb-2">⌘</span>
                                      <p className="text-[12px] text-white/35 italic">Sem equipa definida.</p>
                                      <p className="text-[10px] text-white/25 mt-1">Clica em <span className="text-gold/65 font-medium">Editar</span> para adicionar membros.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                            // (Hero antigo removido — o BriefingExtensions tem agora um hero próprio mais rico.)
                            const briefingGeralIdx = otherBlocks.findIndex(b =>
                              ['heading_1','heading_2','heading_3'].includes(b.type) &&
                              plainText(b[b.type]?.rich_text ?? []).toUpperCase().includes('BRIEFING GERAL')
                            )
                            // Slot do botão Enviar Briefing (versão compacta, sem hero — o hero é gerado pelo BriefingExtensions)
                            const enviarBtnSlot = (portalRef || refParam) ? (
                              <button
                                onClick={handleEnviarBriefing}
                                disabled={sendingBriefing || briefingSent}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-[0.25em] uppercase transition-all ${
                                  briefingSent
                                    ? 'bg-emerald-500/15 border border-emerald-500/45 text-emerald-300 cursor-default'
                                    : sendingBriefing
                                      ? 'bg-white/[0.04] border border-white/15 text-white/50 cursor-wait'
                                      : 'bg-gold text-black hover:bg-gold/90'
                                }`}
                                style={!briefingSent && !sendingBriefing ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.55)' } : briefingSent ? { boxShadow: '0 0 14px -4px rgba(52,211,153,0.4)' } : undefined}>
                                {briefingSent ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    Briefing Enviado
                                  </>
                                ) : sendingBriefing ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    A enviar…
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    Enviar Briefing
                                  </>
                                )}
                              </button>
                            ) : null

                            const briefingExtBlock = (
                              <BriefingExtensions
                                info={equipaBI as BriefingExt}
                                isAdmin={isAdmin}
                                teamView={isFreelancerView}
                                onSave={handleSaveBriefingExt}
                                pageTitle={title}
                                portalRef={portalRef || refParam || undefined}
                                dataEvento={eventoData?.data_evento ?? null}
                                local={eventoData?.local ?? null}
                                enviarBriefingNode={enviarBtnSlot}
                                equipaNode={equipaBox}
                                fichasNode={cardsGrid}
                              />
                            )
                            // Notion content (Briefing Geral) – mostrado entre o hero e o resto do briefing
                            const notionPre  = briefingGeralIdx === -1 ? otherBlocks : otherBlocks.slice(0, briefingGeralIdx)
                            const notionMid  = briefingGeralIdx === -1 ? []         : [otherBlocks[briefingGeralIdx]]
                            const notionPost = briefingGeralIdx === -1 ? []         : otherBlocks.slice(briefingGeralIdx + 1)
                            const backUrl = fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined
                            return (
                              <>
                                {notionPre.length > 0 && <NotionBlocks blocks={notionPre} hiddenNav={settings.hiddenNav} backUrl={backUrl} />}
                                {notionMid.length > 0 && <NotionBlocks blocks={notionMid} hiddenNav={settings.hiddenNav} backUrl={backUrl} />}
                                {briefingExtBlock}
                                {notionPost.length > 0 && <NotionBlocks blocks={notionPost} hiddenNav={settings.hiddenNav} backUrl={backUrl} />}
                              </>
                            )
                          })()}
                        </>
                      )
                    }
                    const isBriefingChildPage = fromTitle?.toUpperCase().includes('BRIEFING')
                    if (isBriefingChildPage) {
                      const info = briefingInfo[id as string] ?? {}
                      const defaultFields = [
                        { label: 'Nome', value: '' },
                        { label: 'Local Preparação', value: '' },
                        { label: 'Hora de Início', value: '' },
                        { label: 'Contato', value: '' },
                        { label: 'Nome Familiar', value: '' },
                        { label: 'Contato Familiar', value: '' },
                      ]
                      const fields = info.fields ?? defaultFields
                      return (
                        <>
                          {/* Briefing info section */}
                          <div className="mb-6 pb-6 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] tracking-[0.3em] text-white/60 uppercase">Informação</span>
                              {!editingBriefingInfo && (
                                <button
                                  onClick={() => { setBriefingFieldsForm(fields.map(f => ({ ...f }))); setEditingBriefingInfo(true) }}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
                                  title="Editar informação">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                            {editingBriefingInfo ? (
                              <div className="space-y-3">
                                {briefingFieldsForm.map((field, idx) => (
                                  <div key={idx} className="flex gap-2 items-start">
                                    <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                                      <button onClick={() => setBriefingFieldsForm(f => { const a = [...f]; if (idx === 0) return a; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a })}
                                        disabled={idx === 0}
                                        className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-default transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                                      </button>
                                      <button onClick={() => setBriefingFieldsForm(f => { const a = [...f]; if (idx === a.length - 1) return a; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a })}
                                        disabled={idx === briefingFieldsForm.length - 1}
                                        className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-default transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                      </button>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <input type="text" value={field.label}
                                        onChange={e => setBriefingFieldsForm(f => f.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                                        placeholder="Nome do campo"
                                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-[10px] text-white/50 tracking-widest uppercase outline-none focus:border-gold/30 transition-colors placeholder:text-white/15" />
                                      <input type="text" value={field.value}
                                        onChange={e => setBriefingFieldsForm(f => f.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))}
                                        placeholder="Valor"
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                                    </div>
                                    <button onClick={() => setBriefingFieldsForm(f => f.filter((_, i) => i !== idx))}
                                      className="mt-1 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-white/[0.04] transition-colors shrink-0">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                  </div>
                                ))}
                                <button onClick={() => setBriefingFieldsForm(f => [...f, { label: '', value: '' }])}
                                  className="w-full py-2 rounded-xl border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 text-xs tracking-widest transition-all">
                                  + Adicionar Campo
                                </button>
                                <div className="flex gap-2 pt-1">
                                  <button onClick={handleSaveBriefingInfo} disabled={savingBriefingInfo}
                                    className="flex-1 py-2 rounded-xl bg-gold text-black font-semibold text-xs tracking-widest hover:bg-gold/80 transition-all disabled:opacity-50">
                                    {savingBriefingInfo ? 'A guardar...' : 'Guardar'}
                                  </button>
                                  <button onClick={() => setEditingBriefingInfo(false)}
                                    className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 text-xs tracking-widest hover:bg-white/[0.04] transition-all">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {fields.map(({ label, value }, idx) => (
                                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                    <span className="text-[10px] tracking-widest text-white/35 uppercase">{label}</span>
                                    <span className="text-sm text-white/70 font-medium">{value || <span className="text-white/20 text-xs italic">—</span>}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Informação Geral section */}
                          <div className="mb-6 pb-6 border-b border-white/[0.06]">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] tracking-[0.3em] text-white/60 uppercase">Informação Geral</span>
                              {!editingInfoGeral && (
                                <button onClick={() => { setInfoGeralForm(info.infoGeral ?? ''); setEditingInfoGeral(true) }}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70"
                                  title="Editar informação geral">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                            {editingInfoGeral ? (
                              <div className="space-y-3">
                                <textarea value={infoGeralForm} onChange={e => setInfoGeralForm(e.target.value)}
                                  rows={5} placeholder="Escreve aqui informação geral..."
                                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15 resize-none" />
                                <div className="flex gap-2">
                                  <button onClick={handleSaveInfoGeral} disabled={savingInfoGeral}
                                    className="flex-1 py-2 rounded-xl bg-gold text-black font-semibold text-xs tracking-widest hover:bg-gold/80 transition-all disabled:opacity-50">
                                    {savingInfoGeral ? 'A guardar...' : 'Guardar'}
                                  </button>
                                  <button onClick={() => setEditingInfoGeral(false)}
                                    className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 text-xs tracking-widest hover:bg-white/[0.04] transition-all">
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl min-h-[60px]">
                                {info.infoGeral
                                  ? <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{info.infoGeral}</p>
                                  : <p className="text-xs text-white/20 italic">Sem informação geral.</p>
                                }
                              </div>
                            )}
                          </div>
                          <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                        </>
                      )
                    }
                    if (isGuiaPage) {
                      // ── GUIA DOS NOIVOS: the 4 sections live inside a column_list ──
                      // Structure: column_list → [column[BLOG, FOTOS], column[DADOS, PAGAMENTOS]]
                      // Each section is a callout with title in rich_text + image in children
                      // Helper: anexa ?ref=portalRef quando a URL é interna /contrato-cps
                      const withRef = (u: string | undefined): string | undefined => {
                        if (!u || !portalRef) return u
                        if (!u.startsWith('/contrato-cps')) return u
                        const sep = u.includes('?') ? '&' : '?'
                        return `${u}${sep}ref=${encodeURIComponent(portalRef)}`
                      }
                      const SECTION_META: Record<string, { icon: string; label: string; url: string | undefined }> = {
                        'BLOG':                     { icon: '✍️', label: 'Ver Blog',             url: guiaLinks.blogUrl },
                        'FOTOS CONVIDADOS':          { icon: '📷', label: 'Solicitar Fotos',      url: guiaLinks.fotosConvidadosUrl },
                        'DADOS PARA CONTRATO - CPS': { icon: '📋', label: 'Preencher Dados',      url: withRef(guiaLinks.dadosContratoUrl) },
                        'PAGAMENTOS/REGISTO':        { icon: '💳', label: 'Registar Pagamento',   url: guiaLinks.pagamentosRegistoUrl },
                      }
                      // find the column_list that contains the 4 section callouts
                      const colListIdx = blocks.findIndex(b =>
                        b.type === 'column_list' &&
                        b.children?.some((col: Block) =>
                          col.children?.some((child: Block) =>
                            child.type === 'callout' &&
                            Object.keys(SECTION_META).includes(plainText(child.callout?.rich_text ?? []).trim().toUpperCase())
                          )
                        )
                      )
                      if (colListIdx === -1) return <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                      const colList = blocks[colListIdx]
                      // collect all callout children from all columns
                      const sectionCallouts: Block[] = []
                      for (const col of (colList.children ?? []) as Block[]) {
                        for (const child of (col.children ?? []) as Block[]) {
                          const t = plainText(child.callout?.rich_text ?? []).trim().toUpperCase()
                          if (child.type === 'callout' && SECTION_META[t]) sectionCallouts.push(child)
                        }
                      }
                      const getImgUrl = (b: Block) => {
                        const imgChild = (b.children ?? []).find((c: Block) => c.type === 'image')
                        if (!imgChild) return null
                        return imgChild.image?.type === 'external' ? imgChild.image.external?.url : imgChild.image?.file?.url
                      }
                      return (
                        <>
                          <NotionBlocks blocks={blocks.slice(0, colListIdx)} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                          <div className="grid grid-cols-2 gap-3 my-4">
                            {sectionCallouts.map(callout => {
                              const titleText = plainText(callout.callout?.rich_text ?? []).trim().toUpperCase()
                              const meta = SECTION_META[titleText]
                              if (!meta) return null
                              const imgUrl = getImgUrl(callout)
                              return (
                                <div key={titleText} className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                    <span className="text-lg">{meta.icon}</span>
                                    <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{titleText}</span>
                                  </div>
                                  {imgUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={imgUrl} alt={titleText} className="w-full object-contain" />
                                  )}
                                  <div className="p-3">
                                    {meta.url ? (
                                      <a href={meta.url} target="_blank" rel="noopener noreferrer"
                                        className="block w-full text-center px-4 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs tracking-wide hover:bg-gold/80 transition-all">
                                        {meta.label}
                                      </a>
                                    ) : (
                                      <div className="block w-full text-center px-4 py-2.5 rounded-xl border border-gold/20 text-gold/40 text-xs tracking-wide">
                                        {meta.label}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {(() => {
                            const afterSections = blocks.slice(colListIdx + 1)
                            // find the parceiros column_list (has only image children)
                            const parcIdx = afterSections.findIndex(b =>
                              b.type === 'column_list' &&
                              b.children?.every((col: Block) =>
                                col.children?.every((c: Block) => c.type === 'image')
                              ) &&
                              (b.children?.flatMap((col: Block) => col.children ?? []).length ?? 0) >= 4
                            )
                            // Use settings parceiros if available, else fall back to Notion blocks
                            const parcList = parceiros.length > 0 ? parceiros : (() => {
                              if (parcIdx === -1) return null
                              const imgs: Array<{imageUrl:string;url?:string}> = []
                              for (const col of (afterSections[parcIdx].children ?? []) as Block[]) {
                                for (const img of (col.children ?? []) as Block[]) {
                                  const u = img.image?.type === 'external' ? img.image.external?.url : img.image?.file?.url
                                  if (u) imgs.push({ imageUrl: u })
                                }
                              }
                              return imgs
                            })()
                            const parcSectionEnd = parceiros.length > 0 ? (parcIdx !== -1 ? parcIdx : afterSections.length - 1) : parcIdx
                            return (
                              <>
                                <NotionBlocks blocks={afterSections.slice(0, parcSectionEnd !== -1 ? parcSectionEnd : afterSections.length)} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                                {parcList && parcList.length > 0 && (
                                  <div className="grid grid-cols-2 gap-3 my-4">
                                    {parcList.map((p, idx) => {
                                      const content = (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.imageUrl} alt={`Parceiro ${idx+1}`} className="w-full object-contain rounded-xl" />
                                      )
                                      return p.url ? (
                                        <a key={idx} href={p.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                                          {content}
                                        </a>
                                      ) : (
                                        <div key={idx}>{content}</div>
                                      )
                                    })}
                                  </div>
                                )}
                                {parcSectionEnd !== -1 && <NotionBlocks blocks={afterSections.slice(parcSectionEnd + 1)} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />}
                              </>
                            )
                          })()}
                        </>
                      )
                    }
                    if (isFotografiasPage) {
                      const fotosUrl = guiaLinks.fotosSelecaoUrl || 'https://tally.so/r/448PrO'
                      const pageCalloutLinks = calloutLinks[id as string] ?? {}
                      const calloutCards = findCalloutCards(blocks)
                      const getImgUrl = (b: Block) => {
                        const imgChild = (b.children ?? []).find((c: Block) => c.type === 'image')
                        if (!imgChild) return null
                        return imgChild.image?.type === 'external' ? imgChild.image.external?.url : imgChild.image?.file?.url
                      }
                      const backUrl = fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined
                      return (
                        <>
                          {/* ── ENVIAR FOTOS ── */}
                          <div className="mb-8 rounded-2xl border border-white/40 bg-black overflow-hidden"
                            style={{ boxShadow: '0 0 24px 4px rgba(255,255,255,0.12), 0 0 8px 2px rgba(255,255,255,0.18), inset 0 0 30px 0 rgba(255,255,255,0.04)' }}>
                            <div className="px-6 py-5">
                              <h2 className="text-base sm:text-lg font-bold tracking-[0.3em] uppercase text-white mb-3"
                                style={{ textShadow: '0 0 14px rgba(255,255,255,0.9), 0 0 28px rgba(255,255,255,0.5)' }}>
                                Enviar Fotos
                              </h2>
                              <p className="text-sm text-white/55 leading-relaxed mb-5">
                                Noivos, este formulário é para vocês nos enviarem a vossa escolha através dele, de outra forma não é considerado entregue.
                              </p>
                              <a href={fotosUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 bg-white/5 text-white text-sm font-semibold tracking-wide hover:bg-white/10 transition-all"
                                style={{ boxShadow: '0 0 12px 2px rgba(255,255,255,0.15)' }}>
                                ENVIAR SELECÇÃO →
                              </a>
                            </div>
                          </div>
                          {/* ── BLOCKS com cards VER MAIS por card ── */}
                          {(() => {
                            if (calloutCards.length === 0) return <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} backUrl={backUrl} />
                            const renderedSections: React.ReactNode[] = []
                            let i = 0
                            while (i < blocks.length) {
                              const b = blocks[i]
                              const cardsInBlock = b.type === 'column_list'
                                ? (b.children ?? []).flatMap((col: Block) =>
                                    (col.children ?? []).filter((c: Block) =>
                                      c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image')
                                    )
                                  )
                                : b.type === 'callout' && (b.children ?? []).some((c: Block) => c.type === 'image')
                                  ? [b] : []
                              if (cardsInBlock.length > 0) {
                                renderedSections.push(
                                  <div key={`cards-${i}`} className="grid grid-cols-2 gap-3 my-4">
                                    {cardsInBlock.map((callout: Block) => {
                                      const cardTitle = plainText(callout.callout?.rich_text ?? []).trim()
                                      const imgUrl = getImgUrl(callout)
                                      const _ct = cardTitle.toUpperCase()
                                      const actionUrlFallback =
                                        _ct.includes('SELEÇ') ? (portalSettingsObj?.selecao_url ?? '') :
                                        _ct.includes('PRÉ-WEDDING') || _ct.includes('PRE-WEDDING') ? (portalSettingsObj?.prewedding_url ?? '') :
                                        _ct.includes('EDITADAS') ? (portalSettingsObj?.fotos_finais_url ?? '') :
                                        _ct.includes('GALERIA ON') || _ct.includes('ON-LINE') ? (portalSettingsObj?.galerias_url ?? '') :
                                        _ct.includes('MAQUETE') ? (portalSettingsObj?.maquete_url ?? '') : ''
                                      const url = pageCalloutLinks[cardTitle] || actionUrlFallback || ''
                                      return (
                                        <div key={cardTitle} className="flex flex-col rounded-2xl overflow-hidden border border-white/40 bg-black"
                                          style={{ boxShadow: '0 0 18px 4px rgba(255,255,255,0.18), 0 0 6px 1px rgba(255,255,255,0.25), inset 0 0 20px 0 rgba(255,255,255,0.06)' }}>
                                          <div className="px-3 pt-3 pb-2">
                                            <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">{cardTitle}</span>
                                          </div>
                                          {imgUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imgUrl} alt={cardTitle} className="w-full object-contain" />
                                          )}
                                          {url ? (
                                            <div className="p-3">
                                              <a href={url} target="_blank" rel="noopener noreferrer"
                                                className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/40 bg-white/5 text-white font-semibold text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
                                                style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.15)' }}>
                                                VER MAIS →
                                              </a>
                                            </div>
                                          ) : (
                                            <div className="p-3">
                                              <span className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.03] text-white/25 font-semibold text-xs tracking-widest uppercase">
                                                AGUARDAR
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              } else {
                                renderedSections.push(
                                  <NotionBlocks key={`block-${i}`} blocks={[b]} hiddenNav={settings.hiddenNav} backUrl={backUrl} />
                                )
                              }
                              i++
                            }
                            return <>{renderedSections}</>
                          })()}
                          {/* ── MAQUETE ÁLBUM — regra obrigatória em todas as páginas FOTOGRAFIAS ── */}
                          {(portalRef || refParam) && (
                            <div className="mt-6">
                              <MaqueteAlbumSection portalRef={portalRef || refParam || ''} imgUrl={null} />
                            </div>
                          )}
                        </>
                      )
                    }
                    if (isSobrePage) {
                      const _textBlocks = blocks.filter(b => b.type !== 'image')
                      const sobrePer = id ? pageHeaders[id as string] : undefined
                      const sobrePhoto = sobrePer === 'none' ? '' : (sobrePer || subpageHeaderUrl || portalHeroImageUrl)
                      return (
                        /* Full-viewport section — true fullscreen, no gap */
                        <div
                          className="relative overflow-hidden"
                          style={{
                            height: '100vh',
                            width: '100vw',
                          }}
                        >
                          {/* Background photo — full bleed */}
                          {sobrePhoto
                            ? <img src={sobrePhoto} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                            : <div className="absolute inset-0 bg-[#0a0806]" />
                          }

                          {/* Gradient: dark left → transparent right (same as couple slide) */}
                          <div className="absolute inset-0" style={{
                            background: sobrePhoto
                              ? 'linear-gradient(to right, rgba(10,8,6,0.97) 0%, rgba(10,8,6,0.88) 28%, rgba(10,8,6,0.55) 55%, rgba(10,8,6,0.10) 80%, transparent 100%)'
                              : 'rgba(10,8,6,1)',
                          }} />

                          {/* ‹ Voltar — top left overlay */}
                          <Link
                            href={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : '/portal-cliente'}
                            className="absolute top-6 left-8 sm:top-8 sm:left-16 z-20 inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/40 hover:text-gold transition-colors uppercase"
                          >
                            ‹ Voltar
                          </Link>

                          {/* Text — centered left, matching couple slide */}
                          <div className="absolute inset-y-0 left-0 z-10 flex flex-col justify-center px-8 sm:px-16" style={{ maxWidth: '58%' }}>
                            {/* Page title (from portal sub-page title) */}
                            <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-3">RL PHOTO.VIDEO</p>
                            <h1 className="font-cormorant font-light uppercase text-gold mb-2"
                              style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)', letterSpacing: '0.18em', lineHeight: 1.1 }}>
                              {title}
                            </h1>
                            <div className="mb-6 w-10 h-px bg-gold/50" />
                            {_textBlocks.map((b) => {
                              const type = b.type
                              const data = b[type] ?? {}
                              if (type === 'heading_1' || type === 'heading_2') {
                                const text = plainText(data.rich_text ?? [])
                                if (!text) return null
                                return (
                                  <h2 key={b.id} className="font-cormorant font-light uppercase text-white mb-3"
                                    style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)', letterSpacing: '0.15em', lineHeight: 1.15 }}>
                                    {richText(data.rich_text)}
                                  </h2>
                                )
                              }
                              if (type === 'heading_3') {
                                const text = plainText(data.rich_text ?? [])
                                if (!text) return null
                                return (
                                  <h3 key={b.id} className="font-cormorant font-light uppercase text-gold/70 mb-3"
                                    style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', letterSpacing: '0.25em' }}>
                                    {richText(data.rich_text)}
                                  </h3>
                                )
                              }
                              if (type === 'paragraph') {
                                const text = plainText(data.rich_text ?? [])
                                if (!text) return <div key={b.id} className="h-2" />
                                return (
                                  <React.Fragment key={b.id}>
                                    <p className="font-cormorant font-light italic text-white/65 leading-relaxed mb-2"
                                      style={{ fontSize: 'clamp(0.95rem, 1.7vw, 1.15rem)' }}>
                                      {richText(data.rich_text)}
                                    </p>
                                  </React.Fragment>
                                )
                              }
                              return null
                            })}
                          </div>

                          {/* Admin: Trocar/Remover foto — bottom right corner */}
                          {isAdmin && (
                            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
                              {sobrePhoto && (
                                <button onClick={handleRemovePageHeader} disabled={uploadingPageHeader}
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black/70 border border-red-400/30 text-red-400/60 text-xs hover:text-red-400 hover:border-red-400/60 transition-colors disabled:opacity-40 backdrop-blur-sm">
                                  ✕
                                </button>
                              )}
                              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/70 border border-white/20 text-white/60 text-[11px] hover:text-white hover:border-white/40 transition-colors cursor-pointer backdrop-blur-sm">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                {uploadingPageHeader ? 'A carregar...' : sobrePhoto ? '+ Trocar foto' : '+ Foto de fundo'}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingPageHeader}
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPageHeader(f) }} />
                              </label>
                            </div>
                          )}
                        </div>
                      )
                    }

                    if (!isPaymentsPage) {
                      // Check if page has callout cards — render them with URL buttons
                      const pageCalloutLinks = calloutLinks[id as string] ?? {}
                      const calloutCards = findCalloutCards(blocks)
                      if (calloutCards.length === 0) {
                        const _backUrl = fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined
                        const _textBlocks = blocks.filter(b => b.type !== 'image')
                        const _imgBlocks  = findImageBlocks(blocks)
                        return (
                          <div className="space-y-4">
                            <NotionBlocks blocks={_textBlocks} hiddenNav={settings.hiddenNav} backUrl={_backUrl} />
                            {_imgBlocks.map(img => (
                              <div key={img.id} className="rounded-2xl overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt="" className="w-full rounded-2xl object-cover max-h-96" />
                              </div>
                            ))}
                          </div>
                        )
                      }

                      // Build a flat list: non-callout blocks + callout cards
                      const getImgUrl = (b: Block) => {
                        const imgChild = (b.children ?? []).find((c: Block) => c.type === 'image')
                        if (!imgChild) return null
                        return imgChild.image?.type === 'external' ? imgChild.image.external?.url : imgChild.image?.file?.url
                      }

                      // Render blocks, replacing column_list that contain callouts with card grid
                      const renderedSections: React.ReactNode[] = []
                      let i = 0
                      while (i < blocks.length) {
                        const b = blocks[i]
                        const cardsInBlock = b.type === 'column_list'
                          ? (b.children ?? []).flatMap((col: Block) =>
                              (col.children ?? []).filter((c: Block) =>
                                c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image')
                              )
                            )
                          : b.type === 'callout' && (b.children ?? []).some((c: Block) => c.type === 'image')
                            ? [b] : []

                        if (cardsInBlock.length > 0) {
                          renderedSections.push(
                            <div key={`cards-${i}`} className="grid grid-cols-2 gap-3 my-4">
                              {cardsInBlock.map((callout: Block) => {
                                const cardTitle = plainText(callout.callout?.rich_text ?? []).trim()
                                const imgUrl = getImgUrl(callout)
                                const _ct = cardTitle.toUpperCase()
                                const videoActionFallback = isFilmePage ? (
                                  _ct.includes('WEDDING FILM') ? (portalSettingsObj?.wedding_film_url ?? '') :
                                  _ct.includes('PRÉ-WEDDING') || _ct.includes('PRE-WEDDING') ? (portalSettingsObj?.video_prewedding_url ?? '') :
                                  _ct.includes('SAME DAY') ? (portalSettingsObj?.same_day_edit_url ?? '') :
                                  _ct.includes('TEASER') || _ct.includes('TRAILER') ? (portalSettingsObj?.teaser_url ?? '') : ''
                                ) : ''
                                const url = pageCalloutLinks[cardTitle] || videoActionFallback || ''
                                return (
                                  <div key={cardTitle} className="flex flex-col rounded-2xl overflow-hidden border border-white/40 bg-black"
                                    style={{ boxShadow: '0 0 18px 4px rgba(255,255,255,0.18), 0 0 6px 1px rgba(255,255,255,0.25), inset 0 0 20px 0 rgba(255,255,255,0.06)' }}>
                                    <div className="px-3 pt-3 pb-2">
                                      <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">{cardTitle}</span>
                                    </div>
                                    {imgUrl && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={imgUrl} alt={cardTitle} className="w-full object-contain" />
                                    )}
                                    {url ? (
                                      <div className="p-3">
                                        <a href={url} target="_blank" rel="noopener noreferrer"
                                          className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/40 bg-white/5 text-white font-semibold text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
                                          style={{ boxShadow: '0 0 10px 2px rgba(255,255,255,0.15)' }}>
                                          VER MAIS →
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="p-3">
                                        <span className="block w-full text-center px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.03] text-white/25 font-semibold text-xs tracking-widest uppercase">
                                          AGUARDAR
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        } else {
                          renderedSections.push(
                            <NotionBlocks key={`block-${i}`} blocks={[b]} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                          )
                        }
                        i++
                      }
                      return <>{renderedSections}</>
                    }
                    const numerarioIdx = blocks.findIndex(b =>
                      plainText((b[b.type]?.rich_text ?? [])).toLowerCase().includes('numerário contatar')
                    )
                    const beforeNumerario = numerarioIdx !== -1 ? blocks.slice(0, numerarioIdx + 1) : blocks
                    const afterNumerario  = numerarioIdx !== -1 ? blocks.slice(numerarioIdx + 1) : []
                    return (
                      <>
                        <NotionBlocks blocks={beforeNumerario} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                        {numerarioIdx !== -1 && (
                          <div className="my-5">
                            <a href={guiaLinks.pagamentosRegistoUrl ?? 'https://tally.so/r/A72PQB'} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-black font-semibold text-sm tracking-wide hover:bg-gold/80 transition-all">
                              Registar Pagamento
                            </a>
                          </div>
                        )}
                        {(() => {
                          const valorIdx = afterNumerario.findIndex(b =>
                            plainText((b[b.type]?.rich_text ?? [])).toLowerCase().includes('valor do serviço') ||
                            plainText((b[b.type]?.rich_text ?? [])).toLowerCase().includes('valor de serviço')
                          )
                          const beforeValor = valorIdx !== -1 ? afterNumerario.slice(0, valorIdx) : afterNumerario
                          const afterValor  = valorIdx !== -1 ? afterNumerario.slice(valorIdx + 1) : []
                          return (
                            <>
                              <NotionBlocks blocks={beforeValor} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                              {/* ── Proposta Escolhida (Notion) ───────────── */}
                              {notionServicos && (notionServicos.proposta || notionServicos.servico_foto.length > 0 || notionServicos.servico_video.length > 0) && (
                                <div className="mb-6 pb-6 border-b border-white/[0.06]">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-4 bg-gold rounded-full" />
                                    <span className="text-[10px] tracking-[0.35em] text-gold uppercase font-semibold">Proposta</span>
                                    {notionServicos.proposta && (
                                      <span className="ml-auto text-[9px] tracking-widest text-white/50 uppercase bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full">
                                        {notionServicos.proposta}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid gap-3 grid-cols-2">
                                    {notionServicos.servico_video.length > 0 && (
                                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                                        <div className="px-3 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                                          <svg className="w-3.5 h-3.5 text-gold/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                          </svg>
                                          <span className="text-[9px] tracking-[0.3em] text-white/40 uppercase font-semibold">Serviço de Vídeo</span>
                                        </div>
                                        <div className="p-3 flex flex-col gap-1.5">
                                          {notionServicos.servico_video.map((item: string, i: number) => (
                                            <span key={i} className="block w-full text-[10px] tracking-wider text-gold/80 uppercase bg-gold/[0.06] border border-gold/20 px-2.5 py-1.5 rounded-lg">{item}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {notionServicos.servico_foto.length > 0 && (
                                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                                        <div className="px-3 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                                          <svg className="w-3.5 h-3.5 text-gold/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                          </svg>
                                          <span className="text-[9px] tracking-[0.3em] text-white/40 uppercase font-semibold">Serviço de Fotografia</span>
                                        </div>
                                        <div className="p-3 flex flex-col gap-1.5">
                                          {notionServicos.servico_foto.map((item: string, i: number) => (
                                            <span key={i} className="block w-full text-[10px] tracking-wider text-gold/80 uppercase bg-gold/[0.06] border border-gold/20 px-2.5 py-1.5 rounded-lg">{item}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* ── Financeiro ─────────────────────────── */}
                              <div className="mb-6 pb-6 border-b border-white/[0.06]">
                                <span className="text-[10px] tracking-[0.3em] text-gold uppercase block mb-3">Financeiro</span>
                                <div className="flex items-center justify-between px-4 py-3 bg-gold/5 border border-gold/20 rounded-xl">
                                  <div>
                                    <span className="text-xs tracking-widest text-gold/60 uppercase block">Total do Serviço</span>
                                  </div>
                                  <span className="text-gold font-bold text-lg">
                                    {(eventoData ? (eventoData.valor_foto ?? 0) + (eventoData.valor_video ?? 0) : portalTotal || 0).toLocaleString('pt-PT')} €
                                  </span>
                                </div>
                              </div>
                              <PaymentPhasesSection
                                referencia={portalRef}
                                valorTotal={eventoData ? (eventoData.valor_foto ?? 0) + (eventoData.valor_video ?? 0) : portalTotal}
                                pagamentos={pagamentos}
                                onRefresh={loadPagamentos}
                                refreshing={pagRefreshing}
                              />
                              <NotionBlocks blocks={afterValor} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                            </>
                          )
                        })()}
                      </>
                    )
                  })()}
                </>
              )
          }
        </div>
      )}
    </main>
    </PortalShell>
  )
}

export default function PortalSubPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-950 flex items-center justify-center"><span className="text-white/30 text-xs tracking-widest animate-pulse">A carregar...</span></main>}>
      <PortalSubPageContent />
    </Suspense>
  )
}
