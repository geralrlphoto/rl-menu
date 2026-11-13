'use client'

// Portfólio dos portais da reunião (/r e /b) em faixa de fotos.
// A página desce normalmente (o scroll já não fica preso aqui): a faixa anda
// com as setas ← →, arrastando (rato ou dedo) ou com as teclas ← → quando está
// à vista. A foto do centro fica acesa (a cores e um pouco maior); as outras
// ficam mais apagadas. No fim dá a volta ao início.
// As fotos vêm da galeria do Wfolio (/api/portfolio-wfolio): servidas pelo
// i.wfolio.com, sem gastar Supabase. Se o Wfolio falhar, usa as do editor.

import { useCallback, useEffect, useRef, useState } from 'react'

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
  const fotos: { url: string; srcSet?: string; i: number }[] = !wf
    ? []   // à espera do Wfolio: não carrega as do Supabase à toa
    : doWfolio
      ? wf.fotos.map((f, i) => ({ url: f.src, srcSet: f.srcSet, i }))
      : photos.map((url, i) => ({ url, i })).filter(f => f.url || isAdmin)
  const n = fotos.length
  const nRef = useRef(n)
  nRef.current = n

  const sec = useRef<HTMLElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const faixa = useRef<HTMLDivElement>(null)
  const cartoes = useRef<(HTMLDivElement | null)[]>([])
  cartoes.current.length = n
  const alvo = useRef(1)          // índice (com casas decimais ao arrastar) da foto ao centro
  const [atual, setAtual] = useState(1)
  const arrasto = useRef<{ x: number; base: number; moveu: boolean } | null>(null)

  const ir = useCallback((i: number) => {
    const m = nRef.current
    if (!m) return
    alvo.current = ((Math.round(i) % m) + m) % m
  }, [])
  const passo = useCallback((d: number) => ir(Math.round(alvo.current) + d), [ir])

  // desenha: põe a foto "alvo" ao centro, com movimento suave
  useEffect(() => {
    if (!n) return
    if (alvo.current >= n) alvo.current = Math.min(1, n - 1)
    let raf = 0, x = NaN, tAnt = performance.now(), ultimo = -1
    const desenhar = (now: number) => {
      const dt = Math.min(now - tAnt, 200); tAnt = now
      const f = faixa.current, pal = palco.current
      if (f && pal) {
        const W = pal.clientWidth
        const k = Math.max(0, Math.min(n - 1, alvo.current))
        const k0 = Math.floor(k), k1 = Math.min(n - 1, k0 + 1), fr = k - k0
        const c0 = cartoes.current[k0], c1 = cartoes.current[k1]
        if (c0 && c1) {
          const centro = (c0.offsetLeft + c0.offsetWidth / 2) * (1 - fr) + (c1.offsetLeft + c1.offsetWidth / 2) * fr
          const xAlvo = W / 2 - centro
          x = isNaN(x) ? xAlvo : x + (xAlvo - x) * (1 - Math.pow(.86, dt / 16.7))
          if (Math.abs(xAlvo - x) < .3) x = xAlvo
          f.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`
          const meio = W / 2
          cartoes.current.forEach(c => {
            if (!c) return
            const cc = c.offsetLeft + c.offsetWidth / 2 + x
            const foco = Math.max(0, 1 - Math.abs(cc - meio) / (W * .6))
            c.style.transform = `scale(${(.9 + .1 * foco).toFixed(3)})`
            c.style.filter = `grayscale(${(.7 * (1 - foco)).toFixed(3)}) brightness(${(.55 + .45 * foco).toFixed(3)})`
          })
        }
        const r = Math.round(k)
        if (r !== ultimo) { ultimo = r; setAtual(r) }
      }
      raf = requestAnimationFrame(desenhar)
    }
    raf = requestAnimationFrame(desenhar)
    return () => cancelAnimationFrame(raf)
  }, [n])

  // teclas ← → quando a faixa está à vista
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = sec.current; if (!s) return
      const r = s.getBoundingClientRect()
      if (r.bottom < innerHeight * .3 || r.top > innerHeight * .7) return
      if (document.querySelector('.rr-leitor')) return // leitor dos vídeos aberto
      if (e.key === 'ArrowRight') { e.preventDefault(); passo(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); passo(-1) }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [passo])

  // arrastar com o rato ou o dedo (o scroll vertical da página fica livre)
  const largura = () => {
    const c = cartoes.current[0]
    return c ? c.offsetWidth + parseFloat(getComputedStyle(faixa.current!).columnGap || '20') : 300
  }
  const onDown = (e: React.PointerEvent) => {
    arrasto.current = { x: e.clientX, base: alvo.current, moveu: false }
    palco.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const a = arrasto.current; if (!a) return
    const dx = e.clientX - a.x
    if (Math.abs(dx) > 6) a.moveu = true
    if (a.moveu) alvo.current = Math.max(0, Math.min(nRef.current - 1, a.base - dx / largura()))
  }
  const onUp = (e: React.PointerEvent) => {
    const a = arrasto.current
    arrasto.current = null
    if (!a) return
    if (a.moveu) { alvo.current = Math.round(alvo.current); return }
    // toque sem arrastar numa foto do lado: trá-la para o centro
    const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList?.contains('rlf-cartao'))
    const k = el ? cartoes.current.indexOf(el as HTMLDivElement) : -1
    if (k >= 0) ir(k)
  }

  if (!n) return null
  const corTitulo = titleColor && titleColor !== '#ffffff' ? titleColor : undefined

  return (
    <section ref={sec} id="sec-portfolio" className="rlf">
      <style>{`
        .rlf{position:relative;padding:clamp(70px,10vh,120px) 0;}
        .rlf-palco{overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none;}
        .rlf-palco:active{cursor:grabbing;}
        .rlf-cab{padding:0 var(--pad,24px);margin-bottom:clamp(24px,5vh,48px);display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;}
        .rlf-ctrl{display:flex;align-items:center;gap:10px;}
        .rlf-ctrl span{font-family:var(--fm,'Space Mono',monospace);font-size:11px;letter-spacing:.2em;color:rgba(243,237,226,.45);margin-right:8px;font-variant-numeric:tabular-nums;}
        .rlf-ctrl span b{color:#d8be93;font-weight:400;}
        .rlf-ctrl button{width:48px;height:48px;border-radius:50%;border:1px solid rgba(243,237,226,.14);background:none;color:rgba(243,237,226,.6);font-size:17px;cursor:pointer;display:grid;place-items:center;transition:border-color .35s,color .35s;}
        .rlf-ctrl button:hover{border-color:#d8be93;color:#d8be93;}
        .rlf-faixa{display:flex;gap:clamp(14px,2vw,28px);width:max-content;will-change:transform;padding:12px 0;}
        .rlf-cartao{flex:none;width:clamp(240px,30vw,420px);aspect-ratio:4/5;border-radius:22px;overflow:hidden;position:relative;background:#141414;
          border:1px solid rgba(216,190,147,.2);border-left:2px solid rgba(216,190,147,.45);box-shadow:0 30px 70px -30px rgba(0,0,0,.85);
          transform-origin:center;transition:box-shadow .4s ease;}
        .rlf-cartao img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}
        .rlf-n{position:absolute;left:16px;bottom:14px;font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:.3em;color:#d8be93;text-shadow:0 1px 8px rgba(0,0,0,.6);}
        .rlf-vazio{position:absolute;inset:0;display:grid;place-items:center;font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:rgba(243,237,226,.4);
          background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);}
        @media (max-width:767px){ .rlf-cartao{width:72vw;} .rlf-ctrl button{width:42px;height:42px;} }
      `}</style>

      <div className="rlf-cab">
        <div>
          <span className="rlp-eyebrow">{label}</span>
          <h2 className="rlp-h2" style={{ marginTop: 16, maxWidth: '18ch', fontSize: 'clamp(30px,4.4vw,58px)', color: corTitulo }}>{title}</h2>
        </div>
        <div className="rlf-ctrl">
          <span><b>{String(atual + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</span>
          <button aria-label="Foto anterior" onClick={() => passo(-1)}>←</button>
          <button aria-label="Foto seguinte" onClick={() => passo(1)}>→</button>
        </div>
      </div>
      <div ref={palco} className="rlf-palco" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
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
