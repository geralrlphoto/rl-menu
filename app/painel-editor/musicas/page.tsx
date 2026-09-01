'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { NotificationBell } from '../_components/NotificationBell'
import { MessagesBell } from '../_components/MessagesBell'
import { BrandLogo } from '../_components/BrandLogo'
import { PROJECTS as MOCK_PROJECTS } from '../_data/projects'
import { loadAssociacao, associate, disassociate } from '../_data/musicas-associacao'
import { getEditorId } from '../_data/freelancer-profile'

// ── Biblioteca de músicas do editor (guardada na BD: freelancers.editor_musicas) ──
function MinhaBiblioteca() {
  const [musicas, setMusicas] = useState<Array<{ titulo: string; link: string }>>([])
  const [loaded, setLoaded] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [link, setLink] = useState('')
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    const id = getEditorId()
    idRef.current = id
    if (!id) { setLoaded(true); return }
    let cancelled = false
    fetch(`/api/painel-editor/workflow?freelancer=${id}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setMusicas(Array.isArray(d?.musicas) ? d.musicas : []); setLoaded(true) } })
      .catch(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [])

  function save(next: Array<{ titulo: string; link: string }>) {
    setMusicas(next)
    const id = idRef.current
    if (id) {
      fetch('/api/painel-editor/workflow', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer: id, musicas: next }),
      }).catch(() => {})
    }
  }
  function add() {
    if (!titulo.trim() && !link.trim()) return
    save([...musicas, { titulo: titulo.trim(), link: link.trim() }])
    setTitulo(''); setLink('')
  }
  function remove(i: number) { save(musicas.filter((_, k) => k !== i)) }

  if (!loaded) return null

  const inputCls = 'bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white/90 placeholder:text-white/25 outline-none focus:border-gold/40 transition-all'

  return (
    <div className="rounded-2xl border border-gold/25 p-5 mb-5"
      style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.5), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold text-lg">♪</span>
        <h3 className="text-[15px] font-semibold text-white">A Minha Biblioteca</h3>
        <span className="text-[10px] text-white/35 tracking-widest uppercase">{musicas.length}</span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {musicas.map((m, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div className="min-w-0">
              <p className="text-[13px] text-white/90 truncate">{m.titulo || m.link}</p>
              {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold/70 hover:text-gold truncate block">{m.link}</a>}
            </div>
            <button onClick={() => remove(i)} className="text-white/30 hover:text-red-400 text-[14px] shrink-0" title="Remover">✕</button>
          </div>
        ))}
        {musicas.length === 0 && <p className="text-[12px] text-white/30 italic">Sem músicas guardadas. Adiciona abaixo.</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título / artista…" className={`${inputCls} flex-1 min-w-[140px]`} />
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link (Spotify, YouTube…)" className={`${inputCls} flex-1 min-w-[160px]`} />
        <button onClick={add} className="text-[11px] px-4 py-2 rounded-lg bg-gold/15 border border-gold/35 text-gold font-semibold tracking-widest uppercase hover:bg-gold/25 transition-all">+ Adicionar</button>
      </div>
    </div>
  )
}

// ── Helpers de URL/plataforma ───────────────────────────────────────────
function detectPlataforma(url: string): Plataforma {
  const u = (url || '').toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube'
  if (u.includes('spotify.com'))                            return 'Spotify'
  if (u.includes('vimeo.com'))                              return 'Vimeo'
  if (u.includes('artlist.io'))                             return 'Artlist'
  if (u.includes('musicbed.com'))                           return 'Musicbed'
  if (u.includes('soundstripe.com'))                        return 'Soundstripe'
  if (u.includes('epidemicsound.com'))                      return 'Epidemic Sound'
  if (u.includes('drive.google.com'))                       return 'Drive'
  return 'Custom'
}

// Extrai o ID do vídeo (formato: 11 chars alfanuméricos + _-)
function youtubeIdFromUrl(url: string): string | null {
  if (!url) return null
  try {
    // youtu.be/<id>
    const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
    if (short?.[1]) return short[1]
    // youtube.com/watch?v=<id> ou youtube.com/embed/<id>
    const u = new URL(url)
    const v = u.searchParams.get('v')
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v
    const embed = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/)
    if (embed?.[1]) return embed[1]
  } catch {}
  return null
}

function youtubeThumb(url: string): string | null {
  const id = youtubeIdFromUrl(url)
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null
}

// ────────────────────────────────────────────────────────────────────────
//  BIBLIOTECA DE MÚSICAS — Wedding Moments Films
//  Editorial table-based design organizado por momentos do casamento
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas', active: true },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────
type Momento =
  | 'Making Of' | 'Votos' | 'Cerimónia' | 'Cocktail' | 'Festa' | 'Corte do Bolo'
  | 'Entrada Noivo' | 'Entrada Noiva' | 'Preparação Noivo' | 'Preparação Noiva'
  | 'Entrega do Ramo' | 'Dança dos Noivos' | 'Discursos' | 'Trailer' | 'Teaser' | 'Instagram Reels'

type Genero = 'Cinematic' | 'Acústico' | 'Clássico' | 'Pop' | 'Indie' | 'Jazz' | 'Folk'
type Clima  = 'Romântico' | 'Emocional' | 'Épico' | 'Leve' | 'Feliz' | 'Nostálgico' | 'Elegante' | 'Solenne' | 'Energético'
type Plataforma = 'Artlist' | 'Musicbed' | 'Soundstripe' | 'Epidemic Sound' | 'Spotify' | 'YouTube' | 'Vimeo' | 'Drive' | 'Custom'

type Track = {
  id: string
  title: string
  version?: string
  artist: string
  cover: string
  genero: Genero
  clima: Clima
  duracao: string
  momento: Momento
  plataforma: Plataforma
  link: string
  favorita: boolean
  usadaEm: number
}

// ── Categorias (cover por momento) ────────────────────────────────────────
type Category = { momento: Momento; count: number; cover: string; lastUpdate: string }

const CATEGORIES: Category[] = [
  { momento: 'Making Of',     count: 128, cover: 'https://images.unsplash.com/photo-1519181258491-1eb8fb6f5dde?w=600&h=400&fit=crop', lastUpdate: '18/05/2026' },
  { momento: 'Votos',         count: 96,  cover: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=400&fit=crop',  lastUpdate: '17/05/2026' },
  { momento: 'Cerimónia',     count: 142, cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop',  lastUpdate: '16/05/2026' },
  { momento: 'Cocktail',      count: 118, cover: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop',  lastUpdate: '15/05/2026' },
  { momento: 'Festa',         count: 256, cover: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop',  lastUpdate: '15/05/2026' },
  { momento: 'Corte do Bolo', count: 74,  cover: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&h=400&fit=crop',  lastUpdate: '14/05/2026' },
  { momento: 'Entrada Noiva', count: 88,  cover: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=600&h=400&fit=crop',  lastUpdate: '13/05/2026' },
  { momento: 'Dança dos Noivos', count: 64, cover: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop', lastUpdate: '12/05/2026' },
  { momento: 'Trailer',       count: 52,  cover: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop',  lastUpdate: '11/05/2026' },
  { momento: 'Instagram Reels', count: 41, cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop', lastUpdate: '10/05/2026' },
  { momento: 'Discursos',     count: 32,  cover: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=400&fit=crop',  lastUpdate: '09/05/2026' },
  { momento: 'Teaser',        count: 28,  cover: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop',  lastUpdate: '08/05/2026' },
]

// ── Mock tracks ───────────────────────────────────────────────────────────
const TRACKS: Track[] = [
  { id: 'm1',  title: 'Golden Hour',                version: 'Instrumental Version', artist: 'JVKE',             cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',  genero: 'Cinematic', clima: 'Romântico',  duracao: '3:45', momento: 'Making Of',     plataforma: 'Artlist',         link: 'https://artlist.io/golden-hour', favorita: false, usadaEm: 14 },
  { id: 'm2',  title: 'You Are The Reason',          version: 'Instrumental',         artist: 'Calum Scott',      cover: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=200&h=200&fit=crop',  genero: 'Acústico',  clima: 'Emocional',  duracao: '4:18', momento: 'Votos',         plataforma: 'Musicbed',        link: 'https://musicbed.com/calum', favorita: true,  usadaEm: 22 },
  { id: 'm3',  title: 'Canon in D',                  version: 'Orchestral Version',   artist: 'Johann Pachelbel', cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&h=200&fit=crop',  genero: 'Clássico',  clima: 'Solenne',    duracao: '5:08', momento: 'Cerimónia',     plataforma: 'Soundstripe',     link: 'https://soundstripe.com/canon', favorita: true,  usadaEm: 35 },
  { id: 'm4',  title: 'Better Together',             version: 'Instrumental',         artist: 'Jack Johnson',     cover: 'https://images.unsplash.com/photo-1499415479124-43c32433a620?w=200&h=200&fit=crop',  genero: 'Acústico',  clima: 'Leve',       duracao: '3:28', momento: 'Cocktail',      plataforma: 'Epidemic Sound',  link: 'https://epidemicsound.com/better', favorita: false, usadaEm: 18 },
  { id: 'm5',  title: 'A Sky Full of Stars',         version: 'Instrumental',         artist: 'Coldplay',         cover: 'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=200&h=200&fit=crop',  genero: 'Pop',       clima: 'Energético', duracao: '4:20', momento: 'Festa',         plataforma: 'Spotify',         link: 'https://spotify.com/sky', favorita: false, usadaEm: 28 },
  { id: 'm6',  title: "Can't Help Falling in Love",  version: 'Piano Version',         artist: 'Elvis Presley',    cover: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=200&h=200&fit=crop',  genero: 'Clássico',  clima: 'Romântico',  duracao: '3:02', momento: 'Corte do Bolo', plataforma: 'YouTube',         link: 'https://youtube.com/elvis', favorita: false, usadaEm: 16 },
  { id: 'm7',  title: 'Perfect',                     version: 'Piano Version',         artist: 'Ed Sheeran',       cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',  genero: 'Acústico',  clima: 'Romântico',  duracao: '4:23', momento: 'Votos',         plataforma: 'Spotify',         link: 'https://spotify.com/perfect', favorita: true,  usadaEm: 31 },
  { id: 'm8',  title: 'Somewhere Only We Know',      version: 'Instrumental',         artist: 'Keane',            cover: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=200&h=200&fit=crop',  genero: 'Indie',     clima: 'Nostálgico', duracao: '3:57', momento: 'Making Of',     plataforma: 'Artlist',         link: 'https://artlist.io/keane', favorita: false, usadaEm: 9 },
  // Favoritos extras
  { id: 'm9',  title: 'A Thousand Years',            artist: 'Christina Perri', cover: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', genero: 'Pop',      clima: 'Emocional', duracao: '4:45', momento: 'Votos',     plataforma: 'Spotify',   link: '#', favorita: true, usadaEm: 19 },
  { id: 'm10', title: 'Make You Feel My Love',       artist: 'Adele',           cover: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop', genero: 'Acústico', clima: 'Romântico', duracao: '3:32', momento: 'Cerimónia', plataforma: 'Spotify',   link: '#', favorita: true, usadaEm: 24 },
]

// ── Cores por momento (badge) ─────────────────────────────────────────────
const MOMENTO_CLS: Record<Momento, string> = {
  'Making Of':       'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Votos':           'bg-pink-500/15 text-pink-300 border-pink-500/30',
  'Cerimónia':       'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Cocktail':        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Festa':           'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Corte do Bolo':   'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'Entrada Noivo':   'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Entrada Noiva':   'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  'Preparação Noivo':'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Preparação Noiva':'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Entrega do Ramo': 'bg-red-500/15 text-red-300 border-red-500/30',
  'Dança dos Noivos':'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Discursos':       'bg-gold/15 text-gold border-gold/30',
  'Trailer':         'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Teaser':          'bg-teal-500/15 text-teal-300 border-teal-500/30',
  'Instagram Reels': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
}


// ────────────────────────────────────────────────────────────────────────
//  PAGE
// ────────────────────────────────────────────────────────────────────────
export default function MusicasPage() {
  const [tracks, setTracks] = useState<Track[]>(TRACKS)
  const [activeCategory, setActiveCategory] = useState<Momento | null>('Making Of')
  const [search, setSearch] = useState('')
  const [filterMomento, setFilterMomento] = useState<'Todos os Momentos' | Momento>('Todos os Momentos')
  const [filterGenero, setFilterGenero] = useState<'Todos os Géneros' | Genero>('Todos os Géneros')
  const [filterClima, setFilterClima] = useState<'Todos os Climas' | Clima>('Todos os Climas')
  const [page, setPage] = useState(1)
  const [playing, setPlaying] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCover, setEditingCover] = useState<Momento | null>(null)
  const [customCovers, setCustomCovers] = useState<Record<string, string>>({})
  const [associatingTrack, setAssociatingTrack] = useState<Track | null>(null)

  // ── Carrega/persiste user-tracks + custom covers ────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('painel-editor-user-musicas')
      const userTracks: Track[] = raw ? JSON.parse(raw) : []
      if (userTracks.length > 0) {
        setTracks([...userTracks, ...TRACKS])
      }
    } catch {}
    try {
      const raw = localStorage.getItem('painel-editor-musicas-covers')
      const map = raw ? JSON.parse(raw) : {}
      setCustomCovers(map)
    } catch {}
  }, [])

  function setCustomCover(momento: Momento, dataUrl: string) {
    setCustomCovers(prev => {
      const next = { ...prev, [momento]: dataUrl }
      try { localStorage.setItem('painel-editor-musicas-covers', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function resetCustomCover(momento: Momento) {
    setCustomCovers(prev => {
      const next = { ...prev }
      delete next[momento]
      try { localStorage.setItem('painel-editor-musicas-covers', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function persistUserTracks(all: Track[]) {
    try {
      const mockIds = new Set(TRACKS.map(t => t.id))
      const userTracks = all.filter(t => !mockIds.has(t.id))
      localStorage.setItem('painel-editor-user-musicas', JSON.stringify(userTracks))
    } catch {}
  }

  function addTrack(t: Track) {
    setTracks(prev => {
      const next = [t, ...prev]
      persistUserTracks(next)
      return next
    })
    setShowAddModal(false)
  }

  function deleteTrack(id: string) {
    setTracks(prev => {
      const next = prev.filter(t => t.id !== id)
      persistUserTracks(next)
      return next
    })
  }

  const filtered = useMemo(() => {
    let arr = tracks
    // Categoria clicada nos cards (Making Of, Votos, etc.) tem prioridade sobre o dropdown
    if (activeCategory)                        arr = arr.filter(t => t.momento === activeCategory)
    else if (filterMomento !== 'Todos os Momentos') arr = arr.filter(t => t.momento === filterMomento)
    if (filterGenero  !== 'Todos os Géneros')  arr = arr.filter(t => t.genero === filterGenero)
    if (filterClima   !== 'Todos os Climas')   arr = arr.filter(t => t.clima === filterClima)
    if (search.trim()) arr = arr.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    )
    return arr
  }, [tracks, activeCategory, filterMomento, filterGenero, filterClima, search])

  const favoritas = tracks.filter(t => t.favorita)

  function toggleFav(id: string) {
    setTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, favorita: !t.favorita } : t)
      persistUserTracks(next)
      return next
    })
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="painel-main relative z-10 pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          {/* HERO */}
          <Hero onAdd={() => setShowAddModal(true)} />

          {/* Biblioteca real do editor (BD) */}
          <MinhaBiblioteca />

          {/* SEARCH + FILTERS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mt-5 mb-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar músicas…"
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl pl-10 pr-3 py-3 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect value={filterMomento} onChange={setFilterMomento as any}
                options={['Todos os Momentos', ...Array.from(new Set(tracks.map(t => t.momento)))]} />
              <FilterSelect value={filterGenero} onChange={setFilterGenero as any}
                options={['Todos os Géneros', ...Array.from(new Set(tracks.map(t => t.genero)))]} />
              <FilterSelect value={filterClima} onChange={setFilterClima as any}
                options={['Todos os Climas', ...Array.from(new Set(tracks.map(t => t.clima)))]} />
              <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] text-white/65 hover:text-gold hover:border-gold/30 transition-all text-[13px]">
                ☰ Filtros
              </button>
            </div>
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

            {/* MAIN: Categorias + Tabela */}
            <div className="flex flex-col gap-5">

              {/* CATEGORIAS (horizontal scroll) */}
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-flow-col auto-cols-[180px] gap-3 pb-1">
                  {CATEGORIES.slice(0, 6).map(c => (
                    <CategoryCard key={c.momento} c={c}
                      active={activeCategory === c.momento}
                      onClick={() => setActiveCategory(activeCategory === c.momento ? null : c.momento)}
                      customCover={customCovers[c.momento]}
                      onEditCover={() => setEditingCover(c.momento)} />
                  ))}
                </div>
              </div>

              {/* TABELA Músicas Recentes */}
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.65))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                      {activeCategory ? (
                        <>Músicas · <span className="italic text-gold">{activeCategory}</span></>
                      ) : 'Músicas Recentes'}
                    </h2>
                    <span className="text-[11px] tracking-widest uppercase text-white/45 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02]">
                      {filtered.length} {filtered.length === 1 ? 'música' : 'músicas'}
                    </span>
                  </div>
                  {activeCategory && (
                    <button onClick={() => setActiveCategory(null)}
                      className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors px-3 py-1.5 rounded-lg border border-gold/30 hover:bg-gold/10">
                      ← Ver todas
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="text-[10px] tracking-widest uppercase text-white/35 bg-white/[0.02]">
                        <th className="text-left px-4 py-3 font-medium">Música</th>
                        <th className="text-left px-3 py-3 font-medium">Artista</th>
                        <th className="text-left px-3 py-3 font-medium">Género</th>
                        <th className="text-left px-3 py-3 font-medium">Clima</th>
                        <th className="text-left px-3 py-3 font-medium">Duração</th>
                        <th className="text-left px-3 py-3 font-medium">Momento</th>
                        <th className="text-right px-4 py-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 8).map(t => (
                        <tr key={t.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                          {/* Música (play + cover + título) */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setPlaying(playing === t.id ? null : t.id)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] transition-all ${
                                  playing === t.id
                                    ? 'bg-gold text-black'
                                    : 'bg-white/[0.04] text-white/55 hover:text-gold hover:bg-gold/10 border border-white/10'
                                }`}
                                style={playing === t.id ? { boxShadow: '0 0 14px rgba(201,164,92,0.55)' } : {}}>
                                {playing === t.id ? '❚❚' : '▶'}
                              </button>
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <img src={t.cover} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{t.title}</p>
                                {t.version && <p className="text-[11px] text-white/40 truncate">{t.version}</p>}
                              </div>
                            </div>
                          </td>

                          {/* Artista */}
                          <td className="px-3 py-3 text-[12px] text-white/70">{t.artist}</td>

                          {/* Género */}
                          <td className="px-3 py-3 text-[12px] text-white/60">{t.genero}</td>

                          {/* Clima */}
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-white/70">
                              <span className="text-red-400/70">♥</span>{t.clima}
                            </span>
                          </td>

                          {/* Duração */}
                          <td className="px-3 py-3 text-[12px] text-white/60 font-mono">{t.duracao}</td>

                          {/* Momento (badge) */}
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${MOMENTO_CLS[t.momento]}`}>
                              {t.momento}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <a href={t.link} target="_blank" rel="noopener noreferrer"
                                className="w-8 h-8 rounded-lg text-white/45 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center" title="Abrir link">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                              </a>
                              <button onClick={() => setAssociatingTrack(t)}
                                className="w-8 h-8 rounded-lg text-white/45 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center"
                                title="Associar a projeto">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <path d="M2 10l5-4M22 10l-5-4M2 14l5 4M22 14l-5 4" />
                                </svg>
                              </button>
                              <button onClick={() => toggleFav(t.id)}
                                className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                                  t.favorita ? 'text-red-400 bg-red-500/10' : 'text-white/45 hover:text-red-400 hover:bg-white/[0.04]'
                                }`} title="Favoritar">
                                {t.favorita ? '♥' : '♡'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                  <p className="text-[11px] text-white/40">Mostrando 1 a {Math.min(8, filtered.length)} de {filtered.length} músicas</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(Math.max(1, page-1))} className="w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 transition-all">‹</button>
                    {[1,2,3,4,'…',102].map((n, i) => (
                      <button key={i} onClick={() => typeof n === 'number' && setPage(n)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-[12px] transition-all ${
                          n === page ? 'bg-gold/20 border border-gold/40 text-gold font-bold' : 'border border-white/10 text-white/55 hover:text-gold hover:border-gold/30'
                        }`}>{n}</button>
                    ))}
                    <button onClick={() => setPage(p => p+1)} className="w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 transition-all">›</button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <aside className="flex flex-col gap-4">

              {/* Categorias */}
              <Panel title="Categorias" right={<button className="text-[11px] tracking-wider uppercase text-gold/70 hover:text-gold transition-colors">Ver todas</button>}>
                <div className="space-y-2.5">
                  {CATEGORIES.slice(0, 6).map(c => (
                    <div key={c.momento} className="flex items-center justify-between gap-3 group cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-md flex items-center justify-center text-[12px] text-gold border border-gold/30 bg-gold/[0.06] shrink-0">
                          {momentoIcon(c.momento)}
                        </span>
                        <span className="text-[12px] text-white/75 group-hover:text-gold transition-colors truncate">{c.momento}</span>
                      </div>
                      <span className="text-[11px] text-white/45 tabular-nums font-mono">{c.count}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Músicas Favoritas */}
              <Panel title="Músicas Favoritas" right={<button className="text-[11px] tracking-wider uppercase text-gold/70 hover:text-gold transition-colors">Ver todas</button>}>
                <div className="space-y-2">
                  {favoritas.slice(0, 4).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={t.cover} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-white/40 truncate">{t.artist}</p>
                      </div>
                      <span className="text-red-400 text-[14px]">♥</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Infos da Biblioteca — números reais */}
              {(() => {
                const total = tracks.length
                const totalFavoritas = tracks.filter(t => t.favorita).length
                const totalUsadasEmProjetos = tracks.reduce((s, t) => s + (t.usadaEm || 0), 0)
                // Adicionadas este mês: id 'user-musica-{Date.now()}' do mês corrente
                const now = new Date()
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
                const adicionadasEsteMes = tracks.filter(t => {
                  const m = t.id.match(/^user-musica-(\d+)$/)
                  if (!m) return false
                  return Number(m[1]) >= monthStart
                }).length
                // Atualizada em: data da última user-musica adicionada (ou TODAY)
                const tsList = tracks.map(t => {
                  const m = t.id.match(/^user-musica-(\d+)$/)
                  return m ? Number(m[1]) : 0
                }).filter(n => n > 0)
                const lastUpdate = tsList.length > 0
                  ? new Date(Math.max(...tsList))
                  : now
                const lastUpdateStr = `${String(lastUpdate.getDate()).padStart(2,'0')}/${String(lastUpdate.getMonth()+1).padStart(2,'0')}/${lastUpdate.getFullYear()}`

                return (
                  <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
                    style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                    <h3 className="text-[14px] font-semibold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>Infos da Biblioteca</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center"
                        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.2), rgba(201,164,92,0.04))', boxShadow: '0 0 18px -4px rgba(201,164,92,0.3)' }}>
                        <span className="text-2xl text-gold">♪</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white leading-none">{total}</p>
                        <p className="text-[11px] text-white/45 mt-1.5 tracking-widest uppercase">
                          {total === 1 ? 'Música Disponível' : 'Músicas Disponíveis'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-white/[0.05]">
                      <StatRow label="Atualizada em"        value={lastUpdateStr} />
                      <StatRow label="Adicionadas este mês" value={String(adicionadasEsteMes)} />
                      <StatRow label="Favoritas"            value={String(totalFavoritas)} />
                      <StatRow label="Usadas em projetos"   value={String(totalUsadasEmProjetos)} />
                    </div>
                  </div>
                )
              })()}
            </aside>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Biblioteca de Músicas</p>
        </div>
      </main>

      {/* Modal: Adicionar Música */}
      {showAddModal && (
        <AddMusicaModal
          onClose={() => setShowAddModal(false)}
          onCreate={addTrack}
        />
      )}

      {/* Modal: Trocar Foto do Card */}
      {editingCover && (
        <EditCoverModal
          momento={editingCover}
          currentCover={customCovers[editingCover] || CATEGORIES.find(c => c.momento === editingCover)?.cover || ''}
          hasCustom={Boolean(customCovers[editingCover])}
          onClose={() => setEditingCover(null)}
          onSave={(dataUrl) => { setCustomCover(editingCover, dataUrl); setEditingCover(null) }}
          onReset={() => { resetCustomCover(editingCover); setEditingCover(null) }}
        />
      )}

      {/* Modal: Associar música a projeto */}
      {associatingTrack && (
        <AssociarProjetoModal
          track={associatingTrack}
          onClose={() => setAssociatingTrack(null)}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function momentoIcon(m: Momento): string {
  const map: Partial<Record<Momento, string>> = {
    'Making Of': '◫', 'Votos': '♥', 'Cerimónia': '⛪', 'Cocktail': '🥂', 'Festa': '✦', 'Corte do Bolo': '◍',
    'Trailer': '▶', 'Teaser': '◐', 'Instagram Reels': '◯', 'Discursos': '🎤',
    'Entrada Noiva': '✿', 'Entrada Noivo': '✦', 'Preparação Noiva': '◆', 'Preparação Noivo': '◇',
    'Entrega do Ramo': '✾', 'Dança dos Noivos': '✧',
  }
  return map[m] ?? '♪'
}

function Sidebar() {
  return (
    <aside
      className="painel-sidebar flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <BrandLogo />
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(it => {
          const isActive = !!it.active
          const cls = `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all group ${
            isActive ? 'bg-gold/10 border border-gold/30 text-gold' : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
          }`
          const inner = (
            <>
              <span className={`w-5 text-center text-base ${isActive ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
            </>
          )
          return it.href
            ? <Link key={it.key} href={it.href} className={cls} style={isActive ? { boxShadow: '0 0 18px -4px rgba(201,164,92,0.35)' } : {}}>{inner}</Link>
            : <button key={it.key} className={cls}>{inner}</button>
        })}
      </nav>
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-gold/15 p-3"
          style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.06), transparent)' }}>
          <p className="text-gold/40 text-xl font-serif leading-none mb-1.5">&ldquo;</p>
          <p className="text-[11px] text-white/55 italic leading-relaxed">A música certa transforma momentos em memórias eternas.</p>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gold/40 shrink-0">
            <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face" alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate">Editor Pro</p>
            <p className="text-[10px] text-white/35 truncate">editorpro@mail.com</p>
            <p className="text-[9px] text-emerald-400 mt-0.5">● Online</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Hero({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&h=260&fit=crop"
          alt="" className="w-full h-full object-cover" style={{ filter: 'blur(2px)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 35%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.05) 100%)' }} />
      <div className="painel-hero-linha relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-7">
        <div className="flex items-center gap-5 max-w-2xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-2xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>♪</div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Biblioteca de <span className="italic text-gold">Músicas</span>
            </h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed max-w-md">
              Músicas selecionadas e organizadas por momento do casamento.<br />
              Perfeitas para criar histórias inesquecíveis.
            </p>
          </div>
        </div>
        <div className="painel-acoes flex items-center gap-3 shrink-0">
          <div className="painel-acoes-topo flex items-center gap-2">
            <NotificationBell />
            <MessagesBell />
          </div>
          <button className="w-11 h-11 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:border-gold/40 transition-all flex items-center justify-center text-white/75 hover:text-gold" title="Importar Playlist">↓</button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Adicionar Música
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSelect<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as T)}
      className="bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-white/75 focus:outline-none focus:border-gold/40 cursor-pointer min-w-[160px]">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function CategoryCard({ c, active, onClick, customCover, onEditCover }: {
  c: Category
  active: boolean
  onClick: () => void
  customCover?: string
  onEditCover?: () => void
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border aspect-[3/2.4] transition-all ${
        active
          ? 'border-gold/55'
          : 'border-white/[0.06] hover:border-gold/30'
      }`}
      style={active
        ? { boxShadow: '0 0 28px -6px rgba(201,164,92,0.45), 0 10px 30px -10px rgba(0,0,0,0.6)' }
        : { boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      {/* Click area (selecionar categoria) */}
      <button onClick={onClick} className="absolute inset-0 w-full h-full text-left z-10" title={`Filtrar por ${c.momento}`}>
        <img src={customCover || c.cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.92) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <p className="text-[14px] font-bold tracking-[0.18em] uppercase text-white" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{c.momento}</p>
          <p className="text-[11px] text-gold/85 mt-0.5">{c.count} músicas</p>
        </div>
        {active && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold" style={{ boxShadow: '0 0 8px rgba(201,164,92,0.8)' }} />
        )}
      </button>

      {/* Botão ✎ trocar foto (sobre o click area, mais alto z-index) */}
      {onEditCover && (
        <button onClick={(e) => { e.stopPropagation(); onEditCover() }}
          title="Trocar foto"
          className="absolute top-2 left-2 z-20 w-7 h-7 rounded-lg border border-white/15 bg-black/60 backdrop-blur-md text-white/70 hover:text-gold hover:border-gold/40 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[12px]">
          ✎
        </button>
      )}
    </div>
  )
}

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.35), rgba(11,11,11,0.65))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white tabular-nums">{value}</span>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  MODAL: ADICIONAR MÚSICA
// ────────────────────────────────────────────────────────────────────────
const MOMENTO_OPTIONS: Momento[] = [
  'Making Of','Votos','Cerimónia','Cocktail','Festa','Corte do Bolo',
  'Entrada Noivo','Entrada Noiva','Preparação Noivo','Preparação Noiva',
  'Entrega do Ramo','Dança dos Noivos','Discursos','Trailer','Teaser','Instagram Reels',
]
const GENERO_OPTIONS: Genero[] = ['Cinematic','Acústico','Clássico','Pop','Indie','Jazz','Folk']
const CLIMA_OPTIONS: Clima[] = ['Romântico','Emocional','Épico','Leve','Feliz','Nostálgico','Elegante','Solenne','Energético']
const COVER_FALLBACK = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'

function AddMusicaModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (t: Track) => void
}) {
  const [link, setLink]       = useState('')
  const [title, setTitle]     = useState('')
  const [artist, setArtist]   = useState('')
  const [momento, setMomento] = useState<Momento>('Cerimónia')
  const [genero, setGenero]   = useState<Genero>('Cinematic')
  const [clima, setClima]     = useState<Clima>('Romântico')
  const [duracao, setDuracao] = useState('')
  const [autoFilling, setAutoFilling] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  // Auto-detect & preview thumbnail YouTube
  const plataforma = detectPlataforma(link)
  const ytThumb = plataforma === 'YouTube' ? youtubeThumb(link) : null

  // Auto-fill via YouTube oEmbed (título + autor) quando há ID válido
  useEffect(() => {
    if (plataforma !== 'YouTube') return
    const id = youtubeIdFromUrl(link)
    if (!id) return
    let cancelled = false
    setAutoFilling(true)
    setAutoFilled(false)
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/painel-editor/youtube-oembed?url=${encodeURIComponent(link)}`)
        const data = await res.json()
        if (cancelled || !res.ok || data.error) return
        // Só preenche se os campos estiverem vazios (não sobrescreve o que user já editou)
        if (data.title && !title.trim())       setTitle(String(data.title))
        if (data.author_name && !artist.trim()) setArtist(String(data.author_name))
        setAutoFilled(true)
      } catch {}
      finally {
        if (!cancelled) setAutoFilling(false)
      }
    }, 500) // 500ms debounce
    return () => { cancelled = true; clearTimeout(debounce); setAutoFilling(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link])

  const valid = title.trim().length > 0 && link.trim().length > 0

  function submit() {
    if (!valid) return
    const id = `user-musica-${Date.now()}`
    const cover = ytThumb || COVER_FALLBACK
    const track: Track = {
      id,
      title: title.trim(),
      artist: artist.trim() || '—',
      cover,
      genero,
      clima,
      duracao: duracao.trim() || '—',
      momento,
      plataforma,
      link: link.trim(),
      favorita: false,
      usadaEm: 0,
    }
    onCreate(track)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-xl rounded-2xl border border-gold/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 40px -10px rgba(201,164,92,0.35)' }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 flex items-center justify-center text-lg z-10">×</button>

        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-2">Biblioteca</p>
          <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Adicionar <span className="italic text-gold">Música</span>
          </h2>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">

          {/* Link primeiro — detecção automática */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">
              Link <span className="text-red-400">*</span>
              {plataforma !== 'Custom' && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-md bg-gold/10 border border-gold/30 text-gold normal-case tracking-normal">
                  ✓ {plataforma}
                </span>
              )}
            </p>
            <input value={link} onChange={e => setLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 font-mono" />
            {ytThumb && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/[0.04] p-3">
                <img src={ytThumb} alt="YouTube preview" className="w-24 h-14 object-cover rounded-md border border-white/10" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] tracking-widest uppercase text-gold/70 font-bold flex items-center gap-2">
                    YouTube
                    {autoFilling && (
                      <span className="inline-flex items-center gap-1 normal-case tracking-normal text-white/55 font-normal text-[10px]">
                        <span className="inline-block w-2.5 h-2.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        a obter dados…
                      </span>
                    )}
                    {!autoFilling && autoFilled && (
                      <span className="normal-case tracking-normal text-emerald-300 font-normal text-[10px]">✓ título e artista preenchidos</span>
                    )}
                  </p>
                  <p className="text-[11px] text-white/55 mt-0.5 truncate">Preview · capa será usada automaticamente</p>
                </div>
              </div>
            )}
          </div>

          {/* Título + Artista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Título <span className="text-red-400">*</span></p>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Perfect"
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Artista</p>
              <input value={artist} onChange={e => setArtist(e.target.value)}
                placeholder="Ex: Ed Sheeran"
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50" />
            </div>
          </div>

          {/* Momento */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Momento</p>
            <select value={momento} onChange={e => setMomento(e.target.value as Momento)}
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/50">
              {MOMENTO_OPTIONS.map(m => <option key={m} value={m} style={{ background: '#1a1206' }}>{m}</option>)}
            </select>
          </div>

          {/* Género + Clima + Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Género</p>
              <select value={genero} onChange={e => setGenero(e.target.value as Genero)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/50">
                {GENERO_OPTIONS.map(g => <option key={g} value={g} style={{ background: '#1a1206' }}>{g}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Clima</p>
              <select value={clima} onChange={e => setClima(e.target.value as Clima)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/50">
                {CLIMA_OPTIONS.map(c => <option key={c} value={c} style={{ background: '#1a1206' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Duração</p>
              <input value={duracao} onChange={e => setDuracao(e.target.value)}
                placeholder="3:45"
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 font-mono" />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/65 text-[12px] font-semibold tracking-wider hover:border-white/25 hover:text-white transition-all">
              Cancelar
            </button>
            <button type="button" onClick={submit} disabled={!valid}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 0 18px -4px rgba(201,164,92,0.5)' }}>
              ✓ Adicionar Música
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  MODAL: TROCAR FOTO DO CARD DE CATEGORIA
// ────────────────────────────────────────────────────────────────────────
function EditCoverModal({
  momento,
  currentCover,
  hasCustom,
  onClose,
  onSave,
  onReset,
}: {
  momento: Momento
  currentCover: string
  hasCustom: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
  onReset: () => void
}) {
  const [url, setUrl] = useState('')
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Selecciona uma imagem.'); return }
    if (f.size > 2 * 1024 * 1024) { setError('Imagem demasiado grande (máx 2 MB).'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setFilePreview(result)
        setUrl('')
      }
    }
    reader.readAsDataURL(f)
  }

  function submit() {
    const value = filePreview || url.trim()
    if (!value) { setError('Selecciona um ficheiro ou cola um URL.'); return }
    onSave(value)
  }

  const previewSrc = filePreview || (url.trim() && /^https?:\/\//.test(url.trim()) ? url.trim() : currentCover)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-md rounded-2xl border border-gold/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 40px -10px rgba(201,164,92,0.35)' }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 flex items-center justify-center text-lg z-10">×</button>

        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-2">Categoria</p>
          <h2 className="text-2xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Trocar foto · <span className="italic text-gold">{momento}</span>
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Preview */}
          <div className="relative w-full aspect-[3/2.4] rounded-xl overflow-hidden border border-white/15">
            {previewSrc ? (
              <img src={previewSrc} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[12px]">Sem imagem</div>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)' }} />
            <p className="absolute bottom-3 left-3 text-[14px] font-bold tracking-[0.18em] uppercase text-white" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{momento}</p>
          </div>

          {/* Upload ficheiro */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Carregar do computador</p>
            <label className="block w-full cursor-pointer">
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
              <div className="rounded-lg border border-dashed border-white/15 hover:border-gold/40 px-4 py-3 text-center transition-all">
                <p className="text-[13px] text-white/65">📤 Escolher imagem</p>
                <p className="text-[10px] text-white/30 mt-0.5">PNG, JPG · máx 2 MB</p>
              </div>
            </label>
          </div>

          {/* OU URL */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-2">Ou colar URL</p>
            <input value={url} onChange={e => { setUrl(e.target.value); setFilePreview(null) }}
              placeholder="https://..."
              className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 font-mono" />
          </div>

          {error && (
            <p className="text-[12px] text-red-300 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">⚠ {error}</p>
          )}

          {/* Botões */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white/65 text-[12px] font-semibold tracking-wider hover:border-white/25 hover:text-white transition-all">
                Cancelar
              </button>
              <button type="button" onClick={submit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all"
                style={{ boxShadow: '0 0 18px -4px rgba(201,164,92,0.5)' }}>
                ✓ Guardar
              </button>
            </div>
            {hasCustom && (
              <button type="button" onClick={onReset}
                className="w-full text-[11px] text-white/40 hover:text-red-300 transition-colors py-2">
                ↺ Repor imagem original
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  MODAL: ASSOCIAR MÚSICA A PROJETO
// ────────────────────────────────────────────────────────────────────────
function AssociarProjetoModal({
  track,
  onClose,
}: {
  track: Track
  onClose: () => void
}) {
  // Lista projetos (user-projects + mocks com patches, filtra eliminados)
  const [projects, setProjects] = useState<{ id: string; noivos: string; foto?: string; dataCasamento?: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tick, setTick] = useState(0)

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('painel-editor-user-projects')
      const userProjects: any[] = userRaw ? JSON.parse(userRaw) : []
      const patchesRaw = localStorage.getItem('painel-editor-project-patches')
      const patches: Record<string, any> = patchesRaw ? JSON.parse(patchesRaw) : {}

      const mocks = MOCK_PROJECTS
        .map((p: any) => patches[p.id] ? { ...p, ...patches[p.id] } : p)
        .filter((p: any) => !p.archived && !p.cancelled)

      const all = [
        ...userProjects.filter((p: any) => !p.archived && !p.cancelled),
        ...mocks,
      ].map((p: any) => ({ id: p.id, noivos: p.noivos, foto: p.foto, dataCasamento: p.dataCasamento }))

      const seen = new Set<string>()
      setProjects(all.filter(p => p?.id && !seen.has(p.id) && (seen.add(p.id), true)))

      // Pre-fill selected com os projetos já associados a esta track
      const assoc = loadAssociacao()
      const linked = new Set<string>()
      Object.keys(assoc).forEach(pid => {
        if ((assoc[pid] || []).includes(track.id)) linked.add(pid)
      })
      setSelected(linked)
    } catch {}
  }, [track.id, tick])

  function toggle(projectId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
        disassociate(track.id, projectId)
      } else {
        next.add(projectId)
        associate(track.id, projectId)
      }
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl border border-gold/30 overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98), rgba(11,9,5,0.99))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 40px -10px rgba(201,164,92,0.35)', maxHeight: '85vh' }}>
        <button onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-white/10 text-white/55 hover:text-gold hover:border-gold/30 flex items-center justify-center text-lg z-10">×</button>

        {/* Header com música */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <p className="text-[11px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-2">Associar Música</p>
          <div className="flex items-center gap-3">
            {track.cover && (
              <img src={track.cover} alt={track.title} className="w-12 h-12 rounded-md object-cover border border-white/15 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-light text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="italic text-gold">{track.title}</span>
              </p>
              <p className="text-[11px] text-white/55 truncate mt-0.5">{track.artist} · {track.duracao}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/45 mt-3">
            Selecciona um ou mais projetos. A música aparecerá em "Músicas Utilizadas" na ficha do projeto.
          </p>
        </div>

        {/* Lista de projetos */}
        <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 200 }}>
          {projects.length === 0 ? (
            <p className="text-[12px] text-white/30 italic text-center py-8">Nenhum projeto disponível.</p>
          ) : (
            <div className="space-y-1.5">
              {projects.map(p => {
                const isSelected = selected.has(p.id)
                return (
                  <button key={p.id} onClick={() => toggle(p.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-gold/45 bg-gold/[0.06]'
                        : 'border-white/[0.06] hover:border-gold/25 hover:bg-white/[0.02]'
                    }`}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.noivos} className="w-10 h-10 rounded-md object-cover border border-white/10 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/30 shrink-0">◫</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-gold' : 'text-white/85'}`}>{p.noivos}</p>
                      {p.dataCasamento && <p className="text-[10px] text-white/40 mt-0.5">Casamento · {p.dataCasamento}</p>}
                    </div>
                    {/* Check */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-gold border-gold'
                        : 'border-white/25'
                    }`}>
                      {isSelected && <span className="text-[10px] text-black font-bold">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-5 py-3 shrink-0 flex items-center justify-between gap-3">
          <p className="text-[11px] text-white/45">
            {selected.size === 0 ? 'Nenhum projeto selecionado' : `${selected.size} projeto${selected.size === 1 ? '' : 's'} associado${selected.size === 1 ? '' : 's'}`}
          </p>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 14px -4px rgba(201,164,92,0.5)' }}>
            ✓ Concluído
          </button>
        </div>
      </div>
    </div>
  )
}
