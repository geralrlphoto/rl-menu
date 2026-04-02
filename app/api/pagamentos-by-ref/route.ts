import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2d9220116d8a80a1b6d1fb127c5d7fdd'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date')         return p.date?.start ? p.date.start.split('T')[0] : null
    if (type === 'number')       return p.number ?? null
    if (type === 'checkbox')     return p.checkbox ?? false
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
  } catch { return null }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ payments: [] })

  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'REFERÊNCIA DO EVENTO',
        rich_text: { equals: ref },
      },
      page_size: 50,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: res.status })
  }

  const data = await res.json()
  const payments = data.results.map((page: any) => {
    const p = page.properties ?? {}
    return {
      id:               page.id,
      nome_noivos:      getProp(p, 'NOME DOS NOIVOS',     'title'),
      referencia:       getProp(p, 'REFERÊNCIA DO EVENTO','text'),
      data_casamento:   getProp(p, 'DATA DO CASAMENTO',   'date'),
      data_pagamento:   getProp(p, 'DATA DO PAGAMENTO',   'date'),
      fase_pagamento:   getProp(p, 'FASE DO PAGAMENTO',   'multi_select'),
      metodo_pagamento: getProp(p, 'MÉTODO DE PAGAMENTO', 'multi_select'),
      valor_liquidado:  getProp(p, 'VALOR LIQUIDADO',     'number'),
      atualizado:       getProp(p, 'ATUALIZADO',          'checkbox'),
    }
  })

  return NextResponse.json({ payments })
}
