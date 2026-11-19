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

-- 2026-11-19: dias à espera, versão original do Claude (aprender o tom), link para a ficha, data de envio.
alter table public.whatsapp_sugestoes
  add column if not exists data_mensagem timestamptz,
  add column if not exists sugestao_original text,
  add column if not exists link_ficha text,
  add column if not exists enviada_em timestamptz;

-- 2026-11-19: ligação ao CRM (histórico), respostas-base (tema/base), lead nova, tarefa criada a partir de uma promessa.
alter table public.whatsapp_sugestoes
  add column if not exists crm_contact_id uuid,
  add column if not exists tema text,
  add column if not exists base boolean not null default false,
  add column if not exists lead_nova boolean not null default false,
  add column if not exists tarefa_id uuid,
  add column if not exists tarefa_prazo date;
