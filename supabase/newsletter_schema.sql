-- ============================================
-- NEWSLETTER SCHEMA — RL Photo & Video
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Subscritores
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nome text,
  data_casamento date,
  source text default 'landing',
  status text default 'pending' check (status in ('pending','active','unsubscribed','bounced','complained')),
  confirmation_token uuid default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Drafts / Newsletters (biblioteca + envios)
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subject text not null,
  preview_text text,
  hero_image_url text,
  category text, -- dicas, tendencias, bastidores, checklists, inspiracao, historias
  intro text,
  sections jsonb default '[]', -- [{num, title, body}]
  cta_label text default 'Ler Mais',
  cta_url text,
  scheduled_for date, -- data prevista de envio
  status text default 'draft' check (status in ('draft','approved','sent','skipped')),
  sent_at timestamptz,
  sent_to_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  order_index int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Log de envios individuais
create table if not exists newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid references newsletters(id) on delete cascade,
  subscriber_id uuid references newsletter_subscribers(id) on delete cascade,
  resend_id text,
  status text default 'sent',
  sent_at timestamptz default now(),
  opened_at timestamptz,
  clicked_at timestamptz
);

create index if not exists idx_newsletters_status on newsletters(status);
create index if not exists idx_newsletters_scheduled on newsletters(scheduled_for);
create index if not exists idx_subscribers_email on newsletter_subscribers(email);
create index if not exists idx_subscribers_status on newsletter_subscribers(status);
create index if not exists idx_sends_newsletter on newsletter_sends(newsletter_id);

alter table newsletter_subscribers enable row level security;
alter table newsletters enable row level security;
alter table newsletter_sends enable row level security;

-- Trigger updated_at
create or replace function update_newsletter_ts()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trig_subs_upd on newsletter_subscribers;
create trigger trig_subs_upd before update on newsletter_subscribers
  for each row execute function update_newsletter_ts();

drop trigger if exists trig_news_upd on newsletters;
create trigger trig_news_upd before update on newsletters
  for each row execute function update_newsletter_ts();

-- ============================================
-- SEED: 24 newsletters (calendário editorial 1 ano)
-- Primeiras 4 com conteúdo completo; restantes como outline
-- ============================================

insert into newsletters (slug, title, subject, preview_text, hero_image_url, category, intro, sections, cta_label, cta_url, scheduled_for, status, order_index)
values

-- #1 — 07 Maio 2026
('5-erros-fotografo-videografo',
 '5 Erros ao Escolher Fotografo e Videografo',
 '5 erros que os noivos cometem (e como evitar)',
 'As decisoes mais importantes do vosso planeamento',
 'https://rlphotovideo.pt/casamentos-2026.jpg',
 'dicas',
 'A escolha da equipa de fotografia e videografia e uma das decisoes mais importantes do planeamento. As fotografias e o filme serao a memoria eterna do vosso dia, por isso vale a pena evitar estes erros comuns.',
 '[
   {"num":"01","title":"Decidir apenas pelo preco","body":"E natural querer controlar o orcamento, mas escolher o mais barato pode sair caro. Definam um orcamento realista para fotografia e video entre 15 a 20 por cento do total do casamento. Contratar fotografo e videografo na mesma equipa traz beneficios de coordenacao e preco."},
   {"num":"02","title":"Nao ver portfolios completos","body":"Muitos noivos veem apenas algumas fotografias no Instagram ou trailers de 1 minuto e decidem. Pecam sempre para ver pelo menos 2 ou 3 casamentos completos, do inicio ao fim, para perceber a consistencia do trabalho em todas as fases do dia."},
   {"num":"03","title":"Ignorar a quimica pessoal","body":"A equipa vai estar convosco 10 a 12 horas no dia mais importante da vossa vida. Se nao se sentem confortaveis na reuniao, isso vai transparecer nas fotografias. A quimica pessoal e fundamental para conseguirem relaxar perante a camara."},
   {"num":"04","title":"Nao ler o contrato com atencao","body":"Horas de cobertura, numero de fotografias, duracao do filme, Same Day Edit, prazo de entrega, drone, segundo fotografo — tudo deve estar no contrato. Leiam com calma antes de assinar."},
   {"num":"05","title":"Deixar para a ultima hora","body":"Os melhores profissionais tem agendas preenchidas com 12 a 18 meses de antecedencia. Assim que tiverem a data confirmada, comecem a pesquisa. Idealmente fechem a equipa 12 meses antes do casamento."}
 ]'::jsonb,
 'Marcar Reuniao',
 'https://rlphotovideo.pt/contacto',
 '2026-05-07', 'draft', 1),

-- #2 — 21 Maio 2026
('checklist-12-meses',
 'Checklist 12 Meses Antes do Casamento',
 'O vosso guia mes a mes para o dia perfeito',
 'Tudo o que tem de fazer (e quando)',
 'https://rlphotovideo.pt/casamentos-2028.png',
 'checklists',
 'Organizar um casamento pode parecer avassalador, mas com um planeamento mes a mes tudo flui. Esta checklist ajuda-vos a saber exatamente o que fazer em cada fase.',
 '[
   {"num":"12 meses","title":"Fundacoes","body":"Definir orcamento, lista de convidados aproximada, estilo de casamento. Reservar local, fotografo e videografo, catering e DJ/banda — sao os fornecedores que esgotam mais cedo."},
   {"num":"9 meses","title":"Vestido e Fato","body":"Escolher e encomendar o vestido e o fato. Contratar organizador (se aplicavel). Enviar save-the-dates."},
   {"num":"6 meses","title":"Detalhes","body":"Decoracao, flores, convites, menu final, alianca. Agendar pre-wedding e prova de menu. Site do casamento e RSVP."},
   {"num":"3 meses","title":"Confirmacoes","body":"Confirmar todos os fornecedores, enviar convites, ensaio com fotografo, reunir com o cerimonialista, preparar discurso."},
   {"num":"1 mes","title":"Reta final","body":"Ultima prova de vestido, confirmar numero final de convidados, preparar mala do dia, delegar tarefas a familiares proximos."},
   {"num":"1 semana","title":"Descanso","body":"Confirmar horarios com todos os fornecedores. Dormir bem. Tratamentos de beleza. E respirem — esta quase!"}
 ]'::jsonb,
 'Descarregar PDF',
 'https://rlphotovideo.pt/guia-noivos',
 '2026-05-21', 'draft', 2),

-- #3 — 04 Junho 2026
('tendencias-2026',
 'Tendencias 2026 em Fotografia de Casamento',
 'As tendencias que vao dominar 2026',
 'O que esta a marcar os casamentos deste ano',
 'https://rlphotovideo.pt/casamentos-2027.jpg',
 'tendencias',
 '2026 traz uma estetica mais autentica, menos posada e mais cinematografica. Das cores aos formatos, vejam o que esta a dominar os casamentos deste ano.',
 '[
   {"num":"01","title":"Documental cinematografico","body":"A tendencia mais forte: reportagem sem direcao, como um filme. Momentos reais, emocao verdadeira, nada forcado. Os noivos querem reviver o dia como se fossem espectadores."},
   {"num":"02","title":"Paleta terrosa","body":"Tons neutros quentes — creme, terracota, sage, caramelo. Saem os pasteis, entram as cores da natureza. Perfeita para casamentos em quintas e espacos rusticos."},
   {"num":"03","title":"Flores secas","body":"Bouquets com pampas, trigo, eucalipto seco. Duram mais, sao sustentaveis e dao um ar editorial as fotografias. Podem ser guardadas como recordacao."},
   {"num":"04","title":"Same Day Edit","body":"Ver um mini-filme do vosso casamento ainda na festa esta a tornar-se standard. Momento emocional que os convidados nunca esquecem."},
   {"num":"05","title":"Menos e mais","body":"Casamentos mais intimistas (60-100 convidados), mais detalhe, mais qualidade. Menos pessoas, mais experiencia."}
 ]'::jsonb,
 'Ver Portfolio 2026',
 'https://rlphotovideo.pt/portfolio',
 '2026-06-04', 'draft', 3),

-- #4 — 18 Junho 2026
('guia-pre-wedding',
 'O Guia Completo do Pre-Wedding',
 'Porque fazer pre-wedding muda tudo no dia do casamento',
 'A sessao que vale a pena fazer antes do grande dia',
 'https://rlphotovideo.pt/casamentos-2026.jpg',
 'dicas',
 'O pre-wedding nao e so uma sessao fotografica — e um ensaio emocional e tecnico para o dia do casamento. Saibam porque o recomendamos sempre.',
 '[
   {"num":"01","title":"Quebrar o gelo com a camara","body":"Para 99 por cento dos noivos, o dia do casamento e a primeira vez que sao fotografados como casal. O pre-wedding resolve isso — chegam ao dia ja a vontade."},
   {"num":"02","title":"Conhecer a equipa","body":"Passam 2-3 horas connosco num ambiente descontraido. No dia do casamento ja nao somos estranhos, somos amigos. Isso transparece nas fotografias."},
   {"num":"03","title":"Local especial","body":"Escolhem um local com significado — onde se conheceram, onde tiveram o primeiro encontro, vossa casa. Ficam fotografias cheias de historia pessoal."},
   {"num":"04","title":"Save the dates e convites","body":"As fotografias do pre-wedding sao perfeitas para save-the-dates, convites, site do casamento e decoracao da festa."},
   {"num":"05","title":"Quando fazer","body":"Idealmente 3 a 6 meses antes do casamento. Tempo suficiente para usar as fotografias nos preparativos, mas fresco para o grande dia."}
 ]'::jsonb,
 'Agendar Pre-Wedding',
 'https://rlphotovideo.pt/contacto',
 '2026-06-18', 'draft', 4),

-- #5-24: outlines (conteudo a completar antes do envio)
('casamentos-verao-luz',       'Casamentos de Verao: A Luz Perfeita',           'Como captar a magia do por-do-sol',           'Sunsets, sombras e momentos doce',               null, 'dicas',       null, '[]'::jsonb, 'Ver Portfolio', 'https://rlphotovideo.pt', '2026-07-02', 'draft', 5),
('bastidores-um-dia',           'Bastidores: Um Dia Connosco',                    'Como e um dia de casamento para nos',         'A coreografia invisivel por tras do dia',        null, 'bastidores',  null, '[]'::jsonb, 'Saber Mais',    'https://rlphotovideo.pt', '2026-07-16', 'draft', 6),
('same-day-edit',               'Same Day Edit: Vale a Pena?',                    'O filme que os vossos convidados veem ainda na festa','Emocao em direto','bastidores', null, '[]'::jsonb,null,null,null,                                                     null,                        '2026-07-30','draft', 7),
('locais-sonho-portugal',       'Locais de Sonho para Casar em Portugal',         'Do Norte ao Algarve: inspiracao',             'Os locais mais magicos para o vosso dia',        null, 'inspiracao',  null, '[]'::jsonb, null, null,                                                                              '2026-08-13', 'draft', 8),
('briefing-fotografo',          'Briefing: O Que Falar com o Fotografo',           'A conversa que faz toda a diferenca',        'Perguntas essenciais antes do dia',              null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2026-08-27', 'draft', 9),
('casamentos-outono',            'Casamentos de Outono: A Estacao Romantica',      'Cores, luz e emocao do outono',               'Porque o outono pode ser a melhor estacao',      null, 'inspiracao',   null, '[]'::jsonb, null, null,                                                                              '2026-09-10', 'draft', 10),
('album-vs-usb',                 'Album vs USB: Qual Escolher?',                   'A questao que todos os noivos fazem',         'Prints que ficam para sempre',                   null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2026-09-24', 'draft', 11),
('storytelling-video',           'Storytelling no Video de Casamento',             'O que separa um bom filme de um grande filme','A arte de contar a vossa historia',              null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2026-10-08', 'draft', 12),
('10-perguntas-fotografo',       '10 Perguntas Essenciais ao Fotografo',           'Antes de assinarem, perguntem isto',          'O checklist da reuniao',                         null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2026-10-22', 'draft', 13),
('casamentos-intimos',           'Casamentos Intimos: Menos e Mais',                'Porque 60 convidados pode ser perfeito',      'A tendencia dos casamentos mais pequenos',       null, 'tendencias',   null, '[]'::jsonb, null, null,                                                                              '2026-11-05', 'draft', 14),
('tempos-dia-casamento',         'Como Organizar os Tempos do Dia',                 'O timeline que funciona',                     'Da manha a festa: tudo no lugar',                null, 'checklists',   null, '[]'::jsonb, null, null,                                                                              '2026-11-19', 'draft', 15),
('presentes-recem-casados',      'Presentes de Natal para Recem-Casados',            'Ideias para o primeiro Natal juntos',         'Especial Natal',                                 null, 'inspiracao',   null, '[]'::jsonb, null, null,                                                                              '2026-12-03', 'draft', 16),
('retrospectiva-2026',           'Retrospectiva 2026: Os Nossos Favoritos',         'Os casamentos que marcaram o ano',            'Obrigado por um ano magico',                     null, 'historias',    null, '[]'::jsonb, null, null,                                                                              '2026-12-17', 'draft', 17),
('planear-2027-comecar',         'Planear em 2027: Por Onde Comecar',                'Acabaram de ficar noivos?',                  'O primeiro passo da jornada',                    null, 'checklists',   null, '[]'::jsonb, null, null,                                                                              '2027-01-07', 'draft', 18),
('tendencias-2027',              'Tendencias 2027: O Que Vai Mudar',                  'O que esperar do proximo ano',                'As novas estetics, cores e formatos',            null, 'tendencias',   null, '[]'::jsonb, null, null,                                                                              '2027-01-21', 'draft', 19),
('intemporais-vs-moda',          'Intemporais vs Fotografias da Moda',              'Qual escolher para o vosso casamento',        'A diferenca que ainda vai importar em 20 anos',  null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2027-02-04', 'draft', 20),
('relaxar-perante-camara',       'Como Relaxar Perante a Camara',                    'O segredo das fotografias naturais',          'Dicas praticas para o grande dia',               null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2027-02-18', 'draft', 21),
('videografo-perfeito',          'O Videografo Perfeito: Caracteristicas',          'Como reconhecer um grande profissional',      'O que procurar alem do portfolio',                null, 'dicas',        null, '[]'::jsonb, null, null,                                                                              '2027-03-04', 'draft', 22),
('primavera-ar-livre',           'Primavera: Casamentos ao Ar Livre',                'A estacao do renascimento',                   'Como aproveitar o melhor da primavera',          null, 'inspiracao',   null, '[]'::jsonb, null, null,                                                                              '2027-03-18', 'draft', 23),
('1-ano-depois-historias',       '1 Ano Depois: Historias dos Nossos Casais',        'O que mudou depois do casamento',              'Visitamos casais do ano passado',                null, 'historias',    null, '[]'::jsonb, null, null,                                                                              '2027-04-01', 'draft', 24)

on conflict (slug) do nothing;
