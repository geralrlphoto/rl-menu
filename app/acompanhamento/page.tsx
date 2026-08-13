import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────
   PÁGINA PÚBLICA · O NOSSO ACOMPANHAMENTO (para os noivos)
   Textos + fotos + vídeos. Edita os media aqui em baixo.
   Para os vídeos, cola o link normal do YouTube/Vimeo (é convertido
   automaticamente para embed) ou um link de embed direto.
   ────────────────────────────────────────────────────────────── */

const FOTOS = {
  hero: 'https://rl-menu-lake.vercel.app/casamentos-2028.png',
  s1: 'https://rl-menu-lake.vercel.app/casamentos-2028.png',
  s2: 'https://rl-menu-lake.vercel.app/casamentos-2028.png',
  s3: 'https://rl-menu-lake.vercel.app/casamentos-2028.png',
}

const VIDEOS = [
  { titulo: '', url: '' },
  { titulo: '', url: '' },
  { titulo: '', url: '' },
]

const SECCOES = [
  {
    titulo: 'O primeiro contacto',
    texto: 'Respondemos com rapidez e com verdade. Queremos conhecer-vos, a vossa história e aquilo que sonham para o vosso dia, sem pressas e sem guiões decorados.',
    foto: FOTOS.s1,
  },
  {
    titulo: 'A nossa reunião',
    texto: 'Gostamos de olhar-vos nos olhos, seja pessoalmente ou por videochamada. É aqui que nasce a relação de confiança e de amizade que depois se sente em cada fotografia.',
    foto: FOTOS.s2,
  },
  {
    titulo: 'O portal dos noivos',
    texto: 'Toda a informação num só sítio: a vossa proposta, os detalhes, os prazos e cada etapa do caminho. Simples, seguro e sempre à mão.',
    foto: FOTOS.s3,
  },
]

/* Converte um link normal do YouTube/Vimeo em URL de embed */
function toEmbed(url: string): string {
  if (!url) return ''
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

function VideoCard({ v }: { v: { titulo: string; url: string } }) {
  const embed = toEmbed(v.url)
  return (
    <div>
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
        {embed ? (
          <iframe
            src={embed}
            title={v.titulo || 'Vídeo'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/25 gap-2">
            <span className="text-3xl">▶</span>
            <span className="text-xs tracking-[0.25em] uppercase">Vídeo em breve</span>
          </div>
        )}
      </div>
      {v.titulo && <p className="text-white/50 text-sm tracking-wide mt-3 text-center">{v.titulo}</p>}
    </div>
  )
}

export default function AcompanhamentoPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* ── HERO ── */}
      <section className="relative h-[80vh] min-h-[520px] w-full overflow-hidden">
        <img src={FOTOS.hero} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative h-full max-w-[1100px] mx-auto px-5 sm:px-8 flex flex-col justify-end pb-16 sm:pb-24">
          <span className="text-xs tracking-[0.4em] uppercase text-gold/80">O nosso acompanhamento</span>
          <h1 className="text-5xl sm:text-7xl font-extralight tracking-[0.06em] text-white mt-5 leading-[1.05]">
            Convosco em<br />cada passo
          </h1>
          <div className="w-20 h-px bg-gold/70 mt-6" />
          <p className="text-white/70 text-base sm:text-lg font-light tracking-wide mt-6 max-w-xl">
            Desde o primeiro olá até muito depois do grande dia.
          </p>
        </div>
      </section>

      {/* ── INTRODUÇÃO ── */}
      <section className="max-w-[820px] mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center">
        <p className="text-white/70 text-xl sm:text-2xl font-extralight leading-relaxed tracking-wide">
          Para nós, um casamento não começa no dia da cerimónia. Começa no momento em que nos escrevem pela primeira vez. A partir daí, caminhamos ao vosso lado, com proximidade, atenção e a tranquilidade de saberem que estão em boas mãos.
        </p>
      </section>

      {/* ── SECÇÕES ALTERNADAS ── */}
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 flex flex-col gap-20 sm:gap-28 pb-24 sm:pb-32">
        {SECCOES.map((s, i) => {
          const invert = i % 2 === 1
          return (
            <div key={s.titulo} className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14 items-center">
              <div className={invert ? 'md:order-2' : ''}>
                <div className="aspect-[4/5] w-full rounded-3xl overflow-hidden border border-white/10">
                  <img src={s.foto} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className={invert ? 'md:order-1' : ''}>
                <span className="text-gold/60 text-sm tracking-[0.3em]">0{i + 1}</span>
                <h2 className="text-3xl sm:text-4xl font-extralight tracking-wide text-white mt-3 mb-5">{s.titulo}</h2>
                <div className="w-12 h-px bg-gold/50 mb-6" />
                <p className="text-white/55 text-base sm:text-lg font-light leading-relaxed">{s.texto}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── VÍDEOS ── */}
      <section className="bg-white/[0.02] border-y border-white/8 py-20 sm:py-28">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <span className="text-xs tracking-[0.4em] uppercase text-gold/70">Histórias em movimento</span>
            <h2 className="text-3xl sm:text-5xl font-extralight tracking-wide text-white mt-4">Alguns dos nossos casamentos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {VIDEOS.map((v, i) => <VideoCard key={i} v={v} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-[820px] mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
        <h2 className="text-4xl sm:text-6xl font-extralight tracking-wide text-white leading-tight">Vamos conhecer-vos?</h2>
        <p className="text-white/55 text-base sm:text-lg font-light mt-6 max-w-lg mx-auto">
          Contem-nos um pouco sobre o vosso dia. Bastam dois minutos e nós tratamos do resto.
        </p>
        <Link
          href="/nova-lead"
          className="inline-block mt-10 px-10 py-4 rounded-full bg-gold text-black text-sm font-semibold tracking-[0.2em] uppercase hover:bg-gold/90 transition-colors"
        >
          Preencher formulário
        </Link>
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase mt-10">RL Photo · Video · @rl.photo.video</p>
      </section>
    </main>
  )
}
