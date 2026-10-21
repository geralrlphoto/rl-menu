import Link from 'next/link'
import SubscritoresClient from './SubscritoresClient'
import '../blog.css'
import './subscritores.css'

/* ============================================================
   /social-media/blog/subscritores
   Página admin para gerir subscritores do blog.
   Topo no layout da app (como o do Blog e do /social-media).
   ============================================================ */

export default function BlogSubscritoresPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707]">
      {/* A Jost tem de vir num <style>: o build de produção tira os @import dos .css */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&display=swap');
        .sub-stat { border-radius: 22px; background: rgba(17,17,17,0.8); backdrop-filter: blur(24px); }
        .sub-stat-value { font-family: 'Roboto Condensed', sans-serif; font-weight: 100; font-size: 46px; }
      `}</style>

      {/* ── Topo ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[420px] lg:min-h-[56vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img src="/eventos-hero-2026.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Email · Data · Estado
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <Link href="/social-media/blog" className="self-start text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar ao Blog</Link>
          <div className="mt-auto pt-14">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Blog</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[50px] sm:text-[96px] lg:text-[120px] mt-2">Subscritores</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Adicionar · Exportar · <span className="text-[#C9A84C]">Cancelar</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
              Lista de quem subscreveu o blog. Cada subscrição guarda o <strong className="text-white/80 font-semibold">email</strong> e
              a <strong className="text-white/80 font-semibold">data exata</strong>. Podes adicionar manualmente, exportar para CSV ou marcar como cancelado.
            </p>
          </div>
        </div>
      </section>

      <div className="blg-page">
        <SubscritoresClient />
      </div>
    </main>
  )
}
