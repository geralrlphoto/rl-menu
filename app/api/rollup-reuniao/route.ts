import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, fmtDataLonga, UUID_RE } from '@/lib/preparacao'
import { MEET_LINK, qualificarLead } from '@/lib/crm'

// Público (/rollup): os noivos que ainda não são clientes marcam reunião na mesma
// disponibilidade das reuniões de preparação (preparacao_slots, tipo 'preparacao').
// GET lista os horários livres; POST apanha o horário (sai da disponibilidade) e cria
// a lead no CRM já com "Reunião Agendada", que aparece no calendário. O admin recebe email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

function amanha(): string {
  const d = new Date(hojeLisboa() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET() {
  const { data, error } = await sbAdmin().from('preparacao_slots').select('id, data, hora')
    .eq('tipo', 'preparacao').is('evento_id', null).gte('data', amanha())
    .order('data').order('hora').limit(80)
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os horários.' }, { status: 500 })
  return NextResponse.json({ ok: true, slots: (data ?? []).map(s => ({ ...s, hora: String(s.hora).slice(0, 5) })) })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  // Campo escondido: se vier preenchido é um robô
  if (b.site) return NextResponse.json({ ok: true })
  const nome = String(b.nome ?? '').trim().slice(0, 120)
  const contato = String(b.contato ?? '').trim().slice(0, 40)
  const formato = b.formato === 'Presencial' ? 'Presencial' : 'Videochamada'
  const dataCasamento = /^\d{4}-\d{2}-\d{2}$/.test(b.dataCasamento ?? '') ? b.dataCasamento : ''
  if (!UUID_RE.test(b.slotId ?? '')) return NextResponse.json({ error: 'Escolham um horário, por favor.' }, { status: 400 })
  if (nome.length < 2) return NextResponse.json({ error: 'Digam-nos os vossos nomes, por favor.' }, { status: 400 })
  if (contato.replace(/\D/g, '').length < 9) return NextResponse.json({ error: 'Deixem um telefone válido, por favor.' }, { status: 400 })

  const sb = sbAdmin()
  // Apanha o horário só se ainda estiver livre: sai da disponibilidade para mais ninguém o marcar
  const { data: slot } = await sb.from('preparacao_slots').delete()
    .eq('id', b.slotId).eq('tipo', 'preparacao').is('evento_id', null).gte('data', amanha())
    .select('data, hora').maybeSingle()
  if (!slot) return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolham outro, por favor.' }, { status: 409 })
  const hora = String(slot.hora).slice(0, 5)
  const link = formato === 'Videochamada' ? MEET_LINK : MAPS_LINK

  const { data: lead, error } = await sb.from('crm_contacts').insert({
    nome,
    contato,
    data_casamento:  dataCasamento,
    tipo_evento:     'Casamento',
    como_chegou:     'Rollup',
    mensagem:        'Marcou a reunião pelo QR do rollup.',
    status:          'Reunião Agendada',
    reuniao_data:    slot.data,
    reuniao_hora:    hora,
    reuniao_tipo:    formato,
    reuniao_link:    link,
    lead_prioridade: qualificarLead('', dataCasamento),
    data_entrada:    hojeLisboa(),
  }).select('id').single()
  if (error || !lead) {
    // Devolve o horário à disponibilidade
    await sb.from('preparacao_slots').upsert({ tipo: 'preparacao', data: slot.data, hora }, { onConflict: 'tipo,data,hora', ignoreDuplicates: true })
    return NextResponse.json({ error: 'Não foi possível marcar. Tentem outra vez ou falem connosco pelo WhatsApp.' }, { status: 500 })
  }
  revalidateTag('photo-whatsapp', { expire: 0 })

  // Email para o admin (não bloqueia a resposta aos noivos se falhar)
  const quando = `${fmtDataLonga(slot.data)} às ${hora}`
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião marcada pelo rollup</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(nome)}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.8;font-family:Arial,sans-serif">
<b style="color:#fff">${esc(quando)}</b><br/>${formato}<br/>Telefone: ${esc(contato)}<br/>
Casamento: ${dataCasamento ? esc(fmtDataLonga(dataCasamento)) : 'data por definir'}<br/>
<span style="color:rgba(255,255,255,.45);font-size:13px">Este horário saiu da disponibilidade da reunião de preparação.</span></td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/crm/${lead.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha CRM</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Reunião marcada (rollup): ${nome} (${quando})`, html,
      }),
    })
  } catch { /* a marcação fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora, formato, link } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
