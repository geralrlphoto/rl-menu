/* ============================================================
   Guiões "12 Meses, 12 Vídeos" — setembro 2026 a agosto 2027.
   Fonte: pasta rl-guioes (PLANO.md + guioes/*.md).
   Texto em português europeu, sem travessões de ligação.
   ============================================================ */

export type Estado = 'por gravar' | 'gravado' | 'editado' | 'publicado'

/** Parágrafo do teleponto. `label` sai a negrito antes do texto. */
export type Paragrafo = { label?: string; text?: string }

export type Guiao = {
  n: number
  mes: string
  ano: number
  titulo: string
  duracao: string
  estado: Estado
  publicacao?: string
  nota: string
  teleponto: Paragrafo[]
}

export const GUIOES: Guiao[] = [
  {
    n: 1,
    mes: 'Setembro',
    ano: 2026,
    titulo: 'Quanto custa realmente um vídeo de casamento',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Plano médio, olhar na lente, fundo desfocado. Sem música na abertura. Corta de 8 em 8 segundos para B-roll: mãos a editar no Resolve, o timeline, discos de backup, a mala de equipamento, um casal a rir. Ajusta o número de horas ao teu real antes de gravares.',
    teleponto: [
      { text: 'Quanto custa um vídeo de casamento? Antes de olhares para o valor, olha para o que está lá dentro.' },
      { text: 'No dia, são doze a catorze horas seguidas de trabalho, quase sempre com mais do que uma pessoa e mais do que uma câmara. Mas o dia é só a ponta do icebergue.' },
      { text: 'Depois vem a edição. Cada casamento dá origem a horas e horas de imagem e som que alguém tem de ver, escolher, montar, corrigir a cor e tratar o áudio. Isto demora semanas, não demora tardes.' },
      { text: 'E há tudo o que nunca aparece: as reuniões antes, a visita aos espaços, as cópias de segurança em vários discos, o equipamento duplicado para o caso de alguma coisa falhar.' },
      { text: 'É por isso que trabalho com um prazo de cento e oitenta dias úteis. Não é lentidão. É o tempo que um filme precisa para ficar bem feito.' },
      { text: 'Por isso, quando compararem orçamentos, não comparem apenas números. Perguntem quantas pessoas vão estar lá, o que acontece se uma câmara falhar, e quem vai editar o vosso filme.' },
      { text: 'O preço explica-se sempre. O arrependimento, não.' },
    ],
  },
  {
    n: 2,
    mes: 'Outubro',
    ano: 2026,
    titulo: 'O que é um Same Day Edit',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Abre com som ambiente da festa, sem voz, dois segundos.',
    teleponto: [
      { text: 'Imaginem isto. São onze da noite, a festa está a meio, as luzes baixam e aparece um ecrã.' },
      { text: 'E o que os vossos convidados veem não são fotografias antigas. É o dia de hoje. A manhã dos preparativos, a entrada na igreja, a cara do noivo, o primeiro abraço da vossa mãe. Tudo aquilo que aconteceu há poucas horas, já montado, já com música.' },
      { text: 'Isto chama-se Same Day Edit. Enquanto vocês jantam, há alguém a editar ali ao lado, contra o relógio, para vos entregar um filme do próprio dia.' },
      { text: 'E acontece sempre a mesma coisa. A sala cala-se. As pessoas choram. E depois voltam para a pista com outra energia, porque acabaram de reviver o dia juntos.' },
      { text: 'Não substitui o filme final. É outra coisa. É o momento em que a vossa história é contada em voz alta, à frente de toda a gente que vos quer bem.' },
      { text: 'Se quiserem perceber como isto funciona no vosso casamento, falem comigo. Explico tudo numa conversa.' },
    ],
  },
  {
    n: 3,
    mes: 'Novembro',
    ano: 2026,
    titulo: 'Os 5 erros ao escolher fotógrafo e videógrafo',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Numera os erros com grafismo grande no ecrã. Ritmo rápido.',
    teleponto: [
      { text: 'Cinco erros que vejo noivos a cometer. Todos os meses.' },
      { text: 'Primeiro: escolher só pelo preço. O casamento passa num dia. As imagens ficam para os vossos filhos verem.' },
      { text: 'Segundo: contratar sem falar com a pessoa. Vão ter alguém colado a vocês durante catorze horas, no dia mais emocional da vossa vida. Se não houver química, vê-se nas fotografias.' },
      { text: 'Terceiro: não perguntar quem vai lá estar. Muita gente vende o nome e manda outra pessoa. Perguntem sempre quem grava e quem edita.' },
      { text: 'Quarto: não perguntar o que acontece se falhar. Se uma câmara avaria, se um cartão corrompe, há plano B? Há cópias de segurança? Se ninguém responde a isto com clareza, é um sinal.' },
      { text: 'Quinto, e o mais comum: deixar para o fim. Os melhores dias saem primeiro. Quem decide tarde escolhe entre o que sobrou.' },
      { text: 'Não precisam de me escolher a mim. Mas façam estas cinco perguntas a quem escolherem.' },
    ],
  },
  {
    n: 4,
    mes: 'Dezembro',
    ano: 2026,
    titulo: 'Ficaram noivos? Os primeiros três passos',
    duracao: '60-90s',
    estado: 'por gravar',
    publicacao: '20 de dezembro',
    nota: 'Publica a 20 de dezembro. Tom caloroso, quase de conversa.',
    teleponto: [
      { text: 'Se pediram ou receberam um pedido de casamento nestes dias, parabéns. E respirem, porque agora vem o barulho todo.' },
      { text: 'Vão receber conselhos de toda a gente. Tia, madrinha, colega de trabalho, todos vão ter uma opinião sobre o vosso casamento.' },
      { text: 'Façam só três coisas primeiro.' },
      { text: 'Um: decidam a data e a estação do ano. Não o dia exacto, mas o mês. Isto define tudo o resto.' },
      { text: 'Dois: definam quantas pessoas querem. Cinquenta é um casamento. Duzentos e cinquenta é outro completamente diferente. Espaço, comida e orçamento saem daqui.' },
      { text: 'Três: fechem o espaço. É o que esgota mais depressa e é a peça que manda em todas as outras.' },
      { text: 'Só depois disto é que faz sentido falar de fotografia, vídeo, flores ou música.' },
      { text: 'E um aviso: as datas de maio a setembro voam. Se o vosso coração está num sábado de verão, comecem já.' },
      { text: 'Quando chegarem à parte das imagens, marquem uma conversa comigo. Sem compromisso.' },
    ],
  },
  {
    n: 5,
    mes: 'Janeiro',
    ano: 2027,
    titulo: 'A timeline do dia',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Usa um grafismo simples de linha temporal a preencher-se.',
    teleponto: [
      { text: 'O maior inimigo de um bom casamento não é a chuva. São os atrasos.' },
      { text: 'Deixem-me explicar porquê. O dia inteiro está encadeado. Se os preparativos derrapam meia hora, entram atrasados na igreja. Se saem atrasados da igreja, perdem a melhor luz do dia para as fotografias do casal. E depois pedem-me fotografias douradas ao pôr do sol quando já é noite escura.' },
      { text: 'Por isso, três regras.' },
      { text: 'Primeira: acrescentem trinta minutos a tudo o que vos disserem. Cabeleireiro, maquilhagem, trajecto. Tudo.' },
      { text: 'Segunda: protejam a hora antes do pôr do sol. Isso é vosso. Trinta minutos só os dois, longe dos convidados. São sempre as melhores imagens do dia.' },
      { text: 'Terceira: façam as fotografias de grupo em lista escrita e nomeiem alguém da família para chamar as pessoas. Sem isso, perdem quarenta minutos a procurar tios pelo jardim.' },
      { text: 'Uma timeline bem feita não vos tira liberdade. Dá-vos tempo para estarem presentes.' },
      { text: 'Eu construo esta timeline com todos os casais que acompanho. Falem comigo.' },
    ],
  },
  {
    n: 6,
    mes: 'Fevereiro',
    ano: 2027,
    titulo: 'Pré-wedding, para que serve',
    duracao: '60-90s',
    estado: 'por gravar',
    publicacao: 'semana do Dia dos Namorados',
    nota: 'Publica na semana do Dia dos Namorados. Muito B-roll de Sintra.',
    teleponto: [
      { text: 'Quase todos os casais me dizem a mesma frase: nós não somos nada bons em fotografias.' },
      { text: 'E depois vão para o dia mais importante da vida, com duzentas pessoas a olhar, e esperam sentir-se à vontade em frente a uma câmara. Não faz sentido nenhum.' },
      { text: 'É para isso que serve a sessão de pré-wedding.' },
      { text: 'Passamos duas horas juntos, num sítio que vos diga alguma coisa. Sem pressa, sem convidados, sem horários. E acontece sempre o mesmo. Nos primeiros dez minutos estão rígidos. Ao fim de vinte, esqueceram-se de mim.' },
      { text: 'No dia do casamento, isso vale ouro. Já me conhecem, já sabem como trabalho, já sabem que não sou eu a mandar em vocês.' },
      { text: 'E ficam com imagens para o convite, para o mural de entrada, para o vídeo de abertura da festa.' },
      { text: 'Não é uma sessão de fotografias. É um ensaio para o dia que interessa.' },
      { text: 'Se querem fazer a vossa, digam-me. Escolhemos o sítio juntos.' },
    ],
  },
  {
    n: 7,
    mes: 'Março',
    ano: 2027,
    titulo: 'Os bastidores de uma entrevista aos noivos',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Mostra o setup: luz, microfone, cadeira. Alterna com pedaços reais de resposta.',
    teleponto: [
      { text: 'Há uma parte do meu trabalho que quase ninguém mostra. E é a que mais muda o resultado final.' },
      { text: 'Antes do casamento, sento-me com cada um dos noivos. Separadamente. Com uma câmara à frente e uma pergunta simples.' },
      { text: 'Quando é que percebeste que era esta pessoa?' },
      { text: 'E depois faço silêncio. É no silêncio que aparecem as respostas verdadeiras.' },
      { text: 'Faço o mesmo com pais, padrinhos e avós. Sem guião decorado, sem frases feitas.' },
      { text: 'Estas vozes são o que sustenta o filme todo. Sem elas, um vídeo de casamento é uma sequência bonita de imagens. Com elas, passa a ser uma história contada por quem a viveu.' },
      { text: 'E há uma coisa que ninguém pensa quando está a escolher fornecedores. Daqui a vinte anos, o que vai ter mais valor não é o plano do bolo. É ouvir a voz do teu avô a falar de ti.' },
      { text: 'É por isto que trabalho assim.' },
    ],
  },
  {
    n: 8,
    mes: 'Abril',
    ano: 2027,
    titulo: 'Cerimónia civil ou religiosa, o que muda',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Divide o ecrã ao meio para comparar. Ritmo informativo, seco.',
    teleponto: [
      { text: 'Civil ou religiosa? Para vocês é uma escolha de fé e de família. Para mim, muda a forma de trabalhar.' },
      { text: 'Na igreja, as regras são do padre, não minhas. Há paróquias onde não posso passar de um ponto, onde não posso usar luz, onde não posso circular durante a comunhão. Por isso trabalho sempre com teleobjectiva, de longe e em silêncio. E ligo à paróquia antes, para saber o que é permitido.' },
      { text: 'A cerimónia é mais longa e tem momentos fixos: entrada, alianças, bênção, saída. Sei sempre onde estar.' },
      { text: 'Na civil é o contrário. É curta, às vezes dez minutos, e pode ser em qualquer sítio. Aí o problema é outro: se estiver ao ar livre ao meio-dia, tenho sol a pique e sombras duras nas caras. E o som pode ser péssimo se houver vento.' },
      { text: 'Nenhuma é melhor. Só exigem preparação diferente.' },
      { text: 'Se ainda estão a decidir, digam-me onde estão a pensar e explico o que esperar em cada caso.' },
    ],
  },
  {
    n: 9,
    mes: 'Maio',
    ano: 2027,
    titulo: 'Como estar à vontade em frente à câmara',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Tom leve, quase divertido. Mostra bloopers e risos reais.',
    teleponto: [
      { text: 'Vou dizer-vos um segredo. Ninguém está à vontade em frente a uma câmara. Nem eu.' },
      { text: 'A diferença é que há coisas simples que resolvem quase tudo.' },
      { text: 'Primeira: parem de posar. Não vos vou pedir para sorrir para a câmara. Vou pedir-vos para andarem, para falarem um com o outro, para se abraçarem. As melhores fotografias acontecem entre as poses, não durante.' },
      { text: 'Segunda: mãos. É a coisa que mais denuncia nervosismo. Deem-lhes trabalho. Segurem a cara um do outro, ajeitem o casaco, peguem nas mãos.' },
      { text: 'Terceira: falem. Se estiverem calados a olhar para mim, vão ficar duros. Contem uma história um ao outro. Eu apanho a reacção.' },
      { text: 'Quarta, e a mais importante: façam a sessão de pré-wedding. Vinte minutos com a câmara antes do casamento vale mais do que qualquer conselho meu.' },
      { text: 'E a última: confiem em quem contrataram. Se eu vos disser que está bom, está bom.' },
    ],
  },
  {
    n: 10,
    mes: 'Junho',
    ano: 2027,
    titulo: 'Um casamento do princípio ao fim',
    duracao: 'até 3 min',
    estado: 'por gravar',
    nota: 'Este pode ir até três minutos. É o vídeo âncora do ano.',
    teleponto: [
      { text: 'Deixem-me contar-vos como é um dia de casamento visto do meu lado.' },
      { text: 'Chego de manhã, normalmente às nove. Começo pelos detalhes: o vestido pendurado, as alianças, o convite, a luz a entrar pela janela. Não é enchimento. É o princípio da história.' },
      { text: 'Depois vêm os preparativos. É onde estão os nervos verdadeiros, as mãos a tremer, a mãe a fechar o vestido, o pai que não consegue olhar.' },
      { text: 'A cerimónia é o momento em que eu desapareço. Fico longe, com lentes longas. Vocês nunca me devem ver ali.' },
      { text: 'A seguir, o retrato. Trinta minutos só os dois, ao fim da tarde, quando a luz fica dourada. É o único momento do dia em que estão sozinhos.' },
      { text: 'E depois é a festa. Discursos, primeira dança, a pista cheia, os que não se sentam a noite toda.' },
      { text: 'Saio por volta das duas da manhã, com cartões cheios e a certeza de que aquilo já não volta a acontecer.' },
      { text: 'E é exactamente por isso que faço isto assim.' },
    ],
  },
  {
    n: 11,
    mes: 'Julho',
    ano: 2027,
    titulo: 'Live streaming do casamento',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Mostra o setup: câmara, portátil, OBS, o ecrã do YouTube.',
    teleponto: [
      { text: 'Há sempre alguém que não pode estar.' },
      { text: 'Uma avó que já não viaja. Um irmão emigrado que não consegue férias. Um amigo doente. E ficam a ver fotografias no dia seguinte, no telemóvel, sozinhos.' },
      { text: 'Isso já não tem de ser assim.' },
      { text: 'Faço transmissão em directo da vossa cerimónia. Câmara profissional, som ligado ao microfone da igreja, imagem estável, ligação privada e protegida. Só quem vocês quiserem é que entra.' },
      { text: 'E não é um telemóvel ao fundo da sala apoiado num banco. É uma emissão com qualidade, com o som limpo, onde se ouve o que vocês estão a dizer um ao outro.' },
      { text: 'Depois fica gravada. Podem enviar a quem não conseguiu ver na hora.' },
      { text: 'Já vi avós a assistir de uma cama de hospital. Já vi famílias inteiras do outro lado do mundo às três da manhã, a chorar em frente ao ecrã.' },
      { text: 'É um serviço pequeno que faz uma diferença enorme. Se acham que é o vosso caso, perguntem-me.' },
    ],
  },
  {
    n: 12,
    mes: 'Agosto',
    ano: 2027,
    titulo: 'Os noivos deste ano',
    duracao: '60-90s',
    estado: 'por gravar',
    nota: 'Praticamente sem voz tua. Corta entre depoimentos reais e imagens da época. Pede os depoimentos com antecedência: vídeos gravados no telemóvel, em vertical, com uma pergunta única, o que sentiram quando viram o vosso filme pela primeira vez.',
    teleponto: [
      { label: 'Abertura, dez segundos:' },
      { text: 'Este ano acompanhei dezenas de casais. Em vez de vos falar do meu trabalho, prefiro que sejam eles a falar.' },
      { label: 'Bloco central, quarenta a cinquenta segundos:', text: 'depoimentos dos noivos.' },
      { label: 'Fecho, quinze segundos:' },
      { text: 'Obrigado a todos. Foi um ano bonito.' },
      { text: 'Se estão a preparar o vosso casamento, gostava de vos conhecer. Marquem uma conversa comigo, sem compromisso nenhum. Falamos da vossa história e vemos se faz sentido.' },
      { text: 'Até para o ano.' },
    ],
  },
]

/* ── Plano de produção e distribuição (PLANO.md) ─────────────────────────── */

export const PLANO = {
  producao: [
    'Grava em blocos de 3 a 4 vídeos no mesmo dia, de preferência em janeiro, março e novembro. Assim não ficas dependente de gravar em época alta.',
    'Mantém a mesma roupa e o mesmo fundo dentro de cada bloco, para os vídeos parecerem uma série coerente.',
    'Grava sempre uma versão alternativa dos primeiros cinco segundos. É a parte que determina se ficam a ver.',
  ],
  formatos: [
    'YouTube: 4 a 7 minutos na versão longa, quando houver material para isso',
    'Reels e TikTok: 60 a 90 segundos, vertical, legendas queimadas',
    '3 cortes verticais adicionais por vídeo',
  ],
  distribuicao: [
    'Publica sempre na mesma semana do mês, por exemplo a segunda quarta-feira.',
    'Cada vídeo termina com a mesma chamada à acção: marcação de reunião através do formulário de leads.',
  ],
}
