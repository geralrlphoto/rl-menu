import { NextRequest, NextResponse } from 'next/server'

type Body = {
  // Dados da tarefa original
  titulo: string
  projeto?: string
  prazo: string
  prioridade: 'Alta' | 'Média' | 'Baixa'
  // Resposta do freelancer
  freelancerNome: string
  freelancerEmail: string
  resposta: string
  novoStatus: 'Aguardar' | 'Resolvido'
  // Para onde enviar (email do admin / quem criou a tarefa)
  adminEmail: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { titulo, projeto, prazo, prioridade, freelancerNome, freelancerEmail, resposta, novoStatus, adminEmail } = body

  if (!titulo || !resposta || !novoStatus || !adminEmail) {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios' }, { status: 400 })
  }
  if (novoStatus === 'Resolvido' && resposta.trim().length === 0) {
    return NextResponse.json({ ok: false, error: 'Não é possível marcar como Resolvido sem resposta.' }, { status: 400 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  // Cores por estado da resposta
  const corStatus = novoStatus === 'Resolvido'
    ? { bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.45)', text: '#6ee7b7' }
    : { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.45)', text: '#fde047' }

  const corPrioridade =
    prioridade === 'Alta'  ? { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.45)', text: '#fca5a5' } :
    prioridade === 'Média' ? { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.45)', text: '#fde047' } :
                             { bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.45)', text: '#6ee7b7' }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#0a0a12;border:1px solid rgba(201,164,92,0.18);">

        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(201,164,92,0.6),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:44px 44px 36px;text-align:center;">

          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="80" alt="RL PROD"
            style="display:block;margin:0 auto 28px;width:80px;height:80px;object-fit:contain;" />

          <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;color:rgba(201,164,92,0.6);text-transform:uppercase;font-family:Arial,sans-serif;">Painel Editor</p>

          <table cellpadding="0" cellspacing="0" style="margin:14px auto 22px;width:40px;"><tr><td height="1" style="background:rgba(201,164,92,0.4);font-size:0;line-height:0;">&nbsp;</td></tr></table>

          <p style="margin:0 0 18px;font-size:28px;font-weight:300;letter-spacing:2px;color:rgba(255,255,255,0.95);font-family:Georgia,serif;">
            Resposta <span style="color:#C9A45C;font-style:italic;">recebida</span>
          </p>

          <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;font-family:Arial,sans-serif;font-weight:300;">
            <span style="color:#C9A45C;">${escapeHtml(freelancerNome)}</span> respondeu à tarefa que enviaste.
          </p>

          <!-- Status badge grande -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="background:${corStatus.bg};border:1px solid ${corStatus.border};padding:8px 22px;font-size:11px;letter-spacing:4px;color:${corStatus.text};text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">
              ${novoStatus === 'Resolvido' ? '✓ ' : '⏳ '}${escapeHtml(novoStatus)}
            </td></tr>
          </table>

          <!-- Card resposta -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;width:100%;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
            <tr><td style="padding:22px 24px;text-align:left;">

              <!-- Tarefa original (resumo) -->
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;font-family:Arial,sans-serif;">Tarefa</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:400;color:rgba(255,255,255,0.95);font-family:Georgia,serif;">
                ${escapeHtml(titulo)}
              </p>

              <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;">
                <tr>
                  <td style="padding:4px 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;font-family:Arial,sans-serif;width:74px;">Prioridade</td>
                  <td style="padding:4px 0;">
                    <span style="display:inline-block;background:${corPrioridade.bg};border:1px solid ${corPrioridade.border};padding:3px 10px;font-size:9px;letter-spacing:2px;color:${corPrioridade.text};text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">${escapeHtml(prioridade)}</span>
                  </td>
                </tr>
                ${projeto ? `<tr><td style="padding:4px 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;font-family:Arial,sans-serif;width:74px;">Projeto</td><td style="padding:4px 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-weight:500;">${escapeHtml(projeto)}</td></tr>` : ''}
                <tr><td style="padding:4px 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;font-family:Arial,sans-serif;width:74px;">Prazo</td><td style="padding:4px 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-weight:500;">${escapeHtml(prazo)}</td></tr>
              </table>

              <!-- Divisor gold -->
              <table cellpadding="0" cellspacing="0" style="margin:6px 0 16px;width:30px;"><tr><td height="1" style="background:rgba(201,164,92,0.4);font-size:0;line-height:0;">&nbsp;</td></tr></table>

              <!-- Resposta do freelancer -->
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:3px;color:rgba(201,164,92,0.6);text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Resposta</p>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.88);line-height:1.7;font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(resposta)}</p>

            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:8px auto 12px;width:100%;">
            <tr><td style="border:1px solid rgba(201,164,92,0.45);background:rgba(201,164,92,0.08);text-align:center;">
              <a href="https://rl-menu-lake.vercel.app/painel-editor/tarefas"
                style="display:block;padding:15px 32px;font-size:10px;letter-spacing:5px;color:#C9A45C;text-decoration:none;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:600;">
                Abrir Painel &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:14px 0 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.18);font-family:Arial,sans-serif;">
            Respondido por ${escapeHtml(freelancerEmail)}
          </p>

        </td></tr>

        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(201,164,92,0.3),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:18px 44px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;font-family:Arial,sans-serif;">
            RL PROD &middot; Wedding Moments Films &middot; Resposta de Tarefa
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: [adminEmail],
      reply_to: freelancerEmail,
      subject: `${novoStatus === 'Resolvido' ? '✓' : '⏳'} ${freelancerNome} respondeu: ${titulo}`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data?.message ?? 'Erro ao enviar email' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
