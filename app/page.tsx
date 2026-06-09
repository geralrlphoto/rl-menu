'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════════════
   DADOS — edita aqui: textos, links e logos
═══════════════════════════════════════════════════════ */
const BRANDS = [
  {
    badge:   'Casamentos',
    name:    'RL Photo.Video',
    logo:    '/logo-photovideo-hd.png',
    href:    '/photo',
    label:   'Fotografia e vídeo\nde casamento',
    ariaLabel: 'Entrar em RL Photo.Video — Casamentos',
  },
  {
    badge:   'Marcas',
    name:    'RL Prod',
    logo:    '/logo-rl-prod-black.png',
    href:    '/media',
    label:   'Fotografia e vídeo\npara marcas',
    ariaLabel: 'Entrar em RL Prod — Marcas',
  },
  {
    badge:   'Formação',
    name:    'RL Wedding Mentor',
    logo:    '/logo mentor.webp',
    href:    '/wedding-mentor',
    label:   'Mentoria para\nprofissionais',
    ariaLabel: 'Entrar em RL Wedding Mentor — Formação',
  },
]

const TAGLINE  = 'RL · Universo de Marcas'
const FOOTER   = 'Três olhares, a mesma essência: contar histórias.'
const ORNAMENT = '✦  ❦  ✦'

/* ═══════════════════════════════════════════════════════
   LOGO COM FALLBACK TEXTO
═══════════════════════════════════════════════════════ */
function LogoWithFallback({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 300,
        fontSize: '1.4rem',
        letterSpacing: '.12em',
        color: '#23262d',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {alt}
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={220}
      height={120}
      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
      priority={priority}
      onError={() => setErrored(true)}
    />
  )
}

/* ═══════════════════════════════════════════════════════
   COMPONENTE
═══════════════════════════════════════════════════════ */
export default function SplashPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pequeno delay para activar as animações de entrada
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Space+Mono:wght@400;700&family=Jost:wght@300;400&display=swap');

        /* ── Reset para esta página ── */
        .sp-root, .sp-root * { box-sizing: border-box; }
        .sp-root {
          min-height: 100vh;
          background: #efe7d6;
          color: #23262d;
          font-family: 'Jost', sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ── Textura de papel ── */
        .sp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: .045;
          mix-blend-mode: multiply;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Vinheta ── */
        .sp-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(20,15,8,.12) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Animações de entrada ── */
        .sp-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .7s cubic-bezier(.22,1,.36,1),
                      transform .7s cubic-bezier(.22,1,.36,1);
        }
        .sp-reveal.visible { opacity: 1; transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .sp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        /* ── Etiqueta / badge ── */
        .sp-badge {
          display: inline-block;
          padding: .25rem .9rem;
          border: 1px solid rgba(35,38,45,.18);
          border-radius: 99px;
          font-family: 'Space Mono', monospace;
          font-size: .52rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: rgba(35,38,45,.55);
        }

        /* ── Botão Entrar ── */
        .sp-btn {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .6rem 1.6rem;
          border-radius: 99px;
          border: 1.5px solid #23262d;
          font-family: 'Space Mono', monospace;
          font-size: .55rem;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: #23262d;
          background: transparent;
          transition: background .28s ease, color .28s ease, gap .28s ease;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
        }
        .sp-btn .sp-arrow {
          display: inline-block;
          transition: transform .28s ease;
          font-size: .75rem;
          line-height: 1;
        }
        .sp-col-link:hover .sp-btn,
        .sp-btn:hover {
          background: #23262d;
          color: #efe7d6;
        }
        .sp-col-link:hover .sp-btn .sp-arrow,
        .sp-btn:hover .sp-arrow {
          transform: translateX(4px);
        }

        /* ── Coluna ── */
        .sp-col-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.8rem;
          padding: 3.5rem 2rem;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: background .3s;
          position: relative;
          flex: 1;
        }
        .sp-col-link:focus-visible {
          outline: 2px solid #9a8358;
          outline-offset: -2px;
        }
        .sp-col-link:hover { background: rgba(255,255,255,.22); }

        /* Logo hover scale */
        .sp-logo-wrap {
          width: 100%;
          max-width: 220px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .4s cubic-bezier(.22,1,.36,1);
        }
        .sp-logo-wrap--lg {
          max-width: 560px;
          height: 320px;
        }
        .sp-col-link:hover .sp-logo-wrap { transform: scale(1.04); }

        /* Divisória vertical entre colunas */
        .sp-vdivider {
          width: 1px;
          background: rgba(35,38,45,.1);
          align-self: stretch;
        }

        /* ── Label sob logo ── */
        .sp-col-label {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1rem;
          line-height: 1.5;
          text-align: center;
          color: rgba(35,38,45,.5);
          font-style: italic;
        }

        /* ── Linha decorativa topo/fundo ── */
        .sp-rule {
          display: flex;
          align-items: center;
          gap: .75rem;
          justify-content: center;
        }
        .sp-rule::before,
        .sp-rule::after {
          content: '';
          display: block;
          width: 3rem;
          height: 1px;
          background: rgba(35,38,45,.2);
        }

        /* ── Mobile ── */
        @media (max-width: 899px) {
          .sp-grid { flex-direction: column !important; }
          .sp-vdivider { width: 100% !important; height: 1px !important; align-self: auto !important; }
          .sp-col-link { padding: 3rem 2rem; }
        }
      `}</style>

      <div className="sp-root">

        {/* ── TOPO ─────────────────────────────────────────────── */}
        <header className="relative z-10 flex justify-center pt-10 pb-4 px-6">
          <p
            className={`sp-reveal${visible ? ' visible' : ''}`}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '.58rem',
              letterSpacing: '.4em',
              textTransform: 'uppercase',
              color: 'rgba(35,38,45,.4)',
              transitionDelay: '0ms',
            }}
          >
            {TAGLINE}
          </p>
        </header>

        {/* ── GRID DE 3 COLUNAS ────────────────────────────────── */}
        <main
          className="sp-grid relative z-10 flex"
          style={{ flex: 1 }}
          aria-label="Seleciona uma marca"
        >
          {BRANDS.map((brand, i) => (
            <>
              {i > 0 && <div key={`div-${i}`} className="sp-vdivider" />}

              <Link
                key={brand.href}
                href={brand.href}
                aria-label={brand.ariaLabel}
                className={`sp-col-link sp-reveal${visible ? ' visible' : ''}`}
                style={{ transitionDelay: `${80 + i * 120}ms` }}
              >
                {/* Badge */}
                <span className="sp-badge">{brand.badge}</span>

                {/* Logo — coloca o PNG em /public/assets/ para aparecer */}
                <div className={`sp-logo-wrap${i === 0 ? ' sp-logo-wrap--lg' : ''}`}>
                  <LogoWithFallback
                    src={brand.logo}
                    alt={brand.name}
                    priority={i === 0}
                  />
                </div>

                {/* Label descritivo */}
                <p className="sp-col-label">
                  {brand.label.split('\n').map((l, j) => (
                    <span key={j}>{j > 0 ? <><br />{l}</> : l}</span>
                  ))}
                </p>

                {/* Botão */}
                <div className="sp-btn" role="presentation">
                  Entrar
                  <span className="sp-arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            </>
          ))}
        </main>

        {/* ── RODAPÉ ───────────────────────────────────────────── */}
        <footer
          className={`relative z-10 flex flex-col items-center gap-3 py-10 px-6 sp-reveal${visible ? ' visible' : ''}`}
          style={{ transitionDelay: '480ms' }}
        >
          {/* Duas riscas + frase */}
          <div className="sp-rule">
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '.52rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: 'rgba(35,38,45,.35)',
              textAlign: 'center',
            }}>
              {FOOTER}
            </p>
          </div>

          {/* Ornamento */}
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '.85rem',
            color: '#9a8358',
            letterSpacing: '.3em',
            opacity: .7,
          }}>
            {ORNAMENT}
          </p>
        </footer>

      </div>
    </>
  )
}
