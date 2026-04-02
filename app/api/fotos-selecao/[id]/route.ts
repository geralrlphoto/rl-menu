import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

const FIELD_MAP: Record<string, { key: string; type: string }> = {
  nome_noivos:   { key: 'NOME DOS NOIVOS',      type: 'title' },
  referencia:    { key: 'REFERÊNCIA DO EVENTO',  type: 'text' },
  date:          { key: 'Date',                  type: 'date' },
  data_entrada:  { key: 'Data  de Entrada',      type: 'date' },
  sessao_noivos: { key: 'SESSÃO NOIVOS',         type: 'text' },
  fotos_noiva:   { key: 'FOTOS DA NOIVA',        type: 'text' },
  fotos_noivo:   { key: 'FOTOS DO NOIVO',        type: 'text' },
  convidados:    { key: 'CONVIDADOS',            type: 'text' },
  cerimonia:     { key: 'CERIMÓNIA',             type: 'text' },
  bolo_bouquet:  { key: 'BOLO E BOUQUET',        type: 'text' },
  sala_animacao: { key: 'SALA E ANIMAÇÃO',       type: 'text' },
  fotos_album:   { key: 'FOTOS P/ÁLBUM',         type: 'text' },
  detalhes:      { key: 'DETALHES',              type: 'text' },
}

function buildValue(type: string, value: any) {
  if (type === 'title') return { title: [{ text: { content: value ?? '' } }] }
  if (type === 'text')  return { rich_text: [{ text: { content: value ?? '' } }] }
  if (type === 'date')  return value ? { date: { start: value } } : { date: null }
  return {}
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const properties: any = {}
  for (const [field, value] of Object.entries(body)) {
    const map = FIELD_MAP[field]
    if (map) properties[map.key] = buildValue(map.type, value)
  }
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties }),
  })
  if (!res.ok) { const err = await res.json(); return NextResponse.json({ error: err.message }, { status: res.status }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived: true }),
  })
  if (!res.ok) { const err = await res.json(); return NextResponse.json({ error: err.message }, { status: res.status }) }
  return NextResponse.json({ ok: true })
}
