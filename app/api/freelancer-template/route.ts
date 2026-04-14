import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const { data, error } = await supabase()
    .from('freelancers')
    .select('*')
    .eq('is_template', true)
    .limit(1)
    .single()

  if (error) {
    console.error('[freelancer-template] error:', error)
    return NextResponse.json({ template: null })
  }

  return NextResponse.json({ template: data })
}
