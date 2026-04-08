import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]; if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'select')       return p.select?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number')       return p.number ?? p.formula?.number ?? null
    if (type === 'date')         return p.date?.start ?? null
  } catch { return null }
  return null
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
    method: 'POST', headers: notionH, cache: 'no-store',
    body: JSON.stringify({
      filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: ref } },
      page_size: 1,
    }),
  })
  if (!res.ok) return NextResponse.json({ error: 'Notion error' }, { status: 500 })

  const data = await res.json()
  const page = data.results?.[0]
  if (!page) return NextResponse.json({ found: false })

  const p = page.properties ?? {}
  return NextResponse.json({
    found: true,
    evento: {
      id:           page.id,
      referencia:   getProp(p, 'REFERÊNCIA DO EVENTO', 'title'),
      cliente:      getProp(p, 'CLIENTE', 'text'),
      data_evento:  getProp(p, 'DATA DO EVENTO', 'date'),
      local:        getProp(p, 'LOCAL', 'text'),
      proposta:     getProp(p, 'PROPOSTA ESCOLHIDA', 'select'),
      servico_foto: getProp(p, 'serviço de fotografia', 'multi_select'),
      servico_video:getProp(p, 'serviço de video', 'multi_select'),
      valor_foto:   getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
      valor_video:  getProp(p, 'VALOR DO SERVIÇO VÍDEO', 'number'),
      valor_liquido:getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
    },
  })
}
