-- Staff (Gestão › Staff): quem aparece por cima do bilhete nos emails aos noivos.
-- emails = chaves dos emails de que a pessoa é responsável (lib/staff.ts).
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  funcao text not null default '',
  foto_url text,
  emails text[] not null default '{}',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;
