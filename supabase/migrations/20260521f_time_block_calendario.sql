-- Add fixed presets used by auto-criar to mirror the calendar grid
INSERT INTO time_block_categorias (key, label, cor, duracao_default_minutos, ordem, fixo)
VALUES
  ('casamento',   'Casamento / Produção',  '#C9A84C', 840, 7, true),
  ('pre_wedding', 'Pré-Wedding',           '#4FC3C3', 150, 8, true),
  ('reuniao',     'Reunião CRM',           '#C084FC',  60, 9, true)
ON CONFLICT (key) DO NOTHING;
