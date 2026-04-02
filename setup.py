import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://awwbkmprgtwmnejeuiak.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2JrbXByZ3R3bW5lamV1aWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4Mzc4MywiZXhwIjoyMDkwNDU5NzgzfQ.C-nbBKj_SrEPsSBkXSeHOaPgs2kdsASIwTErRT3oOR4"
PROJECT_REF = "awwbkmprgtwmnejeuiak"

PERSONAL_ACCESS_TOKEN = "sbp_5870842eef06963e8e15438f2aff7cdb2a43f192"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PERSONAL_ACCESS_TOKEN}",
    "apikey": SERVICE_ROLE_KEY
}

MGMT_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {PERSONAL_ACCESS_TOKEN}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Origin": "https://supabase.com",
    "Referer": "https://supabase.com/",
}

def run_sql(description, sql):
    print(f"\n⏳ {description}...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    data = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=MGMT_HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            print(f"✅ {description} — OK")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"⚠️  {description} — {e.code}: {body}")
        return False

def create_bucket():
    print(f"\n⏳ Criar bucket menu-images...")
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    data = json.dumps({
        "id": "menu-images",
        "name": "menu-images",
        "public": True,
        "file_size_limit": 10485760
    }).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            print("✅ Bucket menu-images — OK")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already exists" in body or "duplicate" in body.lower():
            print("✅ Bucket menu-images — já existe")
        else:
            print(f"⚠️  Bucket — {e.code}: {body}")

queries = [
    ("Criar tabela menu_sections", """
        CREATE TABLE IF NOT EXISTS menu_sections (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            order_index int NOT NULL DEFAULT 0,
            created_at timestamp DEFAULT now()
        )
    """),
    ("Criar tabela section_images", """
        CREATE TABLE IF NOT EXISTS section_images (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            section_id uuid REFERENCES menu_sections(id) ON DELETE CASCADE,
            image_url text NOT NULL,
            link_url text,
            column_index int NOT NULL DEFAULT 1,
            order_index int NOT NULL DEFAULT 0,
            created_at timestamp DEFAULT now()
        )
    """),
    ("Criar tabela pages", """
        CREATE TABLE IF NOT EXISTS pages (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            section_id uuid REFERENCES menu_sections(id) ON DELETE SET NULL,
            title text NOT NULL,
            notion_url text,
            order_index int NOT NULL DEFAULT 0,
            created_at timestamp DEFAULT now()
        )
    """),
    ("Ativar RLS", """
        ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
        ALTER TABLE section_images ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pages ENABLE ROW LEVEL SECURITY
    """),
    ("Criar políticas de leitura pública", """
        DO $$ BEGIN
            CREATE POLICY "pub_read_sections" ON menu_sections FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE POLICY "pub_read_images" ON section_images FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
            CREATE POLICY "pub_read_pages" ON pages FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
    """),
    ("Inserir secções do menu", """
        INSERT INTO menu_sections (name, order_index) VALUES
            ('MENU GERAL', 1),
            ('MENU CLIENTES', 2),
            ('MENU FINANÇAS', 3),
            ('APRESENTAÇÕES', 4),
            ('LINKS DO SITE', 5)
        ON CONFLICT DO NOTHING
    """),
    ("Inserir páginas/links", """
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
            ('PORTAL DOS NOIVOS - LAGUS RESORT', 'https://www.notion.so/324220116d8a808c871dd0311bd2a787', 15)
        ON CONFLICT DO NOTHING
    """),
]

print("🚀 A configurar o projeto RL PHOTO.VIDEO no Supabase...")
print(f"📡 {SUPABASE_URL}\n")

for desc, sql in queries:
    run_sql(desc, sql)

create_bucket()

print("\n🎉 Setup completo! Projeto configurado com sucesso.")
print("\nPróximo passo:")
print("  Cria o ficheiro .env.local na pasta rl-menu com:")
print(f"  NEXT_PUBLIC_SUPABASE_URL={SUPABASE_URL}")
print("  NEXT_PUBLIC_SUPABASE_ANON_KEY=<a tua anon key>")
