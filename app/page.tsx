import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function BrandSelector() {
  return (
    <main
      className="relative min-h-screen w-screen overflow-hidden bg-[#1a1410] bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      {/* Layout side-by-side por cima do background — cada metade leva ao seu brand */}
      <div className="absolute inset-0 flex flex-col sm:flex-row">

        {/* ─── RL PHOTO.VIDEO (esquerda) ─────────────────────────── */}
        <Link
          href="/photo"
          aria-label="RL Photo.Video"
          className="flex-1 relative group cursor-pointer min-h-[50vh] sm:min-h-screen"
        >
          {/* Overlay hover suave (escurece ligeiramente para destaque ao passar) */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          {/* Tag "Entrar →" surge no canto inferior ao hover */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center sm:justify-start sm:pl-[12%] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Photo.Video</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>

        {/* ─── RL PROD (direita) ─────────────────────────────────── */}
        <Link
          href="/media"
          aria-label="RL Prod"
          className="flex-1 relative group cursor-pointer min-h-[50vh] sm:min-h-screen"
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center sm:justify-end sm:pr-[12%] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15">
              <span className="text-[9px] tracking-[0.5em] text-white/90 uppercase">RL Prod</span>
              <span className="text-white/70 text-sm">→</span>
            </div>
          </div>
        </Link>
      </div>
    </main>
  )
}
