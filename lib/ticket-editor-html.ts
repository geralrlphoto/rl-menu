// "Ticket de Edição": o email que o editor de vídeo recebe quando é nomeado
// para um casamento (PATCH /api/evento-equipa com editor_video). Mesmo
// desenho do Ticket Fotos/Dia (lib/ticket-html.ts).

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

export function buildTicketEditorHtml(t: TicketEditor): string {
  const row = (label: string, value: string, strong = false) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value}</td></tr>`
  const passo = (n: string, titulo: string, texto: string) => `
    <tr><td style="padding:8px 0;vertical-align:top;width:34px;">
      <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;background:#0b0a08;color:#d8be93;font-size:11px;text-align:center;font-family:Arial,sans-serif;">${n}</span>
    </td><td style="padding:8px 0;font-size:12px;color:#3a352e;line-height:1.6;"><strong style="color:#0b0a08;">${titulo}</strong> ${texto}</td></tr>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Ticket de Edição</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#3a352e;line-height:1.7;">
            Olá ${esc(t.editor.split(/\s+/)[0] || t.editor)}, foste nomeado editor de vídeo deste casamento. Aqui fica o ticket com o essencial.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${row('Nº do ticket', esc(t.numero), true)}
            ${row('Atribuído em', t.atribuidoEm.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Lisbon' }))}
            ${row('Editor', esc(t.editor))}
            ${row('Noivos', esc(t.noivos), true)}
            ${t.dataCasamento ? row('Data do casamento', dataLonga(t.dataCasamento)) : ''}
            ${t.local ? row('Local', esc(t.local)) : ''}
            ${t.prazo ? row('Prazo de entrega do filme', dataLonga(t.prazo), true) : ''}
          </table>
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8c7a55;font-family:Arial,sans-serif;">Próximos passos</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${passo('1', 'Confirmar.', 'Abre o teu painel e confirma que recebeste o projeto e os ficheiros (até 2 dias).')}
              ${passo('2', 'Teaser / Trailer.', 'Primeira peça para os noivos partilharem. Objetivo: 4 semanas.')}
              ${passo('3', 'Montagem.', 'Filme com cor e áudio dos votos e discursos. Vai mudando a fase no painel.')}
              ${passo('4', 'Revisão.', 'Envia o link de revisão no painel. A RL revê e manda as notas.')}
            </table>
          </div>
          <div style="margin:24px 0 0;padding:20px 18px;background:#0b0a08;border-radius:4px;text-align:center;">
            <p style="margin:0 0 14px;font-size:12px;color:#c9b88a;line-height:1.7;">O projeto já está no teu Painel do Editor.</p>
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
