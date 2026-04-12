import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ row: null })

  const { data, error } = await db()
    .from('fotos_selecao')
    .select('*')
    .eq('referencia', ref)
    .maybeSingle()

  if (error) return NextResponse.json({ row: null })
  return NextResponse.json({ row: data ?? null })
}
