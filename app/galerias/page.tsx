'use client'

// Página das galerias de fotografia (botão Wfolio dos acessos rápidos do /photo).
// Cola-se o link da galeria, escolhe-se a categoria e aparece um cartão com a capa.
// Separadores: Casamentos, Pré-Wedding e Trash the Dress.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogoWfolio } from '@/app/components/LogoWfolio'

type Categoria = 'casamentos' | 'prewedding' | 'trash'
type Galeria = { id: string; url: string; titulo: string | null; categoria: Categoria; capa: string | null; created_at: string }

const CATEGORIAS: Array<{ id: Categoria; nome: string }> = [
  { id: 'casamentos', nome: 'Casamentos' },
  { id: 'prewedding', nome: 'Pré-Wedding' },
  { id: 'trash', nome: 'Trash the Dress' },
]
const nomeCat = (c: Categoria) => CATEGORIAS.find(x => x.id === c)?.nome ?? c

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GaleriasPage() {
  const [galerias, setGalerias] = useState<Galeria[] | null>(null)
  const [separador, setSeparador] = useState<Categoria | 'todas'>('todas')
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [capa, setCapa] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('casamentos')
  // Janela central de adicionar galeria
  const [modal, setModal] = useState(false)
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/galerias-links').then(r => r.json())
      .then(d => setGalerias(d.galerias ?? []))
      .catch(() => setGalerias([]))
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
      const r = await fetch('/api/galerias-links', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, titulo, categoria, capa }),
      }).then(x => x.json())
      if (r.error) { setErro(r.error); return }
      setGalerias(g => [r.galeria, ...(g ?? [])])
      setSeparador(categoria)
      setUrl(''); setTitulo(''); setCapa(''); setModal(false)
    } catch {
      setErro('Não consegui gravar. Tenta outra vez.')
    } finally { setAGravar(false) }
  }

  async function apagar(g: Galeria) {
    if (!confirm(`Apagar "${g.titulo || g.url}" desta página?\n\nA galeria continua no Wfolio.`)) return
    setGalerias(lista => (lista ?? []).filter(x => x.id !== g.id))
    await fetch(`/api/galerias-links?id=${encodeURIComponent(g.id)}`, { method: 'DELETE' }).catch(() => {})
  }

  const lista = galerias ?? []
  const contar = (c: Categoria | 'todas') => c === 'todas' ? lista.length : lista.filter(g => g.categoria === c).length
  const visiveis = separador === 'todas' ? lista : lista.filter(g => g.categoria === separador)
  const pilula = (ativo: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 font-cond text-[14px] font-medium transition-all ${ativo
      ? 'border-[#C9A84C]/60 bg-[#C9A84C]/15 text-[#C9A84C]'
      : 'border-white/[0.10] text-white/55 hover:border-[#C9A84C]/35 hover:text-white'}`

  // Capa: a da galeria mais recente (vem do Wfolio, não do Supabase); sem galerias, a foto da temporada
  const capaHero = lista.find(g => g.capa)?.capa ?? '/eventos-hero-2027.webp'

  return (
    <main className="min-h-screen overflow-x-clip font-cond">

      {/* ── Capa (estilo cartaz de cinema) ── */}
      <section className="relative min-h-[620px] lg:min-h-[86vh] flex flex-col overflow-hidden bg-[#070707]">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capaHero} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>

        {/* Traço dourado: máquina fotográfica e mira de focagem */}
        <svg className="pointer-events-none absolute right-[5%] top-[13%] w-[480px] max-w-[66vw] opacity-55" viewBox="0 0 480 340" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="250" y="150" width="190" height="125" rx="16" opacity="0.75" />
          <path d="M300 150 l14 -26 h62 l14 26" opacity="0.75" />
          <circle cx="345" cy="212" r="44" opacity="0.75" />
          <circle cx="345" cy="212" r="28" opacity="0.45" />
          <rect x="410" y="165" width="16" height="10" rx="2" opacity="0.6" />
          <path d="M30 70 C 110 30, 190 40, 230 110" opacity="0.4" />
          <path d="M60 300 h120 M60 300 v-40 M180 300 v-40" opacity="0.3" />
          <circle cx="430" cy="60" r="12" opacity="0.8" />
          <path d="M430 42 v8 M430 70 v8 M412 60 h8 M440 60 h8" opacity="0.8" />
        </svg>

        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Palmela · Portugal · {new Date().getFullYear()}
        </p>
        <div className="hidden md:flex absolute right-6 bottom-8 flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.35em] uppercase text-white/30 [writing-mode:vertical-rl]">Descer</span>
          <span className="w-px h-10 bg-white/20" />
        </div>
        <span className="hidden lg:block absolute left-[32%] top-[28%] w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
        <span className="hidden lg:block absolute left-[31.2%] top-[33%] w-11 h-11 rounded-full border border-[#C9A84C]/45" />

        <div className="relative flex-1 flex flex-col justify-between pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-[12px] tracking-[0.25em] uppercase text-white/55">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] shadow-[0_0_10px_#C9A84C]" />
              {galerias === null ? 'A carregar…' : `${lista.length} ${lista.length === 1 ? 'galeria' : 'galerias'} na biblioteca`}
            </p>
            <Link href="/photo" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Menu principal</Link>
          </div>

          <div className="mt-auto pt-24 min-w-0">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] whitespace-nowrap text-[60px] sm:text-[120px] lg:text-[150px] mt-2">
              Galerias
            </h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Casamentos · Pré-Wedding · <span className="text-[#C9A84C]">Trash the Dress</span>
              </p>
            </div>
            <p className="font-light text-white/45 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
              As galerias de fotografia que entregámos, num só sítio. Cola o link e fica aqui um cartão com a capa, pronto a abrir.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={() => { setErro(''); setModal(true) }}
                className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                Adicionar galeria
                <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <a href="https://wfolio.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 border border-white/15 hover:border-white/35 bg-black/30 pl-3 pr-6 py-2.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                <LogoWfolio className="w-7 h-7" />
                / Wfolio
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Janela central: adicionar galeria ── */}
      {modal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={() => setModal(false)}>
          <form onSubmit={adicionar} onClick={e => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-[24px] border border-[#C9A84C]/30 bg-[#111111] p-6 shadow-[0_0_80px_-24px_rgba(201,168,76,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Biblioteca</p>
                <h3 className="font-bold text-[30px] leading-none text-white mt-1.5">Adicionar galeria</h3>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Fechar"
                className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:rotate-90 transition-all duration-300 flex items-center justify-center">✕</button>
            </div>

            <label className="block text-[12px] tracking-[0.12em] uppercase text-white/45 mt-6 mb-2">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS.map(c => (
                <button type="button" key={c.id} onClick={() => setCategoria(c.id)} className={pilula(categoria === c.id)}>{c.nome}</button>
              ))}
            </div>

            <label className="block text-[12px] tracking-[0.12em] uppercase text-white/45 mt-5 mb-1.5">Link da galeria</label>
            <input autoFocus value={url} onChange={e => setUrl(e.target.value)} type="url" required placeholder="https://…"
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/55" />
            <label className="block text-[12px] tracking-[0.12em] uppercase text-white/45 mt-4 mb-1.5">Nome (opcional)</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Ana e Pedro"
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/55" />
            <label className="block text-[12px] tracking-[0.12em] uppercase text-white/45 mt-4 mb-1.5">Imagem de capa (opcional)</label>
            <input value={capa} onChange={e => setCapa(e.target.value)} type="url" placeholder="Se ficar vazio, usa a imagem da galeria"
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-[16px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/55" />

            {erro && <p className="text-[13px] text-[#C9A84C] mt-3">{erro}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModal(false)} className="rounded-full px-4 py-2.5 text-[15px] text-white/50 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" disabled={aGravar || !url.trim()}
                className="rounded-full border border-[#C9A84C]/60 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-6 py-2.5 text-[15px] font-semibold text-white transition-all disabled:opacity-40">
                {aGravar ? 'A adicionar…' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 pt-12 pb-12">

      {/* ── Separadores ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Biblioteca</p>
          <h2 className="font-cond font-semibold text-white text-[28px] leading-tight mt-1">
            {galerias === null ? 'A carregar…' : separador === 'todas' ? 'Todas as galerias' : nomeCat(separador)}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button onClick={() => setSeparador('todas')} className={pilula(separador === 'todas')}>
            Todas <span className="opacity-60">{contar('todas')}</span>
          </button>
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={() => setSeparador(c.id)} className={pilula(separador === c.id)}>
              {c.nome} <span className="opacity-60">{contar(c.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {galerias !== null && visiveis.length === 0 && (
        <div className="rounded-[22px] border border-dashed border-[#C9A84C]/25 py-16 text-center font-cond text-[16px] text-white/40">
          {lista.length === 0 ? 'Ainda não há galerias. Cola o primeiro link lá em cima.' : 'Nenhuma galeria nesta categoria.'}
        </div>
      )}

      {/* ── Cartões ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visiveis.map(g => (
          <div key={g.id} className="group relative rounded-[22px] border border-[#C9A84C]/15 bg-[#111111] p-3 transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A84C]/45 hover:shadow-[0_0_40px_-18px_rgba(201,168,76,0.6)]">
            <a href={g.url} target="_blank" rel="noopener noreferrer" className="block">
              <div className="relative aspect-[3/2] overflow-hidden rounded-[14px] border border-[#C9A84C]/12 bg-[#0f0d0a]"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(243,237,226,.022) 0 2px, transparent 2px 11px)' }}>
                {g.capa ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.capa} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[#C9A84C]/45">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10" aria-hidden><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  </span>
                )}
                <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 90px 10px rgba(0,0,0,0.5)' }} />
                <span className="absolute bottom-2.5 left-2.5 rounded-full border border-[#C9A84C]/40 bg-black/60 backdrop-blur px-2.5 py-0.5 font-cond text-[12px] text-[#C9A84C]">
                  {nomeCat(g.categoria)}
                </span>
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur px-2.5 py-0.5 font-cond text-[12px] text-white/85 opacity-0 group-hover:opacity-100 transition-opacity">
                  Abrir galeria →
                </span>
              </div>
              <div className="px-1.5 pt-3 pb-1">
                <p className="font-cond font-semibold text-[17px] text-white leading-snug line-clamp-2">{g.titulo || 'Galeria'}</p>
                <p className="font-cond text-[12.5px] text-white/40 mt-1">Adicionada a {dataCurta(g.created_at)}</p>
              </div>
            </a>
            <button onClick={() => apagar(g)} title="Apagar desta página" aria-label="Apagar"
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
