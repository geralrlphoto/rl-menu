-- ============================================
-- CONTEUDO COMPLETO — 16 newsletters restantes (Set 2026 → Abr 2027)
-- Execute no Supabase SQL Editor
-- ============================================

-- #9 — 27 Ago 2026 — Briefing
update newsletters set
  intro = 'A reuniao inicial com o fotografo e o videografo e o momento em que toda a magia do vosso dia comeca a tomar forma. Uma boa conversa pode fazer a diferenca entre fotografias genericas e fotografias que contam a vossa historia unica.',
  sections = '[
    {"num":"01","title":"A vossa historia","body":"Contem como se conheceram, ha quanto tempo estao juntos, o que vos faz rir em conjunto. Nao sao detalhes banais — sao pistas que usamos para captar momentos que fazem sentido para voces especificamente."},
    {"num":"02","title":"O estilo que amam","body":"Mostrem imagens de casamentos que adoram. Nao para copiar, mas para entendermos a estetica que vos atrai. Documental? Classico? Editorial? Cinematografico? Isso guia o nosso olhar no dia."},
    {"num":"03","title":"Pessoas importantes","body":"Avos, padrinhos, amigos de longa data. Quem nao pode faltar nas fotografias de grupo? Quem vai chorar durante a cerimonia? Saber isto antes permite captar os momentos que mais valorizam."},
    {"num":"04","title":"Os medos","body":"Nao e banal. Muitos noivos tem medo da camara ou de ficar estranhos. Partilhar esses medos ajuda-nos a adaptar a abordagem — mais direcao ou menos, mais tempo para aquecer, menos posados."},
    {"num":"05","title":"Expectativas claras","body":"Quantas fotografias querem? Album? Prints? Filme curto ou longo? Same Day Edit? Prazos? Melhor falar de tudo ao principio para nao haver surpresas depois."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Marcar Reuniao', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = 'briefing-fotografo';

-- #10 — 10 Set 2026 — Casamentos Outono
update newsletters set
  intro = 'O outono e secretamente a melhor estacao para casar. Luz mais suave, temperaturas perfeitas, folhas em tons quentes e locais sem a loucura do verao. Se estao a planear para 2027, considerem seriamente casar entre Setembro e Novembro.',
  sections = '[
    {"num":"01","title":"A luz outonal","body":"O angulo do sol no outono e mais baixo e dourado durante mais horas. Nao ha a luz agressiva do verao ao meio-dia nem a noite prematura do inverno. Fotograficamente, e a estacao mais generosa."},
    {"num":"02","title":"Paleta de cores","body":"Tons terrosos, ocres, bordeaux, verde musgo. Combinam perfeitamente com decoracao natural, flores secas e texturas de madeira. Fotografias ganham profundidade automaticamente."},
    {"num":"03","title":"Locais menos disputados","body":"Em Setembro e Outubro os melhores locais tem mais disponibilidade e muitas vezes precos mais justos. Sem a loucura do verao, quintas e palacios oferecem pacotes mais completos."},
    {"num":"04","title":"Preparem-se para a chuva","body":"O outono e imprevisivel. Mas isso nao e problema — e oportunidade. Chuva cria fotografias dramaticas e romanticas. Tenham sempre um plano B com sombrinhas transparentes e local interior bonito."},
    {"num":"05","title":"Temperatura perfeita","body":"15 a 22 graus permite vestido e fato completos sem desconforto, convidados nao transpiram, dancas na pista sao mais confortaveis. O corpo agradece, as fotografias tambem."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg',
  cta_label = 'Ver Casamentos Outono', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'casamentos-outono';

-- #11 — 24 Set 2026 — Album vs USB
update newsletters set
  intro = 'A questao que todos os casais perguntam: vale a pena o album fisico ou basta entregar as fotografias em USB/digital? A nossa experiencia de centenas de casamentos diz uma coisa clara.',
  sections = '[
    {"num":"01","title":"O digital perde-se","body":"Pens perdem-se, discos morrem, clouds encerram, formatos tornam-se obsoletos. Em 10 anos, 80 por cento das fotografias digitais sem print nao sao vistas por ninguem. Dados publicos."},
    {"num":"02","title":"O album vive","body":"Um album esta sempre visivel. Visitas folheiam, filhos descobrem, familia ri e chora. E um objeto que convida a reviver o dia. Fotografias em pen nunca fazem isso."},
    {"num":"03","title":"Qualidade do print","body":"Album profissional e muito diferente de imprimir na loja. Papel fine art, capa em linho ou pele, impressao offset ou giclee. Dura 100 anos sem perder qualidade."},
    {"num":"04","title":"O momento da entrega","body":"Chegamos a casa dos noivos com o album numa caixa bonita. Abrimos juntos. Sao sempre lagrimas. E reviver o dia uma segunda vez. Ja fizemos centenas de entregas — nunca correu mal."},
    {"num":"05","title":"Pack ideal","body":"A nossa recomendacao: album de 30 a 60 paginas + USB com todas as fotografias em alta resolucao. Assim tem o objeto fisico emocional e a versatilidade digital para partilhar."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png',
  cta_label = 'Ver Albuns', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'album-vs-usb';

-- #12 — 08 Out 2026 — Storytelling no Video
update newsletters set
  intro = 'Qualquer pessoa com uma camera boa pode captar imagens bonitas de um casamento. Transformar essas imagens num filme que vos emocione 20 anos depois e outra historia. Isso chama-se storytelling — e e tudo.',
  sections = '[
    {"num":"01","title":"Estrutura narrativa","body":"Um bom filme tem inicio, meio e fim com arco emocional. Ansiedade dos preparativos, emocao da cerimonia, celebracao da festa. Nao e montagem cronologica — e construcao dramatica."},
    {"num":"02","title":"Som ambiente","body":"Os votos sinceros com a voz a tremer, as risadas dos amigos, o pai a fungar. O som real e mais poderoso que qualquer musica. Usamos microfones de lapela discretos para capturar tudo."},
    {"num":"03","title":"Os pequenos detalhes","body":"A mao da avó a segurar na do neto. O papa a limpar uma lagrima escondida. As amigas a ajudar com o vestido. Estes planos fazem o filme ter alma — a felicidade nao e so nos noivos."},
    {"num":"04","title":"Ritmo editorial","body":"Um filme de casamento nao pode ser todo acelerado nem todo lento. Respira. Momentos de silencio com slow motion, cortes rapidos na danca, o bolo a ser cortado em tempo real. O ritmo e a emocao."},
    {"num":"05","title":"A musica certa","body":"Musica nao e decoracao — e estrutura. Escolhemos temas originais ou licenciados que suportam a narrativa. Uma musica errada pode arruinar imagens perfeitas; a certa pode elevar imagens simples."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Ver Filmes', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'storytelling-video';

-- #13 — 22 Out 2026 — 10 Perguntas ao Fotografo
update newsletters set
  intro = 'Vao a uma reuniao com um fotografo e nao sabem bem o que perguntar. Aqui ficam as 10 perguntas essenciais que vao ajudar-vos a perceber se aquele profissional e o certo para voces.',
  sections = '[
    {"num":"01","title":"Quantos casamentos fez?","body":"Experiencia conta. Um fotografo que ja fez 50 casamentos reage melhor a imprevistos do que quem fez 5. Nao tem de ser centenas, mas deve ter base solida."},
    {"num":"02","title":"Posso ver 2-3 casamentos completos?","body":"Nao apenas o portfolio curado. Casamentos completos mostram consistencia em todos os momentos — preparativos, cerimonia, festa. Os melhores sabem entregar qualidade em todas as fases."},
    {"num":"03","title":"Quem vai fotografar de facto?","body":"Muitas empresas vendem com o nome do senior e enviam um junior. Confirmem quem vai estar no vosso dia. Pecam para ver portfolio especifico dessa pessoa."},
    {"num":"04","title":"E se adoecer no dia?","body":"Profissional serio tem rede de fotografos de confianca para emergencias. Se nao tem plano B, isso e sinal de alerta."},
    {"num":"05","title":"Quantas fotografias entregam?","body":"Entre 400 e 800 bem editadas e o standard. Menos pode significar pouca cobertura; muito mais pode significar entrega sem curadoria."},
    {"num":"06","title":"Qual o prazo de entrega?","body":"4 a 8 semanas para fotografias, 2 a 4 meses para filme completo. Mais de 6 meses e tempo excessivo."},
    {"num":"07","title":"Direitos de utilizacao","body":"Podem publicar onde quiserem sem restricoes? Para uso pessoal e redes sociais deve ser sempre sim."},
    {"num":"08","title":"Politica de alteracoes","body":"Se precisarem de mudar algo (data, local), quais sao as condicoes? Boa politica e flexivel dentro do razoavel."},
    {"num":"09","title":"Que equipamento usam?","body":"Duas maquinas (backup), lentes rapidas, flashes portateis. Profissional nao trabalha sem redundancia."},
    {"num":"10","title":"Posso falar com noivos anteriores?","body":"Testemunhos no site sao bons, mas falar diretamente com um casal anterior e ouro. Se o fotografo recusar, e sinal de alerta."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg',
  cta_label = 'Marcar Reuniao', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = '10-perguntas-fotografo';

-- #14 — 05 Nov 2026 — Casamentos Intimos
update newsletters set
  intro = 'A tendencia mais forte dos ultimos anos: casamentos de 40 a 80 convidados em vez dos tradicionais 150+. Chamam-lhes micro weddings ou intimate weddings e transformam por completo a experiencia — para melhor.',
  sections = '[
    {"num":"01","title":"Qualidade sobre quantidade","body":"Com menos convidados, cada pessoa presente importa mesmo. Todos sao familia ou amigos proximos. Nao ha convidados obrigatorios, distantes, a encher mesa. O casamento fica mais pessoal e emocionante."},
    {"num":"02","title":"Orcamento mais inteligente","body":"Com 60 convidados em vez de 150, poupam em catering, bebidas, decoracao, espaco. Esse orcamento pode reinvestir-se em melhor fotografo, melhor musica, melhor experiencia gastronomica."},
    {"num":"03","title":"Locais antes impossiveis","body":"Casas particulares, palacetes pequenos, restaurantes exclusivos, jardins privados. Locais magicos mas inviaveis para 150 pessoas tornam-se perfeitos para 60."},
    {"num":"04","title":"Mais tempo com convidados","body":"Com 60 convidados conseguem falar com toda a gente sem pressa. Com 150, acabam a festa sem ter trocado meia duzia de palavras com metade dos presentes."},
    {"num":"05","title":"Fotografia mais rica","body":"Fotograficamente, casamentos intimos sao um sonho. Mais tempo em cada momento, emocao mais concentrada, interacoes mais genuinas. Albuns ficam com mais historia por pagina."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Ver Casamentos Intimos', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'casamentos-intimos';

-- #15 — 19 Nov 2026 — Tempos do Dia
update newsletters set
  intro = 'Um casamento que flui bem nao acontece por acaso. A timeline certa e a diferenca entre um dia calmo e um dia caotico. Partilhamos o esquema que aconselhamos a todos os nossos casais.',
  sections = '[
    {"num":"09:00","title":"Preparativos noiva","body":"Maquilhagem e cabelo demoram 2-3 horas. Comecem cedo. Reservem 30 minutos de folga. Fotografo deve chegar por volta do meio dos preparativos para captar detalhes em condicoes ideais."},
    {"num":"12:30","title":"First look (opcional)","body":"Se optarem por se verem antes da cerimonia, 30 minutos reservados para este momento intimo. Muitos casais acham que e magico — e alivia ansiedade."},
    {"num":"14:30","title":"Cerimonia","body":"Duracao media de missa catolica: 45 min a 1h. Civil: 20 a 40 min. Adicionem 15 min de margem. Comecar as 14h30 permite que acabe perto das 16h — timing ideal."},
    {"num":"16:00","title":"Copo de agua","body":"90 minutos de cocktail. Tempo suficiente para convidados saudarem, noivos fazerem reportagem com familia e amigos, e deixar uma janela de 20-30 minutos para retratos dos noivos."},
    {"num":"19:00","title":"Entrada e jantar","body":"Entrada triunfal, primeira danca, jantar sentado. Calculem 1h15 a 1h30 de jantar com 2 pratos. Discursos entre pratos mantem o ritmo."},
    {"num":"22:00","title":"Corte de bolo e festa","body":"Corte de bolo e abertura da pista de danca. A partir das 22h30 a festa e livre. Programar momentos-chave na danca (danca dos pais, dos padrinhos) a cada hora mantem a energia alta."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png',
  cta_label = 'Descarregar PDF Timeline', cta_url = 'https://rlphotovideo.pt/guia-noivos'
where slug = 'tempos-dia-casamento';

-- #16 — 03 Dez 2026 — Presentes Recem-Casados
update newsletters set
  intro = 'Primeiro Natal juntos como casados. Como surpreender o vosso amor (ou dar ideias a familia)? Aqui vao propostas que vao alem das banalidades — todas centradas em criar memorias.',
  sections = '[
    {"num":"01","title":"Album fine art","body":"O melhor presente possivel para noivos que casaram em 2026. Reviver o dia do casamento num objeto bonito. Se nao encomendaram, e hora. Nos fazemos entregas ate 24 de Dezembro."},
    {"num":"02","title":"Experiencia gastronomica","body":"Jantar num restaurante com estrela Michelin. Nao e sobre a comida — e sobre uma noite so dos dois a celebrar o primeiro Natal. Portugal tem opcoes em Lisboa, Porto e Algarve."},
    {"num":"03","title":"Escapada romantica","body":"Fim-de-semana num hotel boutique no Douro, Gerês, ou Alentejo. Recem-casados precisam de tempo so os dois — o pos-casamento e intenso em visitas e agradecimentos."},
    {"num":"04","title":"Sessao de ensaio 1 ano","body":"Marquem um anniversary shoot para Setembro ou Outubro do proximo ano. Captar o casal ja casado, relaxado, em locais diferentes. Criamos pacotes especiais para os nossos noivos."},
    {"num":"05","title":"Experiencia a dois","body":"Aulas de cozinha, passeio de balao, retiro de yoga, curso de fotografia em casal. Experiencias geram memorias; coisas geram desarrumacao."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg',
  cta_label = 'Pedir Informacao', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = 'presentes-recem-casados';

-- #17 — 17 Dez 2026 — Retrospectiva 2026
update newsletters set
  intro = '2026 foi um ano extraordinario. Celebramos dezenas de casamentos pelo pais, conhecemos casais que ficaram amigos para a vida, fizemos imagens que ainda nos emocionam. Obrigado por fazerem parte desta familia.',
  sections = '[
    {"num":"01","title":"Os numeros","body":"Mais de X casamentos cobertos, 12 regioes de Portugal, mais de 3 paises (Italia, Franca, Espanha), uma equipa a crescer. Cada casamento tem valor igual — mas os numeros contam uma historia de confianca."},
    {"num":"02","title":"Os momentos inesqueciveis","body":"O pai que esqueceu o discurso e leu do guardanapo entre lagrimas. Os avos a dancar aos 80 anos. A noiva que chegou de carruagem. O ceu que abriu exatamente no momento do sim. 2026 deu-nos tudo."},
    {"num":"03","title":"Os locais especiais","body":"Destacamos um palacio em Sintra, uma quinta no Douro com vinhedos ao por do sol, uma casa em Comporta a beira-mar. Mas o nosso preferido foi sempre o ultimo. Os melhores locais sao os que tem historia pessoal."},
    {"num":"04","title":"O que aprendemos","body":"Que menos e mais. Que a emocao supera sempre a tecnica. Que o silencio antes da cerimonia vale ouro. Que os convidados que choram sao os mais importantes para fotografar. Que nunca chegamos atrasados a um casamento."},
    {"num":"05","title":"O que vem em 2027","body":"Novos pacotes, novos servicos (ate 48h de entrega Same Day Edit), novos parceiros. Mas acima de tudo, continuar o que fazemos melhor: estar presentes, atentos, humildes perante a emocao do vosso dia."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png',
  cta_label = 'Ver Best of 2026', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'retrospectiva-2026';

-- #18 — 07 Jan 2027 — Planear 2027
update newsletters set
  intro = 'Acabaram de se noivar no Natal ou no Ano Novo? Sao milhares os casais que se noivam nestas datas. Este primeiro email de 2027 e para voces — o que fazer nas primeiras semanas apos ficarem noivos.',
  sections = '[
    {"num":"01","title":"Celebrem primeiro","body":"Antes de entrarem em panico com planeamento, celebrem. Duas semanas a simplesmente existir como noivos. Falem com familia. Partilhem a noticia. Tirem fotografias espontaneas com o anel. Nao precisam de avançar ja."},
    {"num":"02","title":"Definam o essencial","body":"Tres decisoes vem primeiro: data aproximada, numero de convidados (dentro de 20 de margem), orcamento realista. Sem estas tres, nao podem avançar para fornecedores."},
    {"num":"03","title":"Reservem o essencial","body":"Nesta ordem: local, fotografo e videografo, catering, DJ ou banda. Sao os que esgotam mais cedo e os que mais impactam o dia. Tudo o resto pode esperar."},
    {"num":"04","title":"Evitem escolher por pressao","body":"Nao assinem o primeiro fornecedor que vos contacta. Vejam 3 a 5 de cada categoria. O primeiro ano de planeamento e o ano da pesquisa calma."},
    {"num":"05","title":"Gozem a jornada","body":"O planeamento e parte da experiencia. Nao queiram passar os proximos 18 meses em stress constante. Reservem fins-de-semana so para nao falar de casamento. E importante."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Marcar Reuniao Inicial', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = 'planear-2027-comecar';

-- #19 — 21 Jan 2027 — Tendencias 2027
update newsletters set
  intro = 'Cada ano traz novas tendencias. 2027 promete ser particularmente interessante, com casamentos mais autenticos, tecnologicos e ao mesmo tempo mais classicos. Aqui esta o que esperamos ver este ano.',
  sections = '[
    {"num":"01","title":"Cinematografico sobre tudo","body":"Os casamentos querem parecer filmes. Filmes de Hollywood. Imagens letterbox, cor tratada, narrativa de longa-metragem em 5 minutos. Os videografos tornam-se realizadores."},
    {"num":"02","title":"Uso inteligente de IA","body":"IA para gerir convites, assentos, menus. Mas nos fotografos nao — o olhar humano e insubstituivel. Casais que escolhem servicos 100 por cento humanos em fotografia e video tem vantagem."},
    {"num":"03","title":"Volta ao classico elegante","body":"Depois de anos de boho e rustico, voltam os casamentos elegantes. Vestidos com cauda, fatos tres pecas, coifs altas, decoracao sobria com flores em excesso. Menos Pinterest, mais revista Vogue."},
    {"num":"04","title":"Sustentabilidade","body":"Menos desperdicio, flores locais e sazonais, catering de quilometro zero, convites digitais. Os casais de 2027 querem saber de onde vem cada escolha que fazem."},
    {"num":"05","title":"Experiencias para convidados","body":"Casa-te e deixa os convidados fascinados. Welcome packs, estacoes de comida internacional, entretenimento interativo. O casamento e uma experiencia, nao so uma cerimonia."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png',
  cta_label = 'Ver Portfolio 2027', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'tendencias-2027';

-- #20 — 04 Fev 2027 — Intemporais vs Moda
update newsletters set
  intro = 'Uma decisao subtil mas importante: querem fotografias da moda do momento, ou fotografias intemporais? Podem parecer similares agora — mas em 20 anos a diferenca e enorme.',
  sections = '[
    {"num":"01","title":"O que e moda?","body":"Filtros de cor caracteristicos, angulos desnaturais, edicao exagerada, estilos que em cada decada mudam. Nao ha problema em gostar — mas e preciso saber que e moda."},
    {"num":"02","title":"O que e intemporal?","body":"Luz natural respeitada, cor equilibrada, composicao classica, emocao capturada. Fotografias que poderiam ser de qualquer decada e que se mantem bonitas."},
    {"num":"03","title":"Porque importa a diferenca","body":"Vao olhar para estas fotografias daqui a 30 anos. Os filhos vao olhar daqui a 25. Os netos daqui a 50. Querem que vejam algo datado ou algo eterno?"},
    {"num":"04","title":"Porque ambos coexistem","body":"Bons fotografos entregam intemporal como base mais algumas versoes com tratamento atual. Assim tem fotografias para todas as redes sociais e tempos."},
    {"num":"05","title":"A nossa abordagem","body":"Priorizamos sempre intemporal. Editamos com mao leve, respeitamos a cor real das peles, compomos com os classicos da fotografia. Em 50 anos continuarao bonitas."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg',
  cta_label = 'Ver Portfolio', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'intemporais-vs-moda';

-- #21 — 18 Fev 2027 — Relaxar Perante Camara
update newsletters set
  intro = 'O medo numero 1 dos noivos antes do casamento: ficar esquisito perante a camara. Entendemos. Mas ha tecnicas concretas para relaxar e ficar natural. Partilhamos as que usamos com os nossos casais.',
  sections = '[
    {"num":"01","title":"Respirem","body":"Antes de cada sessao de retratos, 3 respiracoes profundas. O corpo relaxa, os ombros descem, o rosto suaviza. Parece basico mas funciona. Os nossos casais fazem isto e nota-se na foto."},
    {"num":"02","title":"Esquecam a camara","body":"Olhem um para o outro, falem, rezem, riam. A camara e irrelevante. O fotografo vai posicionar-se e esperar. Se olharem para a camara constantemente, as fotografias ficam rigidas."},
    {"num":"03","title":"Movimento sobre pose","body":"Andar de maos dadas, abracar enquanto se movimentam, dar voltas. Movimento gera expressoes naturais. Pose estatica gera rigidez. Os melhores fotografos dirigem movimento, nao poses."},
    {"num":"04","title":"O pre-wedding salva","body":"Uma sessao de pre-wedding 2 meses antes do casamento resolve 80 por cento desta ansiedade. Voces aprendem a mexer-se, nos aprendemos os vossos angulos. No dia estao a vontade."},
    {"num":"05","title":"Confiem","body":"Um bom fotografo sabe quando algo nao esta a resultar e muda de estrategia. Confiem no profissional. Se ele diz levantem a mao, virem, olhem ali — ha razao. Estao em boas maos."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Agendar Pre-Wedding', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = 'relaxar-perante-camara';

-- #22 — 04 Mar 2027 — Videografo Perfeito
update newsletters set
  intro = 'Escolher fotografo e obvio — toda a gente percebe a necessidade. Escolher videografo e menos claro. Muitos casais arrependem-se depois de nao ter contratado um. Eis como reconhecer um grande profissional.',
  sections = '[
    {"num":"01","title":"Discrecao na acao","body":"Um videografo profissional desaparece. Move-se suavemente, fica em lugares estrategicos, nunca aparece nas fotografias do fotografo. Se no portfolio o veem mexer muito, mau sinal."},
    {"num":"02","title":"Som e cor cinematograficos","body":"Vejam um filme completo dele. O som esta nivelado? A cor e consistente? Ha qualidade em noite fraca e em sol forte? Videografia nao e so filmar — e edicao."},
    {"num":"03","title":"Equipamento redundante","body":"Duas maquinas a filmar cada momento importante. Microfones backup. Baterias extras. Perder a cerimonia por falha tecnica e um pesadelo. Profissional tem sempre sistemas duplicados."},
    {"num":"04","title":"Comunicacao clara","body":"Bons videografos explicam tudo: quantos filmes recebem, duracao, musica, prazo, direitos. Nada fica no ar. Desconfiem de quem e vago nas respostas."},
    {"num":"05","title":"Visao artistica propria","body":"Sentem que o videografo tem um estilo? Ve-se nas escolhas de angulos, ritmo, cor? Sem personalidade, os filmes sao todos iguais. Os melhores tem assinatura visual."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png',
  cta_label = 'Ver Filmes', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'videografo-perfeito';

-- #23 — 18 Mar 2027 — Primavera Ar Livre
update newsletters set
  intro = 'A primavera comeca. E quem casa entre Marco e Maio sabe que esta a escolher uma das estacoes mais magicas para o seu dia. Casamentos ao ar livre na primavera tem uma luz, uma cor e uma emocao unicas.',
  sections = '[
    {"num":"01","title":"Flores em todo o lado","body":"Primavera traz flores selvagens em campos, arvores em flor, jardins em plenitude. A natureza decora por voces. Decoracao pode ser minimalista porque a natureza ja faz o trabalho."},
    {"num":"02","title":"Luz suave e diffusa","body":"A primavera tem nuvens dispersas, luz filtrada, sem o ardor do verao. Fotograficamente e perfeito — sombras nao sao duras, peles ficam luminosas, ceu tem cor."},
    {"num":"03","title":"Temperaturas ideais","body":"16 a 22 graus permite tudo: vestido sem transpirar, fato completo, dancar sem morrer de calor. Convidados confortaveis sao convidados que ficam ate ao fim."},
    {"num":"04","title":"Preparem plano B","body":"Primavera e tambem chuva. Sempre. Plano B inteligente, nao desistir do ar livre. Tendas transparentes, sombrinhas coordenadas, localizacoes interiores bonitas no mesmo local."},
    {"num":"05","title":"Locais que brilham","body":"Quintas no Douro com vinhedos em bio, herdades no Alentejo com sobreiros em flor, Sintra com a mata verde-escuro. Primavera transforma estes locais em cenario de conto de fadas."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg',
  cta_label = 'Ver Casamentos Primavera', cta_url = 'https://rlphotovideo.pt/portfolio'
where slug = 'primavera-ar-livre';

-- #24 — 01 Abr 2027 — 1 Ano Depois
update newsletters set
  intro = 'Ha exatamente 1 ano estavamos a preparar um ano inteiro de casamentos. Hoje, visitamos alguns desses casais para perceber o que mudou depois do grande dia. As respostas emocionaram-nos.',
  sections = '[
    {"num":"01","title":"O album como portal","body":"A Ana e o Pedro dizem que folheiam o album todos os sabados de manha enquanto tomam cafe. E virou ritual. O dia do casamento e revisitado semanalmente. Por isso investimos em prints fisicos."},
    {"num":"02","title":"O filme que os acompanha","body":"A Sofia e o Miguel puseram o filme em DVD na sala dos pais dela. De cada vez que a mae da noiva visita, poem a ver. As lagrimas da mae ainda nao acabaram, passado 1 ano. O filme nao acaba."},
    {"num":"03","title":"Amigos que ficaram","body":"Muitos casais do ano passado viraram amigos nossos. Ha bolos de aniversario, convites para jantares, mensagens de aniversario. O casamento nao e uma transacao — e o inicio de uma relacao humana."},
    {"num":"04","title":"As fotografias partilhadas","body":"O Tiago pediu autorizacao para usar uma fotografia nossa de capa do LinkedIn. A Joana fez uma foto de aliancas em preto e branco emoldurada no escritorio. As imagens sobrevivem em novos contextos."},
    {"num":"05","title":"O que faz tudo valer","body":"Todos disseram o mesmo: sentem que o nosso trabalho nao foi so captar o dia, foi captar a essencia deles como casal. E esse o maior elogio que podemos receber. Obrigado por 1 ano de confianca."}
  ]'::jsonb,
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg',
  cta_label = 'Marcar Sessao Aniversario', cta_url = 'https://rlphotovideo.pt/contacto'
where slug = '1-ano-depois-historias';
