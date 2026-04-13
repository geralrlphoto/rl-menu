import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const ADMIN_URL = 'https://rl-menu-lake.vercel.app'

function buildAlbumAprovadoEmail(nome_noivos: string, referencia: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Corner ornaments (top) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <!-- Check circle -->
          <div style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;display:flex;align-items:center;justify-content:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
              <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
            </td></tr></table>
          </div>

          <!-- Olá, Rui! -->
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

          <!-- Título principal -->
          <p style="margin:0;font-size:42px;font-weight:400;color:#f0e8d8;line-height:1.1;">Maquete do álbum</p>
          <p style="margin:0 0 24px;font-size:42px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">aprovada.</p>

          <!-- Divider -->
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <!-- Texto -->
          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            Os noivos <strong style="color:#c9b88a;font-weight:600;">aprovaram a maquete</strong><br>do álbum de casamento.
          </p>

          <!-- Caixa: nome dos noivos -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Aprovado por</p>
              <p style="margin:0;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${nome_noivos}</p>
              ${referencia ? `<p style="margin:8px 0 0;font-size:10px;letter-spacing:0.3em;color:#5a4a28;text-transform:uppercase;">${referencia}</p>` : ''}
            </td></tr>
          </table>

          <!-- CTA -->
          <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
            Podes avançar com a <strong style="color:#c9b88a;font-weight:500;">produção do álbum.</strong>
          </p>

        </td></tr>

        <!-- Corner ornaments (bottom) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const { tipo, freelancer_nome, nome_noivos, referencia, data_evento, local } = await req.json().catch(() => ({}))

  // ── Album aprovado ────────────────────────────────────────────────────────
  if (tipo === 'album_aprovado') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [ADMIN_EMAIL],
        subject: `✓ Maquete aprovada — ${nome_noivos ?? referencia ?? ''}`,
        html: buildAlbumAprovadoEmail(nome_noivos ?? referencia ?? 'Noivos', referencia ?? ''),
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ ok: false, error: data.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  }

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
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

          <!-- Corner ornaments (top) -->
          <tr><td style="padding:0;position:relative;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
              <td></td>
              <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
            </tr></table>
          </td></tr>

          <tr>
            <td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo -->
              <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                width="100" alt="RL Photo Video"
                style="display:block;margin:0 auto 28px;width:100px;height:auto;opacity:0.9;" />

              <!-- Olá, Rui! -->
              <p style="margin:0 0 6px;font-size:30px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

              <!-- Título principal -->
              <p style="margin:0;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">Um membro</p>
              <p style="margin:0;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">da tua equipa</p>
              <p style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">${confirmou ? 'confirmou a data' : 'está indisponível'}</p>
              <p style="margin:0 0 28px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">de um evento.</p>

              <!-- Divider -->
              <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

              <!-- Caixa: nome do membro + dados -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
                <tr>
                  <td style="padding:22px 32px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">${confirmou ? 'Confirmado por' : 'Indisponível'}</p>
                    <p style="margin:0 0 18px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${freelancer_nome}</p>
                    ${referencia ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Referência</p>
                    <p style="margin:0 0 14px;font-size:13px;font-family:Georgia,'Times New Roman',serif;color:#b8a070;letter-spacing:0.08em;">${referencia}</p>` : ''}
                    ${dataFormatada ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Data do Evento</p>
                    <p style="margin:0 0 14px;font-size:13px;color:#d4c9b0;">${dataFormatada}</p>` : ''}
                    ${local ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Local</p>
                    <p style="margin:0;font-size:13px;color:#d4c9b0;">${local}</p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Texto -->
              <p style="margin:0 0 0;font-size:15px;color:#a09070;line-height:1.8;">
                Consulta o <strong style="color:#c9b88a;font-weight:500;">painel de administração</strong><br>para veres todos os detalhes.
              </p>

            </td>
          </tr>

          <!-- Corner ornaments (bottom) -->
          <tr><td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
              <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
                <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">RL PHOTO &middot; VIDEO</p>
              </td>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
            </tr></table>
          </td></tr>

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
