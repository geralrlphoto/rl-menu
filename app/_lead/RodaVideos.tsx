'use client'

// "O nosso trabalho" dos portais da reunião (/r e /b) em forma de roda,
// a mesma da página de marcas (app/_marcas/Opcao4.tsx): meia roda com o
// centro na borda direita e os vídeos presos a ela. Desde 2026-11-13 a roda
// já não prende o scroll: roda com as setas ← →, os pontos, deslizar ou as
// teclas ← →. O do meio fica aceso, pronto a ver.

import { useEffect, useRef, useState } from 'react'
import Mostrador from '@/app/_marcas/Mostrador'

const OURO = '#d8be93'
const PASSO = 32   // graus entre vídeos
const r2r = (v: number) => Math.round(v * 100) / 100

type Item = { i: number; embed: string | null; capa: string | null }

/** Capa do YouTube a partir do endereço de incorporação (a do Vimeo vem do oEmbed). */
function capaDe(embed: string | null): string | null {
  if (!embed) return null
  const yt = embed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`
  return null
}

/** Endereço do oEmbed do vídeo (YouTube ou Vimeo, com o código dos não listados).
 *  Os dois deixam ler do browser: dão o título e, no Vimeo, a capa escolhida. */
function oembedDe(embed: string | null): string | null {
  if (!embed) return null
  const yt = embed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt[1]}`)}`
  const vm = embed.match(/player\.vimeo\.com\/video\/(\d+)/)
  if (!vm) return null
  const h = embed.match(/[?&]h=([0-9a-f]+)/)?.[1]
  return `https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(`https://vimeo.com/${vm[1]}${h ? `/${h}` : ''}`)}`
}

const comAutoplay = (embed: string) => embed + (embed.includes('?') ? '&' : '?') + 'autoplay=1'

export default function RodaVideos({ label, title, embeds, isAdmin }: {
  label: string; title: string
  embeds: (string | null)[]   // um por vídeo (null = sem endereço válido)
  isAdmin: boolean            // no admin mostram-se os lugares vazios
}) {
  const itens: Item[] = embeds
    .map((embed, i) => ({ i, embed, capa: capaDe(embed) }))
    .filter(it => it.embed || isAdmin)
  const n = itens.length

  const sec = useRef<HTMLElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const cartoes = useRef<(HTMLDivElement | null)[]>([])
  const gira = useRef<SVGGElement>(null)
  const giraInv = useRef<SVGGElement>(null)
  const roda = useRef<SVGSVGElement>(null)
  const alvo = useRef(0)
  const atual = useRef(0)
  const ativaRef = useRef(0)
  const [ativa, setAtiva] = useState(0)
  const [aTocar, setATocar] = useState<number | null>(null)
  // Título (e, no Vimeo, a capa) de cada vídeo, pelo oEmbed
  const [info, setInfo] = useState<Record<string, { titulo?: string; capa?: string }>>({})
  const chaveInfo = itens.map(it => oembedDe(it.embed) ?? '').join('|')
  useEffect(() => {
    let vivo = true
    for (const url of chaveInfo.split('|').filter(Boolean)) {
      fetch(url)
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (!vivo || !d) return
          setInfo(c => ({ ...c, [url]: { titulo: typeof d.title === 'string' ? d.title.trim() : undefined, capa: url.includes('vimeo.com') ? d.thumbnail_url : undefined } }))
        })
        .catch(() => {})
    }
    return () => { vivo = false }
  }, [chaveInfo])

  useEffect(() => {
    if (!n) return
    let raf = 0
    const max = (n - 1) * PASSO

    // a roda já não segue o scroll: alvo.current muda com as setas / pontos / arrastar
    alvo.current = Math.min(alvo.current, max)

    const desenhar = (ang: number) => {
      const el = palco.current
      if (!el) return
      const w = el.clientWidth, h = el.clientHeight
      const movel = w < 768
      const cartaoW = movel ? Math.min(w * .8, 340) : Math.min(560, w * .42)
      // centro da roda na borda direita, a meio da altura; no telemóvel o
      // círculo é mais largo e o centro fica fora do ecrã, para o vídeo ficar ao meio
      const r1 = movel ? h * .58 : Math.max(w * .42, Math.min(w * .5, h * .78))
      const cx = movel ? w + (r1 - w * .5) : w
      const cy = h * (movel ? .56 : .55)
      if (roda.current) {
        // no telemóvel o centro está fora do ecrã: a roda cresce para se ver o arco
        const raio = movel ? r1 * .9 : Math.max(150, r1 - cartaoW / 2 - 30)
        const lado = (raio * 2 * 340) / 330
        roda.current.style.width = `${lado}px`
        roda.current.style.height = `${lado}px`
        roda.current.style.left = `${cx}px`
        roda.current.style.top = `${cy}px`
      }
      let melhor = 0, melhorFoco = -1
      itens.forEach((_, k) => {
        const c = cartoes.current[k]
        if (!c) return
        // 180° = à esquerda do centro; o scroll faz subir (ângulo a crescer)
        const t = ((180 - k * PASSO + ang) * Math.PI) / 180
        const x = Math.cos(t) * r1 + cx
        const y = Math.sin(t) * r1 + cy
        const borda = Math.abs(y - cy) / (h / 2 + 60)
        const vis = Math.max(0, Math.min(1, (1 - borda) / .35))
        const foco = Math.max(0, 1 - Math.abs(y - cy) / (h * .42))
        c.style.width = `${cartaoW}px`
        c.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(.82 + .18 * foco).toFixed(3)})`
        // no telemóvel os vizinhos ficam mais apagados, para não taparem o título
        c.style.opacity = (vis * (movel ? .25 + .75 * foco : 1)).toFixed(3)
        c.style.filter = `brightness(${(.45 + .55 * foco).toFixed(3)})`
        c.style.visibility = vis < .01 ? 'hidden' : 'visible'
        c.style.pointerEvents = vis > .6 ? 'auto' : 'none'
        if (foco > melhorFoco) { melhorFoco = foco; melhor = k }
      })
      itens.forEach((_, k) => { const c = cartoes.current[k]; if (c) c.dataset.ativo = String(k === melhor) })
      if (melhor !== ativaRef.current) { ativaRef.current = melhor; setAtiva(melhor) }
      gira.current?.setAttribute('transform', `rotate(${r2r(ang)})`)
      giraInv.current?.setAttribute('transform', `rotate(${r2r(ang * .5)})`)
    }

    const passo = () => {
      const d = alvo.current - atual.current
      if (Math.abs(d) > .01) { atual.current += d * .12; desenhar(atual.current) }
      raf = requestAnimationFrame(passo)
    }
    const onResize = () => desenhar(atual.current)
    atual.current = alvo.current; desenhar(atual.current)
    raf = requestAnimationFrame(passo)
    addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', onResize)
    }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  // O vídeo que estava a tocar para quando sai do meio
  useEffect(() => { setATocar(t => (t === ativa ? t : null)) }, [ativa])

  /** Leva um vídeo para o meio da roda (a página não se mexe). */
  const irPara = (k: number) => {
    if (n < 2) return
    alvo.current = Math.max(0, Math.min(n - 1, k)) * PASSO
  }
  /** Setas: anda um vídeo; no fim volta ao início (e vice-versa). */
  const passoRoda = (d: number) => irPara((ativaRef.current + d + n) % n)
  const passoRef = useRef(passoRoda)
  passoRef.current = passoRoda

  // teclas ← → quando a roda está à vista (e não há outro leitor aberto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = sec.current; if (!s) return
      const r = s.getBoundingClientRect()
      if (r.bottom < innerHeight * .3 || r.top > innerHeight * .7) return
      if (document.querySelector('.rr-leitor')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); passoRef.current(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); passoRef.current(-1) }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // deslizar com o dedo/rato (mais de 50 px) também anda um vídeo
  const toque = useRef<{ x: number; y: number } | null>(null)
  const onDown = (e: React.PointerEvent) => { toque.current = { x: e.clientX, y: e.clientY } }
  const onUp = (e: React.PointerEvent) => {
    const t = toque.current; toque.current = null
    if (!t) return
    const dx = e.clientX - t.x, dy = e.clientY - t.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) passoRoda(dx < 0 ? 1 : -1)
  }

  if (!n) return null

  return (
    <section ref={sec} id="sec-video" className="rlv">
      <style>{`
        .rlv{position:relative;background:var(--ink-2,#111);}
        .rlv-palco{position:relative;height:100vh;height:100svh;min-height:600px;max-height:1000px;overflow:hidden;touch-action:pan-y;}
        .rlv-setas{display:flex;gap:10px;pointer-events:auto;}
        .rlv-setas button{width:46px;height:46px;border-radius:50%;border:1px solid rgba(243,237,226,.14);background:none;color:rgba(243,237,226,.6);font-size:17px;cursor:pointer;display:grid;place-items:center;transition:border-color .35s,color .35s;}
        .rlv-setas button:hover{border-color:${OURO};color:${OURO};}
        .rlv-palco::before{content:"";position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(ellipse 50% 60% at 100% 55%,rgba(216,190,147,.12),transparent 70%);}
        .rlv-mostrador{position:absolute;transform:translate(-50%,-50%);pointer-events:none;}
        .rlv-cab{position:absolute;left:var(--pad,24px);top:clamp(70px,11vh,120px);z-index:3;max-width:min(520px,80vw);pointer-events:none;}
        .rlv-cartao{position:absolute;left:0;top:0;will-change:transform,opacity;z-index:2;}
        .rlv-moldura{position:relative;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#0b0b0b;
          border:1px solid rgba(216,190,147,.2);border-left:2px solid rgba(216,190,147,.45);
          box-shadow:0 30px 70px -30px rgba(0,0,0,.85);transition:border-color .4s ease,box-shadow .4s ease;}
        .rlv-cartao[data-ativo="true"] .rlv-moldura{border-color:rgba(216,190,147,.6);border-left-color:${OURO};box-shadow:0 0 60px -18px rgba(216,190,147,.6),0 30px 70px -30px rgba(0,0,0,.85);}
        .rlv-capa{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.6);transition:filter .6s ease,transform 1.2s cubic-bezier(.19,1,.22,1);}
        .rlv-cartao[data-ativo="true"] .rlv-capa{filter:none;transform:scale(1.04);}
        .rlv-veu{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,11,11,.85),rgba(11,11,11,.1) 60%);}
        .rlv-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:none;border:0;cursor:pointer;color:#fff;}
        .rlv-bola{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          border:1px solid rgba(216,190,147,.6);background:rgba(216,190,147,.15);backdrop-filter:blur(6px);
          box-shadow:0 0 34px -10px rgba(216,190,147,.8);transition:transform .3s ease,background .3s ease;}
        .rlv-play:hover .rlv-bola{transform:scale(1.08);background:rgba(216,190,147,.3);}
        .rlv-rod{position:absolute;left:18px;right:18px;bottom:14px;display:flex;align-items:center;gap:10px;pointer-events:none;
          font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${OURO};}
        .rlv-rod i{flex:none;width:6px;height:6px;border-radius:50%;background:${OURO};box-shadow:0 0 8px ${OURO};}
        .rlv-rod span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .rlv-vazio{position:absolute;inset:0;display:grid;place-items:center;font-family:'Roboto Condensed',sans-serif;font-weight:600;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:rgba(243,237,226,.4);
          background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);}
        .rlv-conta{position:absolute;left:var(--pad,24px);bottom:28px;z-index:3;display:flex;align-items:center;gap:14px;font-family:'Roboto Condensed',sans-serif;}
        .rlv-conta b{font-weight:100;font-size:56px;line-height:.9;color:#f3ede2;}
        .rlv-conta span{font-weight:600;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:rgba(243,237,226,.45);}
        .rlv-pontos{display:flex;gap:8px;pointer-events:auto;}
        .rlv-pontos button{width:28px;height:2px;border:0;padding:0;background:rgba(255,255,255,.18);cursor:pointer;transition:background .3s ease,width .3s ease;}
        .rlv-pontos button.on{width:44px;background:${OURO};box-shadow:0 0 8px rgba(216,190,147,.7);}
        @media (max-width:767px){
          .rlv-cab{top:76px;}
          .rlv-conta{left:50%;transform:translateX(-50%);bottom:96px;} /* acima do botão do WhatsApp */
          .rlv-setas button{width:42px;height:42px;}
          .rlv-conta b{font-size:40px;}
        }
      `}</style>

      <div ref={palco} className="rlv-palco" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { toque.current = null }}>
        <Mostrador gira={gira} giraInv={giraInv} roda={roda} className="rlv-mostrador" semLetras />

        <div className="rlv-cab">
          <span className="rlp-eyebrow">{label}</span>
          <h2 className="rlp-h2" style={{ marginTop: 16, maxWidth: '16ch', fontSize: 'clamp(30px,4.4vw,58px)' }}>{title}</h2>
        </div>

        {itens.map((it, k) => (
          <div key={it.i} ref={el => { cartoes.current[k] = el }} className="rlv-cartao" style={{ opacity: 0 }}>
            <div className="rlv-moldura">
              {it.embed && aTocar === k ? (
                <iframe src={comAutoplay(it.embed)} className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen title={`Vídeo ${it.i + 1}`} />
              ) : it.embed ? (
                <>
                  {(it.capa || info[oembedDe(it.embed) ?? '']?.capa) && <img src={it.capa || info[oembedDe(it.embed) ?? '']?.capa} alt="" className="rlv-capa" loading="lazy" draggable={false}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
                  <div className="rlv-veu" />
                  <button type="button" className="rlv-play" aria-label={`Ver o vídeo ${it.i + 1}`}
                    onClick={() => (k === ativaRef.current ? setATocar(k) : irPara(k))}>
                    <span className="rlv-bola">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </button>
                  <div className="rlv-rod"><i /><span>{info[oembedDe(it.embed) ?? '']?.titulo || `Filme ${String(it.i + 1).padStart(2, '0')}`}</span></div>
                </>
              ) : (
                <div className="rlv-vazio">▶ · Vídeo {it.i + 1}</div>
              )}
            </div>
          </div>
        ))}

        {n > 1 && (
          <div className="rlv-conta">
            <b>{String(ativa + 1).padStart(2, '0')}</b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span>de {String(n).padStart(2, '0')}</span>
              <div className="rlv-pontos">
                {itens.map((it, k) => (
                  <button key={it.i} type="button" className={k === ativa ? 'on' : ''} aria-label={`Ir para o vídeo ${it.i + 1}`} onClick={() => irPara(k)} />
                ))}
              </div>
            </div>
            <div className="rlv-setas">
              <button type="button" aria-label="Vídeo anterior" onClick={() => passoRoda(-1)}>←</button>
              <button type="button" aria-label="Vídeo seguinte" onClick={() => passoRoda(1)}>→</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
