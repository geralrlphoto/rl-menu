import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const PORTAL_BASE = 'https://rl-menu-lake.vercel.app/freelancer-view'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function buildHtml(nome: string, titulo: string, mensagem: string | null, portalUrl: string): string {
  const bodyText = mensagem
    ? mensagem
    : 'Existe uma <strong style="color:#c9b88a;font-weight:600;">atualização no teu portal</strong><br>que requer a tua atenção.<br>Consulta para ficares a par de tudo.'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Corner ornaments top -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 48px 52px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="${IMG_BASE}/logo_rl_gold.png" width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 20px;width:80px;height:auto;opacity:0.9;" />

          <!-- EQUIPA RL -->
          <p style="margin:0 0 28px;font-size:9px;letter-spacing:0.48em;color:#7a6340;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">
            EQUIPA RL
          </p>

          <!-- Bell in circle -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:54px;height:54px;border-radius:50%;border:1.5px solid #c9a96e;">
            <tr><td align="center" valign="middle" style="width:54px;height:54px;">
              <span style="font-size:22px;color:#c9a96e;line-height:1;">&#x1F514;</span>
            </td></tr>
          </table>

          <!-- Tens uma -->
          <p style="margin:0;font-size:44px;font-weight:400;color:#f0e8d8;line-height:1.1;font-family:Georgia,'Times New Roman',serif;">
            Tens uma
          </p>
          <!-- titulo -->
          <p style="margin:0 0 32px;font-size:44px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">
            ${titulo}.
          </p>

          <!-- Divider -->
          <div style="margin:0 0 32px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">
            &#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;
          </div>

          <!-- Body text -->
          <p style="margin:0 0 36px;font-size:15px;color:#a09070;line-height:1.85;text-align:center;font-family:Georgia,'Times New Roman',serif;">
            ${bodyText}
          </p>

          <!-- CTA -->
          <a href="${portalUrl}"
            style="display:inline-block;border:0.5px solid #6a5430;padding:16px 44px;text-decoration:none;font-size:10px;letter-spacing:0.35em;color:#c9a96e;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">
            Ver Portal
          </a>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
              <td style="padding:0 20px 16px;vertical-align:bottom;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:left;">
                      <p style="margin:0;font-size:8px;letter-spacing:0.38em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">RL PHOTO &middot; VIDEO</p>
                    </td>
                    <td style="text-align:right;">
                      <p style="margin:0;font-size:8px;letter-spacing:0.3em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Notifica&ccedil;&atilde;o Equipa</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const { freelancer_id, titulo, mensagem } = await req.json().catch(() => ({}))

  if (!freelancer_id || !titulo) {
    return NextResponse.json({ error: 'freelancer_id e titulo são obrigatórios' }, { status: 400 })
  }

  const { data: freelancer, error } = await supabase()
    .from('freelancers')
    .select('id, nome, email')
    .eq('id', freelancer_id)
    .single()

  if (error || !freelancer?.email) {
    return NextResponse.json({ error: 'Freelancer não encontrado ou sem email' }, { status: 404 })
  }

  const portalUrl = `${PORTAL_BASE}/${freelancer_id}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [freelancer.email],
      subject: `Nova notificação — ${titulo}`,
      html: buildHtml(freelancer.nome ?? '', titulo, mensagem ?? null, portalUrl),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-notif-freelancer-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
