-- Secções do menu
CREATE TABLE menu_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Imagens dentro de cada secção (em colunas)
CREATE TABLE section_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES menu_sections(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  link_url text,
  column_index int NOT NULL DEFAULT 1,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Páginas/links ligados (sub-páginas do Notion)
CREATE TABLE pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES menu_sections(id) ON DELETE SET NULL,
  title text NOT NULL,
  notion_url text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Dados iniciais das secções
INSERT INTO menu_sections (name, order_index) VALUES
  ('MENU GERAL', 1),
  ('MENU CLIENTES', 2),
  ('MENU FINANÇAS', 3),
  ('APRESENTAÇÕES', 4),
  ('LINKS DO SITE', 5);

-- Dados iniciais das páginas (sub-páginas do Notion)
INSERT INTO pages (title, notion_url, order_index) VALUES
  ('FOTOS P/SELEÇÃO NOIVOS', 'https://www.notion.so/30d220116d8a80e5bd44d0717705a1c5', 1),
  ('RELATÓRIO PÓS CASAMENTO', 'https://www.notion.so/275220116d8a80838eced7ff499dc207', 2),
  ('ÁREA SATISFAÇÃO DOS NOIVOS', 'https://www.notion.so/25b220116d8a8117b726d5245f9a9900', 3),
  ('INFORMAÇÃO P.CASAMENTO', 'https://www.notion.so/26c220116d8a807295bcdfbc4199e277', 4),
  ('CRM - NOVO', 'https://www.notion.so/27e220116d8a80129b73f29fefc32c76', 5),
  ('CONTRATOS CPS CASAMENTOS', 'https://www.notion.so/1b7220116d8a8002adc0e522f7dfe971', 6),
  ('EQUIPAMENTO VIDEO', 'https://www.notion.so/1b7220116d8a806fa901d68bd3b22cbe', 7),
  ('OBJECTIVOS 2026', 'https://www.notion.so/2ea220116d8a80e0a31ef1c744ac5ffe', 8),
  ('PROPOSTA DE ORÇAMENTOS', 'https://www.notion.so/1b7220116d8a8032b213fe4cc4954072', 9),
  ('RELATÓRIO DIÁRIO', 'https://www.notion.so/31a220116d8a8020940ef08358e85791', 10),
  ('ESPAÇO DE AGENTES', 'https://www.notion.so/31a220116d8a8050b351cb25a97ae01b', 11),
  ('EVENTOS 2027', 'https://www.notion.so/321220116d8a8010bd3cc1e33083b9b7', 12),
  ('ARMAZENAMENTO', 'https://www.notion.so/328220116d8a80988b7bd54ade63f99c', 13),
  ('PACKS LAGUS RESORT', 'https://www.notion.so/320220116d8a8060982bd5107e3d8a8a', 14),
  ('PORTAL DOS NOIVOS - LAGUS RESORT', 'https://www.notion.so/324220116d8a808c871dd0311bd2a787', 15);

-- Políticas de acesso (leitura pública)
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública" ON menu_sections FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON section_images FOR SELECT USING (true);
CREATE POLICY "Leitura pública" ON pages FOR SELECT USING (true);
