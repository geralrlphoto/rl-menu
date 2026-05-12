-- ============================================================================
-- Migração: /contrato-cps suporta casamento + batizado
-- Data: 2026-05-12
-- ============================================================================
--
-- O que faz:
--   1. Adiciona tipo_evento, nome_crianca, idade_crianca em dados_contrato_cps
--   2. Adiciona nome_crianca, idade_crianca em eventos_2026 e eventos_2027
--   3. Cria tabela contrato_cps_landing (config admin da landing page)
--
-- Como correr: Supabase SQL Editor → cola tudo → RUN
-- ============================================================================

-- ── 1. Tabela dados_contrato_cps: novas colunas ──────────────────────────────
ALTER TABLE dados_contrato_cps
  ADD COLUMN IF NOT EXISTS tipo_evento    TEXT NOT NULL DEFAULT 'casamento',
  ADD COLUMN IF NOT EXISTS nome_crianca   TEXT,
  ADD COLUMN IF NOT EXISTS idade_crianca  TEXT;

COMMENT ON COLUMN dados_contrato_cps.tipo_evento   IS 'casamento ou batizado';
COMMENT ON COLUMN dados_contrato_cps.nome_crianca  IS 'Só para batizado';
COMMENT ON COLUMN dados_contrato_cps.idade_crianca IS 'Só para batizado';

-- ── 2. Tabelas eventos_YYYY: campos da criança ───────────────────────────────
-- Aplica a cada tabela existente; ignora as que ainda não foram criadas.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['eventos_2026', 'eventos_2027']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS nome_crianca  TEXT', t);
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS idade_crianca TEXT', t);
    END IF;
  END LOOP;
END $$;

-- ── 3. Tabela de configuração da landing /contrato-cps ───────────────────────
CREATE TABLE IF NOT EXISTS contrato_cps_landing (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  intro_kicker        TEXT,
  intro_title_1       TEXT,
  intro_title_2       TEXT,
  intro_subtitle      TEXT,
  casamento_title     TEXT,
  casamento_subtitle  TEXT,
  casamento_photo_url TEXT,
  batizado_title      TEXT,
  batizado_subtitle   TEXT,
  batizado_photo_url  TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contrato_cps_landing_singleton CHECK (id = 1)
);

-- Garante uma linha default (com defaults sensatos)
INSERT INTO contrato_cps_landing (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- RLS: leitura pública, escrita só service_role
ALTER TABLE contrato_cps_landing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contrato_cps_landing_select ON contrato_cps_landing;
CREATE POLICY contrato_cps_landing_select ON contrato_cps_landing
  FOR SELECT USING (true);

-- (escrita via API com service_role; sem política de UPDATE/INSERT permite-se)

-- ── 4. Trigger para manter updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_contrato_cps_landing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contrato_cps_landing_updated_at ON contrato_cps_landing;
CREATE TRIGGER trg_contrato_cps_landing_updated_at
  BEFORE UPDATE ON contrato_cps_landing
  FOR EACH ROW EXECUTE FUNCTION set_contrato_cps_landing_updated_at();
