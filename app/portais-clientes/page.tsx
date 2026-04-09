import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import NovoPortalButton from './NovoPortalButton'

export const revalidate = 30

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null | undefined) {
  if (!d) return null
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

type Portal = { referencia: string; noiva: string | null; noivo: string | null; data: string | null }

export default async function PortaisClientesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.from('portais').select('referencia,noiva,noivo,data').order('referencia')
  const portals: Portal[] = data ?? []

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Admin bar — igual ao portal-cliente */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <Link href="/" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
          ‹ Menu
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/portal-cliente" className="text-[10px] tracking-widest text-white/40 hover:text-white/70 transition-colors uppercase border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg">
            Portal Principal
          </Link>
          <NovoPortalButton />
        </div>
      </div>

      {/* Hero — igual ao portal-cliente sem foto */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-end justify-center pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1408] to-[#0a0a0a]" />

        {/* Leaf SVG */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 opacity-30">
          <svg viewBox="0 0 80 30" className="w-16 sm:w-20 h-auto text-[#C9A84C] scale-x-[-1]" fill="currentColor">
            <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
            <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
            <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          </svg>
          <svg viewBox="0 0 80 30" className="w-16 sm:w-20 h-auto text-[#C9A84C]" fill="currentColor">
            <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
            <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
            <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          </svg>
        </div>

        <div className="relative z-10 text-center px-4">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-4">RL PHOTO.VIDEO</p>
          <h1 className="font-playfair font-black text-5xl sm:text-7xl lg:text-8xl text-white tracking-tight leading-none mb-4">
            Portal<br />
            <span className="text-white">do Cliente</span>
          </h1>
          <p className="font-cormorant text-white/40 text-base sm:text-lg italic tracking-wide">
            ♡ Seleciona o teu portal
          </p>
        </div>
      </section>

      {/* Lista de portais */}
      <section className="py-10 sm:py-16 px-4">

        {portals.length === 0 ? (
          <p className="text-white/20 text-sm tracking-widest text-center py-16">SEM PORTAIS CRIADOS</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {portals.map((portal) => (
              <Link
                key={portal.referencia}
                href={`/portal-cliente/ref/${encodeURIComponent(portal.referencia)}`}
                className="group relative flex flex-col justify-between gap-6 p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.07] hover:border-[#C9A84C]/30 transition-all duration-500 overflow-hidden"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/0 to-[#C9A84C]/0 group-hover:from-[#C9A84C]/[0.03] group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                {/* Top: ref + arrow */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/25 font-mono">
                    {portal.referencia}
                  </span>
                  <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-[#C9A84C]/50 transition-all duration-300 shrink-0 mt-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </div>

                {/* Bottom: names + date */}
                <div className="flex flex-col gap-1">
                  {/* Gold divider */}
                  <div className="w-6 h-px bg-[#C9A84C]/30 mb-3 group-hover:w-10 group-hover:bg-[#C9A84C]/50 transition-all duration-500" />

                  {(portal.noiva || portal.noivo) ? (
                    <p className="font-playfair font-bold text-xl text-white/80 group-hover:text-white transition-colors leading-tight">
                      {[portal.noiva, portal.noivo].filter(Boolean).join(' & ')}
                    </p>
                  ) : (
                    <p className="font-playfair text-white/20 text-lg italic">Sem nome</p>
                  )}
                  {portal.data && (
                    <p className="font-cormorant italic text-[#C9A84C]/50 text-sm tracking-wide group-hover:text-[#C9A84C]/70 transition-colors">
                      ♡ {formatDate(portal.data)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer decorativo */}
      <div className="flex justify-center pb-16 pt-4">
        <span className="text-white/10 text-2xl">♡</span>
      </div>
    </div>
  )
}
