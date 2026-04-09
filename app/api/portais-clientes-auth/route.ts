import { NextRequest, NextResponse } from 'next/server'

const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'
const NOTION_TOKEN = process.env.NOTION_TOKEN!

// POST { pageId, password } → { ok: boolean }
export async function POST(req: NextRequest) {
  try {
    const { pageId, password } = await req.json()
    if (!pageId || !password) return NextResponse.json({ ok: false })

    // Fetch blocks from Notion to extract settings
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers: { Authorization: `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ ok: false })

    const data = await res.json()
    let stored: string | null = null
    for (const block of data.results ?? []) {
      if (block.type !== 'paragraph') continue
      const text: string = block.paragraph?.rich_text?.[0]?.plain_text ?? ''
      if (text.startsWith(SETTINGS_PREFIX)) {
        try {
          const s = JSON.parse(text.slice(SETTINGS_PREFIX.length))
          stored = s.portalPassword ?? null
        } catch {}
        break
      }
    }

    if (!stored) return NextResponse.json({ ok: true }) // no password = open
    return NextResponse.json({ ok: stored === password })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
