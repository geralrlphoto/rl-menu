-- Add `hora` column to existing `tarefas` table for calendar time-of-day support
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS hora TIME;

-- Optional helper index for calendar lookups by date
CREATE INDEX IF NOT EXISTS idx_tarefas_data_prazo ON tarefas (data_prazo);
