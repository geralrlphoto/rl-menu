-- Replace minute-based duration with explicit start/end clock times
ALTER TABLE time_blocks
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fim    TIME;

-- For any rows created before this column existed, fall back to 09:00 + duration
UPDATE time_blocks
SET hora_inicio = '09:00'::time,
    hora_fim    = ('09:00'::time + (duracao_minutos || ' minutes')::interval)::time
WHERE hora_inicio IS NULL;

-- Make them required going forward
ALTER TABLE time_blocks
  ALTER COLUMN hora_inicio SET NOT NULL,
  ALTER COLUMN hora_fim    SET NOT NULL;

-- duracao_minutos becomes derived; keep column for the timer math but no longer NOT NULL-required to be set by client.
