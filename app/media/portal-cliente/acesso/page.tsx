import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AcessoPortalPage() {
  return (
    <main className="min-h-screen bg-[#02060f] relative">
      {/* Mesh gradient — mesmo de /media/portal-cliente */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'linear-gradient(180deg, #06122a 0%, #030814 55%, #02060f 100%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 95% 65% at 50% 0%, rgba(37,99,235,0.32) 0%, rgba(37,99,235,0.08) 35%, transparent 60%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 55% 70% at 0% 40%, rgba(56,189,248,0.14) 0%, transparent 55%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(59,130,246,0.16) 0%, transparent 60%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-10">
        {/* Back */}
        <Link href="/media/portal-cliente"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal Cliente
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL PROD · Photography &amp; Video</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Acesso ao Portal</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Página vazia — conteúdo virá depois */}
      </div>
    </main>
  )
}
