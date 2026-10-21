'use client'

// Propostas em roda, como o Menu do /photo (app/photo/RodaMenu.tsx): a roda
// (o mesmo mostrador RL) tem o centro na borda direita e só se vê a metade
// esquerda; os cartões das propostas ficam no anel de fora. Aqui não há scroll
// de página (a proposta é em cenas), por isso a roda gira com a roda do rato,
// com as setas ↑ ↓ ou ao tocar num cartão. A proposta que fica ao meio é a escolhida.

import { useEffect, useMemo, useRef } from 'react'
import Mostrador from '@/app/_marcas/Mostrador'

export type ItemProposta = { idx: number; nome: string; img: string; recomendada: boolean }

const REP = 4   // cada proposta repete-se no anel para a roda nunca ficar vazia (cartões a 30°)
const r2 = (v: number) => Math.round(v * 100) / 100

export default function RodaPropostas({ itens, sel, onSel }: { itens: ItemProposta[]; sel: number; onSel: (idx: number) => void }) {
  const palco = useRef<HTMLDivElement>(null)
  const roda = useRef<SVGSVGElement>(null)
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const cartoes = useRef<(HTMLButtonElement | null)[]>([])
  const alvo = useRef(0)
  const eixo = useRef<HTMLDivElement>(null)
  const tracos = useRef<SVGSVGElement>(null)
  const tracosG = useRef<SVGGElement>(null)

  const anel = useMemo(() => Array.from({ length: REP }).flatMap(() => itens), [itens])
  const n = itens.length
  const passo = 360 / Math.max(anel.length, 1)
  const pos = Math.max(0, itens.findIndex(it => it.idx === sel))

  // Leva ao meio a cópia da proposta escolhida que estiver mais perto (roda o mínimo)
  useEffect(() => {
    if (!n) return
    const atualK = Math.round(alvo.current / passo)
    let melhor = atualK, dist = Infinity
    for (let k = atualK - n; k <= atualK + n; k++) {
      if ((((k % n) + n) % n) === pos && Math.abs(k - atualK) < dist) { melhor = k; dist = Math.abs(k - atualK) }
    }
    alvo.current = melhor * passo
  }, [pos, n, passo])

  useEffect(() => {
    let raf = 0
    let atual = alvo.current
    const desenhar = (ang: number) => {
      const el = palco.current
      if (!el) return
      const w = el.clientWidth, h = el.clientHeight
      const zoom = Math.min(1, Math.max(.6, Math.min(w / 1500, h / 820)))
      // Roda grande (quase a altura toda), com o centro para lá da borda direita:
      // o cartão do meio fica a ~80% da largura e os vizinhos abrem-se em arco
      const rF = Math.max(300, h * .62)
      const fora = Math.max(0, rF - w * .2)
      if (eixo.current) eixo.current.style.left = `calc(100% + ${fora.toFixed(0)}px)`
      const raio = Math.max(160, rF - 140 * zoom)
      if (roda.current) {
        const lado = `${(raio * 2 * 340) / 330}px`
        roda.current.style.width = lado
        roda.current.style.height = lado
      }
      // Anel tracejado de dentro, mais perto da borda para se ver no arco que fica no ecrã
      if (tracos.current) {
        const lado = `${((raio - 46 * zoom) * 2 * 104) / 100}px`
        tracos.current.style.width = lado
        tracos.current.style.height = lado
      }
      tracosG.current?.setAttribute('transform', `rotate(${r2(ang * .8)})`)
      anel.forEach((_, i) => {
        const c = cartoes.current[i]
        if (!c) return
        // 180° = à esquerda do centro; a seguinte fica por baixo
        const t = ((180 - i * passo + ang) * Math.PI) / 180
        const x = Math.cos(t) * rF
        const y = Math.sin(t) * rF
        const borda = Math.abs(y) / (h / 2 + 60)
        // só se veem os cartões do lado esquerdo da roda (a escolhida e as vizinhas)
        const vis = x > -rF * .62 ? 0 : Math.max(0, Math.min(1, (1 - borda) / .3, (-x - rF * .62) / (rF * .12)))
        const foco = Math.max(0, 1 - Math.abs(y) / (h * .4))
        const esc = zoom * (.8 + .2 * foco)
        c.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(y * -.02).toFixed(2)}deg) scale(${esc.toFixed(3)})`
        c.dataset.ativo = String(foco > .85 && vis > .5)
        c.style.opacity = vis.toFixed(3)
        c.style.visibility = vis < .01 ? 'hidden' : 'visible'
        c.style.pointerEvents = vis > .5 ? 'auto' : 'none'
        c.tabIndex = vis > .5 ? 0 : -1
      })
      gira.current?.setAttribute('transform', `rotate(${r2(ang)})`)
      giraInv.current?.setAttribute('transform', `rotate(${r2(ang * .5)})`)
    }
    const frame = () => {
      const d = alvo.current - atual
      if (Math.abs(d) > .01) atual += d * .1
      desenhar(atual)
      raf = requestAnimationFrame(frame)
    }
    desenhar(atual)
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [anel, passo])

  // Setas ↑ ↓ rodam a roda (← → continuam a mudar de cena)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      onSel(itens[(pos + (e.key === 'ArrowDown' ? 1 : -1) + n) % n].idx)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [pos, n, itens, onSel])

  // Roda do rato: um "clique" da roda = uma proposta
  const acumulado = useRef(0)
  const ultimo = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    acumulado.current += e.deltaY
    const agora = Date.now()
    if (Math.abs(acumulado.current) < 40 || agora - ultimo.current < 380) return
    ultimo.current = agora
    onSel(itens[(pos + (acumulado.current > 0 ? 1 : -1) + n) % n].idx)
    acumulado.current = 0
  }

  return (
    <div ref={palco} onWheel={onWheel} className="rl-roda-palco absolute inset-0 overflow-hidden">
      <style>{`
        .rl-rcartao { transition: border-color .4s ease, box-shadow .4s ease, background-color .4s ease; }
        .rl-rcartao[data-ativo="true"], .rl-rcartao:hover, .rl-rcartao:focus-visible {
          border-color: rgba(216,190,147,.55); background-color: rgba(20,18,14,.85);
          box-shadow: 0 0 50px -18px rgba(216,190,147,.65), inset 0 1px 0 rgba(255,255,255,.06); }
        .rl-rcartao .rl-rnum { color: transparent; -webkit-text-stroke: 1px rgba(216,190,147,.45); transition: color .4s, -webkit-text-stroke-color .4s }
        .rl-rcartao[data-ativo="true"] .rl-rnum { color: #d8be93; -webkit-text-stroke-color: #d8be93 }
        .rl-rcartao .rl-rfoto { filter: grayscale(.85) brightness(.55); transform: scale(1.02); transition: filter .7s ease, transform 1.2s cubic-bezier(.19,1,.22,1) }
        .rl-rcartao[data-ativo="true"] .rl-rfoto, .rl-rcartao:hover .rl-rfoto { filter: grayscale(0) brightness(.8); transform: scale(1.08) }
        .rl-rcartao .rl-rver { color: rgba(255,255,255,.4); transition: color .3s, letter-spacing .4s }
        .rl-rcartao[data-ativo="true"] .rl-rver { color: #d8be93; letter-spacing: .3em }
        .rl-rcartao .rl-rlinha { width: 0; background: linear-gradient(90deg, #d8be93, transparent); transition: width .6s cubic-bezier(.19,1,.22,1) }
        .rl-rcartao[data-ativo="true"] .rl-rlinha { width: 100% }
      `}</style>
      <div className="pointer-events-none absolute right-[-12vw] top-[-20%] w-[620px] h-[420px] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(closest-side, rgba(201,168,76,.28), transparent)' }} />

      <div ref={eixo} className="absolute left-full top-1/2 w-0 h-0">
        <Mostrador gira={gira} giraInv={giraInv} roda={roda} semLetras
          className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 900, height: 900 }} />
        {/* Tracejado de dentro (como os traços do mostrador: um dourado, os outros brancos) */}
        <svg ref={tracos} viewBox="-104 -104 208 208" aria-hidden="true"
          className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 700, height: 700 }}>
          <g ref={tracosG}>
            {Array.from({ length: 180 }).map((_, i) => {
              const a = (i / 180) * Math.PI * 2
              const ra = 100, rb = i % 15 === 0 ? 94 : 97
              return <line key={i} x1={r2(Math.cos(a) * ra)} y1={r2(Math.sin(a) * ra)} x2={r2(Math.cos(a) * rb)} y2={r2(Math.sin(a) * rb)}
                stroke={i === 90 ? '#d8be93' : 'rgba(255,255,255,.24)'} strokeWidth={i === 90 ? .7 : .35} />
            })}
          </g>
        </svg>

        {anel.map((it, i) => (
          <button key={`${it.idx}-${i}`} ref={el => { cartoes.current[i] = el }} type="button"
            onClick={() => onSel(it.idx)} aria-label={`Ver a proposta ${it.nome}`}
            className="rl-rcartao absolute left-0 top-0 overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0e0e0e]/75 backdrop-blur-md text-left"
            style={{ width: 200, height: 220, opacity: 0 }}>
            {/* Foto a todo o cartão, como no Menu: apagada nas outras, a cores na do meio */}
            {it.img && <span className="rl-rfoto absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${it.img}')` }} />}
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/45 to-[#0b0b0b]/10" />
            <span className="rl-rnum absolute top-3 left-4 font-cond font-bold text-[46px] leading-none tracking-tight">
              {String((i % n) + 1).padStart(2, '0')}
            </span>
            {it.recomendada && (
              <span className="absolute top-4 right-4 font-cond text-[9px] font-semibold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: '#d8be93', color: '#0b0b0b' }}>Recomendada</span>
            )}
            <span className="absolute left-4 right-4 bottom-4 block">
              <span className="block text-[28px] leading-tight text-white" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200 }}>{it.nome}</span>
              <span className="rl-rver block font-cond text-[10.5px] font-medium tracking-[0.22em] uppercase mt-1">Ver proposta</span>
            </span>
            <span className="rl-rlinha absolute left-0 bottom-0 h-[2px]" />
          </button>
        ))}
      </div>
    </div>
  )
}
