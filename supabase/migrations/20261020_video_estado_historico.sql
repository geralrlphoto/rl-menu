-- Histórico do projeto de vídeo (Departamento de Edição de Vídeo): uma linha por
-- mudança de estado ou acontecimento (editor nomeado). Escrito por lib/videoEstado.ts
-- e /api/evento-equipa; lido por /api/edicao-video. Só o servidor (service role) acede.
create table if not exists public.video_estado_historico (
  id bigint generated always as identity primary key,
  referencia text not null,
  estado text not null,          -- Aguardar, Em Edição, Em Revisão, Finalizado, Entregue, Editor nomeado
  origem text,                   -- Automático, Editor, RL, RL (alterações), nome do editor…
  criado_em timestamptz not null default now()
);
create index if not exists video_estado_historico_ref on public.video_estado_historico (referencia, criado_em);
alter table public.video_estado_historico enable row level security;

-- Entregas já feitas antes do histórico existir (data do envio do filme no portal)
insert into public.video_estado_historico (referencia, estado, origem, criado_em)
select p.referencia, 'Entregue', 'RL', (p.settings->>'wedding_film_enviada')::timestamptz
from public.portais p
where p.referencia is not null
  and coalesce(p.settings->>'wedding_film_enviada', '') ~ '^\d{4}-\d{2}-\d{2}';
