import Link from 'next/link'

/* ============================================================
   /social-media — no layout da app: topo como o do CRM (linha
   dourada, título grande, foto a preto e branco à direita) e
   cartões com foto como os do Menu do /photo.
   ============================================================ */

type Cartao = { href?: string; titulo: string; desc: string; img: string; embreve?: boolean }

const CARTOES: Cartao[] = [
  { href: '/social-media/blog', titulo: 'Blog', desc: 'Artigos prontos a copiar para o blog', img: '/eventos-hero-2026.webp' },
  { href: '/social-media/12-meses-12-videos', titulo: '12 Meses 12 Vídeos', desc: 'Guiões prontos, de setembro 2026 a agosto 2027', img: '/eventos-hero-2027.webp' },
  { href: '/social-media/podcast', titulo: 'Antes do Sim', desc: 'Episódios, candidaturas e leads do podcast', img: '/prewedding-hero.webp' },
  { titulo: 'Instagram', desc: 'Calendário editorial e publicações', img: '/casamentos-2028.webp', embreve: true },
]

export default function SocialMediaPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707]">

      {/* ── Topo, como o do CRM ─────────────────────────────────────────── */}
      <section className="relative min-h-[560px] lg:min-h-[72vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Blog · Vídeos · Podcast · Instagram
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-12 lg:pb-16">
          <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1" className="self-start text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar ao Menu</Link>
          <div className="mt-auto pt-16">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[60px] sm:text-[110px] lg:text-[140px] mt-2">Social<br />Media</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Blog · Vídeos · <span className="text-[#C9A84C]">Podcast</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
              Gestão de Instagram, planeamento editorial, blog e podcast, num só sítio.
            </p>
          </div>
        </div>
      </section>

      {/* ── Cartões com foto, como os do Menu do /photo ─────────────────── */}
      <section className="max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-14 pt-6 pb-20">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Atalhos</p>
        <h2 className="font-semibold text-white text-[28px] leading-tight mt-1 mb-6">Ferramentas de Social Media</h2>

        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARTOES.map((c, i) => {
            const conteudo = (
              <>
                <div className="sm-foto absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${c.img})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/55 to-[#0b0b0b]/10" />
                <div className="sm-brilho absolute inset-0" />
                <span className="sm-num absolute top-3 left-4 font-bold text-[46px] leading-none tracking-tight">{String(i + 1).padStart(2, '0')}</span>
                {c.embreve
                  ? <span className="absolute top-4 right-4 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.2em] uppercase text-white/55">Em breve</span>
                  : <span className="sm-seta absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[16px]">→</span>}
                <div className="absolute left-4 right-4 bottom-4">
                  <p className="font-semibold text-[22px] leading-tight text-white">{c.titulo}</p>
                  <p className="text-[12.5px] text-white/50 leading-snug mt-1">{c.desc}</p>
                  {!c.embreve && <p className="sm-abrir text-[10.5px] font-medium tracking-[0.22em] uppercase mt-2">Abrir</p>}
                </div>
                <span className="sm-linha absolute left-0 bottom-0 h-[2px]" />
              </>
            )
            const cls = `sm-cartao group relative block overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0e0e0e]/70 aspect-[4/5]${c.embreve ? ' is-embreve' : ''}`
            return c.href
              ? <Link key={c.titulo} href={c.href} className={cls}>{conteudo}</Link>
              : <div key={c.titulo} className={cls} aria-disabled="true">{conteudo}</div>
          })}
        </div>
      </section>

      <style>{`
        .sm-cartao { transition: border-color .4s ease, box-shadow .4s ease, transform .4s cubic-bezier(.19,1,.22,1); }
        .sm-foto { filter: grayscale(.85) brightness(.55); transform: scale(1.02); transition: filter .7s ease, transform 1.2s cubic-bezier(.19,1,.22,1); }
        .sm-num { color: transparent; -webkit-text-stroke: 1px rgba(216,190,147,.45); transition: color .4s ease, -webkit-text-stroke-color .4s ease; }
        .sm-abrir { color: rgba(255,255,255,.35); transition: color .3s ease, letter-spacing .4s ease; }
        .sm-seta { color: #d8be93; border: 1px solid rgba(216,190,147,.35); background: rgba(0,0,0,.35); transition: all .35s cubic-bezier(.19,1,.22,1); }
        .sm-linha { width: 0; background: linear-gradient(90deg, #d8be93, transparent); transition: width .6s cubic-bezier(.19,1,.22,1); }
        .sm-brilho { background: linear-gradient(110deg, transparent 30%, rgba(216,190,147,.14) 50%, transparent 70%); transform: translateX(-120%); transition: transform 1s ease; pointer-events: none; }
        .sm-cartao:not(.is-embreve):hover, .sm-cartao:not(.is-embreve):focus-visible {
          transform: translateY(-4px); border-color: rgba(216,190,147,.55);
          box-shadow: 0 0 50px -18px rgba(216,190,147,.65), inset 0 1px 0 rgba(255,255,255,.06); }
        .sm-cartao:not(.is-embreve):hover .sm-foto { filter: grayscale(0) brightness(.75); transform: scale(1.08); }
        .sm-cartao:not(.is-embreve):hover .sm-num { color: #d8be93; -webkit-text-stroke-color: #d8be93; }
        .sm-cartao:not(.is-embreve):hover .sm-abrir { color: #d8be93; letter-spacing: .32em; }
        .sm-cartao:not(.is-embreve):hover .sm-linha { width: 100%; }
        .sm-cartao:not(.is-embreve):hover .sm-seta { background: #d8be93; color: #0b0b0b; transform: translateX(3px) rotate(-45deg); }
        .sm-cartao:not(.is-embreve):hover .sm-brilho { transform: translateX(120%); }
        .sm-cartao.is-embreve { cursor: default; opacity: .6; }
        @media (prefers-reduced-motion: reduce) { .sm-foto, .sm-brilho, .sm-linha, .sm-cartao { transition: none; } }
      `}</style>
    </main>
  )
}
