'use client'

// Página dos vídeos (botão Vimeo dos acessos rápidos do /photo).
// Cola-se o link do Vimeo (ou YouTube) e aparece um cartão com a capa, como
// nos portais quando se entregam os vídeos. Clicar no cartão abre o vídeo.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Video = { id: string; url: string; titulo: string | null; thumb: string | null; duracao_seg: number | null; created_at: string }

const PASTA_VIMEO = 'https://vimeo.com/user/203067096/folder/30665349'

function duracao(seg: number | null) {
  if (!seg || seg <= 0) return ''
  if (seg < 60) return `${Math.round(seg)} seg`
  return `${Math.max(1, Math.round(seg / 60))} min`
}
function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[] | null>(null)
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/videos-vimeo').then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .catch(() => setVideos([]))
  }, [])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || aGravar) return
    setAGravar(true); setErro('')
    try {
      const r = await fetch('/api/videos-vimeo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, titulo }),
      }).then(x => x.json())
      if (r.error) { setErro(r.error); return }
      setVideos(v => [r.video, ...(v ?? [])])
      setUrl(''); setTitulo('')
    } catch {
      setErro('Não consegui gravar. Tenta outra vez.')
    } finally { setAGravar(false) }
  }

  async function apagar(v: Video) {
    if (!confirm(`Apagar "${v.titulo || v.url}" desta página?\n\nO vídeo continua no Vimeo.`)) return
    setVideos(lista => (lista ?? []).filter(x => x.id !== v.id))
    await fetch(`/api/videos-vimeo?id=${encodeURIComponent(v.id)}`, { method: 'DELETE' }).catch(() => {})
  }

  const filtro = busca.trim().toLowerCase()
  const visiveis = (videos ?? []).filter(v => !filtro || (v.titulo ?? '').toLowerCase().includes(filtro) || v.url.toLowerCase().includes(filtro))

  return (
    <main className="min-h-screen px-3 sm:px-6 pt-16 pb-12 lg:py-8 max-w-[1200px] mx-auto overflow-x-clip">

      {/* ── Topo ── */}
      <section className="relative rounded-[28px] border border-[#C9A84C]/20 mb-8">
        <div className="absolute inset-0 rounded-[28px] overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 30%, rgba(201,168,76,0.10), transparent 70%), #0e0e0e' }} />
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'radial-gradient(rgba(201,168,76,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 60% 70% at 75% 40%, #000 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 75% 40%, #000 20%, transparent 75%)',
          }} />
        </div>

        <div className="relative px-5 sm:px-10 pt-5 sm:pt-6 pb-7 sm:pb-9">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link href="/photo" className="font-cond text-[14px] text-white/50 hover:text-[#C9A84C] transition-colors">‹ Menu principal</Link>
            <a href={PASTA_VIMEO} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] hover:border-white/30 bg-[#0e0e0e]/90 px-5 py-2.5 font-cond font-semibold text-[15px] text-white transition-all">
              <svg viewBox="0 0 24 24" fill="#C9A84C" className="w-4 h-4" aria-hidden><path d="M23.977 6.417c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881l-1.918-7.114c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.881 1.132L0 7.202a315.065 315.065 0 003.5-3.132C5.08 2.71 6.265 1.987 7.054 1.915c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.673 1.776 3.673.502 0 1.256-.796 2.265-2.386 1.004-1.59 1.543-2.797 1.615-3.624.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z" /></svg>
              Abrir a pasta no Vimeo
            </a>
          </div>

          <div className="mt-10 sm:mt-12 max-w-2xl">
            <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">RL Photo.Video · Vimeo</p>
            <h1 className="font-cond font-bold text-white text-[36px] sm:text-[60px] leading-[1.02] mt-3">Os nossos <span className="text-[#C9A84C]">vídeos</span></h1>
            <p className="font-cond font-light text-white/60 text-lg mt-3">
              Cola o link do vídeo e fica aqui um cartão com a capa, pronto a abrir.
            </p>
          </div>

          {/* Adicionar link */}
          <form onSubmit={adicionar}
            className="mt-7 rounded-[20px] border border-[#C9A84C]/30 bg-[#111111]/85 backdrop-blur-md p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 shadow-[0_0_40px_-22px_rgba(201,168,76,0.5)]">
            <input value={url} onChange={e => setUrl(e.target.value)} type="url" required
              placeholder="https://vimeo.com/…"
              className="min-w-0 flex-[2] rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 font-cond text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50" />
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Título (opcional)"
              className="min-w-0 flex-1 rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 font-cond text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50" />
            <button type="submit" disabled={aGravar || !url.trim()}
              className="shrink-0 rounded-full border border-[#C9A84C]/55 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 px-6 py-2.5 font-cond text-[15px] font-semibold text-white transition-all disabled:opacity-40">
              {aGravar ? 'A adicionar…' : '+ Adicionar'}
            </button>
          </form>
          {erro && <p className="font-cond text-[13px] text-[#C9A84C] mt-2 pl-2">{erro}</p>}
        </div>
      </section>

      {/* ── Cartões ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Biblioteca</p>
          <h2 className="font-cond font-semibold text-white text-[28px] leading-tight mt-1">
            {videos === null ? 'A carregar…' : `${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'}`}
          </h2>
        </div>
        {(videos?.length ?? 0) > 3 && (
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar…"
            className="w-full sm:w-60 rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2 font-cond text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/45" />
        )}
      </div>

      {videos !== null && videos.length === 0 && (
        <div className="rounded-[22px] border border-dashed border-[#C9A84C]/25 py-16 text-center font-cond text-[16px] text-white/40">
          Ainda não há vídeos. Cola o primeiro link lá em cima.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visiveis.map(v => (
          <div key={v.id} className="group relative rounded-[22px] border border-[#C9A84C]/15 bg-[#111111] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A84C]/45 hover:shadow-[0_0_40px_-18px_rgba(201,168,76,0.6)]">
            <a href={v.url} target="_blank" rel="noopener noreferrer" className="block">
              {/* Capa 16:9, como no portal */}
              <div className="relative aspect-video overflow-hidden rounded-[14px] border border-[#C9A84C]/12 bg-[#0f0d0a]"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(243,237,226,.022) 0 2px, transparent 2px 11px)' }}>
                {v.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 90px 10px rgba(0,0,0,0.55)' }} />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-14 h-14 rounded-full flex items-center justify-center border border-[#C9A84C]/60 bg-black/45 backdrop-blur-md text-[#C9A84C] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C9A84C]/25">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
                  </span>
                </span>
                {duracao(v.duracao_seg) && (
                  <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur px-2.5 py-0.5 font-cond text-[12px] text-white/85">{duracao(v.duracao_seg)}</span>
                )}
              </div>
              <div className="px-1.5 pt-3 pb-1">
                <p className="font-cond font-semibold text-[17px] text-white leading-snug line-clamp-2">{v.titulo || 'Vídeo'}</p>
                <p className="font-cond text-[12.5px] text-white/40 mt-1">Adicionado a {dataCurta(v.created_at)}</p>
              </div>
            </a>
            <button onClick={() => apagar(v)} title="Apagar desta página" aria-label="Apagar"
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur border border-white/15 text-white/60 hover:text-[#C9A84C] hover:border-[#C9A84C]/50 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              ✕
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
