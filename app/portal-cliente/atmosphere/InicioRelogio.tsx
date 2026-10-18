'use client'

/* Topo da página inicial do portal (tema RL), como o do /photo:
   relógio grande (horas a branco, minutos a dourado), o dia por baixo
   e uma frase do dia sobre amor, esperança e a vida a dois.
   A frase muda todos os dias.
   Só frases com autoria conhecida e bem documentada. */

import { useEffect, useState } from 'react'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const FRASES: Array<{ texto: string; autor: string }> = [
  { texto: 'O amor não consiste em olhar um para o outro, mas em olhar juntos na mesma direção.', autor: 'Antoine de Saint-Exupéry' },
  { texto: 'Amor é fogo que arde sem se ver.', autor: 'Luís de Camões' },
  { texto: 'Envelhece comigo! O melhor ainda está para vir.', autor: 'Robert Browning' },
  { texto: 'O coração tem razões que a própria razão desconhece.', autor: 'Blaise Pascal' },
  { texto: 'O amor tudo desculpa, tudo crê, tudo espera, tudo suporta.', autor: '1 Coríntios 13' },
  { texto: 'O amor é paciente, o amor é bondoso.', autor: '1 Coríntios 13' },
  { texto: 'Duas almas e um só pensamento, dois corações e um só bater.', autor: 'Friedrich Halm' },
  { texto: 'A vida é uma flor da qual o amor é o mel.', autor: 'Victor Hugo' },
  { texto: 'Não há remédio para o amor senão amar mais.', autor: 'Henry David Thoreau' },
  { texto: 'Amar é encontrar na felicidade do outro a nossa própria felicidade.', autor: 'Gottfried Leibniz' },
  { texto: 'O amor é a poesia dos sentidos.', autor: 'Honoré de Balzac' },
]

const COND = "'Roboto Condensed', system-ui, sans-serif"
const GOLD = '#C9A84C'

function agoraLisboa() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false,
      year: 'numeric', month: 'numeric', day: '2-digit', weekday: 'short',
    }).formatToParts(new Date()).map(x => [x.type, x.value])
  )
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return {
    horas: p.hour === '24' ? '00' : p.hour,
    minutos: p.minute,
    data: `${DIAS[semana]} | ${MESES[Number(p.month) - 1]} ${p.day} ${p.year}`,
    dia: Math.floor(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / 86400000),
  }
}

/* "susana maria" → "Susana" */
const primeiro = (n?: string | null) => {
  const w = String(n ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

/* Contagem decrescente para o casamento (dias, horas, min, seg), a cada segundo */
function Contagem({ data }: { data: Date }) {
  const calc = () => {
    const ms = Math.max(0, data.getTime() - Date.now())
    return [Math.floor(ms / 86400000), Math.floor(ms % 86400000 / 3600000), Math.floor(ms % 3600000 / 60000), Math.floor(ms % 60000 / 1000)]
  }
  const [p, setP] = useState<number[] | null>(null)
  useEffect(() => { setP(calc()); const id = setInterval(() => setP(calc()), 1000); return () => clearInterval(id) }, [data.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps
  const lbl = ['Dias', 'Horas', 'Min', 'Seg']
  return (
    <div style={{
      maxWidth: 620, margin: '34px auto 0',
      borderRadius: 22, border: '1px solid rgba(201,168,76,.3)', background: 'rgba(17,17,17,.7)',
      backdropFilter: 'blur(14px)', boxShadow: '0 0 48px -22px rgba(201,168,76,.5)', padding: '18px 4px 6px',
    }}>
      <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
        Estamos a contar os dias
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 4 }}>
      {lbl.map((l, k) => (
        <div key={l} style={{ padding: '14px 4px', borderLeft: k ? '1px solid rgba(255,255,255,.07)' : 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 200, fontSize: 'clamp(32px, 4.6vw, 52px)', lineHeight: 1, color: k === 0 ? GOLD : '#fff' }}>
            {p ? String(p[k]).padStart(2, '0') : '--'}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,.45)' }}>{l}</div>
        </div>
      ))}
      </div>
    </div>
  )
}

export default function InicioRelogio({ fotoUrl, noiva, noivo, dataCasamento }: { fotoUrl?: string | null; noiva?: string | null; noivo?: string | null; dataCasamento?: Date | null }) {
  const a = primeiro(noiva), b = primeiro(noivo)
  const [t, setT] = useState<ReturnType<typeof agoraLisboa> | null>(null)
  const [i, setI] = useState<number | null>(null)
  const visivel = true

  useEffect(() => {
    const a = agoraLisboa()
    setT(a)
    setI(a.dia % FRASES.length)
    // a frase acompanha o dia: à meia-noite passa sozinha à seguinte
    const id = setInterval(() => { const n = agoraLisboa(); setT(n); setI(n.dia % FRASES.length) }, 10_000)
    return () => clearInterval(id)
  }, [])


  const f = i === null ? null : FRASES[i]
  return (
    <section style={{
      position: 'relative', overflow: 'hidden', textAlign: 'center', userSelect: 'none',
      padding: 'clamp(48px, 8vw, 84px) 20px clamp(44px, 7vw, 72px)', marginBottom: 28,
      borderRadius: 28, border: '1px solid rgba(201,168,76,.2)', background: '#0b0b0b',
    }} suppressHydrationWarning>
      {/* fundo: foto esbatida a preto e branco, brilho dourado, pontilhado e anéis finos (como no /photo) */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url('${fotoUrl || '/casamentos-2028.webp'}')`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'grayscale(1)', opacity: .3 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 50% at 50% 38%, rgba(201,168,76,0.12), transparent 70%)' }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: .4,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%, #000 25%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%, #000 25%, transparent 75%)',
      }} />
      <svg aria-hidden viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth="0.1"
        style={{ position: 'absolute', left: '50%', top: '40%', width: 1000, height: 1000, transform: 'translate(-50%, -50%)', opacity: .09, pointerEvents: 'none' }}>
        <circle cx="50" cy="50" r="18" /><circle cx="50" cy="50" r="30" strokeDasharray="0.5 1.2" /><circle cx="50" cy="50" r="44" />
      </svg>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #0b0b0b 0%, rgba(11,11,11,0.45) 20%, rgba(11,11,11,0.55) 65%, #0b0b0b 100%)' }} />

      <div style={{ position: 'relative' }}>
      {/* os noivos, no topo, por cima das horas */}
      {(a || b) && (
        <h1 className="inicio-nomes" style={{ margin: '0 0 30px', color: '#fff', fontWeight: 200, fontSize: 'clamp(46px, 7vw, 84px)', lineHeight: 1.04 }}>
          {a}{a && b && <em style={{ fontStyle: 'normal', color: GOLD }}> &amp; </em>}{b}
        </h1>
      )}
      {/* relógio */}
      <p style={{ fontFamily: COND, fontWeight: 100, lineHeight: .85, letterSpacing: '.02em', fontSize: 'clamp(84px, 11vw, 124px)', margin: 0 }}>
        <span style={{ color: 'rgba(255,255,255,.9)' }}>{t?.horas ?? '--'}</span>
        <span style={{ color: GOLD }}>{t?.minutos ?? '--'}</span>
      </p>
      <p style={{ fontFamily: COND, fontWeight: 300, color: 'rgba(255,255,255,.75)', fontSize: 'clamp(17px, 1.6vw, 20px)', letterSpacing: '.04em', margin: '12px 0 0', minHeight: '1.6em' }}>
        {t?.data ?? ''}
      </p>

      {/* frase do dia, sobre fundo pontilhado */}
      <div style={{ position: 'relative', marginTop: 38 }}>
        <div aria-hidden style={{
          position: 'absolute', left: 0, right: 0, top: -24, bottom: -24, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(201,168,76,0.16) 1px, transparent 1px)', backgroundSize: '18px 18px',
          maskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, #000 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, #000 25%, transparent 75%)',
        }} />
        {f && (
          <figure style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '0 8px' }}>
            <blockquote style={{
              fontFamily: "'Caveat', cursive", fontWeight: 500, color: 'rgba(255,255,255,.9)',
              fontSize: 'clamp(26px, 3.2vw, 36px)', lineHeight: 1.25, margin: 0,
              transition: 'opacity .3s, transform .3s', opacity: visivel ? 1 : 0, transform: visivel ? 'none' : 'translateY(6px)',
            }}>
              <span style={{ color: GOLD }}>“</span>{f.texto}<span style={{ color: GOLD }}>”</span>
            </blockquote>
            <figcaption style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'opacity .3s', opacity: visivel ? 1 : 0 }}>
              <span style={{ height: 1, width: 48, background: 'rgba(201,168,76,.5)', marginBottom: 8 }} />
              <span style={{ fontFamily: COND, fontSize: 13, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD }}>{f.autor}</span>
            </figcaption>
          </figure>
        )}
      </div>

      {/* contagem decrescente, por baixo da frase */}
      {dataCasamento && <Contagem data={dataCasamento} />}

      </div>
    </section>
  )
}
