'use client'

// ─────────────────────────────────────────────────────────────────────────
// OPÇÃO 4 da página de marcas — "Roda".
// Fundo preto, monograma RL ao centro dentro de anéis de mostrador. A roda
// só roda com o scroll do rato (ou a arrastar no telemóvel) e os cartões
// (as três marcas + fotografias) giram à volta dela: os de baixo vêm para
// a frente, grandes e nítidos; os de cima ficam pequenos e apagados.
// Referência: vídeo enviado pelo Rui (19/10/2026). É a página principal (/);
// Opção 1/2/3 em /?opcao=N.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { LogoutButton } from '@/app/components/LogoutButton'

const OURO = '#d8be93'

type Item =
  | { tipo: 'marca'; href: string; nome: string; area: string; frase: string; foto: string; posicao: string; logo: string; logoEscala: number }
  | { tipo: 'foto'; src: string; leg: string; w: number; h: number }

// À volta da roda, por ordem (cada um a 30°). A primeira marca começa à frente.
const ITENS: Item[] = [
  { tipo: 'marca', href: '/photo', nome: 'RL Photo.Video', area: 'Casamentos',
    frase: 'O dia inteiro contado com calma, luz natural e verdade.',
    foto: '/eventos-hero-2026.webp', posicao: 'center 40%', logo: '/logo-photovideo-hd.png', logoEscala: 1.9 },
  { tipo: 'foto', src: '/prewedding-hero.webp', leg: 'Pré-wedding', w: 220, h: 150 },
  { tipo: 'foto', src: '/casamentos-2028.webp', leg: 'Casamentos 2028', w: 170, h: 220 },
  { tipo: 'foto', src: '/eventos-hero-2027.webp', leg: 'Eventos 2027', w: 220, h: 150 },
  { tipo: 'marca', href: '/media', nome: 'RL Prod', area: 'Marcas',
    frase: 'Conteúdo com intenção, feito para ser visto e lembrado.',
    foto: '/login hero.png', posicao: 'center 50%', logo: '/logo-rl-prod-black.png', logoEscala: 1 },
  { tipo: 'foto', src: '/MEDIA HERO.png', leg: 'RL Prod', w: 170, h: 220 },
  { tipo: 'foto', src: '/batizado-hero.webp', leg: 'Batizados', w: 170, h: 220 },
  { tipo: 'foto', src: '/crm-hero.webp', leg: 'Reuniões', w: 220, h: 150 },
  { tipo: 'marca', href: '/wedding-mentor', nome: 'RL Wedding Mentor', area: 'Formação',
    frase: 'Educar, inspirar e elevar quem fotografa e filma casamentos.',
    foto: '/casamentos-2027.jpg', posicao: 'center 45%', logo: '/logo-mentor-hd.png', logoEscala: 1 },
  { tipo: 'foto', src: '/boas-vindas-camera.webp', leg: 'Bastidores', w: 170, h: 220 },
  { tipo: 'foto', src: '/casamentos-2026.jpg', leg: 'Casamentos 2026', w: 170, h: 220 },
  { tipo: 'foto', src: '/eventos-hero-2028.webp', leg: 'Eventos 2028', w: 220, h: 150 },
]
const MARCAS = ITENS.filter((i): i is Extract<Item, { tipo: 'marca' }> => i.tipo === 'marca')
const PASSO = 360 / ITENS.length

const r2 = (v: number) => Math.round(v * 100) / 100

// Monograma RL dentro de anéis de mostrador; os anéis de dentro rodam com o scroll
function Mostrador({ gira, giraInv }: { gira: React.Ref<SVGGElement>; giraInv: React.Ref<SVGGElement> }) {
  return (
    <svg viewBox="-340 -340 680 680" className="op4-mostrador" aria-hidden="true">
      <circle r="330" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
      <g ref={gira}>
        {Array.from({ length: 144 }).map((_, i) => {
          const a = (i / 144) * Math.PI * 2
          const ra = 158, rb = i % 12 === 0 ? 144 : 151
          return <line key={i} x1={r2(Math.cos(a) * ra)} y1={r2(Math.sin(a) * ra)} x2={r2(Math.cos(a) * rb)} y2={r2(Math.sin(a) * rb)}
            stroke={i === 0 ? OURO : 'rgba(255,255,255,.24)'} strokeWidth={i === 0 ? 2 : 1} />
        })}
      </g>
      <g ref={giraInv}>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2 + .3
          return <circle key={i} cx={r2(Math.cos(a) * 132)} cy={r2(Math.sin(a) * 132)} r="3" fill="rgba(255,255,255,.35)" />
        })}
      </g>
      <ellipse rx="44" ry="58" fill="none" stroke={OURO} strokeWidth="1.2" />
      <text x="-14" y="-6" textAnchor="middle" className="op4-letra">R</text>
      <text x="14" y="30" textAnchor="middle" className="op4-letra">L</text>
    </svg>
  )
}

export default function MarcasOpcao4() {
  const cartoes = useRef<(HTMLElement | null)[]>([])
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const alvo = useRef(0)      // ângulo pedido pelo scroll (graus)
  const atual = useRef(0)     // ângulo mostrado (vai atrás do alvo, suave)
  const toque = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    let w = innerWidth, h = innerHeight

    const desenhar = (ang: number) => {
      const zoom = Math.min(1, Math.max(.55, Math.min(w / 1500, h / 950)))
      const movel = w < 768
      const rx = movel ? w * .42 : Math.min(w * .36, 640)
      // o cartão da frente (em baixo) tem de caber inteiro no ecrã
      const ry = Math.max(h * .18, h / 2 - (380 * zoom) / 2 - (movel ? 80 : 40))
      ITENS.forEach((_, i) => {
        const el = cartoes.current[i]
        if (!el) return
        // 90° = em baixo, à frente
        const t = ((90 + i * PASSO - ang) * Math.PI) / 180
        const x = Math.cos(t) * rx
        const y = Math.sin(t) * ry
        const frente = (Math.sin(t) + 1) / 2            // 0 atrás (em cima) … 1 à frente (em baixo)
        const escala = zoom * (.55 + .45 * frente)
        el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${escala.toFixed(3)})`
        el.style.opacity = Math.min(1, .08 + frente * frente * 1.15).toFixed(3)
        el.style.filter = `blur(${((1 - frente) * 3).toFixed(2)}px) brightness(${(.35 + .65 * frente).toFixed(3)})`
        el.style.zIndex = String(Math.round(frente * 100))
        el.style.pointerEvents = frente > .55 ? 'auto' : 'none'
        el.tabIndex = frente > .55 ? 0 : -1
      })
      gira.current?.setAttribute('transform', `rotate(${r2(ang)})`)
      giraInv.current?.setAttribute('transform', `rotate(${r2(-ang * .6)})`)
    }

    const passo = () => {
      const d = alvo.current - atual.current
      if (Math.abs(d) > .01) {
        atual.current += d * .09
        desenhar(atual.current)
      }
      raf = requestAnimationFrame(passo)
    }
    desenhar(atual.current)
    raf = requestAnimationFrame(passo)

    const onResize = () => { w = innerWidth; h = innerHeight; desenhar(atual.current) }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      alvo.current += delta * (e.deltaMode === 1 ? 4 : .12)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') alvo.current += PASSO
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') alvo.current -= PASSO
      else if (['1', '2', '3'].includes(e.key)) {
        // roda até essa marca ficar à frente, pelo caminho mais curto
        const idx = ITENS.indexOf(MARCAS[Number(e.key) - 1])
        const destino = idx * PASSO
        const voltas = Math.round((alvo.current - destino) / 360)
        alvo.current = destino + voltas * 360
        setTimeout(() => cartoes.current[idx]?.focus({ preventScroll: true }), 500)
      }
    }
    const onTouchStart = (e: TouchEvent) => { toque.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (toque.current === null) return
      const y = e.touches[0].clientY
      alvo.current += (toque.current - y) * .35
      toque.current = y
      e.preventDefault()
    }
    const onTouchEnd = () => { toque.current = null }

    window.addEventListener('resize', onResize)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&display=swap');

        .op4 { position: fixed; inset: 0; background: #050505; color: #f3ede2; overflow: hidden; touch-action: none; overscroll-behavior: none; }
        .op4 * { box-sizing: border-box; }
        .op4-mono { font-family: 'Space Mono', monospace; text-transform: uppercase; }
        .op4-serif { font-family: 'Cormorant Garamond', serif; }

        .op4-centro { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }

        /* Brilhos dourados desfocados */
        @keyframes op4Respira { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .8 } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 1 } }
        .op4-brilho { position: absolute; border-radius: 50%; filter: blur(80px); transform: translate(-50%,-50%); animation: op4Respira 10s ease-in-out infinite; pointer-events: none; }

        .op4-mostrador { position: absolute; left: 0; top: 0; width: min(68vmin, 680px); height: min(68vmin, 680px); transform: translate(-50%,-50%); pointer-events: none; }
        .op4-letra { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 46px; fill: #f3ede2; }

        /* Cartões (posição, tamanho e brilho vêm do scroll) */
        .op4-cartao { position: absolute; left: 0; top: 0; will-change: transform, opacity, filter; text-decoration: none; color: inherit; outline: none; }
        .op4-foto { position: relative; overflow: hidden; border-radius: 3px; box-shadow: 0 20px 60px -20px rgba(0,0,0,.8); }
        .op4-leg { margin-top: 8px; font-size: .5rem; letter-spacing: .28em; color: rgba(243,237,226,.4); }

        .op4-marca { display: block; width: 300px; border-radius: 4px; overflow: hidden; background: #0d0d0d; border: 1px solid rgba(216,190,147,.3);
          transition: border-color .3s ease, box-shadow .3s ease; }
        .op4-marca:hover, .op4-marca:focus-visible { border-color: rgba(216,190,147,.8); box-shadow: 0 0 70px -18px rgba(216,190,147,.6); }
        .op4-marca-foto { position: relative; height: 190px; overflow: hidden; }
        .op4-marca-foto img { transition: transform 1.2s cubic-bezier(.19,1,.22,1); }
        .op4-marca:hover .op4-marca-foto img { transform: scale(1.06); }
        .op4-entrar { display: inline-flex; align-items: center; gap: 10px; padding: 9px 20px; border-radius: 99px; border: 1px solid rgba(216,190,147,.45);
          font-size: .55rem; letter-spacing: .28em; color: #d8be93; transition: background .3s ease, color .3s ease, gap .3s ease; }
        .op4-marca:hover .op4-entrar, .op4-marca:focus-visible .op4-entrar { background: #d8be93; color: #0b0b0b; gap: 16px; }

        /* Barras fixas */
        .op4-topo { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 22px; padding: 18px 24px; z-index: 200;
          background: linear-gradient(to bottom, rgba(5,5,5,.85), transparent); }
        .op4-topo a { font-size: .55rem; letter-spacing: .26em; color: rgba(243,237,226,.6); text-decoration: none; transition: color .2s; }
        .op4-topo a:hover { color: #d8be93; }
        .op4-base { position: absolute; left: 0; right: 0; bottom: 18px; display: flex; justify-content: center; z-index: 200; pointer-events: none; }
        .op4-dica { font-size: .5rem; letter-spacing: .3em; color: rgba(243,237,226,.4); padding: 8px 16px; border-radius: 99px;
          background: rgba(5,5,5,.6); border: 1px solid rgba(255,255,255,.07); }
        .op4-pilulas { display: none; pointer-events: auto; gap: 6px; padding: 6px; border-radius: 99px; background: rgba(5,5,5,.75); border: 1px solid rgba(216,190,147,.25); backdrop-filter: blur(10px); }
        .op4-pilulas a { font-size: .52rem; letter-spacing: .2em; color: #f3ede2; text-decoration: none; padding: 10px 14px; border-radius: 99px; border: 1px solid rgba(216,190,147,.35); }

        @media (prefers-reduced-motion: reduce) { .op4-brilho { animation: none; } }
        @media (max-width: 767px) {
          .op4-links, .op4-dica { display: none !important; }
          .op4-pilulas { display: flex; }
        }
      `}</style>

      <div className="op4">
        <div className="op4-centro">
          <div className="op4-brilho" style={{ left: '38vw', top: '-34vh', width: 560, height: 360, background: 'radial-gradient(closest-side, rgba(210,150,50,.7), transparent)' }} />
          <div className="op4-brilho" style={{ left: '-6vw', top: '40vh', width: 720, height: 420, background: 'radial-gradient(closest-side, rgba(220,170,70,.6), transparent)', animationDelay: '-4s' }} />
          <div className="op4-brilho" style={{ left: '-44vw', top: '-10vh', width: 520, height: 520, background: 'radial-gradient(closest-side, rgba(150,70,25,.45), transparent)', animationDelay: '-2s' }} />

          <Mostrador gira={gira} giraInv={giraInv} />

          {ITENS.map((it, i) => it.tipo === 'marca' ? (
            <Link key={it.href} href={it.href} ref={el => { cartoes.current[i] = el }}
              className="op4-cartao op4-marca" draggable={false} style={{ opacity: 0 }}
              aria-label={`Entrar em ${it.nome}, ${it.area}`}>
              <div className="op4-marca-foto">
                <Image src={it.foto} alt="" fill priority sizes="300px" draggable={false} style={{ objectFit: 'cover', objectPosition: it.posicao }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d, rgba(13,13,13,.15) 60%)' }} />
                <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', width: '56%', aspectRatio: '16/10', filter: 'brightness(0) invert(1)', opacity: .92 }}>
                  <div style={{ position: 'absolute', inset: 0, transform: `scale(${it.logoEscala})` }}>
                    <Image src={it.logo} alt="" fill sizes="200px" draggable={false} style={{ objectFit: 'contain' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '4px 20px 20px' }}>
                <p className="op4-mono" style={{ fontSize: '.5rem', letterSpacing: '.3em', color: OURO }}>{it.nome}</p>
                <h2 className="op4-serif" style={{ fontWeight: 300, fontSize: '2.2rem', lineHeight: 1, marginTop: 8 }}>
                  <span style={{ fontStyle: 'italic' }}>{it.area.charAt(0)}</span>{it.area.slice(1)}
                </h2>
                <p className="op4-serif" style={{ fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.4, color: 'rgba(243,237,226,.6)', marginTop: 8 }}>
                  {it.frase}
                </p>
                <span className="op4-entrar op4-mono" style={{ marginTop: 14 }}>Entrar <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ) : (
            <div key={it.src} ref={el => { cartoes.current[i] = el }} className="op4-cartao" style={{ opacity: 0 }} aria-hidden="true">
              <div className="op4-foto" style={{ width: it.w, height: it.h }}>
                <Image src={it.src} alt="" fill sizes="240px" draggable={false} style={{ objectFit: 'cover' }} />
              </div>
              <p className="op4-leg op4-mono">{it.leg}</p>
            </div>
          ))}
        </div>

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
          <span className="op4-dica">Faz scroll para rodar · 1 · 2 · 3 marcas</span>
          {/* No telemóvel: atalhos para as três marcas */}
          <nav className="op4-pilulas">
            {MARCAS.map(m => <Link key={m.href} href={m.href}>{m.area}</Link>)}
          </nav>
        </div>
      </div>
    </>
  )
}
