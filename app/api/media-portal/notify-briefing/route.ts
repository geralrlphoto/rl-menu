import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, ref, nomeProjeto, cliente, sessaoTitulo, sessaoData, resumo } = await req.json()

  if (!to) return NextResponse.json({ ok: false, error: 'Email do cliente em falta' }, { status: 400 })

  const portalUrl = `https://rl-menu-lake.vercel.app/portal-media/${ref}/briefing`

  // Grid SVG encoded for email background
  const gridSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23030810'/%3E%3Cpath d='M40 0L0 0 0 40' fill='none' stroke='%230d1f4a' stroke-width='0.6'/%3E%3C/svg%3E")`

  const resumoHtml = resumo
    ? `<tr><td style="padding:0 40px 32px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td height="1" style="background:rgba(59,130,246,0.12);font-size:0;">&nbsp;</td></tr>
        </table>
        <p style="margin:20px 0 8px;font-size:8px;letter-spacing:5px;color:rgba(59,130,246,0.5);text-transform:uppercase;">Resumo</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.85;font-weight:300;white-space:pre-wrap;">${resumo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </td></tr>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030810;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#030810;background-image:${gridSvg};background-size:40px 40px;padding:48px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="480" cellpadding="0" cellspacing="0"
        style="max-width:480px;width:100%;background:#060c1e;border:1px solid rgba(59,130,246,0.18);">

        <!-- Top neon line -->
        <tr><td height="2" style="background:linear-gradient(90deg,transparent,#3b82f6,transparent);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Logo area -->
        <tr><td style="padding:48px 40px 32px;text-align:center;">

          <!-- RL Media Logo -->
          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="72" alt="RL Media"
            style="display:block;margin:0 auto 28px;width:72px;height:72px;object-fit:contain;opacity:0.9;" />

          <!-- Badge -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr><td style="border:1px solid rgba(59,130,246,0.35);background:rgba(59,130,246,0.07);padding:7px 22px;text-align:center;">
              <p style="margin:0;font-size:8px;letter-spacing:6px;color:rgba(59,130,246,0.85);text-transform:uppercase;">Novo Briefing</p>
            </td></tr>
          </table>

          <!-- Project name -->
          <p style="margin:0 0 4px;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Projeto</p>
          <p style="margin:0 0 4px;font-size:24px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
          <p style="margin:0 0 36px;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.25);text-transform:uppercase;">${cliente}</p>

          <!-- Divider -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
            <tr><td height="1" style="background:linear-gradient(90deg,transparent,rgba(59,130,246,0.25),transparent);font-size:0;">&nbsp;</td></tr>
          </table>

          <!-- Session info box -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
            <tr>
              <td style="border:1px solid rgba(59,130,246,0.15);background:rgba(59,130,246,0.04);padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:8px;letter-spacing:5px;color:rgba(59,130,246,0.55);text-transform:uppercase;">Sessão</p>
                <p style="margin:0;font-size:15px;font-weight:300;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">${sessaoTitulo}</p>
                ${sessaoData ? `<p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.3);">${sessaoData}</p>` : ''}
              </td>
            </tr>
          </table>

          <!-- Message -->
          <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.85;font-weight:300;">
            Foi adicionado um novo registo de briefing ao teu portal de projeto.
          </p>
          <p style="margin:0 0 36px;font-size:13px;color:rgba(255,255,255,0.25);line-height:1.85;font-weight:300;">
            Consulta todos os detalhes e resumo no portal.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 8px;">
            <tr><td style="border:1px solid rgba(59,130,246,0.4);background:rgba(59,130,246,0.08);text-align:center;">
              <a href="${portalUrl}"
                style="display:block;padding:17px 32px;font-size:9px;letter-spacing:7px;color:rgba(59,130,246,0.9);text-decoration:none;text-transform:uppercase;">
                Ver Briefing &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.1);font-family:monospace;">
            rl-menu-lake.vercel.app/portal-media/${ref.toLowerCase()}/briefing
          </p>

        </td></tr>

        ${resumoHtml}

        <!-- Bottom neon line -->
        <tr><td height="1" style="background:linear-gradient(90deg,transparent,rgba(59,130,246,0.3),transparent);font-size:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 40px;text-align:center;background:#040a18;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">
            RL Media &middot; Audiovisual &middot; rlmedia.pt
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
      from: 'RL Media <geral@rlphotovideo.pt>',
      to: [to],
      subject: `${nomeProjeto} · Novo Briefing Adicionado — RL Media`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
