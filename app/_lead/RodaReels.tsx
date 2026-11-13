'use client'

// "Ouçam-nos primeiro": os vídeos da marca pessoal do Rui (Vimeo, pasta
// MARCA PESSOAL) numa roda 3D presa ao scroll, logo a seguir a "Uma conversa,
// não uma proposta". O do centro ganha vida (zoom lento, brilho, pré-visualização
// sem som nos verticais) e inclina com o rato. Arrastar, pontos, ← → e Enter
// também funcionam. Clicar no centro abre o leitor tipo story.
// A lista vem de /api/reels-marca: tudo o que estiver na pasta MARCA PESSOAL
// do Vimeo aparece aqui (cache de 10 min). Capas 9:16 em /public/reels.

import { useCallback, useEffect, useRef, useState } from 'react'

import { REELS_FIXOS, type Reel } from '@/lib/reelsMarca'

const CSS = `
.rr-sec{background:var(--ink-2);position:relative}
.rr-pin{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:grid;grid-template-columns:minmax(300px,32%) 1fr;align-items:center;padding:0 var(--pad)}
.rr-pin::before{content:"";position:absolute;inset:0;background:radial-gradient(50% 60% at 66% 52%,rgba(216,190,147,.10),transparent 70%);pointer-events:none}
.rr-txt{position:relative;z-index:3}
.rr-atual{margin-top:clamp(30px,6vh,64px);min-height:250px}
.rr-n{display:flex;align-items:baseline;gap:10px;font-family:var(--fd)}
.rr-n b{font-weight:200;font-size:clamp(56px,7vw,96px);line-height:1;color:var(--g);font-variant-numeric:tabular-nums}
.rr-n i{font-style:normal;font-family:var(--fm);font-size:12px;letter-spacing:.2em;color:var(--tx-dim)}
.rr-atual h3{font-family:var(--fd);font-weight:300;font-size:clamp(22px,2.4vw,32px);margin-top:14px;line-height:1.2;color:var(--tx)}
.rr-atual p{color:var(--tx-mid);font-weight:300;line-height:1.7;margin-top:10px;max-width:36ch;font-family:var(--fb)}
.rr-atual h3,.rr-atual p{transition:opacity .45s var(--ease),transform .6s var(--ease),filter .45s}
.rr-atual .sai{opacity:0;transform:translateY(12px);filter:blur(4px)}
.rr-ver{margin-top:24px;display:inline-flex;align-items:center;gap:12px;font-family:var(--fm);font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  padding:14px 24px;border:1px solid var(--g);border-radius:40px;color:var(--g);background:none;cursor:pointer;transition:.4s var(--ease)}
.rr-ver span{font-size:9px}.rr-ver em{font-style:normal;color:var(--tx-mid)}
.rr-ver:hover{background:var(--g);color:var(--ink)}.rr-ver:hover em{color:var(--ink)}
.rr-pontos{display:flex;gap:8px;margin-top:34px}
.rr-pontos button{width:26px;height:3px;border-radius:3px;background:var(--line);border:0;padding:0;cursor:pointer;transition:.5s var(--ease)}
.rr-pontos button.on{width:56px;background:var(--g)}
.rr-palco{position:relative;height:100%;perspective:1400px;cursor:grab;touch-action:pan-y;user-select:none}
.rr-palco.drag{cursor:grabbing}
.rr-c{--w:clamp(200px,19vw,290px);position:absolute;left:50%;top:50%;width:var(--w);aspect-ratio:9/16;margin-left:calc(var(--w)/-2);translate:0 -50%;
  will-change:transform;border-radius:16px;overflow:hidden;background:var(--ink-3);box-shadow:0 40px 80px -20px rgba(0,0,0,.7);border:1px solid var(--line-soft)}
.rr-c img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.rr-c.centro img{animation:rr-kb 9s ease-in-out infinite alternate}
.rr-c img.rr-fundo{filter:blur(18px) brightness(.55);transform:scale(1.3)}
.rr-c img.rr-inteira{object-fit:contain}
.rr-c.centro img.rr-fundo{animation:none}
@keyframes rr-kb{from{transform:scale(1)}to{transform:scale(1.12) translateY(-2%)}}
.rr-c iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;opacity:0;transition:opacity .8s}
.rr-c iframe.pronto{opacity:1}
.rr-brilho{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,240,215,.16) 48%,transparent 62%);opacity:0;transition:opacity .4s;mix-blend-mode:screen;pointer-events:none}
.rr-c.centro .rr-brilho{opacity:1}
.rr-c::after{content:"";position:absolute;inset:0;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(216,190,147,0);transition:box-shadow .5s;pointer-events:none}
.rr-c.centro::after{box-shadow:inset 0 0 0 1px rgba(216,190,147,.55)}
.rr-dica{position:absolute;bottom:60px;left:50%;translate:-50% 0;display:flex;flex-direction:column;align-items:center;gap:10px;font-family:var(--fm);font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-dim);z-index:3;transition:opacity .5s;pointer-events:none}
.rr-dica i{width:1px;height:34px;background:linear-gradient(var(--g),transparent);animation:rr-dica 1.8s ease-in-out infinite}
@keyframes rr-dica{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
.rr-cursor{position:fixed;left:0;top:0;width:86px;height:86px;margin:-43px 0 0 -43px;border-radius:50%;background:var(--g);color:var(--ink);display:grid;place-items:center;
  font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;pointer-events:none;z-index:8500;scale:0;transition:scale .35s var(--ease)}
.rr-cursor.on{scale:1}
@media(hover:none){.rr-cursor{display:none}}
.rr-leitor{position:fixed;inset:0;z-index:9000;background:rgba(5,4,3,.94);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;gap:clamp(8px,3vw,40px)}
.rr-ecra{position:relative;max-height:88svh;max-width:calc(100vw - 32px);border-radius:16px;overflow:hidden;background:#000;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.rr-ecra.v{height:min(88svh,calc((100vw - 32px)*16/9));aspect-ratio:9/16}
.rr-ecra.h{width:min(calc(100vw - 180px),calc(88svh*16/9),1100px);aspect-ratio:16/9}
.rr-ecra iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.rr-barras{position:absolute;top:10px;left:12px;right:12px;display:flex;gap:4px;z-index:3;pointer-events:none}
.rr-barras i{flex:1;height:2px;border-radius:2px;background:rgba(255,255,255,.25)}
.rr-barras i.feito{background:#fff}.rr-barras i.agora{background:var(--g)}
.rr-nav{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);font-size:18px;color:var(--tx-mid);background:none;cursor:pointer;flex:0 0 auto}
.rr-nav:hover{border-color:var(--g);color:var(--g)}
.rr-fechar{position:absolute;top:18px;right:20px;font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);background:none;border:0;cursor:pointer;z-index:4}
.rr-tit{position:absolute;top:22px;left:20px;font-family:var(--fm);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);z-index:4}
@media(max-width:860px){
  .rr-pin{grid-template-columns:1fr;grid-template-rows:auto 1fr;padding-top:84px;align-items:start}
  .rr-pin .rlp-h2{font-size:30px}
  .rr-atual{margin-top:14px;min-height:0;display:grid;grid-template-columns:auto 1fr;column-gap:16px;align-items:center}
  .rr-n b{font-size:44px}.rr-n i{display:none}
  .rr-atual h3{margin-top:0;font-size:20px}
  .rr-atual p,.rr-pontos,.rr-dica{display:none}
  .rr-ver{grid-column:1/-1;margin-top:14px;justify-self:start}
  .rr-c{--w:min(52vw,240px)}
  .rr-leitor .rr-nav{position:absolute;bottom:20px}.rr-leitor .rr-nav.p{left:24%}.rr-leitor .rr-nav.n{right:24%}
  .rr-ecra.h{width:calc(100vw - 32px)}
}
`

export default function RodaReels() {
  const sec = useRef<HTMLElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const cartoes = useRef<(HTMLDivElement | null)[]>([])
  const cursor = useRef<HTMLDivElement>(null)
  const dica = useRef<HTMLDivElement>(null)
  const rato = useRef({ x: 0, y: 0 })
  const arrasto = useRef<{ x: number; scroll: number; moveu: boolean } | null>(null)
  const [ativo, setAtivo] = useState(0)
  const [mostra, setMostra] = useState(0)     // texto à esquerda (troca com transição)
  const [sai, setSai] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)
  const [pronto, setPronto] = useState(false)
  const [leitor, setLeitor] = useState<number | null>(null)
  const ativoRef = useRef(0)
  const [reels, setReels] = useState<Reel[]>(REELS_FIXOS)
  const nRef = useRef(REELS_FIXOS.length)
  nRef.current = reels.length
  useEffect(() => {
    fetch('/api/reels-marca').then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reels?.length) setReels(d.reels) }).catch(() => {})
  }, [])
  const N = reels.length
  cartoes.current.length = N

  const curso = () => {
    const s = sec.current
    return s ? s.offsetHeight - innerHeight : 1
  }
  const progresso = useCallback(() => {
    const s = sec.current
    if (!s) return 0
    const r = s.getBoundingClientRect()
    return Math.min(Math.max(-r.top / curso(), 0), 1) * (nRef.current - 1)
  }, [])
  const irPara = useCallback((i: number) => {
    const s = sec.current
    if (!s) return
    const topo = s.getBoundingClientRect().top + scrollY
    scrollTo({ top: topo + curso() * i / (nRef.current - 1) + 2, behavior: 'smooth' })
  }, [])

  // ciclo de animação: lê o scroll e desenha a roda
  useEffect(() => {
    let raf = 0, atual = progresso(), tAnt = performance.now()
    const desenhar = (now: number) => {
      const dt = Math.min(now - tAnt, 200); tAnt = now
      const alvo = progresso()
      atual += (alvo - atual) * (1 - Math.pow(.86, dt / 16.7))
      if (Math.abs(alvo - atual) < .001) atual = alvo
      const mob = innerWidth <= 860, gap = mob ? .58 : .68
      cartoes.current.forEach((c, i) => {
        if (!c) return
        const d = i - atual, a = Math.abs(d), w = c.offsetWidth
        const centro = a < .5
        const tx = centro ? rato.current.y * -6 : 0, ty = centro ? rato.current.x * 8 : 0
        c.style.transform = `translateX(${(d * w * gap).toFixed(1)}px) translateZ(${(-a * (mob ? 160 : 240)).toFixed(1)}px) rotateY(${(-d * (mob ? 22 : 30) + ty).toFixed(2)}deg) rotateX(${tx.toFixed(2)}deg) scale(${(1 - Math.min(a, 3) * .04).toFixed(3)})`
        c.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 1.6) * .6))
        c.style.zIndex = String(100 - Math.round(a * 10))
        c.style.filter = `brightness(${(1 - Math.min(a, 2) * .28).toFixed(3)}) blur(${(Math.max(0, a - .6) * 1.2).toFixed(2)}px)`
      })
      const novo = Math.round(atual)
      if (novo !== ativoRef.current) { ativoRef.current = novo; setAtivo(novo) }
      if (dica.current) dica.current.style.opacity = alvo > .15 ? '0' : '1'
      raf = requestAnimationFrame(desenhar)
    }
    raf = requestAnimationFrame(desenhar)
    // quando o scroll pára, encaixa no vídeo mais próximo
    let encaixe: ReturnType<typeof setTimeout>
    const onScroll = () => {
      if (arrasto.current) return
      clearTimeout(encaixe)
      encaixe = setTimeout(() => {
        const s = sec.current; if (!s) return
        const r = s.getBoundingClientRect()
        if (r.top < 0 && r.bottom > innerHeight) {
          const f = progresso()
          if (Math.abs(f - Math.round(f)) > .04) irPara(Math.round(f))
        }
      }, 160)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(raf); clearTimeout(encaixe); removeEventListener('scroll', onScroll) }
  }, [progresso, irPara])

  // troca do texto e pré-visualização do vídeo do centro
  useEffect(() => {
    setSai(true); setPreview(null); setPronto(false)
    const t1 = setTimeout(() => { setMostra(ativo); setSai(false) }, 220)
    const t2 = setTimeout(() => { if (reels[ativo]?.vertical) setPreview(ativo) }, 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [ativo, reels])

  // teclado: ← → Enter dentro da secção; Esc fecha o leitor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (leitor !== null) {
        if (e.key === 'Escape') setLeitor(null)
        if (e.key === 'ArrowRight') setLeitor(l => ((l ?? 0) + 1) % nRef.current)
        if (e.key === 'ArrowLeft') setLeitor(l => ((l ?? 0) - 1 + nRef.current) % nRef.current)
        return
      }
      const s = sec.current; if (!s) return
      const r = s.getBoundingClientRect(); if (r.top > 0 || r.bottom < innerHeight) return
      if (e.key === 'ArrowRight' && ativoRef.current < nRef.current - 1) { e.preventDefault(); irPara(ativoRef.current + 1) }
      if (e.key === 'ArrowLeft' && ativoRef.current > 0) { e.preventDefault(); irPara(ativoRef.current - 1) }
      if (e.key === 'Enter') setLeitor(ativoRef.current)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [leitor, irPara])

  useEffect(() => {
    document.body.style.overflow = leitor !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [leitor])

  // arrastar / clicar no palco
  const onDown = (e: React.PointerEvent) => {
    arrasto.current = { x: e.clientX, scroll: scrollY, moveu: false }
    palco.current?.classList.add('drag')
    palco.current?.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const p = palco.current; if (!p) return
    const r = p.getBoundingClientRect()
    rato.current = { x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 }
    const c = cursor.current
    const sobre = (e.target as HTMLElement).closest?.('.rr-c') as HTMLElement | null
    if (c) {
      c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`
      c.classList.toggle('on', !!sobre && !arrasto.current)
      if (sobre) { const i = +sobre.dataset.i!; c.textContent = i === ativoRef.current ? 'Ver' : i < ativoRef.current ? '←' : '→' }
    }
    const a = arrasto.current
    if (a) {
      const dx = e.clientX - a.x
      if (Math.abs(dx) > 6) a.moveu = true
      const w = (cartoes.current[0]?.offsetWidth ?? 260) * .68
      scrollTo(0, a.scroll - dx / w * (curso() / (nRef.current - 1)))
    }
  }
  const onUp = (e: React.PointerEvent) => {
    palco.current?.classList.remove('drag')
    const a = arrasto.current
    arrasto.current = null
    if (a && !a.moveu) {
      const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList?.contains('rr-c')) as HTMLElement | undefined
      if (el) { const i = +el.dataset.i!; if (i === ativoRef.current) setLeitor(i); else irPara(i) }
    } else if (a) irPara(Math.round(progresso()))
  }
  const onLeave = () => { cursor.current?.classList.remove('on'); rato.current = { x: 0, y: 0 } }

  const r = reels[Math.min(mostra, N - 1)]
  const lr = leitor !== null ? reels[leitor] : null

  return (
    <section ref={sec} id="sec-reels" className="rr-sec" style={{ height: `${100 + (N - 1) * 84}vh` }}>
      <style>{CSS}</style>
      <div className="rr-pin">
        <div className="rr-txt">
          <span className="rlp-eyebrow">Antes de nos sentarmos</span>
          <h2 className="rlp-h2" style={{ marginTop: 20, fontSize: 'clamp(30px,4.4vw,52px)' }}>Ouçam-nos <em>primeiro</em></h2>
          <div className="rr-atual">
            <span className="rr-n"><b>{String(mostra + 1).padStart(2, '0')}</b><i>/ {String(N).padStart(2, '0')}</i></span>
            <h3 className={sai ? 'sai' : ''}>{r.t}</h3>
            <p className={sai ? 'sai' : ''}>{r.p}</p>
            <button className="rr-ver" onClick={() => setLeitor(ativo)}><span>▶</span> Ver vídeo · <em>{r.d}</em></button>
          </div>
          <div className="rr-pontos">
            {reels.map((x, i) => <button key={x.vimeo} aria-label={x.t} className={i === ativo ? 'on' : ''} onClick={() => irPara(i)} />)}
          </div>
        </div>
        <div ref={palco} className="rr-palco" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onLeave}>
          {reels.map((x, i) => (
            <div key={x.vimeo} ref={el => { cartoes.current[i] = el }} data-i={i} className={`rr-c${i === ativo ? ' centro' : ''}`}>
              {x.capaH && <img src={x.capa} alt="" aria-hidden className="rr-fundo" draggable={false} />}
              <img src={x.capa} alt={x.t} className={x.capaH ? 'rr-inteira' : undefined} draggable={false} />
              {preview === i && (
                <iframe
                  src={`https://player.vimeo.com/video/${x.vimeo}?background=1&muted=1&loop=1&autopause=0&dnt=1`}
                  className={pronto ? 'pronto' : ''}
                  onLoad={() => setTimeout(() => setPronto(true), 600)}
                  allow="autoplay" title={`Pré-visualização: ${x.t}`} tabIndex={-1}
                />
              )}
              <span className="rr-brilho" />
            </div>
          ))}
        </div>
        <div ref={dica} className="rr-dica"><span>Scroll ou arrastar</span><i /></div>
      </div>
      <div ref={cursor} className="rr-cursor">Ver</div>

      {lr && (
        <div className="rr-leitor" onClick={e => { if (e.target === e.currentTarget) setLeitor(null) }}>
          <span className="rr-tit">{lr.t}</span>
          <button className="rr-fechar" onClick={() => setLeitor(null)}>Fechar ×</button>
          <button className="rr-nav p" aria-label="Anterior" onClick={() => setLeitor(l => ((l ?? 0) - 1 + N) % N)}>←</button>
          <div className={`rr-ecra ${lr.vertical ? 'v' : 'h'}`}>
            <div className="rr-barras">{reels.map((x, i) => <i key={x.vimeo} className={i < leitor! ? 'feito' : i === leitor ? 'agora' : ''} />)}</div>
            <iframe key={lr.vimeo} src={`https://player.vimeo.com/video/${lr.vimeo}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`}
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={lr.t} />
          </div>
          <button className="rr-nav n" aria-label="Seguinte" onClick={() => setLeitor(l => ((l ?? 0) + 1) % N)}>→</button>
        </div>
      )}
    </section>
  )
}
