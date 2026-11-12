/* ============================================================
   Stories de 1 minuto: temas fora do calendário dos 12 meses.
   Negócio, empreendedorismo e confiança. Vertical, olhar na
   lente, ~130 palavras (cerca de 50-60 s de leitura).
   Texto em português europeu, sem travessões de ligação.
   ============================================================ */

import type { Paragrafo } from './guioes'

export type Categoria = 'Negócio' | 'Empreendedorismo' | 'Confiança'

export type Story = {
  id: string
  categoria: Categoria
  titulo: string
  /** Primeira frase: decide se ficam a ver. */
  gancho: string
  teleponto: Paragrafo[]
  /** Sticker interactivo a pôr na story. */
  sticker: string
  nota: string
}

export const CATEGORIAS: Categoria[] = ['Negócio', 'Empreendedorismo', 'Confiança']

export const STORIES: Story[] = [
  /* ── Negócio ─────────────────────────────────────────────── */
  {
    id: 'n1',
    categoria: 'Negócio',
    titulo: 'Porque é que não faço descontos',
    gancho: 'Todas as semanas alguém me pede desconto. E eu digo quase sempre que não.',
    teleponto: [
      { text: 'Não é arrogância. É respeito. Pelo casal que pagou o valor inteiro na semana passada, e pelo trabalho que vou fazer.' },
      { text: 'Quando baixo o preço só porque alguém pediu, estou a dizer que o valor anterior estava inflacionado. E não estava.' },
      { text: 'O que faço é outra coisa. Se o orçamento não chega, ajusto o serviço. Menos horas, menos uma câmara, outro formato. O preço de cada coisa mantém-se, o que muda é o que levam.' },
      { text: 'Assim ninguém sai a perder. O casal fica com algo feito com a mesma qualidade, e eu continuo a conseguir pagar a equipa, o equipamento e o tempo que cada filme exige.' },
      { text: 'Um negócio que vive de descontos acaba a trabalhar mais para ganhar menos. E quem paga isso, no fim, é o cliente.' },
    ],
    sticker: 'Sondagem: "Já pediste desconto num serviço?" Sim / Nunca',
    nota: 'Plano fixo, tom calmo e firme. Nada de sorrisos a pedir desculpa: o vídeo é sobre segurança.',
  },
  {
    id: 'n2',
    categoria: 'Negócio',
    titulo: 'O "não" que mais me ensinou',
    gancho: 'Perdi um casamento porque fui mais caro. E ainda bem.',
    teleponto: [
      { text: 'Durante muito tempo, cada "não" parecia uma derrota pessoal. Ficava a pensar no que tinha dito mal, se devia ter baixado o preço.' },
      { text: 'Até perceber uma coisa simples: não sou para toda a gente. E não tenho de ser.' },
      { text: 'Há casais que procuram o mais barato, e está tudo bem. Há casais que procuram alguém que lhes conte a história. São conversas diferentes.' },
      { text: 'Hoje, quando alguém diz que não, agradeço e desejo-lhes um dia incrível. A sério. Porque cada "não" abre espaço para um "sim" que encaixa mesmo.' },
      { text: 'Se estás a começar um negócio, guarda isto: o objetivo não é convencer toda a gente. É encontrar as pessoas certas.' },
    ],
    sticker: 'Caixa de perguntas: "Qual foi o não que mais te ensinou?"',
    nota: 'Pode ser gravado a andar, telemóvel na mão. Fica mais próximo, mais conversa.',
  },
  {
    id: 'n3',
    categoria: 'Negócio',
    titulo: 'O lado do negócio que ninguém vê',
    gancho: 'Vês os casamentos ao sábado. Não vês o resto da semana.',
    teleponto: [
      { text: 'Por cada dia de casamento há emails, reuniões, contratos, faturas, cópias de segurança, edição, entregas e muitas horas ao computador.' },
      { text: 'E há uma parte ainda menos bonita: este é um negócio sazonal. Há meses em que entra muito e meses em que entra quase nada.' },
      { text: 'Por isso aprendi a pensar no ano inteiro, não no mês. O que se ganha no verão tem de pagar o inverno.' },
      { text: 'Ser fotógrafo ou videógrafo é metade arte, metade gestão. Se só cuidares da arte, a gestão cobra-te mais tarde.' },
      { text: 'Se quiseres, mostro-te como é uma terça-feira normal aqui. Diz-me na caixa de perguntas.' },
    ],
    sticker: 'Caixa de perguntas: "O que queres ver dos bastidores?"',
    nota: 'Cortes rápidos de B-roll: caixa de email, discos de backup, timeline do Resolve, café, calendário.',
  },
  {
    id: 'n4',
    categoria: 'Negócio',
    titulo: 'Responder rápido vale ouro',
    gancho: 'Sabes qual é a primeira coisa que faz um cliente escolher-te? Não é o portefólio.',
    teleponto: [
      { text: 'É a rapidez com que respondes.' },
      { text: 'Quando alguém pede um orçamento, normalmente pede a três ou quatro pessoas ao mesmo tempo. Quem responde primeiro, com cuidado e sem textos copiados, já começa à frente.' },
      { text: 'Eu tento responder no próprio dia. Nem sempre com tudo resolvido, mas sempre com uma resposta humana: recebi, vou ver e falo contigo até amanhã.' },
      { text: 'Parece pouco. Mas diz ao cliente que ele importa e que, no dia do casamento, também vai haver alguém atento.' },
      { text: 'Em qualquer negócio, a forma como respondes a uma mensagem é a primeira amostra do teu serviço.' },
    ],
    sticker: 'Sondagem: "Quanto esperas por uma resposta antes de desistir?" Menos de 24 h / Mais de 24 h',
    nota: 'Abre com o som de uma notificação e o ecrã do telemóvel. Depois corta para ti.',
  },
  {
    id: 'n5',
    categoria: 'Negócio',
    titulo: 'Sistemas antes de talento',
    gancho: 'O talento faz-te começar. Os sistemas fazem-te aguentar.',
    teleponto: [
      { text: 'No início eu guardava tudo na cabeça. Datas, pagamentos, entregas, o que cada casal tinha pedido. Funcionou até deixar de funcionar.' },
      { text: 'Hoje cada casal tem um portal, cada fase tem um prazo e cada pagamento fica registado. Não porque goste de burocracia, mas porque não quero que nada dependa da minha memória num dia cansado.' },
      { text: 'Um sistema não é frio. É o que te deixa ser criativo, porque o resto já está tratado.' },
      { text: 'Se tens um pequeno negócio, começa por uma coisa: escreve o processo do teu serviço, do primeiro contacto até à entrega. Só isso já te vai mostrar onde estão os buracos.' },
    ],
    sticker: 'Sondagem: "Tens o teu processo escrito?" Sim / Está na cabeça',
    nota: 'Mostra dois segundos do portal dos noivos ou do CRM, desfocado o suficiente para não se ver nenhum nome.',
  },
  {
    id: 'n6',
    categoria: 'Negócio',
    titulo: 'Já recusei trabalho pago',
    gancho: 'Já recusei trabalho pago. E voltava a fazer o mesmo.',
    teleponto: [
      { text: 'Quando estás a começar, aceitas tudo. Faz sentido. Precisas de experiência e de faturar.' },
      { text: 'Mas chega uma altura em que cada sim tem um custo. Um sim a mais numa semana cheia é um trabalho entregue com menos cuidado. E isso afeta quem confiou em ti.' },
      { text: 'Hoje pergunto-me sempre: consigo fazer isto ao meu melhor nível? Se a resposta for não, digo que não. Com educação e, se puder, indico alguém de confiança.' },
      { text: 'Dizer não protege a qualidade, a equipa e a tua cabeça. E, curiosamente, as pessoas respeitam mais quem sabe dizer não.' },
    ],
    sticker: 'Caixa de perguntas: "Tens dificuldade em dizer não?"',
    nota: 'Plano médio, sentado. Pausa de um segundo depois do gancho antes de continuar.',
  },

  /* ── Empreendedorismo ───────────────────────────────────── */
  {
    id: 'e1',
    categoria: 'Empreendedorismo',
    titulo: 'Ninguém te vai dar autorização',
    gancho: 'Se estás à espera de te sentires pronto para começar, tenho uma má notícia.',
    teleponto: [
      { text: 'Esse dia não chega.' },
      { text: 'Nunca te vais sentir totalmente preparado. Vai faltar sempre equipamento, experiência, dinheiro ou tempo.' },
      { text: 'A diferença entre quem tem um negócio e quem ainda está a pensar nele raramente é talento. É ter começado com o que havia.' },
      { text: 'Começa pequeno. Um cliente, um serviço, uma página simples. Erra cedo, enquanto os erros ainda são baratos.' },
      { text: 'Ninguém te vai bater à porta a dizer que já podes. A autorização és tu que a dás.' },
    ],
    sticker: 'Sondagem: "Tens um projeto parado à espera do momento certo?" Sim / Já comecei',
    nota: 'Gancho em grande plano, o resto em plano médio. Última frase com olhar fixo na lente e corte seco.',
  },
  {
    id: 'e2',
    categoria: 'Empreendedorismo',
    titulo: 'O dia em que quis desistir',
    gancho: 'Houve um dia em que pensei seriamente em fechar tudo.',
    teleponto: [
      { text: 'Não vou fingir que empreender é só liberdade. Há meses em que as contas não batem, em que trabalhas até tarde e parece que ninguém vê.' },
      { text: 'Nesse dia, o que me segurou não foi motivação. Foi lembrar-me porque comecei. Uma mensagem de uns noivos a dizer que já tinham visto o filme dez vezes.' },
      { text: 'Aprendi que a vontade de desistir não é sinal de que estás no caminho errado. Muitas vezes é só sinal de que estás cansado.' },
      { text: 'Descansa. Fala com alguém. Ajusta o que tiver de ser ajustado. Mas não tomes decisões grandes num dia mau.' },
      { text: 'Se estás nessa fase agora, isto é para ti. Aguenta mais um bocado.' },
    ],
    sticker: 'Caixa de perguntas: "O que te faz continuar?"',
    nota: 'Ajusta a história ao teu momento real antes de gravar. Este vídeo só funciona se for verdadeiro. Sem música ou com piano muito baixo.',
  },
  {
    id: 'e3',
    categoria: 'Empreendedorismo',
    titulo: 'Não consegues fazer tudo sozinho',
    gancho: 'O maior erro que cometi no meu negócio foi querer fazer tudo sozinho.',
    teleponto: [
      { text: 'Filmar, fotografar, editar, responder a emails, tratar das faturas, das redes sociais. Tudo eu.' },
      { text: 'Achava que ninguém faria tão bem. E durante algum tempo talvez fosse verdade. Mas o negócio não crescia, porque eu era o limite.' },
      { text: 'Delegar custa. Custa dinheiro, custa confiança e custa aceitar que outra pessoa faça de forma diferente.' },
      { text: 'Mas é a única forma de cresceres sem te partires. Hoje trabalho com uma equipa e o resultado é melhor do que quando estava sozinho.' },
      { text: 'Começa por delegar aquilo que te tira energia e que outra pessoa faz bem. O resto vem depois.' },
    ],
    sticker: 'Sondagem: "Delegas ou fazes tudo tu?" Delego / Faço tudo',
    nota: 'B-roll da equipa num casamento: duas câmaras, alguém a ajustar o gimbal, o editor ao computador.',
  },
  {
    id: 'e4',
    categoria: 'Empreendedorismo',
    titulo: 'Constância ganha ao talento',
    gancho: 'Conheço pessoas muito mais talentosas do que eu que já desistiram.',
    teleponto: [
      { text: 'E não foi por falta de jeito. Foi por falta de constância.' },
      { text: 'Num negócio, o que conta não é o dia em que estás inspirado. É o que fazes nos dias normais. Responder, publicar, melhorar um bocadinho, aparecer outra vez.' },
      { text: 'Este projeto é um bom exemplo. Um vídeo por mês durante um ano. Não é muito. Mas feito todos os meses, ao fim de doze tens uma coisa que a maioria nunca chega a ter.' },
      { text: 'Não precisas de fazer muito. Precisas de não parar.' },
    ],
    sticker: 'Caixa de perguntas: "Que hábito queres manter este mês?"',
    nota: 'Mostra a película dos 12 meses desta página durante a frase do projeto.',
  },
  {
    id: 'e5',
    categoria: 'Empreendedorismo',
    titulo: 'Três coisas sobre dinheiro',
    gancho: 'Três coisas sobre dinheiro que gostava de ter sabido quando abri o meu negócio.',
    teleponto: [
      { text: 'Um: separa a conta da empresa da tua conta pessoal. Desde o primeiro dia. Se tudo cai no mesmo sítio, nunca sabes se estás a ganhar ou só a sobreviver.' },
      { text: 'Dois: o que entra não é todo teu. Uma parte é para impostos, outra para equipamento, outra para os meses fracos. Só o que sobra é salário.' },
      { text: 'Três: cria uma reserva. Uns meses de despesas guardados mudam a forma como tomas decisões. Deixas de aceitar tudo por medo.' },
      { text: 'Não sou consultor financeiro, isto é só o que a prática me ensinou. Mas se estás a começar, estas três já te poupam muitos sustos.' },
    ],
    sticker: 'Teste (quiz): "Qual destas fazes já?" Contas separadas / Reserva / Nenhuma',
    nota: 'Números 1, 2 e 3 em grande no ecrã, como no vídeo dos 5 erros. Ritmo rápido.',
  },
  {
    id: 'e6',
    categoria: 'Empreendedorismo',
    titulo: 'Pára de olhar para a concorrência',
    gancho: 'Se passas mais tempo a ver o que a concorrência faz do que a trabalhar no teu, isto é para ti.',
    teleponto: [
      { text: 'É normal olhar. Inspirar-se faz parte. O problema é quando começas a medir o teu valor pelo que os outros mostram.' },
      { text: 'As redes mostram os melhores momentos. Não mostram as dívidas, as noites mal dormidas nem os clientes que correram mal.' },
      { text: 'Quando copias alguém, ficas sempre em segundo lugar. Quando fazes à tua maneira, és o único.' },
      { text: 'Usa a concorrência como referência, nunca como régua. O teu caminho é o teu.' },
    ],
    sticker: 'Sondagem: "Comparas-te muito com os outros?" Muito / Pouco',
    nota: 'Abre com o polegar a fazer scroll num feed (sem contas identificáveis) e corta para ti a pousar o telemóvel.',
  },

  /* ── Confiança ──────────────────────────────────────────── */
  {
    id: 'c1',
    categoria: 'Confiança',
    titulo: 'Estar à frente da câmara assusta-me',
    gancho: 'Vou confessar uma coisa: passo a vida atrás da câmara e estar à frente dela assusta-me.',
    teleponto: [
      { text: 'Sei exatamente como pôr os outros à vontade. Faço isso em todos os casamentos. Mas quando a lente se vira para mim, a história é outra.' },
      { text: 'Decidi gravar estes vídeos à mesma. Não porque perdi o medo, mas porque percebi que ele não vai embora se eu ficar à espera.' },
      { text: 'A confiança não vem antes de fazer. Vem depois. Vem de fazer muitas vezes, mal no início e um bocadinho melhor de cada vez.' },
      { text: 'Se há alguma coisa que te assusta e que sabes que te faz falta, faz uma versão pequena hoje. Só uma.' },
    ],
    sticker: 'Sondagem: "Gostas de aparecer em vídeo?" Adoro / Nem por isso',
    nota: 'Grava este primeiro, quase sem cortes. Deixa ficar uma hesitação ou um riso: é o que o torna credível.',
  },
  {
    id: 'c2',
    categoria: 'Confiança',
    titulo: 'Síndrome do impostor',
    gancho: 'Às vezes ainda acho que alguém vai descobrir que não sou assim tão bom.',
    teleponto: [
      { text: 'Chama-se síndrome do impostor. E, pelo que vejo, quase toda a gente que leva o trabalho a sério já a sentiu.' },
      { text: 'O truque que uso é simples: olhar para factos, não para sensações. Quantos casais me confiaram o dia mais importante da vida deles? Quantos me recomendaram a amigos?' },
      { text: 'A sensação diz que não mereces. Os factos dizem outra coisa.' },
      { text: 'Duvidar de ti não é mau sinal. Normalmente quer dizer que te importas. Só não deixes que a dúvida tome as decisões por ti.' },
    ],
    sticker: 'Sondagem: "Já sentiste isto?" Muitas vezes / Às vezes',
    nota: 'Durante a frase dos factos, mostra em sequência rápida capturas de avaliações ou mensagens de noivos (com autorização).',
  },
  {
    id: 'c3',
    categoria: 'Confiança',
    titulo: 'Cobrar o que vales',
    gancho: 'Se tremes quando dizes o teu preço, o cliente sente.',
    teleponto: [
      { text: 'Durante muito tempo eu dizia o valor quase a pedir desculpa. E adivinha: era quando mais me pediam desconto.' },
      { text: 'A confiança no preço vem de saberes o que está lá dentro. As horas, a experiência, o equipamento, o cuidado. Quando sabes isso, o número deixa de ser uma opinião e passa a ser uma consequência.' },
      { text: 'Diz o preço, cala-te e deixa a pessoa pensar. O silêncio não é teu inimigo.' },
      { text: 'Quem cobra pouco por insegurança acaba cansado e ressentido. E isso nota-se no trabalho.' },
    ],
    sticker: 'Caixa de perguntas: "Qual é a tua maior dificuldade a falar de preços?"',
    nota: 'Depois de "cala-te", fica dois segundos em silêncio a olhar para a lente. É o momento do vídeo.',
  },
  {
    id: 'c4',
    categoria: 'Confiança',
    titulo: 'Quando eu erro',
    gancho: 'Já errei com clientes. E a forma como lidei com isso mudou o meu negócio.',
    teleponto: [
      { text: 'Erros acontecem. Um prazo que derrapa, um detalhe que escapa, uma comunicação que não foi clara.' },
      { text: 'A tentação é justificar, explicar, arranjar culpados. Eu aprendi a fazer o contrário: assumir logo, pedir desculpa e dizer exatamente o que vou fazer para resolver.' },
      { text: 'Curiosamente, alguns dos clientes que mais me recomendam são aqueles com quem algo correu mal e foi bem resolvido.' },
      { text: 'A confiança não nasce de nunca falhar. Nasce de saberem que, quando falhas, tu apareces.' },
    ],
    sticker: 'Sondagem: "Preferes um serviço perfeito ou honesto?" Perfeito / Honesto',
    nota: 'Tom sério mas tranquilo. Sem B-roll, só tu: a força está em dar a cara.',
  },
  {
    id: 'c5',
    categoria: 'Confiança',
    titulo: 'O que é que os outros vão pensar',
    gancho: '"O que é que os outros vão pensar?" Esta pergunta já parou mais projetos do que a falta de dinheiro.',
    teleponto: [
      { text: 'Quando decidi ter um negócio meu, o maior medo não era falhar. Era o que iam dizer se falhasse.' },
      { text: 'Depois percebi uma coisa: as pessoas pensam muito menos em nós do que achamos. Estão ocupadas com as vidas delas.' },
      { text: 'E as que criticam raramente são as que estão a tentar alguma coisa.' },
      { text: 'Ouve quem já fez o caminho e quer o teu bem. O resto é ruído.' },
      { text: 'Faz. Ajusta. Volta a fazer.' },
    ],
    sticker: 'Caixa de perguntas: "O que farias se ninguém estivesse a ver?"',
    nota: 'As três palavras finais em texto grande no ecrã, uma a uma, ao ritmo da fala.',
  },
  {
    id: 'c6',
    categoria: 'Confiança',
    titulo: 'Confiança é promessa cumprida',
    gancho: 'Como é que alguém confia em ti sem te conhecer?',
    teleponto: [
      { text: 'Os noivos que me contratam estão a entregar-me um dia que não se repete. Muitas vezes, quase sem me conhecerem.' },
      { text: 'Essa confiança não se ganha com um discurso bonito. Ganha-se com coisas pequenas. Responder quando disseste que respondias. Chegar à hora. Entregar no prazo. Dizer a verdade, mesmo quando não é o que querem ouvir.' },
      { text: 'Cada promessa pequena cumprida é um tijolo. Uma promessa falhada tira três.' },
      { text: 'Isto vale para negócios, amizades e relações. Promete menos, cumpre sempre.' },
    ],
    sticker: 'Sondagem: "O que pesa mais para confiares numa marca?" Opiniões / Rapidez',
    nota: 'B-roll de entrega: pen ou caixa a ser fechada, noivos a ver o filme. Fecha contigo em plano próximo.',
  },
]

/** Regras rápidas para as stories de 1 minuto. */
export const DICAS_STORIES: string[] = [
  'Vertical 9:16, telemóvel à altura dos olhos e luz de janela de frente.',
  'O gancho diz-se nos primeiros 3 segundos e aparece também escrito no ecrã.',
  'Legendas sempre: a maioria vê as stories sem som.',
  'Põe o sticker interactivo a meio do vídeo, não no fim. As respostas dão ideias para as próximas stories.',
  'Grava 4 ou 5 de seguida no mesmo dia e publica 1 ou 2 por semana, intercaladas com bastidores.',
  'Guarda as melhores em destaque ("Negócio", "Bastidores") para quem chega ao perfil pela primeira vez.',
]
