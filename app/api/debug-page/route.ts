import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') ?? '2be22011-6d8a-808c-8440-f543d9c06818'

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
    cache: 'no-store',
  })
  const data = await res.json()
  const props = data.properties ?? {}

  const selectFields = Object.entries(props)
    .filter(([, v]: any) => v?.type === 'select' || v?.type === 'status')
    .map(([k, v]: any) => ({ key: k, value: v?.select?.name ?? v?.status?.name }))

  const allKeys = Object.keys(props)
  const estadoKeys = allKeys.filter(k => k.toLowerCase().includes('estado') || k.toLowerCase().includes('entrega'))

  return NextResponse.json({ selectFields, estadoKeys })
}
