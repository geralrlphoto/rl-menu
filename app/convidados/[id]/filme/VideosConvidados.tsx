'use client'

/* Vídeos para os convidados: cada vídeo com a sua capa e um play que abre o
   leitor ali mesmo (Vimeo/YouTube, sem gastar o nosso tráfego). */

import { useEffect, useState } from 'react'
import { embedDe } from '@/lib/videoEmbed'

export type VideoConvidado = { key: string; titulo: string; legenda: string; url: string }

const G = '#d8be93'

export default function VideosConvidados({ videos, capaFallback }: { videos: VideoConvidado[]; capaFallback?: string | null }) {
  const [capas, setCapas] = useState<Record<string, string>>({})
  const [aTocar, setATocar] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    Promise.all(videos.map(async v => {
      try {
        const d = await fetch(`/api/link-preview?url=${encodeURIComponent(v.url)}`).then(r => r.json())
        return d?.image ? [v.key, String(d.image).replace(/&amp;/g, '&')] as const : null
      } catch { return null }
    })).then(rows => {
      if (!vivo) return
      const next: Record<string, string> = {}
      for (const r of rows) if (r) next[r[0]] = r[1]
      setCapas(next)
    })
    return () => { vivo = false }
  }, [videos])

  return (
    <div className="flex flex-col gap-6">
      {videos.map((v, i) => {
        const src = embedDe(v.url)
        const capa = capas[v.key] || capaFallback || null
        const principal = i === 0
        return (
          <article key={v.key} id={v.key}
            className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#141414] transition-all duration-300 hover:border-[#d8be93]/45 hover:shadow-[0_0_40px_-18px_rgba(216,190,147,0.6)]"
            style={{ borderLeft: '2px solid rgba(216,190,147,0.6)' }}>
            <div className="relative aspect-video bg-black">
              {aTocar === v.key && src ? (
                <iframe src={src} title={v.titulo} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
              ) : (
                <button type="button" className="group absolute inset-0 w-full"
                  onClick={() => src ? setATocar(v.key) : window.open(v.url, '_blank', 'noopener')}
                  aria-label={`Ver ${v.titulo}`}>
                  {capa && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capa} alt="" className="absolute inset-0 h-full w-full object-cover grayscale-[50%] opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100" />
                  )}
                  <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,11,11,.9), rgba(11,11,11,.15) 60%)' }} />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#d8be93]/70 bg-black/40 backdrop-blur-md transition-transform group-hover:scale-110"
                    style={{ boxShadow: '0 0 40px -10px rgba(216,190,147,.8)' }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={G} aria-hidden><path d="M8 5v14l11-7z" /></svg>
                  </span>
                  <span className="absolute bottom-5 left-6 right-6 text-left">
                    <span className="block font-cond text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: G }}>{v.legenda}</span>
                    <span className={`mt-1 block font-cond font-semibold text-white ${principal ? 'text-[30px] sm:text-[38px]' : 'text-[24px]'}`}>{v.titulo}</span>
                  </span>
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
