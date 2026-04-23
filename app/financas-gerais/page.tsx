'use client'

import Link from 'next/link'

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
    </main>
  )
}
