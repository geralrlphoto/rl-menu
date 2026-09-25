import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, eventoPreparacao, fmtDataLonga, estadoLink, UUID_RE, HORAS_OUTRO, DEMO_ID, demoPreparacao, validarPedido } from '@/lib/preparacao'
import { MEET_LINK } from '@/lib/crm'

// Público (link enviado aos noivos por WhatsApp): /preparacao/<id do evento>.
// GET mostra os horários livres; POST reserva um e avisa o admin por email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

export async function GET(req: NextRequest) {
  const e = req.nextUrl.searchParams.get('e') ?? ''
  if (e === DEMO_ID) {
    const demo = demoPreparacao()
    return NextResponse.json({
      ok: true, nome: demo.nome, dataEvento: demo.dataEvento, batizado: false, crianca: null,
      expirado: false, reserva: null, slots: demo.slots, horasOutro: HORAS_OUTRO, pedido: null,
      briefing: { respostas: null, enviadoEm: null, prefill: { nome_noivos: demo.nome, local_cerimonia: demo.local, local_festa: demo.local, hora_cerimonia: '16:00' } },
    })
  }
  if (!UUID_RE.test(e)) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const sb = sbAdmin()
  const { data: minha } = await sb.from('preparacao_slots').select('id, data, hora, formato').eq('tipo', 'preparacao').eq('evento_id', ev.id).maybeSingle()
  // Horários livres do dia seguinte até à véspera do evento (também servem para alterar a data)
  const amanha = new Date(hojeLisboa() + 'T12:00:00Z'); amanha.setUTCDate(amanha.getUTCDate() + 1)
  let q = sb.from('preparacao_slots').select('id, data, hora').eq('tipo', 'preparacao').is('evento_id', null)
    .gte('data', amanha.toISOString().slice(0, 10)).order('data').order('hora').limit(200)
  if (ev.data_evento) q = q.lt('data', ev.data_evento)
  const { data: livresData } = await q
  const livres = livresData ?? []
  const { data: prep } = await sb.from('preparacao_eventos').select('briefing, briefing_enviado_em, reativado_ate, pedido_horario, pedido_em').eq('evento_id', ev.id).maybeSingle()
  const { expirado } = estadoLink(ev.data_evento, minha ?? null, prep?.reativado_ate)
  return NextResponse.json({
    ok: true, nome: ev.nome, dataEvento: ev.data_evento, batizado: ev.batizado, crianca: ev.crianca,
    expirado, reserva: minha ?? null, slots: expirado ? [] : livres, horasOutro: HORAS_OUTRO,
    pedido: prep?.pedido_horario ? { opcoes: prep.pedido_horario, em: prep.pedido_em } : null,
    // Briefing (casamento ou batizado), pré-preenchido com o que já está na ficha
    briefing: {
      respostas: prep?.briefing ?? null,
      enviadoEm: prep?.briefing_enviado_em ?? null,
      prefill: ev.batizado
        ? { nome_crianca: ev.nome_crianca_completo || ev.crianca || '', nome_pais: ev.nome, local_cerimonia: ev.local_cerimonia || ev.local || '', hora_cerimonia: (ev.hora_inicio ?? '').slice(0, 5) }
        : { nome_noivos: ev.nome, local_cerimonia: ev.local_cerimonia || ev.local || '', local_festa: ev.local || '', hora_cerimonia: (ev.hora_inicio ?? '').slice(0, 5) },
    },
  })
}

export async function POST(req: NextRequest) {
  // A reunião de preparação é sempre por videochamada
  const body = await req.json().catch(() => ({}))
  const { e, alterar, slotId } = body
  // "Outro horário": até 2 opções (dias úteis diferentes) que aguardam confirmação da RL
  const pedido: unknown = body.pedido
  const formato = 'Videochamada'
  const demo = e === DEMO_ID
  if ((!demo && !UUID_RE.test(e ?? '')) || (!pedido && !(demo ? slotId : UUID_RE.test(slotId ?? '')))) {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  if (pedido) return pedirOutroHorario(e, pedido, demo)

  // Simulação: responde como se tivesse marcado, sem gravar nem enviar email
  if (demo) {
    const s = demoPreparacao().slots.find(x => x.id === slotId)
    if (!s) return NextResponse.json({ error: 'Esse horário já não existe.' }, { status: 409 })
    return NextResponse.json({ ok: true, reserva: { data: s.data, hora: s.hora, formato } })
  }
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const sb = sbAdmin()
  // Alterar a data: liberta a marcação atual e tenta a nova; se falhar, repõe a antiga
  const { data: anterior } = await sb.from('preparacao_slots').select('id, data, hora').eq('tipo', 'preparacao').eq('evento_id', ev.id).maybeSingle()
  const { data: prep } = await sb.from('preparacao_eventos').select('reativado_ate, briefing_enviado_em').eq('evento_id', ev.id).maybeSingle()
  if (estadoLink(ev.data_evento, anterior ?? null, prep?.reativado_ate).expirado) {
    return NextResponse.json({ error: 'Este link já expirou. Falem connosco pelo WhatsApp, por favor.' }, { status: 410 })
  }
  // Primeiro o briefing e só depois a marcação
  if (!prep?.briefing_enviado_em && !anterior) {
    return NextResponse.json({ error: 'Preencham e enviem primeiro o briefing, por favor.' }, { status: 409 })
  }
  if (anterior && !alterar) return NextResponse.json({ error: 'Já têm uma reunião marcada.' }, { status: 409 })

  if (anterior) {
    if (anterior.id === slotId) return NextResponse.json({ error: 'Esse já é o horário marcado.' }, { status: 409 })
    await sb.from('preparacao_slots').update({ evento_id: null, formato: null, reservado_em: null }).eq('id', anterior.id)
  }

  // Reserva só se o horário ainda estiver livre (o índice único impede 2 reservas do mesmo casal)
  const { data: slot, error } = await sb.from('preparacao_slots')
    .update({ evento_id: ev.id, formato, reservado_em: new Date().toISOString() })
    .eq('id', slotId).eq('tipo', 'preparacao').is('evento_id', null)
    .select('data, hora').maybeSingle()
  if (error || !slot) {
    if (anterior) {
      await sb.from('preparacao_slots').update({ evento_id: ev.id, formato, reservado_em: new Date().toISOString() })
        .eq('id', anterior.id).is('evento_id', null)
    }
    if (error) {
      const jaTem = /evento_tipo_unico|duplicate/i.test(error.message)
      return NextResponse.json({ error: jaTem ? 'Já têm uma reunião marcada.' : 'Não foi possível marcar.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolham outro, por favor.' }, { status: 409 })
  }

  revalidateTag('photo-whatsapp', { expire: 0 })
  // Marcaram um horário publicado: um pedido de "outro horário" pendente deixa de fazer sentido
  await sb.from('preparacao_eventos').update({ pedido_horario: null, pedido_em: null }).eq('evento_id', ev.id)

  // Email para o admin (não bloqueia a resposta aos noivos se falhar)
  const quando = `${fmtDataLonga(slot.data)} às ${slot.hora}`
  const antes = anterior ? `${fmtDataLonga(anterior.data)} às ${anterior.hora}` : null
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião de preparação ${antes ? 'alterada' : 'marcada'}</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(ev.nome || ev.cliente || '')}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.7;font-family:Arial,sans-serif">
${antes ? `<span style="text-decoration:line-through;color:rgba(255,255,255,.4)">${esc(antes)}</span><br/>` : ''}<b style="color:#fff">${esc(quando)}</b><br/>${esc(formato)}: <a href="${MEET_LINK}" style="color:#C9A84C">${MEET_LINK.replace('https://', '')}</a><br/>
${ev.batizado ? `Batizado${ev.crianca ? ` de ${esc(ev.crianca)}` : ''}` : 'Casamento'}: ${ev.data_evento ? esc(fmtDataLonga(ev.data_evento)) : '—'}${ev.local ? ` · ${esc(ev.local)}` : ''}</td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Reunião de preparação${ev.batizado ? ' (batizado)' : ''} ${antes ? 'alterada' : 'marcada'}: ${ev.nome || ev.cliente} (${quando})`, html,
      }),
    })
  } catch { /* a reserva fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora: slot.hora, formato } })
}

/* "Outro horário": guarda até 2 opções e avisa o admin. Só fica marcado quando a RL
   confirmar uma delas na ficha do evento. */
async function pedirOutroHorario(e: string, pedido: unknown, demo: boolean) {
  const ev = demo ? null : await eventoPreparacao(e)
  if (!demo && !ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  const dataEvento = demo ? demoPreparacao().dataEvento : ev!.data_evento
  const r = validarPedido(pedido, dataEvento, !!ev?.batizado)
  if ('erro' in r) return NextResponse.json({ error: r.erro }, { status: 400 })
  const opcoes = r.opcoes
  const agora = new Date().toISOString()
  if (demo) return NextResponse.json({ ok: true, pedido: { opcoes, em: agora } })

  const sb = sbAdmin()
  const [{ data: reserva }, { data: prep }] = await Promise.all([
    sb.from('preparacao_slots').select('data, hora').eq('tipo', 'preparacao').eq('evento_id', ev!.id).maybeSingle(),
    sb.from('preparacao_eventos').select('reativado_ate, briefing_enviado_em').eq('evento_id', ev!.id).maybeSingle(),
  ])
  if (estadoLink(ev!.data_evento, reserva ?? null, prep?.reativado_ate).expirado) {
    return NextResponse.json({ error: 'Este link já expirou. Falem connosco pelo WhatsApp, por favor.' }, { status: 410 })
  }
  if (!prep?.briefing_enviado_em && !reserva) {
    return NextResponse.json({ error: 'Preencham e enviem primeiro o briefing, por favor.' }, { status: 409 })
  }
  const { error } = await sb.from('preparacao_eventos')
    .upsert({ evento_id: ev!.id, pedido_horario: opcoes, pedido_em: agora }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: 'Não foi possível enviar o pedido.' }, { status: 500 })

  const lista = opcoes.map((o, i) => `<b style="color:#fff">Opção ${i + 1}:</b> ${esc(fmtDataLonga(o.data))} às ${esc(o.hora)}`).join('<br/>')
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Pedido de reunião · aguarda confirmação</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(ev!.nome || ev!.cliente || '')}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.8;font-family:Arial,sans-serif">
${reserva ? `Marcada atualmente: ${esc(fmtDataLonga(reserva.data))} às ${esc(reserva.hora)}<br/>` : ''}${lista}<br/>
<span style="color:rgba(255,255,255,.45);font-size:13px">Confirma uma das opções na ficha do evento.</span></td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev!.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Pedido de reunião (confirmar): ${ev!.nome || ev!.cliente}`, html,
      }),
    })
  } catch { /* o pedido fica guardado na mesma */ }

  return NextResponse.json({ ok: true, pedido: { opcoes, em: agora } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
