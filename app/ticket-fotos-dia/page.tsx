import Link from 'next/link'

// Página em branco (placeholder) — Ticket Fotos/Dia. Conteúdo a definir.
export default function TicketFotosDiaPage() {
  return (
    <main className="min-h-screen text-white" style={{ background: '#120d08' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/secao/c3db95a8-67c5-4339-81c6-891af683f907"
          className="text-[12px] tracking-widest uppercase text-white/30 hover:text-[#c8a866] transition-colors">
          ‹ Voltar
        </Link>

        <header className="mt-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c8a866]/70 font-semibold">RL Photo · Video</p>
          <h1 className="text-3xl sm:text-4xl font-light mt-2" style={{ fontFamily: 'Georgia, serif' }}>
            Ticket <span className="italic" style={{ color: '#c8a866' }}>Fotos/Dia</span>
          </h1>
          <div className="mt-4 h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(200,168,102,0.7), transparent)' }} />
        </header>

        <div className="mt-16 rounded-2xl border border-white/[0.08] py-20 text-center"
          style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.02), rgba(200,168,102,0.015))' }}>
          <p className="text-[13px] text-white/35">Página em branco — conteúdo a definir.</p>
        </div>
      </div>
    </main>
  )
}
