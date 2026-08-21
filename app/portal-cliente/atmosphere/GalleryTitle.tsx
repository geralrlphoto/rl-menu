'use client'

/**
 * Título de entrega da galeria — secção escura no topo da sub-página
 * FOTOGRAFIAS, acima do bloco "Enviar Fotos".
 *
 * As fontes (Jost / Hanken Grotesk / Space Mono) já vêm carregadas pelo
 * PortalShell + atmosphere.css, por isso aqui não há @import.
 */

import { useEffect, useRef } from 'react'

const CSS = `
.rlgt{ --g:#d8be93; --tx:rgba(243,237,226,.92);
  box-sizing:border-box; width:100%; text-align:center;
  padding:clamp(40px,6vh,80px) clamp(20px,5vw,60px) clamp(20px,3vh,34px);
  font-family:'Hanken Grotesk',system-ui,sans-serif; color:var(--tx); }
.rlgt *{ box-sizing:border-box; }
.rlgt__kick{ display:inline-flex; align-items:center; gap:.9em; justify-content:center;
  font-family:'Space Mono',monospace; font-size:clamp(10px,1.1vw,12px); letter-spacing:.32em; text-transform:uppercase; color:var(--g); }
.rlgt__kick::before{ content:""; width:44px; height:1px; background:var(--g); opacity:.75; }
.rlgt__title{ margin:20px auto 0; font-family:'Jost',sans-serif; font-weight:200;
  font-size:clamp(30px,5.4vw,76px); line-height:1.06; letter-spacing:-.02em; }
.rlgt__title em{ font-style:italic; color:var(--g); }

.rlgt.js .rlgt__r{ opacity:0; transform:translateY(24px); }
.rlgt__r{ transition:opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1); }
.rlgt.js.is-in .rlgt__r{ opacity:1; transform:none; }
.rlgt.js.is-in .rlgt__r:nth-child(2){ transition-delay:.1s; }
@media(prefers-reduced-motion:reduce){ .rlgt.js .rlgt__r{ opacity:1; transform:none; } }
`

export function GalleryTitle() {
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

  // O <style> fica fora do .rlgt para o :nth-child(2) do stagger apanhar
  // o título e não o próprio style.
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rlgt" ref={ref}>
        <div className="rlgt__kick rlgt__r">Alguns momentos</div>
        {/* div + role=heading em vez de <h2>: o atmosphere.css força
            font-size/weight/margin em `.subarticle .body h2` com !important
            e esmagava o desenho deste bloco. */}
        <div className="rlgt__title rlgt__r" role="heading" aria-level={2}>
          As vossas <em>fotografias.</em>
        </div>
      </div>
    </>
  )
}
