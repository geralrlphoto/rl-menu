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
  // Janela central de adicionar vídeo
  const [modal, setModal] = useState(false)

  useEffect(() => {
    fetch('/api/videos-vimeo').then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .catch(() => setVideos([]))
  }, [])

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

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
      setUrl(''); setTitulo(''); setModal(false)
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

  // A capa usa o vídeo mais recente (a preto e branco); sem vídeos, a foto da temporada
  const capaHero = (videos ?? []).find(v => v.thumb)?.thumb ?? '/eventos-hero-2026.webp'

  return (
    <main className="min-h-screen overflow-x-clip">

      {/* ── Capa (estilo cartaz de cinema) ── */}
      <section className="relative min-h-[620px] lg:min-h-[86vh] flex flex-col overflow-hidden bg-[#070707]">
        {/* Imagem à direita, a preto e branco, a fundir com o preto */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capaHero} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>

        {/* Desenhos a traço dourado: claquete e película, como os esboços da referência */}
        <svg className="pointer-events-none absolute right-[4%] top-[12%] w-[520px] max-w-[70vw] opacity-60" viewBox="0 0 520 420" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {/* Claquete */}
          <path d="M300 250 l150 -40 l22 82 l-150 40 z" opacity="0.7" />
          <path d="M296 236 l150 -40 l-6 -22 l-150 40 z" opacity="0.7" />
          <path d="M320 228 l18 -26 M356 218 l18 -26 M392 208 l18 -26 M428 198 l14 -21" opacity="0.6" />
          {/* Película a curvar */}
          <path d="M40 60 C 140 20, 230 40, 270 120 S 330 230, 250 300" opacity="0.55" />
          <path d="M62 86 C 150 52, 220 70, 252 138 S 300 236, 228 296" opacity="0.55" />
          <path d="M76 66 l4 14 M106 56 l4 14 M138 50 l3 14 M170 48 l2 14 M202 52 l0 14 M230 64 l-3 13 M252 84 l-6 12" opacity="0.5" />
          {/* Mira de focagem */}
          <circle cx="420" cy="70" r="12" opacity="0.8" />
          <path d="M420 52 v8 M420 80 v8 M402 70 h8 M430 70 h8" opacity="0.8" />
        </svg>

        {/* Linha vertical dourada à esquerda */}
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />

        {/* Texto vertical e indicação de descer, à direita */}
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 font-cond text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Palmela · Portugal · {new Date().getFullYear()}
        </p>
        <div className="hidden md:flex absolute right-6 bottom-8 flex-col items-center gap-2">
          <span className="font-cond text-[10px] tracking-[0.35em] uppercase text-white/30 [writing-mode:vertical-rl]">Descer</span>
          <span className="w-px h-10 bg-white/20" />
        </div>

        {/* Ponto e anel, como na referência */}
        <span className="hidden lg:block absolute left-[32%] top-[28%] w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
        <span className="hidden lg:block absolute left-[31.2%] top-[33%] w-11 h-11 rounded-full border border-[#C9A84C]/45" />

        <div className="relative flex-1 flex flex-col justify-between pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          {/* Topo: estado + voltar */}
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 font-cond text-[12px] tracking-[0.25em] uppercase text-white/55">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] shadow-[0_0_10px_#C9A84C]" />
              {videos === null ? 'A carregar…' : `${videos.length} ${videos.length === 1 ? 'vídeo' : 'vídeos'} na biblioteca`}
            </p>
            <Link href="/photo" className="font-cond text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Menu principal</Link>
          </div>

          <div className="mt-auto pt-24">
            <p className="font-cond text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-cond font-bold uppercase text-white leading-[0.88] tracking-[-0.01em] text-[72px] sm:text-[130px] lg:text-[170px] mt-2">
              Vídeos
            </h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="font-cond text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Casamentos · Pré-Wedding · <span className="text-[#C9A84C]">Filmes</span>
              </p>
            </div>
            <p className="font-cond font-light text-white/45 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
              Todos os filmes que entregámos, num só sítio. Cola o link do Vimeo e fica aqui um cartão com a capa, pronto a abrir.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={() => { setErro(''); setModal(true) }}
                className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 font-cond text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                Adicionar vídeo
                <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <a href={PASTA_VIMEO} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3.5 font-cond text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                / Pasta no Vimeo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Janela central: adicionar vídeo ── */}
      {modal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModal(false)}>
          <form onSubmit={adicionar} onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-[24px] border border-[#C9A84C]/30 bg-[#111111] p-6 shadow-[0_0_80px_-24px_rgba(201,168,76,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Biblioteca</p>
                <h3 className="font-cond font-bold text-[30px] leading-none text-white mt-1.5">Adicionar vídeo</h3>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Fechar"
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center">✕</button>
            </div>
            <label className="block font-cond text-[12px] tracking-[0.12em] uppercase text-white/45 mt-6 mb-1.5">Link do vídeo</label>
            <input autoFocus value={url} onChange={e => setUrl(e.target.value)} type="url" required placeholder="https://vimeo.com/…"
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 font-cond text-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/55" />
            <label className="block font-cond text-[12px] tracking-[0.12em] uppercase text-white/45 mt-4 mb-1.5">Título (opcional)</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Se ficar vazio, usa o título do Vimeo"
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 font-cond text-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/55" />
            {erro && <p className="font-cond text-[13px] text-[#C9A84C] mt-3">{erro}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModal(false)} className="rounded-full px-4 py-2.5 font-cond text-[15px] text-white/50 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" disabled={aGravar || !url.trim()}
                className="rounded-full border border-[#C9A84C]/60 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-6 py-2.5 font-cond text-[15px] font-semibold text-white transition-all disabled:opacity-40">
                {aGravar ? 'A adicionar…' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 pt-12 pb-12">

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
      </div>
    </main>
  )
}
