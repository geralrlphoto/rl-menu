import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// Hash (sha256) do token dedicado do robô. O token em si nunca fica no código;
// o robô local envia-o no header `x-auto-token` e comparamos o hash. Como
// alternativa, também aceita o AUTH_SECRET de admin.
const TOKEN_HASH = 'f2ce9de66682050f2ba6700743d9cd0426754ec00bea91f06f49d73158071f75'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function autorizado(req: NextRequest): boolean {
  const t = req.headers.get('x-auto-token') || req.nextUrl.searchParams.get('token') || ''
  if (!t) return false
  const h = createHash('sha256').update(t).digest('hex')
  if (h === TOKEN_HASH) return true
  return !!process.env.AUTH_SECRET && t === process.env.AUTH_SECRET
}

// GET: lista os pedidos de AQUISIÇÃO DIGITAL ainda por enviar (fotos_enviadas_em
//   nulo). É o que o robô local precisa para saber o que enviar.
const norm = (s: any) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const sb = db()
  // Elegíveis para envio automático: fotografias DIGITAIS ainda por enviar que
  // sejam aquisições por link (origem='adquirir') OU tickets marcados com envio
  // automático (envio_auto=true).
  const { data, error } = await sb
    .from('photo_orders')
    .select('id, pedido, nome, email, noivos, data_casamento, formato, quantidade, fotografias')
    .eq('formato', 'digital')
    .is('fotos_enviadas_em', null)
    .or('origem.eq.adquirir,envio_auto.eq.true')
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sem pedidos por enviar (o caso normal) → devolve já, sem tocar em mais nada.
  // Poupa egress: cada verificação de rotina fica numa única leitura mínima.
  const pendentes = data ?? []
  if (pendentes.length === 0) return NextResponse.json({ pendentes: [] })

  // Resolve a pasta de cada pedido pelo nome dos noivos → evento (campo
  // pasta_fotos definido na ficha, secção Produção & Entregas). Assim o robô
  // recebe já o caminho exato quando existe.
  const { data: evs } = await sb.from('eventos_2026').select('cliente, referencia, pasta_fotos').not('pasta_fotos', 'is', null)
  const mapa = new Map<string, string>()
  for (const ev of (evs ?? []) as any[]) {
    if (ev.pasta_fotos) {
      if (ev.cliente) mapa.set(norm(ev.cliente), ev.pasta_fotos)
      if (ev.referencia) mapa.set(norm(ev.referencia), ev.pasta_fotos)
    }
  }
  const comPasta = pendentes.map((p: any) => ({ ...p, pasta: mapa.get(norm(p.noivos)) ?? null }))
  return NextResponse.json({ pendentes: comPasta })
}

// POST: marca um pedido como já enviado ({ pedido } ou { id }), para não repetir.
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const pedido = String(b.pedido ?? '').trim()
  const id = String(b.id ?? '').trim()
  if (!pedido && !id) return NextResponse.json({ error: 'pedido ou id obrigatório' }, { status: 400 })
  const sb = db()
  // Marca como enviado E passa o estado a "Entregue" (aparece logo na galeria).
  let q = sb.from('photo_orders').update({ fotos_enviadas_em: new Date().toISOString(), estado: 'Entregue' })
  q = pedido ? q.eq('pedido', pedido) : q.eq('id', id)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
