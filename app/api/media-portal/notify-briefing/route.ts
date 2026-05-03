import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, ref, nomeProjeto, cliente, sessaoTitulo, sessaoData } = await req.json()

  if (!to) return NextResponse.json({ ok: false, error: 'Email do cliente em falta' }, { status: 400 })

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,Helvetica,sans-serif;">

<!--
  OUTER WRAPPER — dark background + neon blue grid
  Grid is built with nested tables (100% email-client compatible)
-->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#020810;min-height:100vh;">
<tr><td align="center" style="padding:0;">

  <!-- Outer wrapper — plain dark, no grid -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#020810;padding:56px 16px;">
  <tr><td align="center">

    <!-- CARD — grid lives here -->
    <table width="460" cellpadding="0" cellspacing="0" border="0"
      style="max-width:460px;width:100%;
             background-color:#07101f;
             background-image:
               linear-gradient(rgba(30,80,220,0.13) 1px, transparent 1px),
               linear-gradient(90deg, rgba(30,80,220,0.13) 1px, transparent 1px);
             background-size:44px 44px;
             border:1px solid rgba(40,100,255,0.22);
             border-top:none;">

      <!-- Top neon line (strong blue) -->
      <tr>
        <td height="3"
          style="background:linear-gradient(90deg,#020810,#2563eb,#020810);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Content area -->
      <tr><td style="padding:52px 44px 44px;text-align:center;">

        <!-- RL Media logo — círculo com neon branco suave -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr>
            <td style="width:90px;height:90px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1), inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;padding:0;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-media-branco.png"
                width="58" alt="RL Media"
                style="display:block;margin:16px auto;width:58px;height:auto;
                       mix-blend-mode:screen;opacity:0.95;" />
            </td>
          </tr>
        </table>

        <!-- Thin divider -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
          <tr><td height="1"
            style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- NOVO BRIEFING badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
          <tr><td style="border:1px solid rgba(37,99,235,0.45);
                         background:rgba(37,99,235,0.09);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(96,165,250,0.9);text-transform:uppercase;">
              Novo Briefing
            </p>
          </td></tr>
        </table>

        <!-- Project name -->
        <p style="margin:0 0 3px;font-size:9px;letter-spacing:5px;
                  color:rgba(255,255,255,0.18);text-transform:uppercase;">Projeto</p>
        <p style="margin:0 0 5px;font-size:26px;font-weight:200;letter-spacing:5px;
                  color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
        <p style="margin:0 0 36px;font-size:10px;letter-spacing:3px;
                  color:rgba(255,255,255,0.22);text-transform:uppercase;">${cliente}</p>

        <!-- Session info box -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="border:1px solid rgba(37,99,235,0.2);
                       background:rgba(37,99,235,0.05);
                       padding:18px 22px;text-align:left;">
              <p style="margin:0 0 8px;font-size:8px;letter-spacing:5px;
                        color:rgba(96,165,250,0.6);text-transform:uppercase;">Sessão</p>
              <p style="margin:0 0 4px;font-size:16px;font-weight:300;letter-spacing:2px;
                        color:rgba(255,255,255,0.78);text-transform:uppercase;">${sessaoTitulo}</p>
              ${sessaoData ? `<p style="margin:0;font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.28);">${sessaoData}</p>` : ''}
            </td>
          </tr>
        </table>

        <!-- Message -->
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.42);
                  line-height:1.9;font-weight:300;">
          Foi adicionado um novo registo de briefing ao teu portal de projeto.<br>
          Podes consultar todos os detalhes a qualquer momento.
        </p>

      </td></tr>

      <!-- Bottom neon line -->
      <tr>
        <td height="1"
          style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.35),transparent);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 44px;text-align:center;background:#040c1c;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;
                    color:rgba(255,255,255,0.1);text-transform:uppercase;">
            RL Media &middot; Audiovisual &middot; rlmedia.pt
          </p>
        </td>
      </tr>

    </table>
    <!-- /CARD -->

  </td></tr>
  </table>
  <!-- /Grid overlay -->

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
