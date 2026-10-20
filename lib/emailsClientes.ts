// Emails a noivos e leads, partilhados entre as rotas de envio e a pré-visualização
// da página Tickets (/api/jornada/email).

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'

/** "🔑 A vossa palavra-passe do portal": recuperação da palavra-passe pelos noivos (noivos-recover). */
export function buildRecoveryEmail(opts: {
  nome: string
  password: string
  loginUrl: string
}): string {
  const primeiroNome = (opts.nome || 'Olá').split(/[\s&]/)[0] || 'Olá'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:0.9;" />
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;">Olá, ${primeiroNome}!</p>
          <p style="margin:0 0 18px;font-size:24px;font-weight:400;color:#f0e8d8;">A vossa palavra-passe</p>
          <div style="margin:0 0 22px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>
          <p style="margin:0 0 26px;font-size:14px;color:#a09070;line-height:1.8;">
            Confirmámos a vossa identidade.<br>
            Aqui está a palavra-passe do vosso portal:
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:340px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">🔑 Palavra-passe</p>
              <p style="margin:0;font-size:22px;font-family:'Courier New',monospace;letter-spacing:0.15em;color:#f0e8d8;font-weight:600;">${opts.password}</p>
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
            <tr>
              <td align="center" style="border-radius:8px;background:#c9a96e;">
                <a href="${opts.loginUrl}" target="_blank"
                  style="display:inline-block;padding:18px 48px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.4em;font-weight:700;border-radius:8px;border:1px solid #c9a96e;">
                  ENTRAR &nbsp;→
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:11px;color:#5a4a30;line-height:1.6;">
            Se não foram vocês que pediram este reset, ignorem este email.<br>
            Em caso de dúvida, falem connosco directamente.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/** "✓ Dados recebidos": confirmação aos noivos quando enviam os dados do contrato e o portal ainda não foi enviado (contrato-cps). */
export function buildDadosRecebidosEmail(data: { nome_noivos: string; data_casamento: string | null; tipo_evento?: string }): string {
  const isBatizado = data.tipo_evento === 'batizado'
  const dataFormatada = data.data_casamento
    ? (() => {
        try {
          return new Date(data.data_casamento + 'T12:00:00').toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'long', year: 'numeric'
          })
        } catch { return data.data_casamento ?? '' }
      })()
    : ''

  const primeiroNome = data.nome_noivos.split(/[\s&]/)[0]

  // Labels condicionais por tipo de evento
  const labelNomes  = isBatizado ? 'Pais'              : 'Noivos'
  const labelData   = isBatizado ? 'Data do Batizado'  : 'Data do Casamento'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, ${primeiroNome}!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Dados</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">recebidos.</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            Recebemos os vossos dados para o contrato.<br>
            <strong style="color:#c9b88a;font-weight:500;">Em breve entraremos em contacto.</strong>
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:400px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">${labelNomes}</p>
              <p style="margin:0 0 20px;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${data.nome_noivos}</p>
              ${dataFormatada ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">${labelData}</p>
              <p style="margin:0;font-size:14px;color:#d4c9b0;">${dataFormatada}</p>
              ` : ''}
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#7a6a50;line-height:1.8;">Para qualquer questão estamos sempre disponíveis.</p>
          <p style="margin:0;font-size:14px;color:#7a6a50;line-height:1.8;">
            <a href="mailto:${ADMIN_EMAIL}" style="color:#c9a96e;text-decoration:none;">${ADMIN_EMAIL}</a>
          </p>

        </td></tr>

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
</body></html>`
}

/** "Recebemos o vosso contacto": resposta automática à lead do formulário /nova-lead (nova-lead). */
export function buildNovaLeadEmail(nome: string, servicosList: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no">
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  @media only screen and (max-width:620px){
    .container{width:100%!important;max-width:100%!important;}
    .mobile-pad{padding-left:24px!important;padding-right:24px!important;}
    .h1{font-size:30px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0c0907;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;">
<tr><td align="center" style="padding:32px 16px 48px;">

  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0"
    style="max-width:600px;width:100%;background:#13100c;border:1px solid rgba(201,168,76,0.18);border-radius:4px;overflow:hidden;">

    <!-- Topo dourado fino -->
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>

    <!-- Header logo -->
    <tr><td align="center" style="padding:40px 40px 32px;background:rgba(201,168,76,0.03);" class="mobile-pad">
      <img src="https://portal.rlphotovideo.pt/logo-rl-prod-branco.png" alt="RL Photo.Video"
        width="72" style="display:block;margin:0 auto 14px;width:72px;height:auto;border:0;" />
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:5px;color:#c9a84c;text-transform:uppercase;">
        RL PHOTO &amp; VIDEO
      </p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid rgba(201,168,76,0.12);height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>
    </td></tr>

    <!-- Hero imagem -->
    <tr><td style="padding:0;">
      <img src="https://portal.rlphotovideo.pt/casamentos-2028.png" alt=""
        width="600" style="display:block;width:100%;height:auto;border:0;" />
    </td></tr>

    <!-- Corpo principal -->
    <tr><td style="padding:48px 48px 40px;" class="mobile-pad">

      <!-- Etiqueta -->
      <p style="margin:0 0 20px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
        Mensagem recebida
      </p>

      <!-- Título -->
      <h1 class="h1" style="margin:0 0 20px;font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;line-height:1.2;color:#f5f0e8;">
        Obrigado pelo<br><em style="font-style:italic;color:#c9a84c;">vosso contacto</em>
      </h1>

      <!-- Linha dourada -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
        <td style="width:40px;border-top:1px solid #c9a84c;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>

      <!-- Texto -->
      <p style="margin:0 0 16px;font-family:'Montserrat',Arial,sans-serif;font-size:14px;font-weight:300;line-height:1.85;color:#a09585;">
        Recebemos a vossa mensagem e entraremos em contacto convosco em breve.
      </p>
      ${nome ? `<p style="margin:0 0 32px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;font-style:italic;line-height:1.6;color:#c9a84c;">${nome}</p>` : '<div style="margin-bottom:32px;"></div>'}

      ${servicosList ? `
      <!-- Serviços -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;border:1px solid rgba(201,168,76,0.2);border-radius:2px;">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">Serviços</p>
          <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:300;color:#d4c9b0;line-height:1.6;">${servicosList}</p>
        </td></tr>
      </table>` : ''}

      <!-- Divisor -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
        <td style="border-top:1px solid rgba(201,168,76,0.1);height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>

      <!-- Blog texto -->
      <p style="margin:0 0 24px;font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:300;line-height:1.8;color:#7a6a55;">
        Enquanto aguardam, inspirem-se no nosso blog com histórias de casamentos que eternizámos.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#c9a84c;padding:15px 36px;">
          <a href="https://www.rlprod.pt/blog-list1"
            style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
            Ver o Blog
          </a>
        </td>
      </tr></table>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 48px 32px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(201,168,76,0.08);" class="mobile-pad">
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#4a3d2a;text-transform:uppercase;text-align:center;">
        RL Photo.Video &nbsp;·&nbsp; www.rlprod.pt
      </p>
    </td></tr>

    <!-- Base dourada -->
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>

  </table>

</td></tr>
</table>

</body>
</html>`
}
