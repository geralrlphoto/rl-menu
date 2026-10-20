'use client'

// Ficha do evento: as secções numa roda presa ao lado esquerdo do ecrã.
// A roda (o mesmo mostrador da página de marcas e do /photo) tem o centro na
// borda esquerda e só se vê a metade direita. No anel de fora ficam as
// secções; a do meio é a que está aberta. Clicar numa secção ou fazer scroll
// por cima da roda faz rodar. Abaixo de 1280px a roda dá lugar a uma fila
// de botões no topo.

import { useEffect, useRef, useState } from 'react'
import Mostrador from '@/app/_marcas/Mostrador'

export type ItemRoda = { id: string; label: string; aviso?: boolean }

const PASSO = 21          // graus entre secções
const LARG = 190          // largura de cada cartão

export default function RodaFicha({ itens, ativo, onEscolher, topo }: {
  itens: ItemRoda[]
  ativo: string
  onEscolher: (id: string) => void
  /** Conteúdo por cima da roda (ex.: Voltar) */
  topo?: React.ReactNode
}) {
  const roda = useRef<SVGSVGElement>(null)
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const cartoes = useRef<(HTMLButtonElement | null)[]>([])
  const idx = Math.max(0, itens.findIndex(i => i.id === ativo))
  const alvo = useRef(idx * PASSO)
  const [h, setH] = useState(800)

  useEffect(() => { alvo.current = idx * PASSO }, [idx])

  useEffect(() => {
    let raf = 0
    let atual = alvo.current
    let altura = innerHeight
    setH(altura)
    const desenhar = () => {
      const r = Math.max(170, Math.min(altura * .34, 270))      // raio do mostrador em px
      const rC = r + 34                                         // anel das secções
      if (roda.current) {
        const lado = `${(r * 2 * 340) / 330}px`
        roda.current.style.width = lado
        roda.current.style.height = lado
      }
      itens.forEach((_, i) => {
        const el = cartoes.current[i]
        if (!el) return
        const graus = i * PASSO - atual
        const t = (graus * Math.PI) / 180
        const x = Math.cos(t) * rC
        const y = Math.sin(t) * rC
        const longe = Math.abs(graus) / 84
        const vis = Math.max(0, Math.min(1, (1 - longe) / .35))
        el.style.transform = `translate(${x.toFixed(1)}px, ${(y - 26).toFixed(1)}px) rotate(${(graus * .35).toFixed(2)}deg)`
        el.style.opacity = vis.toFixed(3)
        el.style.visibility = vis < .02 ? 'hidden' : 'visible'
        el.style.pointerEvents = vis > .4 ? 'auto' : 'none'
        el.dataset.ativo = String(Math.abs(graus) < PASSO / 2)
      })
      gira.current?.setAttribute('transform', `rotate(${(-atual).toFixed(2)})`)
      giraInv.current?.setAttribute('transform', `rotate(${(atual * .5).toFixed(2)})`)
    }
    const passo = () => {
      const d = alvo.current - atual
      if (Math.abs(d) > .02) { atual += d * .14; desenhar() }
      raf = requestAnimationFrame(passo)
    }
    desenhar()
    raf = requestAnimationFrame(passo)
    const onResize = () => { altura = innerHeight; setH(altura); desenhar() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [itens])

  // Scroll por cima da roda: uma secção de cada vez
  const acumulado = useRef(0)
  const ultimo = useRef(0)
  function onWheel(ev: React.WheelEvent) {
    acumulado.current += ev.deltaY
    const agora = Date.now()
    if (Math.abs(acumulado.current) < 50 || agora - ultimo.current < 320) return
    const novo = Math.min(itens.length - 1, Math.max(0, idx + (acumulado.current > 0 ? 1 : -1)))
    acumulado.current = 0
    ultimo.current = agora
    if (novo !== idx) onEscolher(itens[novo].id)
  }

  return (
    <>
      {/* Ecrãs largos: roda à esquerda */}
      <aside className="ficha-roda print:hidden hidden xl:block fixed left-0 top-0 h-screen z-20 overflow-hidden"
        style={{ width: 'var(--roda-larg)' }} onWheel={onWheel} aria-label="Secções da ficha">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&display=swap');
          .rf-cartao { transition: border-color .4s ease, box-shadow .4s ease, background-color .4s ease, color .3s ease; }
          .rf-num { color: transparent; -webkit-text-stroke: 1px rgba(216,190,147,.45); transition: color .4s ease, -webkit-text-stroke-color .4s ease; }
          .rf-cartao[data-ativo="true"] { border-color: rgba(216,190,147,.6); background-color: rgba(22,19,14,.92);
            box-shadow: 0 0 46px -16px rgba(216,190,147,.7), inset 0 1px 0 rgba(255,255,255,.06); color: #fff; }
          .rf-cartao[data-ativo="true"] .rf-num, .rf-cartao:hover .rf-num { color: #d8be93; -webkit-text-stroke-color: #d8be93; }
          .rf-cartao:hover { border-color: rgba(216,190,147,.4); color: #fff; }
        `}</style>
        <div className="pointer-events-none absolute left-[-160px] top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(closest-side, rgba(216,190,147,.18), transparent)' }} />
        {topo && <div className="absolute left-6 top-6 z-10">{topo}</div>}
        <div className="absolute left-0 w-0 h-0" style={{ top: h / 2 }}>
          <Mostrador gira={gira} giraInv={giraInv} roda={roda}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 600, height: 600 }} />
          {itens.map((it, i) => (
            <button key={it.id} ref={el => { cartoes.current[i] = el }} type="button" onClick={() => onEscolher(it.id)}
              className="rf-cartao absolute left-0 top-0 flex items-center gap-3 rounded-[16px] border border-white/[0.1] bg-[#0e0e0e]/80 backdrop-blur-md px-4 text-left text-white/55"
              style={{ width: LARG, height: 52, transformOrigin: '0 50%', opacity: 0 }}>
              <span className="rf-num font-bold text-[24px] leading-none tracking-tight">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-[13px] font-semibold leading-tight flex-1 min-w-0">{it.label}</span>
              {it.aviso && <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" style={{ boxShadow: '0 0 8px #f87171' }} />}
            </button>
          ))}
        </div>
        <p className="absolute left-6 bottom-6 text-[10px] tracking-[0.25em] uppercase text-white/25">Roda para mudar de secção</p>
      </aside>

      {/* Ecrãs mais pequenos: fila de botões */}
      <nav className="print:hidden xl:hidden sticky top-0 z-30 -mx-4 px-4 py-2 mb-5 overflow-x-auto"
        style={{ background: 'rgba(11,11,11,.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(216,190,147,.14)' }}>
        <div className="flex gap-1.5 min-w-max">
          {itens.map((it, i) => (
            <button key={it.id} type="button" onClick={() => onEscolher(it.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-semibold border transition-all whitespace-nowrap ${it.id === ativo ? 'text-[#0b0b0b] border-transparent' : 'text-white/50 border-white/[0.1]'}`}
              style={it.id === ativo ? { background: '#d8be93' } : undefined}>
              <span className="opacity-60">{String(i + 1).padStart(2, '0')}</span>{it.label}
              {it.aviso && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
