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
    if (type === 'date')         return p.date?.start ?? null
    if (type === 'number')       return p.number ?? null
    if (type === 'checkbox')     return p.checkbox ?? false
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
  } catch { return null }
  return null
}

export async function GET() {
  try {
    const allRows: any[] = []
    let cursor: string | null = null

    do {
      const body: any = {
        page_size: 100,
        sorts: [{ property: 'DATA DO CASAMENTO', direction: 'ascending' }],
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

    const rows = allRows.map((page: any) => {
      const p = page.properties ?? {}
      return {
        id: page.id,
        nome_noivos:        getProp(p, 'NOME DOS NOIVOS',     'title'),
        referencia:         getProp(p, 'REFERÊNCIA DO EVENTO','text'),
        data_casamento:     getProp(p, 'DATA DO CASAMENTO',   'date'),
        data_pagamento:     getProp(p, 'DATA DO PAGAMENTO',   'date'),
        fase_pagamento:     getProp(p, 'FASE DO PAGAMENTO',   'multi_select'),
        metodo_pagamento:   getProp(p, 'MÉTODO DE PAGAMENTO', 'multi_select'),
        valor_liquidado:    getProp(p, 'VALOR LIQUIDADO',     'number'),
        atualizado:         getProp(p, 'ATUALIZADO',          'checkbox'),
      }
    })

    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Se vier body com dados, cria registo completo; caso contrário cria entrada vazia (financas page)
    let body: any = {}
    try { body = await req.json() } catch { /* sem body → entrada vazia */ }

    const {
      nome_noivos: nomeNoivos,
      referencia,
      data_casamento,
      data_pagamento,
      fase_pagamento,
      metodo_pagamento,
      valor_liquidado,
    } = body

    const properties: any = {
      'NOME DOS NOIVOS': { title: [{ text: { content: nomeNoivos ?? 'Novo Registo' } }] },
    }
    if (referencia)       properties['REFERÊNCIA DO EVENTO'] = { rich_text: [{ text: { content: referencia } }] }
    if (data_casamento)   properties['DATA DO CASAMENTO']    = { date: { start: data_casamento } }
    if (data_pagamento)   properties['DATA DO PAGAMENTO']    = { date: { start: data_pagamento } }
    if (fase_pagamento?.length)   properties['FASE DO PAGAMENTO']    = { multi_select: fase_pagamento.map((n: string) => ({ name: n })) }
    if (metodo_pagamento?.length) properties['MÉTODO DE PAGAMENTO'] = { multi_select: metodo_pagamento.map((n: string) => ({ name: n })) }
    if (valor_liquidado != null)  properties['VALOR LIQUIDADO']     = { number: Number(valor_liquidado) }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties }),
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    const page = await res.json()
    const p = page.properties ?? {}
    const row = {
      id:               page.id,
      nome_noivos:      p['NOME DOS NOIVOS']?.title?.map((t: any) => t.plain_text).join('') ?? '',
      referencia:       referencia ?? '',
      data_casamento:   data_casamento ?? null,
      data_pagamento:   data_pagamento ?? null,
      fase_pagamento:   fase_pagamento ?? [],
      metodo_pagamento: metodo_pagamento ?? [],
      valor_liquidado:  valor_liquidado ?? null,
      atualizado:       false,
    }

    // Guardar também em Supabase
    db().from('pagamentos_noivos').insert({
      notion_id:        page.id,
      nome_noivos:      row.nome_noivos,
      referencia:       row.referencia || null,
      data_casamento:   row.data_casamento,
      data_pagamento:   row.data_pagamento,
      fase_pagamento:   row.fase_pagamento,
      metodo_pagamento: row.metodo_pagamento,
      valor_liquidado:  row.valor_liquidado,
    }).then(({ error }) => {
      if (error) console.error('[pagamentos-noivos] Supabase error:', error)
    })

    return NextResponse.json({ row })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
