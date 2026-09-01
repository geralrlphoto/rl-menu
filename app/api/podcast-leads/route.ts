import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-leads
   Leitura dos contactos deixados na secção do podcast. Só admin.
   A criação não passa por aqui: é feita em /api/podcast/lead, que
   é a rota pública do formulário.
   ============================================================ */

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { data, error } = await clienteAdmin()
    .from('podcast_leads')
    .select('*, episodio:origem_episodio_id (numero, titulo)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}
