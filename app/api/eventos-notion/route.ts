import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text') return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date') return p.date?.start ?? null
    if (type === 'select') return p.select?.name ?? null
    if (type === 'status') return p.status?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number') return p.number ?? p.formula?.number ?? null
    if (type === 'email') return p.email ?? null
    if (type === 'phone') return p.phone_number ?? null
  } catch { return null }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { referencia, cliente, data_evento, local, tipo_evento, tipo_servico, fotografo, videografo, valor_foto, valor_video, valor_liquido } = body

    const properties: any = {
      'REFERÊNCIA DO EVENTO': { title: [{ text: { content: referencia ?? '' } }] },
      'CLIENTE':              { rich_text: [{ text: { content: cliente ?? '' } }] },
    }
    if (data_evento)   properties['DATA DO EVENTO']          = { date: { start: data_evento } }
    if (local)         properties['LOCAL']                   = { rich_text: [{ text: { content: local } }] }
    if (tipo_evento?.length)  properties['TIPO DE EVENTO']   = { multi_select: tipo_evento.map((n: string) => ({ name: n })) }
    if (tipo_servico?.length) properties['TIPO DE SERVIÇO']  = { multi_select: tipo_servico.map((n: string) => ({ name: n })) }
    if (fotografo?.length)    properties['FOTOGRAFO']        = { multi_select: fotografo.map((n: string) => ({ name: n })) }
    if (videografo?.length)   properties['VÍDEOGRAFO ']      = { multi_select: videografo.map((n: string) => ({ name: n })) }
    if (valor_foto != null)   properties['VALOR SERVIÇO FOTO']       = { number: Number(valor_foto) }
    if (valor_video != null)  properties['VALOR DO SERVIÇO VÍDEO']   = { number: Number(valor_video) }
    if (valor_liquido != null) properties['VALOR LIQUIDO A RECEBER'] = { number: Number(valor_liquido) }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: EVENTOS_DB }, properties }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    const page = await res.json()
    return NextResponse.json({ id: page.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const allPages: any[] = []
    let cursor: string | null = null

    do {
      const body: any = {
        page_size: 100,
        sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
      }
      if (cursor) body.start_cursor = cursor

      const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.message }, { status: res.status })
      }

      const data = await res.json()
      allPages.push(...data.results)
      cursor = data.has_more ? data.next_cursor : null
    } while (cursor)

    const events = allPages.map((page: any) => {
      const p = page.properties ?? {}
      return {
        id: page.id,
        referencia: getProp(p, 'REFERÊNCIA DO EVENTO', 'title'),
        cliente: getProp(p, 'CLIENTE', 'text'),
        data_evento: getProp(p, 'DATA DO EVENTO', 'date'),
        local: getProp(p, 'LOCAL', 'text'),
        tipo_evento: getProp(p, 'TIPO DE EVENTO', 'multi_select'),
        tipo_servico: getProp(p, 'TIPO DE SERVIÇO', 'multi_select'),
        servico_extra: getProp(p, 'SERVIÇO EXTRA', 'multi_select'),
        status: getProp(p, 'Status', 'status'),
        fotografo: getProp(p, 'FOTOGRAFO', 'multi_select'),
        videografo: getProp(p, 'VÍDEOGRAFO ', 'multi_select'),
        valor_liquido: getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
        valor_foto: getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
        valor_video: getProp(p, 'VALOR DO SERVIÇO VÍDEO', 'number'),
        data_entrega: getProp(p, 'DATA FINAL ENTREGA FOTOS', 'date'),
        fotos_enviadas: p['FOTOS EDITADAS ANVIADAS']?.checkbox ?? false,
        video_estado: getProp(p, 'ESTADO DO VIDEO', 'select'),
        data_entrega_video_formula: p['DATA ENTREGA VIDEO']?.formula?.string ?? null,
      }
    })

    return NextResponse.json({ events, total: events.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
