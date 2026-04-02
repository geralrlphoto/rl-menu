import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

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
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  })
  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.message }, { status: res.status })
  }
  return NextResponse.json({ ok: true })
}
