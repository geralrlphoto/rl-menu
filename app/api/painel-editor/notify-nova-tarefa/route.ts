import { NextRequest, NextResponse } from 'next/server'

type Body = {
  to: string
  freelancerNome?: string
  titulo: string
  descricao?: string
  projeto?: string          // nome do casal/projeto (opcional)
  prazo: string             // dd/mm/yyyy
  hora?: string             // HH:mm
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status?: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, freelancerNome, titulo, descricao, projeto, prazo, hora, prioridade, status } = body

  if (!to || !titulo || !prazo || !prioridade) {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios (to, titulo, prazo, prioridade)' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  // Cores por prioridade
  const cor =
    prioridade === 'Alta'  ? { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.45)', text: '#fca5a5' } :
    prioridade === 'Média' ? { bg: 'rgba(250,204,21,0.18)', border: 'rgba(250,204,21,0.45)', text: '#fde047' } :
                             { bg: 'rgba(52,211,153,0.18)', border: 'rgba(52,211,153,0.45)', text: '#6ee7b7' }

  const portalUrl = 'https://rl-menu-lake.vercel.app/painel-editor/tarefas'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#0a0a12;border:1px solid rgba(201,164,92,0.18);">

        <!-- Top gold line -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(201,164,92,0.6),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:44px 44px 36px;text-align:center;">

          <!-- Logo -->
          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="80" alt="RL PROD"
            style="display:block;margin:0 auto 28px;width:80px;height:80px;object-fit:contain;" />

          <!-- Label -->
          <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;color:rgba(201,164,92,0.6);text-transform:uppercase;font-family:Arial,sans-serif;">Painel Editor</p>

          <!-- Divider -->
          <table cellpadding="0" cellspacing="0" style="margin:14px auto 22px;width:40px;"><tr><td height="1" style="background:rgba(201,164,92,0.4);font-size:0;line-height:0;">&nbsp;</td></tr></table>

          <!-- Title -->
          <p style="margin:0 0 24px;font-size:30px;font-weight:300;letter-spacing:2px;color:rgba(255,255,255,0.95);font-family:Georgia,serif;">
            Nova <span style="color:#C9A45C;font-style:italic;">Tarefa</span>
          </p>

          ${freelancerNome ? `<p style="margin:0 0 28px;font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">Olá <span style="color:#C9A45C;">${escapeHtml(freelancerNome)}</span>,</p>` : ''}

          <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;font-family:Arial,sans-serif;font-weight:300;">
            Foi-te atribuída uma nova tarefa.
          </p>

          <!-- Card detail -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;width:100%;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
            <tr><td style="padding:22px 24px;text-align:left;">

              <!-- Priority badge -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
                <tr><td style="background:${cor.bg};border:1px solid ${cor.border};padding:5px 12px;font-size:9px;letter-spacing:3px;color:${cor.text};text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">
                  ${escapeHtml(prioridade)} Prioridade
                </td></tr>
              </table>

              <!-- Title -->
              <p style="margin:0 0 8px;font-size:18px;font-weight:400;color:rgba(255,255,255,0.95);font-family:Georgia,serif;">
                ${escapeHtml(titulo)}
              </p>

              ${descricao ? `<p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;font-family:Arial,sans-serif;">${escapeHtml(descricao)}</p>` : ''}

              <!-- Meta rows -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0 0;">
                ${projeto ? metaRow('Projeto', projeto) : ''}
                ${metaRow('Prazo', `${prazo}${hora ? ` · ${hora}` : ''}`)}
                ${status ? metaRow('Estado', status) : ''}
              </table>

            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:8px auto 12px;width:100%;">
            <tr><td style="border:1px solid rgba(201,164,92,0.45);background:rgba(201,164,92,0.08);text-align:center;">
              <a href="${portalUrl}"
                style="display:block;padding:15px 32px;font-size:10px;letter-spacing:5px;color:#C9A45C;text-decoration:none;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:600;">
                Abrir Painel de Tarefas &rarr;
              </a>
            </td></tr>
          </table>

          <!-- URL hint -->
          <p style="margin:14px 0 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.12);font-family:monospace;">
            rl-menu-lake.vercel.app/painel-editor/tarefas
          </p>

        </td></tr>

        <!-- Bottom line -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(201,164,92,0.3),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 44px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;font-family:Arial,sans-serif;">
            RL PROD &middot; Wedding Moments Films &middot; Notificação Admin
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
      to: [to],
      subject: `Nova Tarefa: ${titulo}`,
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

function metaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;font-family:Arial,sans-serif;width:80px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`
}
