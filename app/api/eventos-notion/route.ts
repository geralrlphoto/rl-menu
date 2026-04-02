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
    if (type === 'number') return p.number ?? null
    if (type === 'email') return p.email ?? null
    if (type === 'phone') return p.phone_number ?? null
  } catch { return null }
  return null
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
      }
    })

    return NextResponse.json({ events, total: events.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
