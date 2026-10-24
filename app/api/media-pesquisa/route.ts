import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Índice pequeno para a pesquisa rápida (Ctrl+K) das páginas /media.
// Só os campos que a pesquisa mostra, para poupar egress.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const [{ data: leads }, { data: portais }] = await Promise.all([
    supabase.from('media_leads').select('id, nome, empresa, estado, ramo').order('created_at', { ascending: false }).limit(500),
    supabase.from('media_portais').select('ref, nome:dados->>nome, cliente:dados->>cliente, status:dados->>status').limit(500),
  ])

  return NextResponse.json({ leads: leads ?? [], portais: portais ?? [] })
}
