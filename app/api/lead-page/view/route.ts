import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('page_token', token)
    .single()

  if (!contact || !contact.page_publicada) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Registar visita
  await supabase.from('crm_contacts').update({
    page_views: (contact.page_views || 0) + 1,
    page_last_viewed: new Date().toISOString(),
  }).eq('id', contact.id)

  return NextResponse.json({ contact })
}
