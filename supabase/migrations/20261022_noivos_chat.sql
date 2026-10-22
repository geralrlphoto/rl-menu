-- Chat do Atendimento (portal dos noivos ↔ staff RL). Só texto: nada de anexos.
-- autor = 'noivos' ou 'staff'; nas mensagens do staff fica guardado quem falou
-- (nome e função copiados de public.staff no momento do envio).
create table if not exists public.noivos_chat (
  id bigint generated always as identity primary key,
  referencia text not null,
  autor text not null check (autor in ('noivos', 'staff')),
  staff_id uuid,
  staff_nome text,
  staff_funcao text,
  texto text not null check (char_length(texto) between 1 and 2000),
  criado_em timestamptz not null default now()
);
create index if not exists noivos_chat_ref_idx on public.noivos_chat (referencia, id);
alter table public.noivos_chat enable row level security;
