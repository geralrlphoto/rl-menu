import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '306220116d8a808e9fc0d77766504e52'
const HEADERS = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')      return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'rich_text')  return p.rich_text?.map((t: any) => t.plain_text).join('') ?? null
    if (type === 'date')       return p.date?.start ?? null
    if (type === 'status')     return p.status?.name ?? null
    if (type === 'select')     return p.select?.name ?? null
    if (type === 'formula') {
      const f = p.formula
      if (!f) return null
      return f.string ?? f.date?.start ?? f.number ?? null
    }
  } catch { return null }
  return null
}

function parseRow(page: any) {
  const p = page.properties ?? {}
  return {
    id: page.id,
    nome:                  getProp(p, 'Nome', 'title'),
    status:                getProp(p, 'Status', 'status'),
    data_entrega_fotos:    getProp(p, 'Data de entrega de fotos', 'date'),
    prazo_maquete:         getProp(p, 'Prazo maquete', 'date'),
    data_aprovacao:        getProp(p, 'Data de aprovação', 'date'),
    prazo_album:           getProp(p, 'Prazo álbum', 'date'),
    entrega_album:         getProp(p, 'ENTREGA DE ÁLBUM', 'formula'),
    prazo_final_maquete:   getProp(p, 'Prazo final maquete', 'formula'),
    data_prevista_entrega: getProp(p, 'Data prevista de entrega', 'date'),
    ref_evento:            getProp(p, 'REF. EVENTO', 'rich_text'),
    ref_album:             getProp(p, 'REF. ÁLBUM', 'rich_text'),
    design:                getProp(p, 'Design', 'rich_text'),
    num_fotografias:       getProp(p, 'N.º de Fotografias', 'rich_text'),
    numero_fotografias:    getProp(p, 'Número de Fotografias', 'rich_text'),
    opcao:                 getProp(p, 'OPÇÃO', 'select'),
    texto_album:           getProp(p, 'Texto para Álbum', 'rich_text'),
    texto_caixa:           getProp(p, 'Texto para caixa', 'rich_text'),
  }
}

export async function GET() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ sorts: [{ property: 'Nome', direction: 'ascending' }] }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    const data = await res.json()
    const rows = data.results.map(parseRow)
    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { nome, ref_evento, check_existing } = body

    // If check_existing, query Notion first to avoid duplicates
    if (check_existing && ref_evento) {
      const checkRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          filter: { property: 'REF. EVENTO', rich_text: { equals: ref_evento } },
          page_size: 1,
        }),
        cache: 'no-store',
      })
      const checkData = await checkRes.json()
      if (checkData.results?.length > 0) {
        return NextResponse.json({ row: parseRow(checkData.results[0]), already_exists: true })
      }
    }

    const properties: any = {
      Nome: { title: [{ text: { content: nome || 'Novo Álbum' } }] },
    }
    if (ref_evento) {
      properties['REF. EVENTO'] = { rich_text: [{ text: { content: ref_evento } }] }
    }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties }),
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    const page = await res.json()
    return NextResponse.json({ row: parseRow(page) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
