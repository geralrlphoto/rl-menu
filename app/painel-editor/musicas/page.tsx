'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PROJECTS } from '../_data/projects'

// ────────────────────────────────────────────────────────────────────────
//  BIBLIOTECA DE MÚSICAS — Wedding Moments Films
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Novos Projetos',      icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'edicao',      label: 'Em Edição',           icon: '✎' },
  { key: 'finalizados', label: 'Finalizados',         icon: '✓' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'clientes',    label: 'Clientes',            icon: '☉' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow' },
  { key: 'musicas',     label: 'Biblioteca Músicas',  icon: '♪', href: '/painel-editor/musicas', active: true },
  { key: 'templates',   label: 'Templates',           icon: '◫' },
  { key: 'config',      label: 'Configurações',       icon: '⚙' },
]

type Mood = 'Romântica' | 'Emocional' | 'Cinemática' | 'Acústica' | 'Festiva' | 'Épica' | 'Calma'
type Genre = 'Cinematic' | 'Acústica' | 'Indie Folk' | 'Pop' | 'Classical' | 'Electronic' | 'Jazz'
type License = 'Premium' | 'Standard' | 'Exclusivo'

type Track = {
  id: string
  title: string
  artist: string
  cover: string
  mood: Mood
  genre: Genre
  duration: string
  bpm: number
  key: string
  license: License
  uses: number
  favorite: boolean
  usedInProjects: string[]
}

const TRACKS: Track[] = [
  { id: 'm1',  title: 'Forever Yours',         artist: 'Aurora Strings',   cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop', mood: 'Romântica',  genre: 'Cinematic',  duration: '3:42', bpm: 72,  key: 'C maj',  license: 'Premium',   uses: 28, favorite: true,  usedInProjects: ['p1','p4'] },
  { id: 'm2',  title: 'Promise Day',           artist: 'Léonie Cherie',    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', mood: 'Emocional',  genre: 'Classical',  duration: '4:18', bpm: 60,  key: 'D maj',  license: 'Exclusivo', uses: 15, favorite: true,  usedInProjects: ['p2'] },
  { id: 'm3',  title: 'Golden Hour',           artist: 'Sebastian Marí',   cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', mood: 'Cinemática', genre: 'Cinematic',  duration: '5:03', bpm: 92,  key: 'A min',  license: 'Premium',   uses: 42, favorite: true,  usedInProjects: ['p1','p2','p3'] },
  { id: 'm4',  title: 'Soft Light',            artist: 'Mei Lin',          cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', mood: 'Calma',      genre: 'Acústica',   duration: '3:25', bpm: 68,  key: 'G maj',  license: 'Standard',  uses: 18, favorite: false, usedInProjects: ['p5'] },
  { id: 'm5',  title: 'Dancing Lights',        artist: 'Pavel Romm',       cover: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=400&fit=crop', mood: 'Festiva',    genre: 'Pop',        duration: '3:14', bpm: 120, key: 'F maj',  license: 'Standard',  uses: 35, favorite: false, usedInProjects: ['p4'] },
  { id: 'm6',  title: 'Eternal Sky',           artist: 'Aurora Strings',   cover: 'https://images.unsplash.com/photo-1502139214982-d0ad755818d8?w=400&h=400&fit=crop', mood: 'Épica',      genre: 'Cinematic',  duration: '6:12', bpm: 80,  key: 'E min',  license: 'Premium',   uses: 23, favorite: true,  usedInProjects: ['p3'] },
  { id: 'm7',  title: 'Whispered Vows',        artist: 'Léonie Cherie',    cover: 'https://images.unsplash.com/photo-1465895853395-2c4ee3d6b9c0?w=400&h=400&fit=crop', mood: 'Romântica',  genre: 'Acústica',   duration: '3:51', bpm: 65,  key: 'B♭ maj', license: 'Premium',   uses: 31, favorite: true,  usedInProjects: ['p2','p5'] },
  { id: 'm8',  title: 'Sunset Kiss',           artist: 'Otavio Cruz',      cover: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&h=400&fit=crop', mood: 'Emocional',  genre: 'Indie Folk', duration: '4:02', bpm: 75,  key: 'D min',  license: 'Standard',  uses: 12, favorite: false, usedInProjects: [] },
  { id: 'm9',  title: 'Beyond the Aisle',      artist: 'Sebastian Marí',   cover: 'https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=400&h=400&fit=crop', mood: 'Cinemática', genre: 'Cinematic',  duration: '4:45', bpm: 88,  key: 'F♯ min', license: 'Exclusivo', uses: 19, favorite: false, usedInProjects: ['p1'] },
  { id: 'm10', title: 'Champagne Night',       artist: 'Mariella Bossa',   cover: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&h=400&fit=crop', mood: 'Festiva',    genre: 'Jazz',       duration: '3:38', bpm: 110, key: 'C maj',  license: 'Standard',  uses: 22, favorite: false, usedInProjects: ['p4'] },
  { id: 'm11', title: 'Slow Dance',            artist: 'Mei Lin',          cover: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=400&h=400&fit=crop', mood: 'Romântica',  genre: 'Jazz',       duration: '4:21', bpm: 70,  key: 'A♭ maj', license: 'Premium',   uses: 27, favorite: true,  usedInProjects: ['p3','p5'] },
  { id: 'm12', title: 'Hearts in Bloom',       artist: 'Aurora Strings',   cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop', mood: 'Emocional',  genre: 'Classical',  duration: '5:29', bpm: 64,  key: 'G♯ min', license: 'Exclusivo', uses: 38, favorite: true,  usedInProjects: ['p1','p2','p3','p4'] },
]

const MOOD_COLORS: Record<Mood, string> = {
  'Romântica':  '#f472b6',
  'Emocional':  '#a78bfa',
  'Cinemática': '#C9A45C',
  'Acústica':   '#10b981',
  'Festiva':    '#fb923c',
  'Épica':      '#ef4444',
  'Calma':      '#60a5fa',
}

const LICENSE_BADGE: Record<License, string> = {
  'Premium':   'bg-gold/15 text-gold border-gold/30',
  'Standard':  'bg-white/[0.06] text-white/55 border-white/15',
  'Exclusivo': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
}

const MOODS: ('Todas' | Mood)[] = ['Todas','Romântica','Emocional','Cinemática','Acústica','Festiva','Épica','Calma']

export default function MusicasPage() {
  const [tracks, setTracks] = useState<Track[]>(TRACKS)
  const [moodFilter, setMoodFilter] = useState<typeof MOODS[number]>('Todas')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'Mais usadas' | 'Recentes' | 'Duração' | 'BPM'>('Mais usadas')
  const [currentId, setCurrentId] = useState<string>('m3')
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(38) // % do track

  const filtered = useMemo(() => {
    let arr = tracks
    if (moodFilter !== 'Todas') arr = arr.filter(t => t.mood === moodFilter)
    if (search.trim()) arr = arr.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'Mais usadas') arr = [...arr].sort((a,b) => b.uses - a.uses)
    if (sortBy === 'BPM')         arr = [...arr].sort((a,b) => a.bpm - b.bpm)
    if (sortBy === 'Duração')     arr = [...arr].sort((a,b) => {
      const [am, as] = a.duration.split(':').map(Number)
      const [bm, bs] = b.duration.split(':').map(Number)
      return (am*60+as) - (bm*60+bs)
    })
    return arr
  }, [tracks, moodFilter, search, sortBy])

  const current = tracks.find(t => t.id === currentId) ?? tracks[0]
  const favorites = tracks.filter(t => t.favorite)
  const mostUsed = [...tracks].sort((a,b) => b.uses - a.uses).slice(0, 4)

  function toggleFavorite(id: string) {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t))
  }
  function play(id: string) {
    setCurrentId(id)
    setPlaying(true)
    setProgress(0)
  }

  // Stats por mood (donut)
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tracks.forEach(t => { counts[t.mood] = (counts[t.mood] ?? 0) + 1 })
    return counts
  }, [tracks])

  return (
    <div className="min-h-screen text-white relative pb-24" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="relative z-10 lg:pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          <Hero current={current} />

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <Kpi icon="♪" label="Total Faixas"    value={tracks.length.toString()} sub="Na biblioteca" />
            <Kpi icon="♥" label="Favoritas"       value={favorites.length.toString()} sub={`${Math.round(favorites.length/tracks.length*100)}% da coleção`} />
            <Kpi icon="✦" label="Premium"          value={tracks.filter(t => t.license === 'Premium').length.toString()} sub="Licenças premium" />
            <Kpi icon="◷" label="Total de Usos"    value={tracks.reduce((s,t) => s + t.uses, 0).toString()} sub="Em projetos finalizados" />
          </div>

          {/* GRID — Library + Side panels */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5">

            {/* MAIN — Tracks */}
            <div className="flex flex-col gap-4">

              {/* Filters */}
              <div className="rounded-2xl border border-white/[0.06] p-4 backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.5))' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {MOODS.map(m => (
                      <button key={m} onClick={() => setMoodFilter(m)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] tracking-wide transition-all ${
                          moodFilter === m
                            ? 'bg-gold/15 text-gold border border-gold/35'
                            : 'border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}>{m}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[14px]">⌕</span>
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar título ou artista…"
                        className="bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 w-60" />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                      className="bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white/70 focus:outline-none focus:border-gold/40 cursor-pointer">
                      <option>Mais usadas</option>
                      <option>Recentes</option>
                      <option>Duração</option>
                      <option>BPM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <TrackCard key={t.id}
                    t={t}
                    isCurrent={t.id === currentId}
                    isPlaying={playing && t.id === currentId}
                    onPlay={() => play(t.id)}
                    onToggleFav={() => toggleFavorite(t.id)}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/[0.08] text-center py-16">
                  <p className="text-gold/40 text-4xl font-serif leading-none mb-3">♪</p>
                  <p className="text-[14px] text-white/35">Sem músicas com este filtro.</p>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <aside className="flex flex-col gap-4">

              {/* Now Playing */}
              <NowPlayingPanel current={current} progress={progress} playing={playing} />

              {/* Favoritos */}
              <Panel title="Favoritas" right={<span className="text-[11px] text-gold/70">{favorites.length}</span>}>
                <div className="space-y-2">
                  {favorites.slice(0, 5).map(t => (
                    <button key={t.id} onClick={() => play(t.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                        currentId === t.id ? 'border-gold/30 bg-gold/[0.04]' : 'border-white/[0.06] hover:border-gold/20 hover:bg-white/[0.02]'
                      }`}>
                      <div className="w-9 h-9 rounded overflow-hidden border border-white/10 shrink-0 relative">
                        <img src={t.cover} alt="" className="w-full h-full object-cover" />
                        {currentId === t.id && playing && (
                          <div className="absolute inset-0 bg-black/50 flex items-end justify-center gap-0.5 pb-1">
                            <span className="w-0.5 h-2 bg-gold rounded-full animate-pulse" />
                            <span className="w-0.5 h-3 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <span className="w-0.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{t.title}</p>
                        <p className="text-[10px] text-white/40 truncate">{t.artist}</p>
                      </div>
                      <span className="text-[10px] text-white/35 font-mono shrink-0">{t.duration}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              {/* Mais usadas */}
              <Panel title="Top da Coleção">
                <div className="space-y-2">
                  {mostUsed.map((t, i) => (
                    <button key={t.id} onClick={() => play(t.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-all text-left">
                      <span className="w-5 text-center text-[13px] font-bold text-gold shrink-0">{i+1}</span>
                      <div className="w-9 h-9 rounded overflow-hidden border border-white/10 shrink-0">
                        <img src={t.cover} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{t.title}</p>
                        <p className="text-[10px] text-white/40 truncate">{t.uses} usos · {t.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Panel>

              {/* Stats por mood */}
              <Panel title="Distribuição por Estilo">
                <div className="space-y-2.5">
                  {Object.entries(moodCounts).map(([m, n]) => {
                    const pct = (n / tracks.length) * 100
                    const color = MOOD_COLORS[m as Mood]
                    return (
                      <div key={m}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="flex items-center gap-2 text-white/65">
                            <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {m}
                          </span>
                          <span className="text-white/55 font-semibold tabular-nums">{n}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </aside>
          </div>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-12 mb-4">RL Photo.Video · Biblioteca de Músicas</p>
        </div>
      </main>

      {/* PLAYER BAR — fixed bottom */}
      <PlayerBar current={current} progress={progress} playing={playing} onToggle={() => setPlaying(!playing)} onSeek={p => setProgress(p)} />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}>
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-gold/40 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.2), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
            <span className="text-xl">📷</span>
          </div>
          <div>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Wedding</p>
            <p className="text-[14px] tracking-[0.18em] text-gold font-bold uppercase leading-tight" style={{ fontFamily: 'Georgia, serif' }}>Moments</p>
            <p className="text-[9px] tracking-[0.35em] text-gold/70 uppercase mt-0.5">Films</p>
          </div>
        </div>
      </div>
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
          <p className="text-[11px] text-white/55 italic leading-relaxed">A música transforma o vídeo em emoção.</p>
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

function Hero({ current }: { current: Track }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
      <div className="absolute inset-0 z-0">
        <img src={current.cover} alt="" className="w-full h-full object-cover scale-110" style={{ filter: 'blur(20px) brightness(0.6)' }} />
      </div>
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.4) 100%)' }} />
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 sm:px-12 py-8">
        <div className="flex items-center gap-5 max-w-2xl">
          <div className="w-16 h-16 rounded-2xl border border-gold/40 flex items-center justify-center text-2xl text-gold shrink-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 22px -4px rgba(201,164,92,0.3)' }}>♪</div>
          <div>
            <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-1">Biblioteca Sonora</p>
            <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Música</h1>
            <p className="text-[13px] text-white/55 mt-1 leading-relaxed">Descobre a trilha sonora perfeita para cada momento eternizado.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-white/15 text-white/75 text-[13px] font-medium hover:bg-white/[0.05] hover:border-white/30 transition-all">↓ Importar</button>
          <button className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gold text-black text-[13px] font-semibold tracking-wider hover:bg-gold/90 transition-all"
            style={{ boxShadow: '0 0 24px -4px rgba(201,164,92,0.5)' }}>
            <span className="text-lg leading-none">+</span> Adicionar Música
          </button>
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-5"
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl border border-gold/30 flex items-center justify-center text-xl text-gold"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', boxShadow: '0 0 18px -4px rgba(201,164,92,0.25)' }}>{icon}</div>
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-white leading-none">{value}</p>
          <p className="text-[11px] text-white/35 mt-1">{sub}</p>
        </div>
      </div>
    </div>
  )
}

function TrackCard({ t, isCurrent, isPlaying, onPlay, onToggleFav }: { t: Track; isCurrent: boolean; isPlaying: boolean; onPlay: () => void; onToggleFav: () => void }) {
  const moodColor = MOOD_COLORS[t.mood]
  const usedProjects = t.usedInProjects.map(pid => PROJECTS.find(p => p.id === pid)).filter(Boolean)
  return (
    <div className={`group relative rounded-2xl border overflow-hidden transition-all ${
      isCurrent ? 'border-gold/40' : 'border-white/[0.06] hover:border-gold/25'
    }`}
      style={{
        background: 'linear-gradient(135deg, rgba(20,15,8,0.45), rgba(11,11,11,0.85))',
        boxShadow: isCurrent ? '0 0 30px -8px rgba(201,164,92,0.35), 0 20px 50px -20px rgba(0,0,0,0.6)' : '0 10px 30px -10px rgba(0,0,0,0.5)',
      }}>
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden">
        <img src={t.cover} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Mood ribbon */}
        <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-bold backdrop-blur-md"
          style={{ background: `${moodColor}26`, borderColor: `${moodColor}66`, color: moodColor }}>
          {t.mood}
        </span>

        {/* License */}
        <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold backdrop-blur-md ${LICENSE_BADGE[t.license]}`}>
          {t.license}
        </span>

        {/* Play button (center) */}
        <button onClick={onPlay}
          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
          <span className="w-14 h-14 rounded-full bg-gold/95 text-black flex items-center justify-center text-xl shadow-2xl"
            style={{ boxShadow: '0 0 30px rgba(201,164,92,0.6)' }}>
            {isCurrent && isPlaying ? '❚❚' : '▶'}
          </span>
        </button>

        {/* Waveform (decorative — appears when current+playing) */}
        {isCurrent && isPlaying && (
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-0.5 h-6 pointer-events-none">
            {Array.from({ length: 32 }).map((_, i) => (
              <span key={i} className="flex-1 bg-gold/80 rounded-full animate-pulse"
                style={{ height: `${20 + Math.sin(i * 0.5) * 50 + Math.random() * 30}%`, animationDelay: `${i * 0.05}s`, animationDuration: '0.8s' }} />
            ))}
          </div>
        )}

        {/* Bottom title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <p className="text-[14px] font-semibold text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>{t.title}</p>
          <p className="text-[11px] text-white/55 truncate">{t.artist}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="p-4 border-t border-white/[0.04] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[10px] text-white/45 min-w-0">
          <span className="font-mono">{t.duration}</span>
          <span>·</span>
          <span>{t.bpm} BPM</span>
          <span>·</span>
          <span>{t.key}</span>
        </div>
        <div className="flex items-center gap-1">
          {usedProjects.length > 0 && (
            <div className="flex -space-x-1.5 mr-1">
              {usedProjects.slice(0, 3).map(p => p && (
                <div key={p.id} className="w-6 h-6 rounded-full overflow-hidden border border-black" title={p.noivos}>
                  <img src={p.foto} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {usedProjects.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-black flex items-center justify-center text-[9px] font-bold text-white/70">
                  +{usedProjects.length - 3}
                </div>
              )}
            </div>
          )}
          <button onClick={onToggleFav}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              t.favorite ? 'text-red-400 bg-red-400/10' : 'text-white/35 hover:text-red-400 hover:bg-white/[0.04]'
            }`} title="Favoritar">
            {t.favorite ? '♥' : '♡'}
          </button>
          <button className="w-8 h-8 rounded-lg text-white/35 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center" title="Download">↓</button>
          <button className="w-8 h-8 rounded-lg text-white/35 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center" title="Mais">⋮</button>
        </div>
      </div>
    </div>
  )
}

function NowPlayingPanel({ current, progress, playing }: { current: Track; progress: number; playing: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/20 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))', boxShadow: '0 20px 50px -20px rgba(201,164,92,0.25), 0 10px 30px -10px rgba(0,0,0,0.6)' }}>
      {/* Cover blurred bg */}
      <div className="relative">
        <div className="absolute inset-0">
          <img src={current.cover} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(40px) brightness(0.4)' }} />
        </div>
        <div className="relative p-5">
          <div className="flex items-center gap-1 text-[10px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" style={{ boxShadow: '0 0 6px rgba(201,164,92,0.8)' }} />
            A Tocar Agora
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-gold/30 shrink-0"
              style={{ boxShadow: '0 0 20px -4px rgba(201,164,92,0.3)' }}>
              <img src={current.cover} alt="" className={`w-full h-full object-cover ${playing ? 'animate-pulse-slow' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>{current.title}</p>
              <p className="text-[12px] text-white/55 truncate">{current.artist}</p>
              <p className="text-[10px] text-gold/70 mt-1 tracking-widest uppercase">{current.mood} · {current.genre}</p>
            </div>
          </div>

          {/* Waveform mini */}
          <div className="mt-4 flex items-end justify-between gap-0.5 h-8">
            {Array.from({ length: 50 }).map((_, i) => {
              const filled = (i / 50) * 100 <= progress
              const h = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 25 + (Math.random() * 20)
              return (
                <span key={i} className="flex-1 rounded-full transition-colors"
                  style={{
                    height: `${Math.max(15, Math.min(100, h))}%`,
                    background: filled ? '#C9A45C' : 'rgba(255,255,255,0.12)',
                    boxShadow: filled ? '0 0 4px rgba(201,164,92,0.6)' : 'none',
                  }} />
              )
            })}
          </div>

          {/* Time */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-white/45 font-mono">
            <span>{Math.floor(progress * Number(current.duration.split(':')[0]) / 100)}:{String(Math.floor(progress * Number(current.duration.split(':')[1]) / 100)).padStart(2,'0')}</span>
            <span>{current.duration}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/55 border border-white/10">{current.bpm} BPM</span>
        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/55 border border-white/10">{current.key}</span>
        <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/25">{current.uses} usos</span>
      </div>
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

function PlayerBar({ current, progress, playing, onToggle, onSeek }: { current: Track; progress: number; playing: boolean; onToggle: () => void; onSeek: (p: number) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:pl-[250px]">
      <div className="m-3 lg:mx-4 rounded-2xl border border-gold/15 backdrop-blur-xl px-4 py-3 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.85), rgba(11,11,11,0.92))', boxShadow: '0 -10px 30px -10px rgba(0,0,0,0.6), 0 0 20px -8px rgba(201,164,92,0.2)' }}>
        {/* Now playing */}
        <div className="flex items-center gap-3 min-w-0 w-60">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
            <img src={current.cover} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{current.title}</p>
            <p className="text-[11px] text-white/45 truncate">{current.artist}</p>
          </div>
        </div>

        {/* Controls + Progress */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <button className="w-8 h-8 rounded-lg text-white/55 hover:text-gold transition-all flex items-center justify-center text-[13px]">⏮</button>
            <button onClick={onToggle}
              className="w-10 h-10 rounded-full bg-gold text-black flex items-center justify-center text-[14px] hover:bg-gold/90 transition-all"
              style={{ boxShadow: '0 0 16px -2px rgba(201,164,92,0.6)' }}>
              {playing ? '❚❚' : '▶'}
            </button>
            <button className="w-8 h-8 rounded-lg text-white/55 hover:text-gold transition-all flex items-center justify-center text-[13px]">⏭</button>
          </div>
          <div className="w-full max-w-xl flex items-center gap-3">
            <span className="text-[10px] text-white/45 font-mono">{Math.floor(progress * Number(current.duration.split(':')[0]) / 100)}:{String(Math.floor(progress * Number(current.duration.split(':')[1]) / 100)).padStart(2,'0')}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden cursor-pointer relative group"
              onClick={e => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const p = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
                onSeek(p)
              }}>
              <div className="h-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C9A45C, #E8C76D)', boxShadow: '0 0 8px rgba(201,164,92,0.5)' }} />
              <div className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%`, boxShadow: '0 0 8px rgba(201,164,92,0.8)' }} />
            </div>
            <span className="text-[10px] text-white/45 font-mono">{current.duration}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg text-white/55 hover:text-red-400 hover:bg-white/[0.04] transition-all flex items-center justify-center">♡</button>
          <button className="w-9 h-9 rounded-lg text-white/55 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center">↓</button>
          <button className="w-9 h-9 rounded-lg text-white/55 hover:text-gold hover:bg-white/[0.04] transition-all flex items-center justify-center">⋮</button>
        </div>
      </div>
    </div>
  )
}
