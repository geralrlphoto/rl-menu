import { NextResponse } from 'next/server'

// GET /api/test-batizado-email
// Testa o envio de email de batizado e devolve a resposta real do Resend
export async function GET() {
  const RESEND_HEADERS = {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const results: Record<string, unknown> = {}

  // ── 1. Notificação admin ──────────────────────────────────────────────
  const adminRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: RESEND_HEADERS,
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: ['geral.rlphoto@gmail.com'],
      subject: '🕊 [TESTE] Batizado — Ana e João',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
          <div style="background:#0a0a0f;padding:24px 28px;">
            <p style="margin:0;font-size:10px;letter-spacing:0.4em;color:#aaa;text-transform:uppercase;">RL Photo.Video · Batizados</p>
            <h1 style="margin:8px 0 0;font-size:20px;font-weight:300;letter-spacing:0.2em;color:#fff;text-transform:uppercase;">Teste — Novo Batizado</h1>
          </div>
          <div style="background:#f9f9f9;padding:28px;">
            <p style="font-size:13px;line-height:1.8;color:#333;">
              <b>Nome:</b> Ana e João<br><br>
              <b>Email:</b> teste@exemplo.com<br><br>
              <b>Tipo de Serviço:</b> Batizado — Fotografia &amp; Vídeo<br><br>
              <b>Mensagem:</b> Este é um teste de envio.
            </p>
          </div>
          <div style="background:#0a0a0f;padding:14px 28px;">
            <p style="margin:0;font-size:10px;color:#555;letter-spacing:0.2em;">RL Photo.Video CRM · Notificação de TESTE</p>
          </div>
        </div>
      `,
    }),
  })
  const adminData = await adminRes.json()
  results.admin = { status: adminRes.status, ok: adminRes.ok, body: adminData }

  // ── 2. Card cliente (dourado) ─────────────────────────────────────────
  const clientRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: RESEND_HEADERS,
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: ['geral.rlphoto@gmail.com'],
      subject: 'RL Photo.Video — [TESTE] Recebemos o vosso pedido, Ana',
      html: `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Montserrat:wght@300;400&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0c0907;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;">
<tr><td align="center" style="padding:32px 16px 48px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0"
    style="max-width:560px;width:100%;background:#13100c;border:1px solid rgba(201,168,76,0.18);overflow:hidden;">
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:44px 40px 32px;">
      <img src="https://rl-menu-lake.vercel.app/logo-rl-prod-branco.png" alt="RL Photo.Video"
        width="72" style="display:block;margin:0 auto 16px;width:72px;height:auto;" />
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:5px;color:#c9a84c;text-transform:uppercase;">RL PHOTO &amp; VIDEO · TESTE</p>
    </td></tr>
    <tr><td style="padding:44px 48px 40px;">
      <p style="margin:0 0 20px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">Pedido Recebido</p>
      <h1 style="margin:0 0 20px;font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:300;color:#f5f0e8;">
        Obrigado pelo<br><em style="font-style:italic;color:#c9a84c;">vosso contacto</em>
      </h1>
      <p style="margin:0 0 32px;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:300;font-style:italic;color:#c9a84c;">Ana</p>
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:300;line-height:1.8;color:#7a6a55;">Este é um email de teste. Se estás a receber isto, os emails estão a funcionar!</p>
    </td></tr>
    <tr><td style="padding:22px 48px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(201,168,76,0.08);">
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#4a3d2a;text-transform:uppercase;text-align:center;">RL Photo.Video &nbsp;&middot;&nbsp; www.rlprod.pt</p>
    </td></tr>
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.55),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`,
    }),
  })
  const clientData = await clientRes.json()
  results.client_card = { status: clientRes.status, ok: clientRes.ok, body: clientData }

  // ── Diagnóstico ───────────────────────────────────────────────────────
  results.resend_key_present = !!process.env.RESEND_API_KEY
  results.resend_key_prefix = process.env.RESEND_API_KEY?.slice(0, 8) + '...'

  return NextResponse.json(results, { status: 200 })
}
