-- Add a fixed 'pausa' preset for breaks
INSERT INTO time_block_categorias (key, label, cor, duracao_default_minutos, ordem, fixo)
VALUES ('pausa', 'Pausa / Intervalo', '#71717A', 15, 6, true)
ON CONFLICT (key) DO NOTHING;
