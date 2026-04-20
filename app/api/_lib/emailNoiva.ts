const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1'

/**
 * Resolve email da noiva — usa o valor passado se existir,
 * caso contrário vai buscar ao Notion pela referência do evento.
 */
export async function resolveEmailNoiva(
  emailNoiva: string | null | undefined,
  referencia: string | null | undefined
): Promise<string | null> {
  if (emailNoiva) return emailNoiva
  if (!referencia) return null
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: referencia } },
        page_size: 1,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const page = data.results?.[0]
    if (!page) return null
    return page.properties?.['E-mail da noiva']?.email ?? null
  } catch { return null }
}
