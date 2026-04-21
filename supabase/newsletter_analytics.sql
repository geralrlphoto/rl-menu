-- Adicionar colunas de tracking a newsletter_sends
alter table newsletter_sends
  add column if not exists clicked_url text,
  add column if not exists click_count int default 0,
  add column if not exists ig_clicks int default 0,
  add column if not exists share_clicks int default 0;

-- Adicionar colunas agregadas a newsletters
alter table newsletters
  add column if not exists delivered_count int default 0,
  add column if not exists bounced_count int default 0,
  add column if not exists ig_clicks int default 0,
  add column if not exists share_clicks int default 0,
  add column if not exists total_clicks int default 0,
  add column if not exists unique_opens int default 0;

-- Tabela de eventos detalhados (cada evento individual)
create table if not exists newsletter_events (
  id uuid primary key default gen_random_uuid(),
  resend_id text,
  newsletter_id uuid references newsletters(id) on delete cascade,
  subscriber_id uuid references newsletter_subscribers(id) on delete cascade,
  event_type text not null,
  url text,
  created_at timestamptz default now(),
  metadata jsonb default '{}'
);

create index if not exists idx_events_resend_id on newsletter_events(resend_id);
create index if not exists idx_events_newsletter on newsletter_events(newsletter_id);
create index if not exists idx_events_type on newsletter_events(event_type);

alter table newsletter_events enable row level security;
