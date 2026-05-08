'use client'

import { useState, useRef } from 'react'

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
const DUR = '0.75s'
const EASE = 'cubic-bezier(0.42, 0, 0.58, 1)'

/* ─── component ───────────────────────────────────────────────────────────── */
export default function MagazineViewer({ images: init, sectionId, isAdmin }: Props) {
  const [images,    setImages]    = useState(init)
  const [spread,    setSpread]    = useState(0)
  const [flip,      setFlip]      = useState<Flip>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalSpreads = images.length <= 1 ? 0 : Math.ceil((images.length - 1) / 2)

  /* ── navigation ─────────────────────────────────────────────────────────── */
  function navigate(next: number) {
    if (flip !== null || next < 0 || next > totalSpreads) return
    setFlip({ dir: next > spread ? 'fwd' : 'bwd', from: spread, to: next })
    setTimeout(() => { setSpread(next); setFlip(null) }, 760)
  }

  /* ── upload / delete ─────────────────────────────────────────────────────── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('sectionId', sectionId)
      const res = await fetch('/api/section-images', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Upload falhou')
      setImages(p => [...p, await res.json()])
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
    } catch { alert('Erro ao eliminar') }
    finally { setDeletingId(null) }
  }

  /* ── derived ─────────────────────────────────────────────────────────────── */
  const [curL, curR] = getPages(spread, images)
  const isCover = spread === 0

  // flip pages
  const fFromL = flip ? getPages(flip.from, images)[0] : null
  const fFromR = flip ? getPages(flip.from, images)[1] : null
  const fToL   = flip ? getPages(flip.to,   images)[0] : null
  const fToR   = flip ? getPages(flip.to,   images)[1] : null
  const fFromIsCover = flip?.from === 0
  const fToIsCover   = flip?.to   === 0

  /* ── render helpers (inlined JSX, no inner FC) ───────────────────────────── */
  const spine = (
    <div className="w-[3px] shrink-0" style={{ background: SPINE_CSS, boxShadow: '0 0 14px rgba(0,0,0,0.9)', zIndex: 10 }} />
  )

  function imgEl(img: SectionImage | null, objectFit = 'object-cover') {
    if (!img) return null
    return <img src={img.image_url} alt="" className={`w-full h-full ${objectFit}`} draggable={false} />
  }

  function delBtn(img: SectionImage, side: 'l' | 'r') {
    if (!isAdmin) return null
    return (
      <button
        onClick={() => handleDelete(img)} disabled={deletingId === img.id}
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
      <div className="relative flex-1 h-full overflow-hidden group" style={{ background: '#040810' }}>
        {imgEl(img)}
        <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
        {img && delBtn(img, 'l')}
      </div>
    )
  }

  function rightHalf(img: SectionImage | null) {
    return (
      <div className="relative flex-1 h-full overflow-hidden group" style={{ background: '#050a12' }}>
        {imgEl(img)}
        <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
        {img && delBtn(img, 'r')}
      </div>
    )
  }

  /* ── full render ─────────────────────────────────────────────────────────── */
  return (
    <div className="w-full mb-14">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pgFwd {
          0%   { transform: rotateY(0deg);    box-shadow: -4px 0 10px rgba(0,0,0,0.4); }
          40%  { box-shadow: -20px 0 40px rgba(0,0,0,0.85); }
          100% { transform: rotateY(-180deg); box-shadow:  4px 0 10px rgba(0,0,0,0.4); }
        }
        @keyframes pgBwd {
          0%   { transform: rotateY(0deg);   box-shadow:  4px 0 10px rgba(0,0,0,0.4); }
          40%  { box-shadow: 20px 0 40px rgba(0,0,0,0.85); }
          100% { transform: rotateY(180deg); box-shadow: -4px 0 10px rgba(0,0,0,0.4); }
        }
      `}</style>

      <div
        className="relative max-w-5xl mx-auto border border-white/[0.07]"
        style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.75), 0 6px 24px rgba(0,0,0,0.5)' }}
      >
        {/* ─── Magazine viewport ─── */}
        <div
          className="relative overflow-hidden"
          style={{ height: '62vh', perspective: '2400px', perspectiveOrigin: '50% 50%' }}
        >

          {/* ══════════════ STATIC (no flip) ══════════════ */}
          {!flip && isCover && (
            <div className="absolute inset-0 flex" style={{ background: '#030507' }}>
              {/* left half: dark */}
              <div className="flex-1 h-full" style={{ background: '#030507' }} />
              {spine}
              {/* right half: cover */}
              <div className="relative flex-1 h-full overflow-hidden group" style={{ background: '#030507' }}>
                {curL ? (
                  <>
                    <img src={curL.image_url} alt="" className="w-full h-full object-cover" draggable={false} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 22%, transparent 70%, rgba(0,0,0,0.45) 100%)'
                    }} />
                    <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
                      <span className="text-[7px] tracking-[0.75em] text-white/25 uppercase">Capa</span>
                    </div>
                    {delBtn(curL, 'r')}
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

          {/* ══════════════ FORWARD FLIP ══════════════ */}
          {flip?.dir === 'fwd' && (
            <>
              {/* z=0 base: full destination spread */}
              <div className="absolute inset-0 flex" style={{ zIndex: 0 }}>
                {/* destination left half */}
                <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#040810' }}>
                  {fToL && !fToIsCover && imgEl(fToL)}
                  <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
                </div>
                {spine}
                {/* destination right half */}
                <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#050a12' }}>
                  {fToR && imgEl(fToR)}
                  <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
                </div>
              </div>

              {/* z=1: source LEFT half stays (doesn't flip) */}
              <div
                className="absolute top-0 left-0 bottom-0 overflow-hidden"
                style={{ width: 'calc(50% - 1.5px)', background: '#040810', zIndex: 1 }}
              >
                {fFromL && !fFromIsCover && imgEl(fFromL)}
                <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
              </div>

              {/* z=5: the flipping page (source right → dest left) */}
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left: 'calc(50% + 1.5px)',
                  width: 'calc(50% - 1.5px)',
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'left center',
                  animation: `pgFwd ${DUR} ${EASE} forwards`,
                  zIndex: 5,
                }}
              >
                {/* FRONT: source right page (or cover) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: '#050a12' }}
                >
                  {fFromIsCover
                    ? (fFromL && imgEl(fFromL))
                    : (fFromR && imgEl(fFromR))
                  }
                  {/* gradient at left edge (spine side) */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                </div>
                {/* BACK: destination left page */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#040810',
                  }}
                >
                  {fToL && !fToIsCover && imgEl(fToL)}
                  <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                    style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                </div>
              </div>
            </>
          )}

          {/* ══════════════ BACKWARD FLIP ══════════════ */}
          {flip?.dir === 'bwd' && (
            <>
              {/* z=0 base: full destination spread */}
              <div className="absolute inset-0 flex" style={{ zIndex: 0 }}>
                <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#040810' }}>
                  {fToIsCover ? null : (fToL && imgEl(fToL))}
                  <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SL }} />
                </div>
                {spine}
                <div className="relative flex-1 h-full overflow-hidden" style={{ background: '#050a12' }}>
                  {fToIsCover
                    ? (fToL && imgEl(fToL))   /* cover shows on right half */
                    : (fToR && imgEl(fToR))
                  }
                  <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
                </div>
              </div>

              {/* z=1: source RIGHT half stays */}
              <div
                className="absolute top-0 right-0 bottom-0 overflow-hidden"
                style={{ width: 'calc(50% - 1.5px)', background: '#050a12', zIndex: 1 }}
              >
                {fFromR && imgEl(fFromR)}
                <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none" style={{ background: SR }} />
              </div>

              {/* z=5: the flipping page (source left → dest right) */}
              <div
                className="absolute top-0 bottom-0"
                style={{
                  right: 'calc(50% + 1.5px)',
                  width: 'calc(50% - 1.5px)',
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'right center',
                  animation: `pgBwd ${DUR} ${EASE} forwards`,
                  zIndex: 5,
                }}
              >
                {/* FRONT: source left page */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: '#040810' }}
                >
                  {fFromL && imgEl(fFromL)}
                  <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
                    style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                </div>
                {/* BACK: destination right page (or cover) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#050a12',
                  }}
                >
                  {fToIsCover
                    ? (fToL && imgEl(fToL))
                    : (fToR && imgEl(fToR))
                  }
                  <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 100%)' }} />
                </div>
              </div>
            </>
          )}

          {/* ─── Navigation arrows ─── */}
          <button
            onClick={() => navigate(spread - 1)}
            disabled={spread === 0 || !!flip}
            aria-label="Página anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30
              w-10 h-10 flex items-center justify-center text-2xl leading-none
              bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
              border border-white/[0.06] hover:border-white/20
              text-white/40 hover:text-white
              disabled:opacity-0 disabled:pointer-events-none
              transition-all duration-200"
          >‹</button>

          <button
            onClick={() => navigate(spread + 1)}
            disabled={spread === totalSpreads || !!flip}
            aria-label="Página seguinte"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30
              w-10 h-10 flex items-center justify-center text-2xl leading-none
              bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
              border border-white/[0.06] hover:border-white/20
              text-white/40 hover:text-white
              disabled:opacity-0 disabled:pointer-events-none
              transition-all duration-200"
          >›</button>
        </div>

        {/* ─── Bottom strip ─── */}
        <div
          className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.05]"
          style={{ background: '#020406' }}
        >
          <span className="text-[8px] tracking-[0.55em] text-white/20 uppercase min-w-[60px]">
            {pageLabel(spread, images)}
          </span>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpreads + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === spread
                    ? 'w-4 h-[3px] bg-white/50'
                    : 'w-[5px] h-[5px] bg-white/15 hover:bg-white/35'
                }`}
              />
            ))}
          </div>

          <span className="text-[8px] tracking-[0.4em] text-white/15 uppercase min-w-[60px] text-right">
            {images.length} {images.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>
      </div>

      {/* ─── Admin upload ─── */}
      {isAdmin && (
        <div className="max-w-5xl mx-auto mt-4 flex items-center justify-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2.5 px-5 py-2.5
              border border-white/[0.12] hover:border-white/30
              bg-white/[0.03] hover:bg-white/[0.07]
              text-[9px] tracking-[0.5em] text-white/35 hover:text-white/65
              uppercase transition-all duration-200"
          >
            {uploading
              ? <><span className="inline-block w-2 h-2 rounded-full bg-white/30 animate-pulse" /> A carregar…</>
              : <><span className="text-[13px] leading-none text-white/25">+</span> Adicionar Foto</>
            }
          </button>
          <span className="text-[7px] tracking-[0.3em] text-white/15 uppercase">A 1ª foto = capa</span>
        </div>
      )}
    </div>
  )
}
