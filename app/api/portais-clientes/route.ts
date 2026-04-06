import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

async function getBlocks(blockId: string): Promise<any[]> {
  const all: any[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const res = await fetch(url.toString(), { headers, cache: 'no-store' })
    if (!res.ok) break
    const data = await res.json()
    all.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  // Recursively fetch children for blocks that have them
  for (const block of all) {
    if (block.has_children) {
      block.children = await getBlocks(block.id)
    }
  }

  return all
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || PAGE_ID
    const blocks = await getBlocks(id)
    return NextResponse.json({ blocks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
