import LandingContratoCPS from './LandingContratoCPS'
import { createClient } from '@supabase/supabase-js'

// Landing pública de /contrato-cps — 2 cards (Casamento / Batizado)
// Server component que lê config da Supabase e passa ao Client component.
// Admin mode = ?admin=1 na URL.

export const dynamic = 'force-dynamic'

async function loadConfig() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await sb
      .from('contrato_cps_landing')
      .select('*')
      .eq('id', 1)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

export default async function ContratoCPSPage() {
  const config = await loadConfig()
  return <LandingContratoCPS initialConfig={config} />
}
