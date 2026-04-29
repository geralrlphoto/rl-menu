import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2d9220116d8a80a1b6d1fb127c5d7fdd'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date')         return p.date?.start ?? null
    if (type === 'number')       return p.number ?? null
    if (type === 'checkbox')     return p.checkbox ?? false
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
  } catch { return null }
  return null
}

export async function GET() {
  try {
    // ── 1. Supabase — todos os registos (fonte primária) ─────────────────────────
    const { data: sbData } = await db()
      .from('pagamentos_noivos')
      .select('id, nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado, atualizado, notion_id')
      .order('data_casamento', { ascending: true, nullsFirst: false })

    const sbRows: any[] = (sbData ?? []).map(row => ({
      id:               row.id,
      nome_noivos:      row.nome_noivos,
      referencia:       row.referencia ?? '',
      data_casamento:   row.data_casamento,
      data_pagamento:   row.data_pagamento,
      fase_pagamento:   Array.isArray(row.fase_pagamento) ? row.fase_pagamento : [],
      metodo_pagamento: Array.isArray(row.metodo_pagamento) ? row.metodo_pagamento : [],
      valor_liquidado:  row.valor_liquidado,
      atualizado:       row.atualizado ?? false,
      notion_id:        row.notion_id,
    }))

    const notionIdsCovertos = new Set(sbRows.map(r => r.notion_id).filter(Boolean))

    // ── 2. Notion — só registos históricos sem entrada Supabase ──────────────────
    const notionOrphans: any[] = []
    try {
      let cursor: string | null = null
      do {
        const body: any = { page_size: 100, sorts: [{ property: 'DATA DO CASAMENTO', direction: 'ascending' }] }
        if (cursor) body.start_cursor = cursor
        const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
          body: JSON.stringify(body), cache: 'no-store',
        })
        if (!res.ok) break
        const data = await res.json()
        for (const page of data.results ?? []) {
          if (notionIdsCovertos.has(page.id)) continue
          const p = page.properties ?? {}
          notionOrphans.push({
            id:               page.id,
            nome_noivos:      getProp(p, 'NOME DOS NOIVOS',      'title'),
            referencia:       getProp(p, 'REFERÊNCIA DO EVENTO', 'text') ?? '',
            data_casamento:   getProp(p, 'DATA DO CASAMENTO',    'date'),
            data_pagamento:   getProp(p, 'DATA DO PAGAMENTO',    'date'),
            fase_pagamento:   getProp(p, 'FASE DO PAGAMENTO',    'multi_select') ?? [],
            metodo_pagamento: getProp(p, 'MÉTODO DE PAGAMENTO',  'multi_select') ?? [],
            valor_liquidado:  getProp(p, 'VALOR LIQUIDADO',      'number'),
            atualizado:       getProp(p, 'ATUALIZADO',           'checkbox') ?? false,
          })
        }
        cursor = data.has_more ? data.next_cursor : null
      } while (cursor)
    } catch { /* Notion em baixo — continua sem histórico */ }

    const rows = [...sbRows, ...notionOrphans]
    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try { body = await req.json() } catch { /* sem body → linha vazia na página financas */ }

    const {
      nome_noivos,
      referencia,
      data_casamento,
      data_pagamento,
      fase_pagamento,
      metodo_pagamento,
      valor_liquidado,
    } = body

    // ── Supabase como fonte primária — sem dependência do Notion ─────────────────
    const { data, error } = await db()
      .from('pagamentos_noivos')
      .insert({
        nome_noivos:      nome_noivos ?? 'Novo Registo',
        referencia:       referencia ?? null,
        data_casamento:   data_casamento ?? null,
        data_pagamento:   data_pagamento ?? null,
        fase_pagamento:   fase_pagamento ?? [],
        metodo_pagamento: metodo_pagamento ?? [],
        valor_liquidado:  valor_liquidado ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const row = {
      id:               data.id,          // UUID Supabase — sem notion_XXX
      nome_noivos:      data.nome_noivos,
      referencia:       data.referencia ?? '',
      data_casamento:   data.data_casamento,
      data_pagamento:   data.data_pagamento,
      fase_pagamento:   Array.isArray(data.fase_pagamento) ? data.fase_pagamento : [],
      metodo_pagamento: Array.isArray(data.metodo_pagamento) ? data.metodo_pagamento : [],
      valor_liquidado:  data.valor_liquidado,
      atualizado:       false,
    }

    return NextResponse.json({ row })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
