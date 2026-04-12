import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '30d220116d8a80cf8568e19df7af1d7b'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text') {
      if (p.type === 'number' || p.number !== undefined) return p.number !== null && p.number !== undefined ? String(p.number) : ''
      return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    }
    if (type === 'date') return p.date?.start ? p.date.start.split('T')[0] : null
  } catch { return null }
  return null
}

export async function GET() {
  try {
    // 1. Read all records from Notion
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

    // 2. Map to Supabase rows — keep Notion page ID as Supabase id
    const rows = allRows.map((page: any) => {
      const p = page.properties ?? {}
      return {
        id:            page.id,
        nome_noivos:   getProp(p, 'NOME DOS NOIVOS',      'title') || null,
        referencia:    getProp(p, 'REFERÊNCIA DO EVENTO', 'text')  || null,
        date:          getProp(p, 'Date',                 'date'),
        data_entrada:  getProp(p, 'Data  de Entrada',     'date'),
        sessao_noivos: getProp(p, 'SESSÃO NOIVOS',        'text')  || null,
        fotos_noiva:   getProp(p, 'FOTOS DA NOIVA',       'text')  || null,
        fotos_noivo:   getProp(p, 'FOTOS DO NOIVO',       'text')  || null,
        convidados:    getProp(p, 'CONVIDADOS',           'text')  || null,
        cerimonia:     getProp(p, 'CERIMÓNIA',            'text')  || null,
        bolo_bouquet:  getProp(p, 'BOLO E BOUQUET',       'text')  || null,
        sala_animacao: getProp(p, 'SALA E ANIMAÇÃO',      'text')  || null,
        fotos_album:   getProp(p, 'FOTOS P/ÁLBUM',        'text')  || null,
        detalhes:      getProp(p, 'DETALHES',             'text')  || null,
      }
    })

    // 3. Upsert into Supabase (preserving existing records)
    const { error } = await db()
      .from('fotos_selecao')
      .upsert(rows, { onConflict: 'id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, migrated: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
