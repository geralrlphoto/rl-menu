import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { LogoutButton } from '@/app/components/LogoutButton'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fallbackImage = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80'

const sectionImages: Record<string, string> = {}

const SQL_SETUP = `-- Executar no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS media_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  order_index integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES media_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  notion_url text,
  order_index integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS media_section_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES media_sections(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  link_url text,
  order_index integer DEFAULT 0
);`

export default async function MediaDashboard() {
  // Tentar carregar secções — se a tabela não existir, retorna array vazio
  const { data: sections, error } = await supabase
    .from('media_sections')
    .select('*')
    .order('order_index')

  const tableExists = !error || !error.message?.includes('does not exist')
  const allItems = (sections ?? []).map(s => ({
    id: s.id,
    name: s.name,
    href: `/media/secao/${s.id}`,
    img: s.image_url ?? (sectionImages[s.name] ?? fallbackImage),
  }))

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden shrink-0" style={{ height: '420px' }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#080808] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/50 via-transparent to-[#080808]/50" />

        {/* Logout — topo direito */}
        <div className="absolute top-4 right-4 z-10">
          <LogoutButton />
        </div>

        {/* Logo centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-[8px] tracking-[0.6em] text-white/30 uppercase">Menu Interno</p>
          <h1 className="text-3xl sm:text-4xl font-extralight tracking-[0.4em] text-white/85 uppercase">
            RL <span className="text-white/60">MEDIA</span>
          </h1>
          <p className="text-sm sm:text-base font-extralight tracking-[0.25em] text-white/35 uppercase">
            Audiovisual
          </p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      </div>

      {/* ── Conteúdo principal ────────────────────────────────────────────── */}
      {!tableExists || allItems.length === 0 ? (
        /* Estado de configuração */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto w-full">
          <div className="w-full border border-white/[0.08] bg-white/[0.02] rounded-sm p-8 flex flex-col gap-6">

            <div>
              <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-3">Configuração Inicial</p>
              <h2 className="text-xl font-extralight tracking-[0.15em] text-white/60 uppercase">
                RL MEDIA ainda não tem secções
              </h2>
              <p className="text-[11px] text-white/35 mt-2 leading-relaxed">
                Para começar, cria as tabelas no Supabase e adiciona secções ao menu.
              </p>
            </div>

            <div>
              <p className="text-[8px] tracking-[0.5em] text-white/20 uppercase mb-3">SQL para executar</p>
              <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 overflow-x-auto">
                <pre className="text-[10px] text-white/40 font-mono leading-relaxed whitespace-pre-wrap">
                  {SQL_SETUP}
                </pre>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[8px] tracking-[0.5em] text-white/20 uppercase mb-1">Como adicionar secções</p>
              {[
                'Executa o SQL acima no Supabase → SQL Editor',
                'Insere secções na tabela media_sections (name, order_index)',
                'Adiciona sub-páginas em media_pages (section_id, title, notion_url)',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[9px] font-mono text-white/20 mt-0.5 shrink-0">{String(i+1).padStart(2,'0')}</span>
                  <p className="text-[10px] text-white/35 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>

            <Link
              href="/"
              className="self-start flex items-center gap-2 px-5 py-2.5 border border-white/15 text-white/40
                         hover:text-white/70 hover:border-white/30 transition-all duration-300
                         text-[9px] tracking-[0.4em] uppercase"
            >
              ‹ Voltar às Marcas
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Grid desktop */}
          <div className="hidden sm:flex flex-1 items-center justify-center px-10 py-12 pt-16">
            <div className="w-full max-w-6xl flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {allItems.slice(0, 3).map((item) => (
                  <Link key={item.id} href={item.href}
                    className="relative overflow-hidden group rounded-lg"
                    style={{ height: '160px' }}>
                    <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                      style={{ backgroundImage: `url(${item.img})` }} />
                    <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-[2px] bg-white/30 group-hover:bg-white/70 transition-all duration-300" style={{ height: '12px' }} />
                        <span className="text-[10px] tracking-[0.3em] font-medium text-white/60 group-hover:text-white uppercase transition-colors duration-200 whitespace-nowrap">{item.name}</span>
                      </div>
                      <span className="text-white/25 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300">→</span>
                    </div>
                  </Link>
                ))}
              </div>
              {allItems.slice(3).length > 0 && (
                <div className="grid gap-2"
                  style={{ gridTemplateColumns: allItems.slice(3).length === 3 ? '1.2fr 0.9fr 1fr' : allItems.slice(3).length === 2 ? '3fr 2fr' : '1fr' }}>
                  {allItems.slice(3).map((item) => (
                    <Link key={item.id} href={item.href}
                      className="relative overflow-hidden group rounded-lg"
                      style={{ height: '160px' }}>
                      <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                        style={{ backgroundImage: `url(${item.img})` }} />
                      <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-[2px] bg-white/30 group-hover:bg-white/70 transition-all duration-300" style={{ height: '12px' }} />
                          <span className="text-[10px] tracking-[0.3em] font-medium text-white/60 group-hover:text-white uppercase transition-colors duration-200 whitespace-nowrap">{item.name}</span>
                        </div>
                        <span className="text-white/25 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-300">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu mobile */}
          <div className="sm:hidden flex-1 flex flex-col px-4 py-6 gap-3">
            {allItems.map((item) => (
              <Link key={item.id} href={item.href}
                className="relative overflow-hidden group rounded-2xl flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] active:bg-white/[0.06] transition-colors"
                style={{ height: '72px' }}>
                <div className="relative w-20 h-full shrink-0 overflow-hidden rounded-l-2xl">
                  <div className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.img})` }} />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
                <span className="text-white font-semibold tracking-[0.12em] uppercase text-sm flex-1">{item.name}</span>
                <span className="text-white/40 text-lg pr-4">›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Footer marquee */}
      <div className="h-10 border-t border-white/[0.04] overflow-hidden flex items-center mt-auto">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[10px] tracking-[0.5em] text-white/10 uppercase mx-10">
              RL <span className="text-white/20">MEDIA</span> · AUDIOVISUAL
              <span className="mx-10 text-white/10">✦</span>
            </span>
          ))}
        </div>
        <div className="flex animate-marquee whitespace-nowrap" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[10px] tracking-[0.5em] text-white/10 uppercase mx-10">
              RL <span className="text-white/20">MEDIA</span> · AUDIOVISUAL
              <span className="mx-10 text-white/10">✦</span>
            </span>
          ))}
        </div>
      </div>

    </main>
  )
}
