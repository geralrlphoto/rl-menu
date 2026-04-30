import Link from 'next/link'

export const revalidate = 60

const PORTAIS = [
  {
    ref:     'OLEOBIO',
    cliente: 'Oleobio, Lda',
    tipo:    'Produção Audiovisual',
    status:  'Em Produção',
    fase:    'Pré-Produção',
    data:    '25 Set 2025',
    href:    '/portal-media/OLEOBIO',
  },
]

export default function PortalClientePage() {
  return (
    <main className="min-h-screen bg-[#050507] relative">

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.045) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href="/media"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Menu RL Media
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · Audiovisual</p>
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Portal Cliente</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-12 bg-white/25" />
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-[8px] font-mono text-white/15">{String(PORTAIS.length).padStart(2, '0')} PORTAIS</span>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 mb-10">
          {PORTAIS.map((portal) => (
            <div key={portal.ref}
              className="group border border-white/[0.08] hover:border-white/18 bg-white/[0.02] hover:bg-white/[0.04]
                         transition-all duration-400 p-6 relative overflow-hidden">

              {/* Corner TL */}
              <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-3 h-px bg-white/30" /><div className="w-px h-3 bg-white/30" />
              </div>
              {/* Corner BR */}
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end">
                <div className="w-px h-3 bg-white/30" /><div className="w-3 h-px bg-white/30" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                {/* Info */}
                <div className="flex items-start gap-5">
                  {/* Icon box */}
                  <div className="w-11 h-11 border border-white/10 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ boxShadow: '0 0 20px rgba(180,200,255,0.06)' }}>
                    <span className="text-base text-white/20 select-none">◎</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-[13px] tracking-[0.3em] font-medium text-white/75 uppercase">
                        {portal.ref}
                      </h2>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[8px] tracking-[0.35em] text-blue-400/70 uppercase">{portal.status}</span>
                      </span>
                    </div>
                    <p className="text-[10px] tracking-[0.15em] text-white/30">{portal.cliente}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">{portal.tipo}</span>
                      <span className="text-white/10">·</span>
                      <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">Fase: {portal.fase}</span>
                      <span className="text-white/10">·</span>
                      <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">Entrega: {portal.data}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link href={portal.href} target="_blank"
                  className="shrink-0 flex items-center gap-3 border border-white/15 bg-white/[0.04]
                             hover:bg-white/[0.09] hover:border-white/30
                             px-5 py-3 transition-all duration-300 group/btn">
                  <span className="text-[9px] tracking-[0.4em] text-white/50 group-hover/btn:text-white/80 uppercase transition-colors whitespace-nowrap">
                    Abrir Portal
                  </span>
                  <span className="text-white/25 group-hover/btn:text-white/60 group-hover/btn:translate-x-0.5 transition-all duration-200">
                    →
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Novo portal placeholder */}
        <div className="border border-dashed border-white/[0.06] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-white/20 uppercase">Novo Portal</p>
            <p className="text-[9px] text-white/12 mt-1">Adiciona um novo cliente ao sistema</p>
          </div>
          <span className="text-[9px] tracking-[0.3em] text-white/12 uppercase">Em breve</span>
        </div>

      </div>
    </main>
  )
}
