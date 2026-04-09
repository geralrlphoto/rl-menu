import { redirect } from 'next/navigation'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const MAIN_PORTAL_ID = '311220116d8a80d29468e817ae7bb79f'
const SETTINGS_PREFIX = '__PORTAL_SETTINGS__:'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
}

async function getBlocks(pageId: string): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: notionH, cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

function extractRef(blocks: any[]): string | null {
  for (const b of blocks) {
    if (b.type !== 'paragraph') continue
    const text: string = b.paragraph?.rich_text?.[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      try {
        const ps = JSON.parse(text.slice(SETTINGS_PREFIX.length))
        if (ps.referencia) return ps.referencia
      } catch { /* continue */ }
    }
  }
  return null
}

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function BuscarPortalPage({ searchParams }: Props) {
  const { ref } = await searchParams

  if (ref) {
    try {
      const topBlocks = await getBlocks(MAIN_PORTAL_ID)
      const childPages = topBlocks.filter((b: any) => b.type === 'child_page')

      // Check main portal page itself
      const mainBlocks = await getBlocks(MAIN_PORTAL_ID)
      const mainRef = extractRef(mainBlocks)
      if (mainRef && mainRef.toLowerCase() === ref.toLowerCase()) {
        redirect(`/portal-cliente/${MAIN_PORTAL_ID}`)
      }

      // Check each child portal page
      for (const page of childPages) {
        const blocks = await getBlocks(page.id)
        const pageRef = extractRef(blocks)
        if (pageRef && pageRef.toLowerCase() === ref.toLowerCase()) {
          redirect(`/portal-cliente/${page.id}`)
        }
      }
    } catch { /* fall through */ }
  }

  // Not found — go to portal list
  redirect('/portal-cliente')
}
