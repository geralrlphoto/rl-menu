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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ row: null })

  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: { property: 'REFERÊNCIA DO EVENTO', rich_text: { equals: ref } },
      page_size: 1,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return NextResponse.json({ row: null })
  const data = await res.json()
  if (!data.results?.length) return NextResponse.json({ row: null })

  const page = data.results[0]
  const p = page.properties ?? {}
  const row = {
    id:            page.id,
    nome_noivos:   getProp(p, 'NOME DOS NOIVOS',      'title'),
    referencia:    getProp(p, 'REFERÊNCIA DO EVENTO',  'text'),
    date:          getProp(p, 'Date',                  'date'),
    data_entrada:  getProp(p, 'Data  de Entrada',      'date'),
    sessao_noivos: getProp(p, 'SESSÃO NOIVOS',         'text'),
    fotos_noiva:   getProp(p, 'FOTOS DA NOIVA',        'text'),
    fotos_noivo:   getProp(p, 'FOTOS DO NOIVO',        'text'),
    convidados:    getProp(p, 'CONVIDADOS',            'text'),
    cerimonia:     getProp(p, 'CERIMÓNIA',             'text'),
    bolo_bouquet:  getProp(p, 'BOLO E BOUQUET',        'text'),
    sala_animacao: getProp(p, 'SALA E ANIMAÇÃO',       'text'),
    fotos_album:   getProp(p, 'FOTOS P/ÁLBUM',         'text'),
    detalhes:      getProp(p, 'DETALHES',              'text'),
  }
  return NextResponse.json({ row })
}
