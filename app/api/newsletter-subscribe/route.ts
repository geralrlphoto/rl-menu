import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, nome, data_casamento, source } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Upsert: se já existe, atualiza; senão cria
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, confirmation_token')
      .eq('email', emailLower)
      .maybeSingle()

    let subscriber
    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ ok: true, message: 'Já estás subscrito!' })
      }
      if (existing.status === 'unsubscribed') {
        // Re-ativar: gera novo token e envia novo email de confirmação
        const { data } = await supabaseAdmin
          .from('newsletter_subscribers')
          .update({ status: 'pending', nome, data_casamento, source })
          .eq('id', existing.id)
          .select('id, confirmation_token, email')
          .single()
        subscriber = data
      } else {
        subscriber = { ...existing, email: emailLower }
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .insert({
          email: emailLower,
          nome: nome || null,
          data_casamento: data_casamento || null,
          source: source || 'landing',
          status: 'pending',
        })
        .select('id, confirmation_token, email')
        .single()

      if (error) throw error
      subscriber = data
    }

    // Enviar email de confirmação (double opt-in)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://newsletter.rlphotovideo.pt'
    const confirmUrl = `${baseUrl}/api/newsletter-confirm?token=${subscriber.confirmation_token}`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [emailLower],
        subject: 'Confirma a tua subscrição',
        html: buildConfirmEmail({ nome, confirmUrl }),
      }),
    })

    return NextResponse.json({
      ok: true,
      message: 'Verifica o teu email para confirmares a subscrição.'
    })
  } catch (err: any) {
    console.error('[newsletter-subscribe]', err)
    return NextResponse.json({ error: err.message || 'Erro ao subscrever' }, { status: 500 })
  }
}

function buildConfirmEmail({ nome, confirmUrl }: { nome?: string; confirmUrl: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
              <div style="margin:0 0 28px;display:inline-block;width:64px;height:64px;border-radius:50%;border:1px solid #7a6340;line-height:64px;text-align:center;">
                <span style="font-size:20px;font-style:italic;color:#c9a96e;">RL</span>
              </div>
              <p style="margin:0 0 20px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;font-family:Arial,sans-serif;">
                CONFIRMA A TUA SUBSCRIÇÃO
              </p>
              <h1 style="margin:0 0 8px;font-size:38px;font-weight:400;color:#ffffff;line-height:1.15;">
                Quase lá${nome ? `,<br><em style="color:#c9a96e;">${escapeHtml(nome)}</em>` : ''}
              </h1>
              <p style="margin:24px 0 32px;font-size:15px;line-height:1.7;color:#b3a082;font-family:Arial,sans-serif;">
                Obrigado por te juntares à nossa comunidade.<br>
                Clica no botão abaixo para confirmares a tua subscrição.
              </p>
              <a href="${confirmUrl}" style="display:inline-block;padding:16px 44px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;">
                Confirmar Subscrição
              </a>
              <p style="margin:40px 0 0;font-size:11px;color:#6a5a3e;font-family:Arial,sans-serif;line-height:1.6;">
                Se não foste tu que subscreveste, ignora este email.<br>
                Não serás adicionado à nossa lista sem a tua confirmação.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:10px;color:#4a3f28;font-family:Arial,sans-serif;letter-spacing:0.15em;">
          RL PHOTO & VIDEO &middot; rlphotovideo.pt
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
