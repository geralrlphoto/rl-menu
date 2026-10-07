import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, fmtDataLonga, UUID_RE, HORAS_OUTRO, validarPedido } from '@/lib/preparacao'
import { MEET_LINK, qualificarLead } from '@/lib/crm'

// Público (/rollup): os noivos que ainda não são clientes marcam reunião na mesma
// disponibilidade das reuniões de preparação (preparacao_slots, tipo 'preparacao').
// GET lista os horários livres; POST apanha o horário (sai da disponibilidade) e cria
// a lead no CRM já com "Reunião Agendada", que aparece no calendário. O admin recebe email.
// "Outro horário" (como na preparação): até 2 opções em dias úteis; a lead entra como
// "Por Contactar" com as opções na mensagem e o admin confirma a reunião no calendário/CRM.
// Com leadId (página /reuniao/<id>, link enviado pelo WhatsApp do CRM) a lead já existe:
// marcar atualiza essa lead; "outro horário" fica na próxima ação dela para o admin confirmar.

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
  return NextResponse.json({ ok: true, horasOutro: HORAS_OUTRO, slots: (data ?? []).map(s => ({ ...s, hora: String(s.hora).slice(0, 5) })) })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  // Campo escondido: se vier preenchido é um robô
  if (b.site) return NextResponse.json({ ok: true })
  const sb = sbAdmin()
  let nome = String(b.nome ?? '').trim().slice(0, 120)
  let contato = String(b.contato ?? '').trim().slice(0, 40)
  const formato = b.formato === 'Presencial' ? 'Presencial' : 'Videochamada'
  let dataCasamento = /^\d{4}-\d{2}-\d{2}$/.test(b.dataCasamento ?? '') ? b.dataCasamento : ''
  const leadId: string | null = typeof b.leadId === 'string' && UUID_RE.test(b.leadId) ? b.leadId : null
  if (b.leadId && !leadId) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  if (leadId) {
    const { data: l } = await sb.from('crm_contacts').select('nome, contato, data_casamento').eq('id', leadId).maybeSingle()
    if (!l) return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
    nome = l.nome ?? ''; contato = l.contato ?? ''; dataCasamento = l.data_casamento ?? ''
  }
  if (!b.pedido && !UUID_RE.test(b.slotId ?? '')) return NextResponse.json({ error: 'Escolham um horário, por favor.' }, { status: 400 })
  if (!leadId && nome.length < 2) return NextResponse.json({ error: 'Digam-nos os vossos nomes, por favor.' }, { status: 400 })
  if (!leadId && contato.replace(/\D/g, '').length < 9) return NextResponse.json({ error: 'Deixem um telefone válido, por favor.' }, { status: 400 })
  if (b.pedido) return pedirOutroHorario(b.pedido, { nome, contato, formato, dataCasamento, mensagem: b.mensagem, leadId })

  // Apanha o horário só se ainda estiver livre: sai da disponibilidade para mais ninguém o marcar
  const { data: slot } = await sb.from('preparacao_slots').delete()
    .eq('id', b.slotId).eq('tipo', 'preparacao').is('evento_id', null).gte('data', amanha())
    .select('data, hora').maybeSingle()
  if (!slot) return NextResponse.json({ error: 'Esse horário acabou de ser escolhido. Escolham outro, por favor.' }, { status: 409 })
  const hora = String(slot.hora).slice(0, 5)
  const link = formato === 'Videochamada' ? MEET_LINK : MAPS_LINK

  const reuniao = { status: 'Reunião Agendada', reuniao_data: slot.data, reuniao_hora: hora, reuniao_tipo: formato, reuniao_link: link }
  const { data: lead, error } = leadId
    ? await sb.from('crm_contacts').update(reuniao).eq('id', leadId).select('id').single()
    : await sb.from('crm_contacts').insert({
      nome,
      contato,
      data_casamento:  dataCasamento,
      tipo_evento:     'Casamento',
      como_chegou:     'Rollup',
      mensagem:        'Marcou a reunião pelo QR do rollup.',
      ...reuniao,
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
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Reunião marcada pelo ${leadId ? 'link do WhatsApp' : 'rollup'}</td></tr>
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
        subject: `Reunião marcada (${leadId ? 'WhatsApp' : 'rollup'}): ${nome} (${quando})`, html,
      }),
    })
  } catch { /* a marcação fica feita na mesma */ }

  return NextResponse.json({ ok: true, reserva: { data: slot.data, hora, formato, link } })
}

/* "Outro horário": guarda a lead com as opções pedidas; só fica marcado quando a RL confirmar. */
async function pedirOutroHorario(pedido: unknown, l: { nome: string; contato: string; formato: string; dataCasamento: string; mensagem: unknown; leadId: string | null }) {
  const r = validarPedido(pedido, null)
  if ('erro' in r) return NextResponse.json({ error: r.erro }, { status: 400 })
  const opcoes = r.opcoes
  const msg = typeof l.mensagem === 'string' && l.mensagem.trim() ? l.mensagem.trim().slice(0, 500) : null
  const linhas = opcoes.map((o, i) => `Opção ${i + 1}: ${fmtDataLonga(o.data)} às ${o.hora}`)

  // Lead que já existe (link do WhatsApp): as opções ficam como próxima ação para hoje
  const { data: lead, error } = l.leadId
    ? await sbAdmin().from('crm_contacts').update({
      proxima_acao:      [`Confirmar reunião (${l.formato}): ${linhas.join(' / ')}`, msg ? `Mensagem: ${msg}` : ''].filter(Boolean).join('. ').slice(0, 500),
      proxima_acao_data: hojeLisboa(),
    }).eq('id', l.leadId).select('id').single()
    : await sbAdmin().from('crm_contacts').insert({
    nome:            l.nome,
    contato:         l.contato,
    data_casamento:  l.dataCasamento,
    tipo_evento:     'Casamento',
    como_chegou:     'Rollup',
    mensagem:        [`Pediu reunião pelo QR do rollup (${l.formato}), a confirmar:`, ...linhas, msg ? `\nMensagem: ${msg}` : ''].filter(Boolean).join('\n'),
    status:          'Por Contactar',
    lead_prioridade: qualificarLead('', l.dataCasamento),
    data_entrada:    hojeLisboa(),
  }).select('id').single()
  if (error || !lead) return NextResponse.json({ error: 'Não foi possível enviar o pedido. Tentem outra vez ou falem connosco pelo WhatsApp.' }, { status: 500 })

  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 12px"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px">
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Pedido de reunião (${l.leadId ? 'WhatsApp' : 'rollup'}) · aguarda confirmação</td></tr>
<tr><td style="padding:4px 32px 0;color:#fff;font-size:28px">${esc(l.nome)}</td></tr>
<tr><td style="padding:18px 32px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.8;font-family:Arial,sans-serif">
${opcoes.map((o, i) => `<b style="color:#fff">Opção ${i + 1}:</b> ${esc(fmtDataLonga(o.data))} às ${esc(o.hora)}`).join('<br/>')}<br/>
${l.formato} · Telefone: ${esc(l.contato)}<br/>
Casamento: ${l.dataCasamento ? esc(fmtDataLonga(l.dataCasamento)) : 'data por definir'}
${msg ? `<div style="margin:14px 0 4px;padding:12px 14px;border-left:2px solid #C9A84C;background:rgba(255,255,255,.04);color:#fff;font-style:italic;white-space:pre-wrap">${esc(msg)}</div>` : '<br/>'}
<span style="color:rgba(255,255,255,.45);font-size:13px">Marca a reunião na ficha CRM ou no calendário e avisa-os pelo WhatsApp.</span></td></tr>
<tr><td style="padding:0 32px 30px"><a href="${SITE_BASE}/crm/${lead.id}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha CRM</a></td></tr>
</table></td></tr></table></body></html>`
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
        subject: `Pedido de reunião (${l.leadId ? 'WhatsApp' : 'rollup'}, confirmar): ${l.nome}`, html,
      }),
    })
  } catch { /* o pedido fica guardado na mesma */ }

  return NextResponse.json({ ok: true, pedido: { opcoes, formato: l.formato } })
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!))
}
