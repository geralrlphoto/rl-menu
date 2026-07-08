'use client'

import Link from 'next/link'

export default function FreelancerFormularioPage() {
  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-10">
        <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
          ← Equipas de Trabalho
        </Link>
        <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Formulário</h1>
        <div className="mt-2 h-px w-12 bg-gold/40" />
      </div>

      {/* Placeholder */}
      <div className="py-24 text-center text-white/20 text-xs tracking-widest uppercase border border-white/5 rounded-2xl">
        Página em branco
      </div>
    </main>
  )
}
