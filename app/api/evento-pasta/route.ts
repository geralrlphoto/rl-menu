import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const COLS = 'pasta_fotos, numeros_fotos, numeros_fotos_total, numeros_fotos_estado, numeros_fotos_erro, numeros_fotos_em'

// GET ?eventId=<notion_id ou id>  → pasta de fotografias guardada + numeração lida.
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')?.trim()
  if (!eventId) return NextResponse.json({ pasta_fotos: null })
  const { data } = await db()
    .from('eventos_2026')
    .select(COLS)
    .or(`notion_id.eq.${eventId},id.eq.${eventId}`)
    .maybeSingle()
  return NextResponse.json({
    pasta_fotos: data?.pasta_fotos ?? null,
    numeros_fotos: data?.numeros_fotos ?? null,
    numeros_fotos_total: data?.numeros_fotos_total ?? null,
    numeros_fotos_estado: data?.numeros_fotos_estado ?? null,
    numeros_fotos_erro: data?.numeros_fotos_erro ?? null,
    numeros_fotos_em: data?.numeros_fotos_em ?? null,
  })
}

// POST { eventId, pasta_fotos } → grava o caminho local da pasta das fotos e
// deixa um pedido de leitura da numeração («pendente»). A pasta está no PC do
// Rui, por isso quem a lê é o robô local (auto_enviar_fotos.py), que vai
// buscar os pendentes a /api/fotos-numeracao e devolve a lista dos números.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const eventId = String(b.eventId ?? '').trim()
  const pasta = String(b.pasta_fotos ?? '').trim() || null
  if (!eventId) return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })
  const sb = db()
  const { error } = await sb
    .from('eventos_2026')
    .update({
      pasta_fotos: pasta,
      numeros_fotos: null,
      numeros_fotos_total: null,
      numeros_fotos_erro: null,
      numeros_fotos_em: null,
      numeros_fotos_estado: 'pendente',
    })
    .or(`notion_id.eq.${eventId},id.eq.${eventId}`)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, pasta_fotos: pasta, numeros_fotos_estado: 'pendente' })
}
