import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function CrmPage() {
  const { data: section } = await supabase
    .from('media_sections').select('*').eq('name', 'CRM').single()

  const { data: pages } = section
    ? await supabase.from('media_pages').select('*').eq('section_id', section.id).order('order_index')
    : { data: [] }

  // Contar leads novas
  const { count: leadsNovas } = await supabase
    .from('media_leads')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Novo')

  const { count: leadsTotal } = await supabase
    .from('media_leads')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-hidden">

      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.05) 0%, transparent 70%)' }}
      />

      {/* Back */}
      <div className="relative z-10 px-8 pt-8">
        <Link href="/media"
          className="inline-flex items-center gap-3 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/60 transition-colors uppercase group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Menu RL Media
        </Link>
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 pt-10 pb-8 max-w-5xl mx-auto">
        <div className="flex items-start gap-6">
          <div className="mt-1 w-10 h-10 border border-white/10 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 20px rgba(200,220,255,0.06)' }}>
            <span className="text-lg text-white/30 select-none">◈</span>
          </div>
          <div className="flex-1">
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL MEDIA · AUDIOVISUAL</p>
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-extralight tracking-[0.3em] text-white/80 uppercase leading-none">CRM</h1>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-white/40 to-white/10" />
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Leads bar ── */}
      <div className="relative z-10 px-8 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Card leads */}
          <Link href="/media/crm/leads"
            className="group flex items-center gap-4 border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05]
                       px-5 py-4 transition-all duration-300 flex-1 min-w-[180px]">
            <div className="flex flex-col flex-1">
              <p className="text-[8px] tracking-[0.45em] text-white/20 uppercase mb-1">Leads</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extralight text-white/60">{leadsTotal ?? 0}</span>
                {(leadsNovas ?? 0) > 0 && (
                  <span className="text-[8px] tracking-[0.3em] uppercase text-blue-400/70 border border-blue-400/25 px-2 py-0.5">
                    {leadsNovas} novas
                  </span>
                )}
              </div>
            </div>
            <span className="text-white/15 group-hover:text-white/40 transition-colors">→</span>
          </Link>

          {/* Botão formulário */}
          <Link href="/media/crm/nova-lead"
            className="group flex items-center gap-3 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08]
                       hover:border-white/30 px-6 py-4 transition-all duration-300">
            <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-white/55 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            <span className="text-[9px] tracking-[0.45em] text-white/40 group-hover:text-white/65 uppercase transition-colors whitespace-nowrap">
              Formulário Lead
            </span>
          </Link>

        </div>
      </div>

      {/* ── Páginas do CRM (Notion) ── */}
      <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto">
        {pages && pages.length > 0 && (
          <>
            <p className="text-[8px] tracking-[0.5em] text-white/15 uppercase mb-4 flex items-center gap-3">
              <span>Páginas</span>
              <span className="flex-1 h-px bg-white/[0.04]" />
              <span className="font-mono">{String(pages.length).padStart(2, '0')}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(pages as any[]).map((p: any, i: number) => (
                <a key={p.id} href={p.notion_url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 px-6 py-5 overflow-hidden
                             border border-white/[0.07] hover:border-white/20
                             bg-white/[0.015] hover:bg-white/[0.04]
                             transition-all duration-400 rounded-sm">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.04] via-white/[0.01] to-transparent
                                  -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-out" />
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/30 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 text-[10px] font-mono text-white/15 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="relative z-10 flex-1 text-[11px] tracking-[0.3em] font-medium text-white/50 group-hover:text-white/85 uppercase transition-colors duration-300">{p.title}</span>
                  <span className="relative z-10 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-xs">↗</span>
                </a>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </main>
  )
}
