import { NextRequest, NextResponse } from 'next/server'

type Body = {
  to: string
  freelancerNome?: string
  noivos: string
  referencia?: string
  entregaPrevista: string
  diasAtraso: number
  foto?: string
  dataCasamento?: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, freelancerNome, noivos, referencia, entregaPrevista, diasAtraso, foto, dataCasamento } = body

  if (!to || !noivos || !entregaPrevista || typeof diasAtraso !== 'number') {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios' }, { status: 400 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  const portalUrl = 'https://portal.rlphotovideo.pt/painel-editor/novos-projetos'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#0a0a12;border:1px solid rgba(239,68,68,0.35);">

        <!-- Top red line -->
        <tr><td height="2" style="background:linear-gradient(90deg,#050507,rgba(239,68,68,0.7),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:44px 44px 36px;text-align:center;">

          <!-- Logo -->
          <img src="https://portal.rlphotovideo.pt/logo_marca_advocacia__8_-removebg-preview.png"
            width="80" alt="RL PROD"
            style="display:block;margin:0 auto 24px;width:80px;height:80px;object-fit:contain;" />

          <!-- Label vermelho -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
            <tr><td style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);padding:6px 16px;font-size:9px;letter-spacing:4px;color:#fca5a5;text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">
              ⚠ Alerta Crítico
            </td></tr>
          </table>

          <!-- Title -->
          <p style="margin:0 0 12px;font-size:26px;font-weight:300;letter-spacing:1px;color:rgba(255,255,255,0.95);font-family:Georgia,serif;line-height:1.2;">
            Projeto <span style="color:#fca5a5;font-style:italic;">atrasado</span>
          </p>

          ${freelancerNome ? `<p style="margin:0 0 22px;font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">Olá <span style="color:#C9A45C;">${escapeHtml(freelancerNome)}</span>,</p>` : ''}

          <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;font-family:Arial,sans-serif;font-weight:300;">
            Um dos teus projetos passou a data de entrega prevista e ainda não foi marcado como entregue.
          </p>

          <!-- Card projeto -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;width:100%;border:1px solid rgba(239,68,68,0.25);background:rgba(239,68,68,0.04);">
            <tr><td style="padding:22px 24px;text-align:left;">

              ${foto ? `<table cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr><td><img src="${escapeAttr(foto)}" width="60" height="60" alt="" style="display:block;width:60px;height:60px;object-fit:cover;border:1px solid rgba(239,68,68,0.4);" /></td></tr></table>` : ''}

              ${referencia ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:3px;color:rgba(201,164,92,0.6);text-transform:uppercase;font-family:monospace;">${escapeHtml(referencia)}</p>` : ''}

              <p style="margin:0 0 14px;font-size:20px;font-weight:400;color:rgba(255,255,255,0.95);font-family:Georgia,serif;text-transform:uppercase;letter-spacing:2px;">
                ${escapeHtml(noivos)}
              </p>

              <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 8px;">
                ${dataCasamento ? metaRow('Casamento', dataCasamento) : ''}
                ${metaRow('Entrega prevista', entregaPrevista)}
              </table>

              <!-- Divisor vermelho -->
              <table cellpadding="0" cellspacing="0" style="margin:14px 0 14px;width:30px;"><tr><td height="1" style="background:rgba(239,68,68,0.5);font-size:0;line-height:0;">&nbsp;</td></tr></table>

              <!-- Dias atraso BIG -->
              <p style="margin:0;font-size:10px;letter-spacing:3px;color:rgba(252,165,165,0.7);text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Atraso</p>
              <p style="margin:4px 0 0;font-size:36px;font-weight:700;color:#fca5a5;font-family:Georgia,serif;letter-spacing:-1px;line-height:1;">
                ${diasAtraso} <span style="font-size:14px;font-weight:300;color:rgba(252,165,165,0.65);">${diasAtraso === 1 ? 'dia' : 'dias'}</span>
              </p>

            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:8px auto 12px;width:100%;">
            <tr><td style="border:1px solid rgba(201,164,92,0.45);background:rgba(201,164,92,0.08);text-align:center;">
              <a href="${portalUrl}?open=${encodeURIComponent(referencia || noivos)}"
                style="display:block;padding:15px 32px;font-size:10px;letter-spacing:5px;color:#C9A45C;text-decoration:none;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:600;">
                Abrir Projeto &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:14px 0 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.18);font-family:Arial,sans-serif;">
            Marca como Entregue para parar este alerta
          </p>

        </td></tr>

        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(239,68,68,0.3),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:18px 44px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;font-family:Arial,sans-serif;">
            RL PROD &middot; Wedding Moments Films &middot; Alerta Automático
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
      subject: `⚠ Projeto atrasado: ${noivos} (${diasAtraso} dias)`,
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

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function metaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:5px 0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);text-transform:uppercase;font-family:Arial,sans-serif;width:110px;">${escapeHtml(label)}</td>
    <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`
}
