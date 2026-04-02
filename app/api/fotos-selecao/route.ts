import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '30d220116d8a80cf8568e19df7af1d7b'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')  return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date')  return p.date?.start ? p.date.start.split('T')[0] : null
  } catch { return null }
  return null
}

export async function GET() {
  try {
    const allRows: any[] = []
    let cursor: string | null = null
    do {
      const body: any = { page_size: 100, sorts: [{ property: 'Date', direction: 'ascending' }] }
      if (cursor) body.start_cursor = cursor
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      if (!res.ok) { const err = await res.json(); return NextResponse.json({ error: err.message }, { status: res.status }) }
      const data = await res.json()
      allRows.push(...data.results)
      cursor = data.has_more ? data.next_cursor : null
    } while (cursor)

    const rows = allRows.map((page: any) => {
      const p = page.properties ?? {}
      return {
        id:              page.id,
        nome_noivos:     getProp(p, 'NOME DOS NOIVOS',      'title'),
        referencia:      getProp(p, 'REFERÊNCIA DO EVENTO', 'text'),
        date:            getProp(p, 'Date',                 'date'),
        data_entrada:    getProp(p, 'Data  de Entrada',     'date'),
        sessao_noivos:   getProp(p, 'SESSÃO NOIVOS',        'text'),
        fotos_noiva:     getProp(p, 'FOTOS DA NOIVA',       'text'),
        fotos_noivo:     getProp(p, 'FOTOS DO NOIVO',       'text'),
        convidados:      getProp(p, 'CONVIDADOS',           'text'),
        cerimonia:       getProp(p, 'CERIMÓNIA',            'text'),
        bolo_bouquet:    getProp(p, 'BOLO E BOUQUET',       'text'),
        sala_animacao:   getProp(p, 'SALA E ANIMAÇÃO',      'text'),
        fotos_album:     getProp(p, 'FOTOS P/ÁLBUM',        'text'),
        detalhes:        getProp(p, 'DETALHES',             'text'),
      }
    })
    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties: { 'NOME DOS NOIVOS': { title: [{ text: { content: 'Novo Registo' } }] } },
      }),
    })
    if (!res.ok) { const err = await res.json(); return NextResponse.json({ error: err.message }, { status: res.status }) }
    const page = await res.json()
    const row = {
      id: page.id, nome_noivos: 'Novo Registo', referencia: '',
      date: null, data_entrada: null, sessao_noivos: '', fotos_noiva: '',
      fotos_noivo: '', convidados: '', cerimonia: '', bolo_bouquet: '',
      sala_animacao: '', fotos_album: '', detalhes: '',
    }
    return NextResponse.json({ row })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
