import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'
const OPTIONS = [
  { name: 'Aguardar', color: 'gray' },
  { name: 'Em Edição', color: 'yellow' },
  { name: 'Entregue', color: 'green' },
]

export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        'ESTADO SEL. FOTOS': { select: { options: OPTIONS } },
        'FOTOS P/ EDIÇÃO': { select: { options: OPTIONS } },
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: res.status })
  return NextResponse.json({ ok: true, created: ['ESTADO SEL. FOTOS', 'FOTOS P/ EDIÇÃO'] })
}
