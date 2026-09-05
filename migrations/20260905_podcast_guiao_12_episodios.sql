begin;

alter table podcast_episodios add column if not exists guiao_md text;

-- Episódio 01 · Janeiro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (1, 1, '01-ficamos-noivos-e-agora-os-primeiros-seis-passos', 'Ficámos noivos, e agora? Os primeiros seis passos', 'Convidado: Wedding planner', 'Ficámos noivos, e agora? Os primeiros seis passos', '2027-01-01T10:00:00Z', 'rascunho', '**Convidado:** Wedding planner

## Perguntas âncora

1. Um casal acabou de ficar noivo. O que devem fazer nas primeiras duas semanas, e o que não devem fazer de todo?
2. Qual é a ordem correta das decisões? O que se marca primeiro?
3. Com quanto tempo de antecedência é preciso reservar um espaço em Portugal, hoje?
4. Que percentagem do orçamento vai tipicamente para cada rubrica?
5. Qual é o erro número um dos casais no primeiro mês?
6. Vale a pena contratar um planner? Em que casos não vale?
7. Quantas horas, na prática, um casal gasta a organizar um casamento sem ajuda?
8. Como se gere a família nesta fase? A lista de convidados é o primeiro conflito?
9. O que mudou nos casamentos portugueses nos últimos cinco anos?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 02 · Fevereiro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (2, 1, '02-quanto-custa-mesmo-um-casamento-em-portugal', 'Quanto custa mesmo um casamento em Portugal', 'Convidado: Planner ou proprietário de quinta', 'Quanto custa mesmo um casamento em Portugal', '2027-02-01T10:00:00Z', 'rascunho', '**Convidado:** Planner ou proprietário de quinta

## Perguntas âncora

1. Qual é hoje o custo médio real de um casamento com 100 convidados em Lisboa e Setúbal?
2. Onde é que o orçamento estoura sempre, sem os noivos perceberem?
3. Quais são os custos escondidos que ninguém menciona nas primeiras reuniões?
4. Como se distingue um fornecedor caro de um que cobra o que vale?
5. Em que rubricas se pode poupar sem que os convidados notem?
6. Em que rubricas poupar é sempre um erro?
7. Como funcionam os pagamentos e sinais no setor? O que deve levantar suspeitas?
8. Um casamento em época baixa ou a meio da semana poupa quanto, em termos reais?
9. Qual é o pedido mais caro que já lhe fizeram, e valeu a pena?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 03 · Março
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (3, 1, '03-escolher-o-espaco-o-que-ninguem-vos-diz-na-visita', 'Escolher o espaço: o que ninguém vos diz na visita', 'Convidado: Proprietário ou diretor de quinta', 'Escolher o espaço: o que ninguém vos diz na visita', '2027-03-01T10:00:00Z', 'rascunho', '**Convidado:** Proprietário ou diretor de quinta

## Perguntas âncora

1. O que é que um casal deve reparar numa visita e que praticamente ninguém repara?
2. Que perguntas é que os noivos deviam fazer e nunca fazem?
3. O que está mesmo incluído num preço por pessoa e o que costuma ser extra?
4. Como se avalia um espaço para o plano B da chuva?
5. Casa de banho, estacionamento, acessos, sombra. Quanto pesam estas coisas banais no dia?
6. Quantos convidados cabem realmente num espaço anunciado para X pessoas?
7. Que restrições apanham os noivos de surpresa? Horas de música, fogo de artifício, ruído.
8. Como olha para os fornecedores externos? Há listas fechadas e porquê?
9. O que faz um espaço parecer bem nas fotografias e o que o arruína?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 04 · Abril
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (4, 1, '04-comida-e-bebida-a-prova-o-menu-e-os-extras', 'Comida e bebida: a prova, o menu e os extras', 'Convidado: Chef ou responsável de catering', 'Comida e bebida: a prova, o menu e os extras', '2027-04-01T10:00:00Z', 'rascunho', '**Convidado:** Chef ou responsável de catering

## Perguntas âncora

1. Como funciona uma prova de menu e como é que os noivos a devem usar?
2. O que se prova não é sempre o que se serve. O que muda quando são 150 pratos?
3. Quantos aperitivos por pessoa é que um casamento precisa mesmo?
4. Como se gerem alergias, vegetarianos e crianças sem duplicar o custo?
5. Qual é o timing ideal do serviço, para que a festa não morra à mesa?
6. Que erros de menu arruínam a experiência dos convidados?
7. Bar aberto, bebida limitada ou consumo. O que compensa?
8. Bolo de casamento e doçaria: tradição ou dinheiro deitado fora?
9. Que pedido gastronómico mais estranho já teve num casamento?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 05 · Maio
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (5, 1, '05-vestido-e-fato-provas-prazos-e-arrependimentos', 'Vestido e fato: provas, prazos e arrependimentos', 'Convidado: Atelier de noivas ou alfaiate', 'Vestido e fato: provas, prazos e arrependimentos', '2027-05-01T10:00:00Z', 'rascunho', '**Convidado:** Atelier de noivas ou alfaiate

## Perguntas âncora

1. Com que antecedência se deve começar a procurar o vestido, e porquê?
2. Quantas provas são normais e o que acontece em cada uma?
3. O que é que as noivas pedem e depois se arrependem?
4. Como se escolhe um vestido pensando no calor, na dança e nas fotografias?
5. Quanto custa um vestido em cada faixa, e o que muda entre elas?
6. Aluguer, compra ou vestido de família? Como se decide?
7. Do lado do noivo, o que continua a ser mal feito?
8. Sapatos, roupa interior, acessórios. O que se esquece sempre?
9. Uma noiva emagreceu ou engordou nos dois meses finais. O que se faz?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 06 · Junho
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (6, 1, '06-beleza-maquilhagem-cabelo-e-o-teste-previo', 'Beleza: maquilhagem, cabelo e o teste prévio', 'Convidado: Maquilhadora ou hairstylist', 'Beleza: maquilhagem, cabelo e o teste prévio', '2027-06-01T10:00:00Z', 'rascunho', '**Convidado:** Maquilhadora ou hairstylist

## Perguntas âncora

1. O que faz uma prova de beleza valer o dinheiro, e o que a torna inútil?
2. Como se escolhe maquilhagem para quem vai ser fotografado e filmado o dia inteiro?
3. Que erros a maquilhagem de casamento comete e que só se veem nas fotografias?
4. Quanto tempo demora, na prática, a preparação da noiva e das damas?
5. A que horas se deve começar para não atrasar tudo o resto?
6. Como se aguenta a maquilhagem com 35 graus numa quinta do Alentejo?
7. Vale a pena tratar também das mães e das damas de honor?
8. O que se deve e não se deve fazer à pele nas semanas anteriores?
9. Qual foi a manhã de preparação mais caótica que viveu?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 07 · Julho
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (7, 1, '07-flores-e-decoracao-sem-estourar-o-orcamento', 'Flores e decoração sem estourar o orçamento', 'Convidado: Florista ou decoradora', 'Flores e decoração sem estourar o orçamento', '2027-07-01T10:00:00Z', 'rascunho', '**Convidado:** Florista ou decoradora

## Perguntas âncora

1. Quanto pesa a decoração num orçamento típico e quanto devia pesar?
2. Onde é que o dinheiro em flores realmente se nota, e onde se desperdiça?
3. Flores da época contra flores importadas. Qual é a diferença de custo real?
4. Como se reaproveita a decoração da cerimónia para o copo de água?
5. Que tendências vão envergonhar as fotografias daqui a dez anos?
6. Como se decora um espaço que já é bonito sem competir com ele?
7. Que impacto tem a luz na decoração, ao entardecer e à noite?
8. Aluguer contra compra de peças decorativas: o que compensa?
9. O que faz uma mesa parecer cara sem ser cara?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 08 · Agosto
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (8, 1, '08-musica-dj-banda-ou-os-dois', 'Música: DJ, banda ou os dois', 'Convidado: DJ e, se possível, um músico', 'Música: DJ, banda ou os dois', '2027-08-01T10:00:00Z', 'rascunho', '**Convidado:** DJ e, se possível, um músico

## Perguntas âncora

1. Como se decide entre DJ, banda ou uma combinação?
2. Quanto custa cada opção e o que está incluído?
3. Que música funciona na cerimónia, no copo de água e na festa? São mundos diferentes?
4. As listas de músicas dos noivos ajudam ou atrapalham?
5. Como se lê uma pista de dança e se decide o que tocar a seguir?
6. A que horas é que a festa realmente arranca e o que a mata cedo?
7. Que erros técnicos de som arruínam uma cerimónia? Como se evitam?
8. Como é a articulação com o fotógrafo, o vídeo e a equipa da quinta?
9. Qual é a música mais pedida em Portugal e continua a resultar?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 09 · Setembro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (9, 1, '09-a-cerimonia-civil-religiosa-celebrante-e-votos', 'A cerimónia: civil, religiosa, celebrante e votos', 'Convidado: Celebrante, pároco ou conservador', 'A cerimónia: civil, religiosa, celebrante e votos', '2027-09-01T10:00:00Z', 'rascunho', '**Convidado:** Celebrante, pároco ou conservador

## Perguntas âncora

1. Quais são as opções legais em Portugal e o que muda entre elas?
2. Que documentação é precisa e com que antecedência?
3. Como se constrói uma cerimónia que não seja fria nem interminável?
4. Quanto tempo deve durar uma cerimónia?
5. Votos escritos pelos noivos: quando resultam e quando correm mal?
6. Como se envolvem familiares sem transformar a cerimónia num espetáculo?
7. Que momentos emocionam sempre e quais são clichés já gastos?
8. Como se gere a cerimónia ao ar livre, com sol, vento e ruído?
9. Que cerimónia o marcou mais e porquê?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 10 · Outubro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (10, 1, '10-fotografia-e-video-como-escolher-e-o-que-perguntar', 'Fotografia e vídeo: como escolher e o que perguntar', 'Convidado: Rui, conduzido por outra pessoa', 'Fotografia e vídeo: como escolher e o que perguntar', '2027-10-01T10:00:00Z', 'rascunho', '**Convidado:** Rui, conduzido por outra pessoa

## Perguntas âncora

1. Qual é a diferença real entre um profissional de 1200 euros e um de 3500 euros?
2. Que perguntas é que os noivos deviam fazer numa reunião e nunca fazem?
3. O que significa "estilo" na prática, e como se percebe se combina com o casal?
4. Quantas horas de cobertura são precisas? Onde é que se corta e onde não se deve cortar?
5. Prazos de entrega: o que é razoável e porquê?
6. O que é um Same Day Edit e para quem faz sentido?
7. Como funciona o conteúdo vertical em tempo real e porque é que hoje faz falta?
8. Que erros de planeamento do dia estragam as fotografias, seja quem for a tirá-las?
9. Que direitos tem o casal sobre as imagens, e que direitos tem o profissional?
10. Como se protege um casal de ficar sem fotografias? Cópias de segurança, seguros, contratos.

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 11 · Novembro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (11, 1, '11-o-dia-hora-a-hora-a-timeline-e-o-que-corre-mal', 'O dia hora a hora: a timeline e o que corre mal', 'Convidado: Planner ou coordenadora de dia', 'O dia hora a hora: a timeline e o que corre mal', '2027-11-01T10:00:00Z', 'rascunho', '**Convidado:** Planner ou coordenadora de dia

## Perguntas âncora

1. Como se constrói uma timeline realista, de trás para a frente?
2. Quanto tempo a mais se deve deixar em cada bloco?
3. Qual é o momento do dia que atrasa sempre?
4. Quem manda no dia, e como se comunica isso aos fornecedores?
5. Sessão de casal, convidados e cocktail. Como se resolve este conflito de horários?
6. O que fazer quando chove e o plano B tem de ser acionado?
7. Como se gere a família que quer fotografias intermináveis?
8. Porque é que a hora do pôr do sol manda tanto na definição das horas?
9. Conte-me o dia mais difícil que teve e como o salvou.

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

-- Episódio 12 · Dezembro
insert into podcast_episodios (numero, temporada, slug, titulo, subtitulo, descricao_curta, data_publicacao, estado, guiao_md)
values (12, 1, '12-ja-casamos-o-que-fariamos-diferente', 'Já casámos: o que faríamos diferente', 'Convidado: Dois ou três casais já casados', 'Já casámos: o que faríamos diferente', '2027-12-01T10:00:00Z', 'rascunho', '**Convidado:** Dois ou três casais já casados

## Perguntas âncora

1. O que vos deu mais trabalho e afinal ninguém reparou?
2. Em que gastaram dinheiro que hoje consideram desperdiçado?
3. E o que valeu cada cêntimo?
4. O que vos surpreendeu no próprio dia?
5. Do que se lembram melhor, um ano depois?
6. Quantas vezes já viram o vídeo e as fotografias?
7. Que conselho dariam a vocês próprios, um ano antes?
8. O que diriam a um casal que está a começar agora?

---

*Escolhe seis a oito perguntas e deixa a conversa correr. Guarda a melhor pergunta para os 30 minutos: aí já há confiança e as respostas são mais francas.*')
on conflict (numero) do update set guiao_md = excluded.guiao_md;

commit;