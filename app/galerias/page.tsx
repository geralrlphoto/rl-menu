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
  const [maisOpcoes, setMaisOpcoes] = useState(false)
  const [aGravar, setAGravar] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/galerias-links').then(r => r.json())
      .then(d => setGalerias(d.galerias ?? []))
      .catch(() => setGalerias([]))
  }, [])

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
      setUrl(''); setTitulo(''); setCapa(''); setMaisOpcoes(false)
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
  const campo = 'min-w-0 rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 font-cond text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/50'

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
            <a href="https://wfolio.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.14] hover:border-white/30 bg-[#0e0e0e]/90 pl-2 pr-5 py-2 font-cond font-semibold text-[15px] text-white transition-all">
              <LogoWfolio className="w-6 h-6" />
              Abrir o Wfolio
            </a>
          </div>

          <div className="mt-10 sm:mt-12 max-w-2xl">
            <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">RL Photo.Video · Fotografia</p>
            <h1 className="font-cond font-bold text-white text-[36px] sm:text-[60px] leading-[1.02] mt-3">As nossas <span className="text-[#C9A84C]">galerias</span></h1>
            <p className="font-cond font-light text-white/60 text-lg mt-3">
              Cola o link da galeria, escolhe a categoria e fica aqui um cartão com a capa.
            </p>
          </div>

          {/* Adicionar galeria */}
          <form onSubmit={adicionar}
            className="mt-7 rounded-[20px] border border-[#C9A84C]/30 bg-[#111111]/85 backdrop-blur-md p-3 sm:p-4 flex flex-col gap-3 shadow-[0_0_40px_-22px_rgba(201,168,76,0.5)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIAS.map(c => (
                <button type="button" key={c.id} onClick={() => setCategoria(c.id)} className={pilula(categoria === c.id)}>{c.nome}</button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input value={url} onChange={e => setUrl(e.target.value)} type="url" required placeholder="https://… (link da galeria)" className={`${campo} flex-[2]`} />
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome (ex.: Ana e Pedro)" className={`${campo} flex-1`} />
              <button type="submit" disabled={aGravar || !url.trim()}
                className="shrink-0 rounded-full border border-[#C9A84C]/55 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 px-6 py-2.5 font-cond text-[15px] font-semibold text-white transition-all disabled:opacity-40">
                {aGravar ? 'A adicionar…' : '+ Adicionar'}
              </button>
            </div>
            {maisOpcoes ? (
              <input value={capa} onChange={e => setCapa(e.target.value)} type="url" placeholder="Link da imagem de capa (opcional)" className={campo} />
            ) : (
              <button type="button" onClick={() => setMaisOpcoes(true)} className="self-start font-cond text-[13px] text-white/40 hover:text-[#C9A84C] pl-2 transition-colors">
                + Escolher a imagem de capa
              </button>
            )}
          </form>
          {erro && <p className="font-cond text-[13px] text-[#C9A84C] mt-2 pl-2">{erro}</p>}
        </div>
      </section>

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
    </main>
  )
}
