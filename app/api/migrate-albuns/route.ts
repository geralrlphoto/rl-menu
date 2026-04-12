import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '306220116d8a808e9fc0d77766504e52'
const HEADERS = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

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
    if (type === 'title')     return p.title?.map((t: any) => t.plain_text).join('') || null
    if (type === 'rich_text') return p.rich_text?.map((t: any) => t.plain_text).join('') || null
    if (type === 'date')      return p.date?.start ?? null
    if (type === 'status')    return p.status?.name ?? null
    if (type === 'select')    return p.select?.name ?? null
    if (type === 'formula') {
      const f = p.formula
      if (!f) return null
      return f.string ?? f.date?.start ?? f.number ?? null
    }
  } catch { return null }
  return null
}

export async function GET() {
  try {
    // 1. Fetch all pages from Notion (handle pagination)
    let allResults: any[] = []
    let cursor: string | undefined

    do {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor

      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      const data = await res.json()
      allResults = [...allResults, ...(data.results ?? [])]
      cursor = data.has_more ? data.next_cursor : undefined
    } while (cursor)

    // 2. Parse rows
    const rows = allResults.map(page => {
      const p = page.properties ?? {}
      return {
        nome:                  getProp(p, 'Nome', 'title'),
        status:                getProp(p, 'Status', 'status') ?? 'NOVO ÁLBUM',
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
    }).filter(r => r.nome) // skip rows without a name

    // 3. Insert into Supabase (skip existing by nome)
    const supabase = db()
    let inserted = 0
    let skipped = 0

    for (const row of rows) {
      // Check if already exists by nome + ref_evento
      const query = supabase.from('albuns_casamento').select('id')
      if (row.ref_evento) {
        query.eq('ref_evento', row.ref_evento)
      } else {
        query.eq('nome', row.nome)
      }
      const { data: existing } = await query.maybeSingle()

      if (existing) { skipped++; continue }

      const { error } = await supabase.from('albuns_casamento').insert(row)
      if (!error) inserted++
    }

    return NextResponse.json({ ok: true, total: rows.length, inserted, skipped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
