import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page_size: 1 }),
    cache: 'no-store',
  })
  const data = await res.json()
  // Get first 5 pages to look for video estado and formula
  const samples = data.results?.slice(0,5).map((page: any) => {
    const p = page.properties ?? {}
    return {
      cliente: p['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—',
      data_entrega_video: p['DATA ENTREGA VIDEO']?.formula?.string ?? null,
      estado_video_raw: p['ESTADO VÍDEO'] ?? 'NOT_FOUND',
      // Check all select/status fields
      selectFields: Object.entries(p)
        .filter(([, v]: any) => v?.type === 'select' || v?.type === 'status')
        .map(([k, v]: any) => ({ key: k, value: v?.select?.name ?? v?.status?.name }))
    }
  })
  return NextResponse.json({ samples })
}
