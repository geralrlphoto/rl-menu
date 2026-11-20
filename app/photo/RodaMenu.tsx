'use client'

// Menu do /photo em roda: a roda (monograma RL em anéis de mostrador) tem o
// centro na borda direita e só se vê a metade esquerda. No anel de fora
// ficam os cartões do Menu; no anel de dentro os botões rápidos. Enquanto se
// faz scroll pela secção, a secção fica presa ao ecrã e a roda roda com tudo
// junto; os cartões sobem pela esquerda (entram por baixo, saem por cima).
// Mesma ideia da página de marcas (app/_marcas/Opcao4.tsx).

import Link from 'next/link'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import Mostrador from '@/app/_marcas/Mostrador'


export type ItemMenu = { id: string; href: string; img: string; titulo: string }
export type BotaoRapido = { label: string; href: string; bg: string; logo: ReactNode; grande?: boolean }

const REP_MENU = 3       // cada anel repete os itens para nunca ficar vazio (3× = cartões a 20°, bem juntos)
// Cartões quase quadrados, cada um com um tamanho ligeiramente diferente
const TAMANHOS: [number, number][] = [[230, 250], [255, 225], [220, 245], [250, 230], [235, 255], [245, 220]]
const REP_RAPIDOS = 2
const r2 = (v: number) => Math.round(v * 100) / 100

export default function RodaMenu({ menu, rapidos }: { menu: ItemMenu[]; rapidos: BotaoRapido[] }) {
  const seccao = useRef<HTMLElement>(null)
  const roda = useRef<SVGSVGElement>(null)
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const fora = useRef<(HTMLElement | null)[]>([])
  const dentro = useRef<(HTMLElement | null)[]>([])

  const anelFora = useMemo(() => Array.from({ length: REP_MENU }).flatMap(() => menu), [menu])
  const anelDentro = useMemo(() => Array.from({ length: REP_RAPIDOS }).flatMap(() => rapidos), [rapidos])
  const passoFora = 360 / anelFora.length
  const passoDentro = 360 / anelDentro.length

  useEffect(() => {
    let raf = 0
    let alvo = 0, atual = 0
    let w = innerWidth, h = innerHeight
    // do primeiro ao último cartão do menu passa pelo meio do ecrã
    const voltaTotal = passoFora * Math.max(menu.length - 1, 1)

    const lerScroll = () => {
      const el = seccao.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const curso = el.offsetHeight - h
      const p = curso > 0 ? Math.min(1, Math.max(0, -r.top / curso)) : 0
      alvo = p * voltaTotal
    }

    const desenhar = (ang: number) => {
      const zoom = Math.min(1, Math.max(.55, Math.min(w / 1500, h / 950)))
      const movel = w < 768
      const rF = movel ? h * .55 : Math.max(w * .5, Math.min(w * .55, h * .75))
      const cx = movel ? rF - w * .5 : 0
      const raio = Math.max(160, rF - 175 * zoom)      // anel de fora da roda (igual à página de marcas)
      // botões rápidos dentro da roda, entre o anel de fora e o mostrador
      const rD = raio * .74
      if (roda.current) {
        const lado = `${(raio * 2 * 340) / 330}px`
        roda.current.style.width = lado
        roda.current.style.height = lado
        roda.current.style.left = `${cx}px`
      }
      const colocar = (el: HTMLElement | null, t: number, r: number, interativo: boolean, escala: number, destaque = false) => {
        if (!el) return
        const x = Math.cos(t) * r + cx
        const y = Math.sin(t) * r
        const borda = Math.abs(y) / (h / 2 + 90 * zoom)
        const vis = x - cx > 40 ? 0 : Math.max(0, Math.min(1, (1 - borda) / .3))
        // cartões: o do meio fica maior e aceso; os outros encolhem e inclinam com a roda
        const foco = destaque ? Math.max(0, 1 - Math.abs(y) / (h * .42)) : 1
        const esc = destaque ? escala * (.84 + .16 * foco) : escala
        const inclina = destaque ? y * -.018 : 0
        el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${inclina.toFixed(2)}deg) scale(${(zoom * esc).toFixed(3)})`
        if (destaque) el.dataset.ativo = String(foco > .8)
        el.style.opacity = vis.toFixed(3)
        el.style.visibility = vis < .01 ? 'hidden' : 'visible'
        el.style.pointerEvents = interativo && vis > .5 ? 'auto' : 'none'
        el.tabIndex = interativo && vis > .5 ? 0 : -1
      }
      // 180° = à esquerda do centro; o ângulo a crescer faz subir
      anelFora.forEach((_, i) => colocar(fora.current[i], ((180 - i * passoFora + ang) * Math.PI) / 180, rF, true, 1, true))
      anelDentro.forEach((_, i) => colocar(dentro.current[i], ((180 - i * passoDentro + ang) * Math.PI) / 180, rD, true, movel ? .85 : 1))
      gira.current?.setAttribute('transform', `rotate(${r2(ang)})`)
      giraInv.current?.setAttribute('transform', `rotate(${r2(ang * .5)})`)
    }

    const passo = () => {
      const d = alvo - atual
      if (Math.abs(d) > .01) { atual += d * .12; desenhar(atual) }
      raf = requestAnimationFrame(passo)
    }
    lerScroll()
    atual = alvo
    desenhar(atual)
    raf = requestAnimationFrame(passo)

    const onResize = () => { w = innerWidth; h = innerHeight; lerScroll(); desenhar(atual) }
    window.addEventListener('scroll', lerScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', lerScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [anelFora, anelDentro, passoFora, passoDentro, menu.length])

  return (
    // a secção é alta para dar curso ao scroll; o palco fica preso ao ecrã
    <section ref={seccao} className="relative" style={{ height: '260vh' }} aria-label="Menu">
      <div className="sticky top-0 h-screen overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&display=swap');
          .rm-cartao { transition: border-color .4s ease, box-shadow .4s ease, background-color .4s ease; }
          .rm-foto { filter: grayscale(.85) brightness(.55); transform: scale(1.02); transition: filter .7s ease, transform 1.2s cubic-bezier(.19,1,.22,1); }
          .rm-num { color: transparent; -webkit-text-stroke: 1px rgba(216,190,147,.45); transition: color .4s ease, -webkit-text-stroke-color .4s ease; }
          .rm-abrir { color: rgba(255,255,255,.35); transition: color .3s ease, letter-spacing .4s ease; }
          .rm-seta { color: #d8be93; border: 1px solid rgba(216,190,147,.35); background: rgba(0,0,0,.35); transition: all .35s cubic-bezier(.19,1,.22,1); }
          .rm-linha { width: 0; background: linear-gradient(90deg, #d8be93, transparent); transition: width .6s cubic-bezier(.19,1,.22,1); }
          .rm-brilho { background: linear-gradient(110deg, transparent 30%, rgba(216,190,147,.14) 50%, transparent 70%); transform: translateX(-120%); transition: transform 1s ease; pointer-events: none; }
          .rm-cartao[data-ativo="true"], .rm-cartao:hover, .rm-cartao:focus-visible {
            border-color: rgba(216,190,147,.55); background-color: rgba(20,18,14,.8);
            box-shadow: 0 0 50px -18px rgba(216,190,147,.65), inset 0 1px 0 rgba(255,255,255,.06); }
          .rm-cartao[data-ativo="true"] .rm-foto, .rm-cartao:hover .rm-foto { filter: grayscale(0) brightness(.75); transform: scale(1.08); }
          .rm-cartao[data-ativo="true"] .rm-num, .rm-cartao:hover .rm-num { color: #d8be93; -webkit-text-stroke-color: #d8be93; }
          .rm-cartao[data-ativo="true"] .rm-abrir, .rm-cartao:hover .rm-abrir { color: #d8be93; letter-spacing: .32em; }
          .rm-cartao[data-ativo="true"] .rm-linha, .rm-cartao:hover .rm-linha { width: 100%; }
          .rm-cartao:hover .rm-seta, .rm-cartao:focus-visible .rm-seta { background: #d8be93; color: #0b0b0b; transform: translateX(3px) rotate(-45deg); }
          .rm-cartao:hover .rm-brilho { transform: translateX(120%); }
          @media (prefers-reduced-motion: reduce) { .rm-foto, .rm-brilho, .rm-linha { transition: none; } }
        `}</style>
        {/* Brilhos dourados desfocados */}
        <div className="pointer-events-none absolute right-[-10vw] top-[-20vh] w-[620px] h-[420px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.35), transparent)' }} />
        <div className="pointer-events-none absolute left-[10vw] bottom-[-18vh] w-[720px] h-[420px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.25), transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-10 pt-14 z-10 pointer-events-none">
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Navegação</p>
          <h2 className="font-cond font-semibold text-white text-3xl sm:text-[34px] leading-tight mt-1">Menu</h2>
          <p className="font-cond text-[12px] text-white/35 mt-1">Faz scroll para rodar</p>
        </div>

        <div className="absolute left-full top-1/2 w-0 h-0">
          {/* Roda (a mesma da página de marcas) */}
          <Mostrador gira={gira} giraInv={giraInv} roda={roda}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 900, height: 900 }} />

          {/* Anel de dentro: botões rápidos */}
          {anelDentro.map((b, i) => {
            const externo = !b.href.startsWith('/')
            const tam = b.grande ? 78 : 62
            return (
              <a key={`${b.label}-${i}`} ref={el => { dentro.current[i] = el }} href={b.href}
                target={externo ? '_blank' : undefined} rel="noopener noreferrer" title={b.label} aria-label={b.label}
                className="absolute left-0 top-0 rounded-full flex items-center justify-center border border-white/[0.12] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)] transition-shadow duration-300 hover:shadow-[0_0_30px_-4px_rgba(201,168,76,0.7)]"
                style={{ background: b.bg, width: tam, height: tam, opacity: 0 }}>
                {b.logo}
              </a>
            )
          })}

          {/* Anel de fora: cartões do Menu, quase quadrados (foto a todo o cartão, número grande;
              o do meio fica aceso a dourado) */}
          {anelFora.map((item, i) => {
            const n = (i % menu.length) + 1
            const [lw, lh] = TAMANHOS[(n - 1) % TAMANHOS.length]
            return (
              <Link key={`${item.id}-${i}`} ref={el => { fora.current[i] = el }} href={item.href}
                className="rm-cartao group absolute left-0 top-0 overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0e0e0e]/70 backdrop-blur-md"
                style={{ width: lw, height: lh, opacity: 0 }}>
                <div className="rm-foto absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.img})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/55 to-[#0b0b0b]/10" />
                <div className="rm-brilho absolute inset-0" />
                <span className="rm-num absolute top-3 left-4 font-cond font-bold text-[46px] leading-none tracking-tight">
                  {String(n).padStart(2, '0')}
                </span>
                <span className="rm-seta absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[16px]">→</span>
                <div className="absolute left-4 right-4 bottom-4">
                  <p className="font-cond font-semibold text-[21px] leading-tight text-white">{item.titulo}</p>
                  <p className="rm-abrir font-cond text-[10.5px] font-medium tracking-[0.22em] uppercase mt-1">Abrir</p>
                </div>
                <span className="rm-linha absolute left-0 bottom-0 h-[2px]" />
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
