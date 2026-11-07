/* Janela de follow-up do calendário dos 30 dias: opções de mensagem e script de telefonema para
   cada fase. Sem emojis nas mensagens (viram "?" no wa.me). A password das propostas nunca vai aqui. */
import {
  ASSINATURA, mensagemFollowUp, mensagemFollowUp2, mensagemFollowUp3,
  mensagemFollowUpContacto1, mensagemFollowUpContacto2,
} from '@/lib/crm'
import { linkPublico } from '@/lib/site-url'

export type TipoFollow = 'contacto1' | 'contacto2' | 'follow1' | 'follow2' | 'follow3'
type Lead = { nome: string; id: string; dataCasamento?: string | null }
export type Opcao = { titulo: string; texto: string }
export type Script = {
  objetivo: string
  abertura: string
  perguntas: string[]
  fecho: string
  objecoes: { se: string; resposta: string }[]
  semResposta: string
}

const texto = (nome: string, linhas: string[]) => {
  const quem = nome.trim()
  return [`Olá${quem ? ' ' + quem : ''}!`, '', ...linhas, '', ...ASSINATURA].join('\n')
}

export function opcoesFollowUp(tipo: TipoFollow, l: Lead): Opcao[] {
  const portal = linkPublico(`/reuniao/${l.id}`)
  if (tipo === 'contacto1') return [
    { titulo: 'Confirmar que receberam', texto: mensagemFollowUpContacto1(l.nome, l.id) },
    { titulo: 'Curta e direta', texto: texto(l.nome, [
      'Já conseguiram ver o vosso portal? Basta escolherem o dia e a hora para a nossa reunião, não demora mais de um minuto:',
      portal,
    ]) },
    { titulo: 'Se os horários não derem jeito', texto: texto(l.nome, [
      'Sabemos que nem sempre é fácil acertar agendas. Se nenhum dos horários do portal vos der jeito, escolham "Outro horário" e indiquem o que preferirem, ou digam-nos aqui por mensagem e ajustamo-nos a vocês:',
      portal,
    ]) },
  ]
  if (tipo === 'contacto2') return [
    { titulo: 'Última mensagem', texto: mensagemFollowUpContacto2(l.nome, l.id) },
    { titulo: 'Porta aberta', texto: texto(l.nome, [
      'Sabemos que esta fase traz muitas decisões ao mesmo tempo, por isso não queremos insistir.',
      '',
      'Se quiserem conversar, o vosso portal continua disponível para marcarem a reunião quando vos fizer sentido:',
      portal,
      '',
      'E se já tiverem outros planos, digam-nos só, sem problema nenhum. Desejamos-vos um dia muito feliz.',
    ]) },
  ]
  if (tipo === 'follow1') return [
    { titulo: 'Emotiva, para bloquear a data', texto: mensagemFollowUp(l.nome, l.dataCasamento) },
    { titulo: 'Ajudar com dúvidas', texto: texto(l.nome, [
      'Sabemos que esta é uma decisão importante e queremos que a tomem com toda a tranquilidade.',
      '',
      'Ficou alguma dúvida depois da nossa reunião? Se quiserem esclarecer algum ponto da proposta ou ajustar algo, é só dizerem-nos.',
    ]) },
    { titulo: 'Curta', texto: texto(l.nome, [
      'Já conseguiram ver a nossa proposta com calma? Ficamos a aguardar a vossa opinião, sem pressas.',
    ]) },
  ]
  if (tipo === 'follow2') return [
    { titulo: 'Emotiva, a data não fica livre muito tempo', texto: mensagemFollowUp2(l.nome, l.dataCasamento) },
    { titulo: 'Oferecer ajustar a proposta', texto: texto(l.nome, [
      'Estivemos a pensar em vocês. Se houver alguma coisa na proposta que não encaixe no que imaginam, digam-nos: podemos ajustar os serviços para ficar à vossa medida.',
      '',
      'O importante é que fique bem para vocês.',
    ]) },
  ]
  return [{ titulo: 'Última tentativa', texto: mensagemFollowUp3(l.nome, l.dataCasamento) }]
}

const SCRIPT_CONTACTO: Script = {
  objetivo: 'Criar ligação e deixar a reunião marcada durante a chamada.',
  abertura: 'Olá [nome], daqui é o Rui da RL Photo.Video, tudo bem? Enviámos-vos o vosso portal para marcarmos a reunião e quis ligar-vos, porque uma conversa vale mais do que muitas mensagens. É um bom momento para falarmos dois minutinhos?',
  perguntas: [
    'Conseguiram abrir o portal?',
    'Já têm o local do casamento escolhido?',
    'O que é mais importante para vocês nas fotografias e no filme?',
  ],
  fecho: 'Aqui na RL gostamos de conhecer os nossos noivos antes de falar de propostas, por isso fazemos sempre uma reunião, por videochamada ou no estúdio, sem compromisso. Podemos ver agora um dia que vos dê jeito? Eu deixo já reservado.',
  objecoes: [
    { se: 'Só queremos saber preços', resposta: 'Percebo perfeitamente. Não enviamos valores por mensagem porque cada casamento é diferente e queremos propor-vos o que faz sentido para vocês. Na reunião mostramos tudo, com valores, e saem com o que precisam para decidir com calma.' },
    { se: 'Agora não temos tempo', resposta: 'Sem problema nenhum. Quando é melhor voltarmos a falar? Fico com isso apontado. (Regista a data na próxima ação da ficha.)' },
    { se: 'Já fechámos com outro fornecedor', resposta: 'Fico muito contente por terem encontrado quem vos acompanhe. Só por curiosidade, o que pesou mais na vossa escolha? Desejamos-vos um dia muito feliz. (Muda o estado para Não fechou, com o motivo.)' },
  ],
  semResposta: 'Se não atenderem, não deixes recado: envia a mensagem de WhatsApp desta fase.',
}

const SCRIPT_PROPOSTA: Script = {
  objetivo: 'Perceber em que ponto está a decisão e, se fizer sentido, bloquear a data.',
  abertura: 'Olá [nome], daqui é o Rui da RL Photo.Video, tudo bem? Ficámos a pensar na nossa conversa e quis saber como estão. É um bom momento para falarmos dois minutinhos?',
  perguntas: [
    'Conseguiram ver a proposta com calma?',
    'Ficou alguma dúvida ou alguma coisa que gostassem de ajustar?',
    'Há mais alguém que vá ajudar na decisão?',
  ],
  fecho: 'Se sentirem que faz sentido, podemos bloquear já a vossa data, para ficarem descansados. O que acham?',
  objecoes: [
    { se: 'Está acima do orçamento', resposta: 'Obrigado por me dizerem. O que pesa mais para vocês? Podemos ajustar os serviços para a proposta ficar à vossa medida, sem perder o que é mais importante.' },
    { se: 'Ainda estamos a decidir', resposta: 'Claro, é uma decisão importante. Até quando acham que vão decidir? Assim sei quando voltar a falar convosco. (Regista a data na próxima ação da ficha.)' },
    { se: 'Escolhemos outro fornecedor', resposta: 'Obrigado por nos dizerem. Só para aprendermos, o que pesou mais? Foi um prazer conhecer-vos e desejamos-vos um dia inesquecível. (Muda o estado para Não fechou, com o motivo.)' },
  ],
  semResposta: 'Se não atenderem, não deixes recado: envia a mensagem de WhatsApp desta fase.',
}

export const scriptTelefone = (tipo: TipoFollow): Script =>
  tipo === 'contacto1' || tipo === 'contacto2' ? SCRIPT_CONTACTO : SCRIPT_PROPOSTA
