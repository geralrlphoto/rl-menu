import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '25b220116d8a80d8b92eecc29b63f6d1'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')  return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')   return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'select') return p.select?.name ?? null
    if (type === 'status') return p.status?.name ?? null
    if (type === 'date')   return p.date?.start ?? null
    if (type === 'email')  return p.email ?? null
    if (type === 'phone')  return p.phone_number ?? null
  } catch { return null }
  return null
}

export async function GET() {
  const allRows: any[] = []
  let cursor: string | null = null

  do {
    const body: any = {
      page_size: 100,
      sorts: [{ property: 'Data do fecho', direction: 'ascending' }],
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }

    const data = await res.json()
    allRows.push(...data.results)
    cursor = data.has_more ? data.next_cursor : null
  } while (cursor)

  const portais = allRows.map((page: any) => {
    const p = page.properties ?? {}
    return {
      id:           page.id,
      notion_url:   page.url,
      nome:         getProp(p, 'Nome do projeto', 'title'),
      tipo_evento:  getProp(p, 'Tipo de Evento',  'select'),
      status:       getProp(p, 'Status',           'status'),
      data_fecho:   getProp(p, 'Data do fecho',    'date'),
      local:        getProp(p, 'Local da Produção','text'),
      email:        getProp(p, 'EMAIL',             'email'),
      telefone:     getProp(p, 'Telefone',          'phone'),
      responsavel:  getProp(p, 'Responsável',       'text'),
    }
  })

  return NextResponse.json({ portais })
}
