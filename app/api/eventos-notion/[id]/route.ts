import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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
    if (type === 'checkbox') return p.checkbox ?? false
    if (type === 'url') return p.url ?? null
  } catch { return null }
  return null
}

// Mapa: campo interno → { notionKey, notionType }
const FIELD_MAP: Record<string, { key: string; type: string }> = {
  referencia:       { key: 'REFERÊNCIA DO EVENTO',       type: 'title' },
  cliente:          { key: 'CLIENTE',                    type: 'text' },
  local:            { key: 'LOCAL',                      type: 'text' },
  fotografo:        { key: 'FOTOGRAFO',                  type: 'multi_select' },
  videografo:       { key: 'VÍDEOGRAFO ',                type: 'multi_select' },
  editor_fotos:     { key: 'EDITOR DE FOTOS',            type: 'select' },
  proposta:         { key: 'PROPOSTA ESCOLHIDA',         type: 'select' },
  data_evento:      { key: 'DATA DO EVENTO',               type: 'date' },
  valor_foto:       { key: 'VALOR SERVIÇO FOTO',         type: 'number' },
  valor_video:      { key: 'VALOR DO SERVIÇO VÍDEO',     type: 'number' },
  valor_extras:     { key: 'VALOR DOS EXTRAS',           type: 'number' },
  valor_liquido:    { key: 'VALOR LIQUIDO A RECEBER',    type: 'number' },
  data_entrega:     { key: 'DATA FINAL ENTREGA FOTOS',   type: 'date' },
  data_entrega_ini: { key: 'DATA ENTREGA FOTOS',         type: 'date' },
  data_entrada:     { key: 'DATA DE ENTRADA',            type: 'date' },
  fotos_enviadas:   { key: 'FOTOS EDITADAS ANVIADAS',    type: 'checkbox' },
  sel_enviado:      { key: 'FOTOS. SEL ENVIADO',         type: 'checkbox' },
  alerta_30du:      { key: 'ALERTA 30DU ENVIADO',        type: 'checkbox' },
  agendamento_email:{ key: 'AGENDAMENTO EMAIL',          type: 'select' },
  contratos:        { key: 'CONTRATOS',                  type: 'url' },
  nome_noiva:       { key: 'Nome da Noiva',              type: 'text' },
  nome_noivo:       { key: 'nome do noivo',              type: 'text' },
  email_noiva:      { key: 'E-mail da noiva',            type: 'email' },
  email_noivo:      { key: 'E-mail do noivo',            type: 'email' },
  tel_noiva:        { key: 'Telefone da noiva',          type: 'phone' },
  tel_noivo:        { key: 'Telefone do noivo',          type: 'phone' },
  morada_noiva:     { key: 'Morada da Noiva',            type: 'text' },
  morada_noivo:     { key: 'Morada do noivo',            type: 'text' },
  cc_noiva:         { key: 'N.º C.Cidadão da noiva',     type: 'text' },
  cc_noivo:         { key: 'N.ºC.Cidadao Noivo',         type: 'text' },
  nif_noiva:        { key: 'N.º Iden.Fiscal Noiva',      type: 'text' },
  nif_noivo:        { key: 'N.º Iden. Fiscal Noivo',     type: 'text' },
  servico_foto:     { key: 'serviço de fotografia',      type: 'multi_select' },
  servico_video:    { key: 'serviço de video',           type: 'multi_select' },
  nome_disco:       { key: 'NOME DO DISCO',              type: 'multi_select' },
  backup_disco:     { key: 'BACKUP DISCO',               type: 'multi_select' },
  servico_extra:        { key: 'SERVIÇO EXTRA',              type: 'multi_select' },
  fotos_edicao_estado:  { key: 'FOTOS P/ EDIÇÃO',            type: 'select' },
  sel_fotos_estado:     { key: 'ESTADO SEL. FOTOS',          type: 'select' },
  video_estado:         { key: 'ESTADO DO VIDEO',            type: 'select' },
  album_estado:         { key: 'ESTADO ÁLBUM',               type: 'select' },
}

function buildNotionValue(type: string, value: any): any {
  if (type === 'title')        return { title: [{ text: { content: value ?? '' } }] }
  if (type === 'text')         return { rich_text: [{ text: { content: value ?? '' } }] }
  if (type === 'number')       return { number: value === '' || value === null ? null : Number(value) }
  if (type === 'email')        return { email: value || null }
  if (type === 'phone')        return { phone_number: value || null }
  if (type === 'url')          return { url: value || null }
  if (type === 'checkbox')     return { checkbox: Boolean(value) }
  if (type === 'select')       return { select: value ? { name: value } : null }
  if (type === 'date')         return { date: value ? { start: value } : null }
  if (type === 'multi_select') return { multi_select: (value as string[]).map((n: string) => ({ name: n })) }
  return {}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const properties: Record<string, any> = {}

    for (const [field, val] of Object.entries(body)) {
      const mapping = FIELD_MAP[field]
      if (!mapping) continue
      properties[mapping.key] = buildNotionValue(mapping.type, val)
    }

    if (Object.keys(properties).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
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

    // ── Sync campos relevantes para Supabase evento_equipa ─────────────────
    const syncMap: Record<string, string> = {
      sel_fotos_estado: 'estado_sel_fotos',
      video_estado:     'estado_video',
      cliente:          'cliente',
      status:           'status',
      local:            'local',
      data_evento:      'data_casamento',
    }
    const sbFields: Record<string, any> = {}
    for (const [internal, col] of Object.entries(syncMap)) {
      if (body[internal] !== undefined) sbFields[col] = body[internal]
    }
    if (body.tipo_evento !== undefined) sbFields.tipo_evento = Array.isArray(body.tipo_evento) ? body.tipo_evento.join(', ') : body.tipo_evento
    if (Object.keys(sbFields).length > 0) {
      await supabase().from('evento_equipa').update(sbFields).eq('evento_id', id)
    }

    // ── Sync campos principais para tabela eventos_2026/2027 ──────────────
    const eventosSyncMap: Record<string, string> = {
      cliente:        'cliente',
      local:          'local',
      data_evento:    'data_evento',
      status:         'status',
      valor_foto:     'valor_foto',
      valor_liquido:  'valor_liquido',
      fotografo:      'fotografo',
      tipo_evento:    'tipo_evento',
      tipo_servico:   'tipo_servico',
      referencia:     'referencia',
      fotos_enviadas: 'fotos_enviadas',
    }
    const evFields: Record<string, any> = {}
    for (const [internal, col] of Object.entries(eventosSyncMap)) {
      if (body[internal] !== undefined) {
        const v = body[internal]
        // Converter arrays em texto JSON (colunas são text no Supabase)
        if (Array.isArray(v) && (col === 'tipo_evento' || col === 'fotografo')) {
          evFields[col] = JSON.stringify(v)
        } else {
          evFields[col] = v
        }
      }
    }
    if (Object.keys(evFields).length > 0) {
      // Determinar tabela pelo ano da data, se existir
      let ano = 2026
      if (body.data_evento) {
        ano = parseInt(String(body.data_evento).slice(0, 4)) || 2026
      } else {
        // Buscar data atual do Supabase para determinar a tabela
        for (const t of ['eventos_2026', 'eventos_2027']) {
          const { data } = await supabase().from(t).select('data_evento').eq('notion_id', id).limit(1).maybeSingle()
          if (data) {
            ano = parseInt(String(data.data_evento).slice(0, 4)) || 2026
            break
          }
        }
      }
      const table = ano === 2027 ? 'eventos_2027' : 'eventos_2026'
      await supabase().from(table).update(evFields).eq('notion_id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }

    const page = await res.json()
    const p = page.properties ?? {}

    const event = {
      id: page.id,
      referencia:       getProp(p, 'REFERÊNCIA DO EVENTO', 'title'),
      cliente:          getProp(p, 'CLIENTE', 'text'),
      data_evento:      getProp(p, 'DATA DO EVENTO', 'date'),
      local:            getProp(p, 'LOCAL', 'text'),
      tipo_evento:      getProp(p, 'TIPO DE EVENTO', 'multi_select'),
      tipo_servico:     getProp(p, 'TIPO DE SERVIÇO', 'multi_select'),
      servico_extra:    getProp(p, 'SERVIÇO EXTRA', 'multi_select'),
      status:           getProp(p, 'Status', 'status'),
      fotografo:        getProp(p, 'FOTOGRAFO', 'multi_select'),
      videografo:       getProp(p, 'VÍDEOGRAFO ', 'multi_select'),
      editor_fotos:     getProp(p, 'EDITOR DE FOTOS', 'select'),
      proposta:         getProp(p, 'PROPOSTA ESCOLHIDA', 'select'),
      valor_liquido:    getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
      valor_foto:       getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
      valor_video:      getProp(p, 'VALOR DO SERVIÇO VÍDEO', 'number'),
      valor_extras:     getProp(p, 'VALOR DOS EXTRAS', 'number'),
      data_entrega:     getProp(p, 'DATA FINAL ENTREGA FOTOS', 'date'),
      data_entrega_ini: getProp(p, 'DATA ENTREGA FOTOS', 'date'),
      data_entrada:     getProp(p, 'DATA DE ENTRADA', 'date'),
      fotos_enviadas:   getProp(p, 'FOTOS EDITADAS ANVIADAS', 'checkbox'),
      sel_enviado:      getProp(p, 'FOTOS. SEL ENVIADO', 'checkbox'),
      alerta_30du:      getProp(p, 'ALERTA 30DU ENVIADO', 'checkbox'),
      agendamento_email:getProp(p, 'AGENDAMENTO EMAIL', 'select'),
      contratos:        getProp(p, 'CONTRATOS', 'url'),
      nome_noiva:       getProp(p, 'Nome da Noiva', 'text'),
      nome_noivo:       getProp(p, 'nome do noivo', 'text'),
      email_noiva:      getProp(p, 'E-mail da noiva', 'email'),
      email_noivo:      getProp(p, 'E-mail do noivo', 'email'),
      tel_noiva:        getProp(p, 'Telefone da noiva', 'phone'),
      tel_noivo:        getProp(p, 'Telefone do noivo', 'phone'),
      morada_noiva:     getProp(p, 'Morada da Noiva', 'text'),
      morada_noivo:     getProp(p, 'Morada do noivo', 'text'),
      cc_noiva:         getProp(p, 'N.º C.Cidadão da noiva', 'text'),
      cc_noivo:         getProp(p, 'N.ºC.Cidadao Noivo', 'text'),
      nif_noiva:        getProp(p, 'N.º Iden.Fiscal Noiva', 'text'),
      nif_noivo:        getProp(p, 'N.º Iden. Fiscal Noivo', 'text'),
      servico_foto:     getProp(p, 'serviço de fotografia', 'multi_select'),
      servico_video:    getProp(p, 'serviço de video', 'multi_select'),
      nome_disco:           getProp(p, 'NOME DO DISCO', 'multi_select'),
      backup_disco:         getProp(p, 'BACKUP DISCO', 'multi_select'),
      fotos_edicao_estado:  getProp(p, 'FOTOS P/ EDIÇÃO', 'select'),
      sel_fotos_estado:     getProp(p, 'ESTADO SEL. FOTOS', 'select'),
      video_estado:         getProp(p, 'ESTADO DO VIDEO', 'select'),
      album_estado:         getProp(p, 'ESTADO ÁLBUM', 'select'),
      notion_url:           page.url,
    }

    return NextResponse.json({ event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const referencia = _req.nextUrl.searchParams.get('referencia')

  try {
    // Limpar registos Supabase associados ao evento
    if (referencia) {
      const sb = supabase()
      await Promise.all([
        sb.from('freelancer_casamentos').delete().eq('referencia', referencia),
        sb.from('evento_equipa').delete().eq('referencia', referencia),
      ])
    }

    // Arquivar no Notion
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
