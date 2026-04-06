import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

// In-memory cache: pageId → { blocks, timestamp }
const cache = new Map<string, { blocks: any[]; ts: number }>()
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
      next: { revalidate: 300 }, // Next.js cache: 5 min
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

    // Serve from in-memory cache if fresh
    const cached = cache.get(id)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ blocks: cached.blocks, cached: true })
    }

    const blocks = await getBlocks(id)
    cache.set(id, { blocks, ts: Date.now() })
    return NextResponse.json({ blocks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
