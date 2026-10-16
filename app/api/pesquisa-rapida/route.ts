/**
 * GET /api/pesquisa-rapida?q=<texto>
 *
 * Pesquisa do Ctrl+K do /photo: eventos (cliente ou referência) e fichas do
 * CRM (nome). Só admin. Poucas colunas e no máximo 6 linhas por tabela,
 * para não pesar no egress do Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, naoAutorizado } from '@/lib/api-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  // Tira os caracteres que partem o filtro or() do PostgREST
  const q = (req.nextUrl.searchParams.get('q') ?? '').replace(/[,()%*\\]/g, ' ').trim()
  if (q.length < 2) return NextResponse.json({ eventos: [], crm: [] })

  const padrao = `%${q}%`
  const [{ data: eventos }, { data: crm }] = await Promise.all([
    supabase.from('eventos_2026')
      .select('id, referencia, cliente, data_evento')
      .or(`cliente.ilike.${padrao},referencia.ilike.${padrao}`)
      .order('data_evento', { ascending: false })
      .limit(6),
    supabase.from('crm_contacts')
      .select('id, nome, status, data_casamento')
      .ilike('nome', padrao)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return NextResponse.json({ eventos: eventos ?? [], crm: crm ?? [] })
}
