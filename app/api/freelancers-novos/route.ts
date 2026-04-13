import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2f3220116d8a8027b435c5b4c0f48948' // FREELANCER BASE DADOS

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
    if (type === 'email')        return p.email ?? null
  } catch { return null }
  return null
}

export async function GET() {
  try {
    const allRows: any[] = []
    let cursor: string | null = null

    do {
      const body: any = { page_size: 100 }
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
        id:               page.id,
        nome:             getProp(p, 'Nome',                'title'),
        funcao:           getProp(p, 'FUNÇÃO',              'select'),
        tipo_eventos:     getProp(p, 'TIPO DE EVENTOS',     'multi_select'),
        zona:             getProp(p, 'ZONA DE RESIDÊNCIA',  'select'),
        telefone:         getProp(p, 'Telefone',            'phone'),
        valor_servico:    getProp(p, 'VALOR POR SERVIÇO',   'text'),
        valor_drone:      getProp(p, 'VALOR DO DRONE',      'text'),
        valor_edicao:     getProp(p, 'VALOR EDIÇÃO 20 MIN', 'text'),
        servicos_feitos:  getProp(p, 'SERVIÇOS FEITOS',     'number'),
        drone:            getProp(p, 'DRONE',               'select'),
        faz_edicao:       getProp(p, 'FAZ EDIÇÃO DE VIDEO', 'select'),
        link_trailer:     getProp(p, 'LINK TRAILER',        'url'),
        link_video:       getProp(p, 'LINK VIDEO COMPLETO', 'url'),
        avaliacao:        getProp(p, 'AVALIAÇÃO',           'multi_select'),
        mensagem:         getProp(p, 'MENSAGEM',            'text'),
      }
    })

    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
