import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function OrcamentoDeslocacaoPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <Link
        href="/secao/657aa823-19f0-4bc8-a1a1-a0a712f6d6e0"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-12 uppercase"
      >
        ‹ Voltar
      </Link>

      <header className="mb-12">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">
          Orçamento de Deslocação
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-gold/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {/* Aguarda mais instruções do admin */}
    </main>
  )
}
