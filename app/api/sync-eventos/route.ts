import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

const DB_BY_YEAR: Record<number, string> = {
  2026: '1ad220116d8a804b839ddc36f1e7ecf1',
  2027: 'a9c8db8c0a6141ee839c1d0e5ad97915',
}

// Todos os anos usam a mesma tabela Supabase — filtrados por data_evento
const TABLE_BY_YEAR: Record<number, string> = {
  2026: 'eventos_2026',
  2027: 'eventos_2026',
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') || null
    if (type === 'text') return p.rich_text?.map((t: any) => t.plain_text).join('') || null
    if (type === 'date') return p.date?.start ?? null
    if (type === 'status') return p.status?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number') return p.number ?? p.formula?.number ?? null
    if (type === 'checkbox') return p.checkbox ?? false
  } catch { return null }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const anoParam = req.nextUrl.searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam) : 2026

    const DB = DB_BY_YEAR[ano]
    const table = TABLE_BY_YEAR[ano]
    if (!DB || !table) {
      return NextResponse.json({ error: `Ano ${ano} não suportado` }, { status: 400 })
    }

    // 1) Buscar todos do Notion
    const allPages: any[] = []
    let cursor: string | null = null
    do {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor
      const r = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const err = await r.json()
        return NextResponse.json({ error: err.message }, { status: r.status })
      }
      const d = await r.json()
      allPages.push(...d.results)
      cursor = d.has_more ? d.next_cursor : null
    } while (cursor)

    // 2) Buscar IDs existentes no Supabase
    const sb = supabase()
    const { data: existing } = await sb.from(table).select('notion_id')
    const existingIds = new Set((existing ?? []).map((r: any) => r.notion_id))

    // 3) Inserir os em falta
    const missing: any[] = []
    for (const page of allPages) {
      if (existingIds.has(page.id)) continue
      const p = page.properties ?? {}
      missing.push({
        notion_id: page.id,
        referencia: getProp(p, 'REFERÊNCIA DO EVENTO', 'title') || '',
        cliente: getProp(p, 'CLIENTE', 'text') || '',
        data_evento: getProp(p, 'DATA DO EVENTO', 'date'),
        local: getProp(p, 'LOCAL', 'text') || '',
        status: getProp(p, 'Status', 'status') || 'Não iniciada',
        fotos_enviadas: false,
        tipo_evento: JSON.stringify(getProp(p, 'TIPO DE EVENTO', 'multi_select') || []),
        tipo_servico: getProp(p, 'TIPO DE SERVIÇO', 'multi_select') || null,
        fotografo: JSON.stringify(getProp(p, 'FOTOGRAFO', 'multi_select') || []),
        valor_foto: getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
        valor_liquido: getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
      })
    }

    if (missing.length > 0) {
      const { error } = await sb.from(table).insert(missing)
      if (error) return NextResponse.json({ error: error.message, inserted: 0 }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      notion_count: allPages.length,
      supabase_existing: existingIds.size,
      inserted: missing.length,
      ano,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
