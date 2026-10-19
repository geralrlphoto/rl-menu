// Resumo para os cartões da página de marcas (/): próximo casamento e leads
// de marcas por contactar. Só admin. Guardado em cache 10 min (egress do Supabase).
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { exigeAdmin } from '@/lib/api-guard'
import { ehBatizado } from '@/lib/crm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const lerResumo = unstable_cache(
  async (hoje: string) => {
    const [ev, leads] = await Promise.all([
      supabase.from('eventos_2026')
        .select('cliente, referencia, data_evento, tipo_evento')
        .gte('data_evento', hoje)
        .order('data_evento', { ascending: true })
        .limit(10),
      supabase.from('media_leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Por Contactar'),
    ])
    const prox = (ev.data ?? []).find(e => !ehBatizado(e.tipo_evento)) ?? null
    return {
      casamento: prox ? {
        nome: (prox.cliente ?? '').trim() || prox.referencia,
        dias: Math.round((Date.parse(prox.data_evento + 'T12:00:00Z') - Date.parse(hoje + 'T12:00:00Z')) / 86400000),
      } : null,
      leadsMarcas: leads.count ?? 0,
    }
  },
  ['marcas-resumo-v1'],
  { revalidate: 600 }
)

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
  return NextResponse.json(await lerResumo(hoje))
}
