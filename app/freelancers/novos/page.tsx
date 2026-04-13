'use client'

import Link from 'next/link'

export default function NovosFreelancersPage() {
  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Equipas de Trabalho
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Novos Freelancers</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
      </div>
    </main>
  )
}
