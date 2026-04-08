import { NextRequest, NextResponse } from 'next/server'

const NOTION_TOKEN   = process.env.NOTION_TOKEN!
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

// Search all child pages of the main portal page for one matching the ref
const MAIN_PORTAL_ID = '311220116d8a80d29468e817ae7bb79f'

async function getBlocks(pageId: string): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: notionH, cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

function extractRef(blocks: any[]): string | null {
  let textRef: string | null = null
  for (const b of blocks) {
    if (b.type !== 'paragraph') continue
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      try {
        const ps = JSON.parse(text.slice(SETTINGS_PREFIX.length))
        if (ps.referencia) return ps.referencia
      } catch { /* continue */ }
    }
    // Also check plain text paragraphs like "Referência: CAS_026_26_RL"
    const match = text.match(/^refer[eê]ncia\s*:\s*(.+)$/i)
    if (match && !textRef) textRef = match[1].trim()
  }
  return textRef
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  try {
    // 1. Get all child pages of main portal
    const topBlocks = await getBlocks(MAIN_PORTAL_ID)
    const childPages = topBlocks.filter(b => b.type === 'child_page')

    // 2. Check the main portal itself
    const mainBlocks = await getBlocks(MAIN_PORTAL_ID)
    const mainRef = extractRef(mainBlocks)
    if (mainRef && mainRef.toLowerCase() === ref.toLowerCase()) {
      return NextResponse.json({ found: true, pageId: MAIN_PORTAL_ID, title: 'Portal Cliente' })
    }

    // 3. Check each child portal page
    for (const page of childPages) {
      const blocks = await getBlocks(page.id)
      const pageRef = extractRef(blocks)
      if (pageRef && pageRef.toLowerCase() === ref.toLowerCase()) {
        return NextResponse.json({ found: true, pageId: page.id, title: page.child_page?.title ?? '' })
      }
    }

    return NextResponse.json({ found: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
