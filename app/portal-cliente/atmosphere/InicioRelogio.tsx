'use client'

/* Topo da página inicial do portal (tema RL), como o do /photo:
   relógio grande (horas a branco, minutos a dourado), o dia por baixo
   e uma frase do dia sobre amor, esperança e a vida a dois.
   A frase muda todos os dias; "Outra frase" passa à seguinte.
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

export default function InicioRelogio() {
  const [t, setT] = useState<ReturnType<typeof agoraLisboa> | null>(null)
  const [i, setI] = useState<number | null>(null)
  const [visivel, setVisivel] = useState(true)

  useEffect(() => {
    const a = agoraLisboa()
    setT(a)
    setI(a.dia % FRASES.length)
    const id = setInterval(() => setT(agoraLisboa()), 10_000)
    return () => clearInterval(id)
  }, [])

  function outra() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setI(x => ((x ?? 0) + 1) % FRASES.length); return }
    setVisivel(false)
    setTimeout(() => { setI(x => ((x ?? 0) + 1) % FRASES.length); setVisivel(true) }, 280)
  }

  const f = i === null ? null : FRASES[i]
  return (
    <section style={{ position: 'relative', textAlign: 'center', padding: '28px 0 46px', userSelect: 'none' }} suppressHydrationWarning>
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
            <button type="button" onClick={outra} style={{
              marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
              padding: '6px 16px', fontFamily: COND, fontSize: 13, color: 'rgba(255,255,255,.5)',
            }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" /></svg>
              Outra frase
            </button>
          </figure>
        )}
      </div>
    </section>
  )
}
