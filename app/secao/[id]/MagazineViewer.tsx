'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type SectionImage = {
  id: string
  section_id: string
  image_url: string
  link_url: string | null
  order_index: number
  column_index?: number
}

type Props = {
  images: SectionImage[]
  sectionId: string
  isAdmin: boolean
}

type Flip = { dir: 'fwd' | 'bwd'; from: number; to: number } | null

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function getPages(s: number, imgs: SectionImage[]): [SectionImage | null, SectionImage | null] {
  if (s === 0) return [imgs[0] ?? null, null]
  const li = 1 + (s - 1) * 2
  return [imgs[li] ?? null, imgs[li + 1] ?? null]
}
function pageLabel(s: number, imgs: SectionImage[]) {
  if (s === 0) return 'Capa'
  const li = 1 + (s - 1) * 2
  return imgs[li + 1] ? `p. ${li}–${li + 1}` : `p. ${li}`
}
const SL = 'linear-gradient(to left,  rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)'
const SR = 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)'
const SPINE_CSS = 'linear-gradient(to bottom, #050810, #0d1520, #050810)'
const DUR  = '0.75s'
const EASE = 'cubic-bezier(0.42, 0, 0.58, 1)'

/* ─── component ───────────────────────────────────────────────────────────── */
export default function MagazineViewer({ images: init, sectionId, isAdmin }: Props) {
  const [images,    setImages]    = useState(init)
  const [spread,    setSpread]    = useState(0)
  const [mobilePg,  setMobilePg]  = useState(0)
  const [mFading,   setMFading]   = useState(false)
  const [flip,      setFlip]      = useState<Flip>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── reorder mode ────────────────────────────────────────────────────────── */
  const [copied,       setCopied]       = useState(false)

  /* ── lightbox ────────────────────────────────────────────────────────────── */
  const [lbIdx,    setLbIdx]    = useState<number | null>(null)  // index in images[]
  const [zoom,     setZoom]     = useState(1)
  const [pan,      setPan]      = useState({ x: 0, y: 0 })
  const [panning,  setPanning]  = useState(false)
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const lbRef    = useRef<HTMLDivElement>(null)

  const resetLb = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  function openLightbox(img: SectionImage) {
    const idx = images.findIndex(i => i.id === img.id)
    if (idx < 0) return
    setLbIdx(idx); setZoom(1); setPan({ x: 0, y: 0 })
  }
  function closeLightbox() { setLbIdx(null); setZoom(1); setPan({ x: 0, y: 0 }) }

  /* wheel zoom — passive:false required */
  useEffect(() => {
    if (lbIdx === null || !lbRef.current) return
    const el = lbRef.current
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      setZoom(z => {
        const nz = Math.max(0.8, Math.min(7, z * factor))
        const cx = e.clientX - rect.left - rect.width  / 2
        const cy = e.clientY - rect.top  - rect.height / 2
        setPan(p => ({ x: cx + (p.x - cx) * (nz / z), y: cy + (p.y - cy) * (nz / z) }))
        return nz
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [lbIdx])

  /* keyboard navigation */
  useEffect(() => {
    if (lbIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeLightbox(); return }
      if (e.key === 'ArrowLeft'  && lbIdx > 0)                    { setLbIdx(lbIdx - 1); resetLb() }
      if (e.key === 'ArrowRight' && lbIdx < images.length - 1)    { setLbIdx(lbIdx + 1); resetLb() }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(7, z * 1.2))
      if (e.key === '-')                  setZoom(z => Math.max(0.8, z / 1.2))
      if (e.key === '0')                  resetLb()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lbIdx, images.length, resetLb])

  function lbMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    setPanning(true)
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
  }
  function lbMouseMove(e: React.MouseEvent) {
    if (!panning) return
    setPan({ x: panStart.current.px + e.clientX - panStart.current.mx,
              y: panStart.current.py + e.clientY - panStart.current.my })
  }
  function lbMouseUp() { setPanning(false) }

  const [reordering,   setReordering]   = useState(false)
  const [reorderImgs,  setReorderImgs]  = useState<SectionImage[]>([])
  const [savingOrder,  setSavingOrder]  = useState(false)
  const [dragIdx,      setDragIdx]      = useState<number | null>(null)
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null)
  const [tapSelected,  setTapSelected]  = useState<number | null>(null)  // mobile tap-to-swap

  function startReorder() {
    setReorderImgs([...images])
    setReordering(true)
    setTapSelected(null)
  }
  function cancelReorder() {
    setReordering(false); setDragIdx(null); setDragOverIdx(null); setTapSelected(null)
  }

  /* drag-and-drop (desktop) */
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOverIdx(i) }
  function onDrop(dropIdx: number) {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...reorderImgs]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    setReorderImgs(next); setDragIdx(null); setDragOverIdx(null)
  }

  /* tap-to-swap (mobile & desktop click) */
  function onTap(i: number) {
    if (tapSelected === null) { setTapSelected(i); return }
    if (tapSelected === i)    { setTapSelected(null); return }
    const next = [...reorderImgs];
    [next[tapSelected], next[i]] = [next[i], next[tapSelected]]
    setReorderImgs(next); setTapSelected(null)
  }

  async function saveOrder() {
    setSavingOrder(true)
    try {
      const updates = reorderImgs.map((img, i) => ({ id: img.id, order_index: i }))
      const res = await fetch('/api/section-images', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error()
      const sorted = reorderImgs.map((img, i) => ({ ...img, order_index: i }))
      setImages(sorted); setSpread(0); setMobilePg(0); setReordering(false)
    } catch { alert('Erro ao guardar ordem') }
    finally { setSavingOrder(false) }
  }

  const totalSpreads = images.length <= 1 ? 0 : Math.ceil((images.length - 1) / 2)

  /* ── desktop navigation ──────────────────────────────────────────────────── */
  function navigate(next: number) {
    if (flip !== null || next < 0 || next > totalSpreads) return
    setFlip({ dir: next > spread ? 'fwd' : 'bwd', from: spread, to: next })
    setTimeout(() => { setSpread(next); setFlip(null) }, 760)
  }

  /* ── mobile navigation ───────────────────────────────────────────────────── */
  function mNavigate(next: number) {
    if (mFading || next < 0 || next >= images.length) return
    setMFading(true)
    setTimeout(() => { setMobilePg(next); setMFading(false) }, 220)
  }

  /* ── upload / delete ─────────────────────────────────────────────────────── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('sectionId', sectionId)
      const res = await fetch('/api/section-images', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Upload falhou')
      const row = await res.json()
      setImages(p => [...p, row])
    } catch (err: any) { alert(`Erro: ${err.message}`) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function handleDelete(img: SectionImage) {
    if (!confirm('Eliminar esta imagem?')) return
    setDeletingId(img.id)
    try {
      const res = await fetch('/api/section-images', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: img.id }),
      })
      if (!res.ok) throw new Error()
      const next = images.filter(i => i.id !== img.id)
      setImages(next)
      const newTotal = next.length <= 1 ? 0 : Math.ceil((next.length - 1) / 2)
      if (spread > newTotal) { setSpread(0); setFlip(null) }
      if (mobilePg >= next.length) setMobilePg(Math.max(0, next.length - 1))
    } catch { alert('Erro ao eliminar') }
    finally { setDeletingId(null) }
  }

  /* ── derived ─────────────────────────────────────────────────────────────── */
  const [curL, curR] = getPages(spread, images)
  const isCover = spread === 0

  const fFromL = flip ? getPages(flip.from, images)[0] : null
  const fFromR = flip ? getPages(flip.from, images)[1] : null
  const fToL   = flip ? getPages(flip.to,   images)[0] : null
  const fToR   = flip ? getPages(flip.to,   images)[1] : null
  const fFromIsCover = flip?.from === 0
  const fToIsCover   = flip?.to   === 0

  /* ── render helpers ──────────────────────────────────────────────────────── */
  const spine = (
    <div className="w-[3px] shrink-0 relative z-10"
      style={{ background: SPINE_CSS, boxShadow: '0 0 14px rgba(0,0,0,0.9)' }} />
  )

  /* object-contain = no cropping; dark bg shows letterbox/pillarbox */
  function imgEl(img: SectionImage | null) {
    if (!img) return null
    return <img src={img.image_url} alt="" className="w-full h-full object-contain" draggable={false} />
  }

  function delBtn(img: SectionImage, side: 'l' | 'r') {
    if (!isAdmin) return null
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(img) }}
        disabled={deletingId === img.id}
        className={`absolute ${side === 'l' ? 'top-3 right-3' : 'top-3 left-3'} z-20
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          bg-black/60 hover:bg-red-900/80 backdrop-blur-sm text-white/50 hover:text-white
          text-[8px] tracking-[0.25em] px-2.5 py-1.5 border border-white/[0.08]
          hover:border-red-500/30 uppercase`}
      >
        {deletingId === img.id ? '···' : '✕ Eliminar'}
      </button>
    )
  }

  function leftHalf(img: SectionImage | null) {
    return (
      <div
        className="relative flex-1 h-full overflow-hidden group"
        style={{ background: '#040810', cursor: img ? 'zoom-in' : 'default' }}
        onClick={() => img && openLightbox(img)}
      >
        {imgEl(img)}
        <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
        {img && delBtn(img, 'l')}
      </div>
    )
  }
  function rightHalf(img: SectionImage | null) {
    return (
      <div
        className="relative flex-1 h-full overflow-hidden group"
        style={{ background: '#050a12', cursor: img ? 'zoom-in' : 'default' }}
        onClick={() => img && openLightbox(img)}
      >
        {imgEl(img)}
        <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
        {img && delBtn(img, 'r')}
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */

  /* ── REORDER MODE ── */
  if (reordering) {
    return (
      <div className="w-full mb-14">
        {/* header bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border border-white/[0.07] mb-px"
          style={{ background: '#020406', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          <div>
            <p className="text-[9px] tracking-[0.5em] text-white/70 uppercase font-medium">Dispor Revista</p>
            <p className="text-[7px] tracking-[0.3em] text-white/25 uppercase mt-0.5 hidden sm:block">
              Arrasta para reordenar · Toca numa foto e depois noutra para trocar
            </p>
            <p className="text-[7px] tracking-[0.3em] text-white/25 uppercase mt-0.5 sm:hidden">
              Toca numa foto e depois noutra para trocar posições
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelReorder}
              className="px-4 py-2 text-[8px] tracking-[0.4em] text-white/35 hover:text-white/60
                border border-white/[0.1] hover:border-white/25 uppercase transition-all duration-200"
            >Cancelar</button>
            <button
              onClick={saveOrder} disabled={savingOrder}
              className="px-4 py-2 text-[8px] tracking-[0.4em] text-emerald-400/80 hover:text-emerald-300
                border border-emerald-400/30 hover:border-emerald-400/60
                bg-emerald-400/[0.05] hover:bg-emerald-400/[0.10]
                uppercase transition-all duration-200 disabled:opacity-50"
            >
              {savingOrder ? 'A guardar…' : '✓ Guardar Ordem'}
            </button>
          </div>
        </div>

        {/* layout guide */}
        <div className="px-5 py-2 border border-t-0 border-white/[0.05] mb-4"
          style={{ background: '#03060a' }}>
          <p className="text-[7px] tracking-[0.4em] text-white/20 uppercase">
            Pos. 1 = Capa &nbsp;·&nbsp; Pos. 2+3 = 1ª folha dupla &nbsp;·&nbsp; Pos. 4+5 = 2ª folha dupla
          </p>
        </div>

        {/* thumbnail grid */}
        <div
          className="grid gap-2 p-4 border border-white/[0.07]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            background: '#030608',
          }}
        >
          {reorderImgs.map((img, i) => {
            const isSelected  = tapSelected === i
            const isDragging  = dragIdx === i
            const isDragOver  = dragOverIdx === i && dragIdx !== i

            return (
              <div
                key={img.id}
                draggable
                onDragStart={() => { setDragIdx(i); setTapSelected(null) }}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                onClick={() => onTap(i)}
                className={`relative cursor-pointer select-none transition-all duration-150 ${
                  isSelected  ? 'ring-2 ring-white/70 scale-[1.04] z-10' :
                  isDragOver  ? 'ring-2 ring-blue-400/70 scale-[1.03]' :
                  isDragging  ? 'opacity-40 scale-95' :
                  'hover:ring-1 hover:ring-white/30 hover:scale-[1.02]'
                }`}
                style={{ aspectRatio: '2/3', background: '#060c14' }}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-contain" draggable={false} />

                {/* position badge */}
                <div className="absolute top-1.5 left-1.5 bg-black/75 px-1.5 py-0.5 backdrop-blur-sm">
                  <span className="text-[7px] tracking-[0.3em] text-white/80 uppercase font-medium">
                    {i === 0 ? 'Capa' : `p.${i}`}
                  </span>
                </div>

                {/* spread pair indicator */}
                {i > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 px-1 py-0.5">
                    <span className="text-[6px] tracking-[0.2em] text-white/35 uppercase">
                      {i % 2 === 1 ? '◧' : '◨'}
                    </span>
                  </div>
                )}

                {/* selected overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-white/[0.08] flex items-end justify-center pb-2">
                    <span className="text-[7px] tracking-[0.3em] text-white/80 uppercase bg-black/60 px-2 py-0.5">
                      Seleccionada
                    </span>
                  </div>
                )}

                {/* drag handle */}
                <div className="absolute top-1.5 right-1.5 text-white/20 text-[10px] hidden sm:block select-none">⠿</div>
              </div>
            )
          })}
        </div>

        {/* spread preview legend */}
        <div className="mt-3 flex flex-wrap gap-3 px-1">
          <span className="text-[7px] tracking-[0.3em] text-white/15 uppercase">◧ página esquerda &nbsp; ◨ página direita da folha dupla</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mb-14">

      {/* ══════════ MOBILE VIEW (< sm) ══════════ */}
      <div className="block sm:hidden">
        <div
          className="relative w-full border border-white/[0.07]"
          style={{
            background: '#030507',
            aspectRatio: '2/3',           /* portrait page */
            maxHeight: '75vh',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          }}
        >
          {/* image */}
          {images.length > 0 ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: mFading ? 0 : 1, transition: 'opacity 0.22s ease' }}
            >
              {images[mobilePg] && (
                <div className="relative w-full h-full group">
                  <img
                    src={images[mobilePg].image_url}
                    alt=""
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* cover label */}
                  {mobilePg === 0 && (
                    <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                      <span className="text-[7px] tracking-[0.7em] text-white/25 uppercase">Capa</span>
                    </div>
                  )}
                  {/* admin delete */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(images[mobilePg])}
                      disabled={deletingId === images[mobilePg].id}
                      className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        bg-black/60 hover:bg-red-900/80 backdrop-blur-sm text-white/50 hover:text-white
                        text-[8px] tracking-[0.25em] px-2.5 py-1.5 border border-white/[0.08] hover:border-red-500/30 uppercase"
                    >
                      {deletingId === images[mobilePg].id ? '···' : '✕'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/15 text-[10px] tracking-[0.5em] uppercase">
              Adicione uma foto
            </div>
          )}

          {/* mobile arrows — large touch targets */}
          <button
            onClick={() => mNavigate(mobilePg - 1)}
            disabled={mobilePg === 0 || mFading}
            aria-label="Anterior"
            className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center z-30
              text-white/30 hover:text-white/70 text-3xl
              disabled:opacity-0 disabled:pointer-events-none transition-colors"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, transparent 100%)' }}
          >‹</button>

          <button
            onClick={() => mNavigate(mobilePg + 1)}
            disabled={mobilePg >= images.length - 1 || mFading}
            aria-label="Seguinte"
            className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center z-30
              text-white/30 hover:text-white/70 text-3xl
              disabled:opacity-0 disabled:pointer-events-none transition-colors"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, transparent 100%)' }}
          >›</button>
        </div>

        {/* mobile bottom strip */}
        <div className="flex items-center justify-between px-4 py-2.5 border border-t-0 border-white/[0.05]"
          style={{ background: '#020406' }}>
          <span className="text-[8px] tracking-[0.5em] text-white/20 uppercase">
            {mobilePg === 0 ? 'Capa' : `p. ${mobilePg}`}
          </span>
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => mNavigate(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === mobilePg ? 'w-4 h-[3px] bg-white/50' : 'w-[5px] h-[5px] bg-white/15'
                }`}
              />
            ))}
          </div>
          <span className="text-[8px] tracking-[0.4em] text-white/15 uppercase">
            {images.length} fotos
          </span>
        </div>
      </div>

      {/* ══════════ DESKTOP VIEW (≥ sm) ══════════ */}
      <div className="hidden sm:block">
        <div
          className="relative max-w-5xl mx-auto border border-white/[0.07]"
          style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.75), 0 6px 24px rgba(0,0,0,0.5)' }}
        >
          {/* Magazine viewport — aspect 3:2 for double-spread, capped at 68vh */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 'min(68vh, 56vw)',   /* 56vw ≈ two portrait pages side-by-side */
              perspective: '2400px',
              perspectiveOrigin: '50% 50%',
            }}
          >

            {/* ── STATIC (no flip) ── */}
            {!flip && isCover && (
              <div className="absolute inset-0 flex" style={{ background: '#030507' }}>
                <div className="flex-1 h-full" style={{ background: '#030507' }} />
                {spine}
                <div
                  className="relative flex-1 h-full overflow-hidden group"
                  style={{ background: '#030507', cursor: curL ? 'zoom-in' : 'default' }}
                  onClick={() => curL && openLightbox(curL)}
                >
                  {curL ? (
                    <>
                      <img src={curL.image_url} alt="" className="w-full h-full object-contain" draggable={false} />
                      <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.45) 100%)'
                      }} />
                      <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
                        <span className="text-[7px] tracking-[0.75em] text-white/25 uppercase">Capa</span>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(curL) }}
                          disabled={deletingId === curL.id}
                          className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            bg-black/60 hover:bg-red-900/80 backdrop-blur-sm text-white/50 hover:text-white
                            text-[8px] tracking-[0.25em] px-2.5 py-1.5 border border-white/[0.08] hover:border-red-500/30 uppercase"
                        >
                          {deletingId === curL.id ? '···' : '✕ Eliminar'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/15 text-[10px] tracking-[0.5em] uppercase">
                      Adicione uma foto
                    </div>
                  )}
                </div>
              </div>
            )}

            {!flip && !isCover && (
              <div className="absolute inset-0 flex">
                {leftHalf(curL)}
                {spine}
                {rightHalf(curR)}
              </div>
            )}

            {/* ── FORWARD FLIP ── */}
            {flip?.dir === 'fwd' && (
              <>
                <div className="absolute inset-0 flex" style={{ zIndex: 0 }}>
                  <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#040810' }}>
                    {fToL && !fToIsCover && imgEl(fToL)}
                    <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
                  </div>
                  {spine}
                  <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#050a12' }}>
                    {fToR && imgEl(fToR)}
                    <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
                  </div>
                </div>

                <div className="absolute top-0 left-0 bottom-0 overflow-hidden"
                  style={{ width: 'calc(50% - 1.5px)', background: '#040810', zIndex: 1 }}>
                  {fFromL && !fFromIsCover && imgEl(fFromL)}
                  <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
                </div>

                <div className="absolute top-0 bottom-0"
                  style={{
                    left: 'calc(50% + 1.5px)', width: 'calc(50% - 1.5px)',
                    transformStyle: 'preserve-3d', transformOrigin: 'left center',
                    animation: `pgFwd ${DUR} ${EASE} forwards`, zIndex: 5,
                  }}>
                  <div className="absolute inset-0 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', background: '#050a12' }}>
                    {fFromIsCover ? (fFromL && imgEl(fFromL)) : (fFromR && imgEl(fFromR))}
                    <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                      style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                  </div>
                  <div className="absolute inset-0 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: '#040810' }}>
                    {fToL && !fToIsCover && imgEl(fToL)}
                    <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                      style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                  </div>
                </div>
              </>
            )}

            {/* ── BACKWARD FLIP ── */}
            {flip?.dir === 'bwd' && (
              <>
                <div className="absolute inset-0 flex" style={{ zIndex: 0 }}>
                  <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#040810' }}>
                    {fToIsCover ? null : (fToL && imgEl(fToL))}
                    <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
                  </div>
                  {spine}
                  <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#050a12' }}>
                    {fToIsCover ? (fToL && imgEl(fToL)) : (fToR && imgEl(fToR))}
                    <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
                  </div>
                </div>

                <div className="absolute top-0 right-0 bottom-0 overflow-hidden"
                  style={{ width: 'calc(50% - 1.5px)', background: '#050a12', zIndex: 1 }}>
                  {fFromR && imgEl(fFromR)}
                  <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
                </div>

                <div className="absolute top-0 bottom-0"
                  style={{
                    right: 'calc(50% + 1.5px)', width: 'calc(50% - 1.5px)',
                    transformStyle: 'preserve-3d', transformOrigin: 'right center',
                    animation: `pgBwd ${DUR} ${EASE} forwards`, zIndex: 5,
                  }}>
                  <div className="absolute inset-0 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', background: '#040810' }}>
                    {fFromL && imgEl(fFromL)}
                    <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                      style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                  </div>
                  <div className="absolute inset-0 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: '#050a12' }}>
                    {fToIsCover ? (fToL && imgEl(fToL)) : (fToR && imgEl(fToR))}
                    <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                      style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                  </div>
                </div>
              </>
            )}

            {/* desktop arrows */}
            <button onClick={() => navigate(spread - 1)} disabled={spread === 0 || !!flip}
              aria-label="Página anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center
                justify-center text-2xl leading-none bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
                border border-white/[0.06] hover:border-white/20 text-white/40 hover:text-white
                disabled:opacity-0 disabled:pointer-events-none transition-all duration-200">‹</button>

            <button onClick={() => navigate(spread + 1)} disabled={spread === totalSpreads || !!flip}
              aria-label="Página seguinte"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center
                justify-center text-2xl leading-none bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
                border border-white/[0.06] hover:border-white/20 text-white/40 hover:text-white
                disabled:opacity-0 disabled:pointer-events-none transition-all duration-200">›</button>
          </div>

          {/* desktop bottom strip */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.05]"
            style={{ background: '#020406' }}>
            <span className="text-[8px] tracking-[0.55em] text-white/20 uppercase min-w-[60px]">
              {pageLabel(spread, images)}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSpreads + 1 }).map((_, i) => (
                <button key={i} onClick={() => navigate(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === spread ? 'w-4 h-[3px] bg-white/50' : 'w-[5px] h-[5px] bg-white/15 hover:bg-white/35'
                  }`} />
              ))}
            </div>
            <span className="text-[8px] tracking-[0.4em] text-white/15 uppercase min-w-[60px] text-right">
              {images.length} {images.length === 1 ? 'foto' : 'fotos'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Admin controls (both views) ─── */}
      {isAdmin && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

          {/* upload */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.12] hover:border-white/30
              bg-white/[0.03] hover:bg-white/[0.07] text-[9px] tracking-[0.45em] text-white/35
              hover:text-white/65 uppercase transition-all duration-200">
            {uploading
              ? <><span className="inline-block w-2 h-2 rounded-full bg-white/30 animate-pulse" />A carregar…</>
              : <><span className="text-[13px] leading-none text-white/25">+</span>Adicionar Foto</>
            }
          </button>

          {/* reorder */}
          {images.length > 1 && (
            <button onClick={startReorder}
              className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.12] hover:border-white/30
                bg-white/[0.03] hover:bg-white/[0.07] text-[9px] tracking-[0.45em] text-white/35
                hover:text-white/65 uppercase transition-all duration-200">
              <span className="text-[11px] leading-none text-white/25">⇅</span>Dispor Páginas
            </button>
          )}

          {/* copy presentation link */}
          {images.length > 0 && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/apresentacao/${sectionId}`
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2200)
                })
              }}
              className={`flex items-center gap-2 px-4 py-2.5 border uppercase transition-all duration-200 text-[9px] tracking-[0.45em] ${
                copied
                  ? 'border-emerald-400/40 bg-emerald-400/[0.07] text-emerald-400/80'
                  : 'border-white/[0.12] hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.07] text-white/35 hover:text-white/65'
              }`}
            >
              <span className="text-[11px] leading-none" style={{ opacity: 0.5 }}>
                {copied ? '✓' : '⎘'}
              </span>
              {copied ? 'Link Copiado!' : 'Copiar Link Apresentação'}
            </button>
          )}

          <span className="text-[7px] tracking-[0.3em] text-white/12 uppercase w-full text-center mt-0.5">
            A 1ª foto = capa
          </span>
        </div>
      )}

      {/* ════════ LIGHTBOX ════════ */}
      {lbIdx !== null && images[lbIdx] && (
        <div
          ref={lbRef}
          className="fixed inset-0 z-[999] select-none"
          style={{
            background: 'rgba(0,0,0,0.97)',
            cursor: zoom > 1 ? (panning ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onMouseDown={lbMouseDown}
          onMouseMove={lbMouseMove}
          onMouseUp={lbMouseUp}
          onMouseLeave={lbMouseUp}
          onDoubleClick={resetLb}
        >
          {/* image */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <img
              src={images[lbIdx].image_url}
              alt=""
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: panning ? 'none' : 'transform 0.1s ease',
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* top bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
          >
            <span className="text-[8px] tracking-[0.5em] text-white/35 uppercase">
              {lbIdx === 0 ? 'Capa' : `Foto ${lbIdx}`}
              {' · '}{images.length} fotos
              {zoom !== 1 && ` · ${Math.round(zoom * 100)}%`}
            </span>
            <button
              onClick={closeLightbox}
              className="pointer-events-auto text-white/40 hover:text-white text-xl w-10 h-10 flex items-center justify-center transition-colors"
            >✕</button>
          </div>

          {/* prev / next */}
          {lbIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLbIdx(lbIdx - 1); resetLb() }}
              className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 flex items-center justify-center text-2xl
                bg-black/40 hover:bg-black/70 border border-white/[0.12] hover:border-white/35
                text-white/45 hover:text-white transition-all duration-200"
            >‹</button>
          )}
          {lbIdx < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLbIdx(lbIdx + 1); resetLb() }}
              className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 z-10
                w-12 h-12 flex items-center justify-center text-2xl
                bg-black/40 hover:bg-black/70 border border-white/[0.12] hover:border-white/35
                text-white/45 hover:text-white transition-all duration-200"
            >›</button>
          )}

          {/* zoom controls + hint */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 pb-5 z-10"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
            {zoom <= 1 && (
              <p className="text-[7px] tracking-[0.45em] text-white/18 uppercase pointer-events-none">
                Scroll para zoom · Arrastar para mover · Duplo-clique para reset · Esc para fechar
              </p>
            )}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.8, z / 1.3)) }}
                className="w-9 h-9 flex items-center justify-center text-lg border border-white/15 hover:border-white/40 bg-black/50 text-white/50 hover:text-white transition-all">−</button>
              <button onClick={(e) => { e.stopPropagation(); resetLb() }}
                className="px-3 h-9 text-[8px] tracking-[0.35em] uppercase border border-white/15 hover:border-white/40 bg-black/50 text-white/40 hover:text-white transition-all">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(7, z * 1.3)) }}
                className="w-9 h-9 flex items-center justify-center text-lg border border-white/15 hover:border-white/40 bg-black/50 text-white/50 hover:text-white transition-all">+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
