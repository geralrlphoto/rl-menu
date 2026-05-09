import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Kept for backward-compat: clear Notion in-memory cache after a settings write
// so any stale blocks don't re-appear on the next bust=1 fetch.
declare global {
  var notionBlocksCache: Map<string, any> | undefined
}

// POST — save template settings for a given Notion page ID into Supabase.
// Body: { pageId: string, settings: object, settingsBlockId?: string (ignored) }
// The settingsBlockId field is accepted but ignored — it was only used for the
// old Notion-block approach. Supabase uses pageId as the primary key.
export async function POST(req: Request) {
  try {
    const { pageId, settings } = await req.json()

    if (!pageId || typeof settings !== 'object') {
      return NextResponse.json({ error: 'pageId and settings are required' }, { status: 400 })
    }

    const db = supabase()
    const { error } = await db
      .from('portal_template_settings')
      .upsert(
        { page_id: pageId, settings, updated_at: new Date().toISOString() },
        { onConflict: 'page_id' }
      )

    if (error) {
      console.error('[portal-settings] Supabase upsert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear Notion cache for this page so old __PORTAL_SETTINGS__ blocks don't
    // shadow the new Supabase data on the next portais-clientes fetch.
    global.notionBlocksCache?.delete(pageId)

    // Return settingsBlockId as null — no longer relevant with Supabase storage.
    // Frontend code checks `if (saved.settingsBlockId)` before using it, so null is safe.
    return NextResponse.json({ ok: true, settingsBlockId: null }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e: any) {
    console.error('[portal-settings] Unexpected error:', e.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
