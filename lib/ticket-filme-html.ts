// "Ticket do Filme": o email que os noivos recebem a cada passo da edição do vídeo
// (Departamento de Edição de Vídeo, via lib/videoEstado.ts) e quando a estreia é
// marcada (/api/edicao-video/entregar). Mesmo desenho do Ticket Fotos/Dia (lib/ticket-html.ts).

import { SITE_URL } from '@/lib/site-url'
import { portalPathFor } from '@/lib/noivos-session'

export type PassoFilme = 'Aguardar' | 'Em Edição' | 'Em Revisão' | 'Finalizado' | 'Estreia'

const PASSOS: { k: PassoFilme; rotulo: string }[] = [
  { k: 'Aguardar', rotulo: 'Editor' },
  { k: 'Em Edição', rotulo: 'Edição' },
  { k: 'Em Revisão', rotulo: 'Revisão' },
  { k: 'Finalizado', rotulo: 'Pronto' },
  { k: 'Estreia', rotulo: 'Estreia' },
]

/** Título e texto de cada passo (o que os noivos leem). */
export const MENSAGEM_PASSO: Record<PassoFilme, { titulo: string; texto: string }> = {
  'Aguardar': {
    titulo: 'O vosso filme já tem editor',
    texto: 'O vosso dia já está nas mãos de quem o vai contar. O editor recebeu todas as imagens e vai começar a escolher os momentos que ficam para sempre.',
  },
  'Em Edição': {
    titulo: 'O vosso filme começou a ganhar forma',
    texto: 'Neste momento estamos a rever cada plano do vosso dia: os olhares na cerimónia, os votos, as gargalhadas da festa. É aqui que a vossa história começa a nascer.',
  },
  'Em Revisão': {
    titulo: 'Estamos a ver o vosso filme pela primeira vez',
    texto: 'A primeira versão está pronta e estamos a vê-la do princípio ao fim, com atenção ao ritmo, à cor e ao som. Só sai daqui quando nos arrepiar.',
  },
  'Finalizado': {
    titulo: 'O vosso filme está pronto',
    texto: 'Está terminado. Falta só prepararmos a entrega: em breve fica no vosso portal, para o verem pela primeira vez.',
  },
  'Estreia': {
    titulo: 'A estreia do vosso filme está marcada',
    texto: 'Escolhemos um momento especial para o verem pela primeira vez. À hora marcada, o filme aparece no vosso portal. Preparem o sofá, chamem quem quiserem e vejam juntos.',
  },
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** "sábado, 25 de outubro às 21h00" (hora de Lisboa) */
export function dataEstreia(iso: string): string {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Lisbon' })
  const hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).replace(':', 'h')
  return `${dia} às ${hora}`
}

export function buildTicketFilmeHtml(t: {
  passo: PassoFilme
  referencia: string
  noivos: string
  estreia?: string | null      // ISO, só no passo Estreia
  batizado?: boolean
}): string {
  const m = MENSAGEM_PASSO[t.passo]
  const atual = PASSOS.findIndex(p => p.k === t.passo)
  const portal = `${SITE_URL}${portalPathFor(t.referencia, t.batizado ? 'batizado' : 'casamento')}`
  const hoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Lisbon' })
  const linha = (label: string, value: string, strong = false) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value}</td></tr>`
  const passos = PASSOS.map((p, i) => {
    const feito = i <= atual
    return `<td align="center" style="padding:0 2px;width:20%;">
      <span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:50%;font-size:11px;font-family:Arial,sans-serif;text-align:center;
        background:${i === atual ? '#0b0a08' : feito ? '#d8be93' : '#f3ede1'};color:${i === atual ? '#d8be93' : feito ? '#0b0a08' : '#b3a68a'};border:1px solid ${feito ? '#d8be93' : '#e6dcc8'};">${feito && i < atual ? '&#10003;' : i + 1}</span>
      <p style="margin:6px 0 0;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-family:Arial,sans-serif;color:${i === atual ? '#0b0a08' : '#8c8170'};font-weight:${i === atual ? 700 : 400};">${p.rotulo}</p>
    </td>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Ticket do Filme</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 6px;font-size:13px;color:#8c7a55;font-style:italic;">Olá, ${esc(t.noivos)}</p>
          <p style="margin:0 0 14px;font-size:24px;color:#0b0a08;line-height:1.25;">${m.titulo}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#3a352e;line-height:1.7;">${m.texto}</p>
          ${t.passo === 'Estreia' && t.estreia ? `
          <div style="margin:0 0 24px;padding:22px 18px;background:#0b0a08;border-radius:4px;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#8c7a55;font-family:Arial,sans-serif;">Estreia</p>
            <p style="margin:0;font-size:22px;color:#d8be93;font-style:italic;">${esc(dataEstreia(t.estreia))}</p>
          </div>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>${passos}</tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${linha('Nº do ticket', `FL-${esc(t.referencia)}`, true)}
            ${linha('Data', hoje)}
            ${linha('Noivos', esc(t.noivos), true)}
            ${linha('Passo', `${atual + 1} de ${PASSOS.length} · ${PASSOS[atual].rotulo}`)}
          </table>
          <div style="margin:24px 0 0;padding:20px 18px;background:#0b0a08;border-radius:4px;text-align:center;">
            <p style="margin:0 0 14px;font-size:12px;color:#c9b88a;line-height:1.7;">Acompanhem o vosso filme no portal, em O Nosso Filme.</p>
            <a href="${portal}"
              style="display:inline-block;padding:13px 30px;background:#d8be93;color:#0b0a08;border-radius:40px;
                     font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-weight:700;">
              Abrir o portal
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#0b0a08;padding:18px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8c8170;">geral.rlphoto@gmail.com · 912 932 768</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
