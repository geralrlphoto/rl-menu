// Tickets por email aos editores de vídeo, com o desenho do Ticket Fotos/Dia (lib/ticket-html.ts):
//  · Ticket de Edição: quando é nomeado (PATCH /api/evento-equipa com editor_video)
//  · Ticket de Aprovação: quando a RL aprova o vídeo (PATCH /api/painel-editor/video-revisao)

import { SITE_URL } from '@/lib/site-url'

export type TicketEditor = {
  numero: string            // ED-<referência>
  editor: string
  noivos: string
  dataCasamento: string | null   // AAAA-MM-DD
  local: string | null
  prazo: string | null           // AAAA-MM-DD (casamento + 180 dias úteis)
  atribuidoEm: Date
}

const PRAZO_DIAS_UTEIS = 180

/** Casamento + 180 dias úteis (seg a sex), como no resto da app. */
export function prazoVideo(dataCasamento: string | null): string | null {
  if (!dataCasamento) return null
  const d = new Date(dataCasamento.slice(0, 10) + 'T12:00:00Z')
  if (isNaN(d.getTime())) return null
  let n = 0
  while (n < PRAZO_DIAS_UTEIS) {
    d.setUTCDate(d.getUTCDate() + 1)
    const w = d.getUTCDay()
    if (w !== 0 && w !== 6) n++
  }
  return d.toISOString().slice(0, 10)
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const dataLonga = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })

export type TicketAprovacao = {
  numero: string            // AP-<referência>
  editor: string
  noivos: string
  local: string | null
  link: string | null       // link de revisão aprovado
  feedback: string | null   // notas da RL (opcional)
  aprovadoEm: Date
}

const linha = (label: string, value: string, strong = false) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value}</td></tr>`
const passo = (n: string, titulo: string, texto: string) => `
    <tr><td style="padding:8px 0;vertical-align:top;width:34px;">
      <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;background:#0b0a08;color:#d8be93;font-size:11px;text-align:center;font-family:Arial,sans-serif;">${n}</span>
    </td><td style="padding:8px 0;font-size:12px;color:#3a352e;line-height:1.6;"><strong style="color:#0b0a08;">${titulo}</strong> ${texto}</td></tr>`
const dataHoje = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Lisbon' })

/** Moldura comum dos tickets dos editores. */
function moldura(o: { titulo: string; intro: string; linhas: string; extra?: string; passos: string; nota: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">${o.titulo}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#3a352e;line-height:1.7;">${o.intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">${o.linhas}
          </table>${o.extra ?? ''}
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8c7a55;font-family:Arial,sans-serif;">Próximos passos</p>
            <table width="100%" cellpadding="0" cellspacing="0">${o.passos}
            </table>
          </div>
          <div style="margin:24px 0 0;padding:20px 18px;background:#0b0a08;border-radius:4px;text-align:center;">
            <p style="margin:0 0 14px;font-size:12px;color:#c9b88a;line-height:1.7;">${o.nota}</p>
            <a href="${SITE_URL}/painel-editor"
              style="display:inline-block;padding:13px 30px;background:#d8be93;color:#0b0a08;border-radius:40px;
                     font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-weight:700;">
              Abrir o meu painel
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

const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] || n

export function buildTicketEditorHtml(t: TicketEditor): string {
  return moldura({
    titulo: 'Ticket de Edição',
    intro: `Olá ${esc(primeiroNome(t.editor))}, foste nomeado editor de vídeo deste casamento. Aqui fica o ticket com o essencial.`,
    linhas: linha('Nº do ticket', esc(t.numero), true)
      + linha('Atribuído em', dataHoje(t.atribuidoEm))
      + linha('Editor', esc(t.editor))
      + linha('Noivos', esc(t.noivos), true)
      + (t.dataCasamento ? linha('Data do casamento', dataLonga(t.dataCasamento)) : '')
      + (t.local ? linha('Local', esc(t.local)) : '')
      + (t.prazo ? linha('Prazo de entrega do filme', dataLonga(t.prazo), true) : ''),
    passos: passo('1', 'Confirmar.', 'Abre o teu painel e confirma que recebeste o projeto e os ficheiros (até 2 dias).')
      + passo('2', 'Teaser / Trailer.', 'Primeira peça para os noivos partilharem. Objetivo: 4 semanas.')
      + passo('3', 'Montagem.', 'Filme com cor e áudio dos votos e discursos. Vai mudando a fase no painel.')
      + passo('4', 'Revisão.', 'Envia o link de revisão no painel. A RL revê e manda as notas.'),
    nota: 'O projeto já está no teu Painel do Editor.',
  })
}

export function buildTicketAprovacaoHtml(t: TicketAprovacao): string {
  const notas = t.feedback?.trim()
    ? `
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8c7a55;font-family:Arial,sans-serif;">Notas da RL</p>
            <p style="margin:0;font-size:13px;color:#3a352e;line-height:1.7;white-space:pre-line;">${esc(t.feedback.trim())}</p>
          </div>`
    : ''
  return moldura({
    titulo: 'Ticket de Aprovação',
    intro: `Olá ${esc(primeiroNome(t.editor))}, o filme deste casamento foi aprovado. Obrigado pelo trabalho! Falta só fechar o projeto.`,
    linhas: linha('Nº do ticket', esc(t.numero), true)
      + linha('Aprovado em', dataHoje(t.aprovadoEm))
      + linha('Editor', esc(t.editor))
      + linha('Noivos', esc(t.noivos), true)
      + (t.local ? linha('Local', esc(t.local)) : '')
      + (t.link ? linha('Versão aprovada', `<a href="${esc(t.link)}" style="color:#8c6d2e;">abrir</a>`) : ''),
    extra: notas,
    passos: passo('1', 'Master.', 'Exporta a versão final em alta qualidade.')
      + passo('2', 'Finalizado.', 'Muda a fase do projeto para Finalizado no teu painel.')
      + passo('3', 'Entrega.', 'Envia o master pelo painel. A RL faz a entrega aos noivos no portal.')
      + passo('4', 'Arquivo.', 'Guarda o projeto e o master no NAS.'),
    nota: 'O projeto continua no teu Painel do Editor até à entrega.',
  })
}
