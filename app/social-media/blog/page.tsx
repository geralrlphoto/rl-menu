import Link from 'next/link'
import BlogClient from './BlogClient'
import './blog.css'

/* ============================================================
   /social-media/blog
   Server page apenas com o frame; toda a interactividade
   (botão IA, modal, lista) está em BlogClient.
   Topo no layout da app (como o do CRM e do /social-media).
   ============================================================ */

export default function BlogIdeasPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707]">
      {/* A Jost tem de vir num <style>: o build de produção tira os @import dos .css */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&display=swap');
        .blg-card, .ai-modal { border-radius: 22px; }
        .blg-card { backdrop-filter: blur(24px); }
        .blg-card:hover { border-color: rgba(201,168,76,0.45); box-shadow: 0 0 48px -22px rgba(201,168,76,0.5); }
      `}</style>

      {/* ── Topo ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[460px] lg:min-h-[60vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img src="/eventos-hero-2026.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Artigo · Instagram · Facebook
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link href="/social-media" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar a Social Media</Link>
            <Link href="/social-media/blog/subscritores"
              className="inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md font-semibold text-[15px] text-white px-5 py-2.5 transition-all border border-[#C9A84C]/45 hover:border-[#C9A84C]/80 shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)]">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Subscritores
            </Link>
          </div>
          <div className="mt-auto pt-14">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">Social Media</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[64px] sm:text-[110px] lg:text-[140px] mt-2">Blog</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Artigo · Instagram · <span className="text-[#C9A84C]">Facebook</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
              Modo grátis. O sistema gera-te um prompt pronto a copiar para pedires conteúdo ao Claude no chat.
              Tu colas a resposta de volta e fica tudo guardado aqui: artigo, caption Instagram, post Facebook.
              Clica no <strong className="text-white/80 font-semibold">boneco</strong> em baixo à direita para começar.
            </p>
          </div>
        </div>
      </section>

      {/* Cliente: botão IA + lista + modal */}
      <div className="blg-page">
        <BlogClient />
      </div>
    </main>
  )
}
