import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'

// Parse a settings block's text content
export function parseSettings(text: string): { hiddenNav: string[] } {
  try {
    const json = text.slice(SETTINGS_PREFIX.length)
    return JSON.parse(json)
  } catch {
    return { hiddenNav: [] }
  }
}

export function isSettingsBlock(text: string): boolean {
  return text.startsWith(SETTINGS_PREFIX)
}

declare global {
  var notionBlocksCache: Map<string, { blocks: any[]; settings: any; settingsBlockId: string | null; ts: number }> | undefined
}

/** Find all __PORTAL_SETTINGS__ block IDs in a Notion page */
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

// POST — save settings (update existing block or create new one)
export async function POST(req: Request) {
  const { pageId, settings, settingsBlockId: incomingId } = await req.json()
  const content = SETTINGS_PREFIX + JSON.stringify(settings)
  const body = { paragraph: { rich_text: [{ type: 'text', text: { content } }] } }

  let targetId: string | null = incomingId ?? null

  // If caller didn't supply an ID, find existing settings blocks to avoid duplicates
  if (!targetId) {
    const existing = await findSettingsBlockIds(pageId)
    if (existing.length > 0) {
      targetId = existing[existing.length - 1] // use the last one
      // Delete all others silently
      const toDelete = existing.slice(0, -1)
      await Promise.all(toDelete.map(id =>
        fetch(`https://api.notion.com/v1/blocks/${id}`, { method: 'DELETE', headers: notionHeaders })
      ))
    }
  }

  if (targetId) {
    // PATCH existing block
    const res = await fetch(`https://api.notion.com/v1/blocks/${targetId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json()
      return NextResponse.json({ error: d.message }, { status: res.status })
    }
    global.notionBlocksCache?.delete(pageId)
    return NextResponse.json({ ok: true, settingsBlockId: targetId }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } else {
    // No existing block — create new one
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify({ children: [{ object: 'block', type: 'paragraph', ...body }] }),
    })
    if (!res.ok) {
      const d = await res.json()
      return NextResponse.json({ error: d.message }, { status: res.status })
    }
    global.notionBlocksCache?.delete(pageId)
    const data = await res.json()
    return NextResponse.json({ ok: true, settingsBlockId: data.results?.[0]?.id }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}
