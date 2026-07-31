// Gerador do "Ticket Fotos/Dia" — o mesmo documento que o cliente recebe por
// email. Partilhado entre o envio do ticket e a preparação de impressão, para
// a cópia colocada na pasta ser idêntica ao ticket do cliente.

const PRECO_FOTO = 5
const eur = (n: number) => `${Number(n).toFixed(2)} €`

export function buildTicketHtml(o: any): string {
  const data = new Date(o.created_at ?? Date.now()).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  const isPapel = o.formato === 'papel'
  const fotos = String(o.fotografias ?? '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
  const row = (label: string, value: string, strong = false) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value ?? ''}</td></tr>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Ticket Fotos/Dia</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${row('Nº do pedido', o.pedido, true)}
            ${row('Data', data)}
            ${o.responsavel ? row('Responsável pela venda', o.responsavel) : ''}
            ${row('Cliente', o.nome)}
            ${o.noivos ? row('Nome dos noivos', o.noivos) : ''}
            ${o.data_casamento ? row('Data do casamento', o.data_casamento) : ''}
            ${o.email ? row('Email', o.email) : ''}
            ${o.telefone ? row('Telefone', o.telefone) : ''}
            ${isPapel && o.morada ? row('Morada', o.morada) : ''}
            ${row('Formato', isPapel ? 'Papel (carta registada)' : 'Digital')}
            ${row(`Fotografias (× ${eur(PRECO_FOTO)})`, String(o.quantidade))}
            ${fotos.length ? row('Nº das fotografias', fotos.join(', ')) : ''}
            ${o.subtotal != null ? row('Subtotal', eur(o.subtotal)) : ''}
            ${o.portes != null ? row('Portes', o.portes > 0 ? eur(o.portes) : 'Grátis') : ''}
            ${o.total != null ? row('TOTAL', eur(o.total), true) : ''}
            ${o.metodo_pagamento ? row('Método de pagamento', o.metodo_pagamento, true) : ''}
            ${o.metodo_pagamento === 'MBWay' && o.mbway_conta ? row('Conta MB WAY', o.mbway_conta) : ''}
          </table>
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0;font-size:12px;color:#3a352e;line-height:1.7;">
              <strong style="color:#0b0a08;">Prazo de entrega:</strong>
              ${isPapel ? 'até 30 dias úteis, por carta registada.' : 'até 15 dias úteis (entrega digital).'}
            </p>
          </div>
          <div style="margin:12px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0;font-size:12px;color:#3a352e;line-height:1.7;">
              <strong style="color:#0b0a08;">Quer uma tela?</strong>
              Se mais tarde quiser transformar alguma destas fotografias numa tela para a sua casa, é só entrar em contacto connosco. Teremos todo o gosto em tratar disso.
            </p>
          </div>
        </td></tr>
        <tr><td style="background:#0b0a08;padding:18px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8c8170;">geral.rlphoto@gmail.com · 912 832 788</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
