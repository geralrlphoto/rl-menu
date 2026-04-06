'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { plainText, type Block } from './NotionRenderer'
import BlockEditor from './BlockEditor'

const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

type PortalSettings = {
  hiddenNav: string[]
  noiva?: string
  noivo?: string
  dataFormatada?: string
  data?: string
  local?: string
  activeNavId?: string
  heroImageUrl?: string
  galleryUrls?: string[]  // up to 3
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function findAllChildPages(blocks: Block[]): Array<{ id: string; title: string }> {
  const out: Array<{ id: string; title: string }> = []
  for (const b of blocks) {
    if (b.type === 'child_page') out.push({ id: b.id, title: b.child_page?.title ?? '' })
    if (b.children) out.push(...findAllChildPages(b.children))
  }
  return out
}

function findImages(blocks: Block[]): string[] {
  const urls: string[] = []
  for (const b of blocks) {
    if (b.type === 'image') {
      const url = b.image?.type === 'external' ? b.image?.external?.url : b.image?.file?.url
      if (url) urls.push(url)
    }
    if (b.children) urls.push(...findImages(b.children))
  }
  return urls
}

function findWelcomeText(blocks: Block[]): { heading: string; paragraphs: string[] } {
  const heading = blocks.find(b => b.type === 'heading_2')
  const paragraphs = blocks.filter(b => b.type === 'paragraph').slice(0, 3)
  return {
    heading: heading ? plainText(heading.heading_2?.rich_text ?? []) : '',
    paragraphs: paragraphs.map(p => plainText(p.paragraph?.rich_text ?? [])).filter(Boolean),
  }
}

// ─── icons ───────────────────────────────────────────────────────────────────

function getNavIcon(title: string) {
  const t = title.toUpperCase()
  if (t.includes('ATEND'))      return <CalendarIcon />
  if (t.includes('PROPOST'))    return <DocumentIcon />
  if (t.includes('REUNIÃO') || t.includes('REUNIAO')) return <PeopleIcon />
  if (t.includes('CONFIRMAR'))  return <CheckCircleIcon />
  if (t.includes('GUIA'))       return <BookIcon />
  if (t.includes('CONTRAT'))    return <ContractIcon />
  if (t.includes('PAGAMENT'))   return <PaymentIcon />
  if (t.includes('FOTOGRAF'))   return <CameraIcon />
  if (t.includes('FILME') || t.includes('VIDEO')) return <VideoIcon />
  if (t.includes('BRIEFING'))   return <ClipboardIcon />
  if (t.includes('CRONOGRAMA')) return <ScheduleIcon />
  if (t.includes('SAT') || t.includes('ÁREA')) return <HeartIcon />
  if (t.includes('MENSAG'))     return <MessageIcon />
  if (t.includes('CHECKLIST'))  return <ChecklistIcon />
  if (t.includes('DOCUMENT'))   return <FolderIcon />
  if (t.includes('PRÉ-WEDDING') || t.includes('PRE-WEDDING')) return <CameraIcon />
  if (t.includes('ASC'))        return <CheckCircleIcon />
  if (t.includes('SOBRE'))      return <InfoIcon />
  return <DocumentIcon />
}

// SVG icons
const ico = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d={d} />
  </svg>
)
const CalendarIcon    = () => ico('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z')
const DocumentIcon    = () => ico('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')
const PeopleIcon      = () => ico('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z')
const CheckCircleIcon = () => ico('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z')
const BookIcon        = () => ico('M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253')
const ContractIcon    = () => ico('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01')
const PaymentIcon     = () => ico('M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z')
const CameraIcon      = () => ico('M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z')
const VideoIcon       = () => ico('M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z')
const ClipboardIcon   = () => ico('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2')
const ScheduleIcon    = () => ico('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z')
const HeartIcon       = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>)
const MessageIcon     = () => ico('M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z')
const ChecklistIcon   = () => ico('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4')
const FolderIcon      = () => ico('M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z')
const InfoIcon        = () => ico('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z')

// ─── countdown ───────────────────────────────────────────────────────────────

function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const Unit = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-playfair text-4xl sm:text-5xl font-bold text-white tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] tracking-[0.25em] text-white/40 uppercase mt-1">{label}</span>
    </div>
  )
  const Sep = () => <span className="font-playfair text-3xl text-gold/40 self-start mt-2">|</span>

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <Unit v={t.d} label="Dias" />
      <Sep /><Unit v={t.h} label="Horas" />
      <Sep /><Unit v={t.m} label="Min" />
      <Sep /><Unit v={t.s} label="Seg" />
    </div>
  )
}

// ─── decorative leaf SVG ─────────────────────────────────────────────────────

function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-gold/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// ─── settings edit panel ─────────────────────────────────────────────────────

function SettingsPanel({
  settings, settingsBlockId, pageId, blocks, onSaved, onCancel,
}: {
  settings: PortalSettings
  settingsBlockId: string | null
  pageId: string
  blocks: Block[]
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const navPages = findAllChildPages(blocks)

  function toggleNav(id: string) {
    setForm(prev => ({
      ...prev,
      hiddenNav: prev.hiddenNav.includes(id)
        ? prev.hiddenNav.filter(x => x !== id)
        : [...prev.hiddenNav, id],
    }))
  }

  function setActive(id: string) {
    setForm(prev => ({ ...prev, activeNavId: prev.activeNavId === id ? '' : id }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/portal-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, settings: form, settingsBlockId }),
    })
    await fetch(`/api/portais-clientes?id=${pageId}&bust=1`)
    setSaving(false)
    onSaved()
  }

  const Field = ({ label, k, placeholder }: { label: string; k: keyof PortalSettings; placeholder?: string }) => (
    <div>
      <label className="block text-[10px] text-white/40 tracking-widest uppercase mb-1">{label}</label>
      <input
        value={(form[k] as string) ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gold/20">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-gold/70 tracking-widest uppercase mr-auto">Configurações do Portal</span>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-white/15 rounded-lg text-white/40 hover:text-white/70">Cancelar</button>
        <button onClick={save} disabled={saving} className="px-4 py-1.5 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 disabled:opacity-50">
          {saving ? 'A guardar...' : '✓ Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome da Noiva" k="noiva" placeholder="ex: BRUNA" />
        <Field label="Nome do Noivo" k="noivo" placeholder="ex: LUIS" />
        <Field label="Data do Casamento" k="dataFormatada" placeholder="ex: 25 de setembro de 2026" />
        <Field label="Data (para contagem)" k="data" placeholder="ex: 2026-09-25" />
        <Field label="Local" k="local" placeholder="ex: HERDADE DE ALGERUZ" />
      </div>

      {/* Photos */}
      <div>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Fotografias</p>
        <div className="space-y-3">
          {/* Hero image */}
          <div>
            <label className="block text-[10px] text-white/30 mb-1">Imagem de Fundo (Hero)</label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  value={form.heroImageUrl ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                  placeholder="Cola aqui o URL da imagem..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
                />
              </div>
              {form.heroImageUrl && (
                <div className="shrink-0 w-14 h-10 rounded-lg bg-cover bg-center border border-white/10"
                  style={{ backgroundImage: `url(${form.heroImageUrl})` }} />
              )}
              {form.heroImageUrl && (
                <button onClick={() => setForm(prev => ({ ...prev, heroImageUrl: '' }))}
                  className="shrink-0 text-white/25 hover:text-red-400 text-lg leading-none mt-1">×</button>
              )}
            </div>
          </div>

          {/* Gallery images */}
          {[0, 1, 2].map(i => (
            <div key={i}>
              <label className="block text-[10px] text-white/30 mb-1">Galeria — Foto {i + 1}</label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    value={form.galleryUrls?.[i] ?? ''}
                    onChange={e => {
                      const urls = [...(form.galleryUrls ?? ['', '', ''])]
                      urls[i] = e.target.value
                      setForm(prev => ({ ...prev, galleryUrls: urls }))
                    }}
                    placeholder="Cola aqui o URL da imagem..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
                  />
                </div>
                {form.galleryUrls?.[i] && (
                  <div className="shrink-0 w-14 h-10 rounded-lg bg-cover bg-center border border-white/10"
                    style={{ backgroundImage: `url(${form.galleryUrls[i]})` }} />
                )}
                {form.galleryUrls?.[i] && (
                  <button onClick={() => {
                    const urls = [...(form.galleryUrls ?? ['', '', ''])]
                    urls[i] = ''
                    setForm(prev => ({ ...prev, galleryUrls: urls }))
                  }}
                    className="shrink-0 text-white/25 hover:text-red-400 text-lg leading-none mt-1">×</button>
                )}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-white/20">Podes usar URLs de qualquer imagem (Google Drive partilhado, Dropbox, etc.).</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Menu de Navegação</p>
        <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/[0.04]">
          {navPages.map(page => {
            const isHidden = form.hiddenNav.includes(page.id)
            const isActive = form.activeNavId === page.id
            return (
              <div key={page.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-sm flex-1 uppercase tracking-wide ${isHidden ? 'line-through text-white/25' : 'text-white/70'}`}>{page.title}</span>
                <button onClick={() => setActive(page.id)}
                  title="Marcar como passo actual"
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${isActive ? 'border-gold/50 bg-gold/20 text-gold' : 'border-white/10 text-white/25 hover:border-gold/30'}`}>
                  activo
                </button>
                <button onClick={() => toggleNav(page.id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${isHidden ? 'bg-white/10' : 'bg-gold/50'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isHidden ? 'left-0.5' : 'left-4'}`} />
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-2">Toggle = visível/oculto. "Activo" = destaque dourado no botão.</p>
      </div>
    </div>
  )
}


// ─── main page ────────────────────────────────────────────────────────────────

export default function PortalClientePage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [settings, setSettings] = useState<PortalSettings>({ hiddenNav: [] })
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [error, setError] = useState('')
  // inline hero editing
  const [heroEdit, setHeroEdit] = useState<{ field: 'noiva' | 'noivo' | 'hero' | null; value: string }>({ field: null, value: '' })
  const [heroSaving, setHeroSaving] = useState(false)

  const loadBlocks = useCallback(async (bust = false) => {
    const url = bust ? `/api/portais-clientes?id=${PAGE_ID}&bust=1` : `/api/portais-clientes?id=${PAGE_ID}`
    const d = await fetch(url).then(r => r.json())
    if (d.error) setError(d.error)
    else {
      setBlocks(d.blocks ?? [])
      setSettings(d.settings ?? { hiddenNav: [] })
      setSettingsBlockId(d.settingsBlockId ?? null)
    }
  }, [])

  useEffect(() => { loadBlocks().finally(() => setLoading(false)) }, [loadBlocks])

  async function handleSaved() {
    setEditing(false)
    setEditingContent(false)
    await loadBlocks(true)
  }

  async function saveHeroField() {
    if (!heroEdit.field) return
    setHeroSaving(true)
    const patch: Partial<PortalSettings> =
      heroEdit.field === 'noiva' ? { noiva: heroEdit.value } :
      heroEdit.field === 'noivo' ? { noivo: heroEdit.value } :
      { heroImageUrl: heroEdit.value }
    const newSettings = { ...settings, ...patch }
    await fetch('/api/portal-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: PAGE_ID, settings: newSettings, settingsBlockId }),
    })
    setSettings(newSettings)
    setHeroEdit({ field: null, value: '' })
    setHeroSaving(false)
    fetch(`/api/portais-clientes?id=${PAGE_ID}&bust=1`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-white/20 tracking-widest uppercase">A carregar portal...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400/60 text-sm">{error}</p>
    </div>
  )

  const images = findImages(blocks)
  const heroImage = settings.heroImageUrl || images[0] || null
  const galleryImages = (() => {
    const custom = (settings.galleryUrls ?? []).filter(Boolean)
    return custom.length > 0 ? custom : images.slice(0, 3)
  })()
  const navPages = findAllChildPages(blocks).filter(p => !settings.hiddenNav.includes(p.id))
  const { heading: welcomeHeading, paragraphs: welcomeParas } = findWelcomeText(blocks)

  // ── edit modes ──────────────────────────────────────────────────────────────
  if (editing) return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1">
        ‹ voltar ao portal
      </button>
      <SettingsPanel
        settings={settings}
        settingsBlockId={settingsBlockId}
        pageId={PAGE_ID}
        blocks={blocks}
        onSaved={handleSaved}
        onCancel={() => setEditing(false)}
      />
    </main>
  )

  if (editingContent) return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <button onClick={() => setEditingContent(false)} className="text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1">
        ‹ voltar ao portal
      </button>
      <BlockEditor blocks={blocks} pageId={PAGE_ID} settings={settings} settingsBlockId={settingsBlockId} onSaved={handleSaved} />
    </main>
  )

  // ── portal view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Admin bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <Link href="/" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
          ‹ Menu
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setEditingContent(true)} className="text-[10px] px-2.5 py-1 border border-white/10 rounded text-white/30 hover:text-white/60 hover:border-white/20 transition-all uppercase tracking-wider">
            Editar Conteúdo
          </button>
          <button onClick={() => setEditing(true)} className="text-[10px] px-2.5 py-1 border border-gold/20 rounded text-gold/50 hover:text-gold hover:border-gold/40 transition-all uppercase tracking-wider">
            ✎ Configurar
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden">
        {/* Background */}
        {heroImage ? (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1408] to-[#0a0a0a]" />
        )}

        {/* Trocar foto button */}
        {heroEdit.field === 'hero' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md px-4">
              <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-2 text-center">URL da nova fotografia</p>
              <input
                autoFocus
                value={heroEdit.value}
                onChange={e => setHeroEdit(prev => ({ ...prev, value: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 mb-3 placeholder:text-white/25"
              />
              {heroEdit.value && (
                <div className="w-full h-28 rounded-lg bg-cover bg-center mb-3 border border-white/10"
                  style={{ backgroundImage: `url(${heroEdit.value})` }} />
              )}
              <div className="flex gap-2 justify-center">
                <button onClick={() => setHeroEdit({ field: null, value: '' })}
                  className="px-4 py-2 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white/80">Cancelar</button>
                <button onClick={saveHeroField} disabled={heroSaving}
                  className="px-5 py-2 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 disabled:opacity-50">
                  {heroSaving ? 'A guardar...' : '✓ Guardar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setHeroEdit({ field: 'hero', value: heroImage ?? '' })}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white/50 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Trocar foto
          </button>
        )}

        <div className="relative z-10 text-center px-4 pt-20">
          {/* Portal label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf />
            <p className="font-cormorant text-gold text-sm sm:text-base tracking-[0.4em] uppercase italic">Portal dos Noivos</p>
            <Leaf flip />
          </div>

          {/* Names — inline editable */}
          <h1 className="font-playfair text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight mb-4 flex items-center justify-center gap-4 flex-wrap">
            {heroEdit.field === 'noiva' ? (
              <span className="flex items-center gap-2">
                <input
                  autoFocus
                  value={heroEdit.value}
                  onChange={e => setHeroEdit(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') saveHeroField(); if (e.key === 'Escape') setHeroEdit({ field: null, value: '' }) }}
                  className="bg-white/10 border-b-2 border-gold outline-none text-white font-playfair text-5xl sm:text-7xl lg:text-8xl font-black text-center w-40 sm:w-56"
                />
                <span className="flex flex-col gap-1">
                  <button onClick={saveHeroField} disabled={heroSaving} className="text-[10px] bg-gold/30 border border-gold/50 text-gold px-2 py-0.5 rounded hover:bg-gold/50 disabled:opacity-50">✓</button>
                  <button onClick={() => setHeroEdit({ field: null, value: '' })} className="text-[10px] border border-white/20 text-white/40 px-2 py-0.5 rounded hover:text-white/70">✕</button>
                </span>
              </span>
            ) : (
              <button onClick={() => setHeroEdit({ field: 'noiva', value: settings.noiva || '' })}
                className="group relative hover:opacity-80 transition-opacity cursor-text">
                {settings.noiva || 'NOIVA'}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-gold/0 group-hover:text-gold/80 transition-colors tracking-widest uppercase whitespace-nowrap">✎ editar</span>
              </button>
            )}
            <span className="text-gold font-cormorant italic font-normal">&</span>
            {heroEdit.field === 'noivo' ? (
              <span className="flex items-center gap-2">
                <input
                  autoFocus
                  value={heroEdit.value}
                  onChange={e => setHeroEdit(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') saveHeroField(); if (e.key === 'Escape') setHeroEdit({ field: null, value: '' }) }}
                  className="bg-white/10 border-b-2 border-gold outline-none text-white font-playfair text-5xl sm:text-7xl lg:text-8xl font-black text-center w-40 sm:w-56"
                />
                <span className="flex flex-col gap-1">
                  <button onClick={saveHeroField} disabled={heroSaving} className="text-[10px] bg-gold/30 border border-gold/50 text-gold px-2 py-0.5 rounded hover:bg-gold/50 disabled:opacity-50">✓</button>
                  <button onClick={() => setHeroEdit({ field: null, value: '' })} className="text-[10px] border border-white/20 text-white/40 px-2 py-0.5 rounded hover:text-white/70">✕</button>
                </span>
              </span>
            ) : (
              <button onClick={() => setHeroEdit({ field: 'noivo', value: settings.noivo || '' })}
                className="group relative hover:opacity-80 transition-opacity cursor-text">
                {settings.noivo || 'NOIVO'}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-gold/0 group-hover:text-gold/80 transition-colors tracking-widest uppercase whitespace-nowrap">✎ editar</span>
              </button>
            )}
          </h1>

          {/* Date & venue */}
          <p className="font-cormorant text-white/60 text-base sm:text-lg italic tracking-wide">
            ♡ {settings.dataFormatada || '—'}{settings.local ? ` · ${settings.local}` : ''}
          </p>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {settings.data && (
        <section className="py-10 sm:py-14 border-y border-white/[0.05] bg-[#0d0d0d]">
          <p className="font-cormorant text-gold text-xl sm:text-2xl italic text-center mb-6 tracking-wide">Contagem regressiva</p>
          <div className="flex items-center justify-center gap-4">
            <Leaf />
            <Countdown targetDate={settings.data} />
            <Leaf flip />
          </div>
          <div className="flex justify-center mt-4">
            <span className="text-gold/20 text-lg">♡</span>
          </div>
        </section>
      )}

      {/* ── QUICK ACCESS ── */}
      {navPages.length > 0 && (
        <section className="py-10 sm:py-14 px-4">
          <p className="text-[11px] tracking-[0.4em] text-white/30 uppercase text-center mb-8">Acesso Rápido</p>
          <div className="flex gap-3 overflow-x-auto pb-2 justify-start sm:justify-center snap-x snap-mandatory scrollbar-none">
            {navPages.map(page => {
              const isActive = settings.activeNavId === page.id
              return (
                <Link key={page.id} href={`/portal-cliente/${page.id}?title=${encodeURIComponent(page.title)}`}
                  className={`snap-start shrink-0 flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border transition-all min-w-[80px] group
                    ${isActive
                      ? 'bg-gold/15 border-gold/50 text-gold'
                      : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-gold/30 hover:text-gold/70 hover:bg-gold/5'
                    }`}
                >
                  <span className={isActive ? 'text-gold' : 'text-white/40 group-hover:text-gold/60 transition-colors'}>
                    {getNavIcon(page.title)}
                  </span>
                  <span className="text-[9px] tracking-widest uppercase text-center leading-tight max-w-[70px]">
                    {page.title.replace(/\s*\(\d+\)\s*$/, '')}
                  </span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-gold" />}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {galleryImages.length > 1 && (
        <section className="px-4 pb-10 sm:pb-14">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto rounded-2xl overflow-hidden">
            {galleryImages.map((url, i) => (
              <div key={i} className="aspect-[3/4] sm:aspect-[2/3] bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
            ))}
          </div>
        </section>
      )}

      {/* ── WELCOME ── */}
      <section className="py-12 sm:py-16 px-4 text-center max-w-2xl mx-auto">
        {welcomeHeading && (
          <h2 className="font-cormorant text-2xl sm:text-3xl text-gold italic mb-3 leading-relaxed">
            {welcomeHeading}
          </h2>
        )}
        <div className="flex justify-center mb-6">
          <span className="text-gold/40 text-xl">♡</span>
        </div>
        {welcomeParas.map((p, i) => (
          <p key={i} className="text-sm sm:text-base text-white/50 leading-relaxed mb-3">{p}</p>
        ))}

        {/* Feature bullets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {['Acompanhamento de todo o processo', 'Prazos e entregas organizados', 'Comunicação transparente', 'Acesso rápido a documentos'].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3">
              <div className="w-6 h-6 rounded-full border border-gold/30 flex items-center justify-center">
                <span className="text-gold text-xs">✓</span>
              </div>
              <span className="text-xs text-white/40 text-center leading-tight">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CARDS ── */}
      {navPages.length > 0 && (
        <section className="py-10 sm:py-14 px-4 bg-[#0d0d0d] border-t border-white/[0.04]">
          <p className="text-[11px] tracking-[0.4em] text-white/30 uppercase text-center mb-8">O que encontram aqui</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {navPages.slice(0, 6).map(page => (
              <Link key={page.id} href={`/portal-cliente/${page.id}?title=${encodeURIComponent(page.title)}`}
                className="group flex flex-col gap-3 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-gold/30 hover:bg-gold/5 transition-all">
                <span className="text-gold/40 group-hover:text-gold/70 transition-colors">
                  {getNavIcon(page.title)}
                </span>
                <div>
                  <p className="text-xs font-semibold text-white/70 tracking-wide uppercase leading-tight mb-1">
                    {page.title.replace(/\s*\(\d+\)\s*$/, '')}
                  </p>
                  <p className="text-[10px] text-white/25">Ver detalhes →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-10 text-center border-t border-white/[0.04]">
        <p className="font-cormorant text-gold/50 text-lg sm:text-xl italic">
          ♡ Mal podemos esperar pelo vosso grande dia!
        </p>
        <p className="text-[10px] text-white/15 tracking-widest mt-3 uppercase">RL Photo.Video</p>
      </footer>

    </div>
  )
}
