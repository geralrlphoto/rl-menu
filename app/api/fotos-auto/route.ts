import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Autenticação simples por token partilhado (reutiliza AUTH_SECRET, o mesmo
// segredo de admin já configurado na Vercel). O robô local envia-o no header
// `x-auto-token`. Sem token válido, 401.
function autorizado(req: NextRequest): boolean {
  const t = req.headers.get('x-auto-token') || req.nextUrl.searchParams.get('token') || ''
  return !!process.env.AUTH_SECRET && t === process.env.AUTH_SECRET
}

// GET: lista os pedidos de AQUISIÇÃO DIGITAL ainda por enviar (fotos_enviadas_em
//   nulo). É o que o robô local precisa para saber o que enviar.
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const { data, error } = await db()
    .from('photo_orders')
    .select('id, pedido, nome, email, noivos, data_casamento, formato, quantidade, fotografias')
    .eq('origem', 'adquirir')
    .eq('formato', 'digital')
    .is('fotos_enviadas_em', null)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pendentes: data ?? [] })
}

// POST: marca um pedido como já enviado ({ pedido } ou { id }), para não repetir.
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const pedido = String(b.pedido ?? '').trim()
  const id = String(b.id ?? '').trim()
  if (!pedido && !id) return NextResponse.json({ error: 'pedido ou id obrigatório' }, { status: 400 })
  const sb = db()
  let q = sb.from('photo_orders').update({ fotos_enviadas_em: new Date().toISOString() })
  q = pedido ? q.eq('pedido', pedido) : q.eq('id', id)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
