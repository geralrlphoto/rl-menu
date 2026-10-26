-- Marcações feitas no link público /marcar (quem não é noivo).
-- O horário sai de preparacao_slots (é apagado) e a marcação fica aqui.
create table if not exists public.marcacoes_publicas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  hora text not null,
  nome text not null,
  contacto text not null,
  assunto text not null,
  created_at timestamptz not null default now()
);
alter table public.marcacoes_publicas enable row level security;
