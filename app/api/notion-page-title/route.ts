import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ title: '' })

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
    },
    cache: 'no-store',
  })

  if (!res.ok) return NextResponse.json({ title: '' })

  const data = await res.json()
  const props = data.properties ?? {}

  // Try title property
  const titleProp = Object.values(props).find((p: any) => p.type === 'title') as any
  const title = titleProp?.title?.map((t: any) => t.plain_text).join('') ?? ''

  // Fallback: check child_page title from parent
  const childTitle = data.properties?.title?.title?.[0]?.plain_text ?? ''

  return NextResponse.json({ title: title || childTitle || data.url?.split('-').pop() || '' })
}
