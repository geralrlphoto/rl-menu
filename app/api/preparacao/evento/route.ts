import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, eventoPreparacao, estadoLink, UUID_RE } from '@/lib/preparacao'
import { camposBriefing, limparBriefing } from '@/lib/briefing'
import { sincronizarBriefingPortal } from '@/lib/briefingPortal'

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
    sb.from('preparacao_slots').select('data, hora').eq('tipo', 'preparacao').eq('evento_id', ev.id).maybeSingle(),
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
  const limpo = limparBriefing(briefing, camposBriefing(ev.batizado))
  const { error } = await sbAdmin().from('preparacao_eventos')
    .upsert({ evento_id: ev.id, briefing: limpo, briefing_atualizado_em: new Date().toISOString() }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const portal = ev.batizado ? null : await sincronizarBriefingPortal(ev.referencia, limpo).catch(() => null)
  return NextResponse.json({ ok: true, portal })
}

export async function POST(req: NextRequest) {
  const { eventoId, reativar, sincronizar } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(eventoId ?? '') || !(reativar || sincronizar)) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  const ev = await eventoPreparacao(eventoId)
  if (!ev) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 })

  // Botão "Sincronizar com o portal" (ex.: o portal foi criado depois do briefing)
  if (sincronizar) {
    const { data: prep } = await sbAdmin().from('preparacao_eventos').select('briefing').eq('evento_id', ev.id).maybeSingle()
    const res = await sincronizarBriefingPortal(ev.referencia, prep?.briefing ?? null)
    return NextResponse.json({ ok: res.ok, motivo: res.ok ? null : res.motivo })
  }

  const ate = new Date(Date.now() + 7 * 86400000).toISOString()
  const { error } = await sbAdmin().from('preparacao_eventos')
    .upsert({ evento_id: ev.id, reativado_ate: ate }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, reativadoAte: ate })
}
