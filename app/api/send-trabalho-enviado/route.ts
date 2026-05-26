import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'

const TIPO_LABELS: Record<string, string> = {
  selecao:  'Seleção de Fotos',
  provas:   'Fotos Prova',
  editadas: 'Fotos Editadas',
  album:    'Maquete Álbum',
}

const TIPO_ICONS: Record<string, string> = {
  selecao:  '◫',
  provas:   '◧',
  editadas: '✓',
  album:    '◐',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      tipo,
      url,
      freelancer_nome,
      casamento_local,
      casamento_data,
      casamento_id,
    } = body as {
      tipo: 'selecao' | 'provas' | 'editadas' | 'album'
      url: string
      freelancer_nome: string
      casamento_local: string
      casamento_data: string
      casamento_id: string
    }

    if (!tipo || !url) {
      return NextResponse.json({ error: 'tipo e url são obrigatórios' }, { status: 400 })
    }

    const label = TIPO_LABELS[tipo] ?? tipo
    const icon = TIPO_ICONS[tipo] ?? '◆'
    const nomes = casamento_local || 'Casamento'
    const dataFmt = casamento_data
      ? new Date(casamento_data + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—'
    const sentAt = new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
        <tr>
          <td style="padding:48px 40px;text-align:center;">

            <!-- Eyebrow -->
            <p style="margin:0 0 16px;font-size:10px;letter-spacing:0.5em;color:#8a7450;text-transform:uppercase;font-family:Arial,sans-serif;">
              Notificação do Freelancer
            </p>

            <!-- Icon -->
            <div style="display:inline-block;width:60px;height:60px;line-height:60px;text-align:center;border:1px solid #c9a96e;border-radius:50%;color:#c9a96e;font-size:28px;margin:0 0 24px;">
              ${icon}
            </div>

            <!-- Heading -->
            <h1 style="margin:0;font-size:32px;font-weight:400;color:#ffffff;line-height:1.2;letter-spacing:-0.01em;">
              Trabalho
            </h1>
            <h1 style="margin:0 0 24px;font-size:32px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
              Enviado
            </h1>

            <!-- Divider -->
            <div style="margin:0 auto 32px;width:60px;height:1px;background:#7a6340;"></div>

            <!-- Freelancer name -->
            <p style="margin:0 0 8px;font-size:13px;color:#b0a080;letter-spacing:0.05em;">
              <strong style="color:#ffffff;">${freelancer_nome || 'O freelancer'}</strong> acabou de enviar:
            </p>

            <!-- Tipo de trabalho -->
            <p style="margin:0 0 32px;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
              ${label}
            </p>

            <!-- Card de detalhes -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;border:1px solid #4a3a1e;background:#0e0b06;width:100%;max-width:440px;">
              <tr>
                <td style="padding:24px;text-align:left;font-family:Arial,sans-serif;">
                  <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.35em;color:#7a6340;text-transform:uppercase;">Casamento</p>
                  <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:600;">${nomes}</p>

                  <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.35em;color:#7a6340;text-transform:uppercase;">Data do Evento</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#d4c9b0;">${dataFmt}</p>

                  <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.35em;color:#7a6340;text-transform:uppercase;">Enviado em</p>
                  <p style="margin:0;font-size:14px;color:#d4c9b0;">${sentAt}</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-size:11px;letter-spacing:0.3em;font-weight:600;text-transform:uppercase;font-family:Arial,sans-serif;">
              Abrir Trabalho &rarr;
            </a>

            <!-- URL fallback -->
            <p style="margin:24px 0 0;font-size:11px;color:#7a6340;word-break:break-all;font-family:Arial,sans-serif;">
              ${url}
            </p>

          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #4a3a1e;text-align:center;font-family:Arial,sans-serif;">
            <p style="margin:0;font-size:9px;letter-spacing:0.3em;color:#5a4a30;text-transform:uppercase;">
              RL Photo.Video &middot; Notificação Admin
            </p>
          </td>
        </tr>
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
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [ADMIN_EMAIL],
        subject: `${icon} Trabalho enviado: ${label} — ${nomes}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.message ?? 'Falha ao enviar email' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sentAt: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
