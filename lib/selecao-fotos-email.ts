import type { SelecaoFotos } from './selecao-fotos-save'

// Email de aviso ao admin sempre que chega uma seleção de fotografias pelo
// formulário próprio (/form-selecao-fotos). Mesmo cartão das restantes
// notificações admin — ver app/api/send-admin-notification.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const ADMIN_URL   = 'https://portal.rlphotovideo.pt/fotos-selecao'

const LABELS: Record<string, string> = {
  preparacao:    'Preparação',
  sessao_noivos: 'Sessão Noivos',
  fotos_noiva:   'Fotos da Noiva',
  fotos_noivo:   'Fotos do Noivo',
  convidados:    'Convidados',
  cerimonia:     'Cerimónia',
  bolo_bouquet:  'Bolo e Bouquet',
  sala_animacao: 'Sala e Animação',
  fotos_album:   'Fotos p/Álbum',
  detalhes:      'Detalhes',
}

// No batizado as mesmas colunas têm outros nomes no formulário.
const LABELS_BATIZADO: Record<string, string> = {
  ...LABELS,
  sala_animacao: 'Festa',
  fotos_album:   'Álbum',
}

function contar(valor: string | null) {
  if (!valor) return 0
  return valor.split(/[;,]/).map(v => v.trim()).filter(Boolean).length
}

export async function enviarEmailAdminSelecao(data: SelecaoFotos, tipo: 'casamento' | 'batizado') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[selecao-fotos] RESEND_API_KEY em falta — email não enviado')
    return
  }

  const labels = tipo === 'batizado' ? LABELS_BATIZADO : LABELS
  const linhas = Object.keys(labels)
    .map(col => ({ label: labels[col], n: contar((data as any)[col] ?? null) }))
    .filter(l => l.n > 0)
  const total = linhas.reduce((acc, l) => acc + l.n, 0)

  const dataFormatada = data.date
    ? new Date(data.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const evento = tipo === 'batizado' ? 'batizado' : 'casamento'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

          <!-- Corner ornaments (top) -->
          <tr><td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
              <td></td>
              <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
            </tr></table>
          </td></tr>

          <tr>
            <td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo -->
              <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png"
                width="100" alt="RL Photo Video"
                style="display:block;margin:0 auto 28px;width:100px;height:auto;opacity:0.9;" />

              <p style="margin:0 0 6px;font-size:30px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

              <p style="margin:0;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">Chegou uma</p>
              <p style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">nova seleção</p>
              <p style="margin:0 0 28px;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">de fotografias.</p>

              <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

              <!-- Caixa: dados do evento -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
                <tr>
                  <td style="padding:22px 32px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Seleção de ${evento}</p>
                    <p style="margin:0 0 18px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${data.nome_noivos}</p>
                    ${data.referencia ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Referência</p>
                    <p style="margin:0 0 14px;font-size:13px;color:#b8a070;letter-spacing:0.08em;">${data.referencia}</p>` : ''}
                    ${dataFormatada ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Data do Evento</p>
                    <p style="margin:0 0 14px;font-size:13px;color:#d4c9b0;">${dataFormatada}</p>` : ''}
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Total escolhido</p>
                    <p style="margin:0;font-size:30px;font-weight:400;color:#c9a96e;line-height:1.1;">${total}</p>
                  </td>
                </tr>
              </table>

              <!-- Fotografias por secção -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:100%;max-width:380px;">
                ${linhas.map(l => `<tr>
                  <td style="padding:9px 0;border-bottom:0.5px solid #2a1f0e;text-align:left;font-size:13px;color:#a09070;">${l.label}</td>
                  <td style="padding:9px 0;border-bottom:0.5px solid #2a1f0e;text-align:right;font-size:14px;color:#d4c9b0;">${l.n}</td>
                </tr>`).join('')}
              </table>

              <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
                Vê a seleção completa em<br>
                <a href="${ADMIN_URL}" style="color:#c9b88a;font-weight:500;text-decoration:none;">Seleção de Fotos</a>.
              </p>

            </td>
          </tr>

          <!-- Corner ornaments (bottom) -->
          <tr><td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
              <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
                <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Notificação Admin</p>
              </td>
              <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
            </tr></table>
          </td></tr>

        </table>
      </td>
    </tr>
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
      subject: `Nova seleção de fotografias — ${data.nome_noivos}${data.referencia ? ` (${data.referencia})` : ''}`,
      html,
    }),
  })

  if (!res.ok) {
    console.error('[selecao-fotos] Resend error:', await res.text())
  }
}
