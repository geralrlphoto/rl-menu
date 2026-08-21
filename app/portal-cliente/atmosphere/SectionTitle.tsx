'use client'

/**
 * Título editorial em secção escura — kicker + título grande + subtítulo,
 * com reveal ao entrar no viewport.
 *
 * Usado no topo da sub-página FOTOGRAFIAS e por cima de cada card de galeria.
 * As fontes (Jost / Hanken Grotesk / Space Mono) já vêm carregadas pelo
 * PortalShell + atmosphere.css, por isso aqui não há @import.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import './section-title.css'


export type SectionTitleProps = {
  /** Linha pequena em maiúsculas, com o traço dourado à esquerda. */
  kicker: string
  /** Título grande. Usar <em> para a parte a dourado. */
  title: ReactNode
  /** Parágrafo opcional por baixo do título. */
  subtitle?: ReactNode
}

export function SectionTitle({ kicker, title, subtitle }: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // A classe 'js' só entra depois de montar: sem JS o texto fica visível.
    el.classList.add('js')
    const show = () => el.classList.add('is-in')

    if (!('IntersectionObserver' in window)) { show(); return }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { show(); io.disconnect(); break }
      }
    }, { threshold: 0.2 })
    io.observe(el)
    // Rede de segurança: se o observer não disparar, mostra à mesma.
    const t = setTimeout(show, 1500)
    return () => { io.disconnect(); clearTimeout(t) }
  }, [])

  // Título e subtítulo são <div> e não <h2>/<p> de propósito: o
  // atmosphere.css força font-size/color/line-height/margin em
  // `.subarticle .body h2` e `.body p` com !important, e esmagava o
  // desenho deste bloco.
  return (
    <div className="rlgt" ref={ref}>
      <div className="rlgt__kick rlgt__r">{kicker}</div>
      <div className="rlgt__title rlgt__r" role="heading" aria-level={2}>{title}</div>
      {subtitle && <div className="rlgt__sub rlgt__r">{subtitle}</div>}
    </div>
  )
}
