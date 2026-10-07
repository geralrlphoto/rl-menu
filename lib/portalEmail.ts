// Email "O vosso portal está aberto" enviado aos noivos/pais.
// Design aprovado a 2026-10-07: hero animado (foto + nomes em Centaur com
// brilho dourado), frase em imagem, contagem, chave de acesso, atalhos,
// site e Instagram.
import path from 'path'
import { readFileSync } from 'fs'
import sharp from 'sharp'
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'

const ASSETS = path.join(process.cwd(), 'lib', 'email-assets')
const W = 1040
const H = 640
const GOLD = '#d6b680'

let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Centaur.ttf'), 'RLCentaur')
  GlobalFonts.registerFromPath(path.join(ASSETS, 'Bodoni.ttf'), 'RLBodoni')
  fontsReady = true
}

// "PATRÍCIA ISABEL" → "Patrícia"
export function primeiroNome(s?: string | null): string {
  const w = String(s ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

function dataPontos(iso?: string | null): string {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]} · ${m[2]} · ${m[1]}` : ''
}

function diasAte(iso?: string | null): number | null {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const alvo = Date.UTC(+m[1], +m[2] - 1, +m[3])
  const hoje = new Date()
  const d = Math.round((alvo - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000)
  return d > 0 ? d : null
}

// Escreve texto centrado com espaçamento entre letras
function spaced(ctx: any, y: number, text: string, track: number) {
  const ws = [...text].map(c => ctx.measureText(c).width)
  let x = (W - ws.reduce((a, b) => a + b, 0) - track * (ws.length - 1)) / 2
  ;[...text].forEach((c, i) => { ctx.fillText(c, x, y); x += ws[i] + track })
}

/** Gera o GIF do topo do email com os nomes e a data. */
export async function gerarHeroGif(opts: { tipo: 'casamento' | 'batizado'; nomes: string; data?: string | null }): Promise<Buffer> {
  ensureFonts()
  const bg = await loadImage(readFileSync(path.join(ASSETS, `${opts.tipo}-bg.jpg`)))
  const data = dataPontos(opts.data)

  // Tamanho dos nomes ajusta-se para caber
  const probe = createCanvas(10, 10).getContext('2d')
  let size = 104
  probe.font = `${size}px RLCentaur`
  while (probe.measureText(opts.nomes).width > 900 && size > 56) { size -= 4; probe.font = `${size}px RLCentaur` }
  const nw = probe.measureText(opts.nomes).width
  const nx0 = (W - nw) / 2
  const nx1 = nx0 + nw
  const yNames = 210

  const N = 22
  const frames: Buffer[] = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const c = createCanvas(W, H)
    const ctx = c.getContext('2d')
    ctx.drawImage(bg, 0, 0, W, H)
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = GOLD
    ctx.font = '22px RLBodoni'
    spaced(ctx, 108, 'O VOSSO PORTAL ESTÁ ABERTO', 7)

    // nomes + brilho dourado que os atravessa
    ctx.font = `${size}px RLCentaur`
    const sh = (t - 0.2) / 0.55
    if (sh >= 0 && sh <= 1) {
      const cx = nx0 - 120 + (nx1 - nx0 + 240) * sh
      const g2 = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0)
      g2.addColorStop(0, 'rgba(250,232,196,0)')
      g2.addColorStop(0.5, 'rgba(255,238,200,1)')
      g2.addColorStop(1, 'rgba(250,232,196,0)')
      ctx.fillStyle = '#f4ead6'
      ctx.fillText(opts.nomes, nx0, yNames)
      ctx.fillStyle = g2
      ctx.fillText(opts.nomes, nx0, yNames)
    } else {
      ctx.fillStyle = '#f4ead6'
      ctx.fillText(opts.nomes, nx0, yNames)
    }

    ctx.strokeStyle = GOLD
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2 - 150, 268); ctx.lineTo(W / 2 + 150, 268); ctx.stroke()
    ctx.fillStyle = GOLD
    ctx.beginPath(); ctx.arc(W / 2, 268, 4, 0, Math.PI * 2); ctx.fill()

    if (data) {
      ctx.fillStyle = '#e2d6c0'
      ctx.font = '28px RLBodoni'
      spaced(ctx, 320, data, 3)
    }
    frames.push(Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer))
  }

  const delay = frames.map((_, i) => (i === N - 1 ? 2500 : 85))
  return sharp(Buffer.concat(frames), { raw: { width: W, height: H * N, channels: 4, pageHeight: H } as any })
    .gif({ loop: 0, delay, colours: 256, dither: 1, effort: 1, interFrameMaxError: 4, reuse: true })
    .toBuffer()
}

export function buildPortalEmailV2(o: {
  tipo: 'casamento' | 'batizado'
  heroUrl: string
  nomesAlt: string
  data?: string | null
  email: string
  password: string
  loginUrl: string
  siteBase: string
}): string {
  const dias = diasAte(o.data)
  const semanas = dias ? Math.floor(dias / 7) : null
  const fraseUrl = `${o.siteBase}/email/frase-${o.tipo}.png`
  const fraseAlt = o.tipo === 'batizado'
    ? 'A partir de hoje, cada passo até ao grande dia vive num só lugar. Feito só para vocês.'
    : 'A partir de hoje, cada passo até ao vosso grande dia vive num só lugar. Feito só para vocês.'
  const tile1 = o.tipo === 'batizado' ? 'Sessão<br>fotográfica' : 'Sessão<br>pré-wedding'
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

  const contagem = dias ? `
  <tr><td class="pad a1" style="padding:28px 44px 0;" align="center">
    <table cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td align="center" style="padding:0 16px;border-right:1px solid #2a231a;">
        <p class="cd" style="margin:0;font-family:Georgia,serif;font-size:34px;color:#d6b680;">${dias}</p>
        <p style="margin:2px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#776b58;">${dias === 1 ? 'DIA' : 'DIAS'}</p>
      </td>
      ${semanas ? `<td align="center" style="padding:0 16px;border-right:1px solid #2a231a;">
        <p class="cd" style="margin:0;font-family:Georgia,serif;font-size:34px;color:#d6b680;">${semanas}</p>
        <p style="margin:2px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#776b58;">${semanas === 1 ? 'SEMANA' : 'SEMANAS'}</p>
      </td>` : ''}
      <td align="center" style="padding:0 16px;">
        <p class="cd" style="margin:0;font-family:Georgia,serif;font-size:34px;color:#d6b680;">1</p>
        <p style="margin:2px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#776b58;">GRANDE DIA</p>
      </td>
    </tr></table>
  </td></tr>` : ''

  const tile = (icon: string, label: string, pad: string) => `
      <td class="tile-c" width="33%" style="${pad}" valign="top">
        <a class="tile" href="${o.loginUrl}" target="_blank" style="display:block;border:1px solid #2a231a;border-radius:12px;padding:18px 10px;text-align:center;background:#12100c;">
          <span style="display:block;font-size:22px;margin-bottom:8px;">${icon}</span>
          <span class="tt" style="display:block;font-size:12px;color:#b8ab95;">${label}</span>
        </a>
      </td>`

  return `<!DOCTYPE html>
<html lang="pt"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>O vosso portal está aberto</title>
<style>
  body{margin:0;padding:0;background:#080706;}
  a{text-decoration:none;}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes shine{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(214,182,128,.45)}50%{box-shadow:0 0 0 10px rgba(214,182,128,0)}}
  .a1{animation:up .9s ease-out .3s both}
  .a2{animation:up .9s ease-out .6s both}
  .a3{animation:up .9s ease-out .9s both}
  .cta{background:linear-gradient(110deg,#c9a96e 30%,#f4e2bd 50%,#c9a96e 70%) !important;background-size:200% 100% !important;animation:shine 3.5s linear 1.2s infinite,pulse 2.4s ease-out 1.2s infinite}
  .cta:hover{filter:brightness(1.08)}
  .tile:hover{border-color:#c9a96e !important;background:#17140f !important;}
  .tile:hover .tt{color:#f4ead8 !important}
  .pw{user-select:all;-webkit-user-select:all;}
  @media (max-width:540px){
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .tile-c{display:block !important;width:100% !important;padding:0 0 10px !important;}
    .cd{font-size:30px !important;}
  }
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;">${o.nomesAlt.replace(' | ', ' e ')}, preparámos uma coisa para vocês. ✨</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#080706;padding:28px 10px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;width:100%;background:#0f0d0a;border-radius:20px;overflow:hidden;border:1px solid #241e15;">

  <tr><td style="font-size:0;line-height:0;">
    <a href="${o.loginUrl}" target="_blank">
      <img src="${o.heroUrl}" width="520" alt="${o.nomesAlt} · O vosso portal está aberto" style="display:block;width:100%;height:auto;border:0;">
    </a>
  </td></tr>

  <tr><td class="pad a1" style="padding:34px 44px 0;text-align:center;">
    <img src="${fraseUrl}" width="432" alt="${fraseAlt}" style="display:block;margin:0 auto;width:100%;max-width:432px;height:auto;border:0;color:#e9dfcc;font-family:Georgia,serif;font-size:18px;">
  </td></tr>
${contagem}
  <tr><td class="pad a2" style="padding:34px 44px 0;font-family:${sans};">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:14px;background:#15120d;border:1px solid #2e261a;">
      <tr><td style="padding:22px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td valign="middle" width="44"><div style="width:36px;height:36px;border-radius:50%;background:#2a2217;text-align:center;line-height:36px;font-size:16px;">🔑</div></td>
          <td valign="middle">
            <p style="margin:0 0 3px;font-size:10px;letter-spacing:.22em;color:#776b58;">A VOSSA CHAVE</p>
            <p style="margin:0;font-size:13px;color:#b8ab95;word-break:break-all;">${o.email}</p>
          </td>
        </tr></table>
        <p class="pw" style="margin:16px 0 0;padding:14px 0;border-radius:10px;background:#0c0a08;border:1px dashed #4a3c26;text-align:center;font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:24px;letter-spacing:.22em;color:#f0dcb0;font-weight:700;">${o.password}</p>
        <p style="margin:8px 0 0;text-align:center;font-size:11px;color:#5f5546;">Toquem na palavra-passe para a copiar</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td class="pad a2" style="padding:22px 44px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td align="center" class="cta" style="background:#c9a96e;border-radius:14px;">
        <a href="${o.loginUrl}" target="_blank" style="display:block;padding:19px 20px;font-family:${sans};font-size:14px;font-weight:700;letter-spacing:.2em;color:#120f0b;">ABRIR O NOSSO PORTAL &nbsp;→</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="pad a3" style="padding:38px 44px 0;font-family:${sans};">
    <p style="margin:0 0 14px;text-align:center;font-size:10px;letter-spacing:.3em;color:#776b58;">O QUE VOS ESPERA LÁ DENTRO</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      ${tile('📸', tile1, 'padding-right:6px;')}
      ${tile('🗓️', 'Cronograma<br>do dia', 'padding:0 3px;')}
      ${tile('🎬', 'O vosso<br>filme', 'padding-left:6px;')}
    </tr></table>
  </td></tr>

  <tr><td class="pad a3" style="padding:30px 44px 0;font-family:${sans};">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td class="tile-c" width="50%" style="padding-right:5px;">
        <a class="tile" href="https://www.rlphotovideo.pt" target="_blank" style="display:block;border:1px solid #3a2f20;border-radius:12px;padding:14px 10px;text-align:center;background:#12100c;">
          <span class="tt" style="font-size:12px;letter-spacing:.18em;color:#d6b680;font-weight:600;">🌐&nbsp; O NOSSO SITE</span>
        </a>
      </td>
      <td class="tile-c" width="50%" style="padding-left:5px;">
        <a class="tile" href="https://www.instagram.com/rlphoto_fotografia.video" target="_blank" style="display:block;border:1px solid #3a2f20;border-radius:12px;padding:14px 10px;text-align:center;background:#12100c;">
          <span class="tt" style="font-size:12px;letter-spacing:.18em;color:#d6b680;font-weight:600;">📷&nbsp; INSTAGRAM</span>
        </a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:40px 44px 36px;text-align:center;">
    <div style="width:40px;height:1px;background:#4a3c26;margin:0 auto 18px;"></div>
    <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:17px;color:#d6b680;">Até já,</p>
    <p style="margin:4px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.25em;color:#776b58;">RL PHOTO.VIDEO</p>
    <p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#4f463a;">
      O botão não abre? <a href="${o.loginUrl}" style="color:#a08a62;text-decoration:underline;">${o.loginUrl.replace(/^https?:\/\//, '')}</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}
