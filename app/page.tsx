'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const IMG_W = 1983
const IMG_H = 793
const LINE_X_PX = 978

export default function BrandSelector() {
  const [leftPct, setLeftPct] = useState(49.32)

  useEffect(() => {
    function recompute() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const imgAspect = IMG_W / IMG_H
      const vAspect   = vw / vh
      let scale: number
      if (imgAspect > vAspect) scale = vh / IMG_H
      else                     scale = vw / IMG_W
      const scaledW  = IMG_W * scale
      const overflow = scaledW - vw
      const lineViewportX = -overflow / 2 + LINE_X_PX * scale
      const pct = Math.max(20, Math.min(80, (lineViewportX / vw) * 100))
      setLeftPct(pct)
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  // Photo Video mantém alinhamento com a linha do fundo
  // RL Prod: ocupa o espaço onde está o seu logo na imagem (~25% fixo)
  // Wedding Mentor: o restante à direita (área escura vazia da imagem)
  const prodPct = 25
  const mentorPct = 100 - leftPct - prodPct

  return (
    <main
      className="relative min-h-screen w-screen overflow-hidden bg-[#1a1410] bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      <div className="absolute inset-0 flex flex-col sm:flex-row">

        {/* ─── RL PHOTO.VIDEO ─────────────────────────────────────── */}
        <Link
          href="/photo"
          aria-label="RL Photo.Video"
          className="relative group cursor-pointer min-h-[33vh] sm:min-h-screen sm:flex-none flex-1"
          style={{ flexBasis: `${leftPct}%` }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Photo.Video</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>

        {/* divisor */}
        <div className="hidden sm:block w-px bg-white/15 self-stretch" />

        {/* ─── RL PROD ────────────────────────────────────────────── */}
        <Link
          href="/media"
          aria-label="RL Prod"
          className="relative group cursor-pointer min-h-[33vh] sm:min-h-screen sm:flex-none flex-1"
          style={{ flexBasis: `${prodPct}%` }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Prod</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>

        {/* divisor */}
        <div className="hidden sm:block w-px bg-white/15 self-stretch" />

        {/* ─── RL WEDDING MENTOR ──────────────────────────────────── */}
        <Link
          href="/wedding-mentor"
          aria-label="RL Wedding Mentor"
          className="relative group cursor-pointer min-h-[33vh] sm:min-h-screen flex-1"
          style={{ flexBasis: `${mentorPct}%` }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

          {/* Logo sobreposto — mesmo estilo da imagem de fundo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
            <div className="w-[4.5rem] h-[5.5rem] flex items-center justify-center border border-[#3d3530]/70 rounded-[50%]">
              <span className="font-serif text-[1.6rem] text-[#3d3530] leading-none tracking-wider">RL</span>
            </div>
            <div className="text-center mt-1">
              <p className="font-serif text-[#3d3530] text-[2rem] tracking-[0.18em] uppercase leading-tight">WEDDING</p>
              <p className="font-serif text-[#3d3530]/70 text-[2rem] tracking-[0.18em] uppercase leading-tight">MENTOR</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-8 h-px bg-[#3d3530]/40" />
              <span className="text-[#3d3530]/60 text-[0.5rem] tracking-[0.45em] uppercase">Educate · Inspire · Elevate</span>
              <span className="w-8 h-px bg-[#3d3530]/40" />
            </div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Wedding Mentor</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>

      </div>
    </main>
  )
}
