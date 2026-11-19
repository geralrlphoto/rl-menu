'use client'

import { useEffect } from 'react'

/* ============================================================
   Revelações ao scroll da página de convidados.
   Junta a classe "is-in" a cada [data-r] quando entra no ecrã.
   Sem IntersectionObserver ou com movimento reduzido, mostra tudo.
   ============================================================ */

export default function Revelar() {
  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.add('cv-js')
    const alvos = Array.from(document.querySelectorAll<HTMLElement>('[data-r]'))
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduz || !('IntersectionObserver' in window)) {
      alvos.forEach(a => a.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    alvos.forEach(a => io.observe(a))
    return () => { io.disconnect(); raiz.classList.remove('cv-js') }
  }, [])
  return null
}
