import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { buildTicketHtml } from '@/lib/ticket-html'

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
// Normaliza noivos para comparação tolerante: sem acentos, e ignora o conector
// entre os nomes ("e", "&", "+", "/") — "Ana e André" = "Ana & André" = "Ana André".
const norm = (s: any) => String(s ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+e\s+/g, ' ').replace(/[&+/]/g, ' ')
  .replace(/[^a-z0-9]/g, '')

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const sb = db()

  // Interruptor global: se o envio automático estiver DESLIGADO na app, o robô
  // não faz nada (nem consulta encomendas nem varre pastas).
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'envio_auto_ativo').maybeSingle()
  if ((cfg?.value ?? 'true') !== 'true') {
    return NextResponse.json({ pendentes: [], desativado: true })
  }

  // Elegíveis para envio automático: fotografias DIGITAIS ainda por enviar que
  // sejam aquisições por link (origem='adquirir') OU tickets marcados com envio
  // automático (envio_auto=true).
  const COLS = 'id, pedido, nome, email, noivos, data_casamento, formato, quantidade, fotografias'
  // Elegíveis para envio automático: digitais em "Aguardar" (não enviados) que
  // sejam aquisições por link (origem=adquirir) OU tickets marcados pelo
  // responsável com envio automático (envio_auto=true). O toggle do ticket
  // decide. "Entregue" nunca é reenviado.
  const { data: dig, error } = await sb
    .from('photo_orders').select(COLS)
    .eq('formato', 'digital').eq('estado', 'Aguardar').is('fotos_enviadas_em', null)
    .or('origem.eq.adquirir,envio_auto.eq.true')
    .order('created_at', { ascending: true }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Papel por preparar (copiar para a subpasta Impressão). Traz os campos todos
  // para gerar a cópia do ticket idêntica à do cliente. "Entregue" nunca é tratado.
  const { data: pap } = await sb
    .from('photo_orders')
    .select('id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, fotografias, responsavel, metodo_pagamento, mbway_conta, origem, created_at')
    .eq('formato', 'papel').is('impressao_preparada_em', null).neq('estado', 'Entregue')
    .order('created_at', { ascending: true }).limit(200)

  const pendentes = dig ?? []
  const papel = pap ?? []
  // Nada a fazer (o caso normal) → devolve já. Poupa egress.
  if (pendentes.length === 0 && papel.length === 0) return NextResponse.json({ pendentes: [], papel: [] })

  // Resolve a pasta de cada pedido → evento (campo pasta_fotos da ficha).
  // IMPORTANTE: dois casamentos podem ter o MESMO nome de noivos em datas
  // diferentes (ex.: "Ana e Rui" a 27/06 e "ANA E RUI" a 31/07). Resolver só
  // pelo nome faria colisão e misturava as pastas. Por isso a chave principal é
  // nome + data; só se recorre ao nome isolado quando esse nome é único.
  const { data: evs } = await sb.from('eventos_2026').select('cliente, referencia, data_evento, pasta_fotos').not('pasta_fotos', 'is', null)
  // Canoniza qualquer data (ISO "2026-07-31" ou "31 / 07 / 2026") em "AAAAMMDD".
  const dkey = (s: any): string => {
    const g = String(s ?? '').match(/\d+/g)
    if (!g || g.length < 3) return ''
    let y: string, mo: string, d: string
    if (g[0].length === 4) { y = g[0]; mo = g[1]; d = g[2] }   // AAAA-MM-DD
    else { d = g[0]; mo = g[1]; y = g[2] }                     // DD-MM-AAAA
    if (y.length !== 4) return ''
    return y + mo.padStart(2, '0').slice(-2) + d.padStart(2, '0').slice(-2)
  }
  const byNameDate = new Map<string, string>()   // "anarui|20260731" → pasta
  const byName = new Map<string, string>()        // "anarui" → pasta
  const nameCount = new Map<string, number>()     // nº de eventos com esse nome
  for (const ev of (evs ?? []) as any[]) {
    if (!ev.pasta_fotos) continue
    const dk = dkey(ev.data_evento)
    const nk = norm(ev.cliente)
    if (nk) {
      if (dk) byNameDate.set(nk + '|' + dk, ev.pasta_fotos)
      byName.set(nk, ev.pasta_fotos)
      nameCount.set(nk, (nameCount.get(nk) ?? 0) + 1)
    }
    const rk = norm(ev.referencia)
    if (rk) byName.set(rk, ev.pasta_fotos)   // referência é única → fallback direto
  }
  const resolvePasta = (p: any): string | null => {
    const nk = norm(p.noivos)
    const dk = dkey(p.data_casamento)
    const exato = dk ? byNameDate.get(nk + '|' + dk) : undefined
    if (exato) return exato
    // Sem data a bater: usa o nome só se NÃO houver ambiguidade (um único
    // casamento com esse nome). Se houver mais do que um, não arrisca — devolve
    // null e o pedido fica por resolver, em vez de ir para a pasta errada.
    if ((nameCount.get(nk) ?? 0) <= 1) return byName.get(nk) ?? null
    return null
  }
  const comPasta = (arr: any[]) => arr.map((p: any) => ({ ...p, pasta: resolvePasta(p) }))
  // Nas de papel juntamos o HTML do ticket (o mesmo do cliente) para o robô
  // guardar uma cópia na pasta da encomenda.
  const papelComTicket = comPasta(papel).map((p: any) => ({ ...p, ticket_html: buildTicketHtml(p) }))
  return NextResponse.json({ pendentes: comPasta(pendentes), papel: papelComTicket })
}

// POST: marca um pedido como tratado, para não repetir.
//   tipo omitido / 'envio'     → digital enviado: fotos_enviadas_em + estado Entregue.
//   tipo 'impressao'           → papel preparado: impressao_preparada_em (sem mexer no estado;
//                                a entrega física é marcada à mão depois de imprimir/enviar).
export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const pedido = String(b.pedido ?? '').trim()
  const id = String(b.id ?? '').trim()
  const tipo = String(b.tipo ?? 'envio')
  const erro = String(b.erro ?? '').trim()
  if (!pedido && !id) return NextResponse.json({ error: 'pedido ou id obrigatório' }, { status: 400 })
  const sb = db()
  const updates =
    tipo === 'impressao' ? { impressao_preparada_em: new Date().toISOString() }
    : tipo === 'erro'    ? { envio_erro: erro || 'Erro no envio' }  // guarda o motivo; não marca enviado
    : { fotos_enviadas_em: new Date().toISOString(), estado: 'Entregue', envio_erro: null }  // sucesso limpa o erro
  let q = sb.from('photo_orders').update(updates)
  q = pedido ? q.eq('pedido', pedido) : q.eq('id', id)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
