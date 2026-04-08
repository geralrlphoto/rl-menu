import { NextResponse } from 'next/server'

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
  var notionBlocksCache: Map<string, any> | undefined
}

// POST — save settings (update existing block or create new one)
export async function POST(req: Request) {
  const { pageId, settings, settingsBlockId } = await req.json()
  const content = SETTINGS_PREFIX + JSON.stringify(settings)
  const body = { paragraph: { rich_text: [{ type: 'text', text: { content } }] } }

  if (settingsBlockId) {
    // Update existing
    const res = await fetch(`https://api.notion.com/v1/blocks/${settingsBlockId}`, {
      method: 'PATCH',
      headers: notionHeaders,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json()
      return NextResponse.json({ error: d.message }, { status: res.status })
    }
    // Bust in-memory cache so next read gets fresh data
    global.notionBlocksCache?.delete(pageId)
    return NextResponse.json({ ok: true, settingsBlockId }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } else {
    // Create new block at the beginning of the page
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
