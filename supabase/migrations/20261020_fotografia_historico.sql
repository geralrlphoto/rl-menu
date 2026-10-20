-- Histórico de cada casamento no Departamento de Fotografia (/edicao-fotografia):
-- uma linha por envio aos noivos (sneak peek, galeria, seleção, fotos editadas),
-- seleção recebida e editor nomeado. Só o servidor (service role) acede.
create table if not exists public.fotografia_historico (
  id bigint generated always as identity primary key,
  referencia text not null,
  etapa text not null,
  origem text,
  criado_em timestamptz not null default now()
);
create index if not exists fotografia_historico_ref on public.fotografia_historico (referencia, criado_em);
alter table public.fotografia_historico enable row level security;
