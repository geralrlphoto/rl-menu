import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LeadsClient from './LeadsClient'
import { FUNDO } from '@/app/media/_lib/estilo'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function LeadsPage() {
  const { data: leads } = await supabase
    .from('media_leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">

        <Link href="/media/crm" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ CRM</Link>

        {/* Cabeçalho */}
        <div className="mt-6 mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rlp-m traco text-[11px] text-[#5a8bff]">RL Prod · CRM</p>
            <h1 className="rlp-t mt-3 text-[48px] sm:text-[64px] leading-[0.95]">
              Leads<span className="text-[#5a8bff]">.</span>
            </h1>
            <p className="mt-3 text-[14px] text-white/55">{leads?.length ?? 0} leads no total</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/media/crm/nova-lead"
              className="rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/85 hover:text-white transition-colors">
              Formulário do cliente ↗
            </Link>
            <Link href="/media/crm/nova-lead?interno=1"
              className="rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors"
              style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
              + Registar lead
            </Link>
          </div>
        </div>

        {!leads || leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-white/[0.1] bg-[#00141f]/60">
            <p className="rlp-m text-[11px] text-white/40">Sem leads</p>
            <Link href="/media/crm/nova-lead?interno=1" className="text-[14px] text-[#5a8bff] hover:underline">+ Registar a primeira lead</Link>
          </div>
        ) : (
          <LeadsClient leads={leads} />
        )}

      </div>
    </main>
  )
}
