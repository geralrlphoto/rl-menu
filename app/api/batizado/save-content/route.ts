import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, content } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  // Merge with existing settings to avoid overwriting unrelated fields
  const { data: existing } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  const merged = { ...(existing?.settings || {}), content }

  const { error } = await supabase
    .from('portal_template_settings')
    .upsert({ page_id: pageId, settings: merged, updated_at: new Date().toISOString() }, { onConflict: 'page_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
