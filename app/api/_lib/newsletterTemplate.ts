import { pickRandomPhoto } from './newsletterPhotos'

// Template de email — espelha o mockup da landing page
// Compatível com Gmail, Outlook, Apple Mail, Yahoo

// Banco de testemunhos — seleccionam-se 3 aleatoriamente em cada envio
const TESTIMONIALS = [
  { text: "O Rui e a equipa foram incriveis. Captaram cada emocao com uma sensibilidade unica. As fotografias sao autenticas obras de arte.", author: "Ana & Pedro", year: 2025 },
  { text: "Profissionalismo do inicio ao fim. Passaram despercebidos durante o dia mas captaram todos os momentos especiais. O filme e cinematografico!", author: "Sofia & Miguel", year: 2025 },
  { text: "Mais do que fotografos, ganhamos amigos. Fizeram-nos sentir em casa, confortaveis e naturais. Recomendamos de olhos fechados!", author: "Joana & Tiago", year: 2024 },
  { text: "Olhamos para as fotografias e revivemos o dia como se fosse ontem. A qualidade e impressionante, a emocao esta toda la.", author: "Catarina & Rui", year: 2025 },
  { text: "Tinhamos medo da camara e eles souberam poer-nos a vontade. As fotografias mais naturais que ja vimos.", author: "Ines & Ricardo", year: 2024 },
  { text: "Vale cada cent. O album e uma obra-prima que vamos passar aos filhos. O filme faz-nos chorar todas as vezes que vemos.", author: "Marta & Andre", year: 2025 },
  { text: "Contratamos outros fotografos para sessoes e nenhum chegou ao nivel. A diferenca esta nos detalhes que so eles captam.", author: "Beatriz & Joao", year: 2024 },
  { text: "No dia do casamento estavam em todo o lado mas sem se notar. Capturaram momentos que nem nos vimos acontecer. Magia pura.", author: "Carolina & Diogo", year: 2025 },
  { text: "A equipa certa faz toda a diferenca. Com o Rui e a equipa sentimos que estavamos em casa. O resultado fala por si.", author: "Filipa & Nuno", year: 2024 },
  { text: "Entrega impecavel, prazo cumprido, qualidade acima do esperado. O Same Day Edit foi o momento mais emocionante da festa.", author: "Raquel & Hugo", year: 2025 },
  { text: "Escolhemos com base no portfolio e nao nos enganamos. Cada fotografia conta uma historia. O nosso album e uma recordacao eterna.", author: "Sara & Bruno", year: 2024 },
  { text: "Investimento bem feito. Convidados ainda comentam a qualidade das fotografias que partilhamos. Tudo profissional.", author: "Madalena & Tiago", year: 2025 },
  { text: "Chegaram antes da hora, ficaram ate tarde, nunca sentimos que eram pagos ao fim. Sentiram o dia com connosco.", author: "Patricia & Goncalo", year: 2024 },
  { text: "O pre-wedding mudou tudo. No dia ja estavamos a vontade com a camara. Nota-se nas fotografias — tudo natural.", author: "Rita & Francisco", year: 2025 },
  { text: "Tivemos chuva no dia e nada os parou. Transformaram as nuvens em fotografias dramaticas e romanticas. Genios.", author: "Lucia & Paulo", year: 2024 },
]

function getRandomTestimonials(): typeof TESTIMONIALS {
  const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export function buildNewsletterHtml(d: any) {
  // Foto aleatória da pasta /public/newsletter/ (ou fallback para o hero específico)
  const heroPhoto = pickRandomPhoto(d.hero_image_url)
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

  const hero = heroPhoto
    ? `<tr><td style="padding:0 40px 32px;">
        <img src="${esc(heroPhoto)}" alt="" style="width:100%;display:block;height:auto;border:0;border-radius:4px;" />
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

    <!-- ============================================ -->
    <!-- HERO "Inspira o teu casamento de sonho" -->
    <!-- ============================================ -->
    <tr><td style="padding:72px 40px 64px;text-align:center;background:#0c0907;" class="mobile-pad">

      <table cellpadding="0" cellspacing="0" style="margin:0 auto 40px;"><tr>
        <td style="border:1px solid rgba(201,168,76,0.3);padding:10px 28px;">
          <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
            NEWSLETTER EXCLUSIVA
          </p>
        </td>
      </tr></table>

      <h1 class="mobile-title" style="margin:0 0 28px;font-family:'Cormorant Garamond',Georgia,serif;font-size:46px;font-weight:300;line-height:1.15;color:#f5f0e8;">
        Inspira o teu<br>
        <em style="font-style:italic;color:#c9a84c;">casamento de sonho</em>
      </h1>

      <p style="margin:0 auto 40px;max-width:460px;font-family:'Montserrat',Arial,sans-serif;font-size:14px;font-weight:300;line-height:1.8;color:#a09585;">
        Dicas, tendências e bastidores do mundo da fotografia e videografia de casamentos.
        Direto na tua caixa de email, todas as semanas.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="background:#c9a84c;padding:16px 44px;">
          <a href="https://rl-menu-lake.vercel.app/newsletter" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
            Partilhar com Amigos
          </a>
        </td>
      </tr></table>

      <p style="margin:20px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#6a5a3e;">
        Sem spam. Cancela quando quiseres.
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

    <!-- Testemunhos rotativos -->
    <tr><td style="padding:56px 40px 16px;text-align:center;background:rgba(201,168,76,0.03);border-top:1px solid rgba(201,168,76,0.1);" class="mobile-pad">
      <p style="margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
        TESTEMUNHOS
      </p>
      <h3 style="margin:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#f5f0e8;line-height:1.2;">
        O que dizem os <em style="font-style:italic;color:#c9a84c;">noivos</em>
      </h3>
      <p style="margin:0 0 36px;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#6a5a3e;">
        Casais que confiaram em nos para eternizar o seu grande dia
      </p>
    </td></tr>

    ${getRandomTestimonials().map(t => `
    <tr><td style="padding:0 40px 16px;background:rgba(201,168,76,0.03);" class="mobile-pad">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.015);border:1px solid rgba(201,168,76,0.08);">
        <tr><td style="padding:28px 28px;">
          <p style="margin:0 0 14px;font-family:'Montserrat',Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#c9a84c;">★ ★ ★ ★ ★</p>
          <p style="margin:0 0 18px;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-style:italic;color:#f5f0e8;line-height:1.7;">
            "${t.text}"
          </p>
          <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#a09585;text-transform:uppercase;">
            ${t.author} &middot; Casamento ${t.year}
          </p>
        </td></tr>
      </table>
    </td></tr>
    `).join('')}

    <tr><td style="padding:24px 40px 0;background:rgba(201,168,76,0.03);"><table width="100%"><tr><td style="border-top:1px solid rgba(201,168,76,0.08);height:1px;font-size:1px;">&nbsp;</td></tr></table></td></tr>

    <!-- Instagram CTA -->
    <tr><td style="padding:56px 40px 48px;text-align:center;" class="mobile-pad">
      <p style="margin:0 0 8px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
        INSTAGRAM
      </p>
      <h3 style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.2;">
        Os bastidores <em style="font-style:italic;color:#c9a84c;">todos os dias</em>
      </h3>
      <p style="margin:0 0 32px;max-width:420px;margin-left:auto;margin-right:auto;font-family:'Montserrat',Arial,sans-serif;font-size:14px;color:#a09585;line-height:1.7;font-weight:300;">
        Acompanhem a nossa jornada no Instagram. Fotografias exclusivas, vídeos dos casamentos e inspiração para o vosso grande dia.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="background:#c9a84c;padding:16px 40px;">
          <a href="https://www.instagram.com/rlphoto_fotografia.video/" style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
            Seguir no Instagram
          </a>
        </td>
      </tr></table>
      <p style="margin:18px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#6a5a3e;">
        @rlphoto_fotografia.video
      </p>
    </td></tr>

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
        <a href="https://www.instagram.com/rlphoto_fotografia.video/" style="color:#a09585;text-decoration:none;">Instagram</a>
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
