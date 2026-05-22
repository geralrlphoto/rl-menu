'use client'

import Link from 'next/link'

export default function NovosProjetosPage() {
  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0B0B0B' }}>
      {/* Background atmosférico */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.06), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,164,92,0.04), transparent 70%)' }} />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-10">
        <Link href="/painel-editor"
          className="absolute top-6 left-6 text-[11px] tracking-[0.35em] text-white/30 hover:text-gold uppercase transition-colors">
          ‹ Voltar ao Painel
        </Link>

        <div className="text-center max-w-md">
          <p className="text-gold/50 text-6xl font-serif leading-none mb-6">+</p>
          <h1 className="text-3xl font-light tracking-tight text-white mb-3">Novos Projetos</h1>
          <div className="h-px w-16 bg-gold/40 mx-auto mb-5" />
          <p className="text-[14px] text-white/45 leading-relaxed">
            Página em branco — pronta para receber o teu prompt com a nova estrutura.
          </p>
        </div>
      </main>
    </div>
  )
}
