'use client'

// ─────────────────────────────────────────────────────────────────────────
// OPÇÃO 4 da página de marcas — "Roda".
// Fundo preto e uma roda grande (monograma RL dentro de anéis de mostrador)
// com o centro na borda direita do ecrã: só se vê a metade esquerda. Os
// três cartões das marcas estão presos à roda;
// com o scroll do rato (ou a arrastar no telemóvel) roda tudo junto, e os
// cartões sobem pela esquerda: entram por baixo e saem por cima.
// Referência: vídeo enviado pelo Rui (19/10/2026). É a página principal (/);
// Opção 1/2/3 em /?opcao=N.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { LogoutButton } from '@/app/components/LogoutButton'
import Mostrador from './Mostrador'

const OURO = '#d8be93'

type Item =
  | { tipo: 'marca'; href: string; nome: string; area: string; frase: string; foto: string; posicao: string; logo: string; logoEscala: number; externo?: boolean }
  | { tipo: 'foto'; src: string; leg: string; w: number; h: number }

const marca = (href: string, nome: string, area: string, frase: string, foto: string, posicao: string, logo: string, logoEscala: number): Item =>
  ({ tipo: 'marca', href, nome, area, frase, foto, posicao, logo, logoEscala, externo: /^https?:/.test(href) })

// As marcas, uma vez cada, a 30° umas das outras. A roda roda entre a
// primeira ao meio (início) e a última ao meio (fim), sem dar a volta.
// SEAGUP é um site externo: abre noutro separador. O logo só aparece dentro da roda
// (no cartão não, porque a imagem já o traz).
const TRES: Item[] = [
  marca('/photo', 'RL Photo.Video', 'Casamentos', 'O dia inteiro contado com calma, luz natural e verdade.',
    '/eventos-hero-2026.webp', 'center 40%', '/logo-photovideo-hd.png', 1.9),
  marca('/media', 'RL Prod', 'Marcas', 'Conteúdo com intenção, feito para ser visto e lembrado.',
    '/login hero.png', 'center 50%', '/logo-rl-prod-black.png', 1),
  marca('/wedding-mentor', 'RL Wedding Mentor', 'Formação', 'Educar, inspirar e elevar quem fotografa e filma casamentos.',
    '/casamentos-2027.jpg', 'center 45%', '/logo-mentor-hd.png', 1),
  marca('https://portal.seagup.com/pro', 'SEAGUP', 'Seagup', 'Portal Seagup Pro.',
    '/seagup-pro.webp', 'center 50%', '/seagup-logo.png', 1),
]
const ANEL1: Item[] = TRES
const ANEL2: Item[] = []
const ITENS = [...ANEL1, ...ANEL2]
const PASSO = 30
// limites do scroll: da primeira à última marca no meio do ecrã
const limitar = (a: number) => Math.max(0, Math.min((ANEL1.length - 1) * PASSO, a))
const MARCAS = TRES.filter((i): i is Extract<Item, { tipo: 'marca' }> => i.tipo === 'marca')

const r2r = (v: number) => Math.round(v * 100) / 100

export default function MarcasOpcao4() {
  const cartoes = useRef<(HTMLElement | null)[]>([])
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const roda = useRef<SVGSVGElement>(null)
  const alvo = useRef(0)      // ângulo pedido pelo scroll (graus)
  const atual = useRef(0)     // ângulo mostrado (vai atrás do alvo, suave)
  const toque = useRef<number | null>(null)
  const router = useRouter()
  // clique num cartão: a roda gira a toda a velocidade e só depois entra na marca
  const giro = useRef<{ inicio: number; de: number; href: string; foi: boolean; x: number; y: number } | null>(null)
  const janela = useRef<HTMLDivElement>(null)   // logo da marca ativa, dentro da roda
  const ativaRef = useRef(0)
  const [ativa, setAtiva] = useState(0)         // 0 Casamentos · 1 Marcas · 2 Formação
  const [resumo, setResumo] = useState<{ casamento: { nome: string; dias: number } | null; leadsMarcas: number } | null>(null)

  // Números vivos dos cartões (próximo casamento, leads de marcas por contactar)
  useEffect(() => {
    fetch('/api/marcas-resumo').then(r => r.ok ? r.json() : null).then(setResumo).catch(() => {})
  }, [])

  useEffect(() => {
    let raf = 0
    let w = innerWidth, h = innerHeight

    const desenhar = (ang: number) => {
      const zoom = Math.min(1, Math.max(.5, Math.min(w / 1500, h / 950)))
      // centro da roda na borda direita, a meio da altura
      // no telemóvel o círculo é mais largo e o centro fica mais para fora,
      // para os cartões não se amontoarem
      const movel = w < 768
      const r1 = movel ? h * .55 : Math.max(w * .5, Math.min(w * .55, h * .75))
      const r2 = r1 + 330 * zoom
      const cx = movel ? r1 - w * .5 : 0
      if (roda.current) {
        const raio = Math.max(160, r1 - 175 * zoom)      // anel de fora do mostrador
        const lado = `${(raio * 2 * 340) / 330}px`
        roda.current.style.width = lado
        roda.current.style.height = lado
        roda.current.style.left = `${cx}px`
        if (janela.current) {
          // entre o traço contínuo (anel de fora) e o tracejado (mostrador, a 158/330 do raio)
          const lj = raio * .5
          janela.current.style.width = `${lj}px`
          janela.current.style.height = `${lj * .62}px`
          janela.current.style.left = `${cx - raio * .74}px`
        }
      }
      let melhor = -1, melhorFoco = 0
      ITENS.forEach((_, i) => {
        const el = cartoes.current[i]
        if (!el) return
        const fora = i >= ANEL1.length
        const k = fora ? i - ANEL1.length : i
        // 180° = à esquerda do centro; o scroll faz subir (ângulo a crescer)
        const t = ((180 - k * PASSO + (fora ? PASSO / 2 : 0) + ang) * Math.PI) / 180
        const r = fora ? r2 : r1
        const x = Math.cos(t) * r + cx
        const y = Math.sin(t) * r
        // aparecem a entrar por baixo e somem a sair por cima
        const borda = Math.abs(y) / (h / 2 + 140 * zoom)
        const vis = x - cx > 40 ? 0 : Math.max(0, Math.min(1, (1 - borda) / .35))
        el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${zoom.toFixed(3)})`
        el.style.opacity = (vis * (fora ? .85 : 1)).toFixed(3)
        // o cartão mais perto do meio do ecrã fica aceso
        const foco = Math.max(0, 1 - Math.abs(y) / (h * .4))
        el.style.filter = `brightness(${(.5 + .5 * foco).toFixed(3)})`
        if (vis > .5 && foco > melhorFoco) { melhorFoco = foco; melhor = i }
        el.style.visibility = vis < .01 ? 'hidden' : 'visible'
        el.style.zIndex = fora ? '1' : '2'
        el.style.pointerEvents = vis > .6 && !fora ? 'auto' : 'none'
        el.tabIndex = vis > .6 && !fora ? 0 : -1
      })
      ITENS.forEach((_, i) => { const el = cartoes.current[i]; if (el) el.dataset.ativo = String(i === melhor) })
      const marcaAtiva = melhor >= 0 ? melhor % TRES.length : 0
      if (marcaAtiva !== ativaRef.current) { ativaRef.current = marcaAtiva; setAtiva(marcaAtiva) }
      gira.current?.setAttribute('transform', `rotate(${r2r(ang)})`)
      giraInv.current?.setAttribute('transform', `rotate(${r2r(ang * .5)})`)
    }

    const passo = () => {
      const g = giro.current
      if (g) {
        // acelera (ease-in) e dá duas voltas em 0,9 s; a meio o obturador fecha
        // a partir do ponto do clique e abre já na página da marca
        const p = Math.min(1, (performance.now() - g.inicio) / 900)
        atual.current = g.de + 720 * p * p * p
        desenhar(atual.current)
        if (p >= .45 && !g.foi) {
          g.foi = true
          window.dispatchEvent(new CustomEvent('obturador', { detail: { href: g.href, x: g.x, y: g.y } }))
        }
        raf = requestAnimationFrame(passo)
        return
      }
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
      alvo.current = limitar(alvo.current + delta * (e.deltaMode === 1 ? 2 : .06))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') alvo.current = limitar(alvo.current + PASSO)
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') alvo.current = limitar(alvo.current - PASSO)
      else if (['1', '2', '3'].includes(e.key)) {
        // roda até essa marca ficar no meio
        const idx = Number(e.key) - 1
        alvo.current = limitar(idx * PASSO)
        setTimeout(() => cartoes.current[idx]?.focus({ preventScroll: true }), 500)
      }
    }
    const onTouchStart = (e: TouchEvent) => { toque.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (toque.current === null) return
      const y = e.touches[0].clientY
      alvo.current = limitar(alvo.current + (toque.current - y) * .2)
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
  }, [router])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono:wght@400;700&display=swap');

        .op4 { position: fixed; inset: 0; background: #050505; color: #f3ede2; overflow: hidden; touch-action: none; overscroll-behavior: none; }
        .op4 * { box-sizing: border-box; }
        .op4-mono { font-family: 'Space Mono', monospace; text-transform: uppercase; }
        .op4-serif { font-family: 'Cormorant Garamond', serif; }

        .op4-centro { position: absolute; left: 100%; top: 50%; width: 0; height: 0; }

        /* Brilhos dourados desfocados */
        @keyframes op4Respira { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .8 } 50% { transform: translate(-50%,-50%) scale(1.12); opacity: 1 } }
        .op4-brilho { position: absolute; border-radius: 50%; filter: blur(80px); transform: translate(-50%,-50%); animation: op4Respira 10s ease-in-out infinite; pointer-events: none; }

        .op4-mostrador { position: absolute; left: 0; top: 0; width: 900px; height: 900px; transform: translate(-50%,-50%); pointer-events: none; }
        .op4-letra { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 46px; fill: #f3ede2; }

        /* Cartões (posição, tamanho e brilho vêm do scroll) */
        .op4-cartao { position: absolute; left: 0; top: 0; will-change: transform, opacity; text-decoration: none; color: inherit; outline: none; }
        .op4-foto { position: relative; overflow: hidden; border-radius: 3px; box-shadow: 0 20px 60px -20px rgba(0,0,0,.8); }
        .op4-leg { margin-top: 8px; font-size: .5rem; letter-spacing: .28em; color: rgba(243,237,226,.4); }

        .op4-marca { display: block; width: 300px; border-radius: 4px; overflow: hidden; background: #0d0d0d; border: 1px solid rgba(216,190,147,.3);
          transition: border-color .3s ease, box-shadow .3s ease; }
        .op4-marca:hover, .op4-marca:focus-visible, .op4-marca[data-ativo="true"] { border-color: rgba(216,190,147,.8); box-shadow: 0 0 70px -18px rgba(216,190,147,.6); }
        .op4-marca-foto img { filter: grayscale(.6); }
        .op4-marca[data-ativo="true"] .op4-marca-foto img { filter: none; transform: scale(1.05); }
        .op4-marca[data-ativo="true"] .op4-entrar { background: rgba(216,190,147,.15); }
        .op4-vivo { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: .5rem; letter-spacing: .2em; color: #f3ede2; }
        .op4-vivo i { width: 6px; height: 6px; border-radius: 50%; background: #d8be93; box-shadow: 0 0 8px #d8be93; flex-shrink: 0; }
        .op4-janela { position: absolute; top: 0; transform: translate(-50%,-50%); pointer-events: none; }
        .op4-janela > div { position: absolute; inset: 0; opacity: 0; transform: scale(.9); filter: brightness(0) invert(1); transition: opacity .6s ease, transform .8s cubic-bezier(.19,1,.22,1); }
        .op4-janela > div.on { opacity: .9; transform: none; }
        .op4-marca-foto { position: relative; height: 190px; overflow: hidden; }
        .op4-marca-foto img { transition: transform 1.2s cubic-bezier(.19,1,.22,1), filter .6s ease; }
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
          <div className="op4-brilho" style={{ left: '-20vw', top: '-38vh', width: 560, height: 360, background: 'radial-gradient(closest-side, rgba(210,150,50,.7), transparent)' }} />
          <div className="op4-brilho" style={{ left: '-55vw', top: '42vh', width: 720, height: 420, background: 'radial-gradient(closest-side, rgba(220,170,70,.6), transparent)', animationDelay: '-4s' }} />
          <div className="op4-brilho" style={{ left: '-85vw', top: '-5vh', width: 520, height: 520, background: 'radial-gradient(closest-side, rgba(150,70,25,.45), transparent)', animationDelay: '-2s' }} />

          <Mostrador gira={gira} giraInv={giraInv} roda={roda} className="op4-mostrador" semLetras />

          {/* Logo da marca que está no meio, dentro da roda (entre o traço contínuo e o tracejado) */}
          <div ref={janela} className="op4-janela" aria-hidden="true">
            {TRES.map((m, k) => m.tipo === 'marca' && m.logo && (
              <div key={m.href} className={k === ativa ? 'on' : ''}>
                <div style={{ position: 'absolute', inset: 0, transform: `scale(${m.logoEscala})` }}>
                  <Image src={m.logo} alt="" fill sizes="200px" draggable={false} style={{ objectFit: 'contain' }} />
                </div>
              </div>
            ))}
          </div>

          {ITENS.map((it, i) => it.tipo === 'marca' ? (
            <Link key={`${it.href}-${i}`} href={it.href} ref={el => { cartoes.current[i] = el }}
              target={it.externo ? '_blank' : undefined} rel={it.externo ? 'noopener noreferrer' : undefined}
              onClick={e => {
                // Ctrl/Cmd/clique do meio abrem noutro separador como sempre
                if (it.externo || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
                e.preventDefault()
                if (giro.current) return
                router.prefetch(it.href)
                giro.current = { inicio: performance.now(), de: atual.current, href: it.href, foi: false, x: e.clientX, y: e.clientY }
              }}
              className="op4-cartao op4-marca" draggable={false} style={{ opacity: 0 }}
              aria-label={`Entrar em ${it.nome}, ${it.area}`}>
              <div className="op4-marca-foto">
                <Image src={it.foto} alt="" fill priority sizes="300px" draggable={false} style={{ objectFit: 'cover', objectPosition: it.posicao }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d, rgba(13,13,13,.15) 60%)' }} />
                {it.logo && !it.externo && <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', width: '56%', aspectRatio: '16/10', filter: 'brightness(0) invert(1)', opacity: .92 }}>
                  <div style={{ position: 'absolute', inset: 0, transform: `scale(${it.logoEscala})` }}>
                    <Image src={it.logo} alt="" fill sizes="200px" draggable={false} style={{ objectFit: 'contain' }} />
                  </div>
                </div>}
              </div>
              <div style={{ padding: '4px 20px 20px' }}>
                <p className="op4-mono" style={{ fontSize: '.5rem', letterSpacing: '.3em', color: OURO }}>{it.nome}</p>
                <h2 className="op4-serif" style={{ fontWeight: 300, fontSize: '2.2rem', lineHeight: 1, marginTop: 8 }}>
                  <span style={{ fontStyle: 'italic' }}>{it.area.charAt(0)}</span>{it.area.slice(1)}
                </h2>
                <p className="op4-serif" style={{ fontStyle: 'italic', fontSize: '1rem', lineHeight: 1.4, color: 'rgba(243,237,226,.6)', marginTop: 8 }}>
                  {it.frase}
                </p>
                {(() => {
                  const vivo = it.href === '/photo' && resumo?.casamento
                    ? `Próximo: ${resumo.casamento.nome} · ${resumo.casamento.dias === 0 ? 'hoje' : resumo.casamento.dias === 1 ? 'amanhã' : `faltam ${resumo.casamento.dias} dias`}`
                    : it.href === '/media' && resumo
                      ? resumo.leadsMarcas === 0 ? 'Leads em dia' : `${resumo.leadsMarcas} ${resumo.leadsMarcas === 1 ? 'lead por contactar' : 'leads por contactar'}`
                      : null
                  return vivo && <p className="op4-vivo op4-mono"><i />{vivo}</p>
                })()}
                <span className="op4-entrar op4-mono" style={{ marginTop: 14 }}>Entrar <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ) : (
            <div key={`${it.src}-${i}`} ref={el => { cartoes.current[i] = el }} className="op4-cartao" style={{ opacity: 0 }} aria-hidden="true">
              <div className="op4-foto" style={{ width: it.w, height: it.h }}>
                <Image src={it.src} alt="" fill sizes="240px" loading="eager" draggable={false} style={{ objectFit: 'cover' }} />
              </div>
              <p className="op4-leg op4-mono">{it.leg}</p>
            </div>
          ))}
        </div>

        <header className="op4-topo op4-mono">
          <span style={{ fontSize: '.55rem', letterSpacing: '.32em', color: OURO }}>RL · Universo de Marcas</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <nav className="op4-links" style={{ display: 'flex', gap: 22 }}>
              {MARCAS.map(m => <Link key={m.href} href={m.href} target={m.externo ? '_blank' : undefined} rel={m.externo ? 'noopener noreferrer' : undefined}>{m.area}</Link>)}
            </nav>
            <LogoutButton />
          </div>
        </header>

        <div className="op4-base op4-mono">
          <span className="op4-dica">Faz scroll para rodar · {MARCAS.map((_, k) => k + 1).join(' · ')} marcas</span>
          {/* No telemóvel: atalhos para as três marcas */}
          <nav className="op4-pilulas">
            {MARCAS.map(m => <Link key={m.href} href={m.href} target={m.externo ? '_blank' : undefined} rel={m.externo ? 'noopener noreferrer' : undefined}>{m.area}</Link>)}
          </nav>
        </div>
      </div>
    </>
  )
}
