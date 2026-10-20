-- Casamentos retirados do Departamento de Fotografia (não são da responsabilidade da RL).
-- Escrito por /api/edicao-fotografia/enviar (retirar / repor); lido por /api/edicao-fotografia.
create table if not exists public.fotografia_excluidos (
  referencia text primary key,
  criado_em timestamptz not null default now()
);
alter table public.fotografia_excluidos enable row level security;
