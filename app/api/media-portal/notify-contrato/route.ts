import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, nomeProjeto, cliente, contratoUrl, portalUrl } = await req.json()

  if (!to) return NextResponse.json({ ok: false, error: 'Email do cliente em falta' }, { status: 400 })

  const verUrl = contratoUrl
    ? `https://rl-menu-lake.vercel.app${contratoUrl}`
    : portalUrl
    ? `https://rl-menu-lake.vercel.app${portalUrl}`
    : null

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

    <table width="460" cellpadding="0" cellspacing="0" border="0"
      style="max-width:460px;width:100%;
             background-color:#0c0a00;
             background-image:
               linear-gradient(rgba(180,140,20,0.08) 1px, transparent 1px),
               linear-gradient(90deg, rgba(180,140,20,0.08) 1px, transparent 1px);
             background-size:44px 44px;
             border:1px solid rgba(200,160,30,0.20);
             border-top:none;">

      <!-- Linha neon topo âmbar -->
      <tr>
        <td height="3"
          style="background:linear-gradient(90deg,#020810,#b45309,#020810);
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
            style="background:linear-gradient(90deg,transparent,rgba(180,140,20,0.45),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
          <tr><td style="border:1px solid rgba(251,191,36,0.40);
                         background:rgba(251,191,36,0.07);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(251,191,36,0.90);text-transform:uppercase;">
              Contrato Disponível
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

        <!-- Mensagem -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="border:1px solid rgba(180,140,20,0.18);
                       background:rgba(180,140,20,0.04);
                       padding:22px 26px;text-align:left;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:300;
                        color:rgba(255,255,255,0.60);line-height:1.8;">
                O seu Contrato de Prestação de Serviços está pronto para consulta.
              </p>
              <p style="margin:0;font-size:13px;font-weight:300;
                        color:rgba(255,255,255,0.30);line-height:1.8;">
                Pode aceder ao documento através do seu portal de cliente,
                na secção <span style="color:rgba(255,255,255,0.55);">Contrato & CPS</span>.
              </p>
            </td>
          </tr>
        </table>

        ${verUrl ? `
        <!-- Botão CTA -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr><td style="border:1px solid rgba(255,255,255,0.22);
                         background:rgba(255,255,255,0.04);
                         text-align:center;">
            <a href="${verUrl}" target="_blank"
              style="display:block;padding:14px 36px;
                     font-size:9px;letter-spacing:6px;
                     color:rgba(255,255,255,0.75);text-transform:uppercase;
                     text-decoration:none;">
              Ver Contrato
            </a>
          </td></tr>
        </table>
        ` : ''}

        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.25);
                  line-height:1.9;font-weight:300;">
          Após leitura, confirme a sua assinatura no documento<br>
          e devolva-o ao endereço indicado.
        </p>

      </td></tr>

      <!-- Linha neon fundo -->
      <tr>
        <td height="1"
          style="background:linear-gradient(90deg,transparent,rgba(180,140,20,0.30),transparent);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 44px;text-align:center;background:#080600;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;
                    color:rgba(255,255,255,0.10);text-transform:uppercase;">
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
      subject: `${nomeProjeto} · O seu contrato está disponível — RL Media`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
