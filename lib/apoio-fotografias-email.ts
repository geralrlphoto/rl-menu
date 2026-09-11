// Email de aviso ao admin quando um cliente diz, na página de Apoio ao Cliente
// (/apoio-fotografias), que já passou o prazo e não recebeu as fotografias.
// Mesmo cartão das restantes notificações admin — ver lib/selecao-fotos-email.

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const ADMIN_URL   = 'https://portal.rlphotovideo.pt/galeria-convidados'

export type PedidoApoio = {
  nome: string
  email: string
  telefone: string
  noivos: string
  /** Data do casamento em ISO (AAAA-MM-DD). */
  data: string
  ticket: string
  formato: 'digital' | 'papel'
  /** Data estimada de entrega, já calculada e formatada para leitura. */
  entregaPrevista: string
}

function fmtData(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function enviarEmailAdminApoio(p: PedidoApoio) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[apoio-fotografias] RESEND_API_KEY em falta — email não enviado')
    return
  }

  const formato = p.formato === 'papel' ? 'Fotografias em papel' : 'Fotografias digitais'
  const linhas: { k: string; v: string }[] = [
    { k: 'Ticket',              v: p.ticket },
    { k: 'Formato',             v: formato },
    { k: 'Data do casamento',   v: fmtData(p.data) },
    { k: 'Entrega prevista',    v: p.entregaPrevista },
    { k: 'Nome',                v: p.nome },
    { k: 'Email',               v: p.email },
    { k: 'Telefone',            v: p.telefone },
  ]

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

              <p style="margin:0;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">Um cliente</p>
              <p style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">não recebeu</p>
              <p style="margin:0 0 28px;font-size:40px;font-weight:400;color:#f0e8d8;line-height:1.1;">as fotografias.</p>

              <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

              <!-- Caixa: casamento e prazo -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
                <tr>
                  <td style="padding:22px 32px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Prazo ultrapassado</p>
                    <p style="margin:0 0 18px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${p.noivos}</p>
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Entrega prevista</p>
                    <p style="margin:0;font-size:20px;color:#d4c9b0;">${p.entregaPrevista}</p>
                  </td>
                </tr>
              </table>

              <!-- Dados do cliente -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:100%;max-width:380px;">
                ${linhas.map(l => `<tr>
                  <td style="padding:9px 0;border-bottom:0.5px solid #2a1f0e;text-align:left;font-size:13px;color:#a09070;">${l.k}</td>
                  <td style="padding:9px 0;border-bottom:0.5px solid #2a1f0e;text-align:right;font-size:14px;color:#d4c9b0;">${l.v}</td>
                </tr>`).join('')}
              </table>

              <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
                Ficou à espera de resposta. Confirma a encomenda em<br>
                <a href="${ADMIN_URL}" style="color:#c9b88a;font-weight:500;text-decoration:none;">Fotos Convidados</a>.
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
      reply_to: p.email,
      subject: `Fotografias em falta — ${p.ticket} (${p.noivos})`,
      html,
    }),
  })

  if (!res.ok) {
    console.error('[apoio-fotografias] Resend error:', await res.text())
    throw new Error('Falha no envio do email')
  }
}
