import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
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
<body style="margin:0;padding:0;background:#130f0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#130f0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;border:1px solid #5a4a2a;background:#130f0a;">
          <tr>
            <td style="padding:52px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo -->
              <div style="margin:0 auto 32px;width:72px;height:72px;border-radius:50%;border:1px solid #7a6340;display:table;">
                <div style="display:table-cell;vertical-align:middle;text-align:center;">
                  <span style="font-size:11px;letter-spacing:0.15em;color:#c9a96e;font-style:italic;">RL</span><br>
                  <span style="font-size:7px;letter-spacing:0.1em;color:#8a7450;text-transform:uppercase;">PHOTO<br>VIDEO</span>
                </div>
              </div>

              <!-- Olá, Rui! -->
              <p style="margin:0 0 8px;font-size:28px;font-style:italic;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

              <!-- Título principal -->
              <p style="margin:0;font-size:34px;font-weight:700;color:#ffffff;line-height:1.2;">Um membro</p>
              <p style="margin:0;font-size:34px;font-weight:700;color:#ffffff;line-height:1.2;">da tua equipa</p>
              <p style="margin:0;font-size:34px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.3;">${confirmou ? 'confirmou a data' : 'está indisponível'}</p>
              <p style="margin:0 0 28px;font-size:34px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.3;">de um evento.</p>

              <!-- Divider -->
              <div style="margin:0 0 28px;color:#7a6340;font-size:13px;letter-spacing:0.3em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

              <!-- Caixa: nome do membro + dados -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:1px solid #7a6340;width:100%;max-width:400px;">
                <tr>
                  <td style="padding:20px 28px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:8px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">${confirmou ? 'Confirmado por' : 'Indisponível'}</p>
                    <p style="margin:0 0 20px;font-size:20px;font-style:italic;color:#c9a96e;">${freelancer_nome}</p>
                    ${referencia ? `<p style="margin:0 0 4px;font-size:8px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;">Referência</p>
                    <p style="margin:0 0 16px;font-size:14px;font-family:monospace;color:#c9a96e;letter-spacing:0.1em;">${referencia}</p>` : ''}
                    ${dataFormatada ? `<p style="margin:0 0 4px;font-size:8px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;">Data do Evento</p>
                    <p style="margin:0 0 16px;font-size:13px;color:#d4c9b0;">${dataFormatada}</p>` : ''}
                    ${local ? `<p style="margin:0 0 4px;font-size:8px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;">Local</p>
                    <p style="margin:0;font-size:13px;color:#d4c9b0;">${local}</p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Texto -->
              <p style="margin:0 0 32px;font-size:14px;color:#c9b88a;line-height:1.75;">
                Consulta o <strong>painel de administração</strong><br>para veres todos os detalhes.
              </p>

              <!-- Botão -->
              <a href="${ADMIN_URL}/eventos-2026"
                style="display:inline-block;padding:14px 40px;border:1px solid #c9a96e;color:#c9a96e;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;letter-spacing:0.05em;text-decoration:none;">
                Painel de Administração
              </a>

              <!-- Footer -->
              <p style="margin:40px 0 0;font-size:9px;letter-spacing:0.4em;color:#5a4a30;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>

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
