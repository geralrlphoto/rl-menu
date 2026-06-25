import Link from 'next/link'

// Fotos Convidados — atalho para a página de encomenda de fotografias.
export default function GaleriaConvidadosPage() {
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
            Fotos <span className="italic" style={{ color: '#c8a866' }}>Convidados</span>
          </h1>
          <div className="mt-4 h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(200,168,102,0.7), transparent)' }} />
        </header>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/adquirir-fotografias" target="_blank"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold tracking-wider uppercase transition-all"
            style={{ background: '#c8a866', color: '#0b0a08', boxShadow: '0 0 24px -6px rgba(200,168,102,0.6)' }}>
            ＋ Formulário de Fotos
          </Link>
        </div>
      </div>
    </main>
  )
}
