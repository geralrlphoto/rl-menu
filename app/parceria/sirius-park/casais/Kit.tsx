'use client'

// Kit para os casais do Sirius Park (ver page.tsx). Tema RL dos portais.
import { useEffect, useRef, useState } from 'react'
import { RLP_CSS } from '@/app/_lead/rlpCss'
import RodaReels from '@/app/_lead/RodaReels'
import TestemunhoDestaque from '@/app/_lead/TestemunhoDestaque'

const WA = 'https://wa.me/351912932768'
const MSG = 'Olá! Vamos casar no Sirius Park e fomos recomendados pela Inês. Gostávamos de saber mais sobre a RL Photo · Video.'
const MSG_DATA = 'Olá! Vamos casar no Sirius Park e fomos recomendados pela Inês. A nossa data é: '

const PORQUE = [
  { n: '01', t: 'Conhecemos o espaço', d: 'Sabemos onde está a melhor luz a cada hora, os recantos dos jardins e o ritmo de um casamento no Sirius Park.' },
  { n: '02', t: 'Trabalhamos com a equipa', d: 'Coordenamos horários e momentos com a equipa do espaço. Vocês só têm de aproveitar.' },
  { n: '03', t: 'Tudo num só sítio', d: 'Um portal só vosso com contrato, pagamentos, guias e o estado das entregas, do primeiro dia até ao filme.' },
]
const PASSOS = [
  { t: 'Uma conversa', d: 'Marcamos uma reunião para vos conhecer.' },
  { t: 'A proposta', d: 'Feita à medida do vosso dia.' },
  { t: 'A data é vossa', d: 'Contrato online e data reservada.' },
  { t: 'O grande dia', d: 'Do primeiro ao último minuto.' },
]

type Foto = { src: string; srcSet: string }

function FadeIn({ children, delay = 0, className = '', style = {} }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(24px)',
      transition: `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .8s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

export default function Kit({ fotosEspaco }: { fotosEspaco: string }) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [data, setData] = useState('')
  useEffect(() => {
    fetch('/api/portfolio-wfolio').then(r => r.json()).then(d => setFotos(Array.isArray(d.fotos) ? d.fotos.slice(0, 12) : [])).catch(() => {})
    const onScroll = () => document.getElementById('rlp-bar')?.classList.toggle('s', scrollY > 40)
    addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])
  const wa = (m: string) => `${WA}?text=${encodeURIComponent(m)}`
  const dataPT = data ? new Date(`${data}T12:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className="rl-portal kc min-h-screen">
      <style>{RLP_CSS}</style>
      <style>{KC_CSS}</style>
      <div className="rlp-vig" aria-hidden />

      <header id="rlp-bar" className="rlp-bar" style={{ top: 0 }}>
        <span className="rlp-mono"><span>RL</span><i>Photo · Video</i></span>
        <a href={wa(MSG)} target="_blank" rel="noopener noreferrer" className="rlp-link-u"><span>Falar connosco</span><span className="a">→</span></a>
      </header>

      {/* CAPA */}
      <section className="kc-hero">
        <div className="kc-hero-img" style={{ backgroundImage: `url(${fotosEspaco}sirius-2.jpg)` }} aria-hidden />
        <div className="kc-hero-veu" aria-hidden />
        <div className="rlp-wrap kc-hero-in">
          <FadeIn delay={80}><span className="kc-selo"><i>✦</i>Recomendado pelo Sirius Park</span></FadeIn>
          <FadeIn delay={220}><h1 className="rlp-h1 kc-h1">Vão casar no<br /><em>Sirius Park?</em></h1></FadeIn>
          <FadeIn delay={380}><p className="rlp-ed kc-sub">Somos a RL Photo · Video. Fotografia e vídeo de casamentos, com foco na verdade de cada momento.</p></FadeIn>
          <FadeIn delay={520} className="kc-acoes">
            <a href={wa(MSG)} target="_blank" rel="noopener noreferrer" className="rlp-btn"><span className="fill" /><span className="dot" />Marcar uma conversa</a>
            <a href="#trabalho" className="rlp-btn ghost"><span className="fill" /><span className="dot" />Ver o nosso trabalho</a>
          </FadeIn>
        </div>
        <a href="#porque" className="kc-desce" aria-label="Descer"><span /></a>
      </section>

      {/* PORQUE */}
      <section id="porque" className="rlp-sec">
        <div className="rlp-wrap" style={{ maxWidth: 1100 }}>
          <FadeIn className="kc-cab">
            <span className="rlp-eyebrow">Porquê a RL</span>
            <h2 className="rlp-h2">O Sirius Park <em>conhece-nos</em></h2>
          </FadeIn>
          <div className="kc-porque">
            {PORQUE.map((p, i) => (
              <FadeIn key={p.n} delay={i * 120} className="rlp-card kc-pq">
                <span className="n">{p.n}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TRABALHO */}
      <section id="trabalho" className="rlp-sec" style={{ background: 'var(--ink-2)', paddingTop: 'clamp(60px,9vw,120px)' }}>
        <div className="rlp-wrap" style={{ maxWidth: 1300 }}>
          <FadeIn className="kc-cab c">
            <span className="rlp-eyebrow c">O nosso trabalho</span>
            <h2 className="rlp-h2">Histórias <em>verdadeiras</em></h2>
          </FadeIn>
          <div className="kc-mosaico">
            {(fotos.length ? fotos : Array.from({ length: 9 }, () => null)).map((f, i) => (
              <FadeIn key={i} delay={(i % 4) * 80} className={`kc-m m${i % 6}`}>
                {f ? <img src={f.src} srcSet={f.srcSet} sizes="(max-width:760px) 50vw, 25vw" alt="" loading="lazy" /> : <div className="kc-ph" />}
              </FadeIn>
            ))}
          </div>
          <FadeIn className="flex justify-center" style={{ marginTop: 36 }}>
            <a href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer" className="rlp-link-u"><span>Mais no nosso site</span><span className="a">→</span></a>
          </FadeIn>
        </div>
      </section>

      {/* VÍDEOS */}
      <RodaReels />

      {/* COMO FUNCIONA */}
      <section className="rlp-sec">
        <div className="rlp-wrap" style={{ maxWidth: 1100 }}>
          <FadeIn className="kc-cab c">
            <span className="rlp-eyebrow c">Como funciona</span>
            <h2 className="rlp-h2">Simples, do <em>início ao fim</em></h2>
          </FadeIn>
          <div className="kc-passos">
            {PASSOS.map((p, i) => (
              <FadeIn key={p.t} delay={i * 150} className="kc-passo">
                <span className="b">{i + 1}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <TestemunhoDestaque />

      {/* DATA */}
      <section className="rlp-sec">
        <div className="rlp-wrap" style={{ maxWidth: 760 }}>
          <FadeIn>
            <div className="rlp-card kc-data">
              <span className="rlp-eyebrow c">A vossa data</span>
              <h2 className="rlp-h2" style={{ textAlign: 'center' }}>Ainda temos a vossa <em>data livre?</em></h2>
              <p className="rlp-lede" style={{ textAlign: 'center', fontSize: 16 }}>Digam-nos o dia e respondemos no próprio dia.</p>
              <div className="kc-data-f">
                <input type="date" value={data} onChange={e => setData(e.target.value)} aria-label="Data do casamento" />
                <a href={wa(MSG_DATA + (dataPT || '…'))} target="_blank" rel="noopener noreferrer" className={`rlp-btn${data ? '' : ' off'}`}>
                  <span className="fill" /><span className="dot" />Ver disponibilidade
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="rlp-foot">
        <div className="rlp-wrap">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8">
            <div>
              <h2 className="rlp-h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)', maxWidth: '14ch' }}>Até já, no <em>Sirius Park</em></h2>
            </div>
            <div className="flex flex-col gap-3">
              <h5>Contactos</h5>
              <a href="tel:+351912932768">912 932 768</a>
              <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
            </div>
            <div className="flex flex-col gap-3">
              <h5>Seguir</h5>
              <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer">rlphotovideo.pt</a>
            </div>
          </div>
        </div>
        <div className="end"><span>© RL Photo · Video</span><span>registamos com foco na verdade</span></div>
      </footer>
    </div>
  )
}

const KC_CSS = `
.kc-hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;overflow:hidden}
.kc-hero-img{position:absolute;inset:0;background-size:cover;background-position:center;animation:kc-zoom 22s ease-out both}
@keyframes kc-zoom{from{transform:scale(1.18)}to{transform:scale(1)}}
.kc-hero-veu{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,11,.5),rgba(11,11,11,.2) 35%,rgba(11,11,11,.75) 78%,var(--ink)),linear-gradient(90deg,rgba(11,11,11,.65),transparent 65%)}
.kc-hero-in{position:relative;z-index:2;width:100%;padding-bottom:clamp(70px,12vh,130px)}
.kc-selo{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#0b0b0b;background:linear-gradient(90deg,var(--g),#e9d6b3);padding:9px 16px;border-radius:999px}
.kc-selo i{font-style:normal}
.kc-h1{font-size:clamp(46px,9vw,128px)!important;line-height:.95;margin:22px 0 0}
.kc-h1 em{color:var(--g)}
.kc-sub{font-size:clamp(18px,2.2vw,26px);line-height:1.35;max-width:36ch;margin-top:22px;color:var(--tx-mid)}
.kc-acoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.kc-desce{position:absolute;left:50%;bottom:22px;z-index:2;width:22px;height:36px;margin-left:-11px;border:1px solid var(--line);border-radius:12px}
.kc-desce span{position:absolute;left:50%;top:7px;width:3px;height:7px;margin-left:-1.5px;border-radius:2px;background:var(--g);animation:kc-desce 1.8s ease-in-out infinite}
@keyframes kc-desce{60%{transform:translateY(12px);opacity:0}100%{opacity:0}}
.kc-cab{display:flex;flex-direction:column;gap:14px;margin-bottom:clamp(30px,5vw,56px)}
.kc-cab.c{align-items:center;text-align:center}
.kc-porque{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
@media(max-width:820px){.kc-porque{grid-template-columns:1fr}}
.kc-pq{padding:clamp(24px,3vw,36px)!important;transition:transform .5s var(--ease),border-color .5s}
.kc-pq:hover{transform:translateY(-6px)}
.kc-pq>*{position:relative;z-index:1}
.kc-pq .n{font-size:12px;font-weight:600;letter-spacing:.22em;color:var(--g)}
.kc-pq h3{font-family:var(--fd);font-weight:300;font-size:clamp(22px,2.4vw,28px);margin:12px 0 8px}
.kc-pq p{color:var(--tx-mid);font-size:15px;line-height:1.65}
.kc-mosaico{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:clamp(140px,16vw,230px);gap:10px}
.kc-m{border-radius:10px;overflow:hidden;background:#151515}
.kc-m.m0{grid-row:span 2}.kc-m.m3{grid-column:span 2}.kc-m.m4{grid-row:span 2}
.kc-m img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease),filter .6s;filter:saturate(.9)}
.kc-m:hover img{transform:scale(1.06);filter:none}
.kc-ph{width:100%;height:100%;background:linear-gradient(110deg,#141414 30%,#1c1a16 50%,#141414 70%);background-size:200% 100%;animation:kc-ph 1.4s linear infinite}
@keyframes kc-ph{to{background-position:-200% 0}}
@media(max-width:760px){.kc-mosaico{grid-template-columns:1fr 1fr}.kc-m.m3{grid-column:span 1}}
.kc-passos{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.kc-passos::before{content:"";position:absolute;left:12%;right:12%;top:27px;height:1px;background:linear-gradient(90deg,transparent,var(--g),transparent);opacity:.5}
.kc-passo{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
.kc-passo .b{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:var(--ink);border:1px solid var(--g);color:var(--g);font-family:var(--fd);font-weight:200;font-size:24px;box-shadow:0 0 26px -6px rgba(216,190,147,.6)}
.kc-passo h3{font-family:var(--fd);font-weight:300;font-size:21px;margin-top:6px}
.kc-passo p{color:var(--tx-mid);font-size:14px;max-width:22ch}
@media(max-width:760px){.kc-passos{grid-template-columns:1fr 1fr;row-gap:34px}.kc-passos::before{display:none}}
.kc-data{padding:clamp(28px,5vw,56px)!important;display:flex;flex-direction:column;align-items:center;gap:16px}
.kc-data>*{position:relative;z-index:1}
.kc-data-f{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}
.kc-data-f input{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:999px;padding:13px 20px;color:var(--tx);font-family:var(--fb);font-size:15px;color-scheme:dark;outline:none}
.kc-data-f input:focus{border-color:var(--g)}
.rlp-btn.off{opacity:.5;pointer-events:none}
`
