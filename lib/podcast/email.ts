/* ============================================================
   Notificação por email ao Rui, em cada submissão.
   Usa o Resend, que já é o serviço de email do projeto.
   Falhar o email nunca pode falhar a submissão: o lead já está
   guardado quando isto corre.
   ============================================================ */

const DESTINO = 'geral.rlphoto@gmail.com'
const REMETENTE = 'RL PROD <geral@rlphotovideo.pt>'

function moldura(titulo: string, linhas: [string, string][]) {
  const celulas = linhas
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a6340;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:10px 0 10px 20px;font-size:14px;color:#f0e8d8;">${v}</td>
      </tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:36px 44px;font-family:Georgia,'Times New Roman',serif;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;">Antes do Sim</p>
          <p style="margin:0 0 24px;font-size:26px;color:#f0e8d8;font-style:italic;">${titulo}</p>
          <table width="100%" cellpadding="0" cellspacing="0">${celulas}</table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function enviar(assunto: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: REMETENTE, to: [DESTINO], subject: assunto, html }),
    })
  } catch (e) {
    console.error('[podcast] email nao enviado', e)
  }
}

export async function avisarLead(d: {
  nome: string; email: string; telefone: string | null
  data_casamento: string | null; local: string | null
  servico_interesse: string | null; episodio?: string | null
}) {
  await enviar(
    `Novo contacto do podcast — ${d.nome}`,
    moldura('Novo contacto', [
      ['Nome', d.nome],
      ['Email', d.email],
      ['Telefone', d.telefone ?? ''],
      ['Data prevista', d.data_casamento ?? ''],
      ['Local', d.local ?? ''],
      ['Interesse', d.servico_interesse ?? ''],
      ['Veio do episódio', d.episodio ?? ''],
    ]),
  )
}

export async function avisarCandidatura(d: {
  nome: string; email: string; telefone: string | null
  empresa: string | null; area: string; zona: string | null
  porque_tema: string | null; links: string | null
}) {
  await enviar(
    `Candidatura a convidado — ${d.nome}`,
    moldura('Candidatura a convidado', [
      ['Nome', d.nome],
      ['Email', d.email],
      ['Telefone', d.telefone ?? ''],
      ['Empresa', d.empresa ?? ''],
      ['Área', d.area],
      ['Zona', d.zona ?? ''],
      ['Tema', d.porque_tema ?? ''],
      ['Links', d.links ?? ''],
    ]),
  )
}
