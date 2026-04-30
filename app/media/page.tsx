import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/LogoutButton'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SECTION_META: Record<string, { href: string; icon: string }> = {
  'CRM':              { href: '/media/crm',              icon: '◈' },
  'Recursos Humanos': { href: '/media/recursos-humanos', icon: '◉' },
  'Finanças':         { href: '/media/financas',         icon: '◇' },
  'Portal Cliente':   { href: '/media/portal-cliente',   icon: '◎' },
}

export default async function MediaDashboard() {
  const { data: sections } = await supabase
    .from('media_sections')
    .select('*')
    .order('order_index')

  const items = (sections ?? []).map(s => ({
    ...s,
    href: SECTION_META[s.name]?.href ?? `/media/secao/${s.id}`,
    icon: SECTION_META[s.name]?.icon ?? '◌',
  }))

  return (
    <main className="min-h-screen bg-[#050507] flex flex-col overflow-hidden relative">

      {/* ── Grid bg ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow center */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,200,255,0.04) 0%, transparent 70%)' }}
      />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-8 pt-8 pb-6">
        <div className="flex items-center gap-5">
          <div className="flex flex-col gap-[3px]">
            <div className="h-px w-6 bg-white/40" />
            <div className="h-px w-4 bg-white/20" />
            <div className="h-px w-6 bg-white/40" />
          </div>
          <div>
            <p className="text-[8px] tracking-[0.6em] text-white/25 uppercase">Menu Interno</p>
            <h1 className="text-sm font-extralight tracking-[0.5em] text-white/70 uppercase mt-0.5">
              RL <span className="text-white/90">MEDIA</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
            <span className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Online</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* ── Hero line ───────────────────────────────────────────────── */}
      <div className="relative z-10 px-8 pb-10">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-[8px] tracking-[0.5em] text-white/15 uppercase">Audiovisual</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 px-6 sm:px-10 pb-16">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-[10px] tracking-[0.5em] text-white/15 uppercase">Sem secções</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {items.map((item, i) => (
              <Link key={item.id} href={item.href}
                className="group relative overflow-hidden border border-white/[0.07] hover:border-white/20
                           bg-white/[0.02] hover:bg-white/[0.04]
                           transition-all duration-500 rounded-sm"
                style={{ minHeight: '160px' }}
              >
                {/* Background image */}
                {item.image_url && (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-18 transition-opacity duration-700 scale-105 group-hover:scale-100"
                      style={{ backgroundImage: `url(${item.image_url})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-[#050507]/40" />
                  </>
                )}

                {/* Corner bracket TL */}
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="w-4 h-px bg-white/20 group-hover:bg-white/50 transition-colors duration-300" />
                  <div className="w-px h-4 bg-white/20 group-hover:bg-white/50 transition-colors duration-300 mt-0" />
                </div>
                {/* Corner bracket BR */}
                <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col items-end">
                  <div className="w-px h-4 bg-white/20 group-hover:bg-white/50 transition-colors duration-300" />
                  <div className="w-4 h-px bg-white/20 group-hover:bg-white/50 transition-colors duration-300" />
                </div>

                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px rgba(200,220,255,0.04)' }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-6" style={{ minHeight: '160px' }}>
                  <div className="flex items-start justify-between">
                    <span className="text-[20px] text-white/10 group-hover:text-white/25 transition-colors duration-300 select-none">
                      {item.icon}
                    </span>
                    <span className="text-[9px] font-mono text-white/15 group-hover:text-white/30 transition-colors duration-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-[11px] tracking-[0.4em] font-medium text-white/55 group-hover:text-white/85 uppercase transition-colors duration-300">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-px w-0 group-hover:w-6 bg-white/40 transition-all duration-500" />
                      <span className="text-white/0 group-hover:text-white/30 text-xs transition-colors duration-500">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-8 py-4 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <p className="text-[8px] tracking-[0.5em] text-white/10 uppercase">© RL Media · Audiovisual</p>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-white/[0.06]" />
            <p className="text-[8px] tracking-[0.3em] text-white/10 uppercase">2026</p>
          </div>
        </div>
      </footer>

    </main>
  )
}
