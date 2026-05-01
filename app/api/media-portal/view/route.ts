import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: lead, error } = await supabase
    .from('media_leads')
    .select('*')
    .eq('page_token', token)
    .single()

  if (error || !lead) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Registar visita
  await supabase.from('media_leads').update({
    page_views: (lead.page_views || 0) + 1,
    page_last_viewed: new Date().toISOString(),
  }).eq('id', lead.id)

  return NextResponse.json({ lead })
}
