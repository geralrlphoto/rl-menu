// Card da equipa: o layout de todos os emails enviados à equipa (freelancers, editores,
// candidatos), aprovado a 2026-10-21. Junta o bilhete dos noivos (lib/bilheteNoivos.ts)
// com a capa do /freelancers: câmara a preto e branco, linha dourada vertical,
// "RL PHOTO.VIDEO" a dourado, nome grande em maiúsculas condensadas e a função.
// Email-safe: só tabelas e estilos inline.
import { createClient } from '@supabase/supabase-js'
import { esc, dataBilhete, nomesBilhete, type CampoBilhete } from './bilheteNoivos'

export { blocoTexto, blocoDestaque, blocoPassos } from './bilheteNoivos'

export const ESPACO = '<div style="height:16px;font-size:0;line-height:0;">&nbsp;</div>'

/** Lista numerada (próximos passos): número em círculo dourado, título e texto. */
export function blocoLista(rotulo: string, itens: [string, string][]): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid rgba(216,190,147,.3);border-radius:16px;background:rgba(216,190,147,.05);">
    <tr><td style="padding:18px 22px 6px;">
      <p style="margin:0 0 10px;font-family:'Space Mono','Courier New',monospace;font-size:10px;letter-spacing:.3em;color:#d8be93;">${esc(rotulo.toUpperCase())}</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${itens.map(([t, x], i) => `
        <tr><td valign="top" width="34" style="width:34px;padding:0 0 12px;"><span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;border:1px solid #d8be93;text-align:center;font-family:'Space Mono','Courier New',monospace;font-size:11px;color:#d8be93;">${i + 1}</span></td>
        <td valign="top" style="padding:2px 0 12px;font-family:'Roboto Condensed','Arial Narrow',Arial,sans-serif;font-size:15px;line-height:1.5;color:rgba(255,255,255,.6);"><b style="color:rgba(255,255,255,.92);">${esc(t)}.</b> ${esc(x)}</td></tr>`).join('')}
      </table>
    </td></tr>
  </table>`
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')
const OURO = '#C9A84C'
const GOLD = '#d8be93'
const GOLD_SOFT = '#e4d3b3'
const BG = '#070707'
const CARD = '#111111'
const COND = "'Roboto Condensed','Arial Narrow',Arial,sans-serif"
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif"
const MONO = "'Space Mono','Courier New',Courier,monospace"

/** status da ficha do freelancer → função no card */
const FUNCAO: Record<string, string> = { FOTOGRAFO: 'Fotógrafo', VIDEOGRAFO: 'Videógrafo', ASSISTENTE: 'Assistente', EDITORES: 'Editor' }
export const funcaoDe = (status?: string | null) => FUNCAO[String(status ?? '').toUpperCase()] ?? ''

/** Casal, data e local do evento a partir da referência (eventos_2026/27/28). */
export async function eventoParaEquipa(referencia?: string | null): Promise<{ noivos: string; data: string | null; local: string | null }> {
  const vazio = { noivos: '', data: null, local: null }
  if (!referencia) return vazio
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  for (const t of ['eventos_2026', 'eventos_2027', 'eventos_2028']) {
    try {
      const { data } = await sb.from(t).select('cliente, data_evento, local').eq('referencia', referencia).maybeSingle()
      if (data) return { noivos: nomesBilhete(data.cliente), data: data.data_evento ?? null, local: data.local ?? null }
    } catch { /* tabela pode não existir */ }
  }
  return vazio
}

export function buildCardEquipa(o: {
  pill: string                 // "NOVO EVENTO", "BRIEFING DISPONÍVEL"…
  nome: string                 // nome do membro (vai em maiúsculas, primeiro e último)
  funcao?: string | null       // "Fotógrafo", "Editor"…
  contexto?: string | null     // segunda parte da linha da função ("Casamento", "Edição de vídeo")
  frase: string                // frase em itálico por baixo da linha de corte
  texto?: string
  campos?: CampoBilhete[]      // até 6, em duas colunas
  extra?: string               // bloco HTML entre os campos e o botão
  cta?: { label: string; url: string } | null
  nota?: string
  preheader?: string
}): string {
  const partes = String(o.nome ?? '').trim().split(/\s+/).filter(Boolean)
  const nome = partes.length > 1 ? `${partes[0]}<br>${partes[partes.length - 1]}` : (partes[0] ?? 'Equipa')
  const linhaFuncao = [o.funcao ? `<span style="color:${OURO};">${esc(o.funcao.toUpperCase())}</span>` : '', o.contexto ? esc(o.contexto.toUpperCase()) : '']
    .filter(Boolean).join(' · ')
  const campos = (o.campos ?? []).filter(c => c.v)
  const linhas: CampoBilhete[][] = []
  for (let i = 0; i < campos.length; i += 2) linhas.push(campos.slice(i, i + 2))
  const campo = (c?: CampoBilhete) => c ? `
        <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:.3em;color:${GOLD};">${esc(c.k.toUpperCase())}</p>
        <p style="margin:6px 0 0;${c.mono ? `font-family:${MONO};font-size:14px;letter-spacing:.06em;` : `font-family:${COND};font-size:19px;`}color:rgba(255,255,255,.92);word-break:break-word;">${esc(c.v)}</p>` : ''
  const grelha = linhas.length ? `
  <tr><td class="pad" style="padding:24px 44px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-left:2px solid ${GOLD};">
      ${linhas.map((l, i) => `<tr>
        <td class="col" valign="top" width="55%" style="padding:${i ? 16 : 0}px 12px 0 18px;">${campo(l[0])}</td>
        <td class="col" valign="top" width="45%" style="padding:${i ? 16 : 0}px 0 0 12px;">${campo(l[1])}</td>
      </tr>`).join('')}
    </table>
  </td></tr>` : ''
  const notch = (lado: 'l' | 'r') => `<td width="18" style="width:18px;font-size:0;line-height:0;">
        <div style="width:18px;height:36px;background:${BG};border-radius:${lado === 'l' ? '0 18px 18px 0' : '18px 0 0 18px'};border:1px solid rgba(216,190,147,.35);border-${lado === 'l' ? 'left' : 'right'}:0;"></div></td>`
  const foto = `${SITE}/email/equipa-camera.jpg`

  return `<!DOCTYPE html>
<html lang="pt"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Cormorant+Garamond:ital,wght@1,300&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:${BG};}
  a{text-decoration:none;}
  @media (max-width:540px){
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .nome{font-size:46px !important;}
    .col{display:block !important;width:100% !important;padding:14px 0 0 18px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG};">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${esc(o.preheader)}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${BG}" style="background:${BG};padding:28px 10px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" role="presentation" bgcolor="${CARD}" style="max-width:520px;width:100%;background:${CARD};border:1px solid rgba(216,190,147,.35);border-radius:24px;overflow:hidden;">

  <tr><td background="${foto}" bgcolor="${CARD}" valign="top"
    style="background:${CARD} url('${foto}') center/cover no-repeat;background-image:url('${foto}');background-size:cover;background-position:center;padding:0 0 0 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="border-left:1px solid rgba(201,168,76,.45);padding:36px 28px 30px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td><img src="${SITE}/logo_rl_gold.png" width="40" alt="RL" style="display:block;width:40px;height:auto;border:0;"></td>
          <td align="right"><span style="display:inline-block;padding:7px 15px;border:1px solid rgba(216,190,147,.6);border-radius:999px;background:rgba(216,190,147,.12);font-family:${MONO};font-size:10px;letter-spacing:.28em;color:${GOLD_SOFT};">${esc(o.pill.toUpperCase())}</span></td>
        </tr></table>
        <div style="height:120px;line-height:120px;font-size:0;">&nbsp;</div>
        <p style="margin:0;font-family:${COND};font-weight:700;font-size:12px;letter-spacing:.5em;color:${OURO};">RL PHOTO.VIDEO</p>
        <p class="nome" style="margin:8px 0 0;font-family:${COND};font-weight:700;font-size:56px;line-height:.92;text-transform:uppercase;color:#ffffff;">${nome}</p>
        ${linhaFuncao ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;"><tr>
          <td width="30" style="width:30px;"><div style="width:30px;height:1px;background:${OURO};font-size:0;line-height:0;">&nbsp;</div></td>
          <td style="padding-left:12px;font-family:${COND};font-size:13px;letter-spacing:.22em;color:rgba(255,255,255,.7);">${linhaFuncao}</td>
        </tr></table>` : ''}
      </td>
    </tr></table>
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
    ${o.texto ? `<p style="margin:12px 0 0;font-family:${COND};font-size:15px;line-height:1.55;color:rgba(255,255,255,.6);">${esc(o.texto)}</p>` : ''}
  </td></tr>
${grelha}
${o.extra ? `  <tr><td class="pad" style="padding:24px 44px 0;">${o.extra}</td></tr>` : ''}
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
      <td align="right" style="font-family:${MONO};font-size:10px;letter-spacing:.18em;color:rgba(255,255,255,.42);"><span style="color:${GOLD};">Photo · Video</span> · A Equipa</td>
    </tr></table>
  </td></tr>

</table>
${o.cta ? `<p style="margin:16px 0 0;font-family:${MONO};font-size:10px;color:rgba(255,255,255,.3);">O botão não abre? <a href="${esc(o.cta.url)}" style="color:${GOLD};text-decoration:underline;word-break:break-all;">${esc(o.cta.url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
</td></tr>
</table>
</body></html>`
}

/** Campos do evento, comuns a quase todos os cards da equipa. */
export function camposEvento(ev: { noivos?: string | null; data?: string | null; local?: string | null; referencia?: string | null }): CampoBilhete[] {
  return [
    { k: /^BAT/i.test(String(ev.referencia ?? '')) ? 'Batizado' : 'Casamento', v: ev.noivos ?? '' },
    { k: 'Data', v: dataBilhete(ev.data), mono: true },
    { k: 'Local', v: ev.local ?? '' },
    { k: 'Referência', v: ev.referencia ?? '', mono: true },
  ]
}
