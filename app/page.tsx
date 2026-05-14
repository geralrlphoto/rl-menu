'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// Dimensões da imagem de fundo + posição da linha vertical (encontrada via canvas).
const IMG_W = 1983
const IMG_H = 793
const LINE_X_PX = 978 // pixel x do divisor visual na imagem (≈ 49.32%)

export default function BrandSelector() {
  const [leftPct, setLeftPct] = useState(49.32) // fallback antes do JS correr

  useEffect(() => {
    function recompute() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const imgAspect = IMG_W / IMG_H
      const vAspect   = vw / vh
      // bg-cover: imagem cobre o viewport (escala pelo lado limitante)
      let scale: number
      if (imgAspect > vAspect) scale = vh / IMG_H   // viewport "vertical" → escala por altura
      else                     scale = vw / IMG_W   // viewport "horizontal" → escala por largura
      const scaledW  = IMG_W * scale
      const overflow = scaledW - vw                  // pode ser negativo se imagem mais estreita
      // bg-center: imagem deslocada -overflow/2 px à esquerda
      const lineViewportX = -overflow / 2 + LINE_X_PX * scale
      const pct = Math.max(20, Math.min(80, (lineViewportX / vw) * 100))
      setLeftPct(pct)
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  return (
    <main
      className="relative min-h-screen w-screen overflow-hidden bg-[#1a1410] bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      {/* No mobile (col) deixa-se 50/50; em desktop usa flex-basis dinâmico
         para alinhar com a linha vertical do background. */}
      <div className="absolute inset-0 flex flex-col sm:flex-row">

        {/* ─── RL PHOTO.VIDEO (esquerda) ─────────────────────────── */}
        <Link
          href="/photo"
          aria-label="RL Photo.Video"
          className="relative group cursor-pointer min-h-[50vh] sm:min-h-screen sm:flex-none flex-1"
          style={{ flexBasis: `${leftPct}%` }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center sm:justify-start sm:pl-[12%] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Photo.Video</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>

        {/* ─── RL PROD (direita) ─────────────────────────────────── */}
        <Link
          href="/media"
          aria-label="RL Prod"
          className="relative group cursor-pointer min-h-[50vh] sm:min-h-screen flex-1"
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center sm:justify-end sm:pr-[12%] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Prod</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>
      </div>
    </main>
  )
}
