import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MASTER_TOKEN = 'batizado-maquete'

// Fields from the master template that propagate to ALL client pages.
// 'evento' (baby name/date/local) is client-specific — never overwritten.
// 'proposta.password' is client-specific — never overwritten.
const DESIGN_FIELDS = [
  'hero', 'video', 'portfolio', 'testimonials',
  'about', 'banner', 'propostaPage', 'propostas', 'extras_proposta',
]

export function buildSyncedContent(
  masterContent: Record<string, any>,
  clientContent: Record<string, any>
): Record<string, any> {
  const synced: Record<string, any> = { ...clientContent }

  for (const field of DESIGN_FIELDS) {
    if (masterContent[field] !== undefined) {
      synced[field] = masterContent[field]
    }
  }

  // Preserve client's evento (baby name, date, hour, local)
  synced.evento = clientContent.evento ?? masterContent.evento ?? {}

  // Sync proposta button label from master; keep client's own password
  synced.proposta = {
    buttonLabel: masterContent.proposta?.buttonLabel ?? clientContent.proposta?.buttonLabel ?? '',
    password: clientContent.proposta?.password ?? '',
  }

  return synced
}

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get master template
  const { data: master } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', `batizado_${MASTER_TOKEN}`)
    .single()

  if (!master?.settings?.content) {
    return NextResponse.json({ error: 'Master template not found' }, { status: 404 })
  }

  const masterContent = master.settings.content

  // Get all client batizado rows (excluding master)
  const { data: allRows } = await supabase
    .from('portal_template_settings')
    .select('page_id, settings')
    .like('page_id', 'batizado_%')
    .neq('page_id', `batizado_${MASTER_TOKEN}`)

  if (!allRows || allRows.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  let synced = 0
  for (const row of allRows) {
    const clientContent = row.settings?.content || {}
    const updatedContent = buildSyncedContent(masterContent, clientContent)
    const updatedSettings = { ...(row.settings || {}), content: updatedContent }

    const { error } = await supabase
      .from('portal_template_settings')
      .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
      .eq('page_id', row.page_id)

    if (!error) synced++
  }

  return NextResponse.json({ synced, total: allRows.length })
}
