import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, hojeLisboa, fmtDataLonga, UUID_RE } from '@/lib/preparacao'
import { MEET_LINK } from '@/lib/crm'

// Público: /marcar, para quem não é noivo (parceiros, fornecedores, clientes RL PROD...).
// Usa a mesma disponibilidade da reunião de preparação (preparacao_slots, tipo preparacao).
// GET mostra os horários livres; POST reserva um: o horário sai da disponibilidade
// e a marcação fica em marcacoes_publicas. Aviso no sino do admin e por email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

function amanha() {
  const d = new Date(hojeLisboa() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const { data, error } = await sbAdmin().from('preparacao_slots').select('id, data, hora')
    .eq('tipo', 'preparacao').is('evento_id', null)
    .gte('data', amanha()).order('data').order('hora').limit(200)
  if (error) return NextResponse.json({ error: 'Não foi possível carregar' }, { status: 500 })
  return NextResponse.json({ ok: true, slots: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  // Campo escondido: só os robôs o preenchem
  if (body.site) return NextResponse.json({ ok: true })
  const limpo = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const nome = limpo(body.nome, 120)
  const contacto = limpo(body.contacto, 160)
  const assunto = limpo(body.assunto, 1000)
  const slotId = limpo(body.slotId, 40)
  if (!UUID_RE.test(slotId)) return NextResponse.json({ error: 'Escolha um horário, por favor.' }, { status: 400 })
  if (!nome || !contacto || !assunto) return NextResponse.json({ error: 'Preencha o nome, o contacto e o assunto, por favor.' }, { status: 400 })

  const sb = sbAdmin()
  // Tira o horário da disponibilidade só se ainda estiver livre (evita duas marcações no mesmo)
  const { data: slot } = await sb.from('preparacao_slots').delete()
    .eq('id', slotId).eq('tipo', 'preparacao').is('evento_id', null).gte('data', amanha())
    .select('data, hora').maybeSingle()
  if (!slot) return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolha outro, por favor.' }, { status: 409 })

  const { error } = await sb.from('marcacoes_publicas').insert({ data: slot.data, hora: slot.hora, nome, contacto, assunto })
  if (error) {
    await sb.from('preparacao_slots').insert({ data: slot.data, hora: slot.hora, tipo: 'preparacao' })
    return NextResponse.json({ error: 'Não foi possível marcar.' }, { status: 500 })
  }

  const quando = `${fmtDataLonga(slot.data)} às ${slot.hora}`
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião marcada no link público</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(nome)}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.7;font-family:Arial,sans-serif">
<b style="color:#fff">${esc(quando)}</b><br/>Contacto: ${esc(contacto)}<br/>Videochamada: <a href="${MEET_LINK}" style="color:#C9A84C">${MEET_LINK.replace('https://', '')}</a>
<div style="margin:14px 0 4px;padding:12px 14px;border-left:2px solid #C9A84C;background:rgba(255,255,255,.04);color:#fff;font-style:italic;white-space:pre-wrap">${esc(assunto)}</div></td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/calendario" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir calendário</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Reunião marcada: ${nome} (${quando})`, html,
      }),
    })
  } catch { /* a marcação fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora: slot.hora } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
