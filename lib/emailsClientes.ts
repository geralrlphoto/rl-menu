// Emails a noivos e leads, partilhados entre as rotas de envio e a pré-visualização
// da página Tickets (/api/jornada/email).

import { buildBilheteNoivos, blocoChave, nomesBilhete } from './bilheteNoivos'

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
