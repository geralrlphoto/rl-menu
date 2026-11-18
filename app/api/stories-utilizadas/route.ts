import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ============================================================
   /api/stories-utilizadas
   Stories de 1 minuto (12 Meses 12 Vídeos) já utilizadas.
   Guardado em app_config como lista JSON de ids.
   ============================================================ */

export const dynamic = 'force-dynamic'

const KEY = 'stories_1min_utilizadas'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function ler(): Promise<string[]> {
  const { data } = await db().from('app_config').select('value').eq('key', KEY).maybeSingle()
  try {
    const v = JSON.parse(data?.value ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

// GET → { ids: [...] }
export async function GET() {
  return NextResponse.json({ ids: await ler() })
}

// POST { id, utilizada: boolean } → marca/desmarca
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = typeof b.id === 'string' ? b.id.trim() : ''
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })

  const atual = new Set(await ler())
  if (b.utilizada === true) atual.add(id)
  else atual.delete(id)
  const ids = [...atual]

  const { error } = await db()
    .from('app_config')
    .upsert({ key: KEY, value: JSON.stringify(ids), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ids })
}
