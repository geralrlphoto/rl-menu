import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, ref, nome, cliente, tipo } = await req.json()

  const cardUrl = `https://rl-menu-lake.vercel.app/portal-media/${ref}/card`
  const portalUrl = `https://rl-menu-lake.vercel.app/portal-media/${ref}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="420" cellpadding="0" cellspacing="0" style="max-width:420px;width:100%;background:#0a0a12;border:1px solid rgba(255,255,255,0.1);">

        <!-- Top line -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.25),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:48px 48px 40px;text-align:center;">

          <!-- Logo -->
          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="88" alt="RL Media"
            style="display:block;margin:0 auto 32px;width:88px;height:88px;object-fit:contain;" />

          <!-- Label -->
          <p style="margin:0 0 6px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Portal do Cliente</p>

          <!-- Divider -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;width:40px;"><tr><td height="1" style="background:rgba(255,255,255,0.15);font-size:0;line-height:0;">&nbsp;</td></tr></table>

          <!-- Project -->
          <p style="margin:0 0 4px;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.25);text-transform:uppercase;">${tipo ?? 'Produção Audiovisual'}</p>
          <p style="margin:0 0 4px;font-size:26px;font-weight:200;letter-spacing:6px;color:rgba(255,255,255,0.9);text-transform:uppercase;">${nome}</p>
          <p style="margin:0 0 32px;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,0.3);text-transform:uppercase;">${cliente}</p>

          <!-- Body text -->
          <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.8;font-weight:300;">
            O teu portal de projeto está pronto.
          </p>
          <p style="margin:0 0 36px;font-size:12px;color:rgba(255,255,255,0.25);line-height:1.9;font-weight:300;">
            Aqui podes acompanhar em tempo real todas as fases,<br>
            timings, pagamentos e entregas do teu projeto.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;width:100%;">
            <tr><td style="border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);text-align:center;">
              <a href="${portalUrl}"
                style="display:block;padding:16px 32px;font-size:10px;letter-spacing:6px;color:rgba(255,255,255,0.7);text-decoration:none;text-transform:uppercase;">
                Aceder ao Portal &rarr;
              </a>
            </td></tr>
          </table>

          <!-- URL hint -->
          <p style="margin:0;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.12);font-family:monospace;">
            rlmedia.pt/portal-media/${ref.toLowerCase()}
          </p>

        </td></tr>

        <!-- Bottom line -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.1),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 48px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;">
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
      subject: `${nome} · Portal do Cliente — RL Media`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
