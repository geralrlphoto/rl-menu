import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params
  const { data, error } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data.dados)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { ref } = await params
  const body = await req.json()

  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const merged = { ...(existing?.dados ?? {}), ...body }

  const { error } = await supabase
    .from('media_portais')
    .upsert(
      { ref: ref.toUpperCase(), dados: merged, updated_at: new Date().toISOString() },
      { onConflict: 'ref' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, dados: merged })
}
