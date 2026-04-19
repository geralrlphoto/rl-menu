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

  // ── 1. Notion (fonte histórica) ──────────────────────────────────────────────
  const filter = variants.length === 1
    ? { property: 'REFERÊNCIA DO EVENTO', rich_text: { equals: variants[0] } }
    : { or: variants.map(v => ({ property: 'REFERÊNCIA DO EVENTO', rich_text: { equals: v } })) }

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

  const notionPayments: any[] = []
  if (notionRes.ok) {
    const notionData = await notionRes.json()
    for (const page of notionData.results ?? []) {
      const p = page.properties ?? {}
      notionPayments.push({
        id:               `notion_${page.id}`,
        nome_noivos:      getProp(p, 'NOME DOS NOIVOS',     'title'),
        referencia:       getProp(p, 'REFERÊNCIA DO EVENTO','text'),
        data_casamento:   getProp(p, 'DATA DO CASAMENTO',   'date'),
        data_pagamento:   getProp(p, 'DATA DO PAGAMENTO',   'date'),
        fase_pagamento:   getProp(p, 'FASE DO PAGAMENTO',   'multi_select') ?? [],
        metodo_pagamento: getProp(p, 'MÉTODO DE PAGAMENTO', 'multi_select') ?? [],
        valor_liquidado:  getProp(p, 'VALOR LIQUIDADO',     'number'),
        atualizado:       getProp(p, 'ATUALIZADO',          'checkbox'),
      })
    }
  }

  // ── 2. Supabase (pagamentos via Tally, novos) ────────────────────────────────
  const { data: supabaseData } = await db()
    .from('pagamentos_noivos')
    .select('id, nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado, atualizado, tally_response_id')
    .in('referencia', variants)
    .not('valor_liquidado', 'is', null)
    .order('created_at', { ascending: true })

  const supabasePayments: any[] = (supabaseData ?? []).map(row => ({
    id:               row.id,
    nome_noivos:      row.nome_noivos,
    referencia:       row.referencia,
    data_casamento:   row.data_casamento,
    data_pagamento:   row.data_pagamento,
    fase_pagamento:   Array.isArray(row.fase_pagamento) ? row.fase_pagamento : (row.fase_pagamento ? [row.fase_pagamento] : []),
    metodo_pagamento: Array.isArray(row.metodo_pagamento) ? row.metodo_pagamento : (row.metodo_pagamento ? [row.metodo_pagamento] : []),
    valor_liquidado:  row.valor_liquidado,
    atualizado:       row.atualizado,
    tally_response_id: row.tally_response_id,
  }))

  // ── 3. Juntar: Notion base + Supabase novos (evitar duplicados por tally_response_id) ──
  const notionIds = new Set(notionPayments.map(p => p.id))
  const merged = [
    ...notionPayments,
    // Só adiciona do Supabase se não existir já no Notion (por referência + valor)
    ...supabasePayments.filter(sp => {
      const isDupNotion = notionPayments.some(np =>
        Math.abs((np.valor_liquidado ?? 0) - (sp.valor_liquidado ?? 0)) < 0.01 &&
        np.data_pagamento === sp.data_pagamento
      )
      return !isDupNotion
    }),
  ]

  return NextResponse.json({ payments: merged })
}
