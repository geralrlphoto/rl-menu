import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'

declare global {
  var notionBlocksCache: Map<string, any> | undefined
}

// Find all __PORTAL_SETTINGS__ block IDs in a Notion page (top-level only)
async function findSettingsBlockIds(pageId: string): Promise<string[]> {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)
    const res = await fetch(url.toString(), { headers: notionHeaders, cache: 'no-store' })
    if (!res.ok) break
    const data = await res.json()
    for (const b of (data.results ?? [])) {
      if (b.type === 'paragraph') {
        const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
        if (text.startsWith(SETTINGS_PREFIX)) ids.push(b.id)
      }
    }
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return ids
}

// Write settings to a Notion page as a __PORTAL_SETTINGS__ block (legacy fallback)
async function saveToNotion(
  pageId: string,
  settings: object,
  incomingBlockId: string | null
): Promise<{ settingsBlockId: string | null }> {
  const content = SETTINGS_PREFIX + JSON.stringify(settings)
  const body = { paragraph: { rich_text: [{ type: 'text', text: { content } }] } }

  let targetId: string | null = incomingBlockId ?? null
  if (!targetId) {
    const existing = await findSettingsBlockIds(pageId)
    if (existing.length > 0) {
      targetId = existing[existing.length - 1]
      const toDelete = existing.slice(0, -1)
      await Promise.all(toDelete.map(id =>
        fetch(`https://api.notion.com/v1/blocks/${id}`, { method: 'DELETE', headers: notionHeaders })
      ))
    }
  }

  if (targetId) {
    await fetch(`https://api.notion.com/v1/blocks/${targetId}`, {
      method: 'PATCH', headers: notionHeaders, body: JSON.stringify(body),
    })
    global.notionBlocksCache?.delete(pageId)
    return { settingsBlockId: targetId }
  } else {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH', headers: notionHeaders,
      body: JSON.stringify({ children: [{ object: 'block', type: 'paragraph', ...body }] }),
    })
    global.notionBlocksCache?.delete(pageId)
    const data = await res.json()
    return { settingsBlockId: data.results?.[0]?.id ?? null }
  }
}

// POST — save template settings.
// Primary: Supabase portal_template_settings table.
// Fallback: Notion __PORTAL_SETTINGS__ block (if Supabase table doesn't exist yet).
export async function POST(req: Request) {
  try {
    const { pageId, settings, settingsBlockId: incomingId } = await req.json()

    if (!pageId || typeof settings !== 'object') {
      return NextResponse.json({ error: 'pageId and settings are required' }, { status: 400 })
    }

    // ── Try Supabase first ────────────────────────────────────────────────────
    const db = supabase()
    const { error: sbError } = await db
      .from('portal_template_settings')
      .upsert(
        { page_id: pageId, settings, updated_at: new Date().toISOString() },
        { onConflict: 'page_id' }
      )

    if (!sbError) {
      // Success — clear Notion cache too for clean state
      global.notionBlocksCache?.delete(pageId)
      return NextResponse.json({ ok: true, settingsBlockId: null }, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    // ── Supabase failed (table probably not created yet) — fall back to Notion ─
    console.warn('[portal-settings] Supabase unavailable, falling back to Notion:', sbError.message)
    const { settingsBlockId } = await saveToNotion(pageId, settings, incomingId ?? null)
    return NextResponse.json({ ok: true, settingsBlockId }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e: any) {
    console.error('[portal-settings] Unexpected error:', e.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
