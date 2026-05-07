import { NextRequest, NextResponse } from 'next/server'

const LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito Bom', 'Excelente']

export async function POST(req: NextRequest) {
  const { nomeProjeto, cliente, ref, nota, comentario } = await req.json()

  if (!nota) return NextResponse.json({ ok: false, error: 'Nota em falta' }, { status: 400 })

  const adminEmail = process.env.ADMIN_EMAIL ?? 'geral.rlmedia@gmail.com'
  const portalUrl  = `https://rl-menu-lake.vercel.app/portal-media/${ref}/satisfacao`

  const stars = [1, 2, 3, 4, 5]
    .map(i => `<span style="font-size:24px;color:${i <= nota ? '#f59e0b' : 'rgba(255,255,255,0.12)'};margin:0 2px;">&#9733;</span>`)
    .join('')

  const notaLabel = LABELS[nota] ?? ''

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

        <!-- Logo RL PROD -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr>
            <td style="width:90px;height:90px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;padding:0;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-prod-branco.png"
                width="58" alt="RL PROD"
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
              Nova Avaliação de Cliente
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

        <!-- Estrelas -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
          <tr><td style="text-align:center;padding:0;">
            ${stars}
          </td></tr>
        </table>
        <p style="margin:0 0 32px;font-size:9px;letter-spacing:5px;
                  color:rgba(251,191,36,0.55);text-transform:uppercase;">${notaLabel}</p>

        ${comentario ? `
        <!-- Comentário -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="border:1px solid rgba(180,140,20,0.18);
                       background:rgba(180,140,20,0.04);
                       padding:22px 26px;text-align:left;">
              <p style="margin:0 0 8px;font-size:8px;letter-spacing:5px;
                        color:rgba(255,255,255,0.20);text-transform:uppercase;">Comentário</p>
              <p style="margin:0;font-size:13px;font-weight:300;font-style:italic;
                        color:rgba(255,255,255,0.50);line-height:1.8;">
                &ldquo;${comentario.replace(/"/g, '&quot;')}&rdquo;
              </p>
            </td>
          </tr>
        </table>
        ` : `
        <!-- Sem comentário -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="border:1px solid rgba(255,255,255,0.06);
                       background:rgba(255,255,255,0.02);
                       padding:18px 26px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:300;
                        color:rgba(255,255,255,0.20);line-height:1.6;">
                O cliente não deixou comentário.
              </p>
            </td>
          </tr>
        </table>
        `}

        <!-- Botão ver portal -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr><td style="border:1px solid rgba(255,255,255,0.22);
                         background:rgba(255,255,255,0.04);
                         text-align:center;">
            <a href="${portalUrl}" target="_blank"
              style="display:block;padding:14px 36px;
                     font-size:9px;letter-spacing:6px;
                     color:rgba(255,255,255,0.75);text-transform:uppercase;
                     text-decoration:none;">
              Ver no Portal
            </a>
          </td></tr>
        </table>

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
            RL PROD &middot; Notificação Interna &middot; Satisfação do Cliente
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
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: [adminEmail],
      subject: `${nomeProjeto} · Nova avaliação de satisfação — ${notaLabel} (${nota}/5)`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

