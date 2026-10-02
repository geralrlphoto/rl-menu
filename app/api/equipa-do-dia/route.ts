/**
 * GET /api/equipa-do-dia?ref=<referência>
 *
 * Quem vai ao evento (fotógrafos e videógrafos da ficha), para a secção
 * "Equipa atribuída" do briefing. Pública porque o briefing é aberto pelos
 * noivos e pela equipa sem sessão de admin: devolve só função e nome.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')?.trim()
  if (!ref) return NextResponse.json({ equipa: [] })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await db.from('evento_equipa').select('fotografo, videografo').eq('referencia', ref).maybeSingle()

  const lista = (nomes: unknown, role: string) =>
    (Array.isArray(nomes) ? nomes : []).filter(n => typeof n === 'string' && n.trim()).map(n => ({ role, name: (n as string).trim() }))
  const equipa = [...lista(data?.fotografo, 'Fotógrafo'), ...lista(data?.videografo, 'Videógrafo')]

  return NextResponse.json({ equipa }, { headers: { 'Cache-Control': 'private, max-age=300' } })
}
