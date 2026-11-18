-- Sugestões de resposta ao WhatsApp (escritas pelo Claude Code, mostradas em /whatsapp).
-- O Rui copia ou abre no WhatsApp e envia ele. Sem API paga.
create table if not exists public.whatsapp_sugestoes (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  telefone text,
  referencia text,
  mensagem_cliente text,
  sugestao text not null,
  estado text not null default 'pendente' check (estado in ('pendente', 'enviada', 'arquivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_sugestoes_estado_idx on public.whatsapp_sugestoes (estado, created_at desc);

-- Só a chave de serviço (rotas da app) lê e escreve.
alter table public.whatsapp_sugestoes enable row level security;
