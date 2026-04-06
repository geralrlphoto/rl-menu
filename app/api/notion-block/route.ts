import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function makeRichText(text: string) {
  return [{ type: 'text', text: { content: text } }]
}

function makeBlockBody(type: string, text: string, checked?: boolean) {
  if (type === 'to_do') return { to_do: { rich_text: makeRichText(text), checked: !!checked } }
  if (type === 'divider') return { divider: {} }
  return { [type]: { rich_text: makeRichText(text) } }
}

// PATCH — update existing block
export async function PATCH(req: Request) {
  const { id, type, text, checked } = await req.json()
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(makeBlockBody(type, text, checked)),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })
  return NextResponse.json({ ok: true })
}

// POST — append new block to a parent
export async function POST(req: Request) {
  const { parentId, type, text, checked } = await req.json()
  const res = await fetch(`https://api.notion.com/v1/blocks/${parentId}/children`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      children: [{ object: 'block', type, ...makeBlockBody(type, text, checked) }],
    }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })
  return NextResponse.json({ block: data.results?.[0] })
}

// DELETE — delete a block
export async function DELETE(req: Request) {
  const { id } = await req.json()
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json({ error: data.message }, { status: res.status })
  }
  return NextResponse.json({ ok: true })
}
