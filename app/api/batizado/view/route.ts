import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MASTER_TOKEN, buildSyncedContent } from '../_lib'

// Uses portal_template_settings table with key 'batizado_{token}'
// settings shape: { content: BatizadoContent }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  const { data, error } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Page exists — return it
  if (data?.settings) {
    return NextResponse.json({
      maquete: { token, settings: data.settings },
      page_confirmacao: data.settings.page_confirmacao ?? null,
      proposta_resposta: data.settings.proposta_resposta ?? null,
    })
  }

  // ── New client page — initialise from master template ─────────────────────
  // This ensures the client page inherits all design from the master,
  // AND creates the DB row so future master syncs will reach it.
  if (token !== MASTER_TOKEN) {
    const { data: master } = await supabase
      .from('portal_template_settings')
      .select('settings')
      .eq('page_id', `batizado_${MASTER_TOKEN}`)
      .single()

    if (master?.settings?.content) {
      const initialContent = buildSyncedContent(master.settings.content, {})
      const initialSettings = { content: initialContent }

      // Create the row so future syncs pick it up
      await supabase
        .from('portal_template_settings')
        .insert({ page_id: pageId, settings: initialSettings, updated_at: new Date().toISOString() })

      return NextResponse.json({
        maquete: { token, settings: initialSettings },
        page_confirmacao: null,
        proposta_resposta: null,
      })
    }
  }

  // Master doesn't exist yet — return empty (client uses DEFAULT_BATIZADO_CONTENT)
  return NextResponse.json({ maquete: { token, settings: {} }, page_confirmacao: null, proposta_resposta: null })
}
