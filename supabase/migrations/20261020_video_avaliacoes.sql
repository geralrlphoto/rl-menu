-- Avaliação de qualidade de cada filme (Departamento de Edição de Vídeo):
-- notas da RL na aprovação (ritmo, cor, áudio, história, 1 a 5) e a nota dos
-- noivos dada no portal (O Nosso Filme). Base do ranking dos editores.
create table if not exists public.video_avaliacoes (
  referencia text primary key,
  freelancer_id uuid,
  ritmo smallint check (ritmo between 1 and 5),
  cor smallint check (cor between 1 and 5),
  audio smallint check (audio between 1 and 5),
  historia smallint check (historia between 1 and 5),
  notas_rl text,
  avaliado_em timestamptz,
  nota_noivos smallint check (nota_noivos between 1 and 5),
  comentario_noivos text,
  noivos_em timestamptz
);
create index if not exists video_avaliacoes_freelancer on public.video_avaliacoes (freelancer_id);
alter table public.video_avaliacoes enable row level security;
