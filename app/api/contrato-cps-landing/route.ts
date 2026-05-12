import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API de configuração da landing /contrato-cps
// - GET  → devolve a config atual
// - POST → guarda nova config (textos + URLs de fotos)
// Tabela: contrato_cps_landing (single-row, id=1)

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const ALLOWED_FIELDS = [
  'intro_kicker', 'intro_title_1', 'intro_title_2', 'intro_subtitle',
  'casamento_title', 'casamento_subtitle', 'casamento_photo_url',
  'batizado_title',  'batizado_subtitle',  'batizado_photo_url',
] as const

export async function GET() {
  try {
    const { data } = await db()
      .from('contrato_cps_landing')
      .select('*')
      .eq('id', 1)
      .single()
    return NextResponse.json(data ?? null)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload: Record<string, any> = { id: 1 }
    for (const k of ALLOWED_FIELDS) {
      if (typeof body[k] === 'string') payload[k] = body[k]
    }

    const { data, error } = await db()
      .from('contrato_cps_landing')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, config: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
