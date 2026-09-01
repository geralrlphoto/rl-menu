import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-candidaturas
   Só admin. As candidaturas não têm leitura pública: o RLS não tem
   política nenhuma para elas, e aqui exige-se o cookie de admin.
   ============================================================ */

export const dynamic = 'force-dynamic'

const ESTADOS = ['nova', 'contactada', 'agendada', 'recusada']

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { data, error } = await clienteAdmin()
    .from('podcast_candidaturas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidaturas: data ?? [] })
}

export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { id, estado } = await req.json().catch(() => ({} as any))
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  if (!ESTADOS.includes(estado)) return NextResponse.json({ error: 'estado inválido' }, { status: 400 })

  const { error } = await clienteAdmin()
    .from('podcast_candidaturas')
    .update({ estado })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
