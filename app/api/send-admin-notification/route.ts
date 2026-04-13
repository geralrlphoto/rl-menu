import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'geral.rlphotovideo@gmail.com'
const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const ADMIN_URL = 'https://rl-menu-lake.vercel.app'

export async function POST(req: NextRequest) {
  const { tipo, freelancer_nome, referencia, data_evento, local } = await req.json().catch(() => ({}))

  if (!tipo || !freelancer_nome) {
    return NextResponse.json({ error: 'tipo e freelancer_nome são obrigatórios' }, { status: 400 })
  }

  const confirmou = tipo === 'confirmou'
  const dataFormatada = data_evento
    ? new Date(data_evento).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: confirmou
        ? `✓ ${freelancer_nome} confirmou a data — ${referencia ?? ''}`
        : `✕ ${freelancer_nome} está indisponível — ${referencia ?? ''}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0a05;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0a05;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td>
              <img src="${IMG_BASE}/email-confirmacao-data.png"
                width="560" alt="${confirmou ? 'Confirmação de data' : 'Indisponibilidade'}"
                style="display:block;width:100%;max-width:560px;border:0;" />
            </td>
          </tr>
          <!-- Dynamic data section matching the design -->
          <tr>
            <td style="background:#130f0a;padding:0 40px 40px;font-family:Georgia,'Times New Roman',serif;text-align:center;border:1px solid #5a4a2a;border-top:0;">

              <!-- Nome do membro box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:8px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      ${confirmou ? 'Confirmado por' : 'Indisponível'}
                    </p>
                    <p style="margin:0;font-size:18px;font-style:italic;color:#c9a96e;letter-spacing:0.05em;">
                      ${freelancer_nome}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Detalhes do evento -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:100%;max-width:380px;">
                <tr>
                  ${referencia ? `<td style="padding:6px 12px;text-align:left;width:50%;">
                    <p style="margin:0;font-size:8px;letter-spacing:0.3em;color:#8a7450;text-transform:uppercase;margin-bottom:3px;">Referência</p>
                    <p style="margin:0;font-size:13px;font-family:monospace;color:#c9a96e;">${referencia}</p>
                  </td>` : ''}
                  ${dataFormatada ? `<td style="padding:6px 12px;text-align:left;">
                    <p style="margin:0;font-size:8px;letter-spacing:0.3em;color:#8a7450;text-transform:uppercase;margin-bottom:3px;">Data do Evento</p>
                    <p style="margin:0;font-size:13px;color:#d4c9b0;">${dataFormatada}</p>
                  </td>` : ''}
                </tr>
                ${local ? `<tr>
                  <td colspan="2" style="padding:6px 12px;text-align:left;">
                    <p style="margin:0;font-size:8px;letter-spacing:0.3em;color:#8a7450;text-transform:uppercase;margin-bottom:3px;">Local</p>
                    <p style="margin:0;font-size:13px;color:#d4c9b0;">${local}</p>
                  </td>
                </tr>` : ''}
              </table>

              <!-- Link admin -->
              <a href="${ADMIN_URL}/eventos-2026"
                style="display:inline-block;padding:12px 36px;border:1px solid #7a6340;color:#c9a96e;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;letter-spacing:0.05em;text-decoration:none;">
                Ver Painel de Administração
              </a>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data.message ?? JSON.stringify(data) }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
