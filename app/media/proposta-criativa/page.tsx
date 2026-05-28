'use client'

import Link from 'next/link'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Proposta Criativa
 *
 *  Apresentação cinematográfica premium em scroll vertical. Nove secções
 *  com paleta brand (navy + creme) e acentos dourados subtis. Tipografia
 *  editorial Cormorant Garamond + Inter.
 *
 *  Imagens via Unsplash (cinematográficas, mood photo & video production).
 * ─────────────────────────────────────────────────────────────────────────── */

/* Paleta */
const INK         = '#0c0e12'
const INK_SOFT    = '#141821'
const INK_PANEL   = '#1a1f2b'
const PAPER       = '#e9e5dc'
const PAPER_SOFT  = '#f1ede4'
const NAVY        = '#2A4D6E'
const NAVY_DEEP   = '#1B3552'
const GOLD        = '#B89460'
const GOLD_DEEP   = '#8a6f47'
const SILVER      = '#bdb6a8'

/* Hero images (cinematic) */
const IMG = {
  hero:       'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=2000&q=85&auto=format&fit=crop',
  videograf:  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1600&q=85&auto=format&fit=crop',
  lens:       'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=1600&q=85&auto=format&fit=crop',
  fotografia: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=1400&q=85&auto=format&fit=crop',
  video:      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1400&q=85&auto=format&fit=crop',
  reels:      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1400&q=85&auto=format&fit=crop',
  port1:      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=85&auto=format&fit=crop',
  port2:      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&q=85&auto=format&fit=crop',
  port3:      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=85&auto=format&fit=crop',
  port4:      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&q=85&auto=format&fit=crop',
  port5:      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&q=85&auto=format&fit=crop',
  port6:      'https://images.unsplash.com/photo-1571019613540-996a8ffc5a4d?w=1000&q=85&auto=format&fit=crop',
}

/* Dados RL PROD */
const RL_DADOS = {
  email:    'geral.rlphoto@gmail.com',
  telefone: '+351 916 162 728',
  site:     'www.rlprod.pt',
  ig:       '@rlprod_pt',
  morada:   'Pinhal Novo, Portugal',
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function PropostaCriativa() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Inter:wght@200;300;400;500;600;700;800&display=swap');
        body { background: ${INK}; }
        .pc-root { font-family: 'Inter', -apple-system, sans-serif; color: #ecf0f5; }
        .serif { font-family: 'Cormorant Garamond', 'Georgia', serif; }
        @media print {
          @page { size: A4; margin: 0; }
          .pc-section { break-after: page; page-break-after: always; min-height: 297mm !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="pc-root">

        {/* Toolbar */}
        <nav className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3.5"
          style={{ background: 'rgba(8,10,15,0.78)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/media"
            className="text-[10px] tracking-[0.5em] uppercase text-white/45 hover:text-white transition-colors flex items-center gap-2">
            <span className="text-base leading-none">‹</span> RL PROD · Menu
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[9px] tracking-[0.45em] uppercase text-white/35 mr-3">
              Proposta Criativa
            </span>
            <button onClick={() => window.print()}
              className="px-4 py-1.5 rounded-md text-[10px] font-bold tracking-[0.3em] uppercase transition-all"
              style={{ background: GOLD, color: INK, boxShadow: `0 0 18px -4px ${GOLD}` }}>
              ⎙ Exportar PDF
            </button>
          </div>
        </nav>

        {/* ────────────────────── 1 · CAPA ────────────────────── */}
        <Section dark first>
          {/* Imagem hero */}
          <div className="absolute inset-0 z-0">
            <img src={IMG.hero} alt="" className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.42) saturate(1.1) contrast(1.1)' }} />
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(120deg, rgba(8,10,15,0.92) 0%, rgba(11,21,35,0.78) 55%, rgba(8,10,15,0.6) 100%)` }} />
            <div className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 25% 50%, rgba(42,77,110,0.35), transparent 65%)` }} />
            {/* grain */}
            <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          </div>

          {/* Top tagline */}
          <div className="absolute top-20 left-12 sm:left-16 z-10">
            <p className="text-[10px] tracking-[0.6em] uppercase text-white/55 font-bold">
              Proposta Criativa
            </p>
          </div>
          <div className="absolute top-20 right-12 sm:right-16 z-10 text-right">
            <p className="text-[10px] tracking-[0.45em] uppercase font-bold" style={{ color: GOLD }}>
              {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
          </div>

          {/* Centro — Logo gigante + branding */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <img src="/logo-rl-prod-branco.png" alt="RL PROD"
              className="w-44 h-44 sm:w-56 sm:h-56 object-contain mb-8 opacity-95"
              style={{ filter: 'drop-shadow(0 0 24px rgba(42,77,110,0.4))' }} />

            <h1 className="serif text-[64px] sm:text-[88px] leading-[0.95] font-light tracking-[0.18em] text-white"
              style={{ letterSpacing: '0.18em' }}>
              RL <span style={{ color: SILVER }}>PROD</span>
            </h1>

            <p className="mt-3 text-[10px] sm:text-[11px] tracking-[0.55em] uppercase font-bold text-white/65">
              Photography &amp; Video (for brands)
            </p>

            <div className="h-px w-24 my-10" style={{ background: GOLD }} />

            <p className="serif text-[18px] sm:text-[22px] italic max-w-xl"
              style={{ color: SILVER, lineHeight: 1.5 }}>
              Contar histórias.<br />
              Fortalecer marcas.<br />
              Gerar impacto.
            </p>
          </div>

          {/* Bottom tagline */}
          <div className="absolute bottom-12 left-12 sm:left-16 right-12 sm:right-16 z-10 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <p className="text-[9px] tracking-[0.55em] uppercase text-white/35 font-bold">
                Proposta apresentada em
              </p>
              <p className="serif text-[20px] mt-1.5 text-white/85 italic">
                {new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <p className="text-[9px] tracking-[0.55em] uppercase text-white/35 font-bold">
              {RL_DADOS.site}
            </p>
          </div>
        </Section>

        {/* ────────────────────── 2 · INTRODUÇÃO ────────────────────── */}
        <Section dark>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-6">
              <SectionLabel n="01" titulo="Introdução" />
              <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] text-white tracking-tight mb-8">
                Histórias visuais que <em style={{ color: GOLD }}>fortalecem</em> marcas.
              </h2>
              <p className="text-[14px] leading-[1.85] text-white/72 mb-5 max-w-lg">
                A RL PROD nasce com o propósito de <strong className="text-white">transformar ideias</strong> e valores de marcas em imagens que comunicam, conectam e geram resultados.
              </p>
              <p className="text-[14px] leading-[1.85] text-white/72 max-w-lg">
                Mais do que produzir fotografia e vídeo, criamos <strong className="text-white">experiências visuais estratégicas</strong> que elevam a percepção da sua marca e conquistam o seu público.
              </p>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-4 gap-4 max-w-lg">
                <Stat n="+50" t="Projetos" />
                <Stat n="+20" t="Marcas" />
                <Stat n="100%" t="Qualidade" />
                <Stat n="1" t="Propósito" />
              </div>
            </div>

            <div className="md:col-span-6 relative">
              <div className="relative aspect-[4/5] rounded-sm overflow-hidden"
                style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)' }}>
                <img src={IMG.videograf} alt="" className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85) saturate(1.05)' }} />
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 50%, rgba(8,10,15,0.85) 100%)` }} />
                {/* Card flutuante */}
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-sm border border-white/10"
                  style={{ background: 'rgba(12,14,18,0.85)', backdropFilter: 'blur(12px)' }}>
                  <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-3" style={{ color: GOLD }}>
                    O que nos move
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniIcon icon="◐" label="Paixão por Imagem" />
                    <MiniIcon icon="◎" label="Foco em Resultados" />
                    <MiniIcon icon="◇" label="Parceria & Confiança" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ────────────────────── 3 · SOBRE A RL PROD ────────────────────── */}
        <Section dark>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <SectionLabel n="02" titulo="Sobre a RL PROD" />
              <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] text-white tracking-tight mb-8">
                Uma produtora <em style={{ color: GOLD }}>especializada</em> em conteúdo visual.
              </h2>
              <p className="text-[14px] leading-[1.85] text-white/72 mb-10 max-w-xl">
                Somos uma produtora dedicada a marcas que desejam destacar-se. Unimos técnica, criatividade e estratégia para entregar produções com propósito e alta qualidade.
              </p>

              {/* Diferenciais panel */}
              <div className="rounded-sm border border-white/10 p-6"
                style={{ background: `linear-gradient(180deg, rgba(42,77,110,0.22), rgba(27,53,82,0.12))` }}>
                <p className="text-[10px] tracking-[0.4em] uppercase font-bold mb-4" style={{ color: GOLD }}>
                  Nosso Diferencial
                </p>
                <ul className="space-y-3">
                  {[
                    'Abordagem estratégica e personalizada',
                    'Conteúdo alinhado com objectivos de marketing',
                    'Equipamento profissional e tecnologia de ponta',
                    'Pós produção de alto nível',
                    'Compromisso com prazos e resultados',
                  ].map(d => (
                    <li key={d} className="flex items-start gap-3 text-[13px] text-white/80">
                      <span className="inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] mt-0.5 shrink-0"
                        style={{ background: GOLD, color: INK, fontWeight: 700 }}>✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-sm overflow-hidden"
                style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)' }}>
                <img src={IMG.lens} alt="" className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.78) saturate(0.95)' }} />
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, rgba(8,10,15,0.4) 0%, rgba(8,10,15,0.7) 100%)` }} />
              </div>
              {/* Decoração */}
              <div className="absolute -top-4 -right-4 w-16 h-16 border border-white/15" />
              <div className="absolute -bottom-4 -left-4 w-24 h-px" style={{ background: GOLD }} />
            </div>
          </div>
        </Section>

        {/* ────────────────────── 4 · PROCESSO CRIATIVO ────────────────────── */}
        <Section paper>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24">
            <SectionLabel n="03" titulo="Processo Criativo" dark />
            <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] tracking-tight mb-3"
              style={{ color: NAVY_DEEP }}>
              Como <em style={{ color: GOLD_DEEP }}>trabalhamos.</em>
            </h2>
            <p className="text-[14px] leading-[1.85] mb-14 max-w-xl" style={{ color: '#4a4640' }}>
              Seguimos um processo claro, colaborativo e estratégico para garantir que cada projeto entregue exactamente o que a marca precisa.
            </p>

            {/* Timeline horizontal */}
            <div className="relative">
              <div className="absolute top-7 left-0 right-0 h-px hidden md:block" style={{ background: 'rgba(27,53,82,0.25)' }} />
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-3 relative">
                {[
                  { n: '01', titulo: 'Briefing & Imersão',     icon: '✦', desc: 'Entendemos a marca, objectivos, público e desafios.' },
                  { n: '02', titulo: 'Planeamento Estratégico', icon: '✕', desc: 'Conceito, roteiro, referências visuais e plano de produção.' },
                  { n: '03', titulo: 'Pré-Produção',           icon: '◇', desc: 'Definição de locações, equipa, cronograma e logística.' },
                  { n: '04', titulo: 'Produção',               icon: '◉', desc: 'Captação de fotos e vídeos com equipamento profissional.' },
                  { n: '05', titulo: 'Pós-Produção',           icon: '◐', desc: 'Edição, color grading, tratamento de imagem e som.' },
                  { n: '06', titulo: 'Entrega & Apoio',        icon: '⟶', desc: 'Entrega nos formatos ideais e suporte contínuo.' },
                ].map(s => (
                  <div key={s.n} className="text-center">
                    <div className="relative inline-flex w-14 h-14 rounded-full items-center justify-center text-[20px] mb-4"
                      style={{ background: NAVY_DEEP, color: PAPER, boxShadow: '0 6px 16px -4px rgba(27,53,82,0.45)' }}>
                      {s.icon}
                    </div>
                    <p className="text-[18px] font-bold mb-1" style={{ color: NAVY_DEEP, fontFamily: 'monospace' }}>
                      {s.n}
                    </p>
                    <p className="text-[11px] tracking-[0.18em] uppercase font-bold mb-2" style={{ color: NAVY_DEEP }}>
                      {s.titulo}
                    </p>
                    <p className="text-[10.5px] leading-[1.55] px-2" style={{ color: '#4a4640' }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* O Resultado */}
            <div className="mt-16 rounded-sm p-7 text-center" style={{ background: NAVY_DEEP, color: PAPER }}>
              <p className="serif text-[26px] sm:text-[30px] italic mb-2 font-light">
                O Resultado.
              </p>
              <p className="text-[12.5px] tracking-wide opacity-80 max-w-2xl mx-auto mb-7 leading-[1.7]">
                Conteúdo visual que transmite credibilidade, gera conexão e impulsiona resultados.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { i: '◆', t: 'Fortalece a Marca' },
                  { i: '♦', t: 'Engaja o Público' },
                  { i: '▲', t: 'Aumenta a Conversão' },
                  { i: '★', t: 'Gera Valor & Reconhecimento' },
                ].map(p => (
                  <div key={p.t}>
                    <p className="text-[22px] mb-2" style={{ color: GOLD }}>{p.i}</p>
                    <p className="text-[10px] tracking-[0.3em] uppercase font-bold opacity-90">{p.t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ────────────────────── 5 · PROPOSTAS DE SERVIÇO ────────────────────── */}
        <Section dark>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24">
            <SectionLabel n="04" titulo="Propostas de Entrega" />
            <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] text-white tracking-tight mb-3">
              Soluções <em style={{ color: GOLD }}>sob medida</em>.
            </h2>
            <p className="text-[14px] leading-[1.85] text-white/72 mb-14 max-w-xl">
              Soluções sob medida para diferentes objectivos e formatos. Todas as propostas são 100% personalizáveis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ServiceCard
                image={IMG.fotografia}
                icon="◐"
                titulo="Fotografia Estratégica"
                desc="Ensaio profissional para marcas, produtos, pessoas e ambientes."
                inclui={['Planeamento', 'Ensaio fotográfico', 'Edição profissional', 'Entrega em alta resolução', 'Uso comercial']}
              />
              <ServiceCard
                image={IMG.video}
                icon="▶"
                titulo="Vídeo Institucional"
                desc="Vídeos que contam a história da marca e comunicam os seus valores."
                inclui={['Roteiro e concept', 'Captação de vídeo', 'Edição e finalização', 'Banda sonora e efeitos', 'Versões para redes sociais']}
              />
              <ServiceCard
                image={IMG.reels}
                icon="▥"
                titulo="Conteúdo para Redes Sociais"
                desc="Conteúdo dinâmico e verticalizado para gerar engajamento."
                inclui={['Ideia e roteiro', 'Gravação vertical', 'Edição ágil e moderna', 'Entrega optimizada', 'Pacotes mensais']}
              />
            </div>

            <div className="mt-10 p-5 rounded-sm flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, rgba(184,148,96,0.14), rgba(184,148,96,0.04))`, border: `1px solid ${GOLD}33` }}>
              <span className="text-[24px]" style={{ color: GOLD }}>★</span>
              <div>
                <p className="text-[12.5px] font-bold tracking-[0.18em] uppercase" style={{ color: GOLD }}>
                  Todas as propostas são 100% personalizáveis
                </p>
                <p className="text-[12px] text-white/65 mt-1">
                  Ajustamos escopo, formatos e entregas conforme a necessidade da sua marca.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ────────────────────── 6 · PORTFÓLIO ────────────────────── */}
        <Section paper>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24">
            <SectionLabel n="05" titulo="Portfólio" dark />
            <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] tracking-tight mb-3"
              style={{ color: NAVY_DEEP }}>
              Alguns dos nossos <em style={{ color: GOLD_DEEP }}>trabalhos.</em>
            </h2>
            <p className="text-[14px] leading-[1.85] mb-14 max-w-xl" style={{ color: '#4a4640' }}>
              Alguns projectos que traduzem a nossa entrega e compromisso com a qualidade.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[IMG.port1, IMG.port2, IMG.port3, IMG.port4, IMG.port5, IMG.port6].map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-sm group">
                  <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: 'saturate(0.95)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(180deg, transparent 60%, rgba(27,53,82,0.85))` }} />
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-[11.5px] tracking-[0.25em] uppercase font-bold" style={{ color: '#4a4640' }}>
              Mais projectos &amp; cases disponíveis mediante apresentação.
            </p>
          </div>
        </Section>

        {/* ────────────────────── 7 · DIFERENCIAÇÃO ────────────────────── */}
        <Section dark fullBleed>
          <div className="absolute inset-0 z-0">
            <img src={IMG.hero} alt="" className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.32) saturate(1.1)' }} />
            <div className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at center, rgba(8,10,15,0.55) 0%, rgba(8,10,15,0.85) 70%)` }} />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 py-32 text-center">
            <SectionLabel n="06" titulo="Diferenciação" centered />
            <h2 className="serif text-[48px] sm:text-[72px] font-light leading-[1.0] text-white tracking-tight mb-10">
              Porque escolher a<br />
              <em style={{ color: GOLD }}>RL PROD.</em>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {[
                { i: '✦', t: 'Qualidade Cinematográfica', d: 'Equipamento profissional e olhar editorial em cada captação.' },
                { i: '◆', t: 'Storytelling Estratégico',  d: 'Narrativas que comunicam valor, posicionamento e propósito.' },
                { i: '★', t: 'Experiência Premium',       d: 'Do briefing à entrega, processo cuidado e relação de parceria.' },
              ].map(d => (
                <div key={d.t} className="px-4">
                  <div className="inline-flex w-14 h-14 rounded-full items-center justify-center text-[22px] mb-5"
                    style={{ border: `1px solid ${GOLD}55`, color: GOLD, background: 'rgba(184,148,96,0.08)' }}>
                    {d.i}
                  </div>
                  <p className="text-[12px] tracking-[0.28em] uppercase font-bold mb-3 text-white">
                    {d.t}
                  </p>
                  <p className="text-[12.5px] leading-[1.7] text-white/65 max-w-[260px] mx-auto">
                    {d.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ────────────────────── 8 · RESULTADOS & IMPACTO ────────────────────── */}
        <Section dark>
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 py-24">
            <SectionLabel n="07" titulo="Resultados & Impacto" />
            <h2 className="serif text-[44px] sm:text-[56px] font-light leading-[1.05] text-white tracking-tight mb-3">
              O que <em style={{ color: GOLD }}>entregamos.</em>
            </h2>
            <p className="text-[14px] leading-[1.85] text-white/72 mb-14 max-w-xl">
              Mais do que conteúdo, geramos resultados mensuráveis e impacto real na percepção e crescimento da marca.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { v: '+85%', t: 'Engagement Médio em Redes',     n: '01' },
                { v: '+60%', t: 'Aumento de Credibilidade',      n: '02' },
                { v: '+40%', t: 'Conversão em Campanhas',        n: '03' },
                { v: '100%', t: 'Compromisso com Prazos',        n: '04' },
              ].map(r => (
                <div key={r.n} className="p-6 rounded-sm border border-white/8"
                  style={{ background: `linear-gradient(180deg, rgba(42,77,110,0.18), rgba(27,53,82,0.05))` }}>
                  <p className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color: GOLD }}>
                    {r.n}
                  </p>
                  <p className="serif text-[44px] font-light text-white mt-2 leading-none">
                    {r.v}
                  </p>
                  <p className="text-[11px] text-white/65 mt-3 tracking-wide leading-tight">
                    {r.t}
                  </p>
                </div>
              ))}
            </div>

            {/* Próximos Passos */}
            <div className="mt-16">
              <p className="text-[10px] tracking-[0.45em] uppercase font-bold mb-3" style={{ color: GOLD }}>
                Próximos Passos
              </p>
              <h3 className="serif text-[36px] font-light text-white mb-10">
                Simples. Estratégico. Memorável.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { n: '01', t: 'Alinhamento',          d: 'Reunião para entender a sua necessidade e objectivos.', i: '◷' },
                  { n: '02', t: 'Proposta Personalizada', d: 'Enviamos o plano ideal para o seu projeto.', i: '◫' },
                  { n: '03', t: 'Vamos Criar Juntos',    d: 'Início da produção e geração de resultados.', i: '✓' },
                ].map(p => (
                  <div key={p.n} className="p-5 rounded-sm border border-white/8 text-center"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="inline-flex w-12 h-12 rounded-full items-center justify-center text-[18px] mb-4"
                      style={{ border: `1px solid ${GOLD}55`, color: GOLD }}>
                      {p.i}
                    </div>
                    <p className="text-[9px] tracking-[0.45em] uppercase font-bold mb-2" style={{ color: GOLD }}>
                      {p.n}
                    </p>
                    <p className="text-[12px] tracking-[0.2em] uppercase font-bold text-white mb-2">
                      {p.t}
                    </p>
                    <p className="text-[11px] text-white/60 leading-[1.6]">{p.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ────────────────────── 9 · CTA FINAL ────────────────────── */}
        <Section dark fullBleed last>
          <div className="absolute inset-0 z-0">
            <img src={IMG.videograf} alt="" className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.3) saturate(0.9)' }} />
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, rgba(8,10,15,0.92) 0%, rgba(11,21,35,0.75) 50%, rgba(8,10,15,0.95) 100%)` }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 py-32 text-center flex flex-col items-center">
            <img src="/logo-rl-prod-branco.png" alt="RL PROD"
              className="w-28 h-28 object-contain mb-8 opacity-90" />

            <p className="text-[10px] tracking-[0.55em] uppercase font-bold mb-6" style={{ color: GOLD }}>
              Vamos Criar
            </p>

            <h2 className="serif text-[44px] sm:text-[64px] font-light leading-[1.05] text-white tracking-tight mb-6 max-w-3xl">
              Vamos transformar a imagem da sua marca em algo <em style={{ color: GOLD }}>memorável.</em>
            </h2>

            <p className="text-[14px] text-white/65 max-w-xl leading-[1.85] mb-12">
              Marque uma reunião sem compromisso. Em 30 minutos desenhamos os primeiros passos para o seu próximo projecto.
            </p>

            {/* Contactos grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-3xl border-t border-b border-white/10 py-8 mb-10">
              <Contact icon="📧" label="Email"     value={RL_DADOS.email} />
              <Contact icon="📞" label="Telefone"  value={RL_DADOS.telefone} />
              <Contact icon="◉" label="Localização" value={RL_DADOS.morada} />
              <Contact icon="◍" label="Website"    value={RL_DADOS.site} />
            </div>

            <a href={`mailto:${RL_DADOS.email}`}
              className="inline-flex items-center gap-3 px-8 py-3 rounded-sm transition-all hover:scale-[1.02]"
              style={{
                background: GOLD,
                color: INK,
                boxShadow: `0 0 32px -8px ${GOLD}`,
                letterSpacing: '0.35em', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              }}>
              Marcar Reunião
            </a>

            <p className="serif text-[14px] italic mt-14" style={{ color: SILVER }}>
              More than a product, an experience.
            </p>
          </div>
        </Section>

      </main>
    </>
  )
}

/* ─── Sub components ──────────────────────────────────────────────────────── */

function Section({
  children, dark, paper, first, last, fullBleed,
}: {
  children: React.ReactNode
  dark?: boolean; paper?: boolean
  first?: boolean; last?: boolean
  fullBleed?: boolean
}) {
  return (
    <section className="pc-section relative overflow-hidden"
      style={{
        background: paper ? PAPER : INK,
        minHeight: first || last || fullBleed ? '100vh' : 'auto',
        paddingTop: first ? 0 : undefined,
      }}>
      {children}
    </section>
  )
}

function SectionLabel({ n, titulo, dark, centered }: { n: string; titulo: string; dark?: boolean; centered?: boolean }) {
  return (
    <div className={`mb-7 ${centered ? 'flex flex-col items-center' : ''}`}>
      <div className="flex items-center gap-3" style={{ color: dark ? NAVY_DEEP : '#ffffff' }}>
        <span className="text-[10px] tracking-[0.45em] uppercase font-bold" style={{ color: GOLD }}>
          {n}.
        </span>
        <span className="h-px flex-none" style={{ width: 26, background: GOLD }} />
        <span className="text-[10px] tracking-[0.45em] uppercase font-bold" style={{ color: dark ? NAVY_DEEP : '#ffffff' }}>
          {titulo}
        </span>
      </div>
    </div>
  )
}

function Stat({ n, t }: { n: string; t: string }) {
  return (
    <div>
      <p className="serif text-[28px] sm:text-[34px] font-light leading-none text-white">{n}</p>
      <p className="text-[8.5px] tracking-[0.3em] uppercase text-white/45 font-bold mt-1.5 leading-tight">{t}</p>
    </div>
  )
}

function MiniIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[16px] mb-1.5" style={{ color: GOLD }}>{icon}</p>
      <p className="text-[7.5px] tracking-[0.18em] uppercase text-white/65 font-bold leading-tight">{label}</p>
    </div>
  )
}

function ServiceCard({
  image, icon, titulo, desc, inclui,
}: {
  image: string; icon: string; titulo: string; desc: string; inclui: string[]
}) {
  return (
    <article className="rounded-sm overflow-hidden border border-white/8 flex flex-col"
      style={{ background: INK_PANEL }}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={image} alt="" className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.75) saturate(1)' }} />
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 50%, ${INK_PANEL} 100%)` }} />
        <div className="absolute top-4 left-4 inline-flex w-10 h-10 rounded-full items-center justify-center text-[18px]"
          style={{ background: GOLD, color: INK }}>
          {icon}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-[14px] tracking-[0.25em] uppercase font-bold text-white mb-2">
          {titulo}
        </h3>
        <p className="text-[12px] text-white/65 leading-[1.6] mb-4">
          {desc}
        </p>
        <div className="mt-auto pt-4 border-t border-white/8">
          <p className="text-[9px] tracking-[0.4em] uppercase font-bold mb-2" style={{ color: GOLD }}>
            Inclui
          </p>
          <ul className="space-y-1.5">
            {inclui.map(i => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/75">
                <span className="text-[10px] mt-0.5" style={{ color: GOLD }}>✓</span>
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function Contact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[18px] mb-2" style={{ color: GOLD }}>{icon}</p>
      <p className="text-[8.5px] tracking-[0.4em] uppercase font-bold text-white/45 mb-2">{label}</p>
      <p className="text-[11.5px] text-white/85 leading-tight font-medium break-words">{value}</p>
    </div>
  )
}
