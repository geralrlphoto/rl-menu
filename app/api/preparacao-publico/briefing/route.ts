import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, eventoPreparacao, estadoLink, fmtDataLonga, UUID_RE } from '@/lib/preparacao'
import { camposBriefing, emFaltaBriefing, limparBriefing, valorBriefing } from '@/lib/briefing'
import { sincronizarBriefingPortal } from '@/lib/briefingPortal'

// Público (link /preparacao/<id>): os noivos enviam ou corrigem o briefing pré-casamento.
// Fica em preparacao_eventos e o admin recebe um email com as respostas.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

export async function POST(req: NextRequest) {
  const { e, respostas } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(e ?? '')) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 })
  const ev = await eventoPreparacao(e)
  if (!ev) return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  const campos = camposBriefing(ev.batizado)

  const sb = sbAdmin()
  const [{ data: reserva }, { data: prep }] = await Promise.all([
    sb.from('preparacao_slots').select('data, hora').eq('evento_id', ev.id).maybeSingle(),
    sb.from('preparacao_eventos').select('briefing_enviado_em, reativado_ate').eq('evento_id', ev.id).maybeSingle(),
  ])
  if (estadoLink(ev.data_evento, reserva ?? null, prep?.reativado_ate).expirado) {
    return NextResponse.json({ error: 'Este link já expirou. Falem connosco pelo WhatsApp, por favor.' }, { status: 410 })
  }

  const r = limparBriefing(respostas, campos)
  const falta = emFaltaBriefing(r, campos)
  if (falta.length) return NextResponse.json({ error: `Falta preencher: ${falta.join(', ')}` }, { status: 400 })

  const agora = new Date().toISOString()
  const primeira = !prep?.briefing_enviado_em
  const { error } = await sb.from('preparacao_eventos').upsert({
    evento_id: ev.id, briefing: r,
    briefing_enviado_em: prep?.briefing_enviado_em ?? agora, briefing_atualizado_em: agora,
  }, { onConflict: 'evento_id' })
  if (error) return NextResponse.json({ error: 'Não foi possível guardar. Tentem de novo.' }, { status: 500 })

  // Casamentos: passa as respostas para a sub-página BRIEFING do portal (só acrescenta)
  if (!ev.batizado) await sincronizarBriefingPortal(ev.referencia, r).catch(() => null)

  // Email ao admin com as respostas (não bloqueia a resposta aos noivos)
  const linhas = campos.map(c => {
    const v = valorBriefing(c, r)
    return `<tr><td style="padding:8px 0;border-top:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.45);font-size:12px;vertical-align:top;width:42%">${esc(c.label)}</td>
<td style="padding:8px 0 8px 12px;border-top:1px solid rgba(255,255,255,.07);color:#fff;font-size:13px;white-space:pre-wrap">${v ? esc(v) : '<span style="color:rgba(255,255,255,.25)">—</span>'}</td></tr>`
  }).join('')
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 6px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase">Briefing ${ev.batizado ? 'do batizado' : 'pré-casamento'} ${primeira ? 'recebido' : 'atualizado'}</td></tr>
<tr><td style="padding:2px 32px 4px;color:#fff;font-size:26px;font-family:Georgia,serif">${esc(ev.nome || ev.cliente || '')}</td></tr>
<tr><td style="padding:0 32px 14px;color:rgba(255,255,255,.5);font-size:13px">${ev.batizado ? `Batizado${ev.crianca ? ` de ${esc(ev.crianca)}` : ''}` : 'Casamento'}: ${ev.data_evento ? esc(fmtDataLonga(ev.data_evento)) : '—'}</td></tr>
<tr><td style="padding:0 32px 18px"><table width="100%" cellpadding="0" cellspacing="0">${linhas}</table></td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/eventos-2026/${ev.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha do evento</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Briefing ${ev.batizado ? 'do batizado ' : ''}${primeira ? 'recebido' : 'atualizado'}: ${ev.nome || ev.cliente}`, html,
      }),
    })
  } catch { /* o briefing fica guardado na mesma */ }

  return NextResponse.json({ ok: true, enviadoEm: prep?.briefing_enviado_em ?? agora })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
