import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ── Supabase ──────────────────────────────────────────────────────────────────
function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Notion helpers ────────────────────────────────────────────────────────────
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'

// Strips legacy __PORTAL_SETTINGS__ blocks from visible content and extracts
// their JSON as a fallback when Supabase has no record for this page yet.
function extractNotionSettings(blocks: any[]) {
  let notionSettingsBlockId: string | null = null
  let notionSettings: any = { hiddenNav: [] }
  const content = blocks.filter(b => {
    if (b.type !== 'paragraph') return true
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      notionSettingsBlockId = b.id
      try {
        const parsed = JSON.parse(text.slice(SETTINGS_PREFIX.length))
        notionSettings = { ...notionSettings, ...parsed }
      } catch {}
      return false // hide from visible blocks
    }
    return true
  })
  return { content, notionSettings, notionSettingsBlockId }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

// ── In-memory block cache (content only — settings now come from Supabase) ───
declare global {
  var notionBlocksCache: Map<string, { blocks: any[]; notionSettings: any; notionSettingsBlockId: string | null; ts: number }> | undefined
}
if (!global.notionBlocksCache) global.notionBlocksCache = new Map()
const cache = global.notionBlocksCache
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getBlocks(blockId: string): Promise<any[]> {
  const all: any[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: notionHeaders,
      cache: 'no-store',
    })
    if (!res.ok) break
    const data = await res.json()
    all.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  const withChildren = all.filter(b => b.has_children)
  const childResults = await Promise.all(withChildren.map(b => getBlocks(b.id)))
  withChildren.forEach((b, i) => { b.children = childResults[i] })

  return all
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || PAGE_ID
    const bust = searchParams.get('bust') === '1'

    // ── 1. Fetch Notion blocks (cached, busted when requested) ────────────────
    let blocks: any[]
    let notionSettings: any = { hiddenNav: [] }
    let notionSettingsBlockId: string | null = null

    const cached = cache.get(id)
    if (!bust && cached && Date.now() - cached.ts < CACHE_TTL) {
      blocks = cached.blocks
      notionSettings = cached.notionSettings
      notionSettingsBlockId = cached.notionSettingsBlockId
    } else {
      const raw = await getBlocks(id)
      ;({ content: blocks, notionSettings, notionSettingsBlockId } = extractNotionSettings(raw))
      cache.set(id, { blocks, notionSettings, notionSettingsBlockId, ts: Date.now() })
    }

    // ── 2. Fetch settings from Supabase (authoritative source) ────────────────
    // If Supabase has a record for this page, it takes full priority over any
    // legacy __PORTAL_SETTINGS__ blocks still present in Notion.
    // If not (page not yet migrated), fall back to Notion-extracted settings.
    let settings: any = notionSettings
    let settingsBlockId: string | null = notionSettingsBlockId // legacy, kept for compat

    try {
      const db = supabase()
      const { data: row } = await db
        .from('portal_template_settings')
        .select('settings')
        .eq('page_id', id)
        .single()

      if (row?.settings) {
        // Supabase has migrated settings — use them exclusively
        settings = row.settings
        settingsBlockId = null // no longer relevant; frontend ignores null gracefully
      }
      // If no Supabase row, keep notionSettings as fallback
    } catch {
      // Supabase unavailable — fall back to Notion settings silently
    }

    // Strip password before sending to client
    const { portalPassword, ...safeSettings } = settings as any
    return NextResponse.json(
      { blocks, settings: safeSettings, settingsBlockId, hasPassword: !!(portalPassword) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (e: any) {
    console.error('[portais-clientes] Error:', e.message)
    return NextResponse.json(
      { blocks: [], settings: { hiddenNav: [] }, settingsBlockId: null },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
