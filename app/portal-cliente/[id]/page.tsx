'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
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

// ─── contrato proposta section ────────────────────────────────────────────────

function ContratoPropostaSection({ evento, blocks, settings, contratoDisponivel, contratoUrl }: {
  evento: any
  blocks: Block[]
  settings: { hiddenNav: string[] }
  contratoDisponivel: boolean | null
  contratoUrl: string | null
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
              {evento.valor_foto && (
                <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-white/25 tracking-widest uppercase">Valor</span>
                  <span className="text-sm font-semibold text-gold">{(evento.valor_foto as number).toLocaleString('pt-PT')} €</span>
                </div>
              )}
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
              {evento.valor_video && (
                <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-white/25 tracking-widest uppercase">Valor</span>
                  <span className="text-sm font-semibold text-gold">{(evento.valor_video as number).toLocaleString('pt-PT')} €</span>
                </div>
              )}
            </div>
          )}
        </div>

        {evento.valor_liquido && (
          <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gold/5 border border-gold/20">
            <span className="text-[10px] tracking-widest text-gold/60 uppercase">Total do Serviço</span>
            <span className="text-gold font-bold text-lg">{(evento.valor_liquido as number).toLocaleString('pt-PT')} €</span>
          </div>
        )}
      </div>
    </>
  )
}

// ─── pre-wedding calendar ─────────────────────────────────────────────────────

type PreWeddingSlot = { id: string; date: string; time: string; local: string }

function PreWeddingSection({ slots, reservedSlotId, reservingSlotId, showReservedWarning, blocks, settings, onReserve }: {
  slots: PreWeddingSlot[]
  reservedSlotId: string | null
  reservingSlotId: string | null
  showReservedWarning: boolean
  blocks: Block[]
  settings: { hiddenNav: string[] }
  onReserve: (slotId: string) => void
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
      <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} />
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
  const [editingPhotos, setEditingPhotos] = useState(false)
  const [error, setError] = useState('')
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [portalRef, setPortalRef] = useState('')
  const [portalTotal, setPortalTotal] = useState(0)
  const [portalFoto, setPortalFoto] = useState<number | null>(null)
  const [portalVideo, setPortalVideo] = useState<number | null>(null)
  const [portalExtras, setPortalExtras] = useState<number | null>(null)
  const [pagRefreshing, setPagRefreshing] = useState(false)
  const [guiaLinks, setGuiaLinks] = useState<{blogUrl?:string,fotosSelecaoUrl?:string,fotosVerMaisUrl?:string,fotosConvidadosUrl?:string,dadosContratoUrl?:string,pagamentosRegistoUrl?:string}>({})
  const [parceiros, setParceiros] = useState<Array<{imageUrl:string;url?:string}>>([])
  const [portalSettingsBlockId, setPortalSettingsBlockId] = useState<string|null>(null)
  const [editingParceiros, setEditingParceiros] = useState(false)
  const [parceirosForm, setParceirosForm] = useState<Array<{imageUrl:string;url?:string}>>([])
  const [savingParceiros, setSavingParceiros] = useState(false)
  const [subpageHeaderUrl, setSubpageHeaderUrl] = useState('')
  const [preWeddingSlots, setPreWeddingSlots] = useState<Array<{id:string;date:string;time:string;local:string}>>([])
  const [reservedSlotId, setReservedSlotId] = useState<string | null>(null)
  const [reservingSlotId, setReservingSlotId] = useState<string | null>(null)
  const [showReservedWarning, setShowReservedWarning] = useState(false)
  const [editingPreWedding, setEditingPreWedding] = useState(false)
  const [preWeddingForm, setPreWeddingForm] = useState<Array<{id:string;date:string;time:string;local:string}>>([])
  const [savingSlots, setSavingSlots] = useState(false)

  const [eventoData, setEventoData] = useState<any>(null)
  const [contratoDisponivel, setContratoDisponivel] = useState<boolean | null>(null)
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)
  const [portalSettingsObj, setPortalSettingsObj] = useState<any>({})
  const [pageTitles, setPageTitles] = useState<Record<string, string>>({})
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
  const [briefingInfo, setBriefingInfo] = useState<Record<string, { fields?: Array<{ label: string; value: string }>; infoGeral?: string; equipa?: Array<{ role: string; name: string }> }>>({})
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

  const isPaymentsPage    = title.toUpperCase().includes('PAGAMENTO')
  const isGuiaPage        = title.toUpperCase().includes('GUIA') && !title.toUpperCase().includes('WEDDING')
  const isPreWeddingPage  = title.toUpperCase().includes('WEDDING')
  const isContratoPage    = title.toUpperCase().includes('CONTRATO')
  const isBriefingPage    = title.toUpperCase().includes('BRIEFING')
  const isFotografiasPage = title.toUpperCase().includes('FOTOGRAF')
  const isSatisfacaoPage  = title.toUpperCase().includes('SAT.') || title.toUpperCase().includes('SATISF')

  const loadPagamentos = useCallback(async () => {
    setPagRefreshing(true)
    try {
      let ps: Record<string, any> = {}
      let settingsBlockIdVal: string | null = null

      if (refParam) {
        // Ref-based portal: load settings from Supabase
        const d = await fetch(`/api/portais?ref=${encodeURIComponent(refParam)}`).then(r => r.json())
        ps = d.portal?.settings ?? {}
      } else {
        // Main portal: load settings from Notion
        const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`).then(r => r.json())
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
      setGuiaLinks(ps.guiaLinks ?? {})
      setParceiros(ps.parceiros ?? [])
      setPortalSettingsBlockId(settingsBlockIdVal)
      setSubpageHeaderUrl(ps.subpageHeaderUrl ?? '')
      const slots = ps.preWeddingSlots ?? []
      setPreWeddingSlots(slots)
      const savedId = ps.preWeddingReservedSlotId ?? null
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
      setBriefingInfo(ps.briefingInfo ?? {})

      if (ref) {
        setPortalRef(ref)
        setPortalTotal(total)
        const [pd, ed] = await Promise.all([
          fetch(`/api/pagamentos-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json()),
          fetch(`/api/evento-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json()),
        ])
        setPagamentos(pd.payments ?? [])
        if (ed.found) {
          setEventoData(ed.evento)
          if ((ps.contratoDisponivel ?? false) && !ps.contratoUrl) {
            setContratoUrl(`/eventos-2026/${ed.evento.id}/contrato`)
          }
        }
      }
    } finally {
      setPagRefreshing(false)
    }
  }, [refParam])

  useEffect(() => {
    loadPagamentos()
  }, [loadPagamentos])

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

  async function savePortalSettings(newSettings: Record<string, any>) {
    if (refParam) {
      await fetch('/api/portais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: refParam, updates: { settings: newSettings } }),
      })
    } else {
      await fetch('/api/portais-clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId: portalSettingsBlockId }),
      })
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

  async function handleSaveBriefing() {
    setSavingBriefing(true)
    const newBL = { ...briefingLinks, ...briefingForm }
    await savePortalSettings({ ...portalSettingsObj, briefingLinks: newBL })
    setBriefingLinks(newBL)
    setEditingBriefing(false)
    setSavingBriefing(false)
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
          {!editing && !editingPhotos && !loading && !error && isGuiaPage && (
            <button onClick={() => { setParceirosForm(parceiros.length > 0 ? parceiros : []); setEditingParceiros(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Parceiros
            </button>
          )}
          {!editing && !editingPhotos && !loading && !error && (() => {
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
          {!editing && !editingPhotos && !loading && !error && isPreWeddingPage && (
            <button onClick={() => { setPreWeddingForm(preWeddingSlots.map(s => ({...s}))); setEditingPreWedding(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/15 hover:border-white/30 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Agenda
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
          const effectiveHeader = (id && pageHeaders[id as string]) || subpageHeaderUrl
          return effectiveHeader ? (
          <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 group/header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectiveHeader} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 flex items-end gap-3">
              <div>
                <p className="text-[10px] tracking-[0.4em] text-white/50 uppercase mb-1">RL PHOTO.VIDEO</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase drop-shadow-lg">
                  {title || '...'}
                </h1>
              </div>
              <button onClick={() => { setTitleInput(title); setEditingTitle(true) }}
                className="mb-1 text-white/30 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {/* Change photo button */}
            <label className="absolute top-3 right-3 opacity-0 group-hover/header:opacity-100 transition-opacity cursor-pointer">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white/70 text-xs hover:text-white transition-colors">
                {uploadingPageHeader ? 'A carregar...' : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Trocar foto
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={uploadingPageHeader}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPageHeader(f) }} />
            </label>
          </div>
          ) : null
        })() || (
          <>
            <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-gold uppercase">
                {title || '...'}
              </h1>
              <button onClick={() => { setTitleInput(title); setEditingTitle(true) }}
                className="text-white/20 hover:text-gold/60 transition-colors mt-0.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="mt-3 h-px w-16 bg-gold/40" />
          </>
        )}
      </header>

      {loading && <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>}
      {error   && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-8">
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
                            const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
                            const ps = d.settings ?? {}
                            const sbId = d.settingsBlockId ?? null
                            const newSettings = { ...ps, parceiros: parceirosForm }
                            await fetch('/api/portal-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId: sbId }) })
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
                            const d = await fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}`).then(r => r.json())
                            const ps = d.settings ?? {}
                            const sbId = d.settingsBlockId ?? null
                            const newSettings = { ...ps, preWeddingSlots: preWeddingForm }
                            await fetch('/api/portal-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId: sbId }) })
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
                  <div className="mb-6">
                    <Link href={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : '/portal-cliente'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all text-sm tracking-wide">
                      ‹ Voltar
                    </Link>
                  </div>
                  {(() => {
                    if (isContratoPage && eventoData) {
                      return <ContratoPropostaSection evento={eventoData} blocks={blocks} settings={settings} contratoDisponivel={contratoDisponivel} contratoUrl={contratoUrl} />
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
                    if (isSatisfacaoPage) {
                      return (
                        <>
                          <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                          <div className="mt-6 rounded-xl border border-white/40 bg-black overflow-hidden"
                            style={{ boxShadow: '0 0 14px 3px rgba(255,255,255,0.12), inset 0 0 16px 0 rgba(255,255,255,0.03)' }}>
                            <div className="px-5 py-4 flex items-center justify-between gap-4">
                              <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/70">Dar Satisfação</span>
                              <a href="https://tally.so/r/pbKJry" target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-white/[0.03] text-white/50 text-xs font-medium hover:text-white/80 hover:border-white/40 transition-all">
                                DAR SATISFAÇÃO →
                              </a>
                            </div>
                          </div>
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
                          onReserve={async (slotId) => {
                            if (reservedSlotId) { setShowReservedWarning(true); setTimeout(() => setShowReservedWarning(false), 4000); return }
                            setReservingSlotId(slotId)
                            try {
                              const newSettings = { ...portalSettingsObj, preWeddingReservedSlotId: slotId, preWeddingReservedAt: new Date().toISOString() }
                              await savePortalSettings(newSettings)
                              setReservedSlotId(slotId)
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
                      const aceHidden = new Set(aceIdx !== -1 ? allOther.slice(aceIdx, aceEnd).map(b => b.id) : [])
                      const otherBlocks = allOther.filter(b =>
                        !aceHidden.has(b.id) &&
                        !(b.type === 'callout' && (b.children ?? []).some((c: Block) => c.type === 'image')) &&
                        !(b.type === 'column_list' && (b.children ?? []).some((col: Block) =>
                          (col.children ?? []).some((c: Block) => c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image'))
                        ))
                      )
                      const cardsGrid = childPages.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          {childPages.map(cp => {
                            const pageTitle = cp.child_page?.title ?? ''
                            const href = `/portal-cliente/${cp.id}?title=${encodeURIComponent(pageTitle)}&from=${id}&fromTitle=${encodeURIComponent(title)}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}`
                            return (
                              <Link key={cp.id} href={href}>
                                <div className="relative flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-2xl border border-white/40 bg-black cursor-pointer group hover:border-white/70 transition-all duration-300 overflow-hidden"
                                  style={{ boxShadow: '0 0 18px 4px rgba(255,255,255,0.18), 0 0 6px 1px rgba(255,255,255,0.25), inset 0 0 20px 0 rgba(255,255,255,0.06)' }}>
                                  <span className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 group-hover:opacity-100 opacity-0"
                                    style={{ boxShadow: '0 0 32px 6px rgba(255,255,255,0.28), inset 0 0 40px 0 rgba(255,255,255,0.08)' }} />
                                  <span className="text-xs font-bold tracking-[0.3em] uppercase text-white group-hover:text-white transition-all duration-300"
                                    style={{ textShadow: '0 0 14px rgba(255,255,255,0.9), 0 0 28px rgba(255,255,255,0.5)' }}>
                                    {pageTitle}
                                  </span>
                                  <span className="text-[9px] text-white/50 tracking-widest group-hover:text-white/80 transition-colors">Abrir →</span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )
                      return (
                        <>
                          {(() => {
                            const ROLES = ['Fotógrafo', 'Videógrafo', 'Assistente', 'Editor']
                            const equipaBI = briefingInfo[id as string] ?? {}
                            const equipa = equipaBI.equipa ?? []
                            const equipaBox = (
                              <div className="mb-6 pb-6 border-b border-white/[0.06]">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] tracking-[0.3em] text-white/60 uppercase">Equipa</span>
                                  {!editingEquipa && (
                                    <button onClick={() => { setEquipaForm(equipa.length ? equipa.map(e => ({ ...e })) : [{ role: 'Fotógrafo', name: '' }]); setEditingEquipa(true) }}
                                      className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/70">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                {editingEquipa ? (
                                  <div className="space-y-2">
                                    {equipaForm.map((member, idx) => (
                                      <div key={idx} className="flex gap-2 items-center">
                                        <select value={member.role}
                                          onChange={e => setEquipaForm(f => f.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))}
                                          className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 outline-none focus:border-gold/40 transition-colors shrink-0">
                                          {ROLES.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
                                        </select>
                                        <input type="text" value={member.name}
                                          onChange={e => setEquipaForm(f => f.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                          placeholder="Nome do profissional"
                                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                                        <button onClick={() => setEquipaForm(f => f.filter((_, i) => i !== idx))}
                                          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-white/[0.04] transition-colors shrink-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                      </div>
                                    ))}
                                    <button onClick={() => setEquipaForm(f => [...f, { role: 'Fotógrafo', name: '' }])}
                                      className="w-full py-2 rounded-xl border border-dashed border-white/20 text-white/30 hover:text-white/60 hover:border-white/40 text-xs tracking-widest transition-all">
                                      + Adicionar Membro
                                    </button>
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={handleSaveEquipa} disabled={savingEquipa}
                                        className="flex-1 py-2 rounded-xl bg-gold text-black font-semibold text-xs tracking-widest hover:bg-gold/80 transition-all disabled:opacity-50">
                                        {savingEquipa ? 'A guardar...' : 'Guardar'}
                                      </button>
                                      <button onClick={() => setEditingEquipa(false)}
                                        className="flex-1 py-2 rounded-xl border border-white/10 text-white/50 text-xs tracking-widest hover:bg-white/[0.04] transition-all">
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : equipa.length > 0 ? (
                                  <div className="space-y-2">
                                    {equipa.map((member, idx) => (
                                      <div key={idx} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                        <span className="text-[10px] tracking-widest text-white/35 uppercase">{member.role}</span>
                                        <span className="text-sm text-white/70 font-medium">{member.name || <span className="text-white/20 text-xs italic">—</span>}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-white/20 italic px-1">Sem equipa definida.</p>
                                )}
                              </div>
                            )
                            const briefingGeralIdx = otherBlocks.findIndex(b =>
                              ['heading_1','heading_2','heading_3'].includes(b.type) &&
                              plainText(b[b.type]?.rich_text ?? []).toUpperCase().includes('BRIEFING GERAL')
                            )
                            if (briefingGeralIdx === -1) {
                              return (
                                <>
                                  {equipaBox}
                                  <NotionBlocks blocks={otherBlocks} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                                  {cardsGrid}
                                </>
                              )
                            }
                            return (
                              <>
                                <NotionBlocks blocks={otherBlocks.slice(0, briefingGeralIdx)} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                                {equipaBox}
                                <NotionBlocks blocks={[otherBlocks[briefingGeralIdx]]} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
                                {cardsGrid}
                                <NotionBlocks blocks={otherBlocks.slice(briefingGeralIdx + 1)} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />
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
                      const SECTION_META: Record<string, { icon: string; label: string; url: string | undefined }> = {
                        'BLOG':                     { icon: '✍️', label: 'Ver Blog',             url: guiaLinks.blogUrl },
                        'FOTOS CONVIDADOS':          { icon: '📷', label: 'Solicitar Fotos',      url: guiaLinks.fotosConvidadosUrl },
                        'DADOS PARA CONTRATO - CPS': { icon: '📋', label: 'Preencher Dados',      url: guiaLinks.dadosContratoUrl },
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
                                      const url = pageCalloutLinks[cardTitle]
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
                        </>
                      )
                    }
                    if (!isPaymentsPage) {
                      // Check if page has callout cards — render them with URL buttons
                      const pageCalloutLinks = calloutLinks[id as string] ?? {}
                      const calloutCards = findCalloutCards(blocks)
                      if (calloutCards.length === 0) return <NotionBlocks blocks={blocks} hiddenNav={settings.hiddenNav} backUrl={fromId ? `/portal-cliente/${fromId}?title=${encodeURIComponent(fromTitle ?? '')}${refParam ? `&portalRef=${encodeURIComponent(refParam)}` : ''}` : refParam ? `/portal-cliente/ref/${encodeURIComponent(refParam)}` : undefined} />

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
                                const url = pageCalloutLinks[cardTitle]
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
                            <a href="https://tally.so" target="_blank" rel="noopener noreferrer"
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
  )
}

export default function PortalSubPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-950 flex items-center justify-center"><span className="text-white/30 text-xs tracking-widest animate-pulse">A carregar...</span></main>}>
      <PortalSubPageContent />
    </Suspense>
  )
}
