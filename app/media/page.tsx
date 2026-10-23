import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import { LogoutButton } from '@/app/components/LogoutButton'
import MediaNotificationsBell from '@/app/media/_components/MediaNotificationsBell'

export const dynamic = 'force-dynamic'

const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACCENT = '#1fd8c8'

const SECTION_META: Record<string, { href: string; icon: string }> = {
  'CRM':              { href: '/media/crm',              icon: '◈' },
  'Recursos Humanos': { href: '/media/recursos-humanos', icon: '◉' },
  'Finanças':         { href: '/media/financas',         icon: '◇' },
  'Portal Cliente':   { href: '/media/portal-cliente',   icon: '◎' },
}

// Cards fixos que não vêm da tabela media_sections
const STATIC_CARDS = [
  { id: 'proposta-criativa', name: 'Proposta Criativa', href: '/media/proposta-criativa', icon: '✦' },
  { id: 'orcamentos',        name: 'Orçamentos',        href: '/media/orcamentos',        icon: '◊' },
  { id: 'ficha-cliente',     name: 'Ficha de Cliente',  href: '/media/ficha-cliente',     icon: '◑' },
]

const NAV = [
  { label: 'CRM',        href: '/media/crm' },
  { label: 'Propostas',  href: '/media/proposta-criativa' },
  { label: 'Orçamentos', href: '/media/orcamentos' },
  { label: 'Clientes',   href: '/media/portal-cliente' },
  { label: 'Finanças',   href: '/media/financas' },
]

export default async function MediaDashboard() {
  const { data: sections } = await supabase
    .from('media_sections')
    .select('*')
    .order('order_index')

  const items = [
    ...(sections ?? []).map(s => ({
      id: String(s.id),
      name: s.name as string,
      image_url: s.image_url as string | null,
      href: SECTION_META[s.name]?.href ?? `/media/secao/${s.id}`,
      icon: SECTION_META[s.name]?.icon ?? '◌',
    })),
    ...STATIC_CARDS.map(c => ({ ...c, image_url: null })),
  ]

  return (
    <main className={`${poppins.className} min-h-screen bg-[#0b0d12] text-white relative overflow-hidden`}>

      {/* ── Fundo: grelha de pontos + brilho verde-água no canto ───────── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 92% 8%, rgba(31,216,200,0.16) 0%, transparent 70%)' }}
      />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(31,216,200,0.07) 0%, transparent 70%)' }}
      />

      {/* ── Barra de navegação em pílula ───────────────────────────────── */}
      <header className="relative z-20 px-4 pt-3">
        <nav className="max-w-5xl mx-auto flex items-center justify-between gap-4 rounded-full
                        border border-white/[0.08] bg-[#0f1318]/80 backdrop-blur-md pl-5 pr-2 py-2">
          <Link href="/media" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="" className="w-6 h-6 object-contain" />
            <span className="text-[15px] font-medium tracking-tight">RL Prod</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className="text-[12.5px] text-white/60 hover:text-white transition-colors">
                {n.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.02] px-4 py-2">
            <MediaNotificationsBell />
            <span className="h-3 w-px bg-white/15" />
            <LogoutButton />
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-14 sm:pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] tracking-[0.18em] uppercase text-white/80"
          style={{ border: `1px solid ${ACCENT}99`, boxShadow: `0 0 14px ${ACCENT}22` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
          Menu Interno
        </span>

        <h1 className="mt-6 text-[44px] sm:text-[64px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.035em]">
          Photography &amp; Video
          <br />
          <span style={{ color: ACCENT }}>for brands</span>
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-[14px] sm:text-[15px] leading-relaxed text-white/60">
          CRM, propostas, orçamentos, clientes e finanças da RL Prod, tudo num só lugar.
        </p>

        <Link href="/media/crm"
          className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-medium text-[#062b28] transition-transform hover:scale-[1.03]"
          style={{ background: ACCENT, boxShadow: `0 8px 30px ${ACCENT}40` }}>
          Abrir o CRM <span aria-hidden>→</span>
        </Link>
      </section>

      {/* ── Moldura com a imagem RL PROD ───────────────────────────────── */}
      <section className="relative z-10 px-4 mt-6">
        <div className="max-w-4xl mx-auto rounded-2xl p-[1px]"
          style={{ background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT}55 60%, ${ACCENT}22 100%)`, boxShadow: `0 0 50px ${ACCENT}1f` }}>
          <div className="rounded-2xl overflow-hidden bg-black aspect-[16/9] bg-cover bg-center"
            style={{ backgroundImage: 'url("/MEDIA%20HERO.png")' }}
            aria-label="RL PROD · Photography & Video" />
        </div>
      </section>

      {/* ── Atalhos ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-16 pb-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] tracking-[0.25em] uppercase text-white/40 mb-6">Áreas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <Link key={item.id} href={item.href}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10151b]/80
                           hover:border-[#1fd8c8]/60 transition-all duration-300 hover:-translate-y-0.5
                           hover:shadow-[0_0_30px_rgba(31,216,200,0.12)] p-5 min-h-[140px] flex flex-col justify-between"
              >
                {item.image_url && (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                      style={{ backgroundImage: `url(${item.image_url})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10151b] to-[#10151b]/40" />
                  </>
                )}
                <div className="relative flex items-start justify-between">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                    style={{ background: `${ACCENT}14`, color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] text-white/25">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="relative flex items-center justify-between">
                  <h2 className="text-[15px] font-medium text-white/85 group-hover:text-white">{item.name}</h2>
                  <span className="text-white/30 group-hover:text-[#1fd8c8] group-hover:translate-x-1 transition-all">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rodapé ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-5 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[11px] text-white/30">
          <p>© RL Prod · Photography &amp; Video</p>
          <p>2026</p>
        </div>
      </footer>

    </main>
  )
}
