'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PHOTO.VIDEO — Acesso ao Portal
 *
 *  Layout: split (esquerda hero cinematográfico, direita formulário).
 *  Dois modos:
 *    1) FREELANCER  (default) → email + palavra-passe da Dados Pessoais
 *    2) ADMIN       → palavra-passe global (AUTH_PASSWORD env)
 *
 *  Em ambos, o cookie é HttpOnly setado pelo respetivo endpoint:
 *    - /api/freelancer-auth (email/password)   → cookie  fl_session
 *    - /api/auth            (admin password)   → cookie  rl_auth
 * ─────────────────────────────────────────────────────────────────────────── */

// Imagem hero local (/public/login hero.png — espaço + .png).
// Encodada com %20 para o browser carregar correctamente.
// Fallback: backgroundColor navy se ficheiro faltar.
const HERO_BG = '/login%20hero.png'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0B]" />}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextFromUrl = searchParams?.get('next') ?? null
  const posMode     = searchParams?.get('pos') === '1'

  // ── Ajuste de posição da imagem hero (persistido em localStorage) ──
  type HeroPos = { x: number; y: number; zoom: number; bright: number }
  const HERO_POS_DEFAULT: HeroPos = { x: 50, y: 50, zoom: 105, bright: 92 }
  const [heroPos, setHeroPos] = useState<HeroPos>(HERO_POS_DEFAULT)
  // Carrega do localStorage no mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('login_hero_pos')
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj && typeof obj === 'object') {
          setHeroPos({
            x:      typeof obj.x === 'number' ? obj.x : HERO_POS_DEFAULT.x,
            y:      typeof obj.y === 'number' ? obj.y : HERO_POS_DEFAULT.y,
            zoom:   typeof obj.zoom === 'number' ? obj.zoom : HERO_POS_DEFAULT.zoom,
            bright: typeof obj.bright === 'number' ? obj.bright : HERO_POS_DEFAULT.bright,
          })
        }
      }
    } catch { /* ignore */ }
  }, [])

  const [mode, setMode] = useState<'freelancer' | 'admin'>('freelancer')
  // freelancer fields
  const [email, setEmail]       = useState('')
  const [pwd, setPwd]           = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  // admin fields
  const [adminPwd, setAdminPwd] = useState('')
  // state
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)

  // Auto-toast helper
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  // Sessão de freelancer já ativa neste browser (para mostrar opção "continuar").
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // Se já existe sessão E o utilizador veio de um link protegido (?next=), segue
  // direto. Se entrou em /login sem next, NÃO reencaminha — mostra o formulário
  // (permite iniciar sessão com outra conta) + um atalho para o portal.
  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        const r = await fetch('/api/freelancer-auth', { cache: 'no-store' })
        if (canceled) return
        const j = await r.json().catch(() => ({}))
        if (j?.ok && j?.session?.id) {
          const validNext = !!nextFromUrl && (nextFromUrl.startsWith('/freelancers/') || nextFromUrl.startsWith('/painel-editor') || nextFromUrl.startsWith('/freelancer-view/'))
          if (validNext) {
            router.replace(nextFromUrl!)
          } else {
            setActiveSessionId(j.session.id)
          }
        }
      } catch { /* offline / erro — fica em login */ }
    })()
    return () => { canceled = true }
  }, [router, nextFromUrl])

  async function handleFreelancerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !pwd) {
      setError('Preenche o e-mail e a palavra-passe.')
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/freelancer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pwd }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        setError('E-mail ou palavra-passe incorretos.')
        setToast('E-mail ou palavra-passe incorretos.')
        setLoading(false)
        return
      }
      // smooth transition — pequena pausa para a animação registar
      setToast('Acesso concedido. A abrir o teu portal…')
      // Aceita ?next= legítimo (novo /freelancers/<id>?view=freelancer
      // ou antigo /freelancer-view/<id>); caso contrário usa redirect do servidor.
      const flId = j.freelancer?.id ?? ''
      const isEditor = j.freelancer?.status === 'EDITORES'
      // Editores têm portal próprio (/painel-editor); restantes vão ao portal de freelancer.
      let target = isEditor
        ? `/painel-editor?freelancer=${flId}`
        : (j.redirect ?? `/freelancers/${flId}?view=freelancer`)
      // Para editores, ignora um next que aponte para /freelancers (evita hop/loop).
      if (nextFromUrl && !isEditor) {
        if (nextFromUrl.startsWith('/freelancer-view/')) {
          // Mantém para compatibilidade — middleware redireciona depois.
          target = nextFromUrl
        } else if (nextFromUrl.startsWith('/freelancers/') && nextFromUrl.includes('view=freelancer')) {
          target = nextFromUrl
        }
      }
      setTimeout(() => {
        router.push(target)
        router.refresh()
      }, 650)
    } catch (err) {
      setError('Não foi possível ligar ao servidor. Tenta novamente.')
      setLoading(false)
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPwd) { setError('Introduz a palavra-passe de admin.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPwd }),
      })
      if (!res.ok) {
        setError('Palavra-passe de admin incorreta.')
        setToast('Palavra-passe de admin incorreta.')
        setLoading(false)
        return
      }
      setToast('Bem-vindo de volta.')
      // Redirect imediato via window.location para o browser mostrar a sua
      // própria barra de progresso (em vez do botão a girar enquanto o
      // /photo server component faz 8 fetches paralelos ao Notion).
      // Default = / (brand selector — pura client component, instantâneo).
      setTimeout(() => {
        const target = nextFromUrl ?? '/'
        window.location.assign(target)
      }, 350)
    } catch {
      setError('Erro de ligação. Tenta novamente.')
      setLoading(false)
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      setToast('Introduz o teu e-mail primeiro para recuperar a palavra-passe.')
      return
    }
    setToast('Pedido enviado. Contacta o admin para repor a tua palavra-passe.')
  }

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-[#0B0B0B] text-white">
      {/* ── ESQUERDA — Hero cinematográfico ─────────────────────────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden">
        {/* background image — div com background-image (silenciosamente
            falha se o ficheiro ainda não estiver presente; o overlay
            cobre tudo na mesma). */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: `url("${HERO_BG}")`,
              backgroundColor: '#0a1525', // fallback navy se ficheiro falta
              backgroundPosition: `${heroPos.x}% ${heroPos.y}%`,
              transform: `scale(${heroPos.zoom / 100})`,
              transformOrigin: `${heroPos.x}% ${heroPos.y}%`,
              filter: `brightness(${heroPos.bright / 100}) saturate(1.08) contrast(1.05)`,
            }} />
          {/* overlay muito subtil — apenas para garantir legibilidade do texto */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(120deg, rgba(8,16,28,0.25) 0%, rgba(11,11,11,0.18) 55%, rgba(11,11,11,0.42) 100%)' }} />
          {/* fade direita → esquerda: dark concentrado só no bordo direito, lente fica visível */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(11,11,11,1) 0%, rgba(11,11,11,0.55) 8%, rgba(11,11,11,0.18) 20%, rgba(11,11,11,0) 35%)' }} />
          {/* glow dourado subtil no canto (assinatura RL) */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 78% 22%, rgba(201,164,92,0.14), transparent 55%)' }} />
          {/* film grain */}
          <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />
        </div>

        {/* TOP — Branding */}
        <header className="relative z-10 px-12 pt-12 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl border border-gold/45 overflow-hidden flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.22), rgba(201,164,92,0.05))', boxShadow: '0 0 28px -4px rgba(201,164,92,0.55)' }}>
            <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png" alt="RL" className="w-11 h-11 object-contain" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.55em] uppercase text-white/50">Photography &amp; Video</p>
            <p className="text-[16px] tracking-[0.35em] uppercase text-white font-light mt-0.5">
              RL <span className="text-gold">PHOTO</span>.VIDEO
            </p>
          </div>
        </header>

        {/* CENTER — Editorial copy */}
        <div className="relative z-10 px-12 max-w-xl">
          <div className="h-px w-16 bg-gold mb-6" />
          <h1 className="text-[42px] sm:text-[54px] leading-[1.05] font-light text-white tracking-tight"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            O teu espaço,<br />
            <em className="text-gold not-italic" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>os teus momentos.</em>
          </h1>
          <p className="mt-5 text-[13px] sm:text-[14px] leading-relaxed text-white/65 max-w-md tracking-wide"
            style={{ fontFamily: 'Georgia, serif' }}>
            Consulta os teus projetos, tarefas e conteúdos de forma simples e segura.
          </p>
        </div>

        {/* BOTTOM — Signature */}
        <footer className="relative z-10 px-12 pb-10 flex items-end justify-between">
          <p className="text-[9px] tracking-[0.55em] uppercase text-white/30">
            © RL Photo.Video · Portal Privado
          </p>
          <div className="flex items-center gap-3 text-[9px] tracking-[0.4em] uppercase text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
            Servidor seguro
          </div>
        </footer>
      </aside>

      {/* ── DIREITA — Formulário ────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 sm:px-12 py-12">
        {/* Logo topo — apenas mobile */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png" alt="RL Photo.Video" className="w-48 h-48 object-contain" />
        </div>
        <div className="w-full max-w-[420px]">
          {/* Mode toggle */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-[10px] tracking-[0.5em] uppercase text-gold/70 font-semibold">
              Acesso ao Portal
            </p>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              <button onClick={() => { setMode('freelancer'); setError(null) }}
                className={`text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${
                  mode === 'freelancer' ? 'bg-gold text-black font-bold' : 'text-white/55 hover:text-white'
                }`}>
                Equipa
              </button>
              <button onClick={() => { setMode('admin'); setError(null) }}
                className={`text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${
                  mode === 'admin' ? 'bg-gold text-black font-bold' : 'text-white/55 hover:text-white'
                }`}>
                Admin
              </button>
            </div>
          </div>

          <h2 className="text-[34px] leading-tight font-light text-white tracking-tight mb-2"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            {mode === 'freelancer' ? <>Bem-vindo de <em className="text-gold not-italic italic">volta</em>.</> : <>Painel <em className="text-gold not-italic italic">admin</em>.</>}
          </h2>
          <p className="text-[13px] text-white/55 mb-8 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            {mode === 'freelancer'
              ? 'Inicia sessão com o teu e-mail e palavra-passe.'
              : 'Acede ao dashboard interno com a palavra-passe global.'}
          </p>

          {mode === 'freelancer' && activeSessionId && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06]">
              <span className="text-[11px] text-emerald-200/80">Já tens uma sessão iniciada neste dispositivo.</span>
              <button type="button" onClick={() => router.push(`/freelancers/${activeSessionId}?view=freelancer`)}
                className="text-[10px] px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 tracking-widest uppercase font-semibold hover:bg-emerald-500/15 transition-all whitespace-nowrap">
                Entrar no portal ↗
              </button>
            </div>
          )}

          {mode === 'freelancer' ? (
            <form onSubmit={handleFreelancerSubmit} className="space-y-5">
              {/* Email */}
              <label className="block">
                <span className="text-[10px] tracking-[0.4em] uppercase text-white/45">E-mail</span>
                <div className="mt-1.5 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    autoComplete="email"
                    placeholder="o-teu-email@dominio.pt"
                    className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/55 focus:bg-white/[0.05] rounded-xl px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold/60 text-[14px]">✉</span>
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/45">Palavra-passe</span>
                  <button type="button" onClick={handleForgot}
                    className="text-[10px] tracking-widest uppercase text-gold/70 hover:text-gold transition-colors">
                    Recuperar
                  </button>
                </span>
                <div className="mt-1.5 relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => { setPwd(e.target.value); setError(null) }}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/55 focus:bg-white/[0.05] rounded-xl px-4 py-3 pr-12 text-[14px] text-white outline-none placeholder:text-white/20 tracking-widest transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-gold transition-colors"
                    title={showPwd ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>
                    {showPwd
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </label>

              {/* Aviso sessão estrita + error */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[10px] tracking-widest uppercase text-white/35">
                  🔒 Sessão expira após 30 min · login a cada saída do browser
                </p>
                {error && (
                  <span className="text-[11px] text-red-400 tracking-wider animate-in fade-in">{error}</span>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gold text-black text-[12px] font-bold tracking-[0.35em] uppercase py-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white"
                style={{ boxShadow: '0 0 22px -4px rgba(201,164,92,0.55)' }}>
                <span className="relative z-10">{loading ? 'A entrar…' : 'Iniciar Sessão'}</span>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <p className="text-[10px] text-white/35 tracking-wider text-center">
                Cada membro da equipa só acede ao seu portal pessoal.
              </p>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <label className="block">
                <span className="text-[10px] tracking-[0.4em] uppercase text-white/45">Palavra-passe Admin</span>
                <div className="mt-1.5 relative">
                  <input
                    type="password"
                    value={adminPwd}
                    onChange={e => { setAdminPwd(e.target.value); setError(null) }}
                    autoFocus
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/55 focus:bg-white/[0.05] rounded-xl px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/20 tracking-widest transition-all"
                  />
                </div>
              </label>

              {error && <p className="text-[11px] text-red-400 tracking-wider">{error}</p>}

              <button type="submit" disabled={loading || !adminPwd}
                className="group relative w-full overflow-hidden rounded-xl bg-gold text-black text-[12px] font-bold tracking-[0.35em] uppercase py-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white"
                style={{ boxShadow: '0 0 22px -4px rgba(201,164,92,0.55)' }}>
                <span className="relative z-10">{loading ? 'A entrar…' : 'Acesso Admin'}</span>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </form>
          )}

          {/* Mobile branding (visível só em mobile, já que o aside esquerdo está hidden) */}
          <div className="lg:hidden mt-10 pt-6 border-t border-white/[0.06] flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-gold/40 overflow-hidden flex items-center justify-center"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.20), rgba(201,164,92,0.04))', boxShadow: '0 0 20px -4px rgba(201,164,92,0.45)' }}>
                <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png" alt="RL" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <p className="text-[9px] tracking-[0.5em] uppercase text-white/40">Photography &amp; Video</p>
                <p className="text-[13px] tracking-[0.3em] uppercase text-white/80 font-light mt-0.5">
                  RL <span className="text-gold">PHOTO</span>.VIDEO
                </p>
              </div>
            </div>
            <p className="text-[9px] tracking-[0.45em] uppercase text-white/25">Portal Privado</p>
          </div>
        </div>

        {/* Toast bottom-right */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border border-gold/35 bg-black/85 backdrop-blur text-[12px] text-white/85 tracking-wide animate-in slide-in-from-bottom-2 fade-in"
            style={{ boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6), 0 0 14px -4px rgba(201,164,92,0.4)' }}>
            <span className="text-gold mr-2">●</span>{toast}
          </div>
        )}
      </section>

      {/* ── Painel de ajuste de posição — visível com /login?pos=1 ─────── */}
      {posMode && (
        <div className="fixed bottom-5 left-5 z-[100] w-[300px] rounded-2xl border shadow-2xl"
          style={{
            background: 'rgba(8,10,15,0.92)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(201,164,92,0.40)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 24px -4px rgba(201,164,92,0.30)',
          }}>
          <div className="px-4 pt-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-[9px] tracking-[0.4em] uppercase font-bold text-gold">Ajuste · Imagem Hero</p>
            <button onClick={() => {
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href)
                url.searchParams.delete('pos')
                window.location.href = url.toString()
              }
            }}
              className="text-[11px] text-white/45 hover:text-white">✕</button>
          </div>
          <div className="px-4 py-3 space-y-3">
            <Slider label="Horizontal" min={0} max={100} step={1} unit="%" value={heroPos.x}
              onChange={v => setHeroPos(p => ({ ...p, x: v }))} />
            <Slider label="Vertical" min={0} max={100} step={1} unit="%" value={heroPos.y}
              onChange={v => setHeroPos(p => ({ ...p, y: v }))} />
            <Slider label="Zoom" min={100} max={250} step={5} unit="%" value={heroPos.zoom}
              onChange={v => setHeroPos(p => ({ ...p, zoom: v }))} />
            <Slider label="Brilho" min={20} max={120} step={2} unit="%" value={heroPos.bright}
              onChange={v => setHeroPos(p => ({ ...p, bright: v }))} />
          </div>
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2 bg-black/30">
            <button onClick={() => setHeroPos(HERO_POS_DEFAULT)}
              className="text-[10px] tracking-widest uppercase text-white/45 hover:text-white px-2 py-1.5">
              Repor
            </button>
            <button onClick={() => {
              try {
                localStorage.setItem('login_hero_pos', JSON.stringify(heroPos))
                setToast('Posição guardada. Recarrega a página para ver fora do modo ajuste.')
              } catch { setToast('Falha ao guardar localStorage.') }
            }}
              className="text-[10px] tracking-[0.3em] uppercase font-bold px-4 py-1.5 rounded-md transition-all"
              style={{ background: '#c9a84c', color: '#1a1306', boxShadow: '0 0 14px -3px rgba(201,168,76,0.55)' }}>
              Guardar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

/* ─── Slider helper para o painel de ajuste ──────────────────────────────── */

function Slider({
  label, min, max, step, unit, value, onChange,
}: {
  label: string
  min: number; max: number; step: number; unit?: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] tracking-[0.35em] uppercase text-white/55 font-bold">{label}</span>
        <span className="text-[10px] text-gold/85 font-bold tabular-nums">{value}{unit ?? ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-gold cursor-pointer"
        style={{ height: 4 }} />
    </div>
  )
}
