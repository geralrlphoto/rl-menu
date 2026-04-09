import Link from 'next/link'

export const revalidate = 60

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const MAIN_PORTAL_ID = '311220116d8a80d29468e817ae7bb79f'
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null | undefined) {
  if (!d) return null
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

async function getBlocks(pageId: string): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: notionH, cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

function extractSettings(blocks: any[]): Record<string, any> | null {
  for (const b of blocks) {
    if (b.type !== 'paragraph') continue
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      try { return JSON.parse(text.slice(SETTINGS_PREFIX.length)) } catch { /* continue */ }
    }
  }
  return null
}

type Portal = {
  pageId: string
  referencia: string | null
  noiva: string | null
  noivo: string | null
  data: string | null
  heroImageUrl?: string | null
}

export default async function PortaisClientesPage() {
  const topBlocks = await getBlocks(MAIN_PORTAL_ID)
  const childPages = topBlocks.filter((b: any) => b.type === 'child_page')

  const allPages = [
    { id: MAIN_PORTAL_ID },
    ...childPages.map((b: any) => ({ id: b.id })),
  ]

  const portals: Portal[] = (await Promise.all(
    allPages.map(async (p) => {
      const blocks = await getBlocks(p.id)
      const settings = extractSettings(blocks)
      if (!settings) return null
      return {
        pageId: p.id,
        referencia: settings.referencia ?? null,
        noiva: settings.noiva ?? null,
        noivo: settings.noivo ?? null,
        data: settings.data ?? settings.dataFormatada ?? null,
        heroImageUrl: settings.heroImageUrl ?? null,
      } as Portal
    })
  )).filter(Boolean) as Portal[]

  portals.sort((a, b) => {
    if (!a.referencia && !b.referencia) return 0
    if (!a.referencia) return 1
    if (!b.referencia) return -1
    return a.referencia.localeCompare(b.referencia)
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Admin bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <Link href="/" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
          ‹ Menu
        </Link>
      </div>

      {/* Header */}
      <div className="pt-20 pb-10 px-4 text-center">
        <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase mb-3">RL PHOTO.VIDEO</p>
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-2">Portal do Cliente</h1>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px w-12 bg-gold/30" />
          <div className="w-1 h-1 rounded-full bg-gold/50" />
          <div className="h-px w-12 bg-gold/30" />
        </div>
        <p className="text-xs text-white/30 tracking-widest mt-4 uppercase">Seleciona o teu portal</p>
      </div>

      {/* Portal cards */}
      <div className="px-4 pb-16 max-w-2xl mx-auto">
        {portals.length === 0 ? (
          <p className="text-white/20 text-sm tracking-widest text-center py-16">SEM PORTAIS CRIADOS</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {portals.map((portal) => (
              <Link
                key={portal.pageId}
                href={`/portal-cliente/${portal.pageId}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-gold/40 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)' }}
              >
                {/* Hero image if available */}
                {portal.heroImageUrl && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                    style={{ backgroundImage: `url(${portal.heroImageUrl})` }} />
                )}
                <div className="relative p-5 flex flex-col gap-2">
                  {/* Reference */}
                  <span className="text-[10px] tracking-[0.3em] text-gold/60 group-hover:text-gold uppercase font-mono transition-colors">
                    {portal.referencia ?? '—'}
                  </span>
                  {/* Names */}
                  {(portal.noiva || portal.noivo) && (
                    <p className="font-playfair text-lg text-white/90 group-hover:text-white transition-colors leading-tight">
                      {[portal.noiva, portal.noivo].filter(Boolean).join(' & ')}
                    </p>
                  )}
                  {/* Date */}
                  {portal.data && (
                    <p className="text-[11px] text-white/30 tracking-wider">
                      {formatDate(portal.data)}
                    </p>
                  )}
                  {/* Arrow */}
                  <div className="flex justify-end mt-1">
                    <span className="text-gold/30 group-hover:text-gold text-xl transition-all group-hover:translate-x-1 duration-200">›</span>
                  </div>
                </div>
                {/* Neon border glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 20px 0 rgba(212,175,55,0.06)' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
