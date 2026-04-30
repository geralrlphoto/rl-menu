import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ICONS: Record<string, string> = {
  'CRM':              '◈',
  'Recursos Humanos': '◉',
  'Finanças':         '◇',
  'Portal Cliente':   '◎',
}

interface Props {
  sectionName: string
}

export default async function MediaSectionTemplate({ sectionName }: Props) {
  const { data: section } = await supabase
    .from('media_sections').select('*').eq('name', sectionName).single()

  const { data: pages } = section
    ? await supabase.from('media_pages').select('*').eq('section_id', section.id).order('order_index')
    : { data: [] }

  const icon = ICONS[sectionName] ?? '◌'

  return (
    <main className="min-h-screen bg-[#050507] relative overflow-hidden">

      {/* ── Grid bg ─── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(180,200,255,0.05) 0%, transparent 70%)' }}
      />

      {/* ── Back link ─── */}
      <div className="relative z-10 px-8 pt-8">
        <Link href="/media"
          className="inline-flex items-center gap-3 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/60 transition-colors uppercase group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Menu RL Media
        </Link>
      </div>

      {/* ── Hero ─── */}
      <header className="relative z-10 px-8 pt-10 pb-12 max-w-5xl mx-auto">
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className="mt-1 w-10 h-10 border border-white/10 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 20px rgba(200,220,255,0.06)' }}>
            <span className="text-lg text-white/30 select-none">{icon}</span>
          </div>
          <div className="flex-1">
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL MEDIA · AUDIOVISUAL</p>
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-extralight tracking-[0.3em] text-white/80 uppercase leading-none">
              {sectionName}
            </h1>
            {/* Decorative line */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-white/40 to-white/10" />
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[8px] font-mono text-white/15">
                {pages ? String(pages.length).padStart(2, '0') : '00'} ITEMS
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ─── */}
      <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto">
        {pages && pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pages.map((p: any, i: number) => (
              <a
                key={p.id}
                href={p.notion_url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 px-6 py-5 overflow-hidden
                           border border-white/[0.07] hover:border-white/20
                           bg-white/[0.015] hover:bg-white/[0.04]
                           transition-all duration-400 rounded-sm"
              >
                {/* Glow sweep on hover */}
                <div className="pointer-events-none absolute inset-0
                                bg-gradient-to-r from-white/[0.04] via-white/[0.01] to-transparent
                                -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-out" />
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px]
                                bg-gradient-to-b from-transparent via-white/30 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className="relative z-10 text-[10px] font-mono text-white/15 w-5 shrink-0 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative z-10 flex-1 text-[11px] tracking-[0.3em] font-medium
                                 text-white/50 group-hover:text-white/85 uppercase transition-colors duration-300">
                  {p.title}
                </span>
                <span className="relative z-10 text-white/20 group-hover:text-white/60
                                 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                 transition-all duration-300 text-xs">
                  ↗
                </span>
              </a>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative w-16 h-16 border border-white/[0.08] flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(180,200,255,0.04)' }}>
              <span className="text-2xl text-white/10 select-none">{icon}</span>
              {/* Animated corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20" />
            </div>
            <div className="text-center">
              <p className="text-[9px] tracking-[0.6em] text-white/20 uppercase">Em construção</p>
              <p className="text-[10px] text-white/10 mt-2">
                Adiciona páginas em Supabase → media_pages
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Footer line ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </main>
  )
}
