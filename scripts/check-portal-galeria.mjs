// Diagnóstico: estado actual do portal CAS_060_26_RL e do evento Notion
// 32922011-6d8a-8107-8932-e55b431772ba (Carla & Rui)
//
// Corre com:
//   node --env-file=.env.local scripts/check-portal-galeria.mjs

import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, key)

const REF      = 'CAS_060_26_RL'
const EVENT_ID = '32922011-6d8a-8107-8932-e55b431772ba'

function header(t) { console.log('\n' + '═'.repeat(72) + `\n  ${t}\n` + '═'.repeat(72)) }
function show(label, v) {
  console.log(`  ${label.padEnd(28)} : ${
    typeof v === 'string' ? `"${v}"` :
    v === null ? 'null' :
    v === undefined ? 'undefined' :
    typeof v === 'object' ? JSON.stringify(v) :
    String(v)
  }`)
}

// 1) Portal row em portais (chave: referencia = CAS_060_26_RL)
header(`1. portais  WHERE referencia ILIKE "${REF}"`)
{
  const { data, error } = await sb.from('portais').select('*').ilike('referencia', REF).maybeSingle()
  if (error)        { console.log('  ERRO:', error.message) }
  else if (!data)   { console.log('  ✗ Nenhuma row encontrada — o portal não existe em Supabase') }
  else {
    show('id', data.id)
    show('referencia (col)', data.referencia)
    show('updated_at', data.updated_at)
    const s = data.settings ?? {}
    show('settings.referencia', s.referencia)
    show('settings.galerias_url', s.galerias_url)
    show('settings.galerias_enviada', s.galerias_enviada)
    show('settings.selecao_url', s.selecao_url)
    show('settings.prewedding_url', s.prewedding_url)
    show('settings.fotos_finais_url', s.fotos_finais_url)
    show('settings.maquete_url', s.maquete_url)
    show('settings.calloutLinks (keys)', s.calloutLinks ? Object.keys(s.calloutLinks) : null)
  }
}

// 2) Evento em eventos_2026 (chaves: notion_id OU id = EVENT_ID)
header(`2. eventos_2026  WHERE notion_id="${EVENT_ID}" OR id="${EVENT_ID}"`)
{
  const { data, error } = await sb.from('eventos_2026').select('*').or(`notion_id.eq.${EVENT_ID},id.eq.${EVENT_ID}`).maybeSingle()
  if (error)        { console.log('  ERRO:', error.message) }
  else if (!data)   { console.log('  ✗ Não encontrado em eventos_2026 — vou tentar eventos_2027') }
  else {
    show('id (UUID)', data.id)
    show('notion_id', data.notion_id)
    show('referencia', data.referencia)
    show('cliente', data.cliente)
    show('data_evento', data.data_evento)
    show('tipo_evento (raw)', data.tipo_evento)
    show('tipo_evento (typeof)', typeof data.tipo_evento)
  }
}

header(`3. eventos_2027  WHERE notion_id="${EVENT_ID}" OR id="${EVENT_ID}"`)
{
  const { data, error } = await sb.from('eventos_2027').select('id,notion_id,referencia,cliente,data_evento').or(`notion_id.eq.${EVENT_ID},id.eq.${EVENT_ID}`).maybeSingle()
  if (error)        { console.log('  ERRO:', error.message) }
  else if (!data)   { console.log('  (vazio)') }
  else {
    show('referencia', data.referencia)
    show('cliente', data.cliente)
  }
}

// 4) Lookup por referência directamente
header(`4. eventos_2026  WHERE referencia="${REF}"`)
{
  const { data, error } = await sb.from('eventos_2026').select('id,notion_id,referencia,cliente,data_evento').eq('referencia', REF).limit(1).maybeSingle()
  if (error)        { console.log('  ERRO:', error.message) }
  else if (!data)   { console.log('  ✗ Nenhum evento com referencia=CAS_060_26_RL em eventos_2026') }
  else              { show('notion_id', data.notion_id); show('cliente', data.cliente); show('data_evento', data.data_evento) }
}

console.log('\n')
