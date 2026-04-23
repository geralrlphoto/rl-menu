import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const NOTION_CRM_DB = process.env.NOTION_CRM_DB!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getProp(props: any, key: string, type: string): string {
  // Try exact key first, then trimmed version
  const p = props[key] ?? props[key.trim()] ?? Object.entries(props).find(([k]) => k.trim() === key.trim())?.[1]
  if (!p) return ''
  try {
    if (type === 'title') return (p as any).title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'rich_text') return (p as any).rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'email') return (p as any).email ?? ''
    if (type === 'phone') return (p as any).phone_number ?? ''
    if (type === 'select') return (p as any).select?.name ?? ''
    if (type === 'status') return (p as any).status?.name ?? ''
    if (type === 'multi_select') return (p as any).multi_select?.map((s: any) => s.name).join(', ') ?? ''
    if (type === 'date') return (p as any).date?.start ?? ''
    if (type === 'number') return (p as any).number?.toString() ?? ''
    if (type === 'url') return (p as any).url ?? ''
  } catch { return '' }
  return ''
}

async function fetchAllNotionPages() {
  const pages: any[] = []
  let cursor: string | undefined = undefined

  do {
    const body: any = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_CRM_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? 'Notion API error')

    pages.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return pages
}

export async function POST() {
  try {
    const pages = await fetchAllNotionPages()

    const records = pages.map((page: any) => {
      const p = page.properties ?? {}
      return {
        notion_id: page.id,
        // Name field — Notion DB uses 'Nome ' with trailing space
        nome: getProp(p, 'Nome ', 'title') || getProp(p, 'Nome', 'title') || getProp(p, 'Name', 'title') || getProp(p, 'Cliente', 'title'),
        email: getProp(p, 'Email', 'email'),
        // Phone field
        contato: getProp(p, 'Contato', 'phone') || getProp(p, 'Telemóvel', 'phone') || getProp(p, 'Contacto', 'phone') || getProp(p, 'Telefone', 'phone'),
        // Status is a Notion 'status' type (not select)
        status: getProp(p, 'Status', 'status') || getProp(p, 'Status', 'select'),
        lead_prioridade: getProp(p, 'Lead Prioridade', 'select') || getProp(p, 'Lead', 'select') || getProp(p, 'Prioridade', 'select'),
        // Tipo de Evento is multi_select in Notion
        tipo_evento: getProp(p, 'Tipo de Evento', 'multi_select') || getProp(p, 'Evento', 'multi_select'),
        // Tipo de cerimónia (lowercase c) is multi_select
        tipo_cerimonia: getProp(p, 'Tipo de cerimónia', 'multi_select') || getProp(p, 'Tipo de Cerimónia', 'multi_select') || getProp(p, 'Cerimónia', 'multi_select'),
        data_casamento: getProp(p, 'Data do Casamento', 'date') || getProp(p, 'Data Casamento', 'date'),
        data_entrada: getProp(p, 'Data Entrada', 'date') || getProp(p, 'Data de Entrada', 'date') || page.created_time?.slice(0, 10),
        local_casamento: getProp(p, 'Local do Casamento', 'rich_text') || getProp(p, 'Local', 'rich_text'),
        // Orçamento is a text (rich_text) field in Notion, not number
        orcamento: getProp(p, 'Orçamento', 'rich_text') || getProp(p, 'Orçamento', 'number') || getProp(p, 'Valor', 'rich_text'),
        // Como Chegou até nós? is multi_select
        como_chegou: getProp(p, 'Como Chegou até nós?', 'multi_select') || getProp(p, 'Como Chegou', 'multi_select') || getProp(p, 'Como chegou', 'select'),
        // Serviços no casamento is multi_select
        servicos: getProp(p, 'Serviços no casamento', 'multi_select') || getProp(p, 'Serviços', 'multi_select') || getProp(p, 'Serviço', 'multi_select'),
        mensagem: getProp(p, 'Mensagem', 'rich_text') || getProp(p, 'Notas', 'rich_text'),
      }
    }).filter(r => r.nome)

    if (records.length === 0) {
      return NextResponse.json({ synced: 0, message: 'Nenhum registo encontrado' })
    }

    // Buscar notion_ids já existentes para evitar duplicados mesmo sem UNIQUE constraint
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id, notion_id')

    const existingMap = new Map((existing ?? []).map((r: any) => [r.notion_id, r.id]))

    const toInsert = records.filter(r => !existingMap.has(r.notion_id))
    const toUpdate = records.filter(r => existingMap.has(r.notion_id))

    // Campos geridos pela app — nunca sobrescrever com dados do Notion
    const APP_MANAGED = ['status', 'status_updated_at', 'data_fecho', 'lead_prioridade']

    let inserted = 0, updated = 0
    const errors: string[] = []

    if (toInsert.length > 0) {
      const { error } = await supabase.from('crm_contacts').insert(toInsert)
      if (error) errors.push(error.message)
      else inserted = toInsert.length
    }

    for (const r of toUpdate) {
      // Remover campos app-managed do payload de update
      const payload = Object.fromEntries(
        Object.entries(r).filter(([k]) => !APP_MANAGED.includes(k))
      )
      const { error } = await supabase.from('crm_contacts').update(payload).eq('notion_id', r.notion_id)
      if (!error) updated++
    }

    if (errors.length > 0) throw new Error(errors.join('; '))

    return NextResponse.json({
      synced: inserted + updated,
      inserted,
      updated,
      message: `${inserted + updated} leads sincronizadas (${inserted} novas, ${updated} atualizadas)`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
