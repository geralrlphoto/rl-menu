// Emails a noivos e leads, partilhados entre as rotas de envio e a pré-visualização
// da página Tickets (/api/jornada/email).

import { buildBilheteNoivos, blocoChave, blocoPassos, nomesBilhete } from './bilheteNoivos'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'

/** "🔑 A vossa palavra-passe do portal": recuperação da palavra-passe pelos noivos (noivos-recover). */
export function buildRecoveryEmail(opts: {
  nome: string
  password: string
  loginUrl: string
}): string {
  return buildBilheteNoivos({
    chave: 'recuperar',
    pill: 'A vossa palavra-passe',
    nomes: nomesBilhete(opts.nome) || 'Para vocês',
    tipo: opts.loginUrl.includes('batizado') ? 'batizado' : 'casamento',
    frase: 'Confirmámos a vossa identidade. Aqui está a chave do vosso portal.',
    extra: blocoChave(null, opts.password),
    cta: { label: 'Entrar no portal', url: opts.loginUrl },
    nota: 'Se não foram vocês que pediram, ignorem este email.<br>Em caso de dúvida, falem connosco diretamente.',
    preheader: 'A palavra-passe do vosso portal.',
  })
}

/** "✓ Dados recebidos": confirmação aos noivos quando enviam os dados do contrato e o portal ainda não foi enviado (contrato-cps). */
export function buildDadosRecebidosEmail(data: { nome_noivos: string; data_casamento: string | null; tipo_evento?: string }): string {
  const isBatizado = data.tipo_evento === 'batizado'
  return buildBilheteNoivos({
    chave: 'dados-recebidos',
    pill: 'Dados recebidos',
    nomes: nomesBilhete(data.nome_noivos) || data.nome_noivos,
    data: data.data_casamento,
    tipo: isBatizado ? 'batizado' : 'casamento',
    frase: 'Recebemos os vossos dados para o contrato. Em breve entraremos em contacto.',
    campos: [
      { k: isBatizado ? 'Pais' : 'Noivos', v: data.nome_noivos },
      { k: 'Próximo passo', v: 'Contrato e portal' },
    ],
    cta: { label: 'Falar connosco', url: `mailto:${ADMIN_EMAIL}` },
    nota: `Para qualquer questão estamos sempre disponíveis.<br>${ADMIN_EMAIL}`,
    preheader: 'Recebemos os vossos dados.',
  })
}

/** "Pedido recebido": resposta ao casal que pediu disponibilidade no kit do Sirius Park
 *  (/parceria/sirius-park/casais, pedido-disponibilidade). Foto do espaço no topo. */
export function buildPedidoSiriusEmail(nome: string, data: string): string {
  const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')
  const dataLonga = /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? new Date(`${data}T12:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
    : data
  return buildBilheteNoivos({
    chave: 'pedido-disponibilidade',
    pill: 'Pedido recebido',
    nomes: nomesBilhete(nome) || 'Obrigado',
    data,
    fundo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/parcerias/sirius-park/espaco/sirius-bilhete.jpg`,
    frase: 'Obrigado pelo vosso pedido. Vamos verificar a disponibilidade para o vosso dia e já entramos em contacto convosco.',
    campos: [
      { k: 'O vosso dia', v: dataLonga },
      { k: 'Local', v: 'Sirius Park' },
    ],
    extra: blocoPassos(['Pedido', 'Verificação', 'Conversa', 'Data reservada'], 1),
    cta: { label: 'Ver o nosso trabalho', url: `${SITE}/parceria/sirius-park/casais#trabalho` },
    nota: `Alguma dúvida? Respondam a este email ou liguem para o 912 932 768.<br>${ADMIN_EMAIL}`,
    preheader: 'Vamos verificar a vossa data e já entramos em contacto.',
  })
}

/** "Recebemos o vosso contacto": resposta automática à lead do formulário /nova-lead (nova-lead). */
export function buildNovaLeadEmail(nome: string, servicosList: string): string {
  return buildBilheteNoivos({
    chave: 'nova-lead',
    pill: 'Mensagem recebida',
    nomes: nomesBilhete(nome) || 'Obrigado',
    frase: 'Obrigado pelo vosso contacto. Recebemos a vossa mensagem e entraremos em contacto convosco em breve.',
    texto: 'Enquanto aguardam, inspirem-se no nosso blog com histórias de casamentos que eternizámos.',
    campos: [{ k: 'Serviços', v: servicosList }],
    cta: { label: 'Ver o blog', url: 'https://www.rlprod.pt/blog-list1' },
    preheader: 'Recebemos a vossa mensagem.',
  })
}
