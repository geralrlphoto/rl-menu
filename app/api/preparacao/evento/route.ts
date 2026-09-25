import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, eventoPreparacao, estadoLink, UUID_RE, reservarOpcao, type OpcaoHorario } from '@/lib/preparacao'
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
    sb.from('preparacao_eventos').select('briefing, briefing_enviado_em, briefing_atualizado_em, reativado_ate, pedido_horario, pedido_em, pedido_mensagem').eq('evento_id', ev.id).maybeSingle(),
    sb.from('preparacao_slots').select('data, hora').eq('tipo', 'preparacao').eq('evento_id', ev.id).maybeSingle(),
  ])
  return NextResponse.json({
    ok: true,
    batizado: ev.batizado,
    briefing: prep?.briefing ?? null,
    enviadoEm: prep?.briefing_enviado_em ?? null,
    atualizadoEm: prep?.briefing_atualizado_em ?? null,
    reserva: reserva ?? null,
    pedido: prep?.pedido_horario ? { opcoes: prep.pedido_horario, em: prep.pedido_em, mensagem: prep.pedido_mensagem ?? null } : null,
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
  const { eventoId, reativar, sincronizar, confirmarPedido, descartarPedido } = await req.json().catch(() => ({}))
  const confirmar = Number.isInteger(confirmarPedido)
  if (!UUID_RE.test(eventoId ?? '') || !(reativar || sincronizar || confirmar || descartarPedido)) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  const ev = await eventoPreparacao(eventoId)
  if (!ev) return NextResponse.json({ error: 'evento não encontrado' }, { status: 404 })

  // Pedido de "outro horário" dos noivos: confirmar uma das opções (fica marcada) ou descartar
  if (confirmar || descartarPedido) {
    const sb = sbAdmin()
    const { data: prep } = await sb.from('preparacao_eventos').select('pedido_horario').eq('evento_id', ev.id).maybeSingle()
    const opcao: OpcaoHorario | undefined = prep?.pedido_horario?.[confirmarPedido]
    if (confirmar) {
      if (!opcao) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })
      const res = await reservarOpcao(ev.id, opcao)
      if (res.erro) return NextResponse.json({ error: res.erro }, { status: 409 })
      revalidateTag('photo-whatsapp', { expire: 0 })
    }
    await sb.from('preparacao_eventos').update({ pedido_horario: null, pedido_em: null, pedido_mensagem: null }).eq('evento_id', ev.id)
    return NextResponse.json({ ok: true })
  }

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
