import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, eventoPreparacao, fmtDataLonga, UUID_RE, FORMATOS } from '@/lib/preparacao'

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
  const { data: minha } = await sb.from('preparacao_slots').select('id, data, hora, formato').eq('evento_id', ev.id).maybeSingle()
  let livres: any[] = []
  if (!minha) {
    // Do dia seguinte até à véspera do casamento
    const amanha = new Date(hojeLisboa() + 'T12:00:00Z'); amanha.setUTCDate(amanha.getUTCDate() + 1)
    let q = sb.from('preparacao_slots').select('id, data, hora').is('evento_id', null)
      .gte('data', amanha.toISOString().slice(0, 10)).order('data').order('hora').limit(200)
    if (ev.data_evento) q = q.lt('data', ev.data_evento)
    const { data } = await q
    livres = data ?? []
  }
  return NextResponse.json({ ok: true, nome: ev.nome, dataEvento: ev.data_evento, reserva: minha ?? null, slots: livres })
}

export async function POST(req: NextRequest) {
  const { e, slotId, formato } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(e ?? '') || !UUID_RE.test(slotId ?? '') || !FORMATOS.includes(formato)) {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })

  // Reserva só se o horário ainda estiver livre (o índice único impede 2 reservas do mesmo casal)
  const { data: slot, error } = await sbAdmin().from('preparacao_slots')
    .update({ evento_id: ev.id, formato, reservado_em: new Date().toISOString() })
    .eq('id', slotId).is('evento_id', null)
    .select('data, hora').maybeSingle()
  if (error) {
    const jaTem = /preparacao_slots_evento_unico|duplicate/i.test(error.message)
    return NextResponse.json({ error: jaTem ? 'Já têm uma reunião marcada.' : 'Não foi possível marcar.' }, { status: 409 })
  }
  if (!slot) return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolham outro, por favor.' }, { status: 409 })

  revalidateTag('photo-whatsapp', { expire: 0 })

  // Email para o admin (não bloqueia a resposta aos noivos se falhar)
  const quando = `${fmtDataLonga(slot.data)} às ${slot.hora}`
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião de preparação marcada</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(ev.nome || ev.cliente || '')}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.7;font-family:Arial,sans-serif">
<b style="color:#fff">${esc(quando)}</b><br/>${esc(formato)}<br/>
Casamento: ${ev.data_evento ? esc(fmtDataLonga(ev.data_evento)) : '—'}${ev.local ? ` · ${esc(ev.local)}` : ''}</td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Reunião de preparação marcada: ${ev.nome || ev.cliente} (${quando})`, html,
      }),
    })
  } catch { /* a reserva fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora: slot.hora, formato } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
