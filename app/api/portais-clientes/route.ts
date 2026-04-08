import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'

function extractSettings(blocks: any[]) {
  let settingsBlockId: string | null = null
  let settings = { hiddenNav: [] as string[] }
  const content = blocks.filter(b => {
    if (b.type !== 'paragraph') return true
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      settingsBlockId = b.id
      try { settings = JSON.parse(text.slice(SETTINGS_PREFIX.length)) } catch {}
      return false // remove from visible blocks
    }
    return true
  })
  return { content, settings, settingsBlockId }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

// In-memory cache shared via globalThis so clear-cache route can access it
declare global {
  var notionBlocksCache: Map<string, { blocks: any[]; settings: any; settingsBlockId: string | null; ts: number }> | undefined
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
      cache: 'no-store', // our own globalThis cache handles TTL — no Next.js layer
    })
    if (!res.ok) break
    const data = await res.json()
    all.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  // Fetch all children in parallel (much faster than sequential)
  const withChildren = all.filter(b => b.has_children)
  const childResults = await Promise.all(withChildren.map(b => getBlocks(b.id)))
  withChildren.forEach((b, i) => { b.children = childResults[i] })

  return all
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || PAGE_ID
    const bust = searchParams.get('bust') === '1'

    // Serve from in-memory cache if fresh (unless busting)
    const cached = cache.get(id)
    if (!bust && cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ blocks: cached.blocks, settings: cached.settings, settingsBlockId: cached.settingsBlockId, cached: true })
    }

    const raw = await getBlocks(id)
    const { content: blocks, settings, settingsBlockId } = extractSettings(raw)
    cache.set(id, { blocks, settings, settingsBlockId, ts: Date.now() })
    return NextResponse.json({ blocks, settings, settingsBlockId }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
