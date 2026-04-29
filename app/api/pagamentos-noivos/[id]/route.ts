import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function buildValue(type: string, value: any) {
  if (type === 'title')        return { title: [{ text: { content: value ?? '' } }] }
  if (type === 'text')         return { rich_text: [{ text: { content: value ?? '' } }] }
  if (type === 'date')         return value ? { date: { start: value } } : { date: null }
  if (type === 'number')       return { number: value === '' || value === null ? null : Number(value) }
  if (type === 'checkbox')     return { checkbox: Boolean(value) }
  if (type === 'multi_select') return { multi_select: (value as string[]).map(n => ({ name: n })) }
  return {}
}

const FIELD_MAP: Record<string, { key: string; type: string }> = {
  nome_noivos:      { key: 'NOME DOS NOIVOS',     type: 'title' },
  referencia:       { key: 'REFERÊNCIA DO EVENTO', type: 'text' },
  data_casamento:   { key: 'DATA DO CASAMENTO',    type: 'date' },
  data_pagamento:   { key: 'DATA DO PAGAMENTO',    type: 'date' },
  fase_pagamento:   { key: 'FASE DO PAGAMENTO',    type: 'multi_select' },
  metodo_pagamento: { key: 'MÉTODO DE PAGAMENTO',  type: 'multi_select' },
  valor_liquidado:  { key: 'VALOR LIQUIDADO',      type: 'number' },
  atualizado:       { key: 'ATUALIZADO',           type: 'checkbox' },
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // UUID Supabase → atualizar diretamente na tabela pagamentos_noivos
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (isUUID) {
    const updates: Record<string, any> = {}
    const allowed = ['valor_liquidado','data_pagamento','fase_pagamento','metodo_pagamento','atualizado']
    for (const [k, v] of Object.entries(body)) {
      if (allowed.includes(k)) updates[k] = v
    }
    const { error } = await db().from('pagamentos_noivos').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Notion page ID → atualizar no Notion
  const properties: any = {}
  for (const [field, value] of Object.entries(body)) {
    const map = FIELD_MAP[field]
    if (!map) continue
    properties[map.key] = buildValue(map.type, value)
  }

  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: res.status })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  if (isUUID) {
    // 1. Ler notion_id antes de apagar (para arquivar no Notion também)
    const { data: row } = await supabase
      .from('pagamentos_noivos')
      .select('notion_id')
      .eq('id', id)
      .maybeSingle()

    // 2. Apagar do Supabase
    await supabase.from('pagamentos_noivos').delete().eq('id', id)

    // 3. Arquivar no Notion se existir entrada lá
    if (row?.notion_id) {
      await fetch(`https://api.notion.com/v1/pages/${row.notion_id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }).catch(() => {}) // não bloquear se Notion falhar
    }
  } else {
    // ID é Notion page ID → arquivar no Notion + apagar do Supabase pelo notion_id
    await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }),
      supabase.from('pagamentos_noivos').delete().eq('notion_id', id),
    ])
  }

  return NextResponse.json({ ok: true })
}
