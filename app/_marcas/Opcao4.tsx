'use client'

// ─────────────────────────────────────────────────────────────────────────
// OPÇÃO 4 da página de marcas — "Canvas".
// Fundo preto infinito que se arrasta: monograma RL ao centro dentro de
// anéis de mostrador, as três marcas à volta e fotografias espalhadas,
// com brilhos dourados desfocados. Referência: vídeo enviado pelo Rui
// (19/10/2026). É a página principal (/); Opção 1/2/3 em /?opcao=N.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LogoutButton } from '@/app/components/LogoutButton'

const OURO = '#d8be93'

// As três marcas, à volta do mostrador (x, y a partir do centro)
const MARCAS = [
  {
    href: '/photo', nome: 'RL Photo.Video', area: 'Casamentos',
    frase: 'O dia inteiro contado com calma, luz natural e verdade.',
    foto: '/eventos-hero-2026.webp', posicao: 'center 40%',
    logo: '/logo-photovideo-hd.png', logoEscala: 1.9,
    x: -470, y: -110, rot: -2,
  },
  {
    href: '/media', nome: 'RL Prod', area: 'Marcas',
    frase: 'Conteúdo com intenção, feito para ser visto e lembrado.',
    foto: '/login hero.png', posicao: 'center 50%',
    logo: '/logo-rl-prod-black.png', logoEscala: 1,
    x: 470, y: -150, rot: 1.5,
  },
  {
    href: '/wedding-mentor', nome: 'RL Wedding Mentor', area: 'Formação',
    frase: 'Educar, inspirar e elevar quem fotografa e filma casamentos.',
    foto: '/casamentos-2027.jpg', posicao: 'center 45%',
    logo: '/logo-mentor-hd.png', logoEscala: 1,
    x: 30, y: 400, rot: -1,
  },
]

// Fotografias espalhadas pelo canvas (só decorativas). d = profundidade (paralaxe)
const FOTOS = [
  { src: '/casamentos-2028.webp',      leg: 'Casamentos 2028', x: -1050, y: -560, w: 230, h: 300, d: .8 },
  { src: '/prewedding-hero.webp',      leg: 'Pré-wedding',     x: -260,  y: -640, w: 260, h: 180, d: .9 },
  { src: '/MEDIA HERO.png',            leg: 'RL Prod · Marcas', x: 1080, y: -560, w: 250, h: 320, d: .75 },
  { src: '/eventos-hero-2027.webp',    leg: 'Eventos 2027',    x: 1150,  y: 260,  w: 280, h: 190, d: .85 },
  { src: '/batizado-hero.webp',        leg: 'Batizados',       x: -1120, y: 330,  w: 230, h: 290, d: .8 },
  { src: '/eventos-hero-2028.webp',    leg: 'Eventos 2028',    x: -560,  y: 640,  w: 280, h: 190, d: .9 },
  { src: '/casamentos-2026.jpg',       leg: 'Casamentos 2026', x: 680,   y: 680,  w: 240, h: 300, d: .85 },
  { src: '/portal-noivos-login.webp',  leg: 'Portal dos noivos', x: 380, y: -720, w: 220, h: 150, d: .7 },
  { src: '/boas-vindas-camera.webp',   leg: 'Bastidores',      x: -1500, y: -80,  w: 220, h: 280, d: .65 },
  { src: '/crm-hero.webp',             leg: 'Reuniões',        x: 1560,  y: -120, w: 240, h: 170, d: .65 },
]

// Monograma RL dentro de anéis de mostrador
function Mostrador() {
  return (
    <div className="op4-mostrador" aria-hidden="true">
      <svg viewBox="-340 -340 680 680" width="680" height="680">
        <circle r="330" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
        <g className="op4-gira">
          {Array.from({ length: 144 }).map((_, i) => {
            const a = (i / 144) * Math.PI * 2
            const r1 = 158, r2 = i % 12 === 0 ? 146 : 152
            const n = (v: number) => Math.round(v * 100) / 100
            return <line key={i} x1={n(Math.cos(a) * r1)} y1={n(Math.sin(a) * r1)} x2={n(Math.cos(a) * r2)} y2={n(Math.sin(a) * r2)}
              stroke="rgba(255,255,255,.22)" strokeWidth="1" />
          })}
        </g>
        <g className="op4-gira-inv">
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2 + .3
            return <circle key={i} cx={Math.round(Math.cos(a) * 13500) / 100} cy={Math.round(Math.sin(a) * 13500) / 100} r="3" fill="rgba(255,255,255,.35)" />
          })}
        </g>
        <ellipse rx="44" ry="58" fill="none" stroke={OURO} strokeWidth="1.2" />
        <text x="-14" y="-6" textAnchor="middle" className="op4-mono-letra">R</text>
        <text x="14" y="30" textAnchor="middle" className="op4-mono-letra">L</text>
      </svg>
    </div>
  )
}

export default function MarcasOpcao4() {
  const mundo = useRef<HTMLDivElement>(null)
  const pan = useRef({ x: 0, y: 0 })
  const alvo = useRef<{ x: number; y: number } | null>(null)
  const vel = useRef({ x: 0, y: 0 })
  const arrasto = useRef<{ id: number; x: number; y: number; t: number; moveu: number } | null>(null)
  const [pronto, setPronto] = useState(false)
  const [aArrastar, setAArrastar] = useState(false)
  const zoom = useRef(1)

  const aplicar = useCallback(() => {
    const el = mundo.current
    if (!el) return
    // não deixa o canvas fugir para longe das fotografias
    const lx = 1500 * zoom.current, ly = 950 * zoom.current
    pan.current.x = Math.max(-lx, Math.min(lx, pan.current.x))
    pan.current.y = Math.max(-ly, Math.min(ly, pan.current.y))
    el.style.setProperty('--px', `${pan.current.x / zoom.current}px`)
    el.style.setProperty('--py', `${pan.current.y / zoom.current}px`)
    el.style.transform = `scale(${zoom.current})`
  }, [])

  // Animação: inércia depois de largar e deslize suave até um alvo (teclas 1/2/3)
  useEffect(() => {
    let raf = 0
    const passo = () => {
      if (!arrasto.current) {
        if (alvo.current) {
          pan.current.x += (alvo.current.x - pan.current.x) * .08
          pan.current.y += (alvo.current.y - pan.current.y) * .08
          if (Math.hypot(alvo.current.x - pan.current.x, alvo.current.y - pan.current.y) < .5) alvo.current = null
          aplicar()
        } else if (Math.abs(vel.current.x) > .05 || Math.abs(vel.current.y) > .05) {
          pan.current.x += vel.current.x
          pan.current.y += vel.current.y
          vel.current.x *= .93
          vel.current.y *= .93
          aplicar()
        }
      }
      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    // em ecrãs pequenos o canvas fica mais pequeno, para se ver o mostrador e as marcas
    const medir = () => { zoom.current = Math.min(1, Math.max(.5, Math.min(innerWidth / 1500, innerHeight / 1000))); aplicar() }
    medir()
    window.addEventListener('resize', medir)
    const t = setTimeout(() => setPronto(true), 60)
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener('resize', medir) }
  }, [aplicar])

  function onDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    arrasto.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moveu: 0 }
    alvo.current = null
    vel.current = { x: 0, y: 0 }
  }
  function onMove(e: React.PointerEvent) {
    const a = arrasto.current
    if (!a || a.id !== e.pointerId) return
    const dx = e.clientX - a.x, dy = e.clientY - a.y
    a.moveu += Math.abs(dx) + Math.abs(dy)
    if (a.moveu > 6 && !aArrastar) {
      setAArrastar(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const agora = performance.now()
    const dt = Math.max(agora - a.t, 1)
    const lim = (v: number) => Math.max(-25, Math.min(25, v))
    vel.current = { x: lim(dx / dt * 16), y: lim(dy / dt * 16) }
    pan.current.x += dx
    pan.current.y += dy
    a.x = e.clientX; a.y = e.clientY; a.t = agora
    aplicar()
  }
  function onUp(e: React.PointerEvent) {
    const a = arrasto.current
    if (!a || a.id !== e.pointerId) return
    arrasto.current = null
    if (performance.now() - a.t > 80) vel.current = { x: 0, y: 0 }
    // deixa o clique ser cancelado se houve arrasto, depois volta ao normal
    setTimeout(() => setAArrastar(false), 0)
  }
  function onWheel(e: React.WheelEvent) {
    alvo.current = null
    pan.current.x -= e.deltaX
    pan.current.y -= e.deltaY
    aplicar()
  }

  // Teclado: 1/2/3 leva o canvas até à marca, 0/Esc volta ao centro
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['1', '2', '3'].includes(e.key)) {
        const m = MARCAS[Number(e.key) - 1]
        alvo.current = { x: -m.x * zoom.current, y: -m.y * zoom.current }
        document.getElementById(`op4-marca-${e.key}`)?.focus({ preventScroll: true })
      } else if (e.key === '0' || e.key === 'Escape') {
        alvo.current = { x: 0, y: 0 }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&display=swap');

        .op4 { position: fixed; inset: 0; background: #050505; color: #f3ede2; overflow: hidden; touch-action: none; user-select: none; cursor: grab; }
        .op4.arrastar { cursor: grabbing; }
        .op4 * { box-sizing: border-box; }
        .op4-mono { font-family: 'Space Mono', monospace; text-transform: uppercase; }
        .op4-serif { font-family: 'Cormorant Garamond', serif; }

        .op4-mundo { position: absolute; left: 50%; top: 50%; width: 0; height: 0; --px: 0px; --py: 0px; }
        .op4-camada { position: absolute; left: 0; top: 0; transform: translate(calc(var(--px) * var(--d)), calc(var(--py) * var(--d))); will-change: transform; }

        /* Brilhos dourados desfocados */
        @keyframes op4Respira { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .85 } 50% { transform: translate(-50%,-50%) scale(1.15); opacity: 1 } }
        .op4-brilho { position: absolute; border-radius: 50%; filter: blur(70px); transform: translate(-50%,-50%); animation: op4Respira 9s ease-in-out infinite; pointer-events: none; }

        /* Mostrador */
        .op4-mostrador { position: absolute; left: 0; top: 0; transform: translate(-50%,-50%); pointer-events: none; }
        @keyframes op4Gira { to { transform: rotate(360deg) } }
        .op4-gira { animation: op4Gira 120s linear infinite; transform-origin: 0 0; }
        .op4-gira-inv { animation: op4Gira 80s linear infinite reverse; transform-origin: 0 0; }
        .op4-mono-letra { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 46px; fill: #f3ede2; }

        /* Cartões */
        .op4-cartao { position: absolute; transform: translate(-50%,-50%) rotate(var(--r)) scale(.92); opacity: 0;
          transition: opacity 1s ease, transform 1.1s cubic-bezier(.19,1,.22,1), box-shadow .4s ease, filter .4s ease; }
        .op4.pronto .op4-cartao { opacity: 1; transform: translate(-50%,-50%) rotate(var(--r)) scale(1); }
        .op4-foto { overflow: hidden; border-radius: 3px; filter: brightness(.55) saturate(.8); }
        .op4-foto:hover { filter: brightness(.95) saturate(1); }
        .op4-leg { margin-top: 8px; font-size: .5rem; letter-spacing: .28em; color: rgba(243,237,226,.35); }

        .op4-marca { display: block; width: 340px; border-radius: 4px; overflow: hidden; text-decoration: none; color: inherit;
          background: #0d0d0d; border: 1px solid rgba(216,190,147,.22); outline: none; }
        .op4-marca:hover, .op4-marca:focus-visible { border-color: rgba(216,190,147,.75); box-shadow: 0 0 70px -20px rgba(216,190,147,.55); }
        .op4.pronto .op4-marca:hover, .op4.pronto .op4-marca:focus-visible { transform: translate(-50%,-50%) rotate(0deg) scale(1.03); }
        .op4-marca-foto { position: relative; height: 230px; overflow: hidden; }
        .op4-marca-foto img { transition: transform 1.2s cubic-bezier(.19,1,.22,1), filter .6s ease; filter: grayscale(.5) brightness(.75); }
        .op4-marca:hover .op4-marca-foto img, .op4-marca:focus-visible .op4-marca-foto img { transform: scale(1.06); filter: none; }
        .op4-entrar { display: inline-flex; align-items: center; gap: 10px; padding: 9px 20px; border-radius: 99px; border: 1px solid rgba(216,190,147,.45);
          font-size: .55rem; letter-spacing: .28em; color: #d8be93; transition: background .3s ease, color .3s ease, gap .3s ease; }
        .op4-marca:hover .op4-entrar, .op4-marca:focus-visible .op4-entrar { background: #d8be93; color: #0b0b0b; gap: 16px; }

        /* Barras fixas */
        .op4-topo { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 22px; padding: 18px 24px; z-index: 10;
          background: linear-gradient(to bottom, rgba(5,5,5,.85), transparent); pointer-events: none; }
        .op4-topo > * { pointer-events: auto; }
        .op4-topo a { font-size: .55rem; letter-spacing: .26em; color: rgba(243,237,226,.6); text-decoration: none; transition: color .2s; }
        .op4-topo a:hover { color: #d8be93; }
        .op4-base { position: absolute; left: 0; right: 0; bottom: 18px; display: flex; justify-content: center; z-index: 10; pointer-events: none; }
        .op4-pilulas { display: none; pointer-events: auto; gap: 6px; padding: 6px; border-radius: 99px; background: rgba(5,5,5,.75); border: 1px solid rgba(216,190,147,.25); backdrop-filter: blur(10px); }
        .op4-pilulas a { font-size: .52rem; letter-spacing: .2em; color: #f3ede2; text-decoration: none; padding: 10px 14px; border-radius: 99px; border: 1px solid rgba(216,190,147,.35); }
        .op4-base .op4-dica { font-size: .5rem; letter-spacing: .3em; color: rgba(243,237,226,.35); padding: 8px 16px; border-radius: 99px;
          background: rgba(5,5,5,.6); border: 1px solid rgba(255,255,255,.07); backdrop-filter: blur(8px); }

        @media (prefers-reduced-motion: reduce) {
          .op4-gira, .op4-gira-inv, .op4-brilho { animation: none; }
          .op4-cartao { transition: none; }
        }
        @media (max-width: 767px) {
          .op4-links, .op4-dica { display: none !important; }
          .op4-pilulas { display: flex; }
          .op4-mostrador svg { width: 520px; height: 520px; }
          .op4-marca { width: 280px; }
          .op4-marca-foto { height: 180px; }
        }
      `}</style>

      <div className={`op4${pronto ? ' pronto' : ''}${aArrastar ? ' arrastar' : ''}`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
        onClickCapture={e => { if (aArrastar) { e.preventDefault(); e.stopPropagation() } }}>

        <div className="op4-mundo" ref={mundo}>

          {/* Brilhos (bem atrás, mexem-se devagar) */}
          <div className="op4-camada" style={{ ['--d' as string]: .35 }}>
            <div className="op4-brilho" style={{ left: 620, top: -520, width: 560, height: 360, background: 'radial-gradient(closest-side, rgba(210,150,50,.75), transparent)' }} />
            <div className="op4-brilho" style={{ left: -120, top: 560, width: 700, height: 420, background: 'radial-gradient(closest-side, rgba(220,170,70,.7), transparent)', animationDelay: '-4s' }} />
            <div className="op4-brilho" style={{ left: -900, top: -200, width: 520, height: 520, background: 'radial-gradient(closest-side, rgba(150,70,25,.5), transparent)', animationDelay: '-2s' }} />
          </div>

          {/* Mostrador ao centro */}
          <div className="op4-camada" style={{ ['--d' as string]: 1 }}>
            <Mostrador />
          </div>

          {/* Fotografias espalhadas */}
          {FOTOS.map((f, i) => (
            <div key={f.src} className="op4-camada" style={{ ['--d' as string]: f.d }}>
              <div className="op4-cartao" style={{ left: f.x, top: f.y, ['--r' as string]: `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg`, transitionDelay: `${300 + i * 70}ms` }}>
                <div className="op4-foto" style={{ position: 'relative', width: f.w, height: f.h }}>
                  <Image src={f.src} alt="" fill sizes="300px" draggable={false} style={{ objectFit: 'cover' }} />
                </div>
                <p className="op4-leg op4-mono">{f.leg}</p>
              </div>
            </div>
          ))}

          {/* As três marcas */}
          <div className="op4-camada" style={{ ['--d' as string]: 1 }}>
            {MARCAS.map((m, i) => (
              <Link key={m.href} href={m.href} id={`op4-marca-${i + 1}`} draggable={false}
                className="op4-cartao op4-marca"
                style={{ left: m.x, top: m.y, ['--r' as string]: `${m.rot}deg`, transitionDelay: `${i * 120}ms` }}
                aria-label={`Entrar em ${m.nome}, ${m.area}`}>
                <div className="op4-marca-foto">
                  <Image src={m.foto} alt="" fill priority sizes="340px" draggable={false} style={{ objectFit: 'cover', objectPosition: m.posicao }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d, rgba(13,13,13,.1) 60%)' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', width: '56%', aspectRatio: '16/10', filter: 'brightness(0) invert(1)', opacity: .92 }}>
                    <div style={{ position: 'absolute', inset: 0, transform: `scale(${m.logoEscala})` }}>
                      <Image src={m.logo} alt="" fill sizes="200px" draggable={false} style={{ objectFit: 'contain' }} />
                    </div>
                  </div>
                  <span className="op4-mono" style={{ position: 'absolute', top: 14, left: 16, fontSize: '.5rem', letterSpacing: '.3em', color: 'rgba(243,237,226,.6)' }}>
                    0{i + 1}
                  </span>
                </div>
                <div style={{ padding: '6px 22px 22px' }}>
                  <p className="op4-mono" style={{ fontSize: '.5rem', letterSpacing: '.3em', color: OURO }}>{m.nome}</p>
                  <h2 className="op4-serif" style={{ fontWeight: 300, fontSize: '2.4rem', lineHeight: 1, marginTop: 8 }}>
                    <span style={{ fontStyle: 'italic' }}>{m.area.charAt(0)}</span>{m.area.slice(1)}
                  </h2>
                  <p className="op4-serif" style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.4, color: 'rgba(243,237,226,.6)', marginTop: 8 }}>
                    {m.frase}
                  </p>
                  <span className="op4-entrar op4-mono" style={{ marginTop: 16 }}>Entrar <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Barra de cima */}
        <header className="op4-topo op4-mono">
          <span style={{ fontSize: '.55rem', letterSpacing: '.32em', color: OURO }}>RL · Universo de Marcas</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <nav className="op4-links" style={{ display: 'flex', gap: 22 }}>
              {MARCAS.map(m => <Link key={m.href} href={m.href}>{m.area}</Link>)}
            </nav>
            <LogoutButton />
          </div>
        </header>

        <div className="op4-base op4-mono">
          <span className="op4-dica">Arrasta para explorar · 1 · 2 · 3 marcas · 0 centro</span>
          {/* No telemóvel: atalhos para as três marcas */}
          <nav className="op4-pilulas">
            {MARCAS.map(m => <Link key={m.href} href={m.href}>{m.area}</Link>)}
          </nav>
        </div>
      </div>
    </>
  )
}
