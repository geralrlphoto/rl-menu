import Link from 'next/link'
import PedidosFotos from './PedidosFotos'
import EnviarFormularioWhatsApp from './EnviarFormularioWhatsApp'

// Fotos Convidados — painel de pedidos de fotografias (admin).
// Topo no layout da app (como o do CRM): linha dourada, título grande e foto a preto e branco.
export default function GaleriaConvidadosPage() {
  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707] text-white">

      {/* ── Topo ──────────────────────────────────────────────────────────── */}
      {/* Sem overflow-hidden na secção: o menu do Formulário de Fotos abre por cima da lista */}
      <section className="relative z-10 min-h-[520px] lg:min-h-[66vh] flex flex-col">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%] overflow-hidden">
          <img src="/eventos-hero-2028.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Pedido · Impressão · Entrega
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <Link href="/secao/c3db95a8-67c5-4339-81c6-891af683f907" className="self-start text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar</Link>
          <div className="mt-auto pt-14">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[56px] sm:text-[100px] lg:text-[130px] mt-2">Fotos<br />Convidados</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Pedido · Impressão · <span className="text-[#C9A84C]">Entrega</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
              Pedidos de fotografias dos convidados, do formulário ao envio. Estado, pagamento e entrega num só sítio.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <EnviarFormularioWhatsApp />
              <Link href="/ticket-fotos-dia" target="_blank"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3 text-[14px] font-semibold tracking-[0.16em] uppercase text-white/85 transition-all">
                Ticket
              </Link>
              <Link href="/apoio-fotografias" target="_blank"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3 text-[14px] font-semibold tracking-[0.16em] uppercase text-white/85 transition-all">
                Apoio ao Cliente
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 sm:px-10 pt-6 pb-20">
        <PedidosFotos />
      </div>
    </main>
  )
}
