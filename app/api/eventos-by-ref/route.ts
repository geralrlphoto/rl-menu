import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ id: null })

  const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: ref } },
      page_size: 1,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return NextResponse.json({ id: null })
  const data = await res.json()
  if (!data.results?.length) return NextResponse.json({ id: null })

  return NextResponse.json({ id: data.results[0].id })
}
