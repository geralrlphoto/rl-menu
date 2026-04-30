import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LeadsClient from './LeadsClient'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ESTADO_COLORS: Record<string, string> = {
  'Novo':           'border-blue-400/30 text-blue-400/70 bg-blue-400/5',
  'Em Contacto':    'border-yellow-400/30 text-yellow-400/70 bg-yellow-400/5',
  'Qualificado':    'border-emerald-400/30 text-emerald-400/70 bg-emerald-400/5',
  'Proposta Env.':  'border-purple-400/30 text-purple-400/70 bg-purple-400/5',
  'Perdido':        'border-red-400/20 text-red-400/50 bg-red-400/5',
  'Convertido':     'border-white/20 text-white/50 bg-white/5',
}

export default async function LeadsPage() {
  const { data: leads } = await supabase
    .from('media_leads')
    .select('*')
    .order('created_at', { ascending: false })

  const total = leads?.length ?? 0
  const novos = leads?.filter(l => l.estado === 'Novo').length ?? 0

  return (
    <main className="min-h-screen bg-[#050507] relative">
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.04) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href="/media/crm"
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          CRM
        </Link>

        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · CRM</p>
            <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Leads</h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px w-12 bg-white/25" />
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[8px] font-mono text-white/15">{String(total).padStart(2, '0')} LEADS</span>
              {novos > 0 && (
                <span className="text-[8px] tracking-[0.3em] text-blue-400/70 uppercase border border-blue-400/20 px-2 py-0.5">
                  {novos} Novos
                </span>
              )}
            </div>
          </div>
          <Link href="/media/crm/nova-lead"
            className="shrink-0 flex items-center gap-2 border border-white/15 bg-white/[0.03] hover:bg-white/[0.07]
                       hover:border-white/30 px-5 py-3 transition-all duration-300">
            <svg className="w-3 h-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span className="text-[9px] tracking-[0.4em] text-white/40 uppercase">Nova Lead</span>
          </Link>
        </div>

        {/* Lista */}
        {!leads || leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-[9px] tracking-[0.6em] text-white/15 uppercase">Sem leads</p>
            <Link href="/media/crm/nova-lead"
              className="text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 uppercase transition-colors">
              + Adicionar primeira lead
            </Link>
          </div>
        ) : (
          <LeadsClient leads={leads} estadoColors={ESTADO_COLORS} />
        )}

      </div>
    </main>
  )
}
