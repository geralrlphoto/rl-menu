// Bilhete dos noivos: o layout de todos os emails enviados aos noivos (aprovado a 2026-10-21).
// Foto escurecida com os nomes "Ana | Tiago" e a data, linha de corte com recortes,
// frase em itálico, campos com borda dourada à esquerda, botão em contorno dourado suave
// e assinatura "Photo · Video · Wedding Moments". Email-safe: só tabelas e estilos inline.
// Cada email muda a pílula, a frase, os campos, o bloco extra e o botão.

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')

const GOLD = '#d8be93'
const GOLD_SOFT = '#e4d3b3'
const BG = '#0b0b0b'
const CARD = '#111111'
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif"
const MONO = "'Space Mono','Courier New',Courier,monospace"

export type CampoBilhete = { k: string; v: string; mono?: boolean }

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function cap(w: string): string {
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

/** "ANA SOFIA & Tiago Silva" / "Ana e Tiago" / "Ana | Tiago" → "Ana | Tiago" (só primeiros nomes). */
export function nomesBilhete(...partes: (string | null | undefined)[]): string {
  const lista = partes.flatMap(p => String(p ?? '').split(/\s*(?:&|\||\s+e\s+)\s*/i))
    .map(p => cap(p.trim().split(/\s+/)[0] ?? '')).filter(Boolean)
  return lista.join(' | ')
}

/** "2027-06-12" ou "12/06/2027" → "12 · 06 · 2027" */
export function dataBilhete(d?: string | null): string {
  const s = String(d ?? '')
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]} · ${m[2]} · ${m[1]}`
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  return m ? `${m[1]} · ${m[2]} · ${m[3]}` : ''
}

/** Caixa tracejada com a chave de acesso (portal e recuperação da palavra-passe). */
export function blocoChave(email: string | null, password: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px dashed rgba(216,190,147,.45);border-radius:16px;background:rgba(216,190,147,.05);">
    <tr><td style="padding:20px 22px;text-align:center;">
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:.3em;color:${GOLD};">A VOSSA CHAVE</p>
      ${email ? `<p style="margin:8px 0 0;font-family:${MONO};font-size:13px;color:rgba(255,255,255,.6);word-break:break-all;">${esc(email)}</p>` : ''}
      <p style="margin:10px 0 0;font-family:${MONO};font-size:24px;letter-spacing:.2em;color:${GOLD_SOFT};-webkit-user-select:all;user-select:all;">${esc(password)}</p>
    </td></tr>
  </table>`
}

/** Destaque grande (ex.: valor pago, data da estreia). */
export function blocoDestaque(rotulo: string, valor: string, grande = false): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid rgba(216,190,147,.3);border-radius:16px;background:rgba(216,190,147,.05);">
    <tr><td style="padding:20px 22px;text-align:center;">
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:.3em;color:${GOLD};">${esc(rotulo.toUpperCase())}</p>
      <p style="margin:8px 0 0;font-family:${SERIF};font-size:${grande ? 46 : 26}px;line-height:1.1;color:${GOLD_SOFT};${grande ? '' : 'font-style:italic;'}">${esc(valor)}</p>
    </td></tr>
  </table>`
}

/** Caixa com texto livre (mensagens, respostas), mantém as quebras de linha. */
export function blocoTexto(rotulo: string, texto: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid rgba(216,190,147,.3);border-radius:16px;background:rgba(216,190,147,.05);">
    <tr><td style="padding:18px 22px;">
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:.3em;color:${GOLD};">${esc(rotulo.toUpperCase())}</p>
      <p style="margin:8px 0 0;font-family:${SERIF};font-size:18px;line-height:1.55;color:rgba(255,255,255,.85);">${esc(texto).replace(/\n/g, '<br>')}</p>
    </td></tr>
  </table>`
}

/** Passos numerados (ex.: Ticket do Filme): feitos a dourado, o atual em contorno. */
export function blocoPassos(rotulos: string[], atual: number): string {
  const cel = rotulos.map((r, i) => {
    const feito = i < atual, agora = i === atual
    return `<td align="center" style="width:${Math.floor(100 / rotulos.length)}%;padding:0 2px;">
      <span style="display:inline-block;width:28px;height:28px;line-height:28px;border-radius:50%;text-align:center;font-family:${MONO};font-size:11px;
        background:${feito ? GOLD : agora ? 'rgba(216,190,147,.15)' : 'transparent'};color:${feito ? BG : agora ? GOLD : 'rgba(255,255,255,.3)'};
        border:1px solid ${feito || agora ? GOLD : 'rgba(255,255,255,.12)'};">${feito ? '&#10003;' : i + 1}</span>
      <p style="margin:7px 0 0;font-family:${MONO};font-size:9px;letter-spacing:.16em;color:${agora ? GOLD : 'rgba(255,255,255,.42)'};">${esc(r.toUpperCase())}</p>
    </td>`
  }).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${cel}</tr></table>`
}

export function buildBilheteNoivos(o: {
  pill: string                 // "O VOSSO PORTAL", "AS FOTOS DO DIA"…
  nomes: string                // "Ana | Tiago"
  data?: string | null         // ISO ou dd/mm/aaaa
  tipo?: 'casamento' | 'batizado'
  frase: string                // frase em itálico por baixo da linha de corte
  texto?: string               // parágrafo opcional por baixo da frase
  campos?: CampoBilhete[]      // até 4, em duas colunas
  extra?: string               // bloco HTML entre os campos e o botão
  cta?: { label: string; url: string } | null
  nota?: string                // texto pequeno por baixo do botão
  preheader?: string
}): string {
  const tipo = o.tipo ?? 'casamento'
  const data = dataBilhete(o.data)
  const nomes = esc(o.nomes).replace(/ \| /g, `<span style="color:${GOLD};padding:0 .18em;">|</span>`)
  const campos = (o.campos ?? []).filter(c => c.v)
  const linhas: CampoBilhete[][] = []
  for (let i = 0; i < campos.length; i += 2) linhas.push(campos.slice(i, i + 2))
  const campo = (c?: CampoBilhete) => c ? `
        <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:.3em;color:${GOLD};">${esc(c.k.toUpperCase())}</p>
        <p style="margin:6px 0 0;${c.mono ? `font-family:${MONO};font-size:14px;letter-spacing:.06em;` : `font-family:${SERIF};font-size:20px;`}color:rgba(255,255,255,.92);word-break:break-word;">${esc(c.v)}</p>` : ''
  const grelha = linhas.length ? `
  <tr><td class="pad" style="padding:26px 44px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:2px solid ${GOLD};">
      ${linhas.map((l, i) => `<tr>
        <td class="col" valign="top" width="55%" style="padding:${i ? 16 : 0}px 12px 0 18px;">${campo(l[0])}</td>
        <td class="col" valign="top" width="45%" style="padding:${i ? 16 : 0}px 0 0 12px;">${campo(l[1])}</td>
      </tr>`).join('')}
    </table>
  </td></tr>` : ''
  const notch = (lado: 'l' | 'r') => `<td width="18" style="width:18px;font-size:0;line-height:0;">
        <div style="width:18px;height:36px;background:${BG};border-radius:${lado === 'l' ? '0 18px 18px 0' : '18px 0 0 18px'};border:1px solid rgba(216,190,147,.35);border-${lado === 'l' ? 'left' : 'right'}:0;"></div></td>`

  return `<!DOCTYPE html>
<html lang="pt"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:${BG};}
  a{text-decoration:none;}
  @media (max-width:540px){
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .nomes{font-size:44px !important;}
    .col{display:block !important;width:100% !important;padding:14px 0 0 18px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG};">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(o.preheader)}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${BG}" style="background:${BG};padding:28px 10px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${CARD}" style="max-width:520px;width:100%;background:${CARD};border:1px solid rgba(216,190,147,.35);border-radius:24px;overflow:hidden;">

  <tr><td background="${SITE}/email/bilhete-${tipo}.jpg" bgcolor="${CARD}" valign="top"
    style="background:${CARD} url('${SITE}/email/bilhete-${tipo}.jpg') center/cover no-repeat;background-image:url('${SITE}/email/bilhete-${tipo}.jpg');background-size:cover;background-position:center;text-align:center;padding:40px 24px 34px;">
    <img src="${SITE}/logo_rl_gold.png" width="50" alt="RL Photo · Video" style="display:block;margin:0 auto;width:50px;height:auto;border:0;">
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px auto 0;"><tr>
      <td style="padding:7px 16px;border:1px solid rgba(216,190,147,.6);border-radius:999px;background:rgba(216,190,147,.12);font-family:${MONO};font-size:11px;letter-spacing:.3em;color:${GOLD_SOFT};">${esc(o.pill.toUpperCase())}</td>
    </tr></table>
    <div style="height:150px;line-height:150px;font-size:0;">&nbsp;</div>
    <p class="nomes" style="margin:0;font-family:${SERIF};font-weight:300;font-size:58px;line-height:1.05;color:#ffffff;">${nomes}</p>
    <div style="width:80px;height:1px;background:${GOLD};margin:20px auto 16px;font-size:0;line-height:0;">&nbsp;</div>
    ${data ? `<p style="margin:0;font-family:${MONO};font-size:14px;letter-spacing:.4em;color:${GOLD_SOFT};">${data}</p>` : ''}
  </td></tr>

  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      ${notch('l')}
      <td style="padding:0 14px;"><div style="border-top:2px dashed rgba(216,190,147,.38);height:0;font-size:0;line-height:0;">&nbsp;</div></td>
      ${notch('r')}
    </tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:28px 44px 0;">
    <p style="margin:0;font-family:${SERIF};font-style:italic;font-weight:300;font-size:22px;line-height:1.35;color:rgba(255,255,255,.92);">${esc(o.frase)}</p>
    ${o.texto ? `<p style="margin:12px 0 0;font-family:${SERIF};font-size:17px;line-height:1.55;color:rgba(255,255,255,.6);">${esc(o.texto)}</p>` : ''}
  </td></tr>
${grelha}
${o.extra ? `  <tr><td class="pad" style="padding:26px 44px 0;">${o.extra}</td></tr>` : ''}
${o.cta ? `
  <tr><td class="pad" style="padding:28px 44px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td align="center" style="border:1px solid rgba(216,190,147,.55);border-radius:999px;background:rgba(216,190,147,.07);">
        <a href="${esc(o.cta.url)}" target="_blank" style="display:block;padding:18px 16px;font-family:${MONO};font-size:13px;letter-spacing:.3em;color:${GOLD};">${esc(o.cta.label.toUpperCase())} &nbsp;&rarr;</a>
      </td>
    </tr></table>
  </td></tr>` : ''}
${o.nota ? `  <tr><td class="pad" style="padding:14px 44px 0;text-align:center;font-family:${MONO};font-size:11px;line-height:1.7;color:rgba(255,255,255,.42);">${o.nota}</td></tr>` : ''}

  <tr><td class="pad" style="padding:30px 44px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="font-family:${MONO};font-size:10px;letter-spacing:.18em;color:rgba(255,255,255,.42);"><a href="${SITE}" style="color:rgba(255,255,255,.42);">portal.rlphotovideo.pt</a></td>
      <td align="right" style="font-family:${MONO};font-size:10px;letter-spacing:.18em;color:rgba(255,255,255,.42);"><span style="color:${GOLD};">Photo · Video</span> · Wedding Moments</td>
    </tr></table>
  </td></tr>

</table>
${o.cta ? `<p style="margin:16px 0 0;font-family:${MONO};font-size:10px;color:rgba(255,255,255,.3);">O botão não abre? <a href="${esc(o.cta.url)}" style="color:${GOLD};text-decoration:underline;word-break:break-all;">${esc(o.cta.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
</td></tr>
</table>
</body></html>`
}
