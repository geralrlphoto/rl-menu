-- ============================================================
--  Secção do Podcast "Antes do Sim" — RL Photo Video
--  Cria as 6 tabelas, índices e políticas RLS.
--
--  NÃO foi aplicada. Correr no SQL Editor do Supabase.
--
--  Nota: existia uma tabela `podcast_episodios` provisória, criada
--  hoje para a página rápida em /social-media/podcast, com muito
--  menos colunas e sem RLS. Esta migração substitui-a. Não tinha
--  dados: se entretanto tiveres criado episódios lá, exporta-os
--  antes de correr isto.
-- ============================================================

begin;

-- ── Limpeza da tabela provisória ────────────────────────────
drop table if exists podcast_episodios cascade;

-- ── Episódios ───────────────────────────────────────────────
create table podcast_episodios (
  id                uuid primary key default gen_random_uuid(),
  numero            int not null unique,
  temporada         int not null default 1,
  slug              text not null unique,
  titulo            text not null,
  subtitulo         text,
  descricao_curta   text not null,
  notas_md          text,
  duracao_segundos  int,
  data_publicacao   timestamptz not null,
  estado            text not null default 'rascunho'
                      check (estado in ('rascunho', 'agendado', 'publicado')),
  capa_url          text,
  youtube_id        text,
  spotify_url       text,
  apple_url         text,
  audio_url         text,
  transcricao       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index podcast_episodios_slug_idx      on podcast_episodios (slug);
create index podcast_episodios_estado_idx    on podcast_episodios (estado);
create index podcast_episodios_data_idx      on podcast_episodios (data_publicacao desc);

-- ── Convidados ──────────────────────────────────────────────
create table podcast_convidados (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text not null unique,
  profissao   text,
  empresa     text,
  bio         text,
  foto_url    text,
  website     text,
  instagram   text,
  created_at  timestamptz not null default now()
);

create index podcast_convidados_slug_idx on podcast_convidados (slug);

-- ── Ligação episódio ↔ convidado (um episódio pode ter vários) ──
create table podcast_episodio_convidados (
  episodio_id   uuid not null references podcast_episodios (id) on delete cascade,
  convidado_id  uuid not null references podcast_convidados (id) on delete cascade,
  ordem         int not null default 1,
  primary key (episodio_id, convidado_id)
);

create index podcast_ep_conv_episodio_idx on podcast_episodio_convidados (episodio_id);

-- ── Capítulos (marcadores do leitor) ────────────────────────
create table podcast_capitulos (
  id                uuid primary key default gen_random_uuid(),
  episodio_id       uuid not null references podcast_episodios (id) on delete cascade,
  titulo            text not null,
  inicio_segundos   int not null default 0,
  ordem             int not null default 1
);

create index podcast_capitulos_episodio_idx on podcast_capitulos (episodio_id, ordem);

-- ── Candidaturas de convidados ──────────────────────────────
create table podcast_candidaturas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  email        text not null,
  telefone     text,
  empresa      text,
  area         text not null
                 check (area in ('planner','quinta','catering','flores','beleza',
                                 'musica','vestido','celebrante','outro')),
  zona         text,
  porque_tema  text,
  links        text,
  estado       text not null default 'nova'
                 check (estado in ('nova','contactada','agendada','recusada')),
  created_at   timestamptz not null default now()
);

create index podcast_candidaturas_estado_idx on podcast_candidaturas (estado, created_at desc);

-- ── Leads gerados pela secção ───────────────────────────────
create table podcast_leads (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  email               text not null,
  telefone            text,
  data_casamento      date,
  local               text,
  servico_interesse   text,
  origem_episodio_id  uuid references podcast_episodios (id) on delete set null,
  created_at          timestamptz not null default now()
);

create index podcast_leads_origem_idx on podcast_leads (origem_episodio_id);
create index podcast_leads_data_idx   on podcast_leads (created_at desc);

-- ============================================================
--  RLS — activo em todas as tabelas novas
-- ============================================================

alter table podcast_episodios           enable row level security;
alter table podcast_convidados          enable row level security;
alter table podcast_episodio_convidados enable row level security;
alter table podcast_capitulos           enable row level security;
alter table podcast_candidaturas        enable row level security;
alter table podcast_leads               enable row level security;

-- Episódios: o público só vê os publicados cuja data já chegou.
-- Rascunhos e agendados ficam invisíveis com a chave anónima.
create policy "episodios publicados sao publicos"
  on podcast_episodios for select
  to anon, authenticated
  using (estado = 'publicado' and data_publicacao <= now());

-- Convidados, ligações e capítulos: leitura pública.
create policy "convidados leitura publica"
  on podcast_convidados for select to anon, authenticated using (true);

create policy "ligacao episodio convidado leitura publica"
  on podcast_episodio_convidados for select to anon, authenticated using (true);

create policy "capitulos leitura publica"
  on podcast_capitulos for select to anon, authenticated using (true);

-- Candidaturas e leads: sem leitura nem escrita públicas.
-- Não se cria nenhuma policy: com RLS activo e sem policy, a chave
-- anónima não lê nem escreve. As inserções são feitas nos route
-- handlers com a service role, que ignora o RLS por definição.

commit;

-- ============================================================
--  Dados de exemplo — episódios 1 e 2, em rascunho.
--  Ficam invisíveis publicamente até mudares o estado para
--  'publicado' em /admin/podcast.
-- ============================================================

begin;

insert into podcast_convidados (nome, slug, profissao, empresa, bio)
values
  ('Convidado por confirmar', 'convidado-por-confirmar', 'Wedding planner', null,
   'Substituir pelos dados do convidado real antes de publicar o episódio.');

insert into podcast_episodios
  (numero, slug, titulo, subtitulo, descricao_curta, notas_md,
   duracao_segundos, data_publicacao, estado)
values
  (1,
   '01-ficamos-noivos-e-agora',
   'Ficámos noivos, e agora?',
   'Os primeiros passos de quem acaba de decidir casar',
   'Por onde começar depois do pedido: a ordem certa das decisões, o que se marca primeiro e o que pode esperar.',
   E'## O que falamos neste episódio\n\nA seguir ao pedido vem o entusiasmo, e logo a seguir vem a pergunta: por onde é que se começa?\n\n- A ordem das decisões: data, espaço, e só depois o resto\n- Porque é que as quintas na Margem Sul se marcam com tanta antecedência\n- Quanto tempo demora, na prática, organizar um casamento\n- O erro mais comum: contratar tudo ao mesmo tempo\n\n## Notas\n\nPara quem procura **casamento em Setúbal** ou **casamento em Palmela**, a disponibilidade das quintas é o primeiro travão real ao calendário. Vale a pena visitar antes de fechar a data.',
   2700,
   now(),
   'rascunho'),
  (2,
   '02-quanto-custa-um-casamento-em-portugal',
   'Quanto custa um casamento em Portugal',
   'Números reais, sem rodeios',
   'Onde vai o dinheiro de um casamento, o que costuma ficar de fora do orçamento e como decidir o que vale a pena.',
   E'## O que falamos neste episódio\n\nFalar de dinheiro é desconfortável, e é exactamente por isso que se fala pouco.\n\n- A repartição típica do orçamento\n- O que aparece sempre a mais no fim\n- Fotografia e vídeo: o que muda entre um valor e outro\n- Onde poupar sem arrepender\n\n## Notas\n\nOs valores variam muito com a zona. As **quintas na Margem Sul** têm uma realidade diferente da linha de Cascais, e isso pesa no total.',
   2700,
   now(),
   'rascunho');

insert into podcast_capitulos (episodio_id, titulo, inicio_segundos, ordem)
select id, 'Apresentação', 0, 1 from podcast_episodios where numero = 1
union all
select id, 'A ordem das decisões', 240, 2 from podcast_episodios where numero = 1
union all
select id, 'Marcar a quinta', 900, 3 from podcast_episodios where numero = 1
union all
select id, 'Apresentação', 0, 1 from podcast_episodios where numero = 2
union all
select id, 'A repartição do orçamento', 300, 2 from podcast_episodios where numero = 2;

commit;
