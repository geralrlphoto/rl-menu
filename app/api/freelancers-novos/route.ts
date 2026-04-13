import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2f3220116d8a8027b435c5b4c0f48948'

const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'select')       return p.select?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number')       return p.number ?? null
    if (type === 'url')          return p.url ?? null
    if (type === 'phone')        return p.phone_number ?? null
  } catch { return null }
  return null
}

function buildProps(data: Record<string, any>) {
  const p: Record<string, any> = {}
  if (data.nome         != null) p['Nome']                  = { title: [{ text: { content: data.nome ?? '' } }] }
  if (data.funcao       != null) p['FUNÇÃO']                = { select: data.funcao ? { name: data.funcao } : null }
  if (data.tipo_eventos != null) p['TIPO DE EVENTOS']       = { multi_select: (data.tipo_eventos as string[]).map(n => ({ name: n })) }
  if (data.zona         != null) p['ZONA DE RESIDÊNCIA']    = { select: data.zona ? { name: data.zona } : null }
  if (data.telefone     != null) p['Telefone']              = { phone_number: data.telefone || null }
  if (data.valor_servico!= null) p['VALOR POR SERVIÇO']     = { rich_text: [{ text: { content: data.valor_servico ?? '' } }] }
  if (data.valor_drone  != null) p['VALOR DO DRONE']        = { rich_text: [{ text: { content: data.valor_drone ?? '' } }] }
  if (data.valor_edicao != null) p['VALOR EDIÇÃO 20 MIN']   = { rich_text: [{ text: { content: data.valor_edicao ?? '' } }] }
  if (data.servicos_feitos != null) p['SERVIÇOS FEITOS']    = { number: data.servicos_feitos ? Number(data.servicos_feitos) : null }
  if (data.drone        != null) p['DRONE']                 = { select: data.drone ? { name: data.drone } : null }
  if (data.faz_edicao   != null) p['FAZ EDIÇÃO DE VIDEO']   = { select: data.faz_edicao ? { name: data.faz_edicao } : null }
  if (data.link_trailer != null) p['LINK TRAILER']          = { url: data.link_trailer || null }
  if (data.link_video   != null) p['LINK VIDEO COMPLETO']   = { url: data.link_video || null }
  if (data.avaliacao    != null) p['AVALIAÇÃO']             = { multi_select: (data.avaliacao as string[]).map(n => ({ name: n })) }
  if (data.mensagem     != null) p['MENSAGEM']              = { rich_text: [{ text: { content: data.mensagem ?? '' } }] }
  return p
}

function mapPage(page: any) {
  const p = page.properties ?? {}
  return {
    id:              page.id,
    nome:            getProp(p, 'Nome',                'title'),
    funcao:          getProp(p, 'FUNÇÃO',              'select'),
    tipo_eventos:    getProp(p, 'TIPO DE EVENTOS',     'multi_select'),
    zona:            getProp(p, 'ZONA DE RESIDÊNCIA',  'select'),
    telefone:        getProp(p, 'Telefone',            'phone'),
    valor_servico:   getProp(p, 'VALOR POR SERVIÇO',   'text'),
    valor_drone:     getProp(p, 'VALOR DO DRONE',      'text'),
    valor_edicao:    getProp(p, 'VALOR EDIÇÃO 20 MIN', 'text'),
    servicos_feitos: getProp(p, 'SERVIÇOS FEITOS',     'number'),
    drone:           getProp(p, 'DRONE',               'select'),
    faz_edicao:      getProp(p, 'FAZ EDIÇÃO DE VIDEO', 'select'),
    link_trailer:    getProp(p, 'LINK TRAILER',        'url'),
    link_video:      getProp(p, 'LINK VIDEO COMPLETO', 'url'),
    avaliacao:       getProp(p, 'AVALIAÇÃO',           'multi_select'),
    mensagem:        getProp(p, 'MENSAGEM',            'text'),
  }
}

// GET — listar todos
export async function GET() {
  try {
    const allRows: any[] = []
    let cursor: string | null = null
    do {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor
      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST', headers: notionH, body: JSON.stringify(body), cache: 'no-store',
      })
      if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: res.status }) }
      const data = await res.json()
      allRows.push(...data.results)
      cursor = data.has_more ? data.next_cursor : null
    } while (cursor)
    return NextResponse.json({ rows: allRows.map(mapPage) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — criar novo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST', headers: notionH,
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties: buildProps(body) }),
    })
    if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: res.status }) }
    const page = await res.json()
    return NextResponse.json({ ok: true, row: mapPage(page) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — editar
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH', headers: notionH,
      body: JSON.stringify({ properties: buildProps(data) }),
    })
    if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: res.status }) }
    const page = await res.json()
    return NextResponse.json({ ok: true, row: mapPage(page) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — arquivar
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH', headers: notionH,
      body: JSON.stringify({ archived: true }),
    })
    if (!res.ok) { const e = await res.json(); return NextResponse.json({ error: e.message }, { status: res.status }) }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
