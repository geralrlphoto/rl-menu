'use client'

import { useEffect, useRef, useState } from 'react'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'
import MarcarReuniao, { CSS_MARCAR } from './MarcarReuniao'

/* Rollup interativo: 1) o ecrã é o visor de uma câmara (tocar para focar,
   disparar com flash e som), 2) a foto revela-se numa polaroid, 3) rolo de
   filme com fotos, 4) "quando é o grande dia?" com contagem e WhatsApp com
   a data já escrita. Sons feitos com WebAudio, sem ficheiros. */

const TEL = '+351912932768'
const WA = 'https://wa.me/351912932768'
const FOTO = '/newsletter/casamento-13.jpg'
const ROLO = ['09', '10', '07', '17', '04', '01', '14', '16', '12'].map(n => `/newsletter/casamento-${n}.jpg`)

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

const CONTACTOS = [
  { rotulo: 'Site', valor: 'rlphotovideo.pt', href: 'https://rlphotovideo.pt' },
  { rotulo: 'Instagram', valor: '@rlphoto_fotografia.video', href: 'https://www.instagram.com/rlphoto_fotografia.video/' },
  { rotulo: 'Email', valor: 'geral.rlphoto@gmail.com', href: 'mailto:geral.rlphoto@gmail.com' },
  { rotulo: 'Contacto', valor: '912 932 768', href: `tel:${TEL}` },
]

const externo = { target: '_blank', rel: 'noopener noreferrer' }

function estacao(m: number, d: number): string {
  const md = m * 100 + d // m em 1..12
  if (md >= 321 && md < 621) return 'primavera'
  if (md >= 621 && md < 923) return 'verão'
  if (md >= 923 && md < 1221) return 'outono'
  return 'inverno'
}

// ── Sons (WebAudio) ─────────────────────────────────────────────────────
let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}
function bipFoco() {
  const a = audio(); if (!a) return
  ;[0, 0.11].forEach(t => {
    const o = a.createOscillator(), g = a.createGain()
    o.type = 'sine'; o.frequency.value = 2600
    g.gain.setValueAtTime(0.0001, a.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.08, a.currentTime + t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.07)
    o.connect(g).connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.08)
  })
}
function somObturador() {
  const a = audio(); if (!a) return
  const clique = (t: number, vol: number, freq: number) => {
    const n = Math.floor(a.sampleRate * 0.05)
    const buf = a.createBuffer(1, n, a.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3)
    const s = a.createBufferSource(); s.buffer = buf
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8
    const g = a.createGain(); g.gain.value = vol
    s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + t)
  }
  clique(0, 0.9, 1800)
  clique(0.09, 0.6, 1200)
}

// ── Código de tempo do visor ────────────────────────────────────────────
function Timecode({ parado }: { parado: boolean }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (parado) return
    const t0 = performance.now()
    const id = setInterval(() => setF(Math.floor((performance.now() - t0) / 40)), 40)
    return () => clearInterval(id)
  }, [parado])
  const p = (n: number) => String(n).padStart(2, '0')
  const s = Math.floor(f / 25)
  return <span>{p(Math.floor(s / 3600))}:{p(Math.floor(s / 60) % 60)}:{p(s % 60)}:{p(f % 25)}</span>
}

// ── Número que conta até ao valor ───────────────────────────────────────
function Contador({ alvo }: { alvo: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const dur = 1400
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      setV(Math.round(alvo * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [alvo])
  return <>{v}</>
}

export default function Rollup() {
  // Visor: 'desfocado' → 'focado' → 'disparado'
  const [fase, setFase] = useState<'desfocado' | 'focado' | 'disparado'>('desfocado')
  const [ponto, setPonto] = useState({ x: 50, y: 50 })
  const [flash, setFlash] = useState(0)
  const visor = useRef<HTMLDivElement>(null)

  function focar(e: React.MouseEvent<HTMLDivElement>) {
    if (fase === 'disparado') return
    const r = visor.current?.getBoundingClientRect()
    if (!r) return
    const x = Math.max(12, Math.min(88, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.max(18, Math.min(78, ((e.clientY - r.top) / r.height) * 100))
    setPonto({ x, y })
    setFase('desfocado')
    // Pequena pausa para o desfoque recomeçar antes de focar outra vez
    setTimeout(() => { setFase('focado'); bipFoco() }, 60)
  }

  function disparar(e: React.MouseEvent) {
    e.stopPropagation()
    somObturador()
    try { navigator.vibrate?.(35) } catch {}
    setFlash(f => f + 1)
    setTimeout(() => setFase('disparado'), 120)
  }

  // Data do casamento
  const hoje = new Date()
  const [dia, setDia] = useState('')
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')
  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() + i)

  let data: Date | null = null
  let erroData = ''
  if (dia && mes && ano) {
    const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
    if (d.getMonth() !== Number(mes) - 1) erroData = 'Essa data não existe no calendário.'
    else if (d.getTime() < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()) erroData = 'Essa data já passou. Escolham a do grande dia.'
    else data = d
  }
  const hoje0 = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const faltam = data ? Math.round((data.getTime() - hoje0.getTime()) / 86400000) : 0
  const dataTexto = data ? `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}` : ''

  const textoWa = data
    ? `Olá! Vimos o vosso rollup. O nosso casamento é a ${dataTexto} e gostávamos de saber mais sobre fotografia e vídeo para esse dia.`
    : 'Olá! Vimos o vosso rollup e gostávamos de saber mais sobre fotografia e vídeo para o nosso casamento.'
  const hrefWa = `${WA}?text=${encodeURIComponent(textoWa)}`

  return (
    <main className="nlead ru" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS + CSS_MARCAR}</style>
      <div className="fx-grain" aria-hidden="true" />

      {/* ── 1. Visor da câmara ── */}
      <section className={`hero fase-${fase}`}>
        <div ref={visor} className="visor" onClick={focar} role="button" aria-label="Tocar para focar">
          <div className="foto" style={{ backgroundImage: `url(${FOTO})`, transformOrigin: `${ponto.x}% ${ponto.y}%` }} />
          <div className="grelha" aria-hidden="true" />
          <i className="canto tl" /><i className="canto tr" /><i className="canto bl" /><i className="canto br" />
          <div className="hud topo">
            <span className="rec"><b />REC</span>
            <span>4K · 25p &nbsp;<span className="bat"><i /><i /><i /></span></span>
          </div>
          <div className="hud base">
            <span>ISO 400 &nbsp; f/1.8 &nbsp; 1/250</span>
            <Timecode parado={fase === 'disparado'} />
          </div>
          <div className="af" style={{ left: `${ponto.x}%`, top: `${ponto.y}%` }}>
            <span>{fase === 'focado' ? 'AF ●' : 'AF'}</span>
          </div>
          <div className="dica">
            {fase === 'desfocado' ? <>Toquem no ecrã <em>para focar</em></> : <>Agora, <em>disparem</em></>}
          </div>
          <button className="disparo" onClick={disparar} aria-label="Disparar" tabIndex={fase === 'focado' ? 0 : -1}>
            <span />
          </button>
        </div>

        {flash > 0 && <div key={flash} className="flash" aria-hidden="true" />}

        {/* Polaroid que se revela depois do disparo */}
        <div className="revelado" aria-hidden={fase !== 'disparado'}>
          <div className="polaroid">
            <div className="img" style={{ backgroundImage: `url(${FOTO})` }} />
            <p className="leg">O vosso <em>casamento</em></p>
            <p className="marca">RL Photo · Video</p>
          </div>
          <p className="frase">Fotografia e filme para o dia mais vosso.</p>
          <div className="rev-acoes">
            <a href="#rolo" className="desce"><span>Vejam mais</span><i /></a>
            <button className="outra" onClick={() => { setFase('desfocado') }}>↺ Tirar outra</button>
          </div>
        </div>
      </section>

      {/* ── 2. Rolo de filme ── */}
      <section className="rolo-sec" id="rolo">
        <div className="cab rv">
          <p className="eyebrow">Casamentos reais</p>
          <h2>Cada momento, <em>um fotograma</em></h2>
          <p className="hint" style={{ marginTop: 10 }}>Deslizem o rolo &rarr;</p>
        </div>
        <div className="rolo">
          <div className="fita">
            {ROLO.map((src, i) => (
              <figure key={src} className="quadro">
                <div className="img" style={{ backgroundImage: `url(${src})` }} />
                <figcaption><span>RL 400</span><span>{String(i + 1).padStart(2, '0')}A</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. A data ── */}
      <section className="corpo">
        <div className="rv" style={{ textAlign: 'center' }}>
          <p className="eyebrow">A vossa data</p>
          <h2 className="h-data">Quando é o <em>grande dia?</em></h2>
        </div>
        <div className="data-sel rv">
          <select value={dia} onChange={e => setDia(e.target.value)} aria-label="Dia">
            <option value="">Dia</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
          <select value={mes} onChange={e => setMes(e.target.value)} aria-label="Mês">
            <option value="">Mês</option>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m[0].toUpperCase() + m.slice(1)}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(e.target.value)} aria-label="Ano">
            <option value="">Ano</option>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {erroData && <p className="erro">{erroData}</p>}
        {data && (
          <div className="contagem" key={data.getTime()}>
            <p className="faltam">{faltam === 0 ? 'É hoje!' : faltam === 1 ? 'Falta' : 'Faltam'}</p>
            {faltam > 0 && <p className="num"><Contador alvo={faltam} /></p>}
            {faltam > 0 && <p className="unid">{faltam === 1 ? 'dia' : 'dias'}</p>}
            <p className="quando">Um{DIAS_SEMANA[data.getDay()] === 'sábado' || DIAS_SEMANA[data.getDay()] === 'domingo' ? '' : 'a'} {DIAS_SEMANA[data.getDay()]} de {estacao(data.getMonth() + 1, data.getDate())}.</p>
            <p className="guardem">Guardem esta data. Nós guardamos o resto para sempre.</p>
          </div>
        )}

        <MarcarReuniao
          dataCasamento={data ? `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : ''} />
        <a href="/nova-lead" className="proposta">
          <b>Pedir proposta</b>
          <small>Leva só alguns minutos</small>
        </a>
        <div className="acoes">
          <a href={hrefWa} className="btn-g" {...externo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3.5 20.5l1.3-4.3A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.2-1.1z" /><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2z" /></svg>
            <b>WhatsApp</b>
            {data && <small>com a vossa data</small>}
          </a>
          <a href={`tel:${TEL}`} className="btn-g">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" /></svg>
            <b>Ligar</b>
          </a>
        </div>
        <a href="/boas-vindas/rl.vcf" className="guardar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
          Guardar contacto
        </a>

        {/* ── 4. Visite-nos ── */}
        <section className="sec">
          <div className="sec-t rv"><h2>Visite-<em>nos</em></h2><span className="hint">RL Photo.Video</span></div>
          <nav>
            {CONTACTOS.map((c, i) => (
              <a key={c.href} href={c.href} className="row rv" {...(c.href.startsWith('http') ? externo : {})}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span className="t"><span className="r">{c.rotulo}</span><span className="v">{c.valor}</span></span>
                <span className="s" aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        </section>
      </section>

      <footer className="fim rv">
        <p>Até <em>já.</em></p>
        <img src="/portal-noivos/mono-gold.png" alt="" />
        <div className="hint">RL Photo &middot; Video &middot; Wedding Moments</div>
      </footer>
    </main>
  )
}

const CSS = `
.ru{overflow-x:hidden;}
.ru h2 em{font-style:italic;color:var(--g);}

/* ── Visor ── */
.ru .hero{position:relative;height:100svh;min-height:600px;overflow:hidden;background:#000;}
.ru .visor{position:absolute;inset:0;cursor:crosshair;-webkit-tap-highlight-color:transparent;transition:opacity .6s var(--ease),transform .9s var(--ease);}
.ru .foto{position:absolute;inset:-4%;background-size:cover;background-position:42% center;filter:blur(16px) brightness(.8) saturate(.9);transform:scale(1.08);transition:filter 1.1s cubic-bezier(.3,.7,.2,1),transform 1.1s cubic-bezier(.3,.7,.2,1);}
.ru .fase-focado .foto{filter:blur(0) brightness(1) saturate(1.05);transform:scale(1.14);}
.ru .grelha{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(90deg,transparent calc(33.33% - .5px),rgba(255,255,255,.18) calc(33.33% - .5px),rgba(255,255,255,.18) calc(33.33% + .5px),transparent calc(33.33% + .5px),transparent calc(66.66% - .5px),rgba(255,255,255,.18) calc(66.66% - .5px),rgba(255,255,255,.18) calc(66.66% + .5px),transparent calc(66.66% + .5px)),
  linear-gradient(180deg,transparent calc(33.33% - .5px),rgba(255,255,255,.18) calc(33.33% - .5px),rgba(255,255,255,.18) calc(33.33% + .5px),transparent calc(33.33% + .5px),transparent calc(66.66% - .5px),rgba(255,255,255,.18) calc(66.66% - .5px),rgba(255,255,255,.18) calc(66.66% + .5px),transparent calc(66.66% + .5px));}
.ru .visor::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55));}
.ru .canto{position:absolute;width:26px;height:26px;border:0 solid rgba(255,255,255,.85);z-index:2;}
.ru .canto.tl{top:22px;left:18px;border-top-width:1.5px;border-left-width:1.5px;}
.ru .canto.tr{top:22px;right:18px;border-top-width:1.5px;border-right-width:1.5px;}
.ru .canto.bl{bottom:22px;left:18px;border-bottom-width:1.5px;border-left-width:1.5px;}
.ru .canto.br{bottom:22px;right:18px;border-bottom-width:1.5px;border-right-width:1.5px;}
.ru .hud{position:absolute;left:30px;right:30px;display:flex;justify-content:space-between;align-items:center;z-index:2;font-family:var(--fm);font-size:10.5px;letter-spacing:.14em;color:rgba(255,255,255,.9);text-shadow:0 1px 6px rgba(0,0,0,.6);pointer-events:none;font-variant-numeric:tabular-nums;}
.ru .hud.topo{top:34px;}
.ru .hud.base{bottom:34px;}
.ru .rec{display:flex;align-items:center;gap:7px;}
.ru .rec b{width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;animation:ruPisca 1.1s steps(2) infinite;}
.ru .bat{display:inline-flex;gap:2px;padding:2px;border:1px solid rgba(255,255,255,.8);border-radius:2px;vertical-align:middle;}
.ru .bat i{width:4px;height:7px;background:rgba(255,255,255,.9);}
.ru .af{position:absolute;z-index:3;width:74px;height:74px;margin:-37px 0 0 -37px;border:1.5px dashed rgba(255,255,255,.85);pointer-events:none;transition:left .25s var(--ease),top .25s var(--ease),border-color .3s,transform .3s;animation:ruRespira 1.6s ease-in-out infinite;}
.ru .af span{position:absolute;top:-20px;left:0;font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.7);}
.ru .fase-focado .af{border-style:solid;border-color:#7CFC9A;animation:ruFoca .35s var(--ease) both;}
.ru .fase-focado .af span{color:#7CFC9A;}
.ru .dica{position:absolute;left:0;right:0;bottom:clamp(150px,22vh,190px);z-index:2;text-align:center;font-family:var(--fs);font-weight:300;font-size:clamp(26px,7.5vw,36px);color:#fff;text-shadow:0 2px 20px rgba(0,0,0,.6);pointer-events:none;animation:ruSobe 1.2s .6s var(--ease) both;}
.ru .dica em{font-style:italic;color:var(--g);}
.ru .disparo{position:absolute;left:50%;bottom:clamp(66px,10vh,86px);z-index:4;width:76px;height:76px;margin-left:-38px;border-radius:50%;border:3px solid #fff;background:transparent;padding:5px;cursor:pointer;
  opacity:0;transform:scale(.6);pointer-events:none;transition:opacity .4s var(--ease),transform .4s var(--ease);}
.ru .disparo span{display:block;width:100%;height:100%;border-radius:50%;background:#fff;transition:transform .15s;}
.ru .disparo:active span{transform:scale(.85);}
.ru .fase-focado .disparo{opacity:1;transform:none;pointer-events:auto;animation:ruPulso 1.8s .5s ease-out infinite;}
.ru .flash{position:absolute;inset:0;z-index:10;background:#fff;pointer-events:none;animation:ruFlash .7s ease-out forwards;}

/* ── Polaroid revelada ── */
.ru .revelado{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;
  background:radial-gradient(ellipse at 50% 40%,#1c1812,var(--ink) 70%);opacity:0;pointer-events:none;transition:opacity .5s var(--ease);}
.ru .fase-disparado .revelado{opacity:1;pointer-events:auto;}
.ru .fase-disparado .visor{opacity:0;transform:scale(1.1);pointer-events:none;}
.ru .polaroid{width:min(74vw,360px);background:#f3eee4;padding:12px 12px 0;box-shadow:0 30px 70px -20px rgba(0,0,0,.8),0 0 0 1px rgba(0,0,0,.05);transform:rotate(-3deg);}
.ru .fase-disparado .polaroid{animation:ruCai 1.1s var(--ease) both;}
.ru .polaroid .img{aspect-ratio:4/5;background-size:cover;background-position:42% center;background-color:#2a2a2a;}
.ru .fase-disparado .polaroid .img{animation:ruRevela 4s .5s ease-out both;}
.ru .polaroid .leg{font-family:var(--fs);font-weight:300;font-size:clamp(26px,7.4vw,34px);color:#2a241c;text-align:center;margin:14px 0 0;line-height:1;}
.ru .polaroid .leg em{font-style:italic;color:#9c7c45;}
.ru .polaroid .marca{font-family:var(--fm);font-size:8.5px;letter-spacing:.3em;text-transform:uppercase;color:#8a8070;text-align:center;margin:8px 0 0;padding-bottom:16px;}
.ru .fase-disparado .polaroid .leg,.ru .fase-disparado .polaroid .marca{animation:ruFade 1.4s 2.6s var(--ease) both;}
.ru .frase{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(18px,4.8vw,22px);color:var(--tx-mid);margin:clamp(22px,4vh,34px) 0 0;text-align:center;}
.ru .fase-disparado .frase{animation:ruSobe 1.2s 3.2s var(--ease) both;}
.ru .rev-acoes{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:clamp(18px,3vh,28px);}
.ru .fase-disparado .rev-acoes{animation:ruFade 1.2s 3.8s var(--ease) both;}
.ru .desce{display:flex;flex-direction:column;align-items:center;gap:10px;text-decoration:none;}
.ru .desce span{font-family:var(--fm);font-size:9.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--tx-dim);}
.ru .desce i{width:1px;height:38px;background:linear-gradient(var(--g),transparent);transform-origin:top;animation:ruGota 2.2s ease-in-out infinite;}
.ru .outra{background:none;border:none;cursor:pointer;font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);}
.ru .outra:hover{color:var(--g);}

/* ── Rolo de filme ── */
.ru .rolo-sec{padding:clamp(64px,11vh,100px) 0 0;}
.ru .cab{padding:0 20px;max-width:560px;margin:0 auto 26px;}
.ru .cab h2{font-size:clamp(34px,9vw,48px);margin:14px 0 0;}
.ru .rolo{overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0 0 6px;}
.ru .rolo::-webkit-scrollbar{display:none;}
.ru .fita{display:flex;gap:0;width:max-content;padding:26px 18px;background:#0d0c0a;position:relative;
  --furo:repeating-linear-gradient(90deg,transparent 0 9px,#2b2721 9px 21px,transparent 21px 30px);}
.ru .fita::before,.ru .fita::after{content:"";position:absolute;left:0;right:0;height:9px;background:var(--furo);border-radius:2px;}
.ru .fita::before{top:8px;}
.ru .fita::after{bottom:8px;}
.ru .quadro{margin:0 5px;scroll-snap-align:center;width:min(72vw,340px);}
.ru .quadro .img{aspect-ratio:3/2;background-size:cover;background-position:center;border-radius:3px;filter:saturate(.95);}
.ru .quadro figcaption{display:flex;justify-content:space-between;margin-top:6px;font-family:var(--fm);font-size:9px;letter-spacing:.2em;color:#e0a33a;opacity:.85;}

/* ── Data ── */
.ru .corpo{max-width:560px;margin:0 auto;padding:clamp(64px,11vh,100px) 20px 40px;}
.ru .h-data{font-size:clamp(34px,9vw,48px);margin:14px 0 0;}
.ru .data-sel{display:grid;grid-template-columns:.8fr 1.4fr 1fr;gap:10px;margin-top:28px;}
.ru .data-sel select{appearance:none;-webkit-appearance:none;background:rgba(216,190,147,.05);border:1px solid rgba(216,190,147,.35);border-radius:12px;color:var(--tx);
  font-family:var(--fd);font-size:16px;padding:15px 12px;text-align:center;text-align-last:center;cursor:pointer;}
.ru .data-sel select:focus{outline:none;border-color:var(--g);}
.ru .data-sel option{background:#15130f;color:#eee;}
.ru .erro{text-align:center;margin-top:18px;font-family:var(--fs);font-style:italic;font-size:18px;color:#e8a0a0;}
.ru .contagem{text-align:center;margin-top:34px;animation:ruSobe .9s var(--ease) both;}
.ru .faltam{font-family:var(--fm);font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:var(--tx-dim);margin:0;}
.ru .num{font-family:var(--fs);font-weight:300;font-size:clamp(88px,26vw,140px);line-height:1;color:var(--g);margin:6px 0 0;font-variant-numeric:tabular-nums;text-shadow:0 0 40px rgba(216,190,147,.25);}
.ru .unid{font-family:var(--fs);font-style:italic;font-size:26px;color:var(--tx);margin:2px 0 0;}
.ru .quando{font-family:var(--fd);font-weight:300;font-size:17px;color:var(--tx-mid);margin:18px 0 0;}
.ru .guardem{font-family:var(--fs);font-style:italic;font-size:20px;color:var(--tx);margin:8px 0 0;}
.ru .proposta{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 16px;margin-top:12px;border-radius:14px;text-decoration:none;
  border:1px solid rgba(216,190,147,.5);color:var(--g);background:rgba(216,190,147,.04);transition:.4s var(--ease);}
.ru .proposta b{font-family:var(--fm);font-weight:400;font-size:11px;letter-spacing:.3em;text-transform:uppercase;}
.ru .proposta small{font-family:var(--fs);font-style:italic;font-size:15px;color:var(--tx-mid);}
.ru .acoes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;}
.ru .btn-g{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:22px 12px;border-radius:14px;text-decoration:none;transition:.4s var(--ease);
  border:1px solid rgba(216,190,147,.5);color:var(--g);background:rgba(216,190,147,.04);}
.ru .btn-g b{font-family:var(--fm);font-weight:400;font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;}
.ru .btn-g small{font-family:var(--fs);font-style:italic;font-size:14px;color:var(--tx-mid);margin-top:-2px;}
.ru .btn-g svg{width:22px;height:22px;}
.ru .proposta:hover,.ru .btn-g:hover{transform:translateY(-2px);}
.ru .guardar{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;padding:17px;border:1px dashed var(--line);border-radius:14px;text-decoration:none;
  font-family:var(--fm);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-mid);transition:.4s var(--ease);}
.ru .guardar:hover{border-color:var(--g);color:var(--g);}
.ru .guardar svg{width:16px;height:16px;}

.ru .sec{margin-top:clamp(56px,10vh,84px);}
.ru .sec-t{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:18px;}
.ru .sec-t h2{font-size:clamp(30px,8vw,40px);margin:0;}
.ru .sec-t .hint{white-space:nowrap;}
.ru .row{display:flex;align-items:center;gap:16px;padding:20px 2px;border-top:1px solid var(--line-soft);text-decoration:none;transition:.4s var(--ease);}
.ru .row:last-child{border-bottom:1px solid var(--line-soft);}
.ru .row .n{font-family:var(--fs);font-style:italic;font-size:22px;color:var(--g);width:30px;flex:none;}
.ru .row .t{flex:1;min-width:0;}
.ru .row .r{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);}
.ru .row .v{display:block;font-family:var(--fd);font-weight:300;font-size:clamp(16px,4.4vw,19px);color:var(--tx);margin-top:5px;overflow-wrap:anywhere;}
.ru .row .s{color:var(--tx-dim);transition:.4s var(--ease);}
.ru .row:hover{padding-left:10px;}
.ru .row:hover .s,.ru .row:hover .n{color:var(--g);}

.ru .fim{text-align:center;padding:clamp(64px,12vh,110px) 20px 56px;}
.ru .fim p{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(34px,9vw,52px);color:var(--tx);margin:0;}
.ru .fim p em{color:var(--g);}
.ru .fim img{width:34px;margin:26px auto 0;display:block;opacity:.7;}
.ru .fim .hint{margin-top:18px;}

@supports (animation-timeline: view()){
  .ru .rv{animation:ruSobe linear both;animation-timeline:view();animation-range:entry 0% entry 70%;}
}

@keyframes ruPisca{50%{opacity:.15}}
@keyframes ruRespira{50%{transform:scale(1.08)}}
@keyframes ruFoca{0%{transform:scale(1.35)}60%{transform:scale(.92)}100%{transform:scale(1)}}
@keyframes ruPulso{0%{box-shadow:0 0 0 0 rgba(255,255,255,.5)}100%{box-shadow:0 0 0 22px rgba(255,255,255,0)}}
@keyframes ruFlash{0%{opacity:1}100%{opacity:0}}
@keyframes ruCai{0%{transform:rotate(4deg) scale(1.25) translateY(-30px);opacity:0}60%{opacity:1}100%{transform:rotate(-3deg) scale(1);opacity:1}}
@keyframes ruRevela{0%{filter:sepia(1) brightness(2.4) contrast(.35) blur(3px)}35%{filter:sepia(.7) brightness(1.5) contrast(.6) blur(1.5px)}100%{filter:none}}
@keyframes ruFade{from{opacity:0}to{opacity:1}}
@keyframes ruSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes ruGota{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
@keyframes ruBrilho{0%{left:-60%}35%,100%{left:130%}}
@media (prefers-reduced-motion:reduce){.ru *,.ru *::before,.ru *::after{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.01s!important;}}
`
