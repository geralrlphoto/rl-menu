-- Categories (presets) for time blocks. The 5 defaults are seeded as fixo=true
-- so they cannot be deleted (auto-criar-dia depends on their keys).
CREATE TABLE IF NOT EXISTS time_block_categorias (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                      TEXT UNIQUE NOT NULL,
  label                    TEXT NOT NULL,
  cor                      TEXT NOT NULL,
  duracao_default_minutos  INTEGER NOT NULL DEFAULT 60 CHECK (duracao_default_minutos > 0),
  ordem                    INTEGER NOT NULL DEFAULT 0,
  fixo                     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_block_categorias_ordem ON time_block_categorias (ordem);

-- Seed the 5 default presets
INSERT INTO time_block_categorias (key, label, cor, duracao_default_minutos, ordem, fixo) VALUES
  ('editar',     'Editar trabalhos (prioridade)',                   '#8B5CF6', 90, 1, true),
  ('plataforma', 'Plataforma',                                       '#0EA5A0', 60, 2, true),
  ('redes',      'Redes sociais',                                    '#E11D48', 60, 3, true),
  ('almoco',     'Almoço + treino',                                  '#D97706', 90, 4, true),
  ('clientes',   'Clientes + arranque / encerramento (fixo)',        '#3B82F6', 60, 5, true)
ON CONFLICT (key) DO NOTHING;
