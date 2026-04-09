import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import NovoPortalButton from './NovoPortalButton'

export const revalidate = 30

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

function formatDate(d: string | null | undefined) {
  if (!d) return null
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

function getText(props: any, key: string) {
  return props[key]?.rich_text?.map((t: any) => t.plain_text).join('') || null
}
function getTitle(props: any, key: string) {
  return props[key]?.title?.map((t: any) => t.plain_text).join('') || null
}

type Portal = { referencia: string; noiva: string | null; noivo: string | null; data: string | null; settings?: any }

export default async function PortaisClientesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.from('portais').select('referencia,noiva,noivo,data,settings').order('referencia')
  const portals: Portal[] = (data ?? []).map(p => ({
    ...p,
    noiva: p.noiva || p.settings?.noiva || null,
    noivo: p.noivo || p.settings?.noivo || null,
    data:  p.data  || p.settings?.data  || null,
  }))

  // For portals missing names, fetch from Notion Eventos 2026
  const missing = portals.filter(p => !p.noiva && !p.noivo)
  if (missing.length > 0 && process.env.NOTION_TOKEN) {
    try {
      const orFilter = missing.map(p => ({
        property: 'REFERÊNCIA DO EVENTO', title: { equals: p.referencia }
      }))
      const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: orFilter.length === 1 ? orFilter[0] : { or: orFilter },
          page_size: 50,
        }),
        cache: 'no-store',
      })
      if (res.ok) {
        const nd = await res.json()
        for (const page of nd.results ?? []) {
          const ref = getTitle(page.properties, 'REFERÊNCIA DO EVENTO')
          const portal = portals.find(p => p.referencia === ref)
          if (portal) {
            portal.noiva = getText(page.properties, 'Nome da Noiva') || portal.noiva
            portal.noivo = getText(page.properties, 'nome do noivo') || portal.noivo
          }
        }
      }
    } catch { /* silently ignore */ }
  }

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
      <section className="py-8 px-4">
        {portals.length === 0 ? (
          <p className="text-white/20 text-sm tracking-widest text-center py-16">SEM PORTAIS CRIADOS</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-w-5xl mx-auto">
            {portals.map((portal) => (
              <Link
                key={portal.referencia}
                href={`/portal-cliente/ref/${encodeURIComponent(portal.referencia)}`}
                className="group flex flex-col justify-between gap-2 px-4 py-4 rounded-xl bg-black border border-white/40 hover:border-white/70 transition-all duration-300"
                style={{ boxShadow: '0 0 14px 3px rgba(255,255,255,0.12), 0 0 5px 1px rgba(255,255,255,0.18), inset 0 0 16px 0 rgba(255,255,255,0.04)' }}
              >
                <div className="flex flex-col gap-0.5">
                  {(portal.noiva || portal.noivo) ? (
                    <span className="font-playfair font-bold text-sm text-white leading-snug">
                      {[portal.noiva, portal.noivo].filter(Boolean).join(' & ')}
                    </span>
                  ) : (
                    <span className="font-mono text-white/25 text-[10px] tracking-widest uppercase">{portal.referencia}</span>
                  )}
                  {portal.data && (
                    <span className="font-cormorant italic text-white/35 text-xs">
                      ♡ {formatDate(portal.data)}
                    </span>
                  )}
                </div>
                <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm self-end">›</span>
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
