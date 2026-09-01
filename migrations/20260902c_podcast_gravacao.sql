-- ============================================================
--  Quando e onde se grava cada episódio.
--
--  A data_publicacao já existia, mas é outra coisa: é o dia em que o
--  episódio sai. Estes três campos são a marcação da gravação.
-- ============================================================

begin;

alter table podcast_episodios
  add column if not exists gravacao_data  date,
  add column if not exists gravacao_hora  text,
  add column if not exists gravacao_local text;

commit;
