import { NextRequest, NextResponse } from 'next/server'
import { sbAdmin, UUID_RE } from '@/lib/preparacao'
import { limparRespostasNps, NOTA_INDICAR, PERGUNTAS_NPS, tituloSimplesNps, respostaTextoNps, type RespostasNps } from '@/lib/nps'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

// Email ao admin com a resposta ao NPS (mesmo estilo dourado dos outros avisos ao admin)
function emailNps(nome: string, nota: number, respostas: RespostasNps, leadId: string, ind: { nome: string; contacto: string; novaId: string | null }): string {
  const cor = nota >= 9 ? '#c9a96e' : nota >= 7 ? '#a08a5c' : '#ef4444'
  const linhas = PERGUNTAS_NPS.map(p => `
            <tr><td style="padding:10px 0;border-bottom:0.5px solid #2a2014;text-align:left;">
              <p style="margin:0 0 3px;font-size:11px;color:#7a6340;">${esc(tituloSimplesNps(p.titulo))}</p>
              <p style="margin:0;font-size:15px;color:#f0e8d8;line-height:1.5;">${esc(respostaTextoNps(p, respostas[p.id]))}</p>
            </td></tr>`).join('')
  const caixaInd = ind.nome ? `
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #c9a96e;width:100%;background:rgba(201,169,110,0.08);">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;">Noivos indicados</p>
              <p style="margin:0;font-size:20px;font-style:italic;color:#f0e8d8;">${esc(ind.nome)}</p>
              <p style="margin:4px 0 0;font-size:14px;color:#a09070;">${esc(ind.contacto)}</p>
              <p style="margin:12px 0 0;font-size:13px;color:#a09070;line-height:1.6;">Já estão no CRM como lead nova.<br>Se fecharem, oferecer um serviço a ${esc(nome)}.</p>
              ${ind.novaId ? `<a href="https://portal.rlphotovideo.pt/crm/${ind.novaId}" style="display:inline-block;margin-top:12px;font-size:11px;letter-spacing:0.3em;color:#c9a96e;text-transform:uppercase;">Abrir lead nova ›</a>` : ''}
            </td></tr>
          </table>` : ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 48px 40px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png" width="80" alt="RL Photo Video" style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Novo NPS</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">recebido.</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Respondido por</p>
              <p style="margin:0;font-size:26px;font-style:italic;color:#c9a96e;line-height:1.2;">${esc(nome)}</p>
              <p style="margin:16px 0 0;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Recomendação</p>
              <p style="margin:4px 0 0;font-size:44px;color:${cor};line-height:1;">${nota}<span style="font-size:18px;color:#7a6340;"> / 10</span></p>
            </td></tr>
          </table>
          ${caixaInd}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">${linhas}
          </table>
          <a href="https://portal.rlphotovideo.pt/crm/${leadId}" style="display:inline-block;padding:12px 28px;border:0.5px solid #c9a96e;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-decoration:none;">Abrir ficha</a>
          <p style="margin:16px 0 0;"><a href="https://portal.rlphotovideo.pt/crm/nps" style="font-size:11px;letter-spacing:0.3em;color:#7a6340;text-transform:uppercase;">Ver todos os NPS ›</a></p>
          <p style="margin:32px 0 0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Público: recebe o NPS (/nps) só de quem fechou e guarda-o na ficha da lead,
// com os noivos que indicaram (se a nota for alta).

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const leadId = String(body.leadId ?? '').trim()
  const limpo = limparRespostasNps(body.respostas)
  if (!UUID_RE.test(leadId) || !limpo) return NextResponse.json({ error: 'Resposta inválida' }, { status: 400 })
  const { respostas, nota } = limpo

  const indNome = nota >= NOTA_INDICAR ? String(body.indicacao?.nome ?? '').trim().slice(0, 160) : ''
  const indContacto = nota >= NOTA_INDICAR ? String(body.indicacao?.contacto ?? '').trim().slice(0, 160) : ''

  const sb = sbAdmin()
  const { data: lead } = await sb.from('crm_contacts').select('id, nome, status').eq('id', leadId).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })
  if (lead.status !== 'Fechou') return NextResponse.json({ error: 'O NPS é só para noivos que fecharam' }, { status: 403 })

  // Noivos indicados: entram no CRM como lead nova (mesmos valores por defeito do /crm/nova)
  let novaId: string | null = null
  if (indNome && indContacto) {
    const quemIndicou = lead.nome || 'noivos sem nome'
    const { data: nova } = await sb.from('crm_contacts').insert({
      nome: indNome,
      ...(indContacto.includes('@') ? { email: indContacto } : { contato: indContacto }),
      status: 'Por Contactar', lead_prioridade: 'Médio', tipo_evento: 'Casamento',
      data_entrada: new Date().toISOString().split('T')[0],
      como_chegou: 'Indicação',
      notas: `Indicados por ${quemIndicou} no NPS (nota ${nota}/10). Se fecharem, oferecer um serviço a ${quemIndicou}.`,
    }).select('id').single()
    novaId = nova?.id ?? null
    if (nova) await sb.from('crm_status_history').insert({ contact_id: nova.id, evento: `Lead criada por indicação de ${quemIndicou} (NPS)` })
  }

  const { error } = await sb.from('crm_nps').insert({
    contact_id: lead.id, nota, respostas,
    porque: typeof respostas.melhorar === 'string' ? respostas.melhorar : null,
    status_lead: lead.status ?? null,
    indicacao_nome: indNome || null, indicacao_contacto: indContacto || null,
  })
  if (error) return NextResponse.json({ error: 'Não foi possível guardar' }, { status: 500 })
  await sb.from('crm_status_history').insert({
    contact_id: lead.id,
    evento: `NPS recebido: ${nota}/10${indNome || indContacto ? ` · indicaram ${indNome || indContacto}` : ''}`,
  })
  // Aviso por email ao admin (não bloqueia a resposta se falhar)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: `NPS ${nota}/10 · ${(lead.nome || 'Noivos').trim()}${indNome ? ' · indicaram noivos' : ''}`,
      html: emailNps((lead.nome || 'Noivos').trim(), nota, respostas, lead.id, { nome: indNome, contacto: indContacto, novaId }),
    }),
  }).catch(() => {})
  return NextResponse.json({ ok: true })
}
