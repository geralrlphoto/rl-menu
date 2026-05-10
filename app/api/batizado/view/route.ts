import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses portal_template_settings table with key 'batizado_{token}'
// settings shape: { content: BatizadoContent }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  const { data, error } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return existing settings or empty object (client uses DEFAULT_BATIZADO_CONTENT)
  return NextResponse.json({ maquete: { token, settings: data?.settings || {} } })
}
