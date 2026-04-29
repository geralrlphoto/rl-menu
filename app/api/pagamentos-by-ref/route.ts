import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2d9220116d8a80a1b6d1fb127c5d7fdd'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

function refVariants(ref: string): string[] {
  const variants = new Set<string>([ref])
  variants.add(ref.replace(/_(\d{2})_RL/, (_: string, yr: string) => `_0${yr}_RL`))
  variants.add(ref.replace(/_0(\d{2})_RL/, (_: string, yr: string) => `_${yr}_RL`))
  return Array.from(variants)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ payments: [] })

  const variants = refVariants(ref)

  // ── 1. Supabase — fonte primária (imediata, sem eventual consistency) ─────────
  const { data: supabaseData } = await db()
    .from('pagamentos_noivos')
    .select('id, nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado, atualizado, tally_response_id, notion_id')
    .in('referencia', variants)
    .order('created_at', { ascending: true })

  const supabasePayments: any[] = (supabaseData ?? []).map(row => ({
    id:               row.id,           // UUID — fonte Supabase
    nome_noivos:      row.nome_noivos,
    referencia:       row.referencia,
    data_casamento:   row.data_casamento,
    data_pagamento:   row.data_pagamento,
    fase_pagamento:   Array.isArray(row.fase_pagamento) ? row.fase_pagamento : (row.fase_pagamento ? [row.fase_pagamento] : []),
    metodo_pagamento: Array.isArray(row.metodo_pagamento) ? row.metodo_pagamento : (row.metodo_pagamento ? [row.metodo_pagamento] : []),
    valor_liquidado:  row.valor_liquidado,
    atualizado:       row.atualizado,
    notion_id:        row.notion_id ?? null,
  }))

  // IDs Notion já cobertos pelo Supabase (evitar duplicados)
  const notionIdsCovertos = new Set(supabasePayments.map(p => p.notion_id).filter(Boolean))

  // ── 2. Notion — apenas registos históricos ainda não no Supabase ─────────────
  const filter = variants.length === 1
    ? { property: 'REFERÊNCIA DO EVENTO', rich_text: { equals: variants[0] } }
    : { or: variants.map(v => ({ property: 'REFERÊNCIA DO EVENTO', rich_text: { equals: v } })) }

  const notionOrphans: any[] = []
  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, page_size: 50 }),
      cache: 'no-store',
    })
    if (notionRes.ok) {
      const notionData = await notionRes.json()
      for (const page of notionData.results ?? []) {
        // Só inclui se não existir já um registo Supabase com este notion_id
        if (notionIdsCovertos.has(page.id)) continue
        const p = page.properties ?? {}
        notionOrphans.push({
          id:               `notion_${page.id}`,
          nome_noivos:      getProp(p, 'NOME DOS NOIVOS',      'title'),
          referencia:       getProp(p, 'REFERÊNCIA DO EVENTO', 'text'),
          data_casamento:   getProp(p, 'DATA DO CASAMENTO',    'date'),
          data_pagamento:   getProp(p, 'DATA DO PAGAMENTO',    'date'),
          fase_pagamento:   getProp(p, 'FASE DO PAGAMENTO',    'multi_select') ?? [],
          metodo_pagamento: getProp(p, 'MÉTODO DE PAGAMENTO',  'multi_select') ?? [],
          valor_liquidado:  getProp(p, 'VALOR LIQUIDADO',      'number'),
          atualizado:       getProp(p, 'ATUALIZADO',           'checkbox'),
          notion_id:        page.id,
        })
      }
    }
  } catch { /* Notion em baixo — continua só com Supabase */ }

  // ── 3. Merge: Supabase primeiro (principal), Notion apenas órfãos históricos ──
  const merged = [...supabasePayments, ...notionOrphans]

  return NextResponse.json({ payments: merged })
}
