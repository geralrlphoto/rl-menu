// Template de email — espelha o mockup da landing page
// Compatível com Gmail, Outlook, Apple Mail, Yahoo

export function buildNewsletterHtml(d: any) {
  const sections = (d.sections || []).map((s: any) => `
    <tr><td style="padding:32px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;font-style:italic;color:#c9a84c;letter-spacing:1px;">
            ${esc(s.num || '')}
          </p>
          <h2 style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:400;color:#f5f0e8;line-height:1.25;">
            ${esc(s.title || '')}
          </h2>
          <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:14px;line-height:1.85;color:#a09585;font-weight:300;">
            ${esc(s.body || '')}
          </p>
        </td>
      </tr></table>
    </td></tr>`).join('')

  const hero = d.hero_image_url
    ? `<tr><td style="padding:0 40px 32px;">
        <img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;border:0;border-radius:4px;" />
      </td></tr>`
    : ''

  const cta = d.cta_url && d.cta_label
    ? `<tr><td style="padding:24px 40px 8px;">
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
          <td style="background:#c9a84c;padding:16px 36px;">
            <a href="${esc(d.cta_url)}" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
              ${esc(d.cta_label)}
            </a>
          </td>
        </tr></table>
      </td></tr>`
    : ''

  const intro = d.intro
    ? `<tr><td style="padding:0 40px 8px;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:14px;line-height:1.8;color:#a09585;font-weight:300;">
          ${esc(d.intro)}
        </p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no">
<title>${esc(d.subject || '')}</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  @media only screen and (max-width:620px) {
    .container { width:100% !important; max-width:100% !important; }
    .mobile-pad { padding-left:24px !important; padding-right:24px !important; }
    .mobile-title { font-size:26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0c0907;-webkit-font-smoothing:antialiased;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(d.preview_text || '')}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;">
<tr><td align="center" style="padding:32px 16px;">

  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1a1410;border:1px solid rgba(201,168,76,0.15);border-radius:8px;overflow:hidden;">

    <!-- Header — igual ao mockup da landing -->
    <tr><td style="padding:40px 40px 24px;text-align:center;background:rgba(201,168,76,0.04);" class="mobile-pad">
      <img src="https://rl-menu-lake.vercel.app/logo-email.png" alt="RL Photo & Video" width="80" height="80" style="display:block;margin:0 auto 16px;width:80px;height:auto;border:0;" />
      <p style="margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:400;color:#c9a84c;letter-spacing:4px;">
        RL PHOTO &amp; VIDEO
      </p>
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#a09585;">
        NEWSLETTER QUINZENAL
      </p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid rgba(201,168,76,0.15);height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>
    </td></tr>

    <!-- Título -->
    <tr><td style="padding:32px 40px 24px;" class="mobile-pad">
      <h1 class="mobile-title" style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.25;">
        ${esc(d.subject || '')}
      </h1>
    </td></tr>

    <!-- Imagem hero -->
    ${hero}

    <!-- Intro -->
    ${intro}

    <!-- Secções -->
    ${sections}

    <!-- CTA -->
    ${cta}

    <!-- Assinatura -->
    <tr><td style="padding:48px 40px 32px;text-align:center;" class="mobile-pad">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
        <td style="width:40px;height:1px;background:#c9a84c;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>
      <p style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-style:italic;color:#c9a84c;">
        Com carinho,
      </p>
      <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#a09585;">
        Equipa RL Photo &amp; Video
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:28px 40px 36px;text-align:center;background:rgba(12,9,7,0.5);border-top:1px solid rgba(201,168,76,0.1);" class="mobile-pad">
      <p style="margin:0 0 14px;font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;color:#c9a84c;letter-spacing:3px;">
        RL PHOTO &amp; VIDEO
      </p>
      <p style="margin:0 0 14px;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#a09585;line-height:1.7;">
        <a href="https://rlphotovideo.pt" style="color:#a09585;text-decoration:none;">rlphotovideo.pt</a>
        &nbsp;·&nbsp;
        <a href="https://www.instagram.com/rlphotovideo" style="color:#a09585;text-decoration:none;">Instagram</a>
      </p>
      <p style="margin:16px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#6a5a3e;line-height:1.6;font-weight:300;">
        Recebeste este email porque subscreveste a nossa newsletter.<br>
        <a href="{{unsubscribe_url}}" style="color:#8a7450;text-decoration:underline;">Cancelar subscrição</a>
      </p>
    </td></tr>

  </table>

</td></tr></table>

</body>
</html>`
}

function esc(s: string): string {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
