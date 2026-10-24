import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { FUNDO } from '@/app/media/_lib/estilo'
import PaginasSecao, { type PaginaSecao } from './PaginasSecao'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACCENT = '#5a8bff'

export type ImagemSecao = { id: string; image_url: string | null; link_url: string | null }

/* ─── Layout comum das secções (usado aqui e em /media/secao/[id]) ─────────── */
export function SectionLayout({ nome, paginas, imagens = [] }: { nome: string; paginas: PaginaSecao[]; imagens?: ImagemSecao[] }) {
  const comLink = paginas.filter(p => p.notion_url).length

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">
        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* ── Hero ── */}
        <header className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="rlp-m traco text-[11px] text-[#5a8bff]">Secção</p>
            <h1 className="mt-4 rlp-t text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.02]">
              {nome}
              <br />
              <span style={{ color: ACCENT }}>páginas e documentos.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-white/60">
              Tudo o que a equipa precisa desta área, num só sítio. Cada cartão abre a página original num separador novo.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/[0.1] bg-[#0c2236]/80 px-5 py-4 min-w-[120px]">
              <p className="text-[28px] font-semibold leading-none" style={{ color: ACCENT }}>{paginas.length}</p>
              <p className="mt-2 text-[12px] text-white/55">{paginas.length === 1 ? 'página' : 'páginas'}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.1] bg-[#0c2236]/80 px-5 py-4 min-w-[120px]">
              <p className="text-[28px] font-semibold leading-none text-[#a9c1ff]">{comLink}</p>
              <p className="mt-2 text-[12px] text-white/55">com link</p>
            </div>
          </div>
        </header>

        {/* ── Imagens (se existirem) ── */}
        {imagens.length > 0 && (
          <section className="mt-12">
            <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-4">Destaques</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {imagens.map(img => (
                <a key={img.id} href={img.link_url ?? '#'} target="_blank" rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-2xl border border-white/[0.1] bg-[#00141f]/70 hover:border-[#2e6cf6]/70 transition-colors">
                  {img.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.image_url} alt="" loading="lazy"
                      className="w-full object-cover group-hover:opacity-85 transition-opacity" />
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Páginas ── */}
        <section className="mt-12">
          <p className="rlp-m traco text-[10px] text-[#5a8bff] mb-4">Páginas</p>
          <PaginasSecao paginas={paginas} nomeSecao={nome} />
        </section>
      </div>
    </main>
  )
}

interface Props {
  sectionName: string
}

export default async function MediaSectionTemplate({ sectionName }: Props) {
  const { data: section } = await supabase
    .from('media_sections').select('id').eq('name', sectionName).single()

  const { data: pages } = section
    ? await supabase.from('media_pages').select('id, title, notion_url').eq('section_id', section.id).order('order_index')
    : { data: [] }

  return <SectionLayout nome={sectionName} paginas={(pages ?? []) as PaginaSecao[]} />
}
