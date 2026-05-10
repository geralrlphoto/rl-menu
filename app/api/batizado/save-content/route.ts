import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MASTER_TOKEN, buildSyncedContent } from '../_lib'

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, content } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  // Merge with existing settings to avoid overwriting unrelated fields
  const { data: existing } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  const merged = { ...(existing?.settings || {}), content }

  const { error } = await supabase
    .from('portal_template_settings')
    .upsert(
      { page_id: pageId, settings: merged, updated_at: new Date().toISOString() },
      { onConflict: 'page_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Auto-sync when saving the master template ──────────────────────────────
  // Any change to /b/batizado-maquete propagates immediately to all client pages.
  if (token === MASTER_TOKEN) {
    const { data: allRows } = await supabase
      .from('portal_template_settings')
      .select('page_id, settings')
      .like('page_id', 'batizado_%')
      .neq('page_id', pageId)

    if (allRows && allRows.length > 0) {
      for (const row of allRows) {
        const clientContent = row.settings?.content || {}
        const updatedContent = buildSyncedContent(content, clientContent)
        const updatedSettings = { ...(row.settings || {}), content: updatedContent }

        await supabase
          .from('portal_template_settings')
          .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
          .eq('page_id', row.page_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
