-- ============================================================
--  Campos de contacto nas fichas do podcast.
--
--  Faltavam o email e o Instagram nos potenciais convidados, e o
--  email, o telefone e as notas internas na ficha do convidado.
--  As notas do convidado são de trabalho: não saem na página pública,
--  ao contrário da bio.
-- ============================================================

begin;

alter table podcast_potenciais
  add column if not exists email     text,
  add column if not exists instagram text;

alter table podcast_convidados
  add column if not exists email    text,
  add column if not exists telefone text,
  add column if not exists notas    text;

commit;
