'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import MarcasOpcao2 from './_marcas/Opcao2'

/* ═══════════════════════════════════════════════════════
   DADOS — edita aqui: textos, links, logos e tons
═══════════════════════════════════════════════════════ */
const BRANDS = [
  {
    badge:   'Casamentos',
    name:    'RL Photo.Video',
    titulo:  'Casamentos',
    logo:    '/logo-photovideo-hd.png',
    escala:  2.3,    // o PNG tem muita margem à volta
    href:    '/photo',
    label:   'Fotografia e vídeo de casamento. O dia inteiro contado com calma, luz natural e verdade.',
    ariaLabel: 'Entrar em RL Photo.Video — Casamentos',
    fundo:   '#efe7d6',
    tinta:   '#23262d',
    acento:  '#9a8358',
  },
  {
    badge:   'Marcas',
    name:    'RL Prod',
    titulo:  'Marcas',
    logo:    '/logo-rl-prod-black.png',
    escala:  1,
    href:    '/media',
    label:   'Fotografia e vídeo para marcas. Conteúdo com intenção, feito para ser visto e lembrado.',
    ariaLabel: 'Entrar em RL Prod — Marcas',
    fundo:   '#e6e6e3',
    tinta:   '#141416',
    acento:  '#55575c',
  },
  {
    badge:   'Formação',
    name:    'RL Wedding Mentor',
    titulo:  'Formação',
    logo:    '/logo-mentor-hd.png',
    escala:  1,
    href:    '/wedding-mentor',
    label:   'Mentoria para profissionais. Educar, inspirar e elevar quem fotografa e filma casamentos.',
    ariaLabel: 'Entrar em RL Wedding Mentor — Formação',
    fundo:   '#f0e2d8',
    tinta:   '#2b2320',
    acento:  '#a07a64',
  },
]

const TAGLINE = 'RL · Universo de Marcas'
const FOOTER  = 'Três olhares, a mesma essência: contar histórias.'
const CICLO_MS = 6000   // troca automática enquanto ninguém mexe
const IRIS_MS  = 420    // tempo do diafragma a fechar

/* ═══════════════════════════════════════════════════════
   LOGO COM FALLBACK TEXTO
═══════════════════════════════════════════════════════ */
function LogoWithFallback({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '1.6rem', letterSpacing: '.12em', textAlign: 'center', lineHeight: 1.2 }}>
        {alt}
      </span>
    )
  }
  return (
    <Image src={src} alt={alt} width={320} height={220}
      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
      priority={priority} onError={() => setErrored(true)} />
  )
}

/* ═══════════════════════════════════════════════════════
   COMPONENTE
═══════════════════════════════════════════════════════ */
// /?opcao=2 mostra a Opção 2 ("Película") para comparar; sem parâmetro é a Opção 1
export default function SplashPage() {
  return (
    <Suspense fallback={null}>
      <EscolhaOpcao />
    </Suspense>
  )
}

function EscolhaOpcao() {
  const opcao = useSearchParams().get('opcao')
  return opcao === '2' ? <MarcasOpcao2 /> : <SplashOpcao1 />
}

function SplashOpcao1() {
  const router = useRouter()
  const [ativo, setAtivo]       = useState(0)     // marca em foco
  const [mostrado, setMostrado] = useState(0)     // marca visível dentro do diafragma
  const [fechado, setFechado]   = useState(true)  // começa fechado e abre à entrada
  const [visivel, setVisivel]   = useState(false)
  const [auto, setAuto]         = useState(true)  // ciclo automático até haver interação
  const [cicloKey, setCicloKey] = useState(0)     // reinicia a barra de progresso
  const trocaRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 60)
    const abre = setTimeout(() => setFechado(false), 380)
    return () => { clearTimeout(t); clearTimeout(abre) }
  }, [])

  // Diafragma: fecha, troca o logo, volta a abrir
  const ativoRef = useRef(0)
  const escolher = useCallback((i: number) => {
    if (ativoRef.current === i) return
    ativoRef.current = i
    setAtivo(i)
    setFechado(true)
    setCicloKey(k => k + 1)
    if (trocaRef.current) clearTimeout(trocaRef.current)
    trocaRef.current = setTimeout(() => { setMostrado(i); setFechado(false) }, IRIS_MS)
  }, [])

  // Ciclo automático
  useEffect(() => {
    if (!auto) return
    const t = setTimeout(() => escolher((ativo + 1) % BRANDS.length), CICLO_MS)
    return () => clearTimeout(t)
  }, [auto, ativo, cicloKey, escolher])

  // Teclado: setas trocam, 1/2/3 escolhem, Enter entra
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { setAuto(false); escolher((ativo + 1) % BRANDS.length) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { setAuto(false); escolher((ativo + BRANDS.length - 1) % BRANDS.length) }
      else if (['1', '2', '3'].includes(e.key)) { setAuto(false); escolher(Number(e.key) - 1) }
      else if (e.key === 'Enter' && document.activeElement === document.body) router.push(BRANDS[ativo].href)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ativo, escolher, router])

  useEffect(() => () => { if (trocaRef.current) clearTimeout(trocaRef.current) }, [])

  const b = BRANDS[ativo]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Space+Mono:wght@400;700&family=Jost:wght@300;400&display=swap');

        .sp-root, .sp-root * { box-sizing: border-box; }
        .sp-root {
          min-height: 100vh; position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          font-family: 'Jost', sans-serif;
          transition: background-color .9s ease, color .9s ease;
        }
        /* Grão de papel */
        .sp-root::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: .05; mix-blend-mode: multiply;
        }
        .sp-root::after {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse at 62% 50%, transparent 40%, rgba(20,15,8,.14) 100%);
        }

        .sp-mono { font-family: 'Space Mono', monospace; text-transform: uppercase; }
        .sp-serif { font-family: 'Cormorant Garamond', serif; }

        /* Entrada */
        .sp-in { opacity: 0; transform: translateY(20px); transition: opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1); }
        .sp-in.on { opacity: 1; transform: none; }

        /* Título: letras que sobem em cascata a cada troca */
        @keyframes spLetra { from { opacity: 0; transform: translateY(.45em) rotate(4deg); filter: blur(6px) } to { opacity: 1; transform: none; filter: blur(0) } }
        .sp-letra { display: inline-block; animation: spLetra .8s cubic-bezier(.22,1,.36,1) both; }
        @keyframes spFade { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        .sp-fade { animation: spFade .8s cubic-bezier(.22,1,.36,1) both; }

        /* Diafragma */
        .sp-iris-wrap { position: relative; width: min(46vw, 520px); aspect-ratio: 1; }
        .sp-iris {
          position: absolute; inset: 9%; border-radius: 50%; overflow: hidden;
          clip-path: circle(50% at 50% 50%);
          transition: clip-path ${IRIS_MS}ms cubic-bezier(.7,0,.3,1), transform ${IRIS_MS}ms cubic-bezier(.7,0,.3,1);
          display: flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.08), 0 40px 80px -40px rgba(0,0,0,.35);
          background: rgba(255,255,255,.45);
        }
        .sp-iris.fechado { clip-path: circle(0% at 50% 50%); transform: rotate(-35deg); }
        .sp-iris-logo { transition: transform .6s cubic-bezier(.22,1,.36,1), opacity .2s ease; }
        .sp-iris-wrap:hover .sp-iris-logo { transform: scale(1.05); }

        @keyframes spGira { to { transform: rotate(360deg) } }
        @keyframes spGiraInv { to { transform: rotate(-360deg) } }
        .sp-anel { position: absolute; inset: 0; animation: spGira 60s linear infinite; }
        .sp-anel-2 { position: absolute; inset: 4%; animation: spGiraInv 90s linear infinite; }
        .sp-lamina { transition: transform ${IRIS_MS}ms cubic-bezier(.7,0,.3,1); transform-origin: 50% 50%; }

        /* Botão entrar */
        .sp-btn {
          display: inline-flex; align-items: center; gap: .7rem;
          padding: .85rem 2rem; border-radius: 99px; border: 1.5px solid currentColor;
          font-family: 'Space Mono', monospace; font-size: .62rem; letter-spacing: .28em; text-transform: uppercase;
          text-decoration: none; color: inherit; background: transparent;
          transition: background .3s ease, color .3s ease, transform .3s ease, box-shadow .3s ease;
        }
        .sp-btn:hover { transform: translateY(-2px); }
        .sp-btn .sp-seta { transition: transform .3s ease; }
        .sp-btn:hover .sp-seta { transform: translateX(5px); }

        /* Navegação de baixo */
        .sp-nav-item { position: relative; text-align: left; padding: 1.1rem 0 1.2rem; cursor: pointer; background: none; border: 0; color: inherit; transition: opacity .4s ease; }
        .sp-nav-barra { position: absolute; left: 0; right: 0; top: 0; height: 1px; opacity: .15; background: currentColor; }
        @keyframes spEnche { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .sp-nav-progresso { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: currentColor; transform-origin: left; }

        @media (prefers-reduced-motion: reduce) {
          .sp-letra, .sp-fade, .sp-anel, .sp-anel-2 { animation: none !important; }
          .sp-in { opacity: 1; transform: none; }
          .sp-iris { transition: none; }
        }

        @media (max-width: 899px) {
          .sp-palco { flex-direction: column-reverse !important; gap: 2rem !important; padding-top: 1rem !important; }
          .sp-iris-wrap { width: min(78vw, 380px); }
          .sp-texto { text-align: center; align-items: center !important; }
          .sp-titulo { font-size: 3.6rem !important; }
          .sp-nav { grid-template-columns: 1fr !important; }
          .sp-nav-item { padding: .8rem 0 !important; }
          .sp-dica { display: none !important; }
        }
      `}</style>

      <div className="sp-root" style={{ backgroundColor: b.fundo, color: b.tinta }}>

        {/* ── TOPO ─────────────────────────────────────────────── */}
        <header className={`relative z-10 flex items-center justify-between px-6 sm:px-12 pt-8 sp-in${visivel ? ' on' : ''}`}>
          <p className="sp-mono" style={{ fontSize: '.58rem', letterSpacing: '.4em', opacity: .45 }}>{TAGLINE}</p>
          <p className="sp-mono sp-dica" style={{ fontSize: '.52rem', letterSpacing: '.3em', opacity: .35 }}>
            ← → para mudar · Enter para entrar
          </p>
        </header>

        {/* ── PALCO ────────────────────────────────────────────── */}
        <main className="sp-palco relative z-10 flex-1 flex items-center justify-between gap-10 px-6 sm:px-12 lg:px-20"
          aria-label="Seleciona uma marca">

          {/* Texto */}
          <div className={`sp-texto flex flex-col items-start max-w-xl sp-in${visivel ? ' on' : ''}`} style={{ transitionDelay: '120ms' }}>
            <div key={`n-${ativo}`} className="sp-fade flex items-center gap-4" style={{ color: b.acento }}>
              <span className="sp-serif italic" style={{ fontSize: '1.4rem' }}>0{ativo + 1}</span>
              <span style={{ width: '3rem', height: 1, background: 'currentColor', opacity: .5 }} />
              <span className="sp-mono" style={{ fontSize: '.55rem', letterSpacing: '.35em' }}>{b.name}</span>
            </div>

            <h1 key={`t-${ativo}`} className="sp-titulo sp-serif" aria-live="polite"
              style={{ fontWeight: 300, fontSize: 'clamp(3.2rem, 7.4vw, 7.5rem)', lineHeight: .92, letterSpacing: '-.01em', margin: '1.2rem 0 1.4rem' }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                {b.titulo.split('').map((l, i) => (
                  <span key={i} className="sp-letra" style={{ animationDelay: `${i * 38}ms`, fontStyle: i === 0 ? 'italic' : 'normal' }}>{l}</span>
                ))}
              </span>
            </h1>

            <p key={`d-${ativo}`} className="sp-fade sp-serif italic" style={{ fontSize: '1.2rem', lineHeight: 1.5, opacity: .65, maxWidth: '26rem', animationDelay: '220ms' }}>
              {b.label}
            </p>

            <Link key={`b-${ativo}`} href={b.href} aria-label={b.ariaLabel}
              className="sp-btn sp-fade mt-9"
              style={{ animationDelay: '320ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = b.tinta; e.currentTarget.style.color = b.fundo; e.currentTarget.style.boxShadow = `0 18px 40px -18px ${b.tinta}` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = b.tinta; e.currentTarget.style.boxShadow = 'none' }}>
              Entrar em {b.badge} <span className="sp-seta" aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Diafragma */}
          <Link href={b.href} aria-label={b.ariaLabel}
            className="sp-iris-wrap shrink-0" style={{ color: b.tinta }}
            onMouseEnter={() => setAuto(false)}>

            {/* Anel com marcas de objetiva */}
            <svg className="sp-anel" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth=".4" />
              {Array.from({ length: 72 }).map((_, i) => {
                const a = (i / 72) * Math.PI * 2
                const r1 = 98, r2 = i % 6 === 0 ? 93 : 96
                // Arredondado: servidor e browser têm de gerar exatamente os mesmos números
                const p = (v: number) => Math.round(v * 100) / 100
                return <line key={i} x1={p(100 + r1 * Math.cos(a))} y1={p(100 + r1 * Math.sin(a))} x2={p(100 + r2 * Math.cos(a))} y2={p(100 + r2 * Math.sin(a))}
                  stroke="currentColor" strokeOpacity={i % 6 === 0 ? .45 : .2} strokeWidth=".4" />
              })}
            </svg>

            {/* Lâminas do diafragma — rodam quando fecha */}
            <svg className="sp-anel-2" viewBox="0 0 200 200" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={i} className="sp-lamina" style={{ transform: `rotate(${i * 45 + (fechado ? 22 : 0)}deg)` }}>
                  <path d="M100 8 A92 92 0 0 1 165 35" fill="none" stroke="currentColor" strokeOpacity=".28" strokeWidth=".5" />
                  <path d="M165 35 L118 88" fill="none" stroke="currentColor" strokeOpacity={fechado ? .35 : .1} strokeWidth=".4"
                    style={{ transition: `stroke-opacity ${IRIS_MS}ms ease` }} />
                </g>
              ))}
            </svg>

            <div className={`sp-iris${fechado ? ' fechado' : ''}`}>
              {/* Os três logos ficam carregados; só o da marca mostrada está visível */}
              {BRANDS.map((m, i) => (
                <div key={m.href} className="sp-iris-logo absolute"
                  style={{
                    // Tamanho real em vez de transform: o browser pinta à primeira
                    width: `${62 * m.escala}%`, height: `${44 * m.escala}%`,
                    left: `${50 - 31 * m.escala}%`, top: `${50 - 22 * m.escala}%`,
                    opacity: i === mostrado ? 1 : 0,
                  }}
                  aria-hidden={i !== mostrado}>
                  <LogoWithFallback src={m.logo} alt={m.name} priority />
                </div>
              ))}
            </div>

            {/* Etiqueta da marca */}
            <span className="sp-mono absolute left-1/2 -translate-x-1/2 -bottom-2 px-3 py-1 rounded-full"
              style={{ fontSize: '.5rem', letterSpacing: '.3em', border: '1px solid currentColor', opacity: .45, background: b.fundo, transition: 'background-color .9s ease' }}>
              {b.badge}
            </span>
          </Link>
        </main>

        {/* ── NAVEGAÇÃO ─────────────────────────────────────────── */}
        <nav className={`sp-nav relative z-10 grid grid-cols-3 gap-6 sm:gap-10 px-6 sm:px-12 lg:px-20 pt-6 sp-in${visivel ? ' on' : ''}`}
          style={{ transitionDelay: '360ms' }} aria-label="Marcas">
          {BRANDS.map((brand, i) => {
            const on = i === ativo
            return (
              <button key={brand.href} className="sp-nav-item"
                style={{ opacity: on ? 1 : .42 }}
                onMouseEnter={() => { setAuto(false); escolher(i) }}
                onFocus={() => { setAuto(false); escolher(i) }}
                onClick={() => { if (on) router.push(brand.href); else { setAuto(false); escolher(i) } }}
                aria-current={on ? 'true' : undefined}>
                <span className="sp-nav-barra" />
                {on && (
                  <span key={`p-${cicloKey}-${auto}`} className="sp-nav-progresso"
                    style={auto
                      ? { animation: `spEnche ${CICLO_MS}ms linear both` }
                      : { transform: 'scaleX(1)' }} />
                )}
                <span className="sp-mono block" style={{ fontSize: '.52rem', letterSpacing: '.3em', opacity: .6 }}>0{i + 1} · {brand.badge}</span>
                <span className="sp-serif block mt-1.5" style={{ fontSize: '1.35rem', fontWeight: 300 }}>{brand.name}</span>
              </button>
            )
          })}
        </nav>

        {/* ── RODAPÉ ───────────────────────────────────────────── */}
        <footer className={`relative z-10 flex items-center justify-center gap-4 py-8 px-6 sp-in${visivel ? ' on' : ''}`}
          style={{ transitionDelay: '480ms' }}>
          <span style={{ width: '3rem', height: 1, background: 'currentColor', opacity: .2 }} />
          <p className="sp-mono text-center" style={{ fontSize: '.5rem', letterSpacing: '.28em', opacity: .38 }}>{FOOTER}</p>
          <span style={{ width: '3rem', height: 1, background: 'currentColor', opacity: .2 }} />
        </footer>
      </div>
    </>
  )
}
