'use client'

// Portal da reunião com a Inês, gestora do Sirius Park (parceria com o espaço, não noivos).
// Mesmo design dos portais /r, mas com conteúdo fixo: não vem do CRM.
// Contacto da Inês: 925 826 636

import { useEffect, useRef, useState } from 'react'
import { RLP_CSS } from '@/app/_lead/rlpCss'
import PorqueReuniao from '@/app/_lead/PorqueReuniao'
import RodaReels from '@/app/_lead/RodaReels'
import TestemunhoDestaque from '@/app/_lead/TestemunhoDestaque'

const WHATSAPP_RL = 'https://wa.me/351912932768'
const HERO = 'https://portal.rlphotovideo.pt/casamentos-2028.webp' // a mesma capa dos portais /r
const NOME = 'Inês'
const ESPACO = 'Sirius Park'
const DATA = '2026-11-25'
const HORA = '16:30'
const ALVO = `${DATA}T${HORA}:00`
const MAPS =`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ESPACO)}`

const PONTOS = [
  { n: '01', t: 'Quem somos', d: 'A RL Photo · Video, a equipa e a forma como contamos um casamento do primeiro ao último minuto.' },
  { n: '02', t: 'O vosso espaço', d: 'Como trabalham com os fornecedores, o que os casais mais vos pedem e o que é importante para vocês.' },
  { n: '03', t: 'Imagens do Sirius Park', d: 'Fotografia e vídeo dos casamentos no espaço, para o vosso site, redes sociais e materiais.' },
  { n: '04', t: 'Próximos passos', d: 'Se fizer sentido para os dois, combinamos como recomendar de parte a parte.' },
]

function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
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
    <div ref={ref} className={className} style={{ ...style, opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(22px)',
      transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(ALVO).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  const Unit = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-6xl sm:text-8xl tabular-nums" style={{ fontFamily: "'Roboto Condensed',sans-serif", fontWeight: 100, lineHeight: .9, color: 'var(--tx)' }}>{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] tracking-[0.26em] uppercase" style={{ fontFamily: "'Roboto Condensed',sans-serif", color: 'var(--tx-dim)' }}>{label}</span>
    </div>
  )
  const Sep = () => <span className="text-3xl sm:text-4xl self-start mt-2" style={{ color: 'var(--g)', opacity: .35 }}>·</span>
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <Unit v={t.d} label="Dias" /><Sep /><Unit v={t.h} label="Horas" /><Sep /><Unit v={t.m} label="Min" /><Sep /><Unit v={t.s} label="Seg" />
    </div>
  )
}

export default function PortalSiriusPark() {
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const prog = document.getElementById('rlp-prog')
      if (prog) prog.style.width = `${h > 0 ? (st / h) * 100 : 0}%`
      document.getElementById('rlp-bar')?.classList.toggle('s', st > 40)
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  const inicio = `${DATA.replace(/-/g, '')}T${HORA.replace(':', '')}00`
  const fim = `${DATA.replace(/-/g, '')}T173000`
  const titulo = `Reunião RL Photo · Video · ${ESPACO}`
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${inicio}/${fim}&location=${encodeURIComponent(ESPACO)}&ctz=Europe/Lisbon`
  const ics = () => {
    const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RL Photo//Video//PT', 'BEGIN:VEVENT',
      `DTSTART;TZID=Europe/Lisbon:${inicio}`, `DTEND;TZID=Europe/Lisbon:${fim}`, `SUMMARY:${titulo}`, `LOCATION:${ESPACO}`,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }))
    Object.assign(document.createElement('a'), { href: url, download: 'reuniao-rl-sirius-park.ics' }).click()
    URL.revokeObjectURL(url)
  }
  const wa = (msg: string) => `${WHATSAPP_RL}?text=${encodeURIComponent(msg)}`

  return (
    <div className="rl-portal min-h-screen">
      <style>{RLP_CSS}</style>
      <div className="rlp-grain" aria-hidden />
      <div className="rlp-vig" aria-hidden />
      <div id="rlp-prog" className="rlp-prog" aria-hidden />

      <header id="rlp-bar" className="rlp-bar" style={{ top: 0 }}>
        <a href="/parceria/sirius-park" className="rlp-mono" aria-label="RL Photo · Video"><span>RL</span><i>Photo · Video</i></a>
        <a href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer" className="rlp-link-u"><span>O nosso site</span><span className="a">→</span></a>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: '92svh' }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO})` }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,10,8,.35) 0%, rgba(11,10,8,.55) 45%, var(--ink) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(11,10,8,.62) 0%, rgba(11,10,8,.15) 55%, transparent 100%)' }} />
        </div>
        <div className="rlp-wrap relative z-10 w-full" style={{ paddingBottom: 'clamp(48px,8vh,110px)' }}>
          <FadeIn delay={80}><span className="rlp-eyebrow">RL Photo · Video × {ESPACO}</span></FadeIn>
          <FadeIn delay={220}>
            <h1 className="rlp-h1" style={{ fontSize: 'clamp(42px,8vw,112px)', margin: '18px 0 0', maxWidth: '15ch' }}>Reunião Marcada</h1>
          </FadeIn>
          <FadeIn delay={380} className="mt-6 flex flex-col gap-3" style={{ maxWidth: '52ch' }}>
            <p className="rlp-ed" style={{ fontSize: 'clamp(20px,2.4vw,30px)', lineHeight: 1.2 }}><em>Olá, {NOME}</em></p>
            <p style={{ fontFamily: "'Roboto Condensed',sans-serif", fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx-mid)' }}>
              25 de Novembro de 2026 · {HORA} · Presencial no {ESPACO}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── CONTAGEM + DETALHES ── */}
      <section className="border-y" style={{ borderColor: 'var(--line-soft)', background: 'var(--ink-2)' }}>
        <div className="rlp-wrap flex flex-col items-center gap-8" style={{ paddingTop: 'clamp(46px,7vh,88px)', paddingBottom: 'clamp(46px,7vh,88px)' }}>
          <FadeIn><span className="rlp-eyebrow c">Faltam</span></FadeIn>
          <FadeIn delay={150}><Countdown /></FadeIn>
          <FadeIn delay={250} className="w-full">
            <div className="rlp-reu">
              <dl className="rlp-reu-det">
                <div><dt>Data</dt><dd>25 de Novembro de 2026</dd></div>
                <div><dt>Hora</dt><dd>{HORA}</dd></div>
                <div><dt>Local</dt><dd>{ESPACO}</dd></div>
              </dl>
              <div className="rlp-reu-acoes">
                <a href={wa(`Olá Rui! Sou a ${NOME} do ${ESPACO}. Confirmo a nossa reunião de 25 de novembro às ${HORA}.`)} target="_blank" rel="noopener noreferrer" className="rlp-btn full">
                  <span className="fill" /><span className="dot" />Confirmar Reunião
                </a>
                <a href={MAPS} target="_blank" rel="noopener noreferrer" className="rlp-btn ghost full">
                  <span className="fill" /><span className="dot" />Ver localização
                </a>
              </div>
              <div className="rlp-reu-sec">
                <a href={gcal} target="_blank" rel="noopener noreferrer" className="rlp-calbtn">Google</a>
                <button onClick={ics} className="rlp-calbtn">Apple</button>
                <a href={wa(`Olá Rui! Sou a ${NOME} do ${ESPACO}. Precisava de mudar a nossa reunião de 25 de novembro.`)} target="_blank" rel="noopener noreferrer" className="rlp-calbtn">Alterar reunião</a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── UMA CONVERSA, NÃO UMA PROPOSTA (versão espaços) ── */}
      <PorqueReuniao tipo="espaco" />

      {/* ── O QUE VAMOS FALAR ── */}
      <section className="rlp-sec">
        <div className="rlp-wrap" style={{ maxWidth: 1000 }}>
          <FadeIn className="flex flex-col items-center text-center gap-4 mb-12">
            <span className="rlp-eyebrow c">Dia 25, no {ESPACO}</span>
            <h2 className="rlp-h2">O que vamos <em>conversar</em></h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PONTOS.map((p, i) => (
              <FadeIn key={p.n} delay={i * 100}>
                <div className="rlp-card h-full" style={{ padding: 'clamp(24px,3vw,36px)' }}>
                  <span style={{ fontFamily: "'Roboto Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '.22em', color: 'var(--g)' }}>{p.n}</span>
                  <p className="rlp-h2" style={{ fontSize: 'clamp(22px,2.6vw,30px)', marginTop: 10 }}>{p.t}</p>
                  <p className="rlp-lede" style={{ fontSize: 15, marginTop: 10 }}>{p.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          {/* Apresentação da reunião (protegida por password, ver apresentacao/acesso.ts) */}
          <FadeIn delay={200} className="flex flex-col items-center text-center gap-4" style={{ marginTop: 48 }}>
            <p className="rlp-lede" style={{ fontSize: 15 }}>A apresentação que vamos mostrar no dia</p>
            <a href="/parceria/sirius-park/apresentacao" className="rlp-btn"><span className="fill" /><span className="dot" />Ver apresentação</a>
          </FadeIn>
        </div>
      </section>

      {/* ── VÍDEOS DA MARCA PESSOAL + TESTEMUNHO ── */}
      <RodaReels />
      <TestemunhoDestaque />

      <div className="rlp-div" />

      {/* ── UMA PALAVRA NOSSA ── */}
      <section className="rlp-sec" style={{ background: 'var(--ink-2)' }}>
        <div className="rlp-wrap">
          <FadeIn>
            <div className="rlp-card" style={{ padding: 'clamp(32px,5vw,64px)' }}>
              <div className="flex flex-col gap-5 relative z-10">
                <span className="rlp-eyebrow">Uma palavra nossa</span>
                <p className="rlp-ed" style={{ fontSize: 'clamp(22px,3vw,34px)', fontStyle: 'italic', lineHeight: 1.45, color: 'var(--tx)' }}>
                  &ldquo;Um casamento bonito nasce de um bom espaço e de uma equipa que trabalha em conjunto. Obrigado por nos receberem, {NOME}.&rdquo;
                </p>
                <p className="rlp-ed" style={{ fontSize: 18, color: 'var(--g)' }}>Rui Gonçalves, RL Photo · Video</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="rlp-div" />

      {/* ── SOBRE NÓS ── */}
      <section className="rlp-sec">
        <div className="rlp-wrap flex flex-col items-center text-center gap-6" style={{ maxWidth: 760 }}>
          <FadeIn><span className="rlp-eyebrow c">Quem somos</span></FadeIn>
          <FadeIn delay={120}><h2 className="rlp-h2">RL Photo · Video</h2></FadeIn>
          <FadeIn delay={240}>
            <p className="rlp-lede">Somos especializados em fotografia e vídeo de casamentos. O nosso objetivo é preservar a autenticidade de cada momento: a emoção, os detalhes, as histórias que só acontecem uma vez.</p>
          </FadeIn>
          <FadeIn delay={340}>
            <p className="rlp-ed" style={{ fontStyle: 'italic', fontSize: 'clamp(18px,2.4vw,26px)', color: 'var(--g)', marginTop: 8 }}>registamos com foco na verdade</p>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="rlp-foot">
        <div className="rlp-wrap">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8">
            <FadeIn>
              <h2 className="rlp-h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)', maxWidth: '14ch' }}>Até dia <em>25</em></h2>
              <a href={wa(`Olá Rui! Sou a ${NOME} do ${ESPACO}.`)} target="_blank" rel="noopener noreferrer" className="rlp-btn" style={{ marginTop: 28 }}><span className="fill" /><span className="dot" />Falar connosco</a>
            </FadeIn>
            <FadeIn delay={100} className="flex flex-col gap-3">
              <h5>Contactos</h5>
              <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
              <a href="tel:+351912932768">912 932 768</a>
              <span style={{ color: 'var(--tx-mid)' }}>Pinhal Novo, Palmela</span>
            </FadeIn>
            <FadeIn delay={180} className="flex flex-col gap-3">
              <h5>Seguir</h5>
              <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://www.facebook.com/people/RL_Photo/100089058572642/" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://rlphotovideo.pt" target="_blank" rel="noopener noreferrer">rlphotovideo.pt</a>
            </FadeIn>
          </div>
        </div>
        <div className="end"><span>© RL Photo · Video</span><span>registamos com foco na verdade</span></div>
      </footer>

      <a href={wa(`Olá! Sou a ${NOME} do ${ESPACO} e estou a ver o portal da reunião.`)} target="_blank" rel="noopener noreferrer" className="rlp-wa" aria-label="WhatsApp">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0012.05 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 5.45 0 9.884 4.434 9.881 9.892-.003 5.45-4.437 9.884-9.885 9.884zm5.422-7.403c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
      </a>
    </div>
  )
}
