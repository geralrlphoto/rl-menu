'use client'

// ─────────────────────────────────────────────────────────────────────────
// OPÇÃO 2 da página de marcas — "Película".
// Três fotogramas a toda a altura; o que está em foco abre, os outros
// encolhem e perdem cor. Vê-se em /?opcao=2 (a / normal continua a Opção 1).
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const MARCAS = [
  {
    href: '/photo',
    nome: 'RL Photo.Video',
    area: 'Casamentos',
    frase: 'O dia inteiro contado com calma, luz natural e verdade.',
    foto: '/eventos-hero-2026.webp',
    posicao: 'center 40%',
    logo: '/logo-photovideo-hd.png',
    logoEscala: 1.9,          // o PNG tem muita margem à volta
    acento: '#d9b76a',
  },
  {
    href: '/media',
    nome: 'RL Prod',
    area: 'Marcas',
    frase: 'Conteúdo com intenção, feito para ser visto e lembrado.',
    foto: '/login hero.png',
    posicao: 'center 50%',
    logo: '/logo-rl-prod-black.png',
    logoEscala: 1,
    acento: '#8fb3d9',
  },
  {
    href: '/wedding-mentor',
    nome: 'RL Wedding Mentor',
    area: 'Formação',
    frase: 'Educar, inspirar e elevar quem fotografa e filma casamentos.',
    foto: '/casamentos-2027.jpg',
    posicao: 'center 45%',
    logo: '/logo-mentor-hd.png',
    logoEscala: 1,
    acento: '#e0b7a3',
  },
]

// Contador em estilo timecode, só decorativo
function Timecode() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const inicio = Date.now()
    const id = setInterval(() => setT(Date.now() - inicio), 40)
    return () => clearInterval(id)
  }, [])
  const f = Math.floor((t / 40) % 25)
  const s = Math.floor(t / 1000) % 60
  const m = Math.floor(t / 60000) % 60
  const dd = (n: number) => String(n).padStart(2, '0')
  return <>00:{dd(m)}:{dd(s)}:{dd(f)}</>
}

// Furos da película
function Furos() {
  return (
    <div className="op2-furos" aria-hidden="true">
      {Array.from({ length: 48 }).map((_, i) => <span key={i} />)}
    </div>
  )
}

export default function MarcasOpcao2() {
  const router = useRouter()
  const [foco, setFoco] = useState<number | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPronto(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Teclado: 1/2/3 e setas escolhem, Enter entra
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['1', '2', '3'].includes(e.key)) setFoco(Number(e.key) - 1)
      else if (e.key === 'ArrowRight') setFoco(f => f === null ? 0 : (f + 1) % MARCAS.length)
      else if (e.key === 'ArrowLeft') setFoco(f => f === null ? MARCAS.length - 1 : (f + MARCAS.length - 1) % MARCAS.length)
      else if (e.key === 'Escape') setFoco(null)
      else if (e.key === 'Enter' && foco !== null && document.activeElement === document.body) router.push(MARCAS[foco].href)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [foco, router])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Space+Mono:wght@400;700&display=swap');

        .op2 { position: fixed; inset: 0; background: #070605; color: #f3ede2; overflow: hidden; display: flex; flex-direction: column; }
        .op2 * { box-sizing: border-box; }
        .op2-mono { font-family: 'Space Mono', monospace; text-transform: uppercase; }
        .op2-serif { font-family: 'Cormorant Garamond', serif; }

        /* Faixas de película em cima e em baixo */
        .op2-faixa { position: relative; height: 38px; flex-shrink: 0; display: flex; align-items: center; padding: 0 22px; gap: 18px; z-index: 5; }
        .op2-furos { position: absolute; inset: 0 0 auto 0; top: 50%; transform: translateY(-50%); display: flex; justify-content: space-between; padding: 0 14px; pointer-events: none; }
        .op2-furos span { width: 14px; height: 9px; border-radius: 2px; background: rgba(243,237,226,.07); }
        .op2-faixa-txt { position: relative; z-index: 1; font-size: .5rem; letter-spacing: .32em; color: rgba(243,237,226,.42); background: #070605; padding: 0 10px; white-space: nowrap; }

        /* Os três fotogramas */
        .op2-palco { flex: 1; display: flex; gap: 6px; padding: 0 6px; min-height: 0; }
        .op2-quadro {
          position: relative; flex: 1 1 0%; overflow: hidden; border-radius: 4px;
          text-decoration: none; color: inherit; outline: none;
          transition: flex .9s cubic-bezier(.19,1,.22,1);
          opacity: 0; transform: translateY(30px);
        }
        .op2.pronto .op2-quadro { opacity: 1; transform: none; transition: flex .9s cubic-bezier(.19,1,.22,1), opacity 1s ease, transform 1.1s cubic-bezier(.19,1,.22,1); }
        .op2-quadro.aberto { flex: 2.4 1 0%; }
        .op2-quadro.fechado { flex: .62 1 0%; }

        .op2-foto { position: absolute; inset: -3%; transition: transform 6s ease-out, filter .9s ease; }
        .op2-quadro.aberto .op2-foto { transform: scale(1.08); }
        .op2-quadro.fechado .op2-foto { filter: grayscale(1) brightness(.45); }
        .op2-veu { position: absolute; inset: 0; transition: background .9s ease; background: linear-gradient(to top, rgba(7,6,5,.92) 0%, rgba(7,6,5,.45) 45%, rgba(7,6,5,.35) 100%); }
        .op2-quadro.aberto .op2-veu { background: linear-gradient(to top, rgba(7,6,5,.9) 0%, rgba(7,6,5,.15) 50%, rgba(7,6,5,.1) 100%); }

        /* Cantos de enquadramento, como no visor */
        .op2-canto { position: absolute; width: 22px; height: 22px; border-color: rgba(243,237,226,.55); border-style: solid; border-width: 0; opacity: 0; transition: opacity .5s ease, inset .6s cubic-bezier(.19,1,.22,1); }
        .op2-quadro.aberto .op2-canto { opacity: 1; }
        .op2-canto.a { top: 26px; left: 26px; border-top-width: 1px; border-left-width: 1px; }
        .op2-canto.b { top: 26px; right: 26px; border-top-width: 1px; border-right-width: 1px; }
        .op2-canto.c { bottom: 26px; left: 26px; border-bottom-width: 1px; border-left-width: 1px; }
        .op2-canto.d { bottom: 26px; right: 26px; border-bottom-width: 1px; border-right-width: 1px; }

        /* Topo do fotograma */
        .op2-topo { position: absolute; top: 34px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; font-size: .5rem; letter-spacing: .3em; color: rgba(243,237,226,.6); }
        .op2-rec { display: inline-flex; align-items: center; gap: 8px; opacity: 0; transition: opacity .4s ease; }
        .op2-quadro.aberto .op2-rec { opacity: 1; }
        @keyframes op2Pisca { 0%,100% { opacity: 1 } 50% { opacity: .15 } }
        .op2-rec i { width: 7px; height: 7px; border-radius: 50%; background: #e0493b; animation: op2Pisca 1.2s steps(2) infinite; }

        /* Logo ao centro */
        .op2-logo { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); width: min(62%, 300px); aspect-ratio: 16/10; transition: transform .9s cubic-bezier(.19,1,.22,1), opacity .6s ease; filter: brightness(0) invert(1); opacity: .92; }
        .op2-quadro.fechado .op2-logo { transform: translate(-50%, -50%) scale(.72); opacity: .5; }

        /* Base do fotograma */
        .op2-base { position: absolute; left: 40px; right: 40px; bottom: 38px; }
        .op2-area { font-weight: 300; line-height: .95; font-size: clamp(2.2rem, 4.2vw, 4.4rem); white-space: nowrap; transition: font-size .9s cubic-bezier(.19,1,.22,1), opacity .5s ease; }
        .op2-quadro.fechado .op2-area { font-size: clamp(1.3rem, 2vw, 1.9rem); opacity: .7; }
        .op2-rotulo { transition: opacity .4s ease; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .op2-quadro.fechado .op2-rotulo { opacity: 0; }
        .op2-extra { max-height: 0; overflow: hidden; opacity: 0; transition: max-height .8s cubic-bezier(.19,1,.22,1), opacity .5s ease; }
        .op2-quadro.aberto .op2-extra { max-height: 200px; opacity: 1; transition-delay: .15s; }
        .op2-entrar { display: inline-flex; align-items: center; gap: 12px; margin-top: 22px; padding: 12px 26px; border-radius: 99px; border: 1px solid rgba(243,237,226,.6); font-size: .58rem; letter-spacing: .3em; transition: background .3s ease, color .3s ease, gap .3s ease; }
        .op2-quadro:hover .op2-entrar { background: #f3ede2; color: #070605; gap: 18px; }

        .op2-quadro:focus-visible { box-shadow: inset 0 0 0 1px rgba(243,237,226,.7); }

        @media (prefers-reduced-motion: reduce) {
          .op2-quadro, .op2-foto, .op2-logo, .op2-area { transition: none !important; }
          .op2-rec i { animation: none; }
        }

        @media (max-width: 899px) {
          .op2 { position: relative; min-height: 100vh; }
          .op2-palco { flex: none; flex-direction: column; padding: 0 8px; gap: 8px; }
          .op2-faixa { padding: 0 10px; gap: 8px; }
          .op2-faixa-txt { letter-spacing: .16em; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; }
          .op2-quadro, .op2-quadro.aberto, .op2-quadro.fechado { flex: none; height: 30vh; min-height: 220px; }
          .op2-quadro .op2-foto { filter: none !important; }
          .op2-quadro .op2-extra { max-height: 0 !important; opacity: 0 !important; }
          .op2-quadro.fechado .op2-logo { transform: translate(-50%, -50%); opacity: .92; }
          .op2-quadro.fechado .op2-area { font-size: 2rem; opacity: 1; }
          .op2-quadro.fechado .op2-rotulo { opacity: 1; }
          .op2-logo { width: 44%; top: 40%; }
          .op2-base { left: 22px; right: 22px; bottom: 20px; }
          .op2-area { font-size: 2rem; }
          .op2-topo { top: 18px; left: 22px; right: 22px; }
          .op2-dica { display: none; }
        }
      `}</style>

      <div className={`op2${pronto ? ' pronto' : ''}`}>

        {/* Faixa de cima */}
        <div className="op2-faixa op2-mono">
          <Furos />
          <span className="op2-faixa-txt">RL · Universo de Marcas</span>
          <span className="op2-faixa-txt" style={{ marginLeft: 'auto' }}>
            TC <Timecode />
          </span>
        </div>

        <main className="op2-palco" aria-label="Seleciona uma marca" onMouseLeave={() => setFoco(null)}>
          {MARCAS.map((m, i) => {
            const estado = foco === null ? '' : foco === i ? ' aberto' : ' fechado'
            return (
              <Link key={m.href} href={m.href}
                className={`op2-quadro${estado}`}
                style={{ transitionDelay: pronto ? '0ms' : `${i * 120}ms` }}
                onMouseEnter={() => setFoco(i)}
                onFocus={() => setFoco(i)}
                aria-label={`Entrar em ${m.nome} — ${m.area}`}>

                <div className="op2-foto">
                  <Image src={m.foto} alt="" fill priority sizes="(max-width: 899px) 100vw, 60vw"
                    style={{ objectFit: 'cover', objectPosition: m.posicao }} />
                </div>
                <div className="op2-veu" />

                <span className="op2-canto a" /><span className="op2-canto b" />
                <span className="op2-canto c" /><span className="op2-canto d" />

                <div className="op2-topo op2-mono">
                  <span>Fotograma 0{i + 1}</span>
                  <span className="op2-rec"><i /> Rec</span>
                </div>

                <div className="op2-logo">
                  <div style={{ position: 'absolute', inset: 0, transform: `scale(${m.logoEscala})` }}>
                    <Image src={m.logo} alt="" fill sizes="300px" style={{ objectFit: 'contain' }} />
                  </div>
                </div>

                <div className="op2-base">
                  <p className="op2-mono op2-rotulo" style={{ fontSize: '.52rem', letterSpacing: '.32em', color: m.acento, marginBottom: 10 }}>
                    0{i + 1} — {m.nome}
                  </p>
                  <h2 className="op2-area op2-serif">
                    <span style={{ fontStyle: 'italic' }}>{m.area.charAt(0)}</span>{m.area.slice(1)}
                  </h2>
                  <div className="op2-extra">
                    <p className="op2-serif" style={{ fontStyle: 'italic', fontSize: '1.15rem', lineHeight: 1.45, color: 'rgba(243,237,226,.75)', marginTop: 12, maxWidth: 380 }}>
                      {m.frase}
                    </p>
                    <span className="op2-entrar op2-mono">Entrar <span aria-hidden="true">→</span></span>
                  </div>
                </div>
              </Link>
            )
          })}
        </main>

        {/* Faixa de baixo */}
        <div className="op2-faixa op2-mono">
          <Furos />
          <span className="op2-faixa-txt">Três olhares, a mesma essência: contar histórias.</span>
          <span className="op2-faixa-txt op2-dica" style={{ marginLeft: 'auto' }}>1 · 2 · 3 para escolher · Enter para entrar</span>
        </div>
      </div>
    </>
  )
}
