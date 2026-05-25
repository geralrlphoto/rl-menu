'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { NotificationBell } from '../_components/NotificationBell'
import { MessagesBell } from '../_components/MessagesBell'
import { BrandLogo } from '../_components/BrandLogo'

// ────────────────────────────────────────────────────────────────────────
//  EDIÇÃO DE FOTOGRAFIAS — Wedding Moments Films (Painel Fotógrafo)
//  Presets, LUTs, estilos visuais e referências de edição
// ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-fotografo' },
  { key: 'novos',       label: 'Novos Eventos',       icon: '+', href: '/painel-fotografo/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-fotografo/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-fotografo/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-fotografo/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-fotografo/workflow' },
  { key: 'edicao',      label: 'Edição Fotos',        icon: '◐', href: '/painel-fotografo/edicao-fotos', active: true },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-fotografo/dados-pessoais' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────
type Estilo =
  | 'Natural Light' | 'Cinematic' | 'Black & White' | 'Vintage Film' | 'Editorial'
  | 'Bright & Airy' | 'Moody Dark' | 'Boho Warm' | 'Classic' | 'Pastel'
type Tipo = 'Preset' | 'LUT' | 'Action' | 'Brush'
type Plataforma = 'Lightroom' | 'Photoshop' | 'Capture One' | 'Camera Raw'

type Preset = {
  id: string
  nome: string
  autor: string
  cover: string
  estilo: Estilo
  tipo: Tipo
  plataforma: Plataforma
  duracao?: string         // tempo médio de aplicação por foto
  favorita: boolean
  usadaEm: number          // nº de fotos editadas com este preset
}

// ── Categorias (estilo + cover) ───────────────────────────────────────────
type Categoria = { estilo: Estilo; count: number; cover: string; lastUpdate: string }

const CATEGORIAS: Categoria[] = [
  { estilo: 'Natural Light',  count: 184, cover: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop', lastUpdate: '20/05/2026' },
  { estilo: 'Cinematic',      count: 142, cover: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop', lastUpdate: '19/05/2026' },
  { estilo: 'Black & White',  count: 96,  cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop?sat=-100', lastUpdate: '18/05/2026' },
  { estilo: 'Vintage Film',   count: 78,  cover: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop', lastUpdate: '17/05/2026' },
  { estilo: 'Editorial',      count: 64,  cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', lastUpdate: '17/05/2026' },
  { estilo: 'Bright & Airy',  count: 112, cover: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&h=400&fit=crop', lastUpdate: '16/05/2026' },
  { estilo: 'Moody Dark',     count: 88,  cover: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop', lastUpdate: '15/05/2026' },
  { estilo: 'Boho Warm',      count: 54,  cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop', lastUpdate: '14/05/2026' },
  { estilo: 'Classic',        count: 132, cover: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=600&h=400&fit=crop', lastUpdate: '13/05/2026' },
  { estilo: 'Pastel',         count: 42,  cover: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop',  lastUpdate: '12/05/2026' },
]

// ── Mock presets ──────────────────────────────────────────────────────────
const PRESETS: Preset[] = [
  { id: 'p1',  nome: 'Golden Hour Glow',           autor: 'Mastin Labs',    cover: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop',  estilo: 'Natural Light',  tipo: 'Preset',  plataforma: 'Lightroom', duracao: '8s',  favorita: true,  usadaEm: 312 },
  { id: 'p2',  nome: 'Cinematic Wedding',           autor: 'VSCO',           cover: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=200&h=200&fit=crop',  estilo: 'Cinematic',      tipo: 'LUT',     plataforma: 'Camera Raw', duracao: '12s', favorita: true,  usadaEm: 245 },
  { id: 'p3',  nome: 'Tri-X 400 Film',              autor: 'RNI Films',      cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&h=200&fit=crop',  estilo: 'Black & White',  tipo: 'Preset',  plataforma: 'Lightroom', duracao: '6s',  favorita: false, usadaEm: 178 },
  { id: 'p4',  nome: 'Portra 400',                  autor: 'Mastin Labs',    cover: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=200&h=200&fit=crop',  estilo: 'Vintage Film',   tipo: 'Preset',  plataforma: 'Lightroom', duracao: '10s', favorita: true,  usadaEm: 287 },
  { id: 'p5',  nome: 'Editorial Magazine',          autor: 'Tribe Archipelago', cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop',  estilo: 'Editorial',      tipo: 'Preset',  plataforma: 'Capture One', duracao: '14s', favorita: false, usadaEm: 142 },
  { id: 'p6',  nome: 'Bright & Airy Whites',        autor: 'Greater Than Gatsby', cover: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=200&h=200&fit=crop',  estilo: 'Bright & Airy',  tipo: 'Preset',  plataforma: 'Lightroom', duracao: '7s',  favorita: true,  usadaEm: 198 },
  { id: 'p7',  nome: 'Moody Forest',                autor: 'Sleeklens',      cover: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=200&h=200&fit=crop',  estilo: 'Moody Dark',     tipo: 'Preset',  plataforma: 'Lightroom', duracao: '11s', favorita: false, usadaEm: 89 },
  { id: 'p8',  nome: 'Boho Warm Tones',             autor: 'Indie Presets',  cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=200&h=200&fit=crop',  estilo: 'Boho Warm',      tipo: 'Preset',  plataforma: 'Lightroom', duracao: '9s',  favorita: false, usadaEm: 67 },
  { id: 'p9',  nome: 'Skin Smoothing Pro',          autor: 'Custom RL',      cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',  estilo: 'Editorial',      tipo: 'Action',  plataforma: 'Photoshop', duracao: '4s',  favorita: true,  usadaEm: 421 },
  { id: 'p10', nome: 'Classic Wedding Look',        autor: 'KT Merry',       cover: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=200&h=200&fit=crop',  estilo: 'Classic',        tipo: 'Preset',  plataforma: 'Lightroom', duracao: '8s',  favorita: false, usadaEm: 156 },
  { id: 'p11', nome: 'Pastel Pink Dreams',          autor: 'VSCO',           cover: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&h=200&fit=crop',  estilo: 'Pastel',         tipo: 'Preset',  plataforma: 'Lightroom', duracao: '7s',  favorita: false, usadaEm: 54 },
  { id: 'p12', nome: 'Wedding Magic LUT',           autor: 'Custom RL',      cover: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',  estilo: 'Cinematic',      tipo: 'LUT',     plataforma: 'Camera Raw', duracao: '13s', favorita: true,  usadaEm: 312 },
]

// Classes por estilo (cor do badge)
const ESTILO_CLS: Record<Estilo, string> = {
  'Natural Light':  'bg-amber-400/15 text-amber-300 border-amber-400/30',
  'Cinematic':      'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Black & White':  'bg-white/[0.08] text-white/80 border-white/15',
  'Vintage Film':   'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Editorial':      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Bright & Airy':  'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Moody Dark':     'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Boho Warm':      'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  'Classic':        'bg-gold/15 text-gold border-gold/30',
  'Pastel':         'bg-pink-400/15 text-pink-300 border-pink-400/30',
}

const TIPO_CLS: Record<Tipo, string> = {
  'Preset': 'text-gold',
  'LUT':    'text-purple-300',
  'Action': 'text-emerald-300',
  'Brush':  'text-cyan-300',
}

const STORAGE_KEY = 'painel-fotografo-presets'

// ────────────────────────────────────────────────────────────────────────
//  PAGE
// ────────────────────────────────────────────────────────────────────────
export default function EdicaoFotosPage() {
  const [presets, setPresets] = useState<Preset[]>(PRESETS)
  const [search, setSearch] = useState('')
  const [filterEstilo, setFilterEstilo] = useState<'Todos os Estilos' | Estilo>('Todos os Estilos')
  const [filterTipo, setFilterTipo] = useState<'Todos os Tipos' | Tipo>('Todos os Tipos')
  const [filterPlataforma, setFilterPlataforma] = useState<'Todas as Plataformas' | Plataforma>('Todas as Plataformas')
  const [activeCategoria, setActiveCategoria] = useState<Estilo | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Persistência localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Preset[]
        if (Array.isArray(parsed) && parsed.length > 0) setPresets(parsed)
      }
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)) } catch {}
  }, [presets])

  // Filtrar
  const filtered = useMemo(() => {
    return presets.filter(p => {
      if (activeCategoria && p.estilo !== activeCategoria) return false
      if (filterEstilo !== 'Todos os Estilos' && p.estilo !== filterEstilo) return false
      if (filterTipo !== 'Todos os Tipos' && p.tipo !== filterTipo) return false
      if (filterPlataforma !== 'Todas as Plataformas' && p.plataforma !== filterPlataforma) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!p.nome.toLowerCase().includes(q) && !p.autor.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [presets, search, filterEstilo, filterTipo, filterPlataforma, activeCategoria])

  // Stats
  const stats = useMemo(() => {
    const total = presets.length
    const favoritas = presets.filter(p => p.favorita).length
    const fotosEditadas = presets.reduce((s, p) => s + p.usadaEm, 0)
    const luts = presets.filter(p => p.tipo === 'LUT').length
    return { total, favoritas, fotosEditadas, luts }
  }, [presets])

  function toggleFav(id: string) {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, favorita: !p.favorita } : p))
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <Sidebar />

      <main className="relative z-10 pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1700px] mx-auto">

          {/* HERO */}
          <Hero onAdd={() => setShowAddModal(true)} stats={stats} />

          {/* SEARCH + FILTERS */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 mt-5 mb-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar presets, LUTs, actions…"
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl pl-10 pr-3 py-3 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect value={filterEstilo} onChange={setFilterEstilo as any}
                options={['Todos os Estilos', ...Array.from(new Set(presets.map(p => p.estilo)))]} />
              <FilterSelect value={filterTipo} onChange={setFilterTipo as any}
                options={['Todos os Tipos', ...Array.from(new Set(presets.map(p => p.tipo)))]} />
              <FilterSelect value={filterPlataforma} onChange={setFilterPlataforma as any}
                options={['Todas as Plataformas', ...Array.from(new Set(presets.map(p => p.plataforma)))]} />
            </div>
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

            {/* MAIN: Categorias + Tabela */}
            <div className="flex flex-col gap-5">

              {/* CATEGORIAS (horizontal scroll) */}
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-flow-col auto-cols-[180px] gap-3 pb-1">
                  {CATEGORIAS.map(c => (
                    <CategoryCard key={c.estilo} c={c}
                      active={activeCategoria === c.estilo}
                      onClick={() => setActiveCategoria(activeCategoria === c.estilo ? null : c.estilo)} />
                  ))}
                </div>
              </div>

              {/* TABELA Presets */}
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-md"
                style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.65))', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                      {activeCategoria ? (
                        <>Presets · <span className="italic text-gold">{activeCategoria}</span></>
                      ) : 'Presets Recentes'}
                    </h2>
                    <span className="text-[11px] tracking-widest uppercase text-white/45 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.02]">
                      {filtered.length} {filtered.length === 1 ? 'preset' : 'presets'}
                    </span>
                  </div>
                  {activeCategoria && (
                    <button onClick={() => setActiveCategoria(null)}
                      className="text-[11px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors px-3 py-1.5 rounded-lg border border-gold/30 hover:bg-gold/10">
                      ← Ver todos
                    </button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="text-[10px] tracking-widest uppercase text-white/35 bg-white/[0.02]">
                        <th className="text-left px-4 py-3 font-medium">Preset</th>
                        <th className="text-left px-3 py-3 font-medium">Autor</th>
                        <th className="text-left px-3 py-3 font-medium">Tipo</th>
                        <th className="text-left px-3 py-3 font-medium">Plataforma</th>
                        <th className="text-left px-3 py-3 font-medium">Tempo</th>
                        <th className="text-left px-3 py-3 font-medium">Estilo</th>
                        <th className="text-right px-4 py-3 font-medium">Aplicações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 10).map(p => (
                        <tr key={p.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                <img src={p.cover} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{p.nome}</p>
                                <p className="text-[11px] text-white/40 truncate">{p.tipo} · {p.plataforma}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[12px] text-white/70">{p.autor}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[11px] font-semibold ${TIPO_CLS[p.tipo]}`}>{p.tipo}</span>
                          </td>
                          <td className="px-3 py-3 text-[12px] text-white/60">{p.plataforma}</td>
                          <td className="px-3 py-3 text-[12px] text-white/60 font-mono">{p.duracao ?? '—'}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest uppercase font-bold ${ESTILO_CLS[p.estilo]}`}>
                              {p.estilo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <span className="text-[12px] text-white/70 tabular-nums">{p.usadaEm.toLocaleString('pt-PT')}</span>
                              <button onClick={() => toggleFav(p.id)}
                                className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                                  p.favorita ? 'text-red-400 bg-red-500/10' : 'text-white/45 hover:text-red-400 hover:bg-white/[0.04]'
                                }`} title="Favoritar">
                                {p.favorita ? '♥' : '♡'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-white/40 text-[13px]">
                            Nenhum preset corresponde aos filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Estatísticas + Favoritos */}
            <div className="flex flex-col gap-5">

              {/* CARD Infos da Biblioteca */}
              <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold/80 mb-4">Biblioteca de Edição</h3>

                <Stat label="Presets Totais" value={stats.total.toString()} />
                <Stat label="LUTs" value={stats.luts.toString()} />
                <Stat label="Favoritas" value={stats.favoritas.toString()} />
                <Stat label="Fotos Editadas" value={stats.fotosEditadas.toLocaleString('pt-PT')} highlight />
              </div>

              {/* CARD Favoritos */}
              <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold/80">Favoritos</h3>
                  <span className="text-red-400/70 text-[14px]">♥</span>
                </div>
                <div className="flex flex-col gap-3">
                  {presets.filter(p => p.favorita).slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={p.cover} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-white truncate">{p.nome}</p>
                        <p className="text-[10px] text-white/40 truncate">{p.estilo} · {p.usadaEm} aplicações</p>
                      </div>
                    </div>
                  ))}
                  {presets.filter(p => p.favorita).length === 0 && (
                    <p className="text-[12px] text-white/40 italic">Sem favoritos ainda — adiciona ♥ para marcares os teus presets preferidos.</p>
                  )}
                </div>
              </div>

              {/* CARD Estilos Top */}
              <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-md"
                style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.4), rgba(11,11,11,0.7))', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                <h3 className="text-[13px] tracking-[0.3em] uppercase text-gold/80 mb-4">Top Estilos</h3>
                {(() => {
                  const counts: Record<string, number> = {}
                  presets.forEach(p => { counts[p.estilo] = (counts[p.estilo] ?? 0) + p.usadaEm })
                  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  const max = sorted[0]?.[1] ?? 1
                  return (
                    <div className="flex flex-col gap-3">
                      {sorted.map(([estilo, n]) => (
                        <div key={estilo}>
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="text-white/70">{estilo}</span>
                            <span className="text-white/45 tabular-nums">{n.toLocaleString('pt-PT')}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: 'linear-gradient(90deg, #C9A45C 0%, #d4af6c 100%)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] mt-10 py-6 px-8">
          <div className="max-w-[1700px] mx-auto flex items-center justify-between">
            <p className="text-[10px] tracking-[0.5em] uppercase text-white/30">RL Photo.Video · Painel Fotógrafo</p>
            <p className="text-[10px] tracking-widest uppercase text-white/30">© 2026 · v1.0</p>
          </div>
        </footer>
      </main>

      {/* Modal Adicionar Preset */}
      {showAddModal && <AddPresetModal onClose={() => setShowAddModal(false)} onSave={(p) => { setPresets(prev => [p, ...prev]); setShowAddModal(false) }} />}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
//  COMPONENTS
// ────────────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside
      className="flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,12,8,0.96) 0%, rgba(11,9,5,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(201,164,92,0.12)',
      }}
    >
      <BrandLogo />
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(it => {
          const cls = `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
            (it as any).active
              ? 'bg-gold/10 border border-gold/30 text-gold'
              : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
          }`
          return (
            <Link key={it.key} href={it.href} className={cls}>
              <span className={`w-5 text-center text-base ${(it as any).active ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-5 border-t border-white/[0.04]">
        <p className="text-gold/40 text-2xl font-serif leading-none mb-2">&ldquo;</p>
        <p className="text-[11px] text-white/35 italic leading-relaxed">A foto perfeita não é capturada.</p>
        <p className="text-[11px] text-white/35 italic leading-relaxed">É editada com alma.</p>
      </div>
    </aside>
  )
}

function Hero({ onAdd, stats }: { onAdd: () => void; stats: { total: number; favoritas: number; fotosEditadas: number; luts: number } }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-5"
      style={{ boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)', background: 'linear-gradient(135deg, rgba(20,15,8,0.6), rgba(11,11,11,0.85))' }}>
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1554941829-202a0b2403b8?w=1600&h=400&fit=crop" alt="" className="w-full h-full object-cover opacity-15" />
      </div>
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(90deg, rgba(11,11,11,0.85) 0%, rgba(11,11,11,0.6) 60%, rgba(11,11,11,0.3) 100%)' }} />
      <div className="relative z-10 px-7 py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <p className="text-[11px] tracking-[0.5em] text-gold/70 uppercase mb-2">Atelier Visual</p>
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Edição de <span className="italic text-gold">Fotografias</span>
          </h1>
          <div className="mt-3 h-px w-16 bg-gradient-to-r from-gold/70 to-transparent" />
          <p className="text-[13px] text-white/55 mt-3 leading-relaxed max-w-md">
            Presets, LUTs e estilos visuais para dar identidade às tuas fotografias de casamento.
          </p>
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Presets" value={stats.total} />
          <MiniStat label="LUTs" value={stats.luts} />
          <MiniStat label="Favoritos" value={stats.favoritas} />
          <MiniStat label="Editadas" value={stats.fotosEditadas} highlight />
        </div>

        <button onClick={onAdd}
          className="self-start lg:self-center inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[12px] tracking-widest uppercase font-semibold text-black bg-gold hover:bg-gold/90 transition-all"
          style={{ boxShadow: '0 0 18px rgba(201,164,92,0.45)' }}>
          + Novo Preset
        </button>
      </div>

      {/* Bells flutuantes */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <MessagesBell />
        <NotificationBell />
      </div>
    </div>
  )
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${highlight ? 'border-gold/30 bg-gold/[0.06]' : 'border-white/[0.08] bg-black/30'}`}>
      <p className="text-[9px] tracking-[0.3em] uppercase text-white/40">{label}</p>
      <p className={`text-[18px] font-light tabular-nums ${highlight ? 'text-gold' : 'text-white'}`} style={{ fontFamily: 'Georgia, serif' }}>
        {value.toLocaleString('pt-PT')}
      </p>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="text-[12px] text-white/55">{label}</span>
      <span className={`text-[14px] tabular-nums font-light ${highlight ? 'text-gold' : 'text-white'}`} style={{ fontFamily: 'Georgia, serif' }}>
        {value}
      </span>
    </div>
  )
}

function CategoryCard({ c, active, onClick }: { c: Categoria; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative rounded-2xl overflow-hidden border transition-all text-left group ${
        active ? 'border-gold/60' : 'border-white/[0.06] hover:border-gold/30'
      }`}
      style={active ? { boxShadow: '0 0 24px -4px rgba(201,164,92,0.45)' } : {}}>
      <div className="aspect-[3/4] relative">
        <img src={c.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[13px] font-semibold text-white">{c.estilo}</p>
          <p className="text-[10px] tracking-widest uppercase text-white/60 mt-0.5">{c.count} presets</p>
        </div>
        {active && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gold text-black flex items-center justify-center text-[11px] font-bold">✓</div>}
      </div>
    </button>
  )
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none bg-black/30 border border-white/[0.08] rounded-xl pl-3 pr-8 py-3 text-[13px] text-white/75 focus:outline-none focus:border-gold/40 cursor-pointer">
        {options.map(o => <option key={o} value={o} className="bg-[#0A0A0A]">{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px]">▼</span>
    </div>
  )
}

// ── Modal Adicionar Preset ────────────────────────────────────────────────
function AddPresetModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Preset) => void }) {
  const [nome, setNome] = useState('')
  const [autor, setAutor] = useState('')
  const [estilo, setEstilo] = useState<Estilo>('Natural Light')
  const [tipo, setTipo] = useState<Tipo>('Preset')
  const [plataforma, setPlataforma] = useState<Plataforma>('Lightroom')

  function save() {
    if (!nome.trim()) return
    onSave({
      id: `u${Date.now()}`,
      nome: nome.trim(),
      autor: autor.trim() || 'Custom',
      cover: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop',
      estilo, tipo, plataforma,
      duracao: '—',
      favorita: false,
      usadaEm: 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gold/20 p-6"
        style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.95), rgba(11,11,11,0.98))' }}>
        <h2 className="text-2xl font-light text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Novo <span className="italic text-gold">Preset</span>
        </h2>
        <p className="text-[12px] text-white/45 mb-5">Adiciona um preset, LUT ou action à tua biblioteca de edição.</p>

        <div className="flex flex-col gap-3">
          <Field label="Nome">
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40"
              placeholder="Ex: Golden Hour Glow" />
          </Field>
          <Field label="Autor">
            <input value={autor} onChange={e => setAutor(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40"
              placeholder="Ex: Mastin Labs" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estilo">
              <select value={estilo} onChange={e => setEstilo(e.target.value as Estilo)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40">
                {(['Natural Light','Cinematic','Black & White','Vintage Film','Editorial','Bright & Airy','Moody Dark','Boho Warm','Classic','Pastel'] as Estilo[]).map(e =>
                  <option key={e} value={e} className="bg-[#0A0A0A]">{e}</option>
                )}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={tipo} onChange={e => setTipo(e.target.value as Tipo)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40">
                {(['Preset','LUT','Action','Brush'] as Tipo[]).map(t =>
                  <option key={t} value={t} className="bg-[#0A0A0A]">{t}</option>
                )}
              </select>
            </Field>
          </div>
          <Field label="Plataforma">
            <select value={plataforma} onChange={e => setPlataforma(e.target.value as Plataforma)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-gold/40">
              {(['Lightroom','Photoshop','Capture One','Camera Raw'] as Plataforma[]).map(p =>
                <option key={p} value={p} className="bg-[#0A0A0A]">{p}</option>
              )}
            </select>
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.08] text-white/70 hover:bg-white/[0.04] text-[12px] tracking-wider uppercase">
            Cancelar
          </button>
          <button onClick={save}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gold text-black hover:bg-gold/90 text-[12px] tracking-wider uppercase font-semibold"
            style={{ boxShadow: '0 0 18px rgba(201,164,92,0.4)' }}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
