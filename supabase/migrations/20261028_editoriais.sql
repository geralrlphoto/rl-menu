-- Portais de editoriais (/editorial/<slug>): senha (sal:scrypt) e links das entregas de vídeo.
-- Só o servidor lê e escreve (service role); RLS ligado sem políticas fecha o acesso à chave pública.
create table if not exists public.editoriais (
  slug text primary key,
  senha_hash text,
  entregas jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.editoriais enable row level security;
