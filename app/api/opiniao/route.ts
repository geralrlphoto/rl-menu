import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'
import { PERGUNTAS, limparRespostas, respostaTexto, tituloSimples, motivoDasRespostas } from '@/lib/opiniao'

// Público: recebe o formulário /opiniao (casais que não fecharam), envia as
// respostas por email à RL e, quando vem o id da lead, guarda-as no CRM.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const nome = String(body.nome ?? '').trim().slice(0, 120)
  const leadIdBruto = String(body.leadId ?? '').trim()
  const leadId = UUID_RE.test(leadIdBruto) ? leadIdBruto : null
  const respostas = limparRespostas(body.respostas)
  if (!respostas) return NextResponse.json({ error: 'Respostas inválidas' }, { status: 400 })

  // CRM: só se a lead existir
  const sb = sbAdmin()
  let lead: { id: string; nome: string | null; motivo_nao_fechou: string | null } | null = null
  if (leadId) {
    const { data } = await sb.from('crm_contacts').select('id, nome, motivo_nao_fechou').eq('id', leadId).maybeSingle()
    lead = data ?? null
  }
  const quem = nome || lead?.nome || 'Sem nome'

  const linhas = PERGUNTAS.filter(p => respostas[p.id] !== undefined).map(p => `
<tr><td style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08);color:#A69676;font-size:13px;width:45%;vertical-align:top;font-family:Arial,sans-serif">${esc(tituloSimples(p.titulo))}</td>
<td style="padding:12px 0 12px 16px;border-top:1px solid rgba(255,255,255,.08);color:#F3EDE2;font-size:14px;vertical-align:top;font-family:Arial,sans-serif;white-space:pre-wrap">${esc(respostaTexto(p, respostas[p.id]))}</td></tr>`).join('')

  const html = `<!doctype html><html><body style="margin:0;background:#0A0907;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0907;padding:32px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(201,168,76,.35);border-radius:14px;overflow:hidden">
<tr><td style="height:4px;background:linear-gradient(90deg,#C9A84C,#E2C27A,#C9A84C)"></td></tr>
<tr><td style="padding:28px 32px 8px;color:#C9A84C;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif">Opinião de casal que não fechou</td></tr>
<tr><td style="padding:4px 32px 16px;color:#F3EDE2;font-size:28px">${esc(quem)}</td></tr>
<tr><td style="padding:0 32px 20px"><table width="100%" cellpadding="0" cellspacing="0">${linhas}</table></td></tr>
${leadId ? `<tr><td style="padding:0 32px 28px;font-family:Arial,sans-serif;font-size:12px;color:#A69676">Lead: ${esc(leadId)}${lead ? `<br/><br/><a href="${SITE_BASE}/crm/${leadId}" style="display:inline-block;background:#C9A84C;color:#000;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 20px;border-radius:8px">Abrir ficha no CRM</a>` : ' (não encontrada no CRM)'}</td></tr>` : ''}
</table></td></tr></table></body></html>`

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [ADMIN_EMAIL],
      subject: `💬 Opinião de casal que não fechou · ${quem}`, html,
    }),
  }).catch(() => null)
  const emailOk = !!r?.ok

  let crmOk = false
  if (lead) {
    const { error } = await sb.from('crm_opinioes').insert({ contact_id: lead.id, respostas, texto: typeof respostas.sugestao === 'string' ? respostas.sugestao : null })
    crmOk = !error
    if (crmOk) {
      await sb.from('crm_status_history').insert({ contact_id: lead.id, evento: 'Opinião recebida pelo formulário' })
      // Preenche o motivo só quando ainda está vazio (não apaga o que foi escrito à mão)
      const motivo = motivoDasRespostas(respostas)
      if (motivo && !lead.motivo_nao_fechou) await sb.from('crm_contacts').update({ motivo_nao_fechou: motivo }).eq('id', lead.id)
    }
  }

  // Basta um dos dois para a resposta não se perder
  if (!emailOk && !crmOk) return NextResponse.json({ error: 'Não foi possível enviar' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
