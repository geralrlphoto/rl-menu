'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

const WHATSAPP     = 'https://wa.me/351919191919'
const DEFAULT_HERO = 'https://rl-menu-lake.vercel.app/casamentos-2028.png'

type Contact = Record<string, any>

// ─── Secções do menu ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'sec-reuniao',     label: 'Reunião',      icon: '📅' },
  { id: 'sec-countdown',   label: 'Contagem',     icon: '⏱' },
  { id: 'sec-portfolio',   label: 'Portfólio',    icon: '📷' },
  { id: 'sec-testemunhos', label: 'Testemunhos',  icon: '💬' },
  { id: 'sec-sobre',       label: 'Sobre Nós',    icon: '✦'  },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Menu Lateral ─────────────────────────────────────────────────────────────
function SideMenu({ open, onClose, isAdmin }: { open: boolean; onClose: () => void; isAdmin: boolean }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: '280px', background: '#0d0d0d', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header do menu */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] tracking-[0.35em] text-gold/60 uppercase">RL Photo · Video</p>
            <p className="text-xs tracking-widest text-white/30 uppercase mt-0.5">Página do Cliente</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
            ✕
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase px-3 mb-3">Secções</p>
          {SECTIONS.map(s => (
            <button key={s.id}
              onClick={() => { scrollTo(s.id); onClose() }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:bg-white/5 group">
              <span className="text-base">{s.icon}</span>
              <span className="text-sm text-white/60 group-hover:text-white tracking-wide transition-colors">{s.label}</span>
            </button>
          ))}

          <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* WhatsApp */}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/5 group">
            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#25D366' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
            <span className="text-sm text-white/60 group-hover:text-white tracking-wide transition-colors">WhatsApp</span>
          </a>
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-[0.3em] text-gold/40 uppercase px-3 mb-3">Admin</p>
            <a href="/crm"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-white/5 group">
              <span className="text-base">⚙</span>
              <span className="text-sm text-white/40 group-hover:text-gold tracking-wide transition-colors">Voltar ao CRM</span>
            </a>
          </div>
        )}

        {/* Footer do menu */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[9px] tracking-widest text-white/10 uppercase">© RL Photo · Video</p>
        </div>
      </div>
    </>
  )
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

function fmtHora(h: string) { return (h || '').slice(0, 5) }

// ─── Leaf decorativo ─────────────────────────────────────────────────────────
function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-gold/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────
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
      <Unit v={t.d} label="Dias" /><Sep />
      <Unit v={t.h} label="Horas" /><Sep />
      <Unit v={t.m} label="Min" /><Sep />
      <Unit v={t.s} label="Seg" />
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function LeadPage() {
  const { token } = useParams<{ token: string }>()

  const [contact, setContact]   = useState<Contact | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [status, setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Menu lateral
  const [menuOpen, setMenuOpen] = useState(false)

  // Admin
  const [isAdmin, setIsAdmin]             = useState(false)
  const [editingHero, setEditingHero]     = useState(false)
  const [heroInput, setHeroInput]         = useState('')
  const [heroPreview, setHeroPreview]     = useState('')
  const [savingHero, setSavingHero]       = useState(false)
  const [heroSaved, setHeroSaved]         = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Carregar página
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        setStatus(data.contact.page_confirmacao || null)
        setHeroPreview(data.contact.page_foto_url || DEFAULT_HERO)
        setHeroInput(data.contact.page_foto_url || '')
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })

    // Verificar se é admin
    fetch('/api/lead-page/check-admin')
      .then(r => r.json())
      .then(d => setIsAdmin(d.isAdmin))
      .catch(() => {})
  }, [token])

  const handleConfirm = async () => {
    setConfirming(true)
    await fetch(`/api/lead-page/confirm?token=${token}`, { method: 'POST' })
    setStatus('confirmada')
    setConfirming(false)
  }

  const handleChangeRequest = async () => {
    setRequesting(true)
    await fetch(`/api/lead-page/change-request?token=${token}`, { method: 'POST' })
    setStatus('alteracao_pedida')
    setRequesting(false)
    window.open(`${WHATSAPP}?text=${encodeURIComponent('Olá! Gostaria de solicitar uma alteração à reunião marcada.')}`, '_blank')
  }

  const handleSaveHero = async () => {
    setSavingHero(true)
    const res = await fetch('/api/lead-page/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_foto_url: heroInput || null }),
    })
    if (res.ok) {
      setHeroPreview(heroInput || DEFAULT_HERO)
      setContact(c => c ? { ...c, page_foto_url: heroInput || null } : c)
      setHeroSaved(true)
      setTimeout(() => { setHeroSaved(false); setEditingHero(false) }, 1500)
    }
    setSavingHero(false)
  }

  const handleUploadHero = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) { setHeroInput(data.url); setHeroPreview(data.url) }
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase animate-pulse">A carregar...</p>
    </main>
  )

  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase">Página não disponível</p>
    </main>
  )

  const heroImage  = heroPreview || DEFAULT_HERO
  const isVideo    = contact!.reuniao_tipo === 'Videochamada'
  const dataFmt    = fmtData(contact!.reuniao_data || '')
  const horaFmt    = fmtHora(contact!.reuniao_hora || '')
  const targetDate = contact!.reuniao_data && contact!.reuniao_hora
    ? `${contact!.reuniao_data}T${horaFmt}:00` : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── MENU LATERAL ── */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isAdmin={isAdmin} />

      {/* ── BOTÃO HAMBURGER ── */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
        aria-label="Menu"
      >
        <span className="w-4.5 h-px bg-white/70 block" style={{ width: '18px' }} />
        <span className="w-4.5 h-px bg-white/70 block" style={{ width: '14px' }} />
        <span className="w-4.5 h-px bg-white/70 block" style={{ width: '18px' }} />
      </button>

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <a href="/crm" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
            ‹ CRM
          </a>
          <span className="text-[10px] tracking-widest text-white/20 uppercase">Admin · Página do Cliente</span>
          <button
            onClick={() => setEditingHero(true)}
            className="text-[10px] px-2.5 py-1 border border-gold/20 rounded text-gold/50 hover:text-gold hover:border-gold/40 transition-all uppercase tracking-wider"
          >
            ✎ Editar Foto
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section id="sec-reuniao" className={`relative min-h-[70vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden ${isAdmin ? 'pt-10' : ''}`}>

        {/* Fundo */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
        </div>

        {/* Admin — editar foto hero (overlay) */}
        {isAdmin && editingHero && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md px-4">
              <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-3 text-center">Trocar fotografia de fundo</p>

              {/* Upload */}
              <label className="relative flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-gold/50 hover:bg-gold/5 text-white/40 hover:text-gold/80 cursor-pointer transition-all mb-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadHero(f) }} />
                <div className="flex items-center gap-2 text-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Carregar do dispositivo
                </div>
              </label>

              {/* URL manual */}
              <input
                value={heroInput}
                onChange={e => { setHeroInput(e.target.value); setHeroPreview(e.target.value || DEFAULT_HERO) }}
                placeholder="ou cola um URL de imagem..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 mb-3 placeholder:text-white/25"
              />

              {/* Preview */}
              {heroPreview && (
                <div className="w-full h-28 rounded-lg bg-cover bg-center mb-3 border border-white/10"
                  style={{ backgroundImage: `url(${heroPreview})` }} />
              )}

              <div className="flex gap-2 justify-center">
                <button onClick={() => { setEditingHero(false); setHeroPreview(contact!.page_foto_url || DEFAULT_HERO); setHeroInput(contact!.page_foto_url || '') }}
                  className="px-4 py-2 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white/80 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSaveHero} disabled={savingHero}
                  className="px-5 py-2 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all disabled:opacity-50">
                  {savingHero ? 'A guardar...' : heroSaved ? '✓ Guardado!' : '✓ Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin — botão trocar foto (visível no hero quando não está editando) */}
        {isAdmin && !editingHero && (
          <button onClick={() => setEditingHero(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white/50 hover:text-white hover:border-white/30 transition-all backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Trocar foto
          </button>
        )}

        {/* Conteúdo hero */}
        <div className="relative z-10 text-center px-4 pt-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf />
            <p className="font-cormorant text-gold text-sm sm:text-base tracking-[0.4em] uppercase italic">RL Photo · Video</p>
            <Leaf flip />
          </div>
          <h1 className="font-playfair text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-4">
            Reunião Marcada
          </h1>
          <div className="flex flex-col items-center gap-1 mt-2">
            {contact!.nome && (
              <p className="font-cormorant text-white/60 text-lg sm:text-xl italic tracking-wide">{contact!.nome}</p>
            )}
            {dataFmt && (
              <p className="font-cormorant text-white/50 text-sm sm:text-base italic tracking-wide">
                ♡ {dataFmt} · {horaFmt} · {contact!.reuniao_tipo || 'Presencial'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {targetDate && (
        <section id="sec-countdown" className="py-10 sm:py-14 border-y border-white/[0.05] bg-[#0d0d0d]">
          <p className="font-playfair font-black text-gold text-xl sm:text-2xl text-center mb-6 tracking-tight">Contagem Regressiva</p>
          <div className="flex items-center justify-center gap-4">
            <Leaf />
            <Countdown targetDate={targetDate} />
            <Leaf flip />
          </div>
        </section>
      )}

      {/* ── CARD REUNIÃO + BOTÕES ── */}
      <section className="flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-sm border border-white/10 rounded-2xl overflow-hidden mb-8"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="px-6 py-4 border-b border-white/8">
            <p className="text-xs tracking-[0.3em] text-white/25 uppercase">Detalhes da Reunião</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Data</span>
              <span className="font-cormorant text-lg text-white/90">{dataFmt}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Hora</span>
              <span className="font-cormorant text-lg text-white/90">{horaFmt}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Modo</span>
              <span className="font-cormorant text-lg text-white/90">{contact!.reuniao_tipo || 'Presencial'}</span>
            </div>
          </div>
          {contact!.reuniao_link && (
            <div className="px-6 pb-5">
              <a href={contact!.reuniao_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                <span>{isVideo ? '🎥' : '📍'}</span>
                <span>{isVideo ? 'Entrar na videochamada' : 'Ver localização'}</span>
              </a>
            </div>
          )}
        </div>

        {status === 'confirmada' ? (
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm tracking-wider"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              <span>✓</span><span>Reunião Confirmada — Até breve!</span>
            </div>
          </div>
        ) : status === 'alteracao_pedida' ? (
          <div className="w-full max-w-sm text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm tracking-wider"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span>⏳</span><span>Pedido enviado — Entraremos em contacto</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-3">
            <button onClick={handleConfirm} disabled={confirming || isAdmin}
              className="w-full py-4 rounded-2xl text-sm font-semibold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
              style={{ background: '#C9A84C', color: '#0a0a0a' }}>
              {confirming ? 'A confirmar...' : 'Confirmar Reunião'}
            </button>
            <button onClick={handleChangeRequest} disabled={requesting || isAdmin}
              className="w-full py-4 rounded-2xl text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-50"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {requesting ? 'A enviar...' : 'Solicitar Alteração'}
            </button>
            {isAdmin && (
              <p className="text-center text-[10px] text-white/20 tracking-widest uppercase">Botões desativados em modo admin</p>
            )}
          </div>
        )}
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── PORTFÓLIO ── */}
      <section id="sec-portfolio" className="px-6 py-14 flex flex-col items-center">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">O nosso trabalho</p>
        <h2 className="font-cormorant text-3xl text-white font-light mb-8 text-center">Momentos que ficam para sempre.</h2>
        <div className="w-full max-w-sm grid grid-cols-3 gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/10 text-xs tracking-widest">foto</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── TESTEMUNHOS ── */}
      <section id="sec-testemunhos" className="px-6 py-14 flex flex-col items-center gap-8 max-w-sm mx-auto">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase">O que dizem</p>
        <blockquote className="text-center">
          <p className="font-cormorant text-xl text-white/70 italic font-light leading-relaxed mb-3">
            "Captaram cada momento com uma sensibilidade única. As nossas fotos são pura magia."
          </p>
          <cite className="text-xs tracking-[0.2em] text-gold/60 not-italic">— Ana & Pedro · Casamento 2024</cite>
        </blockquote>
        <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
        <blockquote className="text-center">
          <p className="font-cormorant text-xl text-white/70 italic font-light leading-relaxed mb-3">
            "Desde o primeiro contacto sentimos que estaríamos em boas mãos. Superaram todas as expectativas."
          </p>
          <cite className="text-xs tracking-[0.2em] text-gold/60 not-italic">— Sofia & Miguel · Casamento 2024</cite>
        </blockquote>
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── SOBRE NÓS ── */}
      <section id="sec-sobre" className="px-6 py-14 flex flex-col items-center max-w-sm mx-auto text-center">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">Quem somos</p>
        <h2 className="font-cormorant text-3xl text-white font-light mb-6">RL Photo · Video</h2>
        <p className="text-white/40 text-sm leading-relaxed font-light">
          Somos especializados em fotografia e vídeo de casamentos. O nosso objetivo é preservar
          a autenticidade de cada momento — a emoção, os detalhes, as histórias que só acontecem uma vez.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs tracking-widest text-white/15 uppercase">© RL Photo · Video</p>
      </footer>

      {/* ── WHATSAPP FIXO ── */}
      {!isAdmin && (
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 z-50"
          style={{ background: '#25D366' }} title="Falar connosco no WhatsApp">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

    </div>
  )
}
