-- ============================================================
--  Potenciais convidados por episódio.
--
--  A tabela podcast_candidaturas guarda quem se propõe sozinho, pelo
--  formulário público. Esta guarda a lista de quem o Rui quer convidar
--  para um tema concreto, com o estado de cada abordagem.
-- ============================================================

begin;

create table if not exists podcast_potenciais (
  id           uuid primary key default gen_random_uuid(),
  episodio_id  uuid not null references podcast_episodios (id) on delete cascade,
  nome         text not null,
  empresa      text,
  contacto     text,          -- email, telefone ou instagram
  notas        text,
  estado       text not null default 'a contactar'
                 check (estado in ('a contactar', 'contactado', 'aceitou', 'recusou')),
  ordem        int not null default 1,
  created_at   timestamptz not null default now()
);

create index if not exists podcast_potenciais_episodio_idx
  on podcast_potenciais (episodio_id, ordem);

-- Sem leitura nem escrita públicas: é informação de trabalho interno.
-- Com o RLS activo e sem política nenhuma, a chave anónima não lhe toca.
-- O back-office lê e escreve com a service role, nos route handlers.
alter table podcast_potenciais enable row level security;

commit;
