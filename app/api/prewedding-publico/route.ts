import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, eventoPreparacao, fmtDataLonga, estadoLink, UUID_RE } from '@/lib/preparacao'

// Público (link enviado aos noivos por WhatsApp): /prewedding/<id do evento>.
// Os noivos escolhem dia, hora e local sugerido da sessão pré-wedding a partir da
// disponibilidade (preparacao_slots com tipo = 'prewedding'). O admin recebe email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const TIPO = 'prewedding'

export async function GET(req: NextRequest) {
  const e = req.nextUrl.searchParams.get('e') ?? ''
  if (!UUID_RE.test(e)) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const sb = sbAdmin()
  const { data: minha } = await sb.from('preparacao_slots').select('id, data, hora, local')
    .eq('tipo', TIPO).eq('evento_id', ev.id).maybeSingle()
  // Horários livres do dia seguinte até à véspera do casamento
  const amanha = new Date(hojeLisboa() + 'T12:00:00Z'); amanha.setUTCDate(amanha.getUTCDate() + 1)
  let q = sb.from('preparacao_slots').select('id, data, hora, local').eq('tipo', TIPO).is('evento_id', null)
    .gte('data', amanha.toISOString().slice(0, 10)).order('data').order('hora').limit(200)
  if (ev.data_evento) q = q.lt('data', ev.data_evento)
  const { data: livres } = await q
  const { expirado } = estadoLink(ev.data_evento, minha ?? null, null)
  return NextResponse.json({
    ok: true, nome: ev.nome, dataEvento: ev.data_evento,
    expirado, reserva: minha ?? null, slots: expirado ? [] : (livres ?? []),
  })
}

export async function POST(req: NextRequest) {
  const { e, slotId, alterar } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(e ?? '') || !UUID_RE.test(slotId ?? '')) {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  const sb = sbAdmin()
  const { data: anterior } = await sb.from('preparacao_slots').select('id, data, hora, local')
    .eq('tipo', TIPO).eq('evento_id', ev.id).maybeSingle()
  if (estadoLink(ev.data_evento, anterior ?? null, null).expirado) {
    return NextResponse.json({ error: 'Este link já expirou. Falem connosco pelo WhatsApp, por favor.' }, { status: 410 })
  }
  if (anterior && !alterar) return NextResponse.json({ error: 'Já têm uma sessão marcada.' }, { status: 409 })
  if (anterior) {
    if (anterior.id === slotId) return NextResponse.json({ error: 'Esse já é o horário marcado.' }, { status: 409 })
    await sb.from('preparacao_slots').update({ evento_id: null, formato: null, reservado_em: null }).eq('id', anterior.id)
  }

  // Reserva só se o horário ainda estiver livre; se falhar, repõe a marcação anterior
  const { data: slot, error } = await sb.from('preparacao_slots')
    .update({ evento_id: ev.id, formato: 'Sessão', reservado_em: new Date().toISOString() })
    .eq('id', slotId).eq('tipo', TIPO).is('evento_id', null)
    .select('data, hora, local').maybeSingle()
  if (error || !slot) {
    if (anterior) {
      await sb.from('preparacao_slots').update({ evento_id: ev.id, formato: 'Sessão', reservado_em: new Date().toISOString() })
        .eq('id', anterior.id).is('evento_id', null)
    }
    return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolham outro, por favor.' }, { status: 409 })
  }

  revalidateTag('photo-whatsapp', { expire: 0 })

  const quando = `${fmtDataLonga(slot.data)} às ${slot.hora}`
  const antes = anterior ? `${fmtDataLonga(anterior.data)} às ${anterior.hora}${anterior.local ? ` · ${anterior.local}` : ''}` : null
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Sessão pré-wedding ${antes ? 'alterada' : 'marcada'}</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(ev.nome || ev.cliente || '')}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.7;font-family:Arial,sans-serif">
${antes ? `<span style="text-decoration:line-through;color:rgba(255,255,255,.4)">${esc(antes)}</span><br/>` : ''}<b style="color:#fff">${esc(quando)}</b><br/>
${slot.local ? `Local: ${esc(slot.local)}<br/>` : ''}Casamento: ${ev.data_evento ? esc(fmtDataLonga(ev.data_evento)) : '—'}${ev.local ? ` · ${esc(ev.local)}` : ''}</td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Sessão pré-wedding ${antes ? 'alterada' : 'marcada'}: ${ev.nome || ev.cliente} (${quando})`, html,
      }),
    })
  } catch { /* a reserva fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora: slot.hora, local: slot.local } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
