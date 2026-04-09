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
}

export default async function PortaisClientesPage() {
  const topBlocks = await getBlocks(MAIN_PORTAL_ID)
  const childPages = topBlocks.filter((b: any) => b.type === 'child_page')

  const allPages = [
    { id: MAIN_PORTAL_ID, title: 'Portal Principal' },
    ...childPages.map((b: any) => ({ id: b.id, title: b.child_page?.title ?? '' })),
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
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10"
      >
        ‹ VOLTAR AO MENU
      </Link>

      <header className="mb-10">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">
          Portal do Cliente
        </h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {portals.length === 0 ? (
        <p className="text-white/20 text-sm tracking-widest text-center py-16">SEM PORTAIS CRIADOS</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {portals.map((portal) => (
            <Link
              key={portal.pageId}
              href={`/portal-cliente/${portal.pageId}`}
              className="group flex flex-col gap-1.5 px-5 py-4 border border-gold/30 rounded-xl bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs tracking-widest text-gold/70 group-hover:text-gold uppercase font-mono">
                  {portal.referencia ?? '—'}
                </span>
                <span className="text-gold/50 group-hover:text-gold text-lg transition-colors shrink-0">›</span>
              </div>
              {(portal.noiva || portal.noivo) && (
                <p className="text-sm text-white/80 group-hover:text-white tracking-wide">
                  {[portal.noiva, portal.noivo].filter(Boolean).join(' & ')}
                </p>
              )}
              {portal.data && (
                <p className="text-xs text-white/30 tracking-wider">
                  {formatDate(portal.data)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
