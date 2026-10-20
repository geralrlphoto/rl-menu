// Histórico do Departamento de Fotografia (tabela fotografia_historico):
// envios aos noivos, seleção recebida e editor nomeado.

import { createClient } from '@supabase/supabase-js'

export async function registarFoto(referencia: string, etapa: string, origem: string | null = null) {
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await sb.from('fotografia_historico').insert({ referencia, etapa, origem })
  } catch (e) { console.error('[fotografiaHistorico]', e) }
}
