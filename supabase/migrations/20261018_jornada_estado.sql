-- Estado do mapa da jornada do cliente (/crm/follow-up): tarefas marcadas e estado de cada card.
-- chave: "t:<fase>-<passo>.<tarefa>" (tarefa feita) ou "s:<fase>-<passo>" (estado do card: done | miss)
create table if not exists public.jornada_estado (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.jornada_estado enable row level security;
-- Sem políticas: só a service role (rotas /api com exigeAdmin) lê e escreve.
