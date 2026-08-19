import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// Mesmo token do robô local de envio automático (header `x-auto-token`).
const TOKEN_HASH = 'f2ce9de66682050f2ba6700743d9cd0426754ec00bea91f06f49d73158071f75'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function autorizado(req: NextRequest): boolean {
  const t = req.headers.get('x-auto-token') || req.nextUrl.searchParams.get('token') || ''
  if (!t) return false
  if (createHash('sha256').update(t).digest('hex') === TOKEN_HASH) return true
  return !!process.env.AUTH_SECRET && t === process.env.AUTH_SECRET
}

// GET: casamentos à espera que a numeração das fotos seja lida. A pasta está no
// PC, por isso é o robô local que a percorre e devolve a lista dos números.
export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const { data, error } = await db()
    .from('eventos_2026')
    .select('id, notion_id, cliente, data_evento, pasta_fotos')
    .eq('numeros_fotos_estado', 'pendente')
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pendentes: data ?? [] })
}

// POST { id, numeros: string[] | string, total?, erro? } → guarda a numeração
// lida (ou o motivo de não ter conseguido).
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({} as any))
  const id = String(b.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const erro = String(b.erro ?? '').trim()
  const lista = Array.isArray(b.numeros) ? b.numeros.map((n: any) => String(n).trim()).filter(Boolean)
    : String(b.numeros ?? '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
  const numeros = lista.join(', ')

  const { error } = await db()
    .from('eventos_2026')
    .update({
      numeros_fotos: erro ? null : (numeros || null),
      numeros_fotos_total: erro ? null : (typeof b.total === 'number' ? b.total : lista.length),
      numeros_fotos_estado: erro ? 'erro' : 'ok',
      numeros_fotos_erro: erro || null,
      numeros_fotos_em: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, total: lista.length })
}
