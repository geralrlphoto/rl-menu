import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '306220116d8a808e9fc0d77766504e52'
const HEADERS = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ id: null, data_prevista_entrega: null })

  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      filter: { property: 'REF. EVENTO', rich_text: { equals: ref } },
      page_size: 1,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return NextResponse.json({ id: null, data_prevista_entrega: null })
  const data = await res.json()
  if (!data.results?.length) return NextResponse.json({ id: null, data_prevista_entrega: null })

  const page = data.results[0]
  const p = page.properties ?? {}
  const data_prevista = p['Data prevista de entrega']?.date?.start ?? null

  const status = page.properties?.Status?.status?.name ?? null

  return NextResponse.json({ id: page.id, data_prevista_entrega: data_prevista, status })
}
