import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

export async function POST(req: NextRequest) {
  const { notion_id } = await req.json().catch(() => ({}))
  if (!notion_id) return NextResponse.json({ error: 'notion_id required' }, { status: 400 })

  const res = await fetch(`https://api.notion.com/v1/pages/${notion_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message ?? 'Notion error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
