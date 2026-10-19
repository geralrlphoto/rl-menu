'use client'

// ─────────────────────────────────────────────────────────────────────────
// OPÇÃO 3 da página de marcas — "Tema RL".
// O mesmo design das páginas de admin (/photo) e do portal tema RL:
// preto #0b0b0b, dourado #d8be93, Roboto Condensed, foto esbatida a P&B
// com pontilhado e anéis, cartões de 22px com borda esquerda dourada e
// botões em pílula. É a página principal (/); Opção 1 em /?opcao=1,
// Opção 2 ("Película") em /?opcao=2.
// ─────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogoutButton } from '@/app/components/LogoutButton'

const OURO = '#d8be93'

const MARCAS = [
  {
    href: '/photo',
    nome: 'RL Photo.Video',
    area: 'Casamentos',
    frase: 'Fotografia e vídeo de casamento. O dia inteiro contado com calma, luz natural e verdade.',
    foto: '/eventos-hero-2026.webp',
    posicao: 'center 40%',
    logo: '/logo-photovideo-hd.png',
    logoEscala: 1.9,          // o PNG tem muita margem à volta
  },
  {
    href: '/media',
    nome: 'RL Prod',
    area: 'Marcas',
    frase: 'Fotografia e vídeo para marcas. Conteúdo com intenção, feito para ser visto e lembrado.',
    foto: '/login hero.png',
    posicao: 'center 50%',
    logo: '/logo-rl-prod-black.png',
    logoEscala: 1,
  },
  {
    href: '/wedding-mentor',
    nome: 'RL Wedding Mentor',
    area: 'Formação',
    frase: 'Mentoria para profissionais. Educar, inspirar e elevar quem fotografa e filma casamentos.',
    foto: '/casamentos-2027.jpg',
    posicao: 'center 45%',
    logo: '/logo-mentor-hd.png',
    logoEscala: 1,
  },
]

function saudacaoAgora() {
  const h = Number(new Intl.DateTimeFormat('pt-PT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Lisbon' }).format(new Date()))
  return h < 6 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'
}

export default function MarcasOpcao3() {
  const router = useRouter()
  const [foco, setFoco] = useState<number | null>(null)
  const [saudacao, setSaudacao] = useState('Olá')

  useEffect(() => { setSaudacao(saudacaoAgora()) }, [])

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
    <main className="relative min-h-screen bg-[#0b0b0b] overflow-hidden flex flex-col">

      {/* Fundo: foto esbatida a P&B, brilho dourado, pontilhado e anéis finos */}
      <div className="absolute inset-0 bg-cover bg-[center_35%] grayscale opacity-[0.18]"
        style={{ backgroundImage: "url('/casamentos-2028.webp')" }} />
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 30%, rgba(216,190,147,0.10), transparent 70%)' }} />
      <div className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(216,190,147,0.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 30%, #000 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 30%, #000 25%, transparent 75%)',
        }} />
      <svg className="pointer-events-none absolute left-1/2 top-[26%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] opacity-[0.09]"
        viewBox="0 0 100 100" fill="none" stroke={OURO} strokeWidth="0.1" aria-hidden>
        <circle cx="50" cy="50" r="18" />
        <circle cx="50" cy="50" r="30" strokeDasharray="0.5 1.2" />
        <circle cx="50" cy="50" r="44" />
      </svg>
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #0b0b0b 0%, rgba(11,11,11,0.4) 22%, rgba(11,11,11,0.7) 60%, #0b0b0b 100%)' }} />

      <div className="absolute top-4 right-4 z-10">
        <LogoutButton />
      </div>

      <div className="relative flex-1 w-full max-w-6xl mx-auto px-5 sm:px-10 pt-20 sm:pt-28 pb-10 flex flex-col">

        {/* Saudação */}
        <header className="text-center">
          <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">
            RL · Universo de Marcas
          </p>
          <h1 className="font-cond font-bold text-white text-[40px] sm:text-[64px] leading-[1.02] tracking-[-0.01em] mt-5">
            {saudacao}, <span className="text-[#d8be93]">Rui</span>
          </h1>
          <p className="font-cond font-light text-white/60 text-lg sm:text-xl leading-relaxed mt-5 max-w-xl mx-auto">
            Três olhares, a mesma essência: contar histórias. Escolhe por onde entrar.
          </p>
        </header>

        {/* As três marcas */}
        <nav aria-label="Seleciona uma marca"
          className="relative mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
          onMouseLeave={() => setFoco(null)}>
          {MARCAS.map((m, i) => {
            const ativo = foco === i
            return (
              <Link key={m.href} href={m.href}
                onMouseEnter={() => setFoco(i)}
                onFocus={() => setFoco(i)}
                aria-label={`Entrar em ${m.nome}, ${m.area}`}
                className={`group relative flex flex-col overflow-hidden rounded-[22px] border bg-[#111111]/85 backdrop-blur-md transition-all duration-300 outline-none hover:-translate-y-1 ${ativo ? 'border-[#d8be93]/55 shadow-[0_0_48px_-20px_rgba(216,190,147,0.6)]' : 'border-[#d8be93]/20'}`}
                style={{ borderLeft: `2px solid rgba(216,190,147,${ativo ? 0.8 : 0.4})` }}>

                {/* Foto com o logo por cima */}
                <div className="relative h-[180px] sm:h-[220px] overflow-hidden">
                  <Image src={m.foto} alt="" fill priority sizes="(max-width: 767px) 100vw, 33vw"
                    className={`object-cover transition-all duration-700 ${ativo ? 'scale-105 grayscale-0' : 'grayscale-[0.6]'}`}
                    style={{ objectPosition: m.posicao }} />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, #111111 0%, rgba(17,17,17,0.55) 45%, rgba(17,17,17,0.25) 100%)' }} />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[58%] aspect-[16/10]"
                    style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }}>
                    <div className="absolute inset-0" style={{ transform: `scale(${m.logoEscala})` }}>
                      <Image src={m.logo} alt="" fill sizes="240px" className="object-contain" />
                    </div>
                  </div>
                  <span className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center font-cond font-semibold text-[14px] text-[#d8be93] bg-[#0b0b0b]/70 border border-[#d8be93]/35 backdrop-blur-md">
                    {i + 1}
                  </span>
                </div>

                {/* Texto */}
                <div className="flex-1 flex flex-col px-5 sm:px-6 pt-4 pb-6">
                  <p className="font-cond text-[10.5px] font-medium tracking-[0.2em] uppercase text-[#d8be93]/85">{m.nome}</p>
                  <h2 className="font-cond font-semibold text-white text-[28px] leading-tight mt-1">{m.area}</h2>
                  <p className="font-cond text-[15px] text-white/55 leading-snug mt-2 flex-1">{m.frase}</p>
                  <span className={`mt-5 self-start inline-flex items-center gap-2 rounded-full font-cond font-semibold text-[14px] px-5 py-2 border transition-all ${ativo ? 'text-[#d8be93] bg-[#d8be93]/15 border-[#d8be93]/60' : 'text-white bg-[#0e0e0e]/90 border-[#d8be93]/35'}`}>
                    Entrar
                    <span className="text-[#d8be93] transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>

        <p className="hidden md:block text-center font-cond text-[11px] tracking-[0.2em] uppercase text-white/30 mt-10">
          1 · 2 · 3 para escolher · Enter para entrar
        </p>
      </div>
    </main>
  )
}
