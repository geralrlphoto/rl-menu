-- Track which wedding event a time block belongs to, plus accumulated real time
ALTER TABLE time_blocks
  ADD COLUMN IF NOT EXISTS evento_id            TEXT,
  ADD COLUMN IF NOT EXISTS tempo_real_segundos  INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_time_blocks_evento_id ON time_blocks (evento_id);
