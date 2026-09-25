import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, eventoPreparacao, fmtDataLonga, estadoLink, UUID_RE, HORAS_OUTRO } from '@/lib/preparacao'
import { MEET_LINK } from '@/lib/crm'

// Público (link enviado aos noivos por WhatsApp): /preparacao/<id do evento>.
// GET mostra os horários livres; POST reserva um e avisa o admin por email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

export async function GET(req: NextRequest) {
  const e = req.nextUrl.searchParams.get('e') ?? ''
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
  const { data: prep } = await sb.from('preparacao_eventos').select('briefing, briefing_enviado_em, reativado_ate').eq('evento_id', ev.id).maybeSingle()
  const { expirado } = estadoLink(ev.data_evento, minha ?? null, prep?.reativado_ate)
  return NextResponse.json({
    ok: true, nome: ev.nome, dataEvento: ev.data_evento, batizado: ev.batizado, crianca: ev.crianca,
    expirado, reserva: minha ?? null, slots: expirado ? [] : livres, horasOutro: HORAS_OUTRO,
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
  const { e, alterar } = body
  let slotId: string | undefined = body.slotId
  // "Outro dia e horário": dia útil e hora escolhidos pelos noivos, fora dos horários publicados
  const outro: { data?: string; hora?: string } | null = body.outro ?? null
  const formato = 'Videochamada'
  if (!UUID_RE.test(e ?? '') || (!outro && !UUID_RE.test(slotId ?? ''))) {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  if (outro) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(outro.data ?? '') ? new Date(outro.data + 'T12:00:00Z') : null
    if (!d || isNaN(d.getTime()) || !HORAS_OUTRO.includes(outro.hora ?? '')) {
      return NextResponse.json({ error: 'Escolham um dia e uma hora válidos.' }, { status: 400 })
    }
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      return NextResponse.json({ error: 'Ao fim de semana não é possível. Escolham um dia útil, por favor.' }, { status: 400 })
    }
    if (outro.data! <= hojeLisboa()) {
      return NextResponse.json({ error: 'Escolham um dia a partir de amanhã, por favor.' }, { status: 400 })
    }
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

  // "Outro dia e horário": usa o horário se já existir livre, senão cria-o só para este casal
  let criado: string | null = null
  if (outro) {
    if (ev.data_evento && outro.data! >= ev.data_evento) {
      return NextResponse.json({ error: `Escolham um dia antes ${ev.batizado ? 'do batizado' : 'do casamento'}, por favor.` }, { status: 400 })
    }
    const { data: existente } = await sb.from('preparacao_slots').select('id, evento_id')
      .eq('tipo', 'preparacao').eq('data', outro.data!).eq('hora', outro.hora!).maybeSingle()
    if (existente && existente.evento_id && existente.evento_id !== ev.id) {
      return NextResponse.json({ error: 'Esse horário já está ocupado. Escolham outro, por favor.' }, { status: 409 })
    }
    if (existente) slotId = existente.id
    else {
      const { data: novo, error: errNovo } = await sb.from('preparacao_slots')
        .insert({ tipo: 'preparacao', data: outro.data, hora: outro.hora }).select('id').single()
      if (errNovo || !novo) return NextResponse.json({ error: 'Não foi possível marcar.' }, { status: 500 })
      slotId = criado = novo.id
    }
  }

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
    // O horário criado para o pedido não pode ficar como disponibilidade pública
    if (criado) await sb.from('preparacao_slots').delete().eq('id', criado).is('evento_id', null)
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

  // Email para o admin (não bloqueia a resposta aos noivos se falhar)
  const quando = `${fmtDataLonga(slot.data)} às ${slot.hora}`
  const antes = anterior ? `${fmtDataLonga(anterior.data)} às ${anterior.hora}` : null
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião de preparação ${antes ? 'alterada' : 'marcada'}</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(ev.nome || ev.cliente || '')}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.7;font-family:Arial,sans-serif">
${antes ? `<span style="text-decoration:line-through;color:rgba(255,255,255,.4)">${esc(antes)}</span><br/>` : ''}<b style="color:#fff">${esc(quando)}</b><br/>${outro ? '<span style="color:#e8b04c">Dia e hora escolhidos pelos noivos, fora da disponibilidade publicada.</span><br/>' : ''}${esc(formato)}: <a href="${MEET_LINK}" style="color:#C9A84C">${MEET_LINK.replace('https://', '')}</a><br/>
${ev.batizado ? `Batizado${ev.crianca ? ` de ${esc(ev.crianca)}` : ''}` : 'Casamento'}: ${ev.data_evento ? esc(fmtDataLonga(ev.data_evento)) : '—'}${ev.local ? ` · ${esc(ev.local)}` : ''}</td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Reunião de preparação${ev.batizado ? ' (batizado)' : ''} ${antes ? 'alterada' : 'marcada'}${outro ? ' (outro horário)' : ''}: ${ev.nome || ev.cliente} (${quando})`, html,
      }),
    })
  } catch { /* a reserva fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora: slot.hora, formato } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
