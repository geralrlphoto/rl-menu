'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  mensagemBoasVindas, mensagemPortalReuniao, mensagemLembreteReuniao,
  mensagemFollowUp, mensagemFollowUp2, mensagemFecho, FOLLOW_WA_DIAS, FOLLOW2_WA_DIAS,
  mensagemPreWedding, mensagemLembreteMarcarPreWedding, mensagemVesperaPreWedding,
  mensagemReuniaoPreparacao, mensagemLembreteBriefing, mensagemLembretePreparacao,
  PREPARACAO_DIAS, LEMBRETE_BRIEFING_DIAS, PREWEDDING_ALERTA_DIAS, LEMBRETE_PREWEDDING_DIAS,
} from '@/lib/crm'

/* ──────────────────────────────────────────────────────────────
   PERCURSO DA LEAD  —  guia interativo do follow up
   As mensagens dos botões de WhatsApp do CRM vêm de lib/crm.ts
   (a mesma fonte que o quadro usa), por isso ficam sempre iguais.
   As restantes mensagens (copiar à mão) editam-se aqui em baixo.
   Placeholders: [nome], [data] e [hora] são substituídos à mão.
   ────────────────────────────────────────────────────────────── */

const FORM_URL = 'https://portal.rlphotovideo.pt/nova-lead'
const HERO_URL = 'https://portal.rlphotovideo.pt/casamentos-2028.png'
const SERIF = { fontFamily: "'Cormorant Garamond', serif" }

/* Casal de exemplo usado nas pré-visualizações */
const EX = {
  nome: 'Beatriz e Pedro',
  casamento: '2027-07-24',
  reuniaoData: '2026-09-25',
  reuniaoHora: '16:00',
  portal: 'https://portal.rlphotovideo.pt/r/…',
}

/* ── Mensagens que se copiam à mão ── */
type Origem = { id: string; label: string; icon: string; descricao: string; inicial: string; lembretes: { quando: string; texto: string }[] }

const ORIGENS: Origem[] = [
  {
    id: 'site', label: 'Site', icon: '🌐',
    descricao: 'Visitou o site e preencheu o formulário. Já temos a informação base, por isso a lead entra logo no CRM em Nova Entrada.',
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
  },
  {
    id: 'casamentos', label: 'Casamentos.pt', icon: '💍',
    descricao: 'Vem da plataforma e costuma comparar vários fornecedores. Enviamos o formulário logo no primeiro contacto. Sem resposta em 24h na plataforma, o seguimento passa para WhatsApp.',
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
  },
  {
    id: 'direto', label: 'Direto', icon: '💬',
    descricao: 'Contacto por WhatsApp, Instagram ou mensagem. Tom próximo e ritmo mais rápido. Enviamos o formulário logo no primeiro contacto.',
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
  },
]

const TELEFONEMA = {
  intro: `Olá [nome], daqui é o Rui da RL Photo.Video, tudo bem? Recebi o vosso formulário, muito obrigado! Este é um momento oportuno para falarmos dois minutinhos?`,
  perguntas: ['De onde são os noivos?', 'Onde será, possivelmente, a preparação do dia?'],
  fecho: `Aqui na RL criamos uma relação de empatia e de amizade com os nossos noivos. Por isso privilegiamos sempre uma reunião, presencial ou por videochamada, para vos conhecermos e vocês nos conhecerem a nós. É também aí que vos mostramos o nosso método e os nossos serviços. Faz sentido marcarmos essa conversa?`,
  destaque: 'Que disponibilidade têm em termos de horários? Assim ajustamo-nos a vocês e combinamos logo o melhor dia.',
}

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

const OBJECOES = [
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

/* ── Etapas do percurso ── */
type Msg = { id: string; label: string; quando: string; texto: string; botao?: string; onde?: string }
type Fase = 'lead' | 'preparar' | 'entregar'
type Regra = { quando: string; oque: string; onde: string }
type Etapa = {
  id: string
  fase: Fase
  icon: string
  titulo: string
  coluna: string // onde vive na app (coluna do CRM, ficha, /photo…)
  cor: string // cor do acento (hex)
  resumo: string
  passos: string[]
  regras?: Regra[]
  dica: string
}

const FASES: { id: Fase; titulo: string; sub: string }[] = [
  { id: 'lead', titulo: 'Conquistar', sub: 'De lead a casal RL' },
  { id: 'preparar', titulo: 'Preparar o dia', sub: 'Do contrato ao grande dia' },
  { id: 'entregar', titulo: 'Entregar', sub: 'Das galerias ao álbum' },
]

const ETAPAS: Etapa[] = [
  {
    id: 'contacto', fase: 'lead', icon: '✦', titulo: 'Primeiro contacto', coluna: 'Antes do CRM', cor: '#C9A84C',
    resumo: 'O casal chega até nós. Respondemos depressa e levamo-los ao formulário.',
    passos: ['Escolhe a origem da lead', 'Envia a 1.ª mensagem no mesmo dia', 'Sem resposta? Segue os lembretes'],
    regras: [
      { quando: 'Mesmo dia', oque: '1.ª mensagem de resposta', onde: 'Copiar e enviar' },
      { quando: '1 a 7 dias sem resposta', oque: 'Lembretes conforme a origem', onde: 'Copiar e enviar' },
    ],
    dica: 'Quem responde primeiro cria a primeira ligação e fica logo à frente.',
  },
  {
    id: 'nova', fase: 'lead', icon: '✉', titulo: 'Nova entrada', coluna: 'Nova Entrada', cor: '#f87171',
    resumo: 'Formulário preenchido. A lead aparece no CRM e pedimos uma hora para uma chamada de 2 minutos.',
    passos: ['No card, clica em ENVIAR BOAS-VINDAS', 'Os noivos dizem o dia e a hora', 'Liga e segue o guião da chamada'],
    regras: [
      { quando: 'Assim que entra', oque: 'Boas-vindas pelo WhatsApp (pede dia e hora)', onde: '/crm · card Nova Entrada' },
      { quando: 'Depois de enviado', oque: 'Fica "✓ Enviado" e registado no histórico', onde: '/crm' },
    ],
    dica: 'Sorri enquanto falas, ouve-se do outro lado. E deixa-os falar mais do que tu.',
  },
  {
    id: 'reuniao', fase: 'lead', icon: '◷', titulo: 'Reunião agendada', coluna: 'Reunião Agendada', cor: '#c084fc',
    resumo: 'Marcaram a reunião. Na ficha preenches data, hora e tipo; só aí os botões de WhatsApp desbloqueiam.',
    passos: ['Ficha da lead › Marcação de Reunião › Enviar', 'No card, clica em PORTAL DA REUNIÃO', 'No dia, 1 hora antes: LEMBRETE'],
    regras: [
      { quando: 'Sem data e hora na ficha', oque: 'Botões bloqueados: 🔒 Agendar reunião', onde: '/crm/[id] › Marcação de Reunião' },
      { quando: 'Logo após marcar', oque: 'Portal da reunião (cria o portal se não existir)', onde: '/crm · card' },
      { quando: 'No dia da reunião', oque: 'Lembrete 1 hora antes', onde: '/crm · card + calendário /photo' },
    ],
    dica: 'Confirma que receberam mesmo o portal e que o conseguiram abrir num computador.',
  },
  {
    id: 'proposta', fase: 'lead', icon: '❖', titulo: 'Reunião e proposta', coluna: 'Reunião Agendada', cor: '#60a5fa',
    resumo: 'A reunião acontece e o DFP fica disponível no portal. Ou fecham logo, ou a lead passa para Follow Up.',
    passos: ['Ouve primeiro, apresenta depois', 'Deixa o DFP disponível no portal', 'Fecharam? Mensagem de boas-vindas à família RL'],
    dica: 'A proposta encaixa melhor depois de perceberes o que o casal valoriza.',
  },
  {
    id: 'follow', fase: 'lead', icon: '↻', titulo: 'Follow up', coluna: 'Follow Up', cor: '#fbbf24',
    resumo: `Ficaram de pensar. O 1.º follow up desbloqueia ${FOLLOW_WA_DIAS} dias depois da reunião e o 2.º ${FOLLOW2_WA_DIAS} dias depois do 1.º.`,
    passos: [`Dia ${FOLLOW_WA_DIAS}: 1.º FOLLOW UP (emoção + bloquear a data)`, `+${FOLLOW2_WA_DIAS} dias sem resposta: 2.º FOLLOW UP`, 'Disseram que sim? ACEITARAM A PROPOSTA'],
    regras: [
      { quando: `${FOLLOW_WA_DIAS} dias após a reunião`, oque: '1.º follow up (contagem decrescente até lá)', onde: '/crm · card + /photo' },
      { quando: `${FOLLOW2_WA_DIAS} dias após o 1.º`, oque: '2.º follow up, se não responderem', onde: '/crm · card + /photo' },
      { quando: 'Quando dizem que sim', oque: 'Aceitaram a proposta (reserva em 48h)', onde: '/crm · card' },
    ],
    dica: 'Nunca pressiones. Um follow up caloroso vale mais do que dez insistências.',
  },
  {
    id: 'decisao', fase: 'lead', icon: '◆', titulo: 'Decisão', coluna: 'Encerrada', cor: '#4ade80',
    resumo: 'Fecharam ou não. Em ambos os casos, regista no CRM. O motivo de um "não" é ouro para as estatísticas.',
    passos: ['Arrasta o card para Encerrada', 'Escolhe Fechou ou Não fechou + motivo', 'Tens objeções? Usa as respostas prontas'],
    dica: 'O pós-fecho é o início da relação, não o fim. Celebra com eles!',
  },

  /* ═══════════ PREPARAR O DIA ═══════════ */
  {
    id: 'contrato', fase: 'preparar', icon: '✍', titulo: 'Contrato e reserva', coluna: 'Portal da reunião › Portal dos noivos', cor: '#34d399',
    resumo: 'Os noivos confirmam a proposta no portal da reunião e preenchem os dados. Preparamos o portal dos noivos e o contrato; a data só fica reservada depois de fazerem a reserva.',
    passos: ['Confirmam a proposta e preenchem os dados', 'Em 2 a 3 dias recebem o portal dos noivos e o contrato', 'Têm 48 horas para fazer a reserva'],
    regras: [
      { quando: 'Depois de aceitarem', oque: 'Confirmar proposta + formulário de dados', onde: 'Portal da reunião (/r/…)' },
      { quando: '2 a 3 dias', oque: 'Portal dos noivos e contrato CPS prontos', onde: 'Portal dos noivos' },
      { quando: '48 horas após o portal', oque: 'Reserva feita = data efetivamente bloqueada', onde: 'Pagamentos no portal' },
    ],
    dica: 'Um portal cuidado nos primeiros dias dá confiança para tudo o que vem a seguir.',
  },
  {
    id: 'prewedding', fase: 'preparar', icon: '❦', titulo: 'Sessão pré-wedding', coluna: 'Ficha › Marcação + /photo', cor: '#f472b6',
    resumo: `Só se o casamento tiver o serviço (caixa "Tem serviço Pré-Wedding" na ficha). ${PREWEDDING_ALERTA_DIAS} dias antes do casamento o calendário avisa; os noivos escolhem dia, hora e local num link.`,
    passos: ['Na ficha › Marcação, põe horários com local sugerido', `${PREWEDDING_ALERTA_DIAS} dias antes: envia o link pelo WhatsApp`, 'Na véspera: lembrete com hora, local e Guia Pré-Wedding'],
    regras: [
      { quando: `${PREWEDDING_ALERTA_DIAS} dias antes do casamento`, oque: 'Alerta "Marcar pré-wedding" (se tiver o serviço)', onde: 'Calendário /photo' },
      { quando: `${LEMBRETE_PREWEDDING_DIAS} dias sem marcar`, oque: 'Lembrar pré-wedding', onde: 'Calendário /photo' },
      { quando: 'Quando marcam', oque: 'Email para ti + sessão no calendário com o local', onde: 'Email + /photo' },
      { quando: 'Véspera da sessão', oque: 'Lembrete com hora, local e Guia Pré-Wedding', onde: 'Calendário /photo' },
      { quando: 'Até à véspera do casamento', oque: 'Os noivos podem alterar a data no mesmo link', onde: '/prewedding/…' },
    ],
    dica: 'A sessão pré-wedding é o ensaio da confiança: no dia do casamento já vos conhecem a câmara.',
  },
  {
    id: 'preparacao', fase: 'preparar', icon: '☷', titulo: 'Briefing e reunião de preparação', coluna: 'Ficha › Comunicação com os Noivos + /photo', cor: '#a78bfa',
    resumo: `${PREPARACAO_DIAS} dias antes do evento, os noivos recebem um link: primeiro preenchem o briefing, depois marcam a videochamada de preparação. As respostas vão para a ficha e para o BRIEFING do portal.`,
    passos: [`${PREPARACAO_DIAS} dias antes: envia o link pelo WhatsApp`, 'Os noivos enviam o briefing e marcam a reunião', 'No dia: lembrete 1 hora antes com o link do Meet'],
    regras: [
      { quando: `${PREPARACAO_DIAS} dias antes do evento`, oque: 'Tarefa "Reunião preparação"', onde: 'Calendário /photo + ficha' },
      { quando: 'Primeiro', oque: 'Briefing obrigatório (a reunião fica bloqueada até o enviarem)', onde: '/preparacao/…' },
      { quando: `${LEMBRETE_BRIEFING_DIAS} dias sem briefing`, oque: 'Lembrar briefing', onde: 'Calendário /photo' },
      { quando: 'Quando enviam / marcam', oque: 'Email para ti + BRIEFING do portal atualizado', onde: 'Email + portal dos noivos' },
      { quando: 'No dia da reunião', oque: 'Lembrete 1 hora antes (videochamada)', onde: 'Calendário /photo' },
      { quando: '1 hora depois da reunião', oque: 'O link expira (podes reativar 7 dias)', onde: 'Ficha' },
    ],
    dica: 'Quanto mais souberem os noivos sobre o dia, mais descansados chegam. E nós também.',
  },
  {
    id: 'equipa', fase: 'preparar', icon: '◎', titulo: 'Briefing à equipa', coluna: 'Ficha › Briefing + /photo', cor: '#fb923c',
    resumo: 'O BRIEFING do portal (cronograma, mapas, fichas do noivo e da noiva, contactos) segue para os fotógrafos e videógrafos do casamento.',
    passos: ['Confirma a equipa na ficha', '3 dias antes: envia o briefing à equipa', 'A equipa vê o briefing no seu painel'],
    regras: [
      { quando: '3 dias antes do evento', oque: 'Lembrete "Briefing à equipa"', onde: 'Calendário /photo' },
      { quando: 'Até alguém da equipa o receber', oque: 'O lembrete fica ativo até ao dia', onde: 'Calendário /photo' },
    ],
    dica: 'Uma equipa bem informada é uma equipa invisível no dia, e é isso que queremos.',
  },
  {
    id: 'dia', fase: 'preparar', icon: '♥', titulo: 'O grande dia', coluna: 'Calendário /photo', cor: '#C9A84C',
    resumo: 'O casamento aparece no calendário do painel. A partir do dia seguinte começam a contar os prazos das entregas.',
    passos: ['Equipa no terreno com o briefing', 'Pastas e backups no próprio dia', 'No dia seguinte arrancam os prazos'],
    regras: [
      { quando: 'Dia seguinte', oque: 'Seleção de Fotos passa sozinha a "Em Seleção" no portal', onde: 'Portal dos noivos' },
    ],
    dica: 'Hoje só há uma regra: fazer o casal sentir que foi o dia mais bonito das suas vidas.',
  },

  /* ═══════════ ENTREGAR ═══════════ */
  {
    id: 'entregas', fase: 'entregar', icon: '▣', titulo: 'Entregas', coluna: 'Ficha › Estado das Entregas + /photo', cor: '#38bdf8',
    resumo: 'Cada entrega tem um prazo a contar do casamento (ou da seleção). O painel avisa a laranja nos últimos dias e a vermelho quando passa.',
    passos: ['Galeria online e fotos para seleção', 'Os noivos escolhem as fotos; seguem as fotos finais', 'Vídeo e álbum dentro do prazo'],
    regras: [
      { quando: '7 dias após o casamento', oque: 'Galerias Online', onde: 'Ficha › Ações Fotografia' },
      { quando: '30 dias após o casamento', oque: 'Fotos para Seleção', onde: 'Ficha › Ações Fotografia' },
      { quando: '30 dias após a seleção', oque: 'Fotos Finais', onde: 'Ficha › Estado das Entregas' },
      { quando: '30 dias após a aprovação', oque: 'Álbum', onde: 'Álbuns por entregar' },
      { quando: '180 dias úteis após o casamento', oque: 'Wedding Film (aviso nos últimos 30 dias)', onde: 'Ficha + sino + /photo' },
      { quando: 'Prazos a terminar em 5 dias', oque: 'Aviso a laranja; em atraso a vermelho', onde: 'Painel /photo (gaveta +)' },
    ],
    dica: 'Entregar antes do prazo é a forma mais simples de surpreender quem já nos confiou tudo.',
  },
  {
    id: 'satisfacao', fase: 'entregar', icon: '★', titulo: 'Satisfação', coluna: 'Portal dos noivos › Área SAT', cor: '#facc15',
    resumo: 'Tudo entregue. Pedimos a opinião dos noivos: é a melhor forma de melhorarmos e a melhor publicidade que existe.',
    passos: ['Confirma que está tudo entregue', 'Convida a dar satisfação no portal', 'Agradece e partilha (com autorização)'],
    regras: [
      { quando: 'Depois da última entrega', oque: 'Botão DAR SATISFAÇÃO', onde: 'Portal › Área SAT Noivos' },
    ],
    dica: 'Um casal feliz traz o próximo casal. Fecha a jornada com o mesmo carinho com que a começaste.',
  },
]

/* Todas as regras com prazo, pela ordem da jornada (tabela no fim da página) */
const EX_EVENTO = 'exemplo'

function mensagensDa(etapaId: string, origem: Origem): Msg[] {
  switch (etapaId) {
    case 'contacto': return [
      { id: 'inicial', label: '1.ª mensagem', quando: 'Mesmo dia', texto: origem.inicial },
      ...origem.lembretes.map((l, i) => ({ id: `lemb${i}`, label: `${i + 1}.º lembrete`, quando: l.quando, texto: l.texto })),
    ]
    case 'nova': return [
      { id: 'boas', label: 'Boas-vindas', quando: 'Assim que entra', texto: mensagemBoasVindas(EX.nome), botao: 'Enviar boas-vindas' },
      { id: 'aguardar', label: 'Sem horário', quando: '24h sem resposta', texto: AGUARDAR_AGENDAMENTO },
    ]
    case 'reuniao': return [
      { id: 'portal', label: 'Portal da reunião', quando: 'Logo após marcar', texto: mensagemPortalReuniao(EX.nome, EX.portal, EX.reuniaoData, EX.reuniaoHora), botao: 'Portal da reunião' },
      { id: 'lembrete', label: 'Lembrete 1h', quando: '1 hora antes', texto: mensagemLembreteReuniao(EX.nome, EX.reuniaoHora), botao: 'Lembrete: falta 1 hora' },
    ]
    case 'proposta': return [
      { id: 'dfp', label: 'DFP no portal', quando: 'No dia da reunião', texto: REUNIAO_DFP },
      { id: 'fechou', label: 'Fecharam', quando: 'Fecham na reunião', texto: FECHOU_CONTRATO },
    ]
    case 'follow': return [
      { id: 'f1', label: '1.º follow up', quando: `${FOLLOW_WA_DIAS} dias após a reunião`, texto: mensagemFollowUp(EX.nome, EX.casamento), botao: 'Follow up' },
      { id: 'f2', label: '2.º follow up', quando: `${FOLLOW2_WA_DIAS} dias após o 1.º`, texto: mensagemFollowUp2(EX.nome, EX.casamento), botao: '2.º Follow up' },
      { id: 'fecho', label: 'Aceitaram a proposta', quando: 'Quando dizem que sim', texto: mensagemFecho(EX.nome, EX.casamento, EX.portal), botao: 'Aceitaram a proposta' },
    ]
    case 'contrato': return [
      { id: 'fecho', label: 'Aceitaram a proposta', quando: 'Quando dizem que sim', texto: mensagemFecho(EX.nome, EX.casamento, EX.portal), botao: 'Aceitaram a proposta' },
    ]
    case 'prewedding': return [
      { id: 'pw', label: 'Marcar pré-wedding', quando: `${PREWEDDING_ALERTA_DIAS} dias antes do casamento`, texto: mensagemPreWedding(EX.nome, EX_EVENTO), onde: 'Ficha + /photo' },
      { id: 'pw2', label: 'Lembrar pré-wedding', quando: `${LEMBRETE_PREWEDDING_DIAS} dias sem marcar`, texto: mensagemLembreteMarcarPreWedding(EX.nome, EX_EVENTO), onde: 'Calendário /photo' },
      { id: 'pw3', label: 'Véspera da sessão', quando: 'Dia anterior', texto: mensagemVesperaPreWedding(EX.nome, '17:30', 'Praia da Ursa, Sintra'), onde: 'Calendário /photo' },
    ]
    case 'preparacao': return [
      { id: 'pr', label: 'Briefing e reunião', quando: `${PREPARACAO_DIAS} dias antes do evento`, texto: mensagemReuniaoPreparacao(EX.nome, EX_EVENTO), onde: 'Ficha + /photo' },
      { id: 'pr2', label: 'Lembrar briefing', quando: `${LEMBRETE_BRIEFING_DIAS} dias sem briefing`, texto: mensagemLembreteBriefing(EX.nome, EX_EVENTO), onde: 'Calendário /photo' },
      { id: 'pr3', label: 'Lembrete 1 hora', quando: 'No dia da reunião', texto: mensagemLembretePreparacao(EX.nome, '18:00'), onde: 'Calendário /photo' },
    ]
    default: return []
  }
}

/* ── Utilitários ── */
function useReducedMotion() {
  const [r, setR] = useState(false)
  useEffect(() => {
    try { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches) } catch { /* sem matchMedia */ }
  }, [])
  return r
}

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard indisponível */ }
      }}
      className={`shrink-0 rounded-lg border tracking-widest uppercase transition-all ${small ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} ${
        copied ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-white/45 hover:text-gold hover:border-gold/40'
      }`}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

/* ── Telemóvel com conversa de WhatsApp (a mensagem "escreve-se" sozinha) ── */
function PhonePreview({ texto, chave }: { texto: string; chave: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? texto.length : 0)
  const [typing, setTyping] = useState(!reduced)
  const conversa = useRef<HTMLDivElement>(null)
  // Acompanha a escrita: mantém o fim da mensagem à vista
  useEffect(() => { const el = conversa.current; if (el) el.scrollTop = el.scrollHeight }, [shown, typing])

  useEffect(() => {
    if (reduced) { setShown(texto.length); setTyping(false); return }
    setShown(0); setTyping(true)
    let i = 0
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => {
      setTyping(false)
      const passo = Math.max(3, Math.ceil(texto.length / 90))
      iv = setInterval(() => {
        i += passo
        setShown(Math.min(i, texto.length))
        if (i >= texto.length && iv) clearInterval(iv)
      }, 16)
    }, 650)
    return () => { clearTimeout(t); if (iv) clearInterval(iv) }
  }, [chave, texto, reduced])

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.4rem] border border-white/15 bg-[#0a0a0a] p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="rounded-[1.9rem] overflow-hidden bg-[#0b141a]">
          {/* Barra do contacto */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1f2c34]">
            <span className="text-white/50 text-lg leading-none">‹</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/80 to-gold/30 flex items-center justify-center text-[11px] font-bold text-black">B&amp;P</div>
            <div className="min-w-0">
              <div className="text-white text-sm leading-tight truncate">{EX.nome}</div>
              <div className="text-[11px] text-green-400/80 leading-tight">{typing ? 'RL PhotoVideo a escrever…' : 'online'}</div>
            </div>
          </div>
          {/* Conversa */}
          <div ref={conversa} className="h-[420px] overflow-y-auto px-3 py-4 flex flex-col"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
            {typing ? (
              <div className="mt-auto self-end rounded-2xl rounded-tr-sm bg-[#005c4b] px-4 py-3 flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${d * 140}ms` }} />
                ))}
              </div>
            ) : (
              <div className="mt-auto self-end max-w-[92%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3 pt-2 pb-1.5 shadow">
                <p className="text-[12.5px] leading-[1.45] text-[#e9edef] whitespace-pre-wrap break-words">
                  {texto.slice(0, shown)}
                  {shown < texto.length && <span className="inline-block w-[2px] h-3 bg-white/70 align-middle ml-0.5 animate-pulse" />}
                </p>
                <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-white/50">
                  16:02 <span className={shown >= texto.length ? 'text-sky-400' : ''}>✓✓</span>
                </div>
              </div>
            )}
          </div>
          {/* Barra de escrita */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#1f2c34]">
            <div className="flex-1 rounded-full bg-[#2a3942] px-4 py-2 text-[12px] text-white/30">Mensagem</div>
            <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-black text-sm">➤</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Réplica do botão do card do CRM ── */
function CrmBtn({ estado, children, onClick }: { estado: 'ativo' | 'bloqueado' | 'enviado'; children: React.ReactNode; onClick?: () => void }) {
  const base = 'w-full text-[11px] font-semibold tracking-wider uppercase text-center px-3 py-2 rounded-lg border transition-all'
  if (estado === 'ativo') return (
    <button onClick={onClick} className={`${base} border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 hover:scale-[1.02]`}>{children}</button>
  )
  return (
    <div className={`${base} border-white/10 text-white/35 bg-white/[0.03] cursor-not-allowed select-none`}>
      {estado === 'enviado' ? '✓ ' : '🔒 '}{children}
    </div>
  )
}

/* ── Simulador da linha do tempo do follow up ── */
function SimuladorFollowUp({ onVer }: { onVer: (qual: 'f1' | 'f2') => void }) {
  const [dia, setDia] = useState(0)
  const [env1, setEnv1] = useState<number | null>(null)
  const [env2, setEnv2] = useState<number | null>(null)
  const MAX = 16

  const moverDia = (d: number) => {
    setDia(d)
    if (env1 !== null && d < env1) { setEnv1(null); setEnv2(null) }
    else if (env2 !== null && d < env2) setEnv2(null)
  }

  const faltam1 = Math.max(0, FOLLOW_WA_DIAS - dia)
  const faltam2 = env1 === null ? null : Math.max(0, FOLLOW2_WA_DIAS - (dia - env1))
  const marcos = [
    { d: 0, label: 'Reunião', cor: '#c084fc' },
    { d: FOLLOW_WA_DIAS, label: '1.º disponível', cor: '#fbbf24' },
    ...(env1 !== null ? [{ d: env1 + FOLLOW2_WA_DIAS, label: '2.º disponível', cor: '#fb923c' }] : []),
  ].filter(m => m.d <= MAX)

  return (
    <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-400/[0.06] to-transparent p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
        <div>
          <div className="text-[10px] tracking-[0.35em] uppercase text-amber-300/70">Simulador</div>
          <h3 className="text-white text-2xl sm:text-3xl font-light mt-1" style={SERIF}>E se passarem uns dias…</h3>
          <p className="text-white/40 text-sm mt-1">Arrasta os dias e vê o card da lead a mudar, tal como no CRM.</p>
        </div>
        <button onClick={() => { setDia(0); setEnv1(null); setEnv2(null) }}
          className="self-start sm:self-auto text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-gold transition-colors">↺ Recomeçar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-center">
        {/* Linha do tempo */}
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-extralight text-white tabular-nums">{dia}</span>
            <span className="text-white/40 text-sm">{dia === 1 ? 'dia' : 'dias'} depois da reunião</span>
          </div>
          <div className="relative pt-7 pb-2">
            {marcos.map(m => (
              <div key={m.label} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${(m.d / MAX) * 100}%` }}>
                <span className="text-[9px] tracking-wider uppercase whitespace-nowrap" style={{ color: m.cor }}>{m.label}</span>
                <span className="w-px h-3 mt-0.5" style={{ background: m.cor }} />
              </div>
            ))}
            <input type="range" min={0} max={MAX} value={dia} onChange={e => moverDia(+e.target.value)}
              aria-label="Dias depois da reunião" className="w-full accent-amber-400 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-white/25 mt-1 tabular-nums"><span>0</span><span>{MAX / 2}</span><span>{MAX}</span></div>
          </div>
          <p className="text-white/45 text-xs mt-4 leading-relaxed">
            {env1 === null
              ? faltam1 > 0 ? `O 1.º follow up está bloqueado. Faltam ${faltam1} ${faltam1 === 1 ? 'dia' : 'dias'}.` : 'O 1.º follow up está disponível. Clica no botão verde do card para o "enviar".'
              : env2 !== null ? 'Os dois follow ups foram enviados. Agora é esperar pela decisão.'
              : faltam2! > 0 ? `1.º enviado no dia ${env1}. O 2.º desbloqueia daqui a ${faltam2} ${faltam2 === 1 ? 'dia' : 'dias'} se não responderem.` : 'Sem resposta ao 1.º? O 2.º follow up já está disponível.'}
          </p>
        </div>

        {/* Card da lead */}
        <div className="rounded-xl border border-white/10 bg-[#111111] p-4 flex flex-col gap-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-start justify-between">
            <span className="text-white text-sm font-medium">{EX.nome}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400">{dia}d</span>
          </div>
          <div className="flex justify-between text-xs text-white/35"><span>Casamento</span><span>{EX.casamento}</span></div>
          <span className="self-start text-xs px-2 py-1 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Negociação</span>
          {env1 !== null ? (
            <div className="flex flex-col gap-1.5">
              <CrmBtn estado="enviado">Follow up · Enviado</CrmBtn>
              {env2 !== null ? <CrmBtn estado="enviado">2.º Follow up · Enviado</CrmBtn>
                : faltam2! > 0 ? <CrmBtn estado="bloqueado">2.º Follow up · {faltam2 === 1 ? 'Falta 1 dia' : `Faltam ${faltam2} dias`}</CrmBtn>
                : <CrmBtn estado="ativo" onClick={() => { setEnv2(dia); onVer('f2') }}>2.º Follow up</CrmBtn>}
            </div>
          ) : faltam1 > 0 ? (
            <CrmBtn estado="bloqueado">Follow up · {faltam1 === 1 ? 'Falta 1 dia' : `Faltam ${faltam1} dias`}</CrmBtn>
          ) : (
            <CrmBtn estado="ativo" onClick={() => { setEnv1(dia); onVer('f1') }}>Follow up</CrmBtn>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Guião da chamada ── */
function GuiaoChamada() {
  const texto = ['ABERTURA', TELEFONEMA.intro, '', 'PERGUNTAR APENAS', ...TELEFONEMA.perguntas.map(p => '• ' + p), '', 'FECHO', TELEFONEMA.fecho, '', '➤ ' + TELEFONEMA.destaque].join('\n')
  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#0F1210] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <span className="text-[10px] tracking-[0.25em] uppercase text-green-400/60">📞 Guião da chamada · 2 min</span>
        <CopyButton text={texto} small />
      </div>
      <div className="px-4 py-4 flex flex-col gap-4 text-sm">
        <p className="text-white/70 italic leading-relaxed">{TELEFONEMA.intro}</p>
        <ul className="flex flex-col gap-1">
          {TELEFONEMA.perguntas.map(p => <li key={p} className="flex gap-2 text-white/70"><span className="text-green-400/60">›</span>{p}</li>)}
        </ul>
        <p className="text-white/70 italic leading-relaxed">{TELEFONEMA.fecho}</p>
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
          <div className="text-[10px] tracking-[0.25em] uppercase text-gold/80 font-semibold mb-1">Se aceitarem, perguntar já</div>
          <p className="text-white/85 leading-relaxed">{TELEFONEMA.destaque}</p>
        </div>
      </div>
    </div>
  )
}

/* ── PÁGINA ── */
export default function FollowUpPage() {
  const [etapaIdx, setEtapaIdx] = useState(0)
  const [origemId, setOrigemId] = useState('site')
  const [msgId, setMsgId] = useState<string | null>(null)
  const [objAberta, setObjAberta] = useState<number | null>(null)

  const etapa = ETAPAS[etapaIdx]
  const origem = ORIGENS.find(o => o.id === origemId) ?? ORIGENS[0]
  const msgs = mensagensDa(etapa.id, origem)
  const msg = msgs.find(m => m.id === msgId) ?? msgs[0]

  const irPara = (i: number) => { setEtapaIdx(Math.max(0, Math.min(ETAPAS.length - 1, i))); setMsgId(null) }

  // Setas do teclado para navegar entre etapas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return
      if (e.key === 'ArrowRight') irPara(etapaIdx + 1)
      if (e.key === 'ArrowLeft') irPara(etapaIdx - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [etapaIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const verNoSimulador = (qual: 'f1' | 'f2') => {
    setMsgId(qual)
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <main className="min-h-screen pb-20">
      {/* ── HERO ── */}
      <header className="relative h-[46vh] min-h-[320px] overflow-hidden">
        <img src={HERO_URL} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <Link href="/crm" className="absolute top-5 left-4 sm:left-8 text-xs tracking-[0.3em] text-white/60 hover:text-gold transition-colors uppercase">‹ Voltar ao CRM</Link>
        <div className="relative h-full max-w-[1200px] mx-auto px-4 sm:px-8 flex flex-col justify-center">
          <span className="text-[10px] sm:text-xs tracking-[0.4em] uppercase text-gold/80">Follow up · Jornada do cliente</span>
          <h1 className="text-5xl sm:text-7xl font-light text-gold mt-2 leading-none" style={SERIF}>Da lead à última entrega</h1>
          <div className="w-20 h-px bg-gold/70 my-5" />
          <p className="text-white/70 text-base sm:text-xl italic max-w-xl leading-relaxed" style={SERIF}>
            O seguimento é onde a maioria desiste. É exatamente por isso que é onde nós nos destacamos, do primeiro olá ao álbum entregue.
          </p>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* ── STEPPER por fases (desliza na horizontal) ── */}
        <nav aria-label="Etapas" className="relative -mt-10 sm:-mt-12 z-10 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-3 sm:p-4">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {FASES.map(f => {
              const lista = ETAPAS.map((e, i) => ({ e, i })).filter(x => x.e.fase === f.id)
              const faseAtiva = etapa.fase === f.id
              return (
                <div key={f.id} className="shrink-0 flex flex-col">
                  <div className={`px-1 mb-2 text-[9px] tracking-[0.35em] uppercase transition-colors ${faseAtiva ? 'text-gold' : 'text-white/30'}`}>
                    {f.titulo} <span className="normal-case tracking-normal text-white/25">· {f.sub}</span>
                  </div>
                  <div className="flex items-start">
                    {lista.map(({ e, i }, k) => {
                      const ativa = i === etapaIdx
                      const feita = i < etapaIdx
                      return (
                        <div key={e.id} className="flex items-start">
                          <button onClick={() => irPara(i)} className="relative w-[76px] flex flex-col items-center gap-1.5 group" aria-current={ativa ? 'step' : undefined}>
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border transition-all duration-300 ${
                              ativa ? 'scale-110 text-black' : feita ? 'text-white/80 bg-[#1a1a1a]' : 'text-white/35 bg-[#111] group-hover:text-white/70'
                            }`}
                              style={{ borderColor: ativa || feita ? e.cor : 'rgba(255,255,255,0.12)', background: ativa ? e.cor : undefined, boxShadow: ativa ? `0 0 24px ${e.cor}66` : undefined }}>
                              {feita ? '✓' : e.icon}
                            </span>
                            <span className={`text-[9px] tracking-[0.1em] uppercase text-center leading-tight transition-colors ${ativa ? 'text-white' : 'text-white/35 group-hover:text-white/60'}`}>{e.titulo}</span>
                          </button>
                          {k < lista.length - 1 && <span className="mt-5 w-3 h-px shrink-0" style={{ background: feita ? e.cor : 'rgba(255,255,255,0.12)' }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        {/* ── ETAPA ATIVA ── */}
        <section key={etapa.id} className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start animate-[fadeUp_.45s_ease-out]">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: etapa.cor }}>Etapa {etapaIdx + 1} de {ETAPAS.length}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border border-white/10 text-white/50">Onde · {etapa.coluna}</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">{FASES.find(f => f.id === etapa.fase)?.titulo}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-light text-white mt-3" style={SERIF}>{etapa.titulo}</h2>
            <p className="text-white/55 mt-3 leading-relaxed max-w-2xl">{etapa.resumo}</p>

            {/* Passos */}
            <ol className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {etapa.passos.map((p, i) => (
                <li key={p} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 flex gap-3">
                  <span className="text-lg font-light tabular-nums" style={{ color: etapa.cor, ...SERIF }}>{i + 1}</span>
                  <span className="text-white/70 text-sm leading-snug">{p}</span>
                </li>
              ))}
            </ol>

            {/* Regras e prazos desta etapa */}
            {etapa.regras && etapa.regras.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 text-[10px] tracking-[0.3em] uppercase" style={{ color: etapa.cor }}>Regras e prazos</div>
                {etapa.regras.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)] gap-x-4 gap-y-0.5 px-4 py-2.5 border-b border-white/[0.04] last:border-0 text-sm">
                    <span className="text-white/85">{r.quando}</span>
                    <span className="text-white/55">{r.oque}</span>
                    <span className="text-white/30 text-xs sm:text-right self-center">{r.onde}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Origem (só no primeiro contacto) */}
            {etapa.id === 'contacto' && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {ORIGENS.map(o => (
                    <button key={o.id} onClick={() => { setOrigemId(o.id); setMsgId(null) }}
                      className={`px-4 py-2 rounded-xl border text-xs tracking-[0.15em] uppercase transition-all ${o.id === origemId ? 'border-gold/50 bg-gold/10 text-gold' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-gold/30'}`}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-white/40 text-sm mt-3 leading-relaxed">{origem.descricao}</p>
              </div>
            )}

            {/* Mensagens da etapa */}
            {msgs.length > 0 && (
              <div className="mt-8">
                <div className="text-[10px] tracking-[0.35em] uppercase text-white/30 mb-3">Mensagens desta etapa</div>
                <div className="flex flex-col gap-2">
                  {msgs.map(m => {
                    const ativa = m.id === msg?.id
                    return (
                      <button key={m.id} onClick={() => setMsgId(m.id)}
                        className={`text-left rounded-xl border px-4 py-3 flex items-center gap-4 transition-all ${ativa ? 'bg-white/[0.05]' : 'border-white/8 hover:border-white/20 hover:bg-white/[0.02]'}`}
                        style={{ borderColor: ativa ? etapa.cor + '80' : undefined }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ativa ? etapa.cor : 'rgba(255,255,255,0.2)' }} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-white text-sm">{m.label}</span>
                          <span className="block text-white/35 text-xs mt-0.5">{m.quando}</span>
                        </span>
                        {m.botao
                          ? <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-md border border-green-500/30 text-green-400 bg-green-500/10">Botão no CRM</span>
                          : m.onde
                            ? <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-md border border-green-500/30 text-green-400 bg-green-500/10">{m.onde}</span>
                            : <span className="shrink-0 text-[9px] tracking-[0.15em] uppercase px-2 py-1 rounded-md border border-white/10 text-white/35">Copiar</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {etapa.id === 'nova' && <div className="mt-8"><GuiaoChamada /></div>}

            {etapa.id === 'reuniao' && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">Sem data e hora na ficha</div>
                  <CrmBtn estado="bloqueado">Agendar reunião</CrmBtn>
                </div>
                <div className="rounded-xl border border-purple-400/20 bg-purple-400/[0.04] p-4 flex flex-col gap-1.5">
                  <div className="text-[10px] tracking-[0.25em] uppercase text-purple-300/70 mb-1.5">Depois de preencher e Enviar</div>
                  <CrmBtn estado="ativo" onClick={() => setMsgId('portal')}>Portal da reunião</CrmBtn>
                  <CrmBtn estado="ativo" onClick={() => setMsgId('lembrete')}>Lembrete: falta 1 hora</CrmBtn>
                </div>
              </div>
            )}

            {etapa.id === 'decisao' && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-green-500/25 bg-green-500/[0.05] p-5">
                  <div className="text-3xl font-light text-green-400" style={SERIF}>Fechou</div>
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">Confirmam a proposta no portal e preenchem os dados. Em 2 a 3 dias recebem o portal dos noivos.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-3xl font-light text-white/60" style={SERIF}>Não fechou</div>
                  <p className="text-white/50 text-sm mt-2 leading-relaxed">Escolhe o motivo (preço, data ocupada, outro fornecedor…). Alimenta as estatísticas do CRM.</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3 items-start rounded-xl border border-gold/15 bg-gold/[0.04] px-4 py-3">
              <span className="text-gold/70">💡</span>
              <p className="text-white/55 text-sm italic leading-relaxed">{etapa.dica}</p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => irPara(etapaIdx - 1)} disabled={etapaIdx === 0}
                className="text-xs tracking-[0.25em] uppercase text-white/40 hover:text-gold disabled:opacity-20 disabled:hover:text-white/40 transition-colors">‹ Anterior</button>
              <span className="hidden sm:block text-[10px] tracking-[0.25em] uppercase text-white/20">Usa as setas ← → do teclado</span>
              <button onClick={() => irPara(etapaIdx + 1)} disabled={etapaIdx === ETAPAS.length - 1}
                className="text-xs tracking-[0.25em] uppercase text-white/40 hover:text-gold disabled:opacity-20 disabled:hover:text-white/40 transition-colors">Seguinte ›</button>
            </div>
          </div>

          {/* Pré-visualização */}
          <aside id="preview" className="lg:sticky lg:top-6">
            {msg ? (
              <>
                <PhonePreview texto={msg.texto} chave={`${etapa.id}-${msg.id}-${origemId}`} />
                <div className="mt-4 flex items-center justify-between gap-3 max-w-[340px] mx-auto">
                  <span className="text-white/35 text-xs">
                    {msg.botao ? <>Sai sozinha pelo botão <span className="text-green-400">{msg.botao.toUpperCase()}</span></> : 'Copia e envia à mão'}
                  </span>
                  <CopyButton text={msg.texto} small />
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="text-6xl" style={{ ...SERIF, color: etapa.cor }}>{etapa.icon}</div>
                <div className="text-3xl text-white/85 mt-3" style={SERIF}>{etapa.titulo}</div>
                <p className="text-white/40 text-sm mt-3 leading-relaxed">Sem mensagens de WhatsApp nesta etapa. Segue as regras e os prazos ao lado.</p>
              </div>
            )}
          </aside>
        </section>

        {/* ── SIMULADOR ── */}
        {etapa.id === 'follow' && (
          <section className="mt-14 animate-[fadeUp_.45s_ease-out]">
            <SimuladorFollowUp onVer={verNoSimulador} />
          </section>
        )}

        {/* ── TODAS AS REGRAS NUM SÓ SÍTIO ── */}
        <section className="mt-20">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold/70">Consulta rápida</div>
          <h2 className="text-3xl sm:text-4xl font-light text-white mt-2" style={SERIF}>Todas as regras e prazos</h2>
          <p className="text-white/40 text-sm mt-2">Clica numa linha para ir à etapa.</p>
          <div className="mt-6 flex flex-col gap-6">
            {FASES.map(f => (
              <div key={f.id} className="rounded-2xl border border-white/8 overflow-hidden">
                <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-baseline gap-3">
                  <span className="text-xl font-light text-gold" style={SERIF}>{f.titulo}</span>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-white/30">{f.sub}</span>
                </div>
                {ETAPAS.map((e, i) => ({ e, i })).filter(x => x.e.fase === f.id).flatMap(({ e, i }) =>
                  (e.regras ?? []).map((r, k) => (
                    <button key={`${e.id}-${k}`} onClick={() => { irPara(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="w-full text-left grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1.2fr)] gap-x-4 gap-y-0.5 px-4 py-2.5 border-b border-white/[0.04] last:border-0 text-sm hover:bg-white/[0.03] transition-colors">
                      <span className="text-[11px] tracking-[0.1em] uppercase self-center" style={{ color: e.cor }}>{e.icon} {e.titulo}</span>
                      <span className="text-white/85">{r.quando}</span>
                      <span className="text-white/55">{r.oque}</span>
                      <span className="text-white/30 text-xs sm:text-right self-center">{r.onde}</span>
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── OBJEÇÕES ── */}
        <section className="mt-20">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold/70">Respostas prontas</div>
          <h2 className="text-3xl sm:text-4xl font-light text-white mt-2" style={SERIF}>Quando dizem…</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {OBJECOES.map((o, i) => {
              const aberta = objAberta === i
              return (
                <div key={o.titulo} className={`rounded-2xl border transition-colors ${aberta ? 'border-gold/30 bg-gold/[0.04] md:col-span-2' : 'border-white/8 bg-white/[0.02] hover:border-white/15'}`}>
                  <button onClick={() => setObjAberta(aberta ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                    <span className="text-white/85 text-lg italic" style={SERIF}>“{o.titulo}”</span>
                    <span className={`text-gold/60 transition-transform duration-300 ${aberta ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {aberta && (
                    <div className="px-5 pb-5">
                      <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">{o.resposta}</pre>
                      <div className="mt-3 flex justify-end"><CopyButton text={o.resposta} small /></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <p className="mt-16 text-center text-white/25 text-xs leading-relaxed">
          As mensagens com <span className="text-green-400/70">Botão no CRM</span> saem já personalizadas (nome, datas e portal) e ficam registadas no histórico da lead.
          Nas outras, substitui <span className="text-gold/60">[nome]</span>, <span className="text-gold/60">[data]</span> e <span className="text-gold/60">[hora]</span> antes de enviar.
        </p>
      </div>

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }`}</style>
    </main>
  )
}
