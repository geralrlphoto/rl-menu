'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const WHATSAPP     = 'https://wa.me/351919191919'
const DEFAULT_HERO = 'https://rl-menu-lake.vercel.app/banner_footer.png'

type Contact = Record<string, any>

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

function fmtHora(h: string) {
  return (h || '').slice(0, 5)
}

// ─── Leaf decorativo (igual ao portal) ───────────────────────────────────────
function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-gold/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// ─── Countdown (igual ao portal) ─────────────────────────────────────────────
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

// ─── Página ───────────────────────────────────────────────────────────────────
export default function LeadPage() {
  const { token } = useParams<{ token: string }>()
  const [contact, setContact]   = useState<Contact | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [status, setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        setStatus(data.contact.page_confirmacao || null)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
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

  const heroImage  = contact.page_foto_url || DEFAULT_HERO
  const isVideo    = contact.reuniao_tipo === 'Videochamada'
  const dataFmt    = fmtData(contact.reuniao_data || '')
  const horaFmt    = fmtHora(contact.reuniao_hora || '')
  const targetDate = contact.reuniao_data && contact.reuniao_hora
    ? `${contact.reuniao_data}T${horaFmt}:00`
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
        </div>

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
            {contact.nome && (
              <p className="font-cormorant text-white/60 text-lg sm:text-xl italic tracking-wide">{contact.nome}</p>
            )}
            {dataFmt && (
              <p className="font-cormorant text-white/50 text-sm sm:text-base italic tracking-wide">
                ♡ {dataFmt} · {horaFmt} · {contact.reuniao_tipo || 'Presencial'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {targetDate && (
        <section className="py-10 sm:py-14 border-y border-white/[0.05] bg-[#0d0d0d]">
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
              <span className="font-cormorant text-lg text-white/90">{contact.reuniao_tipo || 'Presencial'}</span>
            </div>
          </div>
          {contact.reuniao_link && (
            <div className="px-6 pb-5">
              <a href={contact.reuniao_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                <span>{isVideo ? '🎥' : '📍'}</span>
                <span>{isVideo ? 'Entrar na videochamada' : 'Ver localização'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Botões */}
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
            <button onClick={handleConfirm} disabled={confirming}
              className="w-full py-4 rounded-2xl text-sm font-semibold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
              style={{ background: '#C9A84C', color: '#0a0a0a' }}>
              {confirming ? 'A confirmar...' : 'Confirmar Reunião'}
            </button>
            <button onClick={handleChangeRequest} disabled={requesting}
              className="w-full py-4 rounded-2xl text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-50"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {requesting ? 'A enviar...' : 'Solicitar Alteração'}
            </button>
          </div>
        )}
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── PORTFÓLIO ── */}
      <section className="px-6 py-14 flex flex-col items-center">
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
      <section className="px-6 py-14 flex flex-col items-center gap-8 max-w-sm mx-auto">
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
      <section className="px-6 py-14 flex flex-col items-center max-w-sm mx-auto text-center">
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
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 z-50"
        style={{ background: '#25D366' }} title="Falar connosco no WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  )
}
