import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

// Fields in propostaPage that are design/template (synced from master)
// propostaAtiva is couple-specific → NOT synced
const DESIGN_KEYS = ['subtitle', 'intro', 'about', 'relive', 'packages', 'ctaText', 'typography'] as const

// Top-level content fields that are also synced (shared design across all proposals)
const TOP_LEVEL_DESIGN_KEYS = ['video', 'about', 'testimonials', 'banner', 'portfolio'] as const

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch master page_content
  const { data: master, error: masterErr } = await supabase
    .from('crm_contacts')
    .select('page_content')
    .eq('page_token', MASTER_TOKEN)
    .maybeSingle()

  if (masterErr) return NextResponse.json({ error: masterErr.message }, { status: 500 })
  if (!master?.page_content) return NextResponse.json({ error: 'Master not found' }, { status: 404 })

  const masterPropostaPage = master.page_content.propostaPage ?? {}

  // Extract only design keys from propostaPage
  const designPatch: Record<string, any> = {}
  for (const key of DESIGN_KEYS) {
    if (masterPropostaPage[key] !== undefined) {
      designPatch[key] = masterPropostaPage[key]
    }
  }

  // Extract top-level design fields (e.g. video URLs)
  const topLevelPatch: Record<string, any> = {}
  for (const key of TOP_LEVEL_DESIGN_KEYS) {
    if (master.page_content[key] !== undefined) {
      topLevelPatch[key] = master.page_content[key]
    }
  }

  // 2. Fetch all other contacts with a page_token
  const { data: contacts, error: contactsErr } = await supabase
    .from('crm_contacts')
    .select('page_token, page_content')
    .not('page_token', 'is', null)
    .neq('page_token', MASTER_TOKEN)

  if (contactsErr) return NextResponse.json({ error: contactsErr.message }, { status: 500 })

  let updated = 0
  for (const contact of (contacts ?? [])) {
    const current = contact.page_content ?? {}
    const currentPropostaPage = current.propostaPage ?? {}

    // Merge design fields, preserve propostaAtiva (couple-specific)
    const newPropostaPage = {
      ...currentPropostaPage,
      ...designPatch,
      propostaAtiva: currentPropostaPage.propostaAtiva ?? 0,
    }

    const newContent = { ...current, ...topLevelPatch, propostaPage: newPropostaPage }

    const { error } = await supabase
      .from('crm_contacts')
      .update({ page_content: newContent })
      .eq('page_token', contact.page_token)

    if (!error) updated++
  }

  return NextResponse.json({ ok: true, updated })
}
