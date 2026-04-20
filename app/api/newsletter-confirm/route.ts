import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsletter.rlphotovideo.pt'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/newsletter/erro?msg=token-invalido`)
  }

  const { data: subscriber, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id, email, status')
    .eq('confirmation_token', token)
    .maybeSingle()

  if (error || !subscriber) {
    return NextResponse.redirect(`${baseUrl}/newsletter/erro?msg=token-invalido`)
  }

  if (subscriber.status === 'active') {
    return NextResponse.redirect(`${baseUrl}/newsletter/confirmado?status=already`)
  }

  await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      status: 'active',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id)

  // Enviar email de boas-vindas
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [subscriber.email],
      subject: 'Bem-vindo à nossa newsletter',
      html: buildWelcomeEmail(),
    }),
  })

  return NextResponse.redirect(`${baseUrl}/newsletter/confirmado`)
}

function buildWelcomeEmail() {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px;font-family:Georgia,serif;text-align:center;">
              <div style="margin:0 0 28px;display:inline-block;width:64px;height:64px;border-radius:50%;border:1px solid #7a6340;line-height:64px;">
                <span style="font-size:20px;font-style:italic;color:#c9a96e;">RL</span>
              </div>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;color:#fff;line-height:1.15;">
                Bem-vindo<br><em style="color:#c9a96e;">à nossa comunidade</em>
              </h1>
              <p style="margin:24px 0;font-size:15px;line-height:1.7;color:#b3a082;font-family:Arial,sans-serif;">
                Obrigado por confirmares a tua subscrição.<br>
                Em breve receberás a nossa primeira newsletter com dicas, tendências e inspiração para o teu grande dia.
              </p>
              <a href="https://rlphotovideo.pt" style="display:inline-block;margin-top:20px;padding:16px 44px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;">
                Visitar Website
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
