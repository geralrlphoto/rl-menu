import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  const db = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { data, error } = await db
    .from('portais')
    .select('portalPassword:settings->>portalPassword')
    .ilike('referencia', ref)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ password: null })

  return NextResponse.json({ password: (data as any).portalPassword ?? null })
}
