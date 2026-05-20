-- Time blocks for daily time-blocking with per-block countdown timer
CREATE TABLE IF NOT EXISTS time_blocks (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data                   DATE NOT NULL,
  categoria              TEXT NOT NULL,         -- 'editar' | 'plataforma' | 'redes' | 'almoco' | 'clientes' | 'custom'
  titulo                 TEXT NOT NULL,         -- e.g. "Editar trabalhos"
  cor                    TEXT NOT NULL,         -- hex e.g. "#8B5CF6"
  duracao_minutos        INTEGER NOT NULL CHECK (duracao_minutos > 0),
  ordem                  INTEGER NOT NULL DEFAULT 0,

  -- Timer state machine
  timer_state            TEXT NOT NULL DEFAULT 'idle'
                         CHECK (timer_state IN ('idle','running','paused','completed')),
  timer_started_at       TIMESTAMPTZ,           -- when current run-session started (null when not running)
  timer_elapsed_seconds  INTEGER NOT NULL DEFAULT 0,  -- accumulated from previous runs

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_data ON time_blocks (data);
CREATE INDEX IF NOT EXISTS idx_time_blocks_state ON time_blocks (timer_state);
