/* ──────────────────────────────────────────────────────────────
   JORNADA DO CLIENTE  ·  dados do mapa de /crm/follow-up
   Fases, passos, ligações, tarefas, mensagens e emails.
   A parte visual está em app/crm/follow-up/.

   As mensagens com botão no CRM vêm de lib/crm.ts (a mesma fonte
   que o quadro usa), por isso ficam sempre iguais. As mensagens de
   "copiar" (origens, objeções, guião) editam-se aqui em baixo e
   usam [nome], [data] e [hora] para substituir à mão.

   Ids dos passos: "<fase>-<passo>" (índices a contar de 0). O estado
   das tarefas fica no Supabase (tabela jornada_estado) com estes ids,
   por isso não se devem reordenar passos já existentes: acrescenta
   no fim da fase e ajusta o fluxo.
   ────────────────────────────────────────────────────────────── */
import {
  mensagemBoasVindas, mensagemMarcarReuniao, mensagemPortalReuniao, mensagemLembreteReuniao,
  mensagemFollowUp, mensagemFollowUp2, mensagemFollowUp3, mensagemFecho, mensagemObrigadoEscolha,
  mensagemNaoAceitou, mensagemLembreteAdjudicacao, mensagemFollowUpContacto1, mensagemFollowUpContacto2,
  mensagemPreWedding, mensagemLembreteMarcarPreWedding, mensagemVesperaPreWedding,
  mensagemReuniaoPreparacao, mensagemReuniaoAceite, mensagemReuniaoProposta, mensagemReuniaoIndisponivel,
  mensagemLembreteBriefing, mensagemLembretePreparacao, mensagemAvaliacaoGoogle, mensagemAniversario,
  FOLLOW_WA_DIAS, FOLLOW2_WA_DIAS, FOLLOW_PARADO_DIAS, PREPARACAO_DIAS, LEMBRETE_BRIEFING_DIAS,
  PREWEDDING_ALERTA_DIAS, LEMBRETE_PREWEDDING_DIAS, PRAZO_VIDEO_DIAS, MOTIVOS_NAO_FECHOU,
} from '@/lib/crm'
import { linkPublico } from '@/lib/site-url'

/* ── Tipos ── */
export type Quem = 'Rui' | 'Noivos' | 'Equipa' | 'Automático'

/** crm = sai pelo botão do CRM · copiar = envia-se à mão · nova = escrita para o fluxo novo, ainda sem botão */
export type Mensagem = { titulo: string; texto: string; tipo: 'crm' | 'copiar' | 'nova'; quando?: string }

/** preview = chave da pré-visualização real em /api/jornada/email (sem chave: ainda não há) */
export type Email = { assunto: string; preview?: string }

/** [quando, o quê, onde na app] */
export type Regra = [string, string, string?]

/** Contagens ao vivo do CRM, calculadas em /api/jornada */
export type Stats = { total: number; status: Record<string, number>; origem: Record<string, number> }

export type Passo = {
  id: string
  titulo: string
  sub: string
  descricao: string
  quem: Quem[]
  prazo: string
  onde: string
  tarefas: string[]
  mensagens?: Mensagem[]
  emails?: Email[]
  dica?: string
  regras?: Regra[]
  /** Dados reais (opcional): texto fixo ou calculado a partir do CRM */
  dados?: string | ((s: Stats) => string | null)
  /** Respostas prontas às objeções (só em Em negociação) */
  objecoes?: { titulo: string; resposta: string }[]
  /** Guião da chamada de 2 minutos (só nas Boas-vindas) */
  guiao?: boolean
  /** Simulador dos dias de follow-up (só no Follow Up 1) */
  simulador?: boolean
}

/**
 * Ligações dentro de uma fase (índices dos passos):
 *  seq    a → b, uma seta (vários b = bifurcação)
 *  baixo  b fica por baixo de a, ligado por uma seta vertical
 *  pos    posição manual [coluna, deslocamento vertical]; serve para pôr
 *         passos por cima (ligação para cima) ou numa linha por baixo
 *  saida  passos que ligam à fase seguinte
 *  atalho passo → fase alvo, por cima da fase do meio (tracejado verde)
 * Sem fluxo: todos os passos saem da fase em paralelo e todos são saída.
 */
export type Fluxo = {
  seq?: Record<number, number[]>
  baixo?: Record<number, number[]>
  pos?: Record<number, [number, number]>
  saida: number[]
  atalho?: Record<number, [number, string]>
  acima?: number[]   // passos empilhados por cima do cartão da fase
  abaixo?: boolean | number[]   // passos empilhados por baixo do cartão da fase: true = todos; lista = só esses (os outros seguem para a direita)
}

export type Fase = { titulo: string; sub: string; passos: Passo[]; fluxo?: Fluxo }

/* ── Casal de exemplo usado nas pré-visualizações (dados fictícios) ── */
export const EX = {
  nome: 'Ana',
  casamento: '2027-06-12',
  reuniaoData: '2026-11-04',
  reuniaoHora: '21:00',
  leadId: 'exemplo',
  eventoId: 'exemplo',
  quando: 'quarta, 4 de novembro, às 21h00',
}
const PORTAL_REUNIAO = linkPublico('/r/exemplo')
const FORM_URL = linkPublico('/nova-lead')

/* ── Mensagens de copiar (vêm da página antiga do follow up) ── */
const ORIGEM_SITE = {
  inicial: `Olá [nome], tudo bem? 😊

Muito obrigado por nos terem visitado e por preencherem o formulário no nosso site. Com as informações que nos deixaram, já ficámos com uma primeira ideia do vosso casamento e daquilo que procuram.

Ficámos muito felizes por terem chegado até nós. Cada casal tem uma história única e adoramos poder fazer parte de um dia tão especial.

O próximo passo é nosso: vamos analisar tudo com atenção e entramos em contacto convosco em breve.

Entretanto, espreitem o nosso Instagram, onde partilhamos casamentos reais e muitos momentos espontâneos. 📷 @rl.photo.video

Um abraço,
RL`,
  lembretes: [
    { quando: '2 a 3 dias sem resposta', texto: `Olá [nome], voltei a passar por aqui só para confirmar que a minha mensagem vos chegou. 🙂

Sei que esta fase de planeamento é uma correria. Sempre que fizer sentido para vocês, estou totalmente disponível para conversar sem qualquer compromisso.

Um abraço,
RL` },
    { quando: '~7 dias sem resposta', texto: `Olá [nome], espero que esteja tudo a correr bem com os preparativos. 💫

Queria só deixar a porta aberta. Se ainda estiverem a ponderar quem irá registar o vosso dia, adorava mostrar-vos o nosso trabalho e perceber se somos a escolha certa para vós.

Qualquer coisa, é só dizer. Um abraço,
RL` },
  ],
}

const ORIGEM_CASAMENTOS = {
  inicial: `Olá! 😊

Que bom ter-vos por aqui! Antes de mais, obrigado por terem entrado em contacto connosco. Agora queremos conhecer-vos um pouco melhor.

Preparámos um pequeno formulário que demora cerca de 2 minutos a preencher e que nos ajuda a perceber aquilo que procuram para o vosso casamento.

👉 ${FORM_URL}

Enquanto isso, espreitem o nosso Instagram. Lá partilhamos muitos casamentos reais e histórias de outros casais. 📷 @rl.photo.video

Assim que recebermos o vosso formulário, entramos em contacto para conversarmos com calma.

Mal podemos esperar para vos conhecer!`,
  lembretes: [
    { quando: '24h sem resposta · passar para WhatsApp', texto: `Olá! 🙂

Passámos por aqui só para confirmar que a nossa mensagem chegou. Sabemos que nesta fase estão a falar com vários fornecedores, por isso não queremos ocupar muito do vosso tempo.

Deixamos outra vez o formulário. São só 2 minutos e ajuda-nos a preparar tudo à vossa medida:

👉 ${FORM_URL}

Ficamos a aguardar. Um abraço!` },
    { quando: '~7 dias sem resposta', texto: `Olá! 💫

Esperamos que os preparativos estejam a correr bem. Continuamos disponíveis e adorávamos poder conhecer-vos melhor.

Se fizer sentido para vós, é só preencherem o formulário quando puderem:

👉 ${FORM_URL}

Um abraço!` },
  ],
}

const ORIGEM_DIRETO = {
  inicial: `Olá! 😊 Que bom ter-vos por aqui!

Obrigado por terem entrado em contacto connosco. Agora queremos conhecer-vos um pouco melhor.

Preparámos um pequeno formulário de 2 minutos que nos ajuda a perceber aquilo que procuram para o vosso casamento.

👉 ${FORM_URL}

Espreitem também o nosso Instagram: 📷 @rl.photo.video

Assim que recebermos o vosso formulário, entramos em contacto. Mal podemos esperar para vos conhecer! 🙌`,
  lembretes: [
    { quando: '1 a 2 dias sem resposta', texto: `Olá! 🙂 Só a dar um toque para não perdermos o contacto.

Se ainda não tiveram tempo, aqui fica outra vez o formulário. São 2 minutinhos:

👉 ${FORM_URL}

Estamos por aqui para o que precisarem! 🙌` },
    { quando: '4 a 5 dias sem resposta', texto: `Olá! 💫 Esperamos que esteja tudo bem com os preparativos.

Adorávamos fazer parte do vosso dia. Sempre que puderem, preencham o formulário e falamos com calma:

👉 ${FORM_URL}

Um abraço! 😊` },
  ],
}

function mensagensOrigem(o: typeof ORIGEM_SITE): Mensagem[] {
  return [
    { titulo: '1.ª mensagem', quando: 'Mesmo dia', texto: o.inicial, tipo: 'copiar' },
    ...o.lembretes.map((l, i) => ({ titulo: `${i + 1}.º lembrete`, quando: l.quando, texto: l.texto, tipo: 'copiar' as const })),
  ]
}
const regrasOrigem = (o: typeof ORIGEM_SITE): Regra[] => [
  ['Mesmo dia', '1.ª mensagem de resposta', 'Copiar e enviar'],
  ...o.lembretes.map((l, i): Regra => [l.quando, `${i + 1}.º lembrete`, 'Copiar e enviar']),
]

export const TELEFONEMA = {
  intro: 'Olá [nome], daqui é o Rui da RL Photo.Video, tudo bem? Recebi o vosso formulário, muito obrigado! Este é um momento oportuno para falarmos dois minutinhos?',
  perguntas: ['De onde são os noivos?', 'Onde será, possivelmente, a preparação do dia?'],
  fecho: 'Aqui na RL criamos uma relação de empatia e de amizade com os nossos noivos. Por isso privilegiamos sempre uma reunião, presencial ou por videochamada, para vos conhecermos e vocês nos conhecerem a nós. É também aí que vos mostramos o nosso método e os nossos serviços. Faz sentido marcarmos essa conversa?',
  destaque: 'Que disponibilidade têm em termos de horários? Assim ajustamo-nos a vocês e combinamos logo o melhor dia.',
}
export const textoTelefonema = () => ['ABERTURA', TELEFONEMA.intro, '', 'PERGUNTAR APENAS', ...TELEFONEMA.perguntas.map(p => '• ' + p), '', 'FECHO', TELEFONEMA.fecho, '', '➤ ' + TELEFONEMA.destaque].join('\n')

const AGUARDAR_AGENDAMENTO = `Olá [nome], tudo bem? 🙂

Ficámos de combinar a nossa reunião. Já conseguiram ver a vossa disponibilidade? Digam-me só dois ou três horários que vos deem jeito e eu ajusto-me a vocês.

Fico a aguardar. Um abraço,
RL`

const REUNIAO_DFP = `Foi um enorme prazer conversar convosco! 😊

Como combinado, deixámos o vosso DFP disponível no portal, com toda a nossa proposta. Vejam com calma e, qualquer dúvida, é só dizerem.

Um abraço,
RL`

const FECHOU_CONTRATO = `Que alegria ter-vos connosco! 🎉 Muito obrigado pela vossa confiança.

Para avançarmos, é só confirmarem a proposta no portal da reunião e preencherem os dados que vos são solicitados.

Dentro de 2 a 3 dias recebem o vosso portal dos noivos, com toda a informação reunida num só sítio.

Estamos muito felizes por fazer parte do vosso dia. Um abraço,
RL`

export const OBJECOES = [
  { titulo: 'Está acima do nosso orçamento', resposta: `Compreendo perfeitamente, e agradeço a franqueza. 🙂

O nosso trabalho reflete tudo o que está por trás: a experiência, o cuidado em cada detalhe e a tranquilidade de saberem que o vosso dia fica em boas mãos.

Se quiserem, vemos juntos uma solução ajustada ao que faz sentido para vós, sem abdicar do essencial. O que acham?` },
  { titulo: 'Vamos pensar / ainda estamos a decidir', resposta: `Claro, é uma decisão importante e faz todo o sentido pensarem com calma. 💛

Fico totalmente disponível para esclarecer qualquer dúvida. Posso perguntar: há algum ponto em concreto que vos deixe em dúvida? Assim consigo ajudar-vos melhor.` },
  { titulo: 'Já temos fotógrafo / videógrafo', resposta: `Que bom que já têm essa parte tratada! 😊

Se um dia procurarem foto e vídeo em sintonia, trabalhamos os dois de forma integrada, o que faz toda a diferença no resultado final.

Fica o convite para verem o nosso trabalho e, se fizer sentido, será um prazer conversar.` },
  { titulo: 'O casamento ainda é longe', resposta: `Sim, e é ótimo estarem a tratar disto com antecedência! ⏳

As melhores datas costumam fechar cedo, por isso garantir já a vossa é a forma de ficarem descansados. Sem qualquer pressão, fico disponível para reservarmos o vosso dia quando estiverem prontos.` },
  { titulo: 'Encontrámos mais barato', resposta: `Compreendo, e há de facto muitas opções. 🙂

A diferença está no que não se vê no preço: a consistência, a experiência a lidar com imprevistos e a forma como cuidamos de vós do início ao fim. É a vossa memória para a vida, e isso merece confiança total.

Adorávamos mostrar-vos porque vale a pena.` },
]

/* ── Ajudantes para os dados ao vivo ── */
const n = (s: Stats, ...st: string[]) => st.reduce((a, k) => a + (s.status[k] ?? 0), 0)
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
const pk = PRAZO_VIDEO_DIAS

/* ── Fases ── */
export const FASES: Fase[] = [
  /* 01 */
  {
    titulo: 'Captação', sub: 'de onde vêm os casais',
    passos: [
      {
        id: '0-0', titulo: 'Casamentos.pt', sub: 'canal pago',
        descricao: 'Vem da plataforma e costuma comparar vários fornecedores. Enviamos o formulário logo no primeiro contacto. Sem resposta em 24 h na plataforma, o seguimento passa para WhatsApp.',
        quem: ['Rui'], prazo: 'Mesmo dia', onde: 'Casamentos.pt › CRM · como chegou',
        tarefas: ['Responder a pedidos em menos de 2 h', 'Enviar o formulário na 1.ª mensagem', 'Sem resposta em 24 h, passar para WhatsApp', 'Pedir avaliação aos casais entregues', 'Confirmar origem no CRM'],
        mensagens: mensagensOrigem(ORIGEM_CASAMENTOS), regras: regrasOrigem(ORIGEM_CASAMENTOS),
        dica: 'Quem responde primeiro cria a primeira ligação e fica logo à frente.',
        dados: s => s.origem['Casamentos.pt'] ? `${s.origem['Casamentos.pt']} leads` : null,
      },
      {
        id: '0-1', titulo: 'Indicação', sub: 'amigos e ex-clientes',
        descricao: 'Recomendações de casais anteriores e amigos. É o canal com melhor qualidade de lead. O contacto chega direto, por isso seguem-se as mensagens de contacto direto.',
        quem: ['Rui'], prazo: 'Mesmo dia', onde: 'CRM · como chegou',
        tarefas: ['Perguntar sempre como nos conheceu', 'Agradecer a quem recomendou', 'Registar quem indicou na ficha'],
        mensagens: mensagensOrigem(ORIGEM_DIRETO), regras: regrasOrigem(ORIGEM_DIRETO),
        dica: 'Quem responde primeiro cria a primeira ligação e fica logo à frente.',
        dados: s => s.origem['Indicação'] ? `${s.origem['Indicação']} leads (com recomendação de amigos)` : null,
      },
      {
        id: '0-2', titulo: 'Redes sociais', sub: 'Instagram, Facebook e TikTok',
        descricao: 'Contacto por mensagem ou pelo link da bio. Tom próximo e ritmo mais rápido. Enviamos o formulário logo no primeiro contacto.',
        quem: ['Rui'], prazo: 'Mesmo dia', onde: 'CRM · como chegou',
        tarefas: ['Publicar 3 vezes por semana', 'Responder a mensagens no próprio dia', 'Link da bio para o formulário', 'Passar o contacto para o CRM'],
        mensagens: mensagensOrigem(ORIGEM_DIRETO), regras: regrasOrigem(ORIGEM_DIRETO),
        dica: 'Quem responde primeiro cria a primeira ligação e fica logo à frente.',
        dados: s => s.origem['Redes sociais'] ? `${s.origem['Redes sociais']} leads` : null,
      },
      {
        id: '0-3', titulo: 'Site', sub: 'formulário',
        descricao: 'Visitou o site e preencheu o formulário. Já temos a informação base, por isso a lead entra logo no CRM em Nova Entrada.',
        quem: ['Automático'], prazo: 'Sempre ativo', onde: 'Site › /nova-lead › CRM',
        tarefas: ['Testar o formulário uma vez por mês', 'Confirmar que entra no CRM', 'Atualizar portefólio do site'],
        mensagens: mensagensOrigem(ORIGEM_SITE), regras: regrasOrigem(ORIGEM_SITE),
        emails: [{ assunto: 'Recebemos o vosso contacto · RL Photo.Video' }],
        dica: 'Quem responde primeiro cria a primeira ligação e fica logo à frente.',
        dados: s => s.origem['Site'] ? `${s.origem['Site']} leads` : null,
      },
    ],
  },

  /* 02 */
  {
    titulo: 'Lead', sub: 'do contacto ao sim à reunião',
    fluxo: { seq: { 0: [1], 1: [2], 2: [3, 4] }, baixo: { 4: [5] }, saida: [3] },
    passos: [
      {
        id: '1-0', titulo: 'Lead entra', sub: 'Por Contactar',
        descricao: 'O pedido entra no CRM com data, local, serviços e origem. Estado inicial Por Contactar, na coluna Nova Entrada.',
        quem: ['Automático'], prazo: 'Imediato', onde: '/crm · coluna Nova Entrada',
        tarefas: ['Confirmar dados e origem no CRM', 'Verificar se a data está livre', 'Definir prioridade (quente, morna, fria)'],
        dados: s => `${s.total} leads no CRM`,
      },
      {
        id: '1-1', titulo: 'Boas-vindas', sub: 'WhatsApp + chamada de 2 min',
        descricao: 'Primeira mensagem logo após a entrada da lead, enviada a partir do card. Os noivos dizem o dia e a hora e fazes a chamada de 2 minutos com o guião.',
        quem: ['Rui'], prazo: 'Mesmo dia', onde: '/crm · card › ENVIAR BOAS-VINDAS',
        tarefas: ['No card, clicar em ENVIAR BOAS-VINDAS', 'Os noivos dizem o dia e a hora', 'Ligar e seguir o guião da chamada', 'Confirmar registo no histórico'],
        mensagens: [{ titulo: 'Boas-vindas', quando: 'Assim que entra', texto: mensagemBoasVindas(EX.nome), tipo: 'crm' }],
        regras: [
          ['Assim que entra', 'Boas-vindas pelo WhatsApp (pede dia e hora)', '/crm · card Nova Entrada'],
          ['Depois de enviado', 'Fica "✓ Enviado" e registado no histórico', '/crm'],
        ],
        dica: 'Sorri enquanto falas, ouve-se do outro lado. E deixa-os falar mais do que tu.',
        guiao: true,
      },
      {
        id: '1-2', titulo: 'Contacto para reunião', sub: 'WhatsApp marcar reunião',
        descricao: 'Convite para a reunião, com o link onde os noivos escolhem o dia e a hora (videochamada ou estúdio).',
        quem: ['Rui'], prazo: '1 a 2 dias após as boas-vindas', onde: '/crm · card',
        tarefas: ['Enviar WhatsApp marcar reunião', 'Propor 2 ou 3 horários se preferirem combinar à mão'],
        mensagens: [
          { titulo: 'Marcar reunião', quando: 'Depois da chamada', texto: mensagemMarcarReuniao(EX.nome, EX.leadId), tipo: 'crm' },
          { titulo: 'Sem horário', quando: '24 h sem resposta', texto: AGUARDAR_AGENDAMENTO, tipo: 'copiar' },
        ],
        regras: [['24 h sem resposta', 'Mensagem "sem horário"', 'Copiar e enviar']],
      },
      {
        id: '1-3', titulo: 'Aceitou', sub: 'portal da reunião por WhatsApp',
        descricao: 'O casal aceita a reunião. Na ficha preenches data, hora e tipo, e só aí os botões de WhatsApp desbloqueiam. Envias o portal da reunião, com o link da videochamada, e o estado passa a Reunião Agendada.',
        quem: ['Rui'], prazo: 'Ao aceitar', onde: '/crm/[id] › Marcação de Reunião',
        tarefas: ['Registar data, hora e tipo na ficha', 'Enviar portal da reunião por WhatsApp', 'Mudar estado para Reunião Agendada', 'Confirmar que abriram o portal'],
        mensagens: [{ titulo: 'Portal da reunião', quando: 'Logo após marcar', texto: mensagemPortalReuniao(EX.nome, PORTAL_REUNIAO, EX.reuniaoData, EX.reuniaoHora), tipo: 'crm' }],
        emails: [{ assunto: 'Tens uma reunião marcada · {data} às {hora}' }],
        regras: [
          ['Sem data e hora na ficha', 'Botões bloqueados: 🔒 Agendar reunião', '/crm/[id] › Marcação de Reunião'],
          ['Logo após marcar', 'Portal da reunião (cria o portal se não existir)', '/crm · card'],
        ],
        dica: 'Confirma que receberam mesmo o portal e que o conseguiram abrir num computador.',
        dados: s => n(s, 'Reunião Agendada') ? `${n(s, 'Reunião Agendada')} com reunião agendada agora` : null,
      },
      {
        id: '1-4', titulo: 'Não aceitou', sub: 'não quer reunião agora',
        descricao: 'O casal não aceita a reunião ou não responde ao contacto. A lead passa para follow-up.',
        quem: ['Rui'], prazo: 'Na resposta', onde: '/crm · status',
        tarefas: ['Registar que não aceitou', 'Definir próxima ação e data'],
      },
      {
        id: '1-5', titulo: 'Follow-up', sub: '3.º e 6.º dia',
        descricao: 'Mensagens de follow-up para retomar a conversa. Se o casal aceitar, envias o portal da reunião. Sem resposta depois dos dois follow-ups, passa a Sem resposta.',
        quem: ['Rui'], prazo: '+3 e +6 dias', onde: '/crm · próxima ação',
        tarefas: ['1.º follow-up ao 3.º dia', '2.º follow-up ao 6.º dia', 'Se aceitar, enviar portal da reunião', 'Sem resposta: marcar Sem resposta'],
        mensagens: [
          { titulo: '1.º follow-up · sem resposta ao contacto', quando: '+3 dias', texto: mensagemFollowUpContacto1(EX.nome, EX.leadId), tipo: 'nova' },
          { titulo: '2.º follow-up · última mensagem', quando: '+6 dias', texto: mensagemFollowUpContacto2(EX.nome, EX.leadId), tipo: 'nova' },
        ],
        regras: [
          ['3 dias sem resposta', '1.º follow-up', '/crm · próxima ação'],
          ['6 dias sem resposta', '2.º follow-up, última mensagem', '/crm · próxima ação'],
          ['Sem resposta aos dois', 'Estado Sem resposta', '/crm · status'],
        ],
        dados: s => n(s, 'Sem resposta') ? `${n(s, 'Sem resposta')} leads ficaram Sem resposta` : null,
      },
    ],
  },

  /* 03 */
  {
    titulo: 'Reunião', sub: 'conhecer o casal',
    fluxo: { seq: { 0: [1], 1: [2, 3] }, saida: [2] },
    passos: [
      {
        id: '2-0', titulo: 'Lembrete 1 h', sub: 'WhatsApp antes da reunião',
        descricao: 'Lembrete por WhatsApp uma hora antes da reunião, a partir do card ou do calendário.',
        quem: ['Rui'], prazo: '1 h antes', onde: '/crm · card + calendário /photo',
        tarefas: ['Enviar o lembrete 1 hora antes', 'Preparar galeria e filme parecidos com o casamento deles'],
        mensagens: [{ titulo: 'Lembrete 1 h antes', quando: 'No dia da reunião', texto: mensagemLembreteReuniao(EX.nome, EX.reuniaoHora), tipo: 'crm' }],
        emails: [{ assunto: '⏰ A vossa reunião começa em 30 minutos' }],
        regras: [['No dia da reunião', 'Lembrete 1 hora antes', '/crm · card + /photo']],
      },
      {
        id: '2-1', titulo: 'Reunião', sub: 'videochamada',
        descricao: 'Conhecer a história do casal e as prioridades do dia, e apresentar o processo RL. Pode ficar gravada na ficha.',
        quem: ['Rui', 'Noivos'], prazo: '45 a 60 min', onde: '/crm/[id] · reunião',
        tarefas: ['Ver as redes do casal antes', 'Ouvir a história e as prioridades', 'Apresentar o processo RL', 'Gravar a reunião', 'Combinar data da proposta'],
        dica: 'Ouve primeiro, apresenta depois.',
        dados: s => `${pct(n(s, 'Fechou'), s.total)}% das leads fecharam`,
      },
      {
        id: '2-2', titulo: 'Gerar proposta', sub: 'no portal da reunião',
        descricao: 'Com base na reunião, geras a proposta no portal da reunião, com pacote e valor. O DFP fica disponível no portal e o casal pode confirmar ou rejeitar.',
        quem: ['Rui'], prazo: 'Logo após a reunião', onde: '/crm/[id] › Propostas',
        tarefas: ['Definir pacote e valor proposto', 'Gerar a proposta', 'Enviar o link ao casal', 'Mudar estado para Proposta Enviada'],
        mensagens: [{ titulo: 'Proposta (DFP) disponível no portal', quando: 'No dia da reunião', texto: REUNIAO_DFP, tipo: 'copiar' }],
        dica: 'A proposta encaixa melhor depois de perceberes o que o casal valoriza.',
      },
      {
        id: '2-3', titulo: 'Análise da reunião', sub: 'plano de melhoria',
        descricao: 'Análise da reunião gravada (Whisper + prompt oficial do analista) com pontos a melhorar para as próximas.',
        quem: ['Rui'], prazo: 'Depois da reunião', onde: '/crm/analises',
        tarefas: ['Carregar a gravação', 'Rever a análise', 'Anotar 1 melhoria para a próxima'],
      },
    ],
  },

  /* 04 */
  {
    titulo: 'Estado', sub: 'resposta à proposta',
    fluxo: {
      seq: { 0: [3], 3: [4], 4: [5, 6], 1: [7], 7: [8], 8: [9] },
      pos: { 3: [0, -90], 4: [1, -90], 5: [2, -120], 6: [2, -60], 7: [1, 190], 8: [2, 190], 9: [3, 190] },
      saida: [5],
      atalho: { 5: [5, 'sem pré-wedding'] },
    },
    passos: [
      {
        id: '3-0', titulo: 'Aceitou', sub: 'aceita no portal da reunião',
        descricao: 'O casal aceita a proposta diretamente no portal da reunião. O estado passa a Fechou e segue o fluxo do contrato.',
        quem: ['Noivos', 'Rui'], prazo: 'Na decisão', onde: '/crm · card › ACEITARAM A PROPOSTA',
        tarefas: ['Confirmar aceitação no portal da reunião', 'Mudar estado para Fechou', 'Registar valor fechado e data', 'Bloquear a data na agenda'],
        mensagens: [
          { titulo: 'Aceitaram a proposta', quando: 'Quando dizem que sim', texto: mensagemFecho(EX.nome, EX.casamento, linkPublico('/login-noivos')), tipo: 'crm' },
          { titulo: 'Obrigado pela escolha', quando: 'Depois de aceitarem', texto: mensagemObrigadoEscolha(EX.nome), tipo: 'crm' },
          { titulo: 'Fechou · boas-vindas à família RL', quando: 'Fecham na reunião', texto: FECHOU_CONTRATO, tipo: 'copiar' },
        ],
        regras: [['Quando dizem que sim', 'Aceitaram a proposta', '/crm · card']],
        dica: 'O pós-fecho é o início da relação, não o fim. Celebra com eles!',
        dados: s => `${n(s, 'Fechou')} fecharam (${pct(n(s, 'Fechou'), s.total)}% das leads)`,
      },
      {
        id: '3-1', titulo: 'Em negociação', sub: 'Proposta Enviada',
        descricao: 'O casal ainda não decidiu ou quer ajustar serviços ou valor. Se não houver resposta, entra nos follow-ups. Usa as respostas prontas às objeções.',
        quem: ['Rui'], prazo: 'Até decidir', onde: '/crm · coluna Follow Up',
        tarefas: ['Perceber o que o casal quer ajustar', 'Rever pacote ou valor', 'Reenviar a proposta'],
        dica: 'Nunca pressiones. Um follow up caloroso vale mais do que dez insistências.',
        objecoes: OBJECOES,
        dados: s => `${n(s, 'Proposta Enviada', 'Negociação', 'Follow Up 1', 'Follow Up 2', 'Follow Up 3')} em negociação agora`,
      },
      {
        id: '3-2', titulo: 'Não aceitou', sub: 'NÃO FECHOU',
        descricao: 'Regista sempre o motivo, para perceber preço, data ou concorrência. Alimenta as estatísticas do CRM. Leads antigas passam a Encerrado.',
        quem: ['Rui'], prazo: 'Na decisão', onde: '/crm · arrastar para Encerrada',
        tarefas: ['Registar o motivo', 'Mudar estado para NÃO FECHOU', 'Agradecer e deixar a porta aberta'],
        mensagens: [{ titulo: 'Agradecer e perguntar o motivo', quando: 'Na resposta', texto: mensagemNaoAceitou(EX.nome), tipo: 'nova' }],
        regras: [['Sempre', `Motivo: ${MOTIVOS_NAO_FECHOU.join(', ')}`, '/crm · Encerrada']],
        dados: s => `${n(s, 'NÃO FECHOU')} não fecharam, ${n(s, 'Encerrado')} encerradas`,
      },
      {
        id: '3-3', titulo: 'Faculta os dados', sub: 'nomes, NIF, CC, moradas',
        descricao: 'Depois de aceitar, o casal preenche no portal da reunião os dados necessários para o contrato.',
        quem: ['Noivos'], prazo: 'Logo após aceitar', onde: 'Portal da reunião (/r/…)',
        tarefas: ['Confirmar que o casal preencheu os dados', 'Validar nomes, NIF, CC e moradas'],
        emails: [{ assunto: '✓ Dados recebidos · RL Photo Video' }],
        regras: [['Depois de aceitarem', 'Confirmar proposta + formulário de dados', 'Portal da reunião']],
      },
      {
        id: '3-4', titulo: 'App recebe os dados', sub: 'confirma, cria palavra-passe, envia ticket',
        descricao: 'A app recebe os dados dos noivos, confirma-os, cria automaticamente uma palavra-passe e envia por email aos noivos um ticket com o acesso ao portal e a palavra-passe. Ao mesmo tempo cria o portal dos noivos e o contrato.',
        quem: ['Automático'], prazo: 'Imediato', onde: 'Dados do contrato · email',
        tarefas: ['Dados recebidos', 'Dados confirmados', 'Palavra-passe criada', 'Ticket enviado por email aos noivos'],
        emails: [{ assunto: '💍 O portal do casamento está pronto (link e palavra-passe)', preview: 'portal' }],
      },
      {
        id: '3-5', titulo: 'Portal dos noivos', sub: 'criado automaticamente',
        descricao: 'O portal dos noivos é criado com nomes, data e local, pronto a partilhar com o casal. Daqui segue para o pré-wedding, ou direto para a preparação se não houver pré-wedding.',
        quem: ['Automático'], prazo: 'Imediato', onde: '/crm/portais',
        tarefas: ['Confirmar nomes, data e local no portal', 'Enviar acesso aos noivos por WhatsApp'],
        emails: [
          { assunto: 'O vosso Portal dos Noivos está pronto' },
          { assunto: '🔑 A vossa palavra-passe do portal (recuperação)' },
          { assunto: '🔔 Notificações do portal' },
        ],
        dica: 'Um portal cuidado nos primeiros dias dá confiança para tudo o que vem a seguir.',
      },
      {
        id: '3-6', titulo: 'Contrato', sub: 'serviços, valor e pagamentos',
        descricao: 'O contrato é gerado com os serviços e o valor da proposta aceite, e com o plano de pagamentos: adjudicação na assinatura para reservar o dia, reforço de 80% do valor em falta até 2 dias antes e os restantes 20% no final. Depois de assinado, as outras páginas do portal dos noivos ficam desbloqueadas.',
        quem: ['Automático', 'Noivos'], prazo: 'Imediato', onde: 'Portal dos noivos › Contrato-CPS e Pagamentos',
        tarefas: ['Verificar serviços e valor', 'Confirmar plano: adjudicação, reforço 80%, final 20%', 'Confirmar assinatura do casal', 'Adjudicação recebida: dia reservado', 'Confirmar que as páginas do portal ficaram desbloqueadas'],
        mensagens: [{ titulo: 'Lembrete da adjudicação', quando: '24 h antes do fim do prazo', texto: mensagemLembreteAdjudicacao(EX.nome, EX.casamento), tipo: 'nova' }],
        emails: [{ assunto: '✓ Pagamento registado · RL Photo Video' }, { assunto: 'Comprovativo de pagamento · {valor}' }],
        regras: [
          ['Na assinatura', 'Adjudicação: reserva o dia', 'Pagamentos'],
          ['48 h após receberem o portal', 'Prazo da adjudicação', 'Pagamentos'],
          ['Até 2 dias antes do casamento', 'Reforço de 80% do valor em falta', 'Pagamentos'],
          ['No final', 'Restantes 20%', 'Pagamentos'],
          ['Contrato assinado', 'Desbloqueia as páginas do portal', 'Portal dos noivos'],
        ],
        dados: 'Adjudicação na assinatura, reforço 80% até 2 dias antes, final 20%',
      },
      {
        id: '3-7', titulo: 'Follow Up 1', sub: `${FOLLOW_WA_DIAS} dias após a reunião`,
        descricao: `1.º follow-up por WhatsApp, ${FOLLOW_WA_DIAS} dias depois da reunião, para bloquear a data na agenda. O botão do card fica bloqueado com contagem decrescente até lá.`,
        quem: ['Rui'], prazo: `+${FOLLOW_WA_DIAS} dias após a reunião`, onde: '/crm · card + /photo',
        tarefas: ['Enviar WhatsApp do 1.º follow-up', 'Mudar estado para Follow Up 1', 'Definir próxima ação'],
        mensagens: [{ titulo: '1.º follow-up', quando: `${FOLLOW_WA_DIAS} dias após a reunião`, texto: mensagemFollowUp(EX.nome, EX.casamento), tipo: 'crm' }],
        regras: [[`${FOLLOW_WA_DIAS} dias após a reunião`, '1.º follow up (contagem decrescente até lá)', '/crm · card + /photo']],
        dica: 'Nunca pressiones. Um follow up caloroso vale mais do que dez insistências.',
        simulador: true,
        dados: s => n(s, 'Follow Up 1') ? `${n(s, 'Follow Up 1')} em Follow Up 1` : null,
      },
      {
        id: '3-8', titulo: 'Follow Up 2', sub: `${FOLLOW2_WA_DIAS} dias depois do 1.º`,
        descricao: `2.º follow-up por WhatsApp, ${FOLLOW2_WA_DIAS} dias depois do 1.º se não houver resposta. A data ainda está livre, mas não por muito tempo.`,
        quem: ['Rui'], prazo: `+${FOLLOW2_WA_DIAS} dias após o Follow Up 1`, onde: '/crm · card + /photo',
        tarefas: ['Enviar WhatsApp do 2.º follow-up', 'Mudar estado para Follow Up 2'],
        mensagens: [{ titulo: '2.º follow-up', quando: `${FOLLOW2_WA_DIAS} dias após o 1.º`, texto: mensagemFollowUp2(EX.nome, EX.casamento), tipo: 'crm' }],
        regras: [[`${FOLLOW2_WA_DIAS} dias após o 1.º`, '2.º follow up, se não responderem', '/crm · card + /photo']],
      },
      {
        id: '3-9', titulo: 'Follow Up 3', sub: 'última tentativa',
        descricao: 'Última tentativa de contacto. Se continuar sem resposta, a lead passa a Sem resposta e é encerrada.',
        quem: ['Rui'], prazo: `Lead parada há ${FOLLOW_PARADO_DIAS} dias`, onde: '/crm · Follow Up 3',
        tarefas: ['Última tentativa de contacto', 'Sem resposta: mudar para Sem resposta'],
        mensagens: [{ titulo: 'Follow Up 3 · última tentativa', quando: 'Depois do 2.º sem resposta', texto: mensagemFollowUp3(EX.nome, EX.casamento), tipo: 'nova' }],
        regras: [
          [`${FOLLOW_PARADO_DIAS} dias parada`, 'Follow Up 3', '/crm · alertas'],
          ['Sem resposta', 'Estado Sem resposta e encerrada', '/crm · status'],
        ],
        dados: s => n(s, 'Sem resposta') ? `${n(s, 'Sem resposta')} leads ficaram Sem resposta` : null,
      },
    ],
  },

  /* 05 */
  {
    titulo: 'Pré-wedding', sub: `${PREWEDDING_ALERTA_DIAS} dias antes do casamento`,
    fluxo: { seq: { 0: [1], 1: [2] }, saida: [2] },
    passos: [
      {
        id: '4-0', titulo: 'Marcação aberta', sub: 'link para os noivos',
        descricao: `Só se o casamento tiver o serviço (caixa "Tem serviço Pré-Wedding" na ficha). ${PREWEDDING_ALERTA_DIAS} dias antes do casamento o calendário avisa e envias o link onde os noivos escolhem dia, hora e local.`,
        quem: ['Rui'], prazo: `${PREWEDDING_ALERTA_DIAS} dias antes do casamento`, onde: 'Ficha › Marcação + /photo',
        tarefas: ['Pôr horários com local sugerido na ficha', 'Enviar o link pelo WhatsApp', 'Lembrar se não marcarem'],
        mensagens: [
          { titulo: 'Marcar o pré-wedding', quando: `${PREWEDDING_ALERTA_DIAS} dias antes`, texto: mensagemPreWedding(EX.nome, EX.eventoId), tipo: 'crm' },
          { titulo: 'Lembrete para marcar', quando: `${LEMBRETE_PREWEDDING_DIAS} dias sem marcar`, texto: mensagemLembreteMarcarPreWedding(EX.nome, EX.eventoId), tipo: 'crm' },
        ],
        emails: [{ assunto: 'Faltam 60 dias · preparámos algo para vocês' }],
        regras: [
          [`${PREWEDDING_ALERTA_DIAS} dias antes do casamento`, 'Alerta "Marcar pré-wedding" (se tiver o serviço)', 'Calendário /photo'],
          [`${LEMBRETE_PREWEDDING_DIAS} dias sem marcar`, 'Lembrar pré-wedding', 'Calendário /photo'],
        ],
      },
      {
        id: '4-1', titulo: 'Marcado pelos noivos', sub: 'dia, hora e local',
        descricao: 'O casal escolhe no link a data, a hora e o local. Recebes um email e a sessão entra no calendário. Na véspera vai o lembrete com o Guia Pré-Wedding.',
        quem: ['Noivos'], prazo: `${PREWEDDING_ALERTA_DIAS} dias antes do casamento`, onde: '/prewedding/… + calendário /photo',
        tarefas: ['Confirmar data e local', 'Enviar dicas de roupa e local', 'Lembrete na véspera'],
        mensagens: [{ titulo: 'Véspera da sessão', quando: 'Dia anterior', texto: mensagemVesperaPreWedding(EX.nome, '17:30', 'Praia da Figueirinha'), tipo: 'crm' }],
        emails: [{ assunto: 'O seu Pré-Wedding · RL Photo.Video' }],
        regras: [
          ['Quando marcam', 'Email para ti + sessão no calendário com o local', 'Email + /photo'],
          ['Véspera da sessão', 'Lembrete com hora, local e Guia Pré-Wedding', 'Calendário /photo'],
          ['Até à véspera do casamento', 'Os noivos podem alterar a data no mesmo link', '/prewedding/…'],
        ],
        dica: 'A sessão pré-wedding é o ensaio da confiança: no dia do casamento já conhecem a câmara.',
      },
      {
        id: '4-2', titulo: 'Fotos enviadas', sub: 'entrega pré-wedding',
        descricao: 'Galeria e vídeo do pré-wedding enviados aos noivos pelo portal.',
        quem: ['Rui'], prazo: '2 a 3 semanas', onde: 'Ficha › Estado das Entregas',
        tarefas: ['Editar a seleção', 'Enviar a galeria', 'Pedir autorização para publicar'],
        emails: [
          { assunto: 'As vossas fotos pré-wedding estão prontas' },
          { assunto: 'O vosso vídeo pré-wedding está pronto' },
        ],
      },
    ],
  },

  /* 06 */
  {
    titulo: 'Preparação', sub: `cerca de ${PREPARACAO_DIAS} dias antes`,
    fluxo: { seq: { 0: [2], 2: [1], 1: [3] }, saida: [3] },
    passos: [
      {
        id: '5-0', titulo: 'Convite', sub: 'WhatsApp preparação',
        descricao: 'WhatsApp a partir da ficha do evento com o link de preparação: primeiro preenchem o briefing e depois escolhem o dia e a hora da videochamada.',
        quem: ['Rui'], prazo: `${PREPARACAO_DIAS} dias antes do casamento`, onde: 'Ficha › Comunicação com os Noivos + /photo',
        tarefas: ['Enviar WhatsApp reunião de preparação', 'Confirmar que o link está ativo'],
        mensagens: [{ titulo: 'Convite para a reunião de preparação', quando: `${PREPARACAO_DIAS} dias antes`, texto: mensagemReuniaoPreparacao(EX.nome, EX.eventoId), tipo: 'crm' }],
        regras: [[`${PREPARACAO_DIAS} dias antes do evento`, 'Tarefa "Reunião preparação"', 'Calendário /photo + ficha']],
      },
      {
        id: '5-1', titulo: 'Reserva de horário', sub: 'slots partilhados',
        descricao: 'Os noivos reservam um slot livre para a reunião de preparação. Confirmas, propões outro ou dizes que não há disponibilidade.',
        quem: ['Noivos'], prazo: 'Ao receber o link', onde: 'Slots de preparação',
        tarefas: ['Abrir slots disponíveis', 'Confirmar o slot reservado', 'Reativar o link se expirar'],
        mensagens: [
          { titulo: 'Horário confirmado', quando: 'Quando reservam', texto: mensagemReuniaoAceite(EX.nome, EX.quando), tipo: 'crm' },
          { titulo: 'Horário proposto por nós', quando: 'Se não der o pedido', texto: mensagemReuniaoProposta(EX.nome, EX.quando), tipo: 'crm' },
          { titulo: 'Horário indisponível', quando: 'Sem disponibilidade', texto: mensagemReuniaoIndisponivel(EX.nome, EX.eventoId, EX.quando), tipo: 'crm' },
        ],
      },
      {
        id: '5-2', titulo: 'Briefing', sub: '/preparacao',
        descricao: 'Questionário pré-casamento com horários, locais e pessoas importantes. As respostas vão para a ficha e para o BRIEFING do portal. O link pode ser reativado se expirar.',
        quem: ['Noivos'], prazo: 'Antes da reunião', onde: '/preparacao/… › ficha + BRIEFING do portal',
        tarefas: ['Confirmar que o briefing foi preenchido', 'Ver horários e moradas', 'Lista de fotos de grupo'],
        mensagens: [{ titulo: 'Lembrete do briefing', quando: `${LEMBRETE_BRIEFING_DIAS} dias sem briefing`, texto: mensagemLembreteBriefing(EX.nome, EX.eventoId), tipo: 'crm' }],
        regras: [
          ['Primeiro', 'Briefing obrigatório (a reunião fica bloqueada até o enviarem)', '/preparacao/…'],
          [`${LEMBRETE_BRIEFING_DIAS} dias sem briefing`, 'Lembrar briefing', 'Calendário /photo'],
          ['Quando enviam ou marcam', 'Email para ti + BRIEFING do portal atualizado', 'Email + portal dos noivos'],
        ],
      },
      {
        id: '5-3', titulo: 'Reunião de preparação', sub: 'timeline final',
        descricao: 'Videochamada para rever o briefing e fechar o horário do dia.',
        quem: ['Rui', 'Noivos'], prazo: '2 a 3 semanas antes', onde: 'Agenda /photo',
        tarefas: ['Rever o briefing com os noivos', 'Fechar a timeline do dia', 'Contactos de planner e quinta', 'Plano B para chuva'],
        mensagens: [{ titulo: 'Lembrete 1 h antes', quando: 'No dia da reunião', texto: mensagemLembretePreparacao(EX.nome, EX.reuniaoHora), tipo: 'crm' }],
        regras: [
          ['No dia da reunião', 'Lembrete 1 hora antes (videochamada)', 'Calendário /photo'],
          ['1 hora depois da reunião', 'O link expira (podes reativar 7 dias)', 'Ficha'],
        ],
        dica: 'Quanto mais souberem os noivos sobre o dia, mais descansados chegam. E nós também.',
      },
    ],
  },

  /* 07 */
  {
    titulo: 'Equipa', sub: 'freelancers',
    fluxo: { seq: { 0: [1], 1: [2] }, saida: [2] },
    passos: [
      {
        id: '6-0', titulo: 'Atribuir equipa', sub: 'foto e vídeo',
        descricao: 'Associar fotógrafos e videógrafo ao evento.',
        quem: ['Rui'], prazo: 'Ao fechar', onde: 'Ficha › Equipa do evento',
        tarefas: ['Escolher fotógrafos e videógrafo', 'Associar ao evento'],
      },
      {
        id: '6-1', titulo: 'Confirmação de data', sub: 'disponível ou não',
        descricao: 'Cada freelancer confirma ou marca indisponível no portal dele.',
        quem: ['Equipa'], prazo: 'Até 1 semana', onde: 'Portal freelancer › Casamentos',
        tarefas: ['Pedir confirmação de data', 'Se indisponível, substituir', 'Confirmar a equipa toda'],
      },
      {
        id: '6-2', titulo: 'Briefing da equipa', sub: '3 dias antes',
        descricao: 'O BRIEFING do portal (cronograma, mapas, fichas do noivo e da noiva, contactos) segue para os fotógrafos e videógrafos. A equipa vê-o no seu painel.',
        quem: ['Rui'], prazo: '3 dias antes do evento', onde: 'Ficha › Briefing + /photo',
        tarefas: ['Confirmar a equipa na ficha', 'Enviar o briefing à equipa', 'Local, hora e serviços do dia', 'Lista de planos obrigatórios'],
        regras: [
          ['3 dias antes do evento', 'Lembrete "Briefing à equipa"', 'Calendário /photo'],
          ['Até alguém da equipa o receber', 'O lembrete fica ativo até ao dia', 'Calendário /photo'],
        ],
        dica: 'Uma equipa bem informada é uma equipa invisível no dia, e é isso que queremos.',
      },
    ],
  },

  /* 08 */
  {
    titulo: 'Dia do casamento', sub: 'produção',
    fluxo: { seq: { 4: [5, 6] }, pos: { 5: [1, 250], 6: [1, 310] }, saida: [0, 1, 2, 3] },
    passos: [
      {
        id: '7-0', titulo: 'Cobertura', sub: 'serviços do dia',
        descricao: 'Preparativos, cerimónia, sessão de noivos e festa, conforme os serviços contratados. A equipa trabalha com o briefing.',
        quem: ['Equipa'], prazo: 'Dia do evento', onde: 'Calendário /photo',
        tarefas: ['Baterias e cartões em duplicado', 'Chegar 15 min antes', 'Cumprir a lista de planos'],
        dica: 'Hoje só há uma regra: fazer o casal sentir que foi o dia mais bonito das suas vidas.',
      },
      {
        id: '7-1', titulo: 'Same Day Edit', sub: 'opcional',
        descricao: 'Vídeo editado no próprio dia e disponibilizado no portal.',
        quem: ['Equipa'], prazo: 'No dia', onde: 'Histórico do evento',
        tarefas: ['Selecionar momentos', 'Editar e exportar', 'Disponibilizar no portal'],
        emails: [{ assunto: 'O vosso Same Day Edit está pronto' }],
      },
      {
        id: '7-2', titulo: 'Relatório diário', sub: 'freelancer',
        descricao: 'Relatório da equipa sobre o dia.',
        quem: ['Equipa'], prazo: 'Mesmo dia', onde: 'Portal freelancer › Relatório',
        tarefas: ['Preencher o relatório diário', 'Registar problemas ou extras'],
      },
      {
        id: '7-3', titulo: 'Evento realizado', sub: 'backups e estado',
        descricao: 'Pastas e backups no próprio dia. O evento muda para Realizado e arrancam os prazos das entregas.',
        quem: ['Rui'], prazo: 'Dia seguinte', onde: 'Eventos',
        tarefas: ['Backup 3-2-1 na mesma noite', 'Mudar estado para Realizado', 'Mensagem de agradecimento aos noivos'],
        regras: [['Dia seguinte', 'Seleção de Fotos passa sozinha a "Em Seleção" no portal', 'Portal dos noivos']],
      },
      {
        id: '7-4', titulo: 'Aquisição de fotos', sub: 'fotos dos convidados',
        descricao: 'Os noivos e os convidados veem as fotos dos convidados e podem adquirir fotografias em digital ou em papel. Recebem por email um ticket com a aquisição.',
        quem: ['Noivos', 'Automático'], prazo: 'Após o casamento', onde: 'Fotos convidados · Encomendas',
        tarefas: ['Confirmar pagamento', 'Ticket de aquisição enviado por email', 'Registar o pedido'],
        emails: [{ assunto: 'Comprovativo de aquisição de fotografias · {pedido}', preview: 'ticket' }],
      },
      {
        id: '7-5', titulo: 'Fotos digitais', sub: 'envio digital',
        descricao: 'Envio digital das fotografias adquiridas.',
        quem: ['Rui'], prazo: '15 dias úteis', onde: 'Encomendas',
        tarefas: ['Preparar as fotografias', 'Enviar em digital', 'Marcar como Entregue'],
        regras: [['15 dias úteis após o pedido', 'Fotos digitais enviadas', 'Encomendas']],
      },
      {
        id: '7-6', titulo: 'Fotos em papel', sub: 'carta registada',
        descricao: 'Impressão das fotografias e envio por correio, em carta registada.',
        quem: ['Rui'], prazo: '30 dias úteis', onde: 'Encomendas',
        tarefas: ['Enviar para impressão', 'Enviar por carta registada', 'Guardar número de registo', 'Marcar como Entregue'],
        regras: [['30 dias úteis após o pedido', 'Fotos em papel por carta registada', 'Encomendas']],
      },
    ],
  },

  /* 09 */
  {
    titulo: 'Seleção', sub: 'os noivos escolhem',
    fluxo: { seq: { 0: [1], 1: [2] }, saida: [2] },
    passos: [
      {
        id: '8-0', titulo: 'Fotos para seleção', sub: '30 dias após o casamento',
        descricao: 'Link com as fotos para seleção enviado aos noivos, 30 dias depois do casamento.',
        quem: ['Rui'], prazo: '30 dias após o casamento', onde: 'Ficha › Ações Fotografia',
        tarefas: ['Preparar galeria de seleção', 'Enviar link aos noivos', 'Indicar o prazo para escolherem'],
        emails: [{ assunto: 'As vossas fotos estão prontas para seleção' }],
        regras: [['30 dias após o casamento', 'Fotos para Seleção', 'Ficha › Ações Fotografia']],
      },
      {
        id: '8-1', titulo: 'Em Seleção', sub: 'por categorias',
        descricao: 'Os noivos escolhem por momento: preparação, cerimónia, sessão, convidados, bolo e bouquet, sala, detalhes e fotos do álbum.',
        quem: ['Noivos'], prazo: 'Prazo indicado no portal', onde: 'Portal › Fotografias › Seleção',
        tarefas: ['Confirmar estado Em Seleção', 'Lembrete se passar o prazo', 'Tirar dúvidas por categoria'],
      },
      {
        id: '8-2', titulo: 'Seleção entregue', sub: 'segue para edição',
        descricao: 'Seleção fechada e enviada ao editor.',
        quem: ['Rui'], prazo: 'Ao receber', onde: 'Seleção editor',
        tarefas: ['Confirmar o número de fotos', 'Enviar ao editor', 'Mudar estado para Entregue'],
      },
    ],
  },

  /* 10 */
  {
    titulo: 'Edição', sub: 'foto e vídeo',
    fluxo: { seq: { 0: [1], 2: [3] }, saida: [1, 3] },
    passos: [
      {
        id: '9-0', titulo: 'Edição de fotos', sub: '30 dias úteis após a seleção',
        descricao: 'O editor recebe a seleção e entrega as fotos editadas em 30 dias úteis após o envio da seleção pelos noivos.',
        quem: ['Equipa'], prazo: '30 dias úteis após a seleção', onde: 'Painel do editor',
        tarefas: ['Editor confirma receção', 'Acompanhar o estado Em Edição', 'Rever qualidade e cor'],
        regras: [['30 dias úteis após a seleção', 'Fotos editadas', 'Ficha › Estado das Entregas']],
      },
      {
        id: '9-1', titulo: 'Galeria de provas', sub: 'publicada',
        descricao: 'Galeria de provas publicada para revisão.',
        quem: ['Equipa'], prazo: 'Após a edição', onde: 'Painel do editor',
        tarefas: ['Publicar galeria de provas', 'Rever com os noivos'],
      },
      {
        id: '9-2', titulo: 'Vídeo em edição', sub: `${pk.BASIC}, ${pk.ESSENCIAL} ou ${pk.SIGNATURE} dias úteis`,
        descricao: `Filme em edição pelo videógrafo. O prazo do Wedding Film depende do pack contratado: ${pk.BASIC} dias úteis no BASIC, ${pk.ESSENCIAL} no ESSENCIAL e ${pk.SIGNATURE} no SIGNATURE.`,
        quem: ['Equipa'], prazo: `${pk.BASIC}, ${pk.ESSENCIAL} ou ${pk.SIGNATURE} dias úteis, conforme o pack`, onde: 'Eventos · vídeo',
        tarefas: ['Enviar brutos ao videógrafo', 'Escolher música licenciada', 'Mudar estado para Em Edição'],
        emails: [{ assunto: 'O vosso Teaser está pronto' }],
        regras: [
          [`${pk.BASIC} / ${pk.ESSENCIAL} / ${pk.SIGNATURE} dias úteis após o casamento`, 'Wedding Film (BASIC / ESSENCIAL / SIGNATURE)', 'Ficha + sino + /photo'],
          ['30 dias antes do prazo', 'Notificação no sino + card VÍDEOS PRAZO', 'Sino do admin'],
        ],
      },
      {
        id: '9-3', titulo: 'Vídeo em revisão', sub: 'alterações até 5 dias úteis',
        descricao: 'Depois da entrega, os noivos têm 5 dias úteis para pedir alterações ao vídeo.',
        quem: ['Noivos'], prazo: '5 dias úteis após a entrega', onde: 'Revisões de vídeo',
        tarefas: ['Enviar link de revisão', 'Recolher feedback', 'Receber pedidos de alteração até 5 dias úteis após a entrega'],
        regras: [['5 dias úteis após a entrega', 'Último dia para pedir alterações ao vídeo', 'Revisões de vídeo']],
      },
    ],
  },

  /* 11 */
  {
    titulo: 'Entrega', sub: 'entrega final',
    passos: [
      {
        id: '10-0', titulo: 'Galerias online', sub: '7 dias após o casamento',
        descricao: 'Galeria online com as fotos do dia enviada aos noivos 7 dias depois do casamento, e mais tarde as fotos finais editadas.',
        quem: ['Rui'], prazo: '7 dias após o casamento', onde: 'Ficha › Ações Fotografia',
        tarefas: ['Publicar a galeria', 'Enviar link aos noivos', 'Mudar estado para Entregue'],
        emails: [
          { assunto: 'As fotos do dia já estão disponíveis' },
          { assunto: 'As vossas fotos já estão editadas' },
        ],
        regras: [
          ['7 dias após o casamento', 'Galerias Online', 'Ficha › Ações Fotografia'],
          ['Prazos a terminar em 5 dias', 'Aviso a laranja; em atraso a vermelho', 'Painel /photo (gaveta +)'],
        ],
        dica: 'Entregar antes do prazo é a forma mais simples de surpreender quem já nos confiou tudo.',
      },
      {
        id: '10-1', titulo: 'Filme', sub: 'conforme o pack',
        descricao: `Entrega do Wedding Film no prazo do pack: ${pk.BASIC}, ${pk.ESSENCIAL} ou ${pk.SIGNATURE} dias úteis. Os noivos têm depois 5 dias úteis para pedir alterações.`,
        quem: ['Rui'], prazo: `${pk.BASIC}, ${pk.ESSENCIAL} ou ${pk.SIGNATURE} dias úteis, conforme o pack`, onde: 'Vídeos (Vimeo)',
        tarefas: ['Exportar 4K e versão para redes', 'Enviar link de entrega', 'Mudar estado para Finalizado'],
        emails: [{ assunto: 'O vosso Wedding Film está pronto' }],
      },
      {
        id: '10-2', titulo: 'Álbum', sub: '30 dias úteis após as fotos',
        descricao: 'Paginação, alterações dos noivos e produção do álbum. Entregue em 30 dias úteis após o envio das fotos.',
        quem: ['Rui', 'Noivos'], prazo: '30 dias úteis após o envio das fotos', onde: 'Álbuns casamento',
        tarefas: ['Paginar com as fotos escolhidas', 'Enviar para aprovação', 'Aplicar alterações', 'Encomendar e entregar'],
        emails: [{ assunto: 'A vossa maquete do álbum está pronta' }, { assunto: 'O seu álbum está pronto para aprovação' }],
        regras: [['30 dias úteis após o envio das fotos', 'Álbum', 'Álbuns por entregar']],
      },
    ],
  },

  /* 12 */
  {
    titulo: 'Pós-venda', sub: 'depois da entrega',
    passos: [
      {
        id: '11-0', titulo: 'Referências', sub: 'avaliação Google e recomendações',
        descricao: 'Pedir avaliação no Google e recomendações. Os casais recomendados voltam a entrar como Indicação.',
        quem: ['Rui'], prazo: 'Após a entrega', onde: 'Referências pendentes',
        tarefas: ['Pedir avaliação no Google', 'Pedir recomendação a amigos', 'Registar referência pendente'],
        mensagens: [{ titulo: 'Avaliação no Google e recomendações', quando: 'Após a última entrega', texto: mensagemAvaliacaoGoogle(EX.nome), tipo: 'nova' }],
      },
      {
        id: '11-1', titulo: 'Newsletter', sub: 'com consentimento',
        descricao: 'Casais com consentimento de marketing entram na newsletter.',
        quem: ['Rui'], prazo: 'Contínuo', onde: 'Newsletter',
        tarefas: ['Confirmar consentimento', 'Adicionar à newsletter'],
        emails: [{ assunto: 'Confirma a tua subscrição' }, { assunto: 'Bem-vindo à nossa newsletter' }],
      },
      {
        id: '11-2', titulo: '1.º aniversário', sub: 'mensagem especial',
        descricao: 'Mensagem no 1.º aniversário de casamento. Mantém a relação e abre a porta a sessões de família ou de bebé.',
        quem: ['Rui'], prazo: '+1 ano após o casamento', onde: 'WhatsApp',
        tarefas: ['Enviar mensagem no dia do aniversário', 'Registar interesse em nova sessão'],
        mensagens: [{ titulo: '1.º aniversário de casamento', quando: '+1 ano', texto: mensagemAniversario(EX.nome), tipo: 'nova' }],
      },
      {
        id: '11-3', titulo: 'Satisfação', sub: 'Área SAT do portal',
        descricao: 'Depois da última entrega, convida os noivos a dar a sua opinião no portal, no botão DAR SATISFAÇÃO. Agradece e, com autorização, partilha.',
        quem: ['Noivos'], prazo: 'Depois da última entrega', onde: 'Portal dos noivos › Área SAT',
        tarefas: ['Confirmar que está tudo entregue', 'Convidar a dar satisfação no portal', 'Agradecer e partilhar com autorização'],
        regras: [['Depois da última entrega', 'Botão DAR SATISFAÇÃO', 'Portal › Área SAT Noivos']],
        dica: 'Um casal feliz traz o próximo casal. Fecha a jornada com o mesmo carinho com que a começaste.',
      },
    ],
  },
]

/* ── Separadores do topo: [nome, fase onde abre] (-1 = painel dos emails) ── */
export const SEPARADORES: [string, number][] = [
  ['Pipeline', 0], ['Leads', 1], ['Propostas', 3], ['Contratos', 3], ['Pagamentos', 3],
  ['Freelancers', 6], ['Seleção', 8], ['Edição', 9], ['Entregas', 10], ['Encomendas', 7], ['Emails', -1],
]

/** Agrupa as origens do CRM ("como chegou") nos 4 canais do mapa */
export function canalDaOrigem(v: string | null | undefined): string[] {
  const s = (v ?? '').toLowerCase()
  const out: string[] = []
  if (s.includes('casamentos')) out.push('Casamentos.pt')
  if (s.includes('indica') || s.includes('recomenda')) out.push('Indicação')
  if (/instagram|facebook|tiktok/.test(s)) out.push('Redes sociais')
  if (s.includes('site')) out.push('Site')
  return out
}

export const todosPassos = () => FASES.flatMap(f => f.passos)
