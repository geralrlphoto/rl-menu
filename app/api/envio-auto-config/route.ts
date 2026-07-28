import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET → estado atual do envio automático (ligado/desligado).
export async function GET() {
  const { data } = await db().from('app_config').select('value').eq('key', 'envio_auto_ativo').maybeSingle()
  return NextResponse.json({ ativo: (data?.value ?? 'true') === 'true' })
}

// POST { ativo: boolean } → liga/desliga o envio automático.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const ativo = b.ativo === true
  const { error } = await db()
    .from('app_config')
    .upsert({ key: 'envio_auto_ativo', value: ativo ? 'true' : 'false', updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ativo })
}
