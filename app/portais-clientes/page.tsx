import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import NovoPortalButton from './NovoPortalButton'
import CopiarLinkButton from './CopiarLinkButton'
import AdminPortalLink from './AdminPortalLink'

export const revalidate = 0

const MESES     = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

function formatDay(d: string) {
  try { return String(new Date(d + 'T00:00:00').getDate()).padStart(2, '0') } catch { return '' }
}
function formatMonthYear(d: string) {
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${MESES[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`
  } catch { return '' }
}
function formatMonthYearKey(d: string) {
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
  } catch { return '' }
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
  const { data } = await supabase.from('portais').select('referencia,noiva,noivo,data,settings').order('data', { ascending: true, nullsFirst: false })
  const portals: Portal[] = (data ?? []).map(p => ({
    ...p,
    noiva: p.noiva || p.settings?.noiva || null,
    noivo: p.noivo || p.settings?.noivo || null,
    data:  p.data  || p.settings?.data  || null,
  }))

  // Nomes em falta — buscar ao Notion
  const missing = portals.filter(p => !p.noiva && !p.noivo)
  if (missing.length > 0 && process.env.NOTION_TOKEN) {
    try {
      const orFilter = missing.map(p => ({ property: 'REFERÊNCIA DO EVENTO', title: { equals: p.referencia } }))
      const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: orFilter.length === 1 ? orFilter[0] : { or: orFilter }, page_size: 50 }),
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

  // Agrupar por mês/ano — nulls em separado
  const withDate    = portals.filter(p => p.data)
  const withoutDate = portals.filter(p => !p.data)

  const monthMap = new Map<string, { label: string; portals: Portal[] }>()
  for (const p of withDate) {
    const key   = formatMonthYearKey(p.data!)
    const label = formatMonthYear(p.data!)
    if (!monthMap.has(key)) monthMap.set(key, { label, portals: [] })
    monthMap.get(key)!.portals.push(p)
  }

  const groups = [...monthMap.values()]
  if (withoutDate.length > 0) groups.push({ label: 'Sem data', portals: withoutDate })

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* Barra de topo */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/"
          className="text-[10px] tracking-[0.35em] uppercase transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseEnter={undefined}>
          ‹ Menu
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] uppercase hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.2)' }}>
            {portals.length} portais
          </span>
          <Link href="/portal-cliente"
            className="text-[10px] tracking-widest uppercase border px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}>
            Portal Principal
          </Link>
          <NovoPortalButton />
        </div>
      </div>

      {/* Cabeçalho da página */}
      <div className="pt-24 pb-10 px-6 max-w-5xl mx-auto">
        <p className="text-[10px] tracking-[0.5em] uppercase mb-3" style={{ color: 'rgba(201,168,76,0.5)' }}>
          RL Photo · Video
        </p>
        <h1 className="font-playfair text-4xl sm:text-5xl font-light text-white mb-1">
          Portais de Clientes
        </h1>
        <p className="text-sm font-cormorant italic" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {portals.length} portais criados
        </p>
      </div>

      {/* Linha separadora */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px" style={{ background: 'linear-gradient(90deg,rgba(201,168,76,0.3),transparent)' }} />
      </div>

      {/* Grupos por mês */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {portals.length === 0 ? (
          <p className="text-center py-20 text-sm tracking-widest" style={{ color: 'rgba(255,255,255,0.15)' }}>
            SEM PORTAIS CRIADOS
          </p>
        ) : groups.map(group => (
          <section key={group.label}>

            {/* Cabeçalho do grupo */}
            <div className="flex items-center gap-4 mb-5">
              <p className="text-[11px] tracking-[0.4em] uppercase font-semibold shrink-0"
                style={{ color: group.label === 'Sem data' ? 'rgba(255,255,255,0.2)' : 'rgba(201,168,76,0.7)' }}>
                {group.label}
              </p>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {group.portals.length}
              </span>
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.portals.map(portal => {
                const nome = [portal.noiva, portal.noivo].filter(Boolean).join(' & ')
                const temNome = !!nome
                const dia  = portal.data ? formatDay(portal.data) : null

                return (
                  <div key={portal.referencia} className="flex flex-col gap-1.5">
                    <AdminPortalLink
                      referencia={portal.referencia}
                      className="group flex items-start justify-between gap-3 px-5 py-4 rounded-2xl text-left w-full transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Dia */}
                        {dia && (
                          <div className="shrink-0 text-center" style={{ minWidth: '28px' }}>
                            <span className="font-playfair font-bold text-xl leading-none" style={{ color: 'rgba(201,168,76,0.6)' }}>
                              {dia}
                            </span>
                          </div>
                        )}

                        {/* Nome + referência */}
                        <div className="min-w-0 flex-1">
                          {temNome ? (
                            <>
                              <p className="font-playfair font-semibold text-base text-white leading-snug truncate">
                                {nome}
                              </p>
                              <p className="font-mono text-[10px] mt-0.5 tracking-widest truncate"
                                style={{ color: 'rgba(255,255,255,0.2)' }}>
                                {portal.referencia}
                              </p>
                            </>
                          ) : (
                            <p className="font-mono text-sm tracking-widest truncate"
                              style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {portal.referencia}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Seta */}
                      <span className="shrink-0 text-sm transition-colors mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.2)' }}>
                        ›
                      </span>
                    </AdminPortalLink>

                    {/* Copiar link */}
                    <CopiarLinkButton referencia={portal.referencia} />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="pb-16 flex justify-center">
        <span style={{ color: 'rgba(255,255,255,0.08)', fontSize: '1.25rem' }}>♡</span>
      </div>
    </div>
  )
}
