'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PHOTO.VIDEO — Acesso ao Portal · PAIS
 *
 *  Login page premium para clientes (pais). Estética luxury baptism:
 *  ivory + champagne + gold, tipografia editorial serif, glassmorphism.
 *
 *  Split layout:
 *    LEFT  → hero cinematográfico (foto romântica + monograma RL + headline)
 *    RIGHT → painel ivory com formulário login
 *
 *  Endpoint de auth: POST /api/noivos-auth (partilhado com casamentos, pois
 *  ambos os portais usam a tabela `portais`). Por agora, fallback graceful:
 *  se 404, redireciona para /b/<token> se houver next=, senão mostra toast
 *  "Acesso temporariamente indisponível".
 * ─────────────────────────────────────────────────────────────────────────── */

const HERO_BG = '/batizados-2026.jpg'

export default function PaisLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
      <PaisLoginInner />
    </Suspense>
  )
}

function PaisLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextFromUrl = searchParams?.get('next') ?? null

  const [email, setEmail]       = useState('')
  const [pwd, setPwd]           = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  // mount animation
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Se já existe sessão de pais válida, redireciona para o portal próprio.
  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        const r = await fetch('/api/noivos-auth', { cache: 'no-store' })
        if (canceled) return
        const j = await r.json().catch(() => ({}))
        if (j?.ok && j?.session?.redirect) {
          router.replace(j.session.redirect)
        }
      } catch { /* offline / erro — fica em login */ }
    })()
    return () => { canceled = true }
  }, [router])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3600)
    return () => clearTimeout(t)
  }, [toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !pwd) {
      setError('Preencham e-mail e palavra-passe.')
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/noivos-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pwd }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 404 && j?.reason === 'no_portal') {
        setError('O vosso portal ainda não está activo. Falem connosco para activar o acesso.')
        setToast('Portal ainda não activo. Falem connosco.')
        setLoading(false)
        return
      }
      if (!res.ok || !j?.ok) {
        setError('E-mail ou palavra-passe incorretos.')
        setToast('E-mail ou palavra-passe incorretos.')
        setLoading(false)
        return
      }
      setToast('Bem-vindos. A abrir o vosso portal…')
      // Marca este tab como "sessão activa" — quando fechar o tab/janela,
      // sessionStorage é limpo automaticamente pelo browser e na próxima
      // visita o portal vai exigir novo login (mesmo se o cookie ainda for
      // tecnicamente válido).
      try {
        sessionStorage.setItem('nv_active', '1')
        // Também marca o gate antigo do portal (portalAuth_<REF>) como
        // autenticado, para não pedir a password do portal outra vez —
        // o login já foi feito com email + password do batizado.
        const ref = j.noivos?.referencia
        if (ref) sessionStorage.setItem(`portalAuth_${ref}`, 'true')
      } catch {}
      const target = j.redirect ?? nextFromUrl ?? '/'
      setTimeout(() => {
        router.push(target)
        router.refresh()
      }, 700)
    } catch {
      setError('Não foi possível ligar ao servidor. Tentem novamente.')
      setLoading(false)
    }
  }

  function handlePortalToken() {
    // Botão secundário: redireciona para introdução manual do token
    // (ou abre Fala connosco se ainda não tiverem link).
    setToast('Procurem o vosso link directo no e-mail RL, ou falem connosco.')
  }

  const [recoverOpen, setRecoverOpen] = useState(false)
  function handleForgot() {
    setRecoverOpen(true)
  }

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] bg-[#FAF7F2]"
      style={{ fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif', color: '#2A2520' }}>

      {/* ── ESQUERDA — Hero romântico ──────────────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-r-[40px] shadow-2xl">
        {/* Background image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${HERO_BG}")`,
              backgroundColor: '#2A1E14', // fallback dark warm
              filter: 'brightness(0.72) saturate(1.10)',
            }} />
          {/* Overlay escurecer geral para garantir contraste do texto */}
          <div className="absolute inset-0"
            style={{ background: 'rgba(20,12,6,0.45)' }} />
          {/* Overlay quente sunset com mais densidade nos cantos */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(15,10,5,0.45) 0%, rgba(45,30,18,0.32) 45%, rgba(15,10,5,0.55) 100%)' }} />
          {/* Vinheta radial — escurece bordos, mantém centro mais legível */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />
          {/* Glow gold subtil (mais discreto agora) */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 28% 78%, rgba(201,164,92,0.14), transparent 55%)' }} />
          {/* film grain sutil */}
          <div className="absolute inset-0 opacity-[0.045] mix-blend-overlay"
            style={{ backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        </div>

        {/* Floral SVG decorativo nos cantos */}
        <FloralDecoration position="top-right" />
        <FloralDecoration position="bottom-left" />

        {/* CONTEÚDO — monograma + headline editorial */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-16 py-20 text-center"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 900ms ease-out, transform 900ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>

          {/* Logo oficial RL PHOTO.VIDEO (gold) */}
          <div className="mb-10 relative flex items-center justify-center">
            <img
              src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
              alt="RL Photo · Video"
              className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
              style={{
                filter: 'drop-shadow(0 6px 18px rgba(45,30,18,0.32)) drop-shadow(0 0 24px rgba(201,164,92,0.40))',
              }}
            />
          </div>

          {/* Title PAIS */}
          <h1 className="text-[64px] sm:text-[80px] leading-none tracking-[0.14em] mb-4"
            style={{
              fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontWeight: 300,
              color: '#F5EAD2',
              textShadow: '0 2px 18px rgba(0,0,0,0.55)',
            }}>
            PAIS
          </h1>

          {/* Decorative separator */}
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, #D4B870, transparent)' }} />
            <span className="text-[10px]" style={{ color: '#D4B870' }}>♡</span>
            <span className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, #D4B870, transparent)' }} />
          </div>

          {/* Subtitle */}
          <p className="text-[11px] tracking-[0.5em] uppercase mb-16"
            style={{ color: '#E2C68C', fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            O Batizado do Vosso Filho
          </p>

          {/* ACESSO AO PORTAL chip */}
          <div className="flex items-center gap-3 mb-7">
            <span className="text-[16px]" style={{ color: '#D4B870' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 12c2.5 0 4-2 4-4.5S14.5 3 12 3 8 5 8 7.5 9.5 12 12 12z" />
                <path d="M5 21c0-3 3-5 7-5s7 2 7 5" />
                <circle cx="18" cy="6" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-[10px] tracking-[0.5em] uppercase font-semibold"
              style={{ color: '#E2C68C', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              Acesso ao Portal
            </span>
          </div>

          {/* Headline editorial */}
          <h2 className="text-[34px] sm:text-[42px] leading-[1.15] mb-5 max-w-md"
            style={{
              fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontWeight: 400,
              color: '#F8F1E0',
              textShadow: '0 2px 16px rgba(0,0,0,0.55)',
            }}>
            O dia do vosso filho,<br />
            <em style={{ fontStyle: 'italic', color: '#E6C988' }}>uma história começa.</em>
          </h2>

          {/* Description */}
          <p className="text-[13px] leading-[1.85] max-w-sm tracking-wide"
            style={{ color: 'rgba(245,235,212,0.85)', fontFamily: 'Georgia, serif', textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
            Acedam às vossas fotografias,<br />
            vídeos e memórias num só lugar,<br />
            de forma simples e segura.
          </p>
        </div>

        {/* Footer signature */}
        <footer className="relative z-10 px-16 pb-8 flex items-center justify-between">
          <p className="text-[9px] tracking-[0.5em] uppercase" style={{ color: 'rgba(245,235,212,0.55)' }}>
            RL Photo · Video
          </p>
          <p className="text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(245,235,212,0.45)' }}>
            Portal Privado dos Pais
          </p>
        </footer>
      </aside>

      {/* ── DIREITA — Login Panel Ivory ────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 sm:px-16 py-12"
        style={{ background: 'linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%)' }}>

        {/* Glow ambient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.10), transparent 65%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.07), transparent 65%)' }} />
        </div>

        <div className="relative z-10 w-full max-w-[440px]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 1000ms ease-out 200ms, transform 1000ms cubic-bezier(0.16, 1, 0.3, 1) 200ms',
          }}>

          {/* Lock icon top */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FAF6ED 0%, #F2E9D4 100%)',
                border: '1px solid rgba(201,164,92,0.35)',
                boxShadow: '0 8px 28px -10px rgba(201,164,92,0.30), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <rect x="5" y="11" width="14" height="10" rx="2.5" />
                <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                <path d="M12 15.5l.6 1.3-.6 1.7-.6-1.7z" fill="#C9A84C" stroke="none" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-[40px] leading-none mb-3"
            style={{
              fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontWeight: 400,
              color: '#2D2218',
              letterSpacing: '-0.01em',
            }}>
            Iniciar sessão
          </h2>

          {/* Heart decorator */}
          <div className="flex justify-center mb-4">
            <span style={{ color: '#C9A84C', fontSize: '11px', letterSpacing: '0.3em' }}>♡</span>
          </div>

          {/* Subtitle */}
          <p className="text-center text-[13px] mb-9 leading-relaxed"
            style={{ color: '#7A6953', fontFamily: 'Georgia, serif' }}>
            Acedam à vossa conta para continuarem.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block">
                <span className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-2 block"
                  style={{ color: '#A88A4E' }}>
                  E-mail <span style={{ color: '#C9A84C', fontStyle: 'italic', fontWeight: 600 }}>(mãe)</span>
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C9A84C' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    autoComplete="email"
                    placeholder="exemplo@dominio.com"
                    className="w-full pl-11 pr-4 py-3.5 text-[14px] rounded-2xl outline-none transition-all"
                    style={{
                      background: 'rgba(255,253,250,0.7)',
                      border: '1.4px solid rgba(201,164,92,0.30)',
                      color: '#2D2218',
                      fontFamily: 'Georgia, serif',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,164,92,0.65)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 4px rgba(201,164,92,0.10)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,164,92,0.30)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.6)'
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Password */}
            <div>
              <label className="block">
                <span className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-2 block"
                  style={{ color: '#A88A4E' }}>
                  Palavra-passe
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C9A84C' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="5" y="11" width="14" height="10" rx="2.5" />
                      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                    </svg>
                  </span>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => { setPwd(e.target.value); setError(null) }}
                    autoComplete="current-password"
                    placeholder="A tua palavra-passe"
                    className="w-full pl-11 pr-12 py-3.5 text-[14px] rounded-2xl outline-none tracking-wide transition-all"
                    style={{
                      background: 'rgba(255,253,250,0.7)',
                      border: '1.4px solid rgba(201,164,92,0.30)',
                      color: '#2D2218',
                      fontFamily: 'Georgia, serif',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,164,92,0.65)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 4px rgba(201,164,92,0.10)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(201,164,92,0.30)'
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.6)'
                    }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: showPwd ? '#C9A84C' : 'rgba(168,138,78,0.55)' }}
                    title={showPwd ? 'Ocultar' : 'Mostrar'}>
                    {showPwd
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </label>
            </div>

            {/* Aviso de sessão estrita + Forgot */}
            <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
              <p className="text-[10.5px] tracking-wider"
                style={{ color: '#8B7549', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                🔒 Sessão expira após 10 min de inactividade
              </p>
              <button type="button" onClick={handleForgot}
                className="text-[12px] tracking-wide transition-colors"
                style={{ color: '#A88A4E', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                onMouseEnter={e => e.currentTarget.style.color = '#8B7549'}
                onMouseLeave={e => e.currentTarget.style.color = '#A88A4E'}>
                Recuperar palavra-passe
              </button>
            </div>

            {/* Error inline */}
            {error && (
              <p className="text-[12px] tracking-wide text-center animate-in fade-in"
                style={{ color: '#A8553D' }}>
                {error}
              </p>
            )}

            {/* MAIN BUTTON */}
            <button type="submit" disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl py-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'linear-gradient(135deg, #D4B870 0%, #C9A84C 50%, #B89540 100%)',
                color: '#3D2E1A',
                boxShadow: '0 16px 36px -10px rgba(201,164,92,0.55), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(120,90,40,0.25)',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.boxShadow = '0 20px 44px -8px rgba(201,164,92,0.70), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(120,90,40,0.25)'
              }}
              onMouseLeave={e => {
                if (!loading) e.currentTarget.style.boxShadow = '0 16px 36px -10px rgba(201,164,92,0.55), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(120,90,40,0.25)'
              }}>
              <span className="relative z-10 flex items-center justify-center gap-3 text-[12px] font-bold tracking-[0.35em] uppercase">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {loading ? 'A entrar…' : 'Iniciar Sessão'}
              </span>
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </form>

          {/* Separator OU */}
          <div className="flex items-center gap-4 my-7">
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,164,92,0.45))' }} />
            <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: '#A88A4E' }}>ou</span>
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,164,92,0.45))' }} />
          </div>

          {/* SECONDARY — ACESSO AO PORTAL */}
          <button type="button" onClick={handlePortalToken}
            className="group relative w-full rounded-2xl py-4 transition-all"
            style={{
              background: 'rgba(255,253,250,0.5)',
              border: '1.5px solid rgba(201,164,92,0.55)',
              color: '#8B7549',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,239,221,0.7)'
              e.currentTarget.style.borderColor = 'rgba(201,164,92,0.85)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,253,250,0.5)'
              e.currentTarget.style.borderColor = 'rgba(201,164,92,0.55)'
            }}>
            <span className="relative z-10 flex items-center justify-center gap-3 text-[12px] font-semibold tracking-[0.35em] uppercase">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Acesso ao Portal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                className="transition-transform group-hover:translate-x-1">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>

          {/* SUPPORT FOOTER */}
          <div className="mt-10 pt-6 border-t flex items-center justify-center gap-2 text-[12px]"
            style={{ borderColor: 'rgba(201,164,92,0.18)', color: '#7A6953', fontFamily: 'Georgia, serif' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A88A4E" strokeWidth="1.6">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1v-6h3v4z" />
              <path d="M3 19a2 2 0 0 0 2 2h1v-6H3v4z" />
            </svg>
            <span>Precisas de ajuda?</span>
            <button onClick={() => setToast('Email: geral@rlphotovideo.pt · WhatsApp: +351 968 000 000')}
              className="font-semibold transition-colors"
              style={{ color: '#C9A84C', fontStyle: 'italic' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8B7549'}
              onMouseLeave={e => e.currentTarget.style.color = '#C9A84C'}>
              Fala connosco
            </button>
          </div>
        </div>

        {/* Toast bottom-right */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm px-5 py-4 rounded-2xl animate-in slide-in-from-bottom-2 fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(255,253,250,0.97), rgba(248,239,221,0.95))',
              border: '1.4px solid rgba(201,164,92,0.45)',
              boxShadow: '0 18px 44px -10px rgba(120,90,40,0.30), 0 0 18px -4px rgba(201,164,92,0.30)',
              color: '#3D2E1A',
              fontFamily: 'Georgia, serif',
              fontSize: 13,
            }}>
            <span className="mr-2" style={{ color: '#C9A84C' }}>♡</span>{toast}
          </div>
        )}
      </section>

      {/* ── Modal de recuperação de palavra-passe (chat-agente) ────────── */}
      {recoverOpen && <RecoverChatModal onClose={() => setRecoverOpen(false)} />}
    </main>
  )
}

/* ──────────────────────────────────────────────────────────────────────── *
 *  Sub-componentes decorativos
 * ──────────────────────────────────────────────────────────────────────── */

function FloralDecoration({ position }: { position: 'top-right' | 'bottom-left' }) {
  const isTop = position === 'top-right'
  return (
    <div className={`absolute z-[2] pointer-events-none ${isTop ? 'top-0 right-0' : 'bottom-0 left-0'}`}
      style={{
        width: 280,
        height: 280,
        transform: isTop ? 'translate(20%, -20%) rotate(220deg)' : 'translate(-15%, 15%) rotate(40deg)',
        opacity: 0.75,
      }}>
      <svg viewBox="0 0 280 280" fill="none" stroke="#C9A84C" strokeWidth="0.7" strokeLinecap="round">
        <defs>
          <linearGradient id={`floralGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B870" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#A88A40" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Main curving stem */}
        <path d="M140 240 Q120 180 100 150 Q80 120 70 80 Q65 60 60 40"
          stroke={`url(#floralGrad-${position})`} strokeWidth="1.2" />
        {/* Side branches */}
        <path d="M110 180 Q140 175 160 160" stroke={`url(#floralGrad-${position})`} />
        <path d="M90 140 Q70 135 50 130" stroke={`url(#floralGrad-${position})`} />
        <path d="M75 90 Q100 85 115 70" stroke={`url(#floralGrad-${position})`} />

        {/* Leaves clusters */}
        <g fill="rgba(201,164,92,0.25)" stroke="rgba(201,164,92,0.55)" strokeWidth="0.6">
          <ellipse cx="115" cy="195" rx="14" ry="5" transform="rotate(-30 115 195)" />
          <ellipse cx="100" cy="170" rx="12" ry="4" transform="rotate(45 100 170)" />
          <ellipse cx="155" cy="158" rx="14" ry="5" transform="rotate(60 155 158)" />
          <ellipse cx="80" cy="130" rx="11" ry="4" transform="rotate(-15 80 130)" />
          <ellipse cx="55" cy="125" rx="12" ry="4" transform="rotate(-40 55 125)" />
          <ellipse cx="95" cy="105" rx="13" ry="4" transform="rotate(30 95 105)" />
          <ellipse cx="80" cy="75" rx="11" ry="4" transform="rotate(-20 80 75)" />
          <ellipse cx="110" cy="65" rx="12" ry="4" transform="rotate(50 110 65)" />
          <ellipse cx="65" cy="50" rx="10" ry="3.5" transform="rotate(-50 65 50)" />
        </g>

        {/* Small flowers */}
        <g fill="rgba(212,184,112,0.55)" stroke="rgba(168,138,64,0.8)" strokeWidth="0.5">
          <g transform="translate(155, 200)">
            <circle r="3" fill="#C9A84C" />
            <ellipse cx="0" cy="-6" rx="2.5" ry="4" />
            <ellipse cx="5.5" cy="-2" rx="2.5" ry="4" transform="rotate(72 5.5 -2)" />
            <ellipse cx="3.5" cy="4.8" rx="2.5" ry="4" transform="rotate(144 3.5 4.8)" />
            <ellipse cx="-3.5" cy="4.8" rx="2.5" ry="4" transform="rotate(216 -3.5 4.8)" />
            <ellipse cx="-5.5" cy="-2" rx="2.5" ry="4" transform="rotate(288 -5.5 -2)" />
          </g>
          <g transform="translate(45, 100)">
            <circle r="2.5" fill="#C9A84C" />
            <ellipse cx="0" cy="-5" rx="2" ry="3.5" />
            <ellipse cx="4.5" cy="-1.5" rx="2" ry="3.5" transform="rotate(72 4.5 -1.5)" />
            <ellipse cx="3" cy="4" rx="2" ry="3.5" transform="rotate(144 3 4)" />
            <ellipse cx="-3" cy="4" rx="2" ry="3.5" transform="rotate(216 -3 4)" />
            <ellipse cx="-4.5" cy="-1.5" rx="2" ry="3.5" transform="rotate(288 -4.5 -1.5)" />
          </g>
          <g transform="translate(125, 50)">
            <circle r="3" fill="#C9A84C" />
            <ellipse cx="0" cy="-6" rx="2.5" ry="4" />
            <ellipse cx="5.5" cy="-2" rx="2.5" ry="4" transform="rotate(72 5.5 -2)" />
            <ellipse cx="3.5" cy="4.8" rx="2.5" ry="4" transform="rotate(144 3.5 4.8)" />
            <ellipse cx="-3.5" cy="4.8" rx="2.5" ry="4" transform="rotate(216 -3.5 4.8)" />
            <ellipse cx="-5.5" cy="-2" rx="2.5" ry="4" transform="rotate(288 -5.5 -2)" />
          </g>
        </g>
      </svg>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── *
 *  Recover Chat Modal — fluxo estilo agente para recuperar password.
 *  Pergunta: email → telemóvel → NIF. Envia POST /api/noivos-recover.
 *  Em sucesso o servidor envia a password para o email oficial da mãe.
 * ──────────────────────────────────────────────────────────────────────── */

type ChatMsg = {
  role: 'agent' | 'user'
  text: string
}

type ChatStep = 'email' | 'phone' | 'nif' | 'submitting' | 'done' | 'error'

function RecoverChatModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<ChatStep>('email')
  const [messages, setMsgs]   = useState<ChatMsg[]>([
    { role: 'agent', text: 'Olá! ♡ Estou aqui para ajudar a recuperar a vossa palavra-passe.' },
    { role: 'agent', text: 'Primeiro, preciso de confirmar a vossa identidade. Qual é o vosso e-mail (o que deram à RL)?' },
  ])
  const [input, setInput]     = useState('')
  const [emailV, setEmailV]   = useState('')
  const [phoneV, setPhoneV]   = useState('')
  const [nifV,   setNifV]     = useState('')
  const [errMsg, setErrMsg]   = useState<string | null>(null)

  const scrollRef = (typeof window !== 'undefined') ? null : null
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, step])

  // Mantém o foco no input quando o utilizador está a responder
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (step === 'email' || step === 'phone' || step === 'nif') {
      inputRef.current?.focus()
    }
  }, [step])

  function addAgent(text: string) {
    setMsgs(m => [...m, { role: 'agent', text }])
  }
  function addUser(text: string) {
    setMsgs(m => [...m, { role: 'user', text }])
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const v = input.trim()
    if (!v) return
    addUser(v)
    setInput('')

    if (step === 'email') {
      setEmailV(v)
      // pequena pausa para parecer mais natural
      setTimeout(() => addAgent('Obrigado. E agora o vosso número de telemóvel?'), 350)
      setStep('phone')
      return
    }
    if (step === 'phone') {
      setPhoneV(v)
      setTimeout(() => addAgent('E por último, o vosso NIF (número de contribuinte).'), 350)
      setStep('nif')
      return
    }
    if (step === 'nif') {
      setNifV(v)
      setStep('submitting')
      setTimeout(() => addAgent('Um momento, vou confirmar os vossos dados…'), 250)
      try {
        const res = await fetch('/api/noivos-recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailV, telefone: phoneV, nif: v }),
        })
        const j = await res.json().catch(() => ({}))

        if (res.status === 429 || j?.reason === 'rate_limit') {
          setErrMsg('rate_limit')
          addAgent('Recebi muitos pedidos do vosso lado nos últimos minutos. Por segurança, esperem ~30 minutos antes de tentar de novo, ou falem connosco directamente.')
          setStep('error')
          return
        }
        if (j?.ok) {
          addAgent(`Confirmado ♡ Enviei a vossa palavra-passe para ${j.sentTo ?? 'o vosso e-mail'}.`)
          addAgent('Verifiquem também a pasta de spam. Boa sessão!')
          setStep('done')
          return
        }
        if (j?.reason === 'no_password') {
          addAgent('Encontrei o vosso batizado, mas o portal ainda não foi activado pela nossa equipa. Falem connosco para activar o acesso.')
          setStep('error')
          return
        }
        // no_match, no_email_on_file, email_failed
        addAgent('Não consegui confirmar a vossa identidade com esses dados. Verifiquem que escreveram correctamente o e-mail, telemóvel e NIF que deram à RL — ou cliquem "Fala connosco" se preferirem ajuda directa.')
        setStep('error')
      } catch {
        addAgent('Houve um problema na ligação. Tentem outra vez ou falem connosco.')
        setStep('error')
      }
    }
  }

  function handleRetry() {
    setMsgs([
      { role: 'agent', text: 'Vamos tentar de novo ♡' },
      { role: 'agent', text: 'Qual é o vosso e-mail?' },
    ])
    setEmailV(''); setPhoneV(''); setNifV(''); setInput(''); setErrMsg(null)
    setStep('email')
  }

  const inputDisabled = step === 'submitting' || step === 'done' || step === 'error'

  const placeholder =
    step === 'email' ? 'O vosso e-mail…' :
    step === 'phone' ? 'O vosso telemóvel…' :
    step === 'nif'   ? 'O vosso NIF…' :
    ''

  const inputType =
    step === 'email' ? 'email' :
    step === 'phone' ? 'tel' :
    'text'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-in fade-in"
      style={{ background: 'rgba(15,10,5,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-3"
        style={{
          background: 'linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%)',
          border: '1.4px solid rgba(201,164,92,0.55)',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.55), 0 0 60px -20px rgba(201,164,92,0.45)',
        }}>

        {/* Header com avatar agente */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(201,164,92,0.20)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4B870 0%, #C9A84C 100%)',
                boxShadow: '0 4px 14px -4px rgba(201,164,92,0.6)',
              }}>
              <span className="text-[18px]" style={{ color: '#FAF7F2' }}>♡</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#3D2E1A', fontFamily: '"Cormorant Garamond", serif', fontSize: 18 }}>
                Apoio aos Pais
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.7)' }} />
                <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: '#8B7549' }}>Online · RL Photo</p>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: '#8B7549' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,164,92,0.12)'; e.currentTarget.style.color = '#3D2E1A' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B7549' }}>
            ✕
          </button>
        </div>

        {/* Conversa */}
        <div ref={containerRef}
          className="px-5 py-5 max-h-[55vh] overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}>
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i}
                className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1`}>
                <div className="max-w-[78%] px-4 py-2.5 rounded-2xl text-[13px] leading-[1.55]"
                  style={
                    m.role === 'agent'
                      ? {
                          background: 'rgba(255,253,250,0.95)',
                          border: '1px solid rgba(201,164,92,0.30)',
                          color: '#3D2E1A',
                          fontFamily: 'Georgia, serif',
                          borderTopLeftRadius: 6,
                        }
                      : {
                          background: 'linear-gradient(135deg, #D4B870 0%, #C9A84C 100%)',
                          color: '#1F1608',
                          fontFamily: 'Georgia, serif',
                          fontWeight: 500,
                          borderTopRightRadius: 6,
                          boxShadow: '0 4px 12px -4px rgba(201,164,92,0.55)',
                        }
                  }>
                  {m.text}
                </div>
              </div>
            ))}

            {step === 'submitting' && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,253,250,0.95)', border: '1px solid rgba(201,164,92,0.30)', borderTopLeftRadius: 6 }}>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#C9A84C', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#C9A84C', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#C9A84C', animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input ou estado final */}
        {!inputDisabled && (
          <form onSubmit={handleSend}
            className="flex items-center gap-2 px-5 py-4 border-t"
            style={{ borderColor: 'rgba(201,164,92,0.18)', background: 'rgba(248,239,221,0.4)' }}>
            <input
              ref={inputRef}
              type={inputType}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholder}
              autoFocus
              inputMode={step === 'phone' ? 'tel' : step === 'nif' ? 'numeric' : undefined}
              className="flex-1 px-4 py-2.5 rounded-xl outline-none transition-all text-[13px]"
              style={{
                background: 'rgba(255,253,250,0.85)',
                border: '1.3px solid rgba(201,164,92,0.35)',
                color: '#2D2218',
                fontFamily: 'Georgia, serif',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(201,164,92,0.75)'
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(201,164,92,0.12)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(201,164,92,0.35)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button type="submit" disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #D4B870 0%, #C9A84C 100%)',
                color: '#1F1608',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                boxShadow: '0 6px 18px -6px rgba(201,164,92,0.55)',
              }}>
              Enviar →
            </button>
          </form>
        )}

        {step === 'error' && (
          <div className="px-5 py-4 border-t flex items-center justify-between"
            style={{ borderColor: 'rgba(201,164,92,0.18)', background: 'rgba(248,239,221,0.5)' }}>
            <button onClick={handleRetry}
              className="text-[11px] tracking-[0.3em] uppercase font-semibold transition-colors"
              style={{ color: '#8B7549' }}>
              ↻ Tentar de novo
            </button>
            <button onClick={onClose}
              className="text-[11px] tracking-[0.3em] uppercase font-semibold transition-colors"
              style={{ color: '#C9A84C' }}>
              Fechar
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="px-5 py-4 border-t flex items-center justify-center"
            style={{ borderColor: 'rgba(201,164,92,0.18)', background: 'rgba(248,239,221,0.5)' }}>
            <button onClick={onClose}
              className="text-[11px] tracking-[0.3em] uppercase font-bold px-6 py-2 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #D4B870 0%, #C9A84C 100%)',
                color: '#1F1608',
                boxShadow: '0 6px 16px -4px rgba(201,164,92,0.55)',
              }}>
              ✓ Concluído
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
