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
  if (!ref) return NextResponse.json({ id: null, data_prevista_entrega: null, status: null })

  const { data } = await db()
    .from('albuns_casamento')
    .select('id, data_prevista_entrega, status')
    .eq('ref_evento', ref)
    .maybeSingle()

  if (!data) return NextResponse.json({ id: null, data_prevista_entrega: null, status: null })

  return NextResponse.json({
    id: data.id,
    data_prevista_entrega: data.data_prevista_entrega ?? null,
    status: data.status ?? null,
  })
}
