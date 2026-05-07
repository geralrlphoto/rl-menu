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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
          <td></td>
          <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
        </tr></table></td></tr>
        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL Photo Video" style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;">🕊</span>
          </td></tr></table>
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Ol&aacute;, Ana!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">O vosso pedido</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">foi recebido.</p>
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Servi&ccedil;o</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:400;color:#c9a96e;line-height:1.3;">Batizado — Fotografia &amp; V&iacute;deo [TESTE]</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;width:60%;border-top:0.5px solid #3a2a12;"><tr><td></td></tr></table>
              <p style="margin:0;font-size:13px;color:#d4c9b0;line-height:1.7;">Recebemos a vossa mensagem e<br>entraremos em contacto muito em breve.</p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
            <td style="background:rgba(201,169,110,0.08);border:0.5px solid #6a5430;">
              <a href="https://www.rlprod.pt" style="display:block;padding:16px 44px;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-decoration:none;text-transform:uppercase;white-space:nowrap;font-family:Georgia,'Times New Roman',serif;">
                Ver Portef&oacute;lio &rarr;
              </a>
            </td>
          </tr></table>
          <p style="margin:0;font-size:13px;color:#7a6340;line-height:1.8;">Mal podemos esperar para eternizar<br>este momento especial convosco.</p>
        </td></tr>
        <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
          <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
            <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">RL PHOTO &middot; VIDEO</p>
          </td>
          <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
        </tr></table></td></tr>
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
