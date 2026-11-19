-- Account Manager (/account-manager): análise escrita pelo Claude Code quando o Rui
-- diz "ponto de situação". Os números da página são calculados na hora pela app.
create table if not exists public.account_manager_notas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  resumo text not null,
  prioridades jsonb not null default '[]'::jsonb   -- [{titulo, detalhe, link?, nivel: 'alto'|'medio'|'baixo'}]
);
alter table public.account_manager_notas enable row level security;
