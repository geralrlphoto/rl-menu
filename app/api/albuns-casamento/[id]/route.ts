import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const HEADERS = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

const FIELD_MAP: Record<string, { key: string; type: string }> = {
  nome:                  { key: 'Nome',                    type: 'title' },
  status:                { key: 'Status',                  type: 'status' },
  data_entrega_fotos:    { key: 'Data de entrega de fotos',type: 'date' },
  prazo_maquete:         { key: 'Prazo maquete',           type: 'date' },
  data_aprovacao:        { key: 'Data de aprovação',       type: 'date' },
  prazo_album:           { key: 'Prazo álbum',             type: 'date' },
  data_prevista_entrega: { key: 'Data prevista de entrega',type: 'date' },
  ref_evento:            { key: 'REF. EVENTO',              type: 'rich_text' },
  ref_album:             { key: 'REF. ÁLBUM',              type: 'rich_text' },
  design:                { key: 'Design',                  type: 'rich_text' },
  num_fotografias:       { key: 'N.º de Fotografias',      type: 'rich_text' },
  numero_fotografias:    { key: 'Número de Fotografias',   type: 'rich_text' },
  opcao:                 { key: 'OPÇÃO',                   type: 'select' },
  texto_album:           { key: 'Texto para Álbum',        type: 'rich_text' },
  texto_caixa:           { key: 'Texto para caixa',        type: 'rich_text' },
}

function buildValue(type: string, value: any): any {
  if (type === 'title')     return { title: [{ text: { content: value ?? '' } }] }
  if (type === 'rich_text') return { rich_text: [{ text: { content: value ?? '' } }] }
  if (type === 'date')      return { date: value ? { start: value } : null }
  if (type === 'status')    return { status: value ? { name: value } : null }
  if (type === 'select')    return { select: value ? { name: value } : null }
  return {}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const properties: Record<string, any> = {}
    for (const [field, val] of Object.entries(body)) {
      const m = FIELD_MAP[field]
      if (!m) continue
      properties[m.key] = buildValue(m.type, val)
    }
    if (Object.keys(properties).length === 0)
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH', headers: HEADERS,
      body: JSON.stringify({ properties }),
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH', headers: HEADERS,
      body: JSON.stringify({ archived: true }),
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
