/* ============================================================
   Catálogo de artigos pré-escritos para o blog RL Photo Video.
   Estes textos foram redigidos pelo Claude (Anthropic) em
   PT-PT premium editorial, sobre casamentos / fotografia / vídeo.

   Para adicionar mais artigos: pede-mos no chat e eu acrescento
   aqui mais entradas. Cada artigo é independente — copia o body
   inteiro para o teu blog.
   ============================================================ */

export type Article = {
  id: string
  title: string
  subtitle?: string
  body: string        // texto completo em parágrafos separados por \n\n
  keywords: string    // SEO keywords
  category: 'fotografia' | 'video' | 'pre-wedding' | 'preparacao' | 'pos-casamento'
  readingMin: number  // minutos de leitura aproximados
}

export const ARTICLES: Article[] = [
  {
    id: 'a01',
    title: 'A primeira pergunta que devias fazer ao vosso fotógrafo (e que quase ninguém faz)',
    subtitle: 'Não é o preço. Não é o pacote. É outra coisa.',
    category: 'fotografia',
    readingMin: 3,
    keywords: 'escolher fotógrafo casamento, contratar fotógrafo, portfolio casamento',
    body: `Quando começam a procurar fotógrafo de casamento, a maior parte dos casais pede sempre as mesmas coisas: portfolio, preço, pacote, horas de cobertura. São perguntas válidas. Mas há uma pergunta que vale por todas as outras juntas e quase ninguém faz.

**"Quem é que vai estar comigo no dia do casamento?"**

Parece óbvia. Não é. Em muitos estúdios, o portfolio que vos seduziu pertence a um fotógrafo, e quem aparece no dia é outro — um colaborador, um assistente, alguém em treino. O olhar do dono do portfolio nunca está na vossa galeria. Quando recebem as fotos meses depois, sentem que algo não bate certo. Não conseguem explicar o quê. É isso.

A nossa abordagem é simples: quem vocês veem no portfolio é quem está convosco. A pessoa que tem o olhar pelo qual vos apaixonaram é a mesma que vai estar a fotografar a vossa noiva a chorar quando viu o noivo pela primeira vez. Não é negociável.

A segunda pergunta que sugerimos: **"Posso ver um casamento completo?"** Não um best-of. Não 30 fotos seleccionadas. Um casamento inteiro. É aí que se vê se o fotógrafo é consistente nas 8 horas de cobertura, ou se só tem 5 boas fotos espalhadas por 50 casamentos.

A terceira: **"Como é a edição?"** A edição é metade do trabalho. Pedem para verem uma RAW e a final dessa mesma foto. Vão perceber imediatamente o nível de cuidado.

Não procurem o fotógrafo mais barato. Não procurem o mais caro. Procurem o que tem o olhar que vos faz parar. Depois certifiquem-se de que é ele que vai estar lá no vosso dia.`,
  },
  {
    id: 'a02',
    title: 'Sessão Pré-Wedding: porque é a melhor decisão antes do "sim"',
    category: 'pre-wedding',
    readingMin: 3,
    keywords: 'sessão pré-wedding, fotos antes do casamento, ensaio fotográfico noivos',
    body: `Há uma coisa que sentem o dia inteiro do casamento e ninguém vos avisou: estão a ser observados por dezenas de pessoas, em cada minuto. É bonito, mas é exaustivo. E para a maior parte dos casais, é a primeira vez na vida que têm uma câmara apontada a eles, neste registo, ao longo de 8 horas seguidas.

A sessão pré-wedding existe para nada disto vos apanhar de surpresa.

Numa tarde, 60 a 90 minutos, vão estar connosco num local que escolhem. Pode ser a praia onde se conheceram. A floresta onde fizeram o primeiro piquenique. A rua de Lisboa onde ele lhe pediu em casamento. Não há vestido. Não há cerimónia. Não há tempo a correr. Só vocês os dois e o nosso olhar a captar quem são.

**O que ganham:**

**Confiança em frente à câmara.** Saem da sessão a saber como reagir, o que fazer com as mãos, como olhar um para o outro sem sentir que estão a fazer pose. No dia do casamento, isto faz toda a diferença.

**Confiança em nós.** Vão ver como trabalhamos, como pensamos a luz, como pedimos coisas (ou não pedimos). Quando chegar o casamento, somos rostos familiares.

**Fotos editoriais únicas.** Não são fotos de pré-casamento clichés. Saem fotografias que podem usar em convites, websites, ou simplesmente colocar numa moldura grande na sala.

**Liberdade criativa.** No dia do casamento, há um cronograma. Na pré-wedding, não há. É aqui que arriscamos imagens que não se conseguem fazer no dia.

A nossa sugestão: marquem entre 2 a 4 meses antes do casamento. Tempo suficiente para receberem as fotos e ainda as poderem usar no convite ou nas redes.

E uma dica final — não escolham um local "que fique bem em fotos". Escolham um sítio que signifique algo para vocês. As emoções aparecem nas fotos. Os cenários, conseguimos encontrar sempre.`,
  },
  {
    id: 'a03',
    title: 'Vídeo de casamento: a diferença entre um filme e uma compilação',
    category: 'video',
    readingMin: 4,
    keywords: 'vídeo casamento Lisboa, filme casamento, videografia premium',
    body: `Um vídeo de casamento mal pensado é uma compilação de clipes ao som de uma música emotiva. Vê-se no YouTube há 15 anos. Funciona. É bonito. E é exactamente isso que **não fazemos**.

Um filme de casamento é outra coisa.

Tem uma estrutura — começo, meio, fim. Tem voz — talvez a vossa, talvez de quem fala convosco, talvez o silêncio da emoção. Tem ritmo — momentos rápidos, momentos longos onde se respira. Tem cor — não é só o que estava lá; é como sentimos o dia. Tem som ambiente: o riso da vossa mãe a chorar, o aplauso da família, o murmúrio do mar atrás.

**O que muda na prática:**

**Som captado a sério.** Microfones nos noivos no momento dos votos, microfones nos padrinhos durante os discursos, ambient na cerimónia. Sem isto, o filme cai em compilação.

**Pré-produção real.** Falamos convosco antes para perceber o tom: querem algo cinematográfico? Documental? Editorial? Cada casamento pede uma linguagem diferente.

**Cobertura em equipa.** Dois operadores no mínimo, três quando o evento o pede. Um casa-se uma vez. Não se pode perder a entrada da noiva porque o operador estava a montar o tripé.

**Edição com paciência.** Um filme de casamento de qualidade leva 60 a 80 horas de edição. Não é exagero — é o normal. Color grading próprio, sound design, escolha musical pensada para vocês.

**O que entregamos:**

Um **trailer** de 1 a 2 minutos — para partilharem nas redes, para envio rápido a família que não esteve presente. É a forma mais elegante de contar o vosso dia em 90 segundos.

Um **filme principal** de 6 a 12 minutos — o vosso casamento, com tempo, contado em formato que se vê sentado no sofá, em casa, anos depois.

E porque os filmes envelhecem connosco — pedimos sempre aos casais que voltem a ver o seu filme no primeiro aniversário do casamento. Ninguém volta atrás a ver compilações. Volta-se a ver filmes.`,
  },
  {
    id: 'a04',
    title: '5 horas antes do "sim": o que ninguém vos disse sobre as preparações',
    category: 'preparacao',
    readingMin: 3,
    keywords: 'preparações casamento, getting ready, fotos manhã casamento',
    body: `As preparações são a parte do dia que toda a gente esquece. Falam-vos da cerimónia, do copo-de-água, do primeiro baile. Quase ninguém vos avisa do que se passa nas 4 a 5 horas antes.

E é aí que estão algumas das fotografias mais bonitas do vosso casamento.

**O que acontece:**

Vocês acordam cedo. Não dormiram bem. Tomam o pequeno-almoço sem fome. A maquilhadora chega. A cabeleireira a seguir. As madrinhas vão chegando, os pais entram e saem do quarto. Os nervos estão à flor da pele e ninguém quer admitir. As bagatelas tornam-se grandes — o brinco que não aparece, o vestido que parece ter encolhido, a mãe que chora antes de tempo.

Estes são os momentos em que as melhores fotografias acontecem. Não são posadas. São pequenos gestos. Um abraço da mãe pelas costas enquanto vocês olham o espelho. Os pés descalços na alcatifa do quarto. O ramo pousado na almofada. A vossa noiva a perceber, naquele segundo, que está mesmo a fazer-se.

**O nosso conselho prático:**

**Reservem 30 minutos extra.** A maquilhagem vai sempre demorar mais. O vestido vai sempre custar mais a fechar. Mãos que tremem fazem o que conseguem.

**Tenham um quarto arrumado.** Não é vaidade — é estética. Quartos de hotel ou casas com luz natural dão fotografias incomparáveis. Antes da chegada da equipa, tirem da mesa tudo o que não é essencial.

**Não vejam o vosso noivo até à cerimónia.** Sabemos que parece superstição antiga. Mas a primeira vez que se virem, com vocês já vestidos, é uma das fotografias mais emocionantes do dia. Não estraguem isso.

**Permitam-se chorar.** Nós continuamos a fotografar.

Quando, anos depois, reverem as fotos do casamento, vão perceber que muitas das que vos tocam mais não são da cerimónia nem do copo-de-água. São destas 5 horas que ninguém vos avisou.`,
  },
  {
    id: 'a05',
    title: 'O Mês a Seguir ao Casamento: o que fazer com as fotografias e o vídeo',
    category: 'pos-casamento',
    readingMin: 4,
    keywords: 'o que fazer depois do casamento, álbum casamento, ver fotos casamento',
    body: `O casamento acabou. Vieram as fotografias. Receberam o filme. E agora?

A maioria dos casais cai numa de duas armadilhas: ou partilham tudo nas redes nos primeiros dias e queimam o impacto, ou guardam tudo num disco e nunca mais vêem. Há um meio-termo que vale ouro.

**Semana 1: respiram.**

Não façam nada. Não publiquem. Não enviem ao grupo da família. Vejam as fotografias com calma, em casa, num portátil grande, sentados no sofá com um copo de vinho. Deixem que as emoções voltem. As primeiras fotografias que virem vão ter mais peso emocional se as virem em privado primeiro.

**Semana 2: escolham as 10.**

Não as 50. As **10** fotografias que para vocês são "o" casamento. As que iam para uma exposição. As que iam num livro pequeno. Esta selecção dura — daqui a 30 anos serão as fotografias que reconhecerão. Imprimam-nas. Não só num álbum — imprimam em papel grande, emoldurem 2 ou 3 para a parede da sala. Há uma diferença entre ver uma fotografia num ecrã e vê-la todos os dias na parede.

**Semana 3: o álbum.**

Se há momento certo para encomendar o álbum, é agora. Quando ainda têm o dia fresco. Daqui a 6 meses, vão olhar para 800 fotos e não vão conseguir escolher 60. Falem connosco — fazemos uma proposta de selecção e vocês ajustam.

**Mês 1: o filme.**

Cuidem do vosso filme. Não o vejam apressados. Escolham uma noite. Convidem os pais, ou os padrinhos. Faz parte da experiência. E depois — guardem em **dois sítios diferentes**. Disco rígido e cloud. Ficheiros assim não se podem perder.

**Aniversário 1: voltem a ver.**

Reservem o primeiro aniversário de casamento para reverem o filme. É a tradição mais simples e mais bonita que existe.

Algumas dicas finais:

- Não vejam as fotografias ao telemóvel. Compram-vos a emoção a 5 polegadas.
- Não cortem para Instagram. As fotografias têm um enquadramento pensado.
- Guardem o disco que vos demos. Não é eterno — daqui a 5 anos transfiram para novo suporte.

O casamento foi um dia. As fotografias e o filme são o resto da vossa vida.`,
  },
]

export const CATEGORY_LABEL: Record<Article['category'], string> = {
  'fotografia':    'Fotografia',
  'video':         'Vídeo',
  'pre-wedding':   'Pré-Wedding',
  'preparacao':    'Preparações',
  'pos-casamento': 'Pós-Casamento',
}
