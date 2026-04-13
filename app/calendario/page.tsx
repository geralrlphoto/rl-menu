import CalendarClient, { type CalEvent } from './CalendarClient'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date')         return p.date?.start ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
  } catch { return null }
  return null
}

export default async function CalendarioPage() {
  // Fetch all events from Notion
  const allPages: any[] = []
  let cursor: string | null = null

  do {
    const body: any = {
      page_size: 100,
      sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) break
    const data = await res.json()
    allPages.push(...data.results)
    cursor = data.has_more ? data.next_cursor : null
  } while (cursor)

  const events: CalEvent[] = allPages
    .map((page: any) => {
      const p = page.properties ?? {}
      return {
        id:          page.id,
        referencia:  getProp(p, 'REFERÊNCIA DO EVENTO', 'title') ?? '',
        cliente:     getProp(p, 'CLIENTE', 'text') ?? '',
        data_evento: getProp(p, 'DATA DO EVENTO', 'date'),
        local:       getProp(p, 'LOCAL', 'text'),
        tipo_evento: getProp(p, 'TIPO DE EVENTO', 'multi_select') ?? [],
        fotografo:   getProp(p, 'FOTOGRAFO', 'multi_select') ?? [],
        videografo:  getProp(p, 'VÍDEOGRAFO ', 'multi_select') ?? [],
      }
    })
    .filter(e => e.data_evento !== null)

  return <CalendarClient events={events} />
}
