import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, eventoPreparacao, estadoLink, UUID_RE } from '@/lib/preparacao'
import { limparBriefing } from '@/lib/briefing'

// Admin (ficha do evento): briefing dos noivos e estado do link /preparacao/<id>.
// GET  ?eventoId=  → briefing + se o link está ativo
// PATCH { eventoId, briefing }        → o admin corrige as respostas
// POST  { eventoId, reativar: true }  → reabre o link por 7 dias

export async function GET(req: NextRequest) {
  const eventoId = req.nextUrl.searchParams.get('eventoId') ?? ''
  if (!UUID_RE.test(eventoId)) return NextResponse.json({ error: 'eventoId inválido' }, { status: 400 })
  const ev = await eventoPreparacao(eventoId)
  if (!ev) return NextResponse.json({ ok: true, briefing: null, link: null })
  const sb = sbAdmin()
  const [{ data: prep }, { data: reserva }] = await Promise.all([
    sb.from('preparacao_eventos').select('briefing, briefing_enviado_em, briefing_atualizado_em, reativado_ate').eq('evento_id', ev.id).maybeSingle(),
    sb.from('preparacao_slots').select('data, hora').eq('evento_id', ev.id).maybeSingle(),
  ])
  return NextResponse.json({
    ok: true,
    batizado: ev.batizado,
    briefing: prep?.briefing ?? null,
    enviadoEm: prep?.briefing_enviado_em ?? null,
    atualizadoEm: prep?.briefing_atualizado_em ?? null,
    link: { ...estadoLink(ev.data_evento, reserva ?? null, prep?.reativado_ate), reativadoAte: prep?.reativado_ate ?? null },
  })
}

export async function PATCH(req: NextRequest) {
  const { eventoId, briefing } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(eventoId ?? '')) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  const ev = await eventoPreparacao(eventoId)
  if (!ev) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 })
  const { error } = await sbAdmin().from('preparacao_eventos')
    .upsert({ evento_id: ev.id, briefing: limparBriefing(briefing), briefing_atualizado_em: new Date().toISOString() }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { eventoId, reativar } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(eventoId ?? '') || !reativar) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  const ev = await eventoPreparacao(eventoId)
  if (!ev) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 })
  const ate = new Date(Date.now() + 7 * 86400000).toISOString()
  const { error } = await sbAdmin().from('preparacao_eventos')
    .upsert({ evento_id: ev.id, reativado_ate: ate }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, reativadoAte: ate })
}
