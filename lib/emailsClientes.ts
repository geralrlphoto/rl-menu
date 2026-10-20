// Emails a noivos e leads, partilhados entre as rotas de envio e a pré-visualização
// da página Tickets (/api/jornada/email).

import { buildBilheteNoivos, blocoChave, nomesBilhete } from './bilheteNoivos'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'

/** "🔑 A vossa palavra-passe do portal": recuperação da palavra-passe pelos noivos (noivos-recover). */
export function buildRecoveryEmail(opts: {
  nome: string
  password: string
  loginUrl: string
}): string {
  return buildBilheteNoivos({
    pill: 'A vossa palavra-passe',
    nomes: nomesBilhete(opts.nome) || 'Para vocês',
    tipo: opts.loginUrl.includes('batizado') ? 'batizado' : 'casamento',
    frase: 'Confirmámos a vossa identidade. Aqui está a chave do vosso portal.',
    extra: blocoChave(null, opts.password),
    cta: { label: 'Entrar no portal', url: opts.loginUrl },
    nota: 'Se não foram vocês que pediram, ignorem este email.<br>Em caso de dúvida, falem connosco diretamente.',
    preheader: 'A palavra-passe do vosso portal.',
  })
}

/** "✓ Dados recebidos": confirmação aos noivos quando enviam os dados do contrato e o portal ainda não foi enviado (contrato-cps). */
export function buildDadosRecebidosEmail(data: { nome_noivos: string; data_casamento: string | null; tipo_evento?: string }): string {
  const isBatizado = data.tipo_evento === 'batizado'
  return buildBilheteNoivos({
    pill: 'Dados recebidos',
    nomes: nomesBilhete(data.nome_noivos) || data.nome_noivos,
    data: data.data_casamento,
    tipo: isBatizado ? 'batizado' : 'casamento',
    frase: 'Recebemos os vossos dados para o contrato. Em breve entraremos em contacto.',
    campos: [
      { k: isBatizado ? 'Pais' : 'Noivos', v: data.nome_noivos },
      { k: 'Próximo passo', v: 'Contrato e portal' },
    ],
    cta: { label: 'Falar connosco', url: `mailto:${ADMIN_EMAIL}` },
    nota: `Para qualquer questão estamos sempre disponíveis.<br>${ADMIN_EMAIL}`,
    preheader: 'Recebemos os vossos dados.',
  })
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
