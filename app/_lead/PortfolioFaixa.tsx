'use client'

// Portfólio dos portais da reunião (/r e /b) em faixa a deslizar.
// A secção fica presa ao ecrã (sticky) e o scroll da página faz a faixa de
// fotos deslizar da esquerda para a direita. A foto que passa ao centro fica
// acesa (a cores e um pouco maior); as outras ficam mais apagadas.
// As fotos vêm da galeria do Wfolio (/api/portfolio-wfolio): servidas pelo
// i.wfolio.com, sem gastar Supabase. Se o Wfolio falhar, usa as do editor.

import { useEffect, useRef, useState } from 'react'

type FotoWf = { src: string; srcSet: string }

export default function PortfolioFaixa({ label, title, titleColor, photos, isAdmin }: {
  label: string; title: string; titleColor?: string
  photos: string[]
  isAdmin: boolean   // no admin mostram-se os lugares vazios
}) {
  // null = a carregar; depois a lista do Wfolio (vazia se falhou)
  const [wf, setWf] = useState<{ fotos: FotoWf[]; galeria: string } | null>(null)
  useEffect(() => {
    fetch('/api/portfolio-wfolio').then(r => r.json())
      .then(d => setWf({ fotos: Array.isArray(d.fotos) ? d.fotos : [], galeria: d.galeria ?? '' }))
      .catch(() => setWf({ fotos: [], galeria: '' }))
  }, [])

  const doWfolio = !!wf && wf.fotos.length > 0
  const unicas: { url: string; srcSet?: string; i: number }[] = !wf
    ? []   // à espera do Wfolio: não carrega as do Supabase à toa
    : doWfolio
      ? wf.fotos.map((f, i) => ({ url: f.src, srcSet: f.srcSet, i }))
      : photos.map((url, i) => ({ url, i })).filter(f => f.url || isAdmin)
  // Com poucas fotos a faixa quase não andava: repete-as até ter pelo menos 8
  const fotos = unicas.length
    ? Array.from({ length: Math.max(unicas.length, 8) }, (_, k) => unicas[k % unicas.length])
    : []
  const n = fotos.length

  const sec = useRef<HTMLElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const faixa = useRef<HTMLDivElement>(null)
  const cartoes = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!n) return
    let raf = 0, alvo = 0, atual = 0

    // A altura da secção = ecrã + o que a faixa tem de andar
    const medir = () => {
      const s = sec.current, f = faixa.current, p = palco.current
      if (!s || !f || !p) return
      const sobra = Math.max(0, f.scrollWidth - p.clientWidth)
      s.style.height = `${innerHeight + sobra}px`
    }
    const ler = () => {
      const s = sec.current
      if (!s) return
      const r = s.getBoundingClientRect()
      const curso = r.height - innerHeight
      alvo = curso > 0 ? Math.max(0, Math.min(1, -r.top / curso)) : 0
    }
    const desenhar = (p: number) => {
      const f = faixa.current, pal = palco.current
      if (!f || !pal) return
      const W = pal.clientWidth
      const sobra = Math.max(0, f.scrollWidth - W)
      // começa no fim da faixa e anda para a direita: as fotos entram pela esquerda
      const x = -sobra * (1 - p)
      f.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
      const meio = W / 2
      fotos.forEach((_, k) => {
        const c = cartoes.current[k]
        if (!c) return
        const centro = c.offsetLeft + c.offsetWidth / 2 + x
        const foco = Math.max(0, 1 - Math.abs(centro - meio) / (W * .6))
        c.style.transform = `scale(${(.9 + .1 * foco).toFixed(3)})`
        c.style.filter = `grayscale(${(.7 * (1 - foco)).toFixed(3)}) brightness(${(.55 + .45 * foco).toFixed(3)})`
      })
    }
    const passo = () => {
      const d = alvo - atual
      if (Math.abs(d) > .0005) { atual += d * .14; desenhar(atual) }
      raf = requestAnimationFrame(passo)
    }
    const onResize = () => { medir(); ler(); desenhar(atual) }

    medir(); ler(); atual = alvo; desenhar(atual)
    raf = requestAnimationFrame(passo)
    addEventListener('scroll', ler, { passive: true })
    addEventListener('resize', onResize)
    // as fotos podem chegar depois e mudar a largura da faixa
    const ro = new ResizeObserver(onResize)
    if (faixa.current) ro.observe(faixa.current)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', ler)
      removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) return null
  const corTitulo = titleColor && titleColor !== '#ffffff' ? titleColor : undefined

  return (
    <section ref={sec} id="sec-portfolio" className="rlf" style={{ height: '200vh' }}>
      <style>{`
        .rlf{position:relative;}
        .rlf-palco{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;flex-direction:column;justify-content:center;}
        .rlf-cab{padding:0 var(--pad,24px);margin-bottom:clamp(24px,5vh,48px);}
        .rlf-faixa{display:flex;gap:clamp(14px,2vw,28px);padding:0 var(--pad,24px);width:max-content;will-change:transform;}
        .rlf-cartao{flex:none;width:clamp(240px,30vw,420px);aspect-ratio:4/5;border-radius:22px;overflow:hidden;position:relative;background:#141414;
          border:1px solid rgba(216,190,147,.2);border-left:2px solid rgba(216,190,147,.45);box-shadow:0 30px 70px -30px rgba(0,0,0,.85);
          transform-origin:center;transition:box-shadow .4s ease;}
        .rlf-cartao img{width:100%;height:100%;object-fit:cover;display:block;}
        .rlf-n{position:absolute;left:16px;bottom:14px;font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:.3em;color:#d8be93;text-shadow:0 1px 8px rgba(0,0,0,.6);}
        .rlf-vazio{position:absolute;inset:0;display:grid;place-items:center;font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:rgba(243,237,226,.4);
          background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);}
        @media (max-width:767px){ .rlf-cartao{width:72vw;} }
      `}</style>

      <div ref={palco} className="rlf-palco">
        <div className="rlf-cab">
          <span className="rlp-eyebrow">{label}</span>
          <h2 className="rlp-h2" style={{ marginTop: 16, maxWidth: '18ch', fontSize: 'clamp(30px,4.4vw,58px)', color: corTitulo }}>{title}</h2>
        </div>
        <div ref={faixa} className="rlf-faixa">
          {fotos.map((f, k) => (
            <div key={k} ref={el => { cartoes.current[k] = el }} className="rlf-cartao">
              {f.url
                ? <><img src={f.url} srcSet={f.srcSet} sizes="(max-width: 767px) 72vw, 30vw" alt="" draggable={false} loading={k < 4 ? 'eager' : 'lazy'} /><span className="rlf-n">{String(f.i + 1).padStart(2, '0')}</span></>
                : <div className="rlf-vazio">Foto {f.i + 1}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
