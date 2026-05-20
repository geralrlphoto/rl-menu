-- Allow linking a task to a wedding event (Notion event id)
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS evento_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tarefas_evento_id ON tarefas (evento_id);
