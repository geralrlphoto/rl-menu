'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

/* ─────────────────────────────────────────────
   CONTEÚDO — edita aqui sem tocar no layout
───────────────────────────────────────────── */
const COPY = {
  hero: {
    tagline: 'Educate · Inspire · Elevate',
    headline: 'A mentoria que transforma\nprofissionais em referências.',
    sub: 'Para fotógrafos e videógrafos de casamento que querem crescer com intenção, clareza e excelência.',
    cta: 'Junta-te à lista de espera',
  },
  manifesto: {
    label: 'O Manifesto',
    title: 'Há um antes e um depois.',
    body: [
      'Existe um momento em que sentimos que o nosso trabalho merece mais — mais consistência, mais reconhecimento, mais alinhamento com o que realmente somos. Mas o mercado dos casamentos é exigente, e aprender sozinho custa tempo e erros evitáveis.',
      'A RL Wedding Mentor nasceu dessa convicção: que a próxima geração de profissionais de casamento merece um espaço onde técnica, negócio e identidade caminham juntos.',
      'Não é só aprender a fotografar ou filmar. É aprender a posicionar-te, a comunicar o teu valor, a construir uma carreira que aguente o peso dos anos — e que te faça acordar animado para cada trabalho.',
    ],
  },
  ofertas: {
    label: 'O Que Ofereço',
    title: 'Escolhe o teu caminho.',
    items: [
      {
        icon: '◎',
        name: 'Mentoria 1:1',
        desc: 'Sessões individuais adaptadas ao teu momento. Portfólio, posicionamento, preços, workflow — trabalhamos o que precisas.',
        badge: 'Personalizado',
      },
      {
        icon: '◈',
        name: 'Workshops Presenciais',
        desc: 'Dias intensivos de shooting, edição e estratégia com um grupo pequeno e seleto. Aprende fazendo.',
        badge: 'Em breve',
      },
      {
        icon: '◇',
        name: 'Curso Online',
        desc: 'Formação estruturada ao teu ritmo — desde os fundamentos até ao business por trás da fotografia de casamento.',
        badge: 'Em breve',
      },
      {
        icon: '◉',
        name: 'Comunidade',
        desc: 'Um espaço privado para partilhar trabalho, receber feedback honesto e crescer com pares que levam o ofício a sério.',
        badge: 'Em breve',
      },
    ],
  },
  paraQuem: {
    label: 'Para Quem É',
    title: 'Reconheces-te\nnalgumas destas frases?',
    items: [
      'Já tens algum trabalho, mas sentes que a evolução estagnada.',
      'Cobras menos do que o teu trabalho vale e não sabes como mudar isso.',
      'Queres ter um posicionamento claro, mas não sabes por onde começar.',
      'Sentes que és bom a fotografar/filmar, mas mau a gerir o negócio.',
      'Queres trabalhar menos, ganhar mais e sentir orgulho em cada entrega.',
    ],
  },
  depoimentos: [
    {
      quote: '"Depoimento do cliente aqui — transforma a tua experiência numa frase que outros queiram ter."',
      name: 'Nome Apelido',
      role: 'Fotógrafo de Casamento',
    },
    {
      quote: '"Outro depoimento poderoso que mostre resultados concretos e emoção genuína."',
      name: 'Nome Apelido',
      role: 'Videógrafo',
    },
    {
      quote: '"Um terceiro testemunho que reforce a credibilidade e o impacto da mentoria."',
      name: 'Nome Apelido',
      role: 'Fotógrafa de Casamento',
    },
  ],
  cta: {
    label: 'Lista de Espera',
    title: 'O próximo passo\nstá à tua espera.',
    sub: 'Deixa o teu email e sê o primeiro a saber quando abrirmos vagas. Sem spam. Só o essencial.',
    button: 'Quero ser notificado',
  },
  footer: {
    email: 'geral.rlphoto@gmail.com',
    instagram: '@rlphoto_fotografia.video',
    instagramUrl: 'https://instagram.com/rlphoto_fotografia.video',
  },
}

/* ─────────────────────────────────────────────
   COMPONENTE DE REVEAL AO SCROLL
───────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1'
            ;(e.target as HTMLElement).style.transform = 'translateY(0)'
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function WeddingMentorPage() {
  useReveal()

  return (
    <>
      {/* Google Fonts extra */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');

        .wm-root {
          background: #efe7d6;
          color: #23262d;
          font-family: 'Jost', sans-serif;
          --gold: #9a8358;
          --gold-dark: #86703f;
          --ink: #23262d;
          --cream: #efe7d6;
          --line: rgba(35,38,45,.12);
        }

        /* Textura subtil */
        .wm-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        /* Vinheta */
        .wm-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(180,155,110,.10) 100%);
          pointer-events: none;
          z-index: 0;
        }

        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1);
        }

        @media (prefers-reduced-motion: reduce) {
          [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        .wm-label {
          font-family: 'Space Mono', monospace;
          font-size: .6rem;
          letter-spacing: .35em;
          text-transform: uppercase;
          color: var(--gold);
        }

        .wm-display {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          line-height: 1.1;
        }

        .wm-btn {
          display: inline-flex;
          align-items: center;
          gap: .6rem;
          padding: .75rem 2rem;
          border-radius: 99px;
          border: 1.5px solid var(--ink);
          font-family: 'Space Mono', monospace;
          font-size: .6rem;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--ink);
          background: transparent;
          cursor: pointer;
          transition: background .3s, color .3s, border-color .3s;
        }
        .wm-btn:hover {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }

        .wm-btn-gold {
          border-color: var(--gold);
          color: var(--gold);
        }
        .wm-btn-gold:hover {
          background: var(--gold-dark);
          color: var(--cream);
          border-color: var(--gold-dark);
        }

        .wm-divider {
          width: 3rem;
          height: 1px;
          background: var(--gold);
          opacity: .6;
        }

        .wm-input {
          background: transparent;
          border: none;
          border-bottom: 1.5px solid var(--line);
          outline: none;
          font-family: 'Jost', sans-serif;
          font-size: .9rem;
          color: var(--ink);
          padding: .6rem 0;
          width: 100%;
          transition: border-color .3s;
        }
        .wm-input::placeholder { color: rgba(35,38,45,.35); }
        .wm-input:focus { border-bottom-color: var(--gold); }

        .wm-card {
          border: 1px solid var(--line);
          padding: 2.5rem 2rem;
          background: rgba(255,255,255,.35);
          backdrop-filter: blur(2px);
          transition: background .3s, border-color .3s;
        }
        .wm-card:hover {
          background: rgba(255,255,255,.6);
          border-color: rgba(154,131,88,.25);
        }

        .wm-check {
          width: 1.1rem;
          height: 1.1rem;
          border: 1.5px solid var(--gold);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: .1rem;
        }
        .wm-check::after {
          content: '';
          width: .4rem;
          height: .4rem;
          border-radius: 50%;
          background: var(--gold);
        }
      `}</style>

      <div className="wm-root relative min-h-screen">

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6">
          <Link href="/" className="wm-label opacity-60 hover:opacity-100 transition-opacity">
            ← Voltar
          </Link>
          <a href="#lista" className="wm-btn wm-btn-gold text-[.55rem]">
            Lista de Espera
          </a>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-24">

          {/* Logo HD transparente */}
          <div data-reveal className="mb-10 flex items-center justify-center" style={{ width: '100%', maxWidth: '320px', height: '180px' }}>
            <img
              src="/logo-mentor-hd.png"
              alt="RL Wedding Mentor"
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>

          <p data-reveal className="wm-label mb-6" style={{ transitionDelay: '.1s' }}>
            {COPY.hero.tagline}
          </p>

          <h1 data-reveal className="wm-display mb-8 max-w-3xl"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', transitionDelay: '.15s' }}>
            {COPY.hero.headline.split('\n').map((line, i) => (
              <span key={i}>{i > 0 ? <><br /><em>{line}</em></> : line}</span>
            ))}
          </h1>

          <p data-reveal className="max-w-xl text-center mb-12"
            style={{ fontFamily: "'Jost', sans-serif", fontSize: '.95rem', lineHeight: 1.75, color: 'rgba(35,38,45,.65)', transitionDelay: '.2s' }}>
            {COPY.hero.sub}
          </p>

          <div data-reveal style={{ transitionDelay: '.25s' }}>
            <a href="#lista" className="wm-btn">
              {COPY.hero.cta}
              <span style={{ fontSize: '.8rem' }}>↓</span>
            </a>
          </div>

          {/* Linha decorativa */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
            <div className="wm-divider" style={{ width: '1px', height: '3rem', background: '#9a8358' }} />
          </div>
        </section>

        {/* ── MANIFESTO ───────────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-6 sm:px-12 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-16 items-start">
            <div>
              <p data-reveal className="wm-label mb-5">{COPY.manifesto.label}</p>
              <h2 data-reveal className="wm-display mb-6"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', transitionDelay: '.05s' }}>
                {COPY.manifesto.title}
              </h2>
              <div data-reveal className="wm-divider" style={{ transitionDelay: '.1s' }} />
            </div>
            <div className="flex flex-col gap-6">
              {COPY.manifesto.body.map((p, i) => (
                <p data-reveal key={i}
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: '.92rem', lineHeight: 1.8, color: 'rgba(35,38,45,.7)', transitionDelay: `${.05 * i}s` }}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Separador */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12">
          <hr style={{ border: 'none', borderTop: '1px solid rgba(35,38,45,.1)' }} />
        </div>

        {/* ── O QUE OFEREÇO ───────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-6 sm:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p data-reveal className="wm-label mb-5">{COPY.ofertas.label}</p>
            <h2 data-reveal className="wm-display"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', transitionDelay: '.05s' }}>
              {COPY.ofertas.title}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {COPY.ofertas.items.map((item, i) => (
              <div data-reveal key={i} className="wm-card"
                style={{ transitionDelay: `${.08 * i}s` }}>
                <div className="flex items-start justify-between mb-5">
                  <span style={{ fontSize: '1.4rem', color: '#9a8358' }}>{item.icon}</span>
                  <span className="wm-label" style={{ fontSize: '.52rem', color: 'rgba(35,38,45,.4)' }}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="wm-display mb-3" style={{ fontSize: '1.7rem' }}>{item.name}</h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '.88rem', lineHeight: 1.75, color: 'rgba(35,38,45,.6)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Separador */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12">
          <hr style={{ border: 'none', borderTop: '1px solid rgba(35,38,45,.1)' }} />
        </div>

        {/* ── PARA QUEM É ─────────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-6 sm:px-12 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-16 items-center">
            <div>
              <p data-reveal className="wm-label mb-5">{COPY.paraQuem.label}</p>
              <h2 data-reveal className="wm-display"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', transitionDelay: '.05s' }}>
                {COPY.paraQuem.title.split('\n').map((line, i) => (
                  <span key={i}>{i > 0 ? <><br /><em>{line}</em></> : line}</span>
                ))}
              </h2>
            </div>
            <ul className="flex flex-col gap-5">
              {COPY.paraQuem.items.map((item, i) => (
                <li data-reveal key={i} className="flex items-start gap-4"
                  style={{ transitionDelay: `${.07 * i}s` }}>
                  <div className="wm-check" />
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '.9rem', lineHeight: 1.7, color: 'rgba(35,38,45,.75)' }}>
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Separador */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12">
          <hr style={{ border: 'none', borderTop: '1px solid rgba(35,38,45,.1)' }} />
        </div>

        {/* ── DEPOIMENTOS ─────────────────────────────────────────── */}
        <section className="relative z-10 py-28 px-6 sm:px-12 max-w-5xl mx-auto">
          <p data-reveal className="wm-label text-center mb-16">Depoimentos</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {COPY.depoimentos.map((t, i) => (
              <div data-reveal key={i} className="flex flex-col gap-5" style={{ transitionDelay: `${.08 * i}s` }}>
                <div className="wm-divider" />
                <p className="wm-display"
                  style={{ fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.65, color: 'rgba(35,38,45,.8)' }}>
                  {t.quote}
                </p>
                <div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '.82rem', fontWeight: 500, letterSpacing: '.05em', color: '#23262d' }}>
                    {t.name}
                  </p>
                  <p className="wm-label" style={{ fontSize: '.52rem', color: 'rgba(35,38,45,.45)', marginTop: '.2rem' }}>
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL + FORMULÁRIO ──────────────────────────────── */}
        <section id="lista" className="relative z-10 py-28 px-6 sm:px-12"
          style={{ background: 'rgba(35,38,45,.04)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <p data-reveal className="wm-label mb-6">{COPY.cta.label}</p>
            <h2 data-reveal className="wm-display mb-6"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', transitionDelay: '.05s' }}>
              {COPY.cta.title.split('\n').map((line, i) => (
                <span key={i}>{i > 0 ? <><br /><em>{line}</em></> : line}</span>
              ))}
            </h2>
            <p data-reveal className="mb-12"
              style={{ fontFamily: "'Jost', sans-serif", fontSize: '.9rem', lineHeight: 1.8, color: 'rgba(35,38,45,.6)', transitionDelay: '.1s' }}>
              {COPY.cta.sub}
            </p>

            {/* Formulário simples — liga ao teu serviço de email */}
            <form data-reveal
              style={{ transitionDelay: '.15s' }}
              onSubmit={(e) => { e.preventDefault(); alert('Obrigado! Vais ser notificado em breve.') }}
              className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end max-w-md mx-auto">
              <div className="flex-1 text-left">
                <label className="wm-label block mb-2" style={{ fontSize: '.52rem' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="o.teu@email.com"
                  className="wm-input"
                />
              </div>
              <button type="submit" className="wm-btn wm-btn-gold whitespace-nowrap">
                {COPY.cta.button}
              </button>
            </form>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="relative z-10 py-12 px-6 sm:px-12 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <a href={`mailto:${COPY.footer.email}`}
                className="wm-label hover:text-current transition-opacity opacity-50 hover:opacity-100"
                style={{ fontSize: '.58rem' }}>
                {COPY.footer.email}
              </a>
              <a href={COPY.footer.instagramUrl} target="_blank" rel="noopener noreferrer"
                className="wm-label hover:text-current transition-opacity opacity-50 hover:opacity-100"
                style={{ fontSize: '.58rem' }}>
                {COPY.footer.instagram}
              </a>
            </div>

            <Link href="/"
              className="wm-label opacity-40 hover:opacity-80 transition-opacity"
              style={{ fontSize: '.55rem' }}>
              RL Photo.Video ↗
            </Link>
          </div>

          <div className="mt-8 pt-6 flex items-center justify-center gap-3"
            style={{ borderTop: '1px solid rgba(35,38,45,.1)' }}>
            <div className="wm-divider" style={{ width: '2rem' }} />
            <span className="wm-label opacity-30" style={{ fontSize: '.5rem' }}>
              RL Wedding Mentor · {new Date().getFullYear()}
            </span>
            <div className="wm-divider" style={{ width: '2rem' }} />
          </div>
        </footer>

      </div>
    </>
  )
}
