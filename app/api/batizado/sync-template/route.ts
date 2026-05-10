import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MASTER_TOKEN = 'batizado-maquete'

// Copies propostaPage + typography from the master template to all other batizado tokens
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
  const designFields = {
    propostaPage: masterContent.propostaPage,
    propostas: masterContent.propostas,
    extras_proposta: masterContent.extras_proposta,
  }

  // Get all other batizado rows
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
    const updatedContent = { ...(row.settings?.content || {}), ...designFields }
    const updatedSettings = { ...(row.settings || {}), content: updatedContent }
    const { error } = await supabase
      .from('portal_template_settings')
      .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
      .eq('page_id', row.page_id)
    if (!error) synced++
  }

  return NextResponse.json({ synced, total: allRows.length })
}
