import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, nomeProjeto, cliente, entregas } = await req.json()

  if (!to) return NextResponse.json({ ok: false, error: 'Email do cliente em falta' }, { status: 400 })

  const entregasRows = (entregas ?? []).map((e: { titulo: string; tipo?: string; linkUrl?: string }) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(37,99,235,0.12);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${e.tipo ? `<p style="margin:0 0 2px;font-size:8px;letter-spacing:4px;color:rgba(96,165,250,0.55);text-transform:uppercase;">${e.tipo}</p>` : ''}
              <p style="margin:0;font-size:14px;font-weight:300;letter-spacing:2px;color:rgba(255,255,255,0.75);text-transform:uppercase;">${e.titulo}</p>
            </td>
            ${e.linkUrl ? `
            <td style="text-align:right;white-space:nowrap;">
              <a href="${e.linkUrl}" target="_blank"
                style="display:inline-block;border:1px solid rgba(52,211,153,0.4);
                       background:rgba(52,211,153,0.08);
                       padding:6px 16px;
                       font-size:9px;letter-spacing:4px;
                       color:rgba(52,211,153,0.9);text-transform:uppercase;
                       text-decoration:none;">
                ↓ Download
              </a>
            </td>` : ''}
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#020810;min-height:100vh;">
<tr><td align="center" style="padding:0;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#020810;padding:56px 16px;">
  <tr><td align="center">

    <!-- CARD com grid neon azul -->
    <table width="460" cellpadding="0" cellspacing="0" border="0"
      style="max-width:460px;width:100%;
             background-color:#07101f;
             background-image:
               linear-gradient(rgba(30,80,220,0.13) 1px, transparent 1px),
               linear-gradient(90deg, rgba(30,80,220,0.13) 1px, transparent 1px);
             background-size:44px 44px;
             border:1px solid rgba(40,100,255,0.22);
             border-top:none;">

      <!-- Linha neon topo -->
      <tr>
        <td height="3"
          style="background:linear-gradient(90deg,#020810,#2563eb,#020810);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <tr><td style="padding:52px 44px 44px;text-align:center;">

        <!-- Logo RL Media -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr>
            <td style="width:90px;height:90px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;padding:0;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-media-branco.png"
                width="58" alt="RL Media"
                style="display:block;margin:16px auto;width:58px;height:auto;
                       mix-blend-mode:screen;opacity:0.95;" />
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
          <tr><td height="1"
            style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
          <tr><td style="border:1px solid rgba(52,211,153,0.4);
                         background:rgba(52,211,153,0.07);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(52,211,153,0.9);text-transform:uppercase;">
              Entregas Disponíveis
            </p>
          </td></tr>
        </table>

        <!-- Projeto -->
        <p style="margin:0 0 3px;font-size:9px;letter-spacing:5px;
                  color:rgba(255,255,255,0.18);text-transform:uppercase;">Projeto</p>
        <p style="margin:0 0 5px;font-size:26px;font-weight:200;letter-spacing:5px;
                  color:rgba(255,255,255,0.88);text-transform:uppercase;">${nomeProjeto}</p>
        <p style="margin:0 0 36px;font-size:10px;letter-spacing:3px;
                  color:rgba(255,255,255,0.22);text-transform:uppercase;">${cliente}</p>

        <!-- Lista de entregas -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;text-align:left;">
          <tr>
            <td style="border:1px solid rgba(37,99,235,0.2);
                       background:rgba(37,99,235,0.04);
                       padding:18px 22px;">
              <p style="margin:0 0 14px;font-size:8px;letter-spacing:5px;
                        color:rgba(96,165,250,0.6);text-transform:uppercase;">Ficheiros</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${entregasRows}
              </table>
            </td>
          </tr>
        </table>

        <!-- Mensagem -->
        <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.40);
                  line-height:1.9;font-weight:300;">
          Os teus ficheiros estão prontos para download.<br>
          Clica em cada botão para aceder ao conteúdo.
        </p>

      </td></tr>

      <!-- Linha neon fundo -->
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
      subject: `${nomeProjeto} · As tuas entregas estão disponíveis — RL Media`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
