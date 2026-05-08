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

/* ─── helper ──────────────────────────────────────────────────────────────── */
function pageLabel(spread: number, images: SectionImage[]) {
  if (spread === 0) return 'Capa'
  const li = 1 + (spread - 1) * 2
  const ri = li + 1
  const right = images[ri]
  return right ? `p. ${li}–${ri}` : `p. ${li}`
}

/* ─── component ───────────────────────────────────────────────────────────── */
export default function MagazineViewer({ images: init, sectionId, isAdmin }: Props) {
  const [images,    setImages]    = useState(init)
  const [spread,    setSpread]    = useState(0)
  const [visible,   setVisible]   = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── derived ── */
  const totalSpreads = images.length <= 1
    ? 0
    : Math.ceil((images.length - 1) / 2)

  function spreadImages(s: number): [SectionImage | null, SectionImage | null] {
    if (s === 0) return [images[0] ?? null, null]
    const li = 1 + (s - 1) * 2
    return [images[li] ?? null, images[li + 1] ?? null]
  }

  /* ── navigation ── */
  function navigate(next: number) {
    if (navigating || next < 0 || next > totalSpreads) return
    setNavigating(true)
    setVisible(false)
    setTimeout(() => {
      setSpread(next)
      setVisible(true)
      setNavigating(false)
    }, 280)
  }

  /* ── upload ── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('sectionId', sectionId)
      const res = await fetch('/api/section-images', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).error || 'Upload falhou')
      }
      const newImg = await res.json()
      setImages(prev => [...prev, newImg])
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /* ── delete ── */
  async function handleDelete(img: SectionImage) {
    if (!confirm('Eliminar esta imagem?')) return
    setDeletingId(img.id)
    try {
      const res = await fetch('/api/section-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: img.id }),
      })
      if (!res.ok) throw new Error('Falhou')
      const next = images.filter(i => i.id !== img.id)
      setImages(next)
      const newTotal = next.length <= 1 ? 0 : Math.ceil((next.length - 1) / 2)
      if (spread > newTotal) navigate(0)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  /* ── render ── */
  const [leftImg, rightImg] = spreadImages(spread)
  const isCover = spread === 0

  /* shared delete btn */
  const DelBtn = ({ img, pos }: { img: SectionImage; pos: 'tl' | 'tr' }) => (
    <button
      onClick={() => handleDelete(img)}
      disabled={deletingId === img.id}
      className={`
        absolute ${pos === 'tl' ? 'top-3 left-3' : 'top-3 right-3'} z-20
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        bg-black/60 hover:bg-red-900/80 backdrop-blur-sm
        text-white/50 hover:text-white
        text-[8px] tracking-[0.25em] px-2.5 py-1.5
        border border-white/[0.08] hover:border-red-500/30
        uppercase
      `}
    >
      {deletingId === img.id ? '···' : '✕ Eliminar'}
    </button>
  )

  return (
    <div className="w-full mb-14">

      {/* ─── Magazine frame ─────────────────────────────────────────────────── */}
      <div
        className="relative max-w-5xl mx-auto border border-white/[0.07]"
        style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.75), 0 6px 24px rgba(0,0,0,0.5)' }}
      >

        {/* faded spread area */}
        <div
          style={{
            height: '62vh',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.28s ease',
          }}
          className="relative overflow-hidden"
        >
          {isCover ? (

            /* ── COVER ── */
            <div className="flex items-stretch justify-center w-full h-full bg-[#030507]">
              {leftImg ? (
                <div className="relative w-full max-w-lg h-full group mx-auto">
                  <img
                    src={leftImg.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {/* vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 28%, transparent 68%, rgba(0,0,0,0.45) 100%)',
                    }}
                  />
                  {/* capa label */}
                  <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
                    <span className="text-[7px] tracking-[0.75em] text-white/25 uppercase">Capa</span>
                  </div>
                  {isAdmin && <DelBtn img={leftImg} pos="tr" />}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full text-white/15 text-[10px] tracking-[0.5em] uppercase">
                  Sem capa · Adicione uma foto
                </div>
              )}
            </div>

          ) : (

            /* ── DOUBLE SPREAD ── */
            <div className="flex w-full h-full">

              {/* Left page */}
              <div className="relative flex-1 h-full group overflow-hidden bg-[#040709]">
                {leftImg ? (
                  <>
                    <img
                      src={leftImg.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {/* spine shadow (right edge of left page) */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.10) 60%, transparent 100%)',
                      }}
                    />
                    {isAdmin && <DelBtn img={leftImg} pos="tr" />}
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white/10 text-[9px] tracking-[0.5em] uppercase select-none">
                    —
                  </div>
                )}
              </div>

              {/* Spine */}
              <div
                className="w-[3px] shrink-0 z-10"
                style={{
                  background:
                    'linear-gradient(to bottom, #060b10, #0d1620, #060b10)',
                  boxShadow: '0 0 12px rgba(0,0,0,0.8)',
                }}
              />

              {/* Right page */}
              <div className="relative flex-1 h-full group overflow-hidden bg-[#050a0e]">
                {rightImg ? (
                  <>
                    <img
                      src={rightImg.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {/* spine shadow (left edge of right page) */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.10) 60%, transparent 100%)',
                      }}
                    />
                    {isAdmin && <DelBtn img={rightImg} pos="tl" />}
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white/10 text-[9px] tracking-[0.5em] uppercase select-none">
                    —
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── In-frame arrows (overlay on image) ── */}
          <button
            onClick={() => navigate(spread - 1)}
            disabled={spread === 0 || navigating}
            className="
              absolute left-3 top-1/2 -translate-y-1/2 z-30
              w-10 h-10 flex items-center justify-center
              bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
              border border-white/[0.06] hover:border-white/20
              text-white/40 hover:text-white
              disabled:opacity-0 disabled:pointer-events-none
              transition-all duration-200 text-2xl leading-none
            "
            aria-label="Página anterior"
          >
            ‹
          </button>

          <button
            onClick={() => navigate(spread + 1)}
            disabled={spread === totalSpreads || navigating}
            className="
              absolute right-3 top-1/2 -translate-y-1/2 z-30
              w-10 h-10 flex items-center justify-center
              bg-black/25 hover:bg-black/55 backdrop-blur-[2px]
              border border-white/[0.06] hover:border-white/20
              text-white/40 hover:text-white
              disabled:opacity-0 disabled:pointer-events-none
              transition-all duration-200 text-2xl leading-none
            "
            aria-label="Página seguinte"
          >
            ›
          </button>
        </div>

        {/* bottom strip with page indicator */}
        <div
          className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.05]"
          style={{ background: '#020406' }}
        >
          <span className="text-[8px] tracking-[0.55em] text-white/20 uppercase min-w-[60px]">
            {pageLabel(spread, images)}
          </span>

          {/* dot indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpreads + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i)}
                aria-label={`Ir para ${i === 0 ? 'capa' : `spread ${i}`}`}
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

      {/* ─── Admin upload ────────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="max-w-5xl mx-auto mt-4 flex items-center justify-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="
              flex items-center gap-2.5 px-5 py-2.5
              border border-white/[0.12] hover:border-white/30
              bg-white/[0.03] hover:bg-white/[0.07]
              text-[9px] tracking-[0.5em] text-white/35 hover:text-white/65
              uppercase transition-all duration-200
            "
          >
            {uploading ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-white/30 animate-pulse" />
                A carregar…
              </>
            ) : (
              <>
                <span className="text-[13px] leading-none text-white/25">+</span>
                Adicionar Foto
              </>
            )}
          </button>

          <span className="text-[7px] tracking-[0.3em] text-white/15 uppercase">
            A 1ª foto será a capa
          </span>
        </div>
      )}
    </div>
  )
}
