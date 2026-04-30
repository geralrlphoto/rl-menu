import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function BrandSelector() {
  return (
    <main className="relative min-h-screen bg-[#080808] flex flex-col sm:flex-row overflow-hidden">

      {/* ─── RL PHOTO.VIDEO ───────────────────────────────────────── */}
      <Link
        href="/photo"
        className="flex-1 relative overflow-hidden group cursor-pointer
                   min-h-[50vh] sm:min-h-screen flex items-end justify-start"
      >
        {/* Foto de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105
                     transition-transform duration-[1.4s] ease-out"
          style={{ backgroundImage: "url('/casamentos-2028.png')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-700" />
        {/* Vinheta lateral direita → funde com divisor */}
        <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-[#080808] to-transparent hidden sm:block" />
        {/* Gradiente fundo → conteúdo */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#080808]/90 via-[#080808]/40 to-transparent" />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col px-10 sm:px-14 pb-14 sm:pb-20 gap-4">
          <p className="text-[8px] tracking-[0.65em] text-white/25 uppercase">Fotografia & Vídeo</p>
          <div>
            <h2 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extralight tracking-[0.35em] text-white/90 uppercase leading-tight">
              RL <span className="text-[#C9A84C]">PHOTO</span>
            </h2>
            <h2 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extralight tracking-[0.35em] text-white/90 uppercase leading-tight">
              .VIDEO
            </h2>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="h-px w-8 bg-[#C9A84C]/50" />
            <span className="text-[9px] tracking-[0.4em] text-[#C9A84C]/40 group-hover:text-[#C9A84C]/70
                             transition-colors duration-300 uppercase">
              Casamentos · Retratos · Família
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
            <span className="text-[10px] tracking-[0.5em] text-white/30 group-hover:text-[#C9A84C]/60
                             transition-colors duration-300 uppercase">Entrar</span>
            <span className="text-[#C9A84C]/40 group-hover:text-[#C9A84C] transition-colors duration-300 text-sm">→</span>
          </div>
        </div>
      </Link>

      {/* ─── Divisor central ─────────────────────────────────────── */}
      {/* Mobile: linha horizontal */}
      <div className="block sm:hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {/* Desktop: linha vertical */}
      <div className="hidden sm:flex flex-col items-center justify-center w-px bg-transparent relative">
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white/20 ring-1 ring-white/10" />
      </div>

      {/* ─── RL MEDIA - AUDIOVISUAL ──────────────────────────────── */}
      <Link
        href="/media"
        className="flex-1 relative overflow-hidden group cursor-pointer
                   min-h-[50vh] sm:min-h-screen flex items-end justify-start"
      >
        {/* Foto de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105
                     transition-transform duration-[1.4s] ease-out"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=80')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/45 transition-colors duration-700" />
        {/* Vinheta lateral esquerda → funde com divisor */}
        <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-[#080808] to-transparent hidden sm:block" />
        {/* Gradiente fundo → conteúdo */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-[#080808]/90 via-[#080808]/40 to-transparent" />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col px-10 sm:px-14 pb-14 sm:pb-20 gap-4">
          <p className="text-[8px] tracking-[0.65em] text-white/25 uppercase">Produção Audiovisual</p>
          <div>
            <h2 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extralight tracking-[0.35em] text-white/90 uppercase leading-tight">
              RL <span className="text-white/60">MEDIA</span>
            </h2>
            <h2 className="text-[clamp(1.2rem,2.8vw,1.8rem)] font-extralight tracking-[0.25em] text-white/40 uppercase leading-tight mt-1">
              AUDIOVISUAL
            </h2>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="h-px w-8 bg-white/20" />
            <span className="text-[9px] tracking-[0.4em] text-white/25 group-hover:text-white/50
                             transition-colors duration-300 uppercase">
              Vídeo · Eventos · Corporativo
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
            <span className="text-[10px] tracking-[0.5em] text-white/30 group-hover:text-white/60
                             transition-colors duration-300 uppercase">Entrar</span>
            <span className="text-white/30 group-hover:text-white/70 transition-colors duration-300 text-sm">→</span>
          </div>
        </div>
      </Link>

      {/* ─── Label topo central ──────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-6 pointer-events-none z-20">
        <p className="text-[8px] tracking-[0.7em] text-white/15 uppercase">Menu Interno</p>
      </div>

    </main>
  )
}
