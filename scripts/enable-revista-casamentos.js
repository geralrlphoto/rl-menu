const SUPABASE_URL = 'https://awwbkmprgtwmnejeuiak.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2JrbXByZ3R3bW5lamV1aWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4Mzc4MywiZXhwIjoyMDkwNDU5NzgzfQ.C-nbBKj_SrEPsSBkXSeHOaPgs2kdsASIwTErRT3oOR4'
const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function run() {
  // 1. Buscar maquete
  const masterRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_contacts?page_token=eq.${MASTER_TOKEN}&select=page_content`,
    { headers }
  )
  const [master] = await masterRes.json()
  if (!master) { console.error('Master não encontrado'); process.exit(1) }

  const pc = typeof master.page_content === 'string'
    ? JSON.parse(master.page_content) : (master.page_content || {})

  // 2. Ativar revista na maquete
  const DEFAULT_REVISTA = {
    visible: true,
    label: 'Revista',
    title: 'A nossa revista de casamentos',
    subtitle: 'Descobre o nosso método de trabalho e todos os serviços disponíveis ao detalhe. Fica a saber exatamente o que esperar de um casamento com a RL Photo · Video.',
    imageUrl: '',
    buttonLabel: 'Ver Revista',
    linkUrl: 'https://rl-menu-lake.vercel.app/secao/ee958740-f53f-4417-ad11-c01d0c42efa5',
  }
  const masterPC = { ...pc, revista: { ...DEFAULT_REVISTA, ...(pc.revista || {}), visible: true } }

  // 3. Guardar maquete
  const saveRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_contacts?page_token=eq.${MASTER_TOKEN}`,
    { method: 'PATCH', headers, body: JSON.stringify({ page_content: masterPC }) }
  )
  console.log('Maquete guardada:', saveRes.status)

  // 4. Buscar todos os outros portais de casamento
  const allRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_contacts?page_token=not.is.null&page_token=neq.${MASTER_TOKEN}&select=page_token,page_content`,
    { headers }
  )
  const contacts = await allRes.json()
  console.log(`Portais encontrados: ${contacts.length}`)

  let updated = 0
  for (const c of contacts) {
    const cpc = typeof c.page_content === 'string'
      ? JSON.parse(c.page_content || '{}') : (c.page_content || {})

    // Verificar se é portal de casamento (tem page_content com estrutura de casamento, não batizado)
    if (cpc?.tipo === 'batizado') { console.log(`  Ignorar batizado: ${c.page_token}`); continue }

    const newContent = {
      ...masterPC,
      propostas: cpc.propostas ?? masterPC.propostas,
      extras_proposta: cpc.extras_proposta ?? masterPC.extras_proposta,
      propostaPage: {
        ...masterPC.propostaPage,
        propostaAtiva: cpc.propostaPage?.propostaAtiva ?? 0,
      },
    }

    const upRes = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_contacts?page_token=eq.${c.page_token}`,
      { method: 'PATCH', headers, body: JSON.stringify({ page_content: newContent }) }
    )
    if (upRes.status < 300) { updated++; console.log(`  ✓ ${c.page_token}`) }
    else { console.log(`  ✗ ${c.page_token}: ${upRes.status}`) }
  }

  console.log(`\nConcluído: ${updated} portais atualizados.`)
}

run().catch(console.error)
