import { createClient } from '@supabase/supabase-js'

// =============================================
// PREENCHE AQUI AS TUAS CREDENCIAIS
// =============================================
const SUPABASE_URL = 'https://awwbkmprgtwmnejeuiak.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2JrbXByZ3R3bW5lamV1aWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4Mzc4MywiZXhwIjoyMDkwNDU5NzgzfQ.C-nbBKj_SrEPsSBkXSeHOaPgs2kdsASIwTErRT3oOR4'
// =============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runSQL(sql, description) {
  console.log(`\n⏳ ${description}...`)
  const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: null }))

  // Usa a API de administração diretamente
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sql })
  })

  if (res.ok) {
    console.log(`✅ ${description} — OK`)
  } else {
    const err = await res.text()
    console.log(`⚠️  ${description} — ${err}`)
  }
}

async function setup() {
  console.log('🚀 A configurar o projeto RL PHOTO.VIDEO no Supabase...')
  console.log(`📡 URL: ${SUPABASE_URL}`)

  // Usar a Management API para executar SQL
  const managementUrl = `https://api.supabase.com/v1/projects/awwbkmprgtwmnejeuiak/database/query`

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }

  const queries = [
    {
      description: 'Criar tabela menu_sections',
      sql: `
        CREATE TABLE IF NOT EXISTS menu_sections (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          order_index int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `
    },
    {
      description: 'Criar tabela section_images',
      sql: `
        CREATE TABLE IF NOT EXISTS section_images (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          section_id uuid REFERENCES menu_sections(id) ON DELETE CASCADE,
          image_url text NOT NULL,
          link_url text,
          column_index int NOT NULL DEFAULT 1,
          order_index int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `
    },
    {
      description: 'Criar tabela pages',
      sql: `
        CREATE TABLE IF NOT EXISTS pages (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          section_id uuid REFERENCES menu_sections(id) ON DELETE SET NULL,
          title text NOT NULL,
          notion_url text,
          order_index int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `
    },
    {
      description: 'Ativar RLS',
      sql: `
        ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
        ALTER TABLE section_images ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      description: 'Criar políticas de leitura pública',
      sql: `
        DO $$ BEGIN
          CREATE POLICY "Leitura pública" ON menu_sections FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
          CREATE POLICY "Leitura pública" ON section_images FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN
          CREATE POLICY "Leitura pública" ON pages FOR SELECT USING (true);
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      `
    },
    {
      description: 'Inserir secções do menu',
      sql: `
        INSERT INTO menu_sections (name, order_index) VALUES
          ('MENU GERAL', 1),
          ('MENU CLIENTES', 2),
          ('MENU FINANÇAS', 3),
          ('APRESENTAÇÕES', 4),
          ('LINKS DO SITE', 5)
        ON CONFLICT DO NOTHING;
      `
    },
    {
      description: 'Inserir páginas/links',
      sql: `
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
        ON CONFLICT DO NOTHING;
      `
    }
  ]

  for (const query of queries) {
    console.log(`\n⏳ ${query.description}...`)
    const res = await fetch(managementUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: query.sql })
    })

    if (res.ok) {
      console.log(`✅ ${query.description} — OK`)
    } else {
      const err = await res.text()
      console.log(`⚠️  ${query.description} — ${err}`)
    }
  }

  // Criar bucket de storage
  console.log('\n⏳ Criar bucket menu-images...')
  const { error: bucketError } = await supabase.storage.createBucket('menu-images', {
    public: true,
    fileSizeLimit: 10485760 // 10MB
  })
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.log(`⚠️  Bucket: ${bucketError.message}`)
  } else {
    console.log('✅ Bucket menu-images — OK')
  }

  console.log('\n🎉 Setup completo! Projeto configurado com sucesso.')
  console.log('\nPróximo passo: cria o ficheiro .env.local na pasta rl-menu com:')
  console.log(`NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=<cola aqui a tua anon key>')
}

setup().catch(console.error)
