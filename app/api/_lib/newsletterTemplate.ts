// Template de email da newsletter — design inspirado na landing page
// Compatível com Gmail, Outlook, Apple Mail, Yahoo

export function buildNewsletterHtml(d: any) {
  const sections = (d.sections || []).map((s: any, i: number) => {
    const isLast = i === (d.sections || []).length - 1
    return `
    <tr><td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#15100a;border:1px solid #2a2217;margin-bottom:${isLast ? 0 : 16}px;">
        <tr><td style="padding:28px 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;width:60px;">
              <div style="display:inline-block;padding:6px 10px;border:1px solid #c9a96e;color:#c9a96e;font-family:Georgia,serif;font-size:13px;font-style:italic;">
                ${esc(s.num || '')}
              </div>
            </td>
            <td style="vertical-align:top;padding-left:16px;">
              <h2 style="margin:0 0 10px;font-size:22px;font-weight:400;color:#fff;font-family:Georgia,serif;line-height:1.25;">
                ${esc(s.title || '')}
              </h2>
              <p style="margin:0;font-size:14px;line-height:1.85;color:#b3a082;font-family:Arial,sans-serif;">
                ${esc(s.body || '')}
              </p>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>`
  }).join('')

  const hero = d.hero_image_url
    ? `<tr><td style="padding:0;position:relative;">
        <img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;border:0;" />
      </td></tr>`
    : ''

  const cta = d.cta_url && d.cta_label
    ? `<tr><td style="padding:0 40px 24px;text-align:center;">
        <a href="${esc(d.cta_url)}" style="display:inline-block;padding:18px 48px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;">
          ${esc(d.cta_label)}
        </a>
      </td></tr>
      <tr><td style="padding:0 40px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:1px solid #2a2217;height:1px;font-size:1px;">&nbsp;</td>
        </tr></table>
      </td></tr>`
    : ''

  const intro = d.intro
    ? `<tr><td style="padding:0 40px 32px;">
        <p style="margin:0;font-size:17px;line-height:1.7;color:#c9a96e;font-style:italic;font-family:Georgia,serif;text-align:center;">
          ${esc(d.intro)}
        </p>
      </td></tr>
      <tr><td style="padding:0 40px 32px;text-align:center;">
        <div style="display:inline-block;width:48px;height:1px;background:#c9a96e;">&nbsp;</div>
      </td></tr>`
    : ''

  const category = d.category
    ? `<tr><td style="padding:0 40px 12px;text-align:center;">
        <span style="display:inline-block;padding:5px 14px;border:1px solid #7a6340;color:#c9a96e;font-family:Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;">
          ${esc(d.category)}
        </span>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no">
<title>${esc(d.subject || '')}</title>
<style>
  @media only screen and (max-width:620px) {
    .container { width:100% !important; max-width:100% !important; }
    .mobile-pad { padding-left:20px !important; padding-right:20px !important; }
    .mobile-hero-title { font-size:26px !important; }
    .mobile-intro { font-size:15px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0e0b06;-webkit-font-smoothing:antialiased;">

<!-- Preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(d.preview_text || '')}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;">
<tr><td align="center" style="padding:32px 16px;">

  <!-- Container -->
  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#110e08;border:1px solid #3a2f1e;">

    <!-- Header com logo -->
    <tr><td style="padding:48px 40px 32px;text-align:center;" class="mobile-pad">
      <img src="https://rl-menu-lake.vercel.app/logo-email.png" alt="RL Photo & Video" width="120" height="120" style="display:block;margin:0 auto 10px;width:120px;height:auto;border:0;outline:none;text-decoration:none;" />
      <p style="margin:6px 0 0;font-size:9px;letter-spacing:3px;color:#8a7450;font-family:Arial,sans-serif;">
        NEWSLETTER QUINZENAL
      </p>
    </td></tr>

    <!-- Hero image -->
    ${hero}

    <!-- Category badge -->
    <tr><td style="padding:40px 0 0;">&nbsp;</td></tr>
    ${category}

    <!-- Title -->
    <tr><td style="padding:8px 40px 24px;text-align:center;" class="mobile-pad">
      <h1 class="mobile-hero-title" style="margin:0;font-size:32px;font-weight:400;color:#ffffff;line-height:1.22;font-family:Georgia,serif;letter-spacing:-0.3px;">
        ${esc(d.subject || '')}
      </h1>
    </td></tr>

    <!-- Intro -->
    ${intro}

    <!-- Sections -->
    ${sections}

    <!-- CTA -->
    <tr><td style="padding:40px 0 0;">&nbsp;</td></tr>
    ${cta}

    <!-- Signature -->
    <tr><td style="padding:32px 40px;text-align:center;border-top:1px solid #2a2217;background:#0c0a06;" class="mobile-pad">
      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-style:italic;">
        Com carinho,
      </p>
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#b3a082;">
        Equipa RL Photo &amp; Video
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:28px 40px 36px;text-align:center;background:#0a0804;" class="mobile-pad">
      <p style="margin:0 0 12px;font-size:10px;color:#8a7450;font-family:Arial,sans-serif;letter-spacing:2px;">
        RL PHOTO &amp; VIDEO
      </p>
      <p style="margin:0 0 14px;font-size:11px;color:#6a5a3e;font-family:Arial,sans-serif;line-height:1.7;">
        <a href="https://rlphotovideo.pt" style="color:#8a7450;text-decoration:none;">rlphotovideo.pt</a>
        &nbsp;·&nbsp;
        <a href="https://www.instagram.com/rlphotovideo" style="color:#8a7450;text-decoration:none;">Instagram</a>
      </p>
      <p style="margin:16px 0 0;font-size:10px;color:#4a3f28;font-family:Arial,sans-serif;line-height:1.6;">
        Recebeste este email porque subscreveste a nossa newsletter.<br>
        <a href="{{unsubscribe_url}}" style="color:#6a5a3e;text-decoration:underline;">Cancelar subscrição</a>
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
