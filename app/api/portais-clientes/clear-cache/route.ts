import { NextResponse } from 'next/server'

// Import the cache map from the parent route
// We use a shared module-level store via a global variable
declare global {
  var notionBlocksCache: Map<string, { blocks: any[]; ts: number }> | undefined
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (global.notionBlocksCache) {
    if (id) {
      global.notionBlocksCache.delete(id)
    } else {
      global.notionBlocksCache.clear()
    }
  }

  return NextResponse.json({ ok: true })
}
