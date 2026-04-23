'use client'

import Link from 'next/link'

const ANOS = [2025, 2026, 2027]

export default function FinancasGeraisPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10">
        ‹ VOLTAR AO MENU
      </Link>
      <header className="mb-10">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">Finanças Gerais</h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {ANOS.map(ano => (
          <Link key={ano} href={`/financas?ano=${ano}`}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold/30 transition-all duration-300 p-8 flex flex-col justify-between min-h-[200px]">

            {/* Fundo gradiente suave */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] to-transparent pointer-events-none" />

            <div className="relative">
              <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-2">Finanças</p>
              <p className="text-6xl font-extralight text-white tracking-wider leading-none group-hover:text-gold/80 transition-colors duration-300">
                {ano}
              </p>
            </div>

            <div className="relative flex items-center justify-between pt-6 border-t border-white/[0.06]">
              <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase group-hover:text-gold/60 transition-colors">
                Ver pagamentos
              </span>
              <span className="text-white/30 group-hover:text-gold transition-colors text-lg">›</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
