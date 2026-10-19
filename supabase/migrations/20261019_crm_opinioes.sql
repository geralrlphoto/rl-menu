-- Opiniões dos noivos que não fecharam (formulário público /opiniao/<contact_id>)
create table if not exists public.crm_opinioes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);
create index if not exists crm_opinioes_contact_idx on public.crm_opinioes(contact_id, created_at desc);
alter table public.crm_opinioes enable row level security;
create policy anon_all on public.crm_opinioes for all using (true) with check (true);
