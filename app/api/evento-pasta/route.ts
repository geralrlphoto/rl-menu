import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET ?eventId=<notion_id ou id>  → devolve a pasta de fotografias guardada.
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')?.trim()
  if (!eventId) return NextResponse.json({ pasta_fotos: null })
  const { data } = await db()
    .from('eventos_2026')
    .select('pasta_fotos')
    .or(`notion_id.eq.${eventId},id.eq.${eventId}`)
    .maybeSingle()
  return NextResponse.json({ pasta_fotos: data?.pasta_fotos ?? null })
}

// POST { eventId, pasta_fotos } → grava o caminho local da pasta das fotos.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const eventId = String(b.eventId ?? '').trim()
  const pasta = String(b.pasta_fotos ?? '').trim() || null
  if (!eventId) return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })
  const sb = db()
  const { error } = await sb
    .from('eventos_2026')
    .update({ pasta_fotos: pasta })
    .or(`notion_id.eq.${eventId},id.eq.${eventId}`)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pasta_fotos: pasta })
}
