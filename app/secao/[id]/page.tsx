import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

type Props = {
  params: Promise<{ id: string }>
}

export default async function SecaoPage({ params }: Props) {
  const { id } = await params
  const [{ data: section }, { data: pages }, { data: images }] = await Promise.all([
    supabase.from('menu_sections').select('*').eq('id', id).single(),
    supabase.from('pages').select('*').eq('section_id', id).order('order_index'),
    supabase.from('section_images').select('*').eq('section_id', id).order('order_index'),
  ])

  if (!section) notFound()

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      {/* Voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10"
      >
        ‹ VOLTAR AO MENU
      </Link>

      {/* Título */}
      <header className="mb-10">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-widest text-gold uppercase">
          {section.name}
        </h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {/* Imagens (se existirem) */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {images.map((img) => (
            <a key={img.id} href={img.link_url ?? '#'} target="_blank" rel="noopener noreferrer">
              <img
                src={img.image_url}
                alt=""
                className="w-full rounded-lg object-cover hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* Botões fixos para MENU CLIENTES */}
      {section.name?.toUpperCase().includes('CLIENTE') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Link
            href="/fotos-selecao"
            className="group flex items-center justify-between px-5 py-4 border border-gold/30 rounded-xl bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
          >
            <span className="text-sm tracking-wider text-gold/80 group-hover:text-gold uppercase">
              Fotos Seleção Noivos
            </span>
            <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">›</span>
          </Link>
          <Link
            href="/albuns-casamento"
            className="group flex items-center justify-between px-5 py-4 border border-gold/30 rounded-xl bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
          >
            <span className="text-sm tracking-wider text-gold/80 group-hover:text-gold uppercase">
              Álbuns de Casamento
            </span>
            <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">›</span>
          </Link>
          <Link
            href="/portais-clientes"
            className="group flex items-center justify-between px-5 py-4 border border-white/10 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] hover:border-gold/40 transition-all duration-200 sm:col-span-2"
          >
            <span className="text-sm tracking-wider text-white/60 group-hover:text-white uppercase">
              Portal do Cliente
            </span>
            <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">›</span>
          </Link>
        </div>
      )}

      {/* Botões fixos para secções especiais (Finanças) */}
      {section.name?.toUpperCase().includes('FINANÇ') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Link
            href="/financas"
            className="group flex items-center justify-between px-5 py-4 border border-gold/30 rounded-xl bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
          >
            <span className="text-sm tracking-wider text-gold/80 group-hover:text-gold uppercase">
              Pagamentos Noivos
            </span>
            <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">›</span>
          </Link>
        </div>
      )}

      {/* Sub-páginas do Supabase */}
      {pages && pages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pages.map((page) => {
            const isFinancas      = page.title?.toUpperCase().includes('FINANÇ')
            const isFotosSel      = page.title?.toUpperCase().includes('SELEÇÃO') || page.title?.toUpperCase().includes('SELECAO')
            const isFreelancers   = page.title?.toUpperCase().includes('FREELANC')
            const isCalendario    = page.title?.toUpperCase().includes('CALENDARIO') || page.title?.toUpperCase().includes('CALENDÁRIO')
            const isInternal      = page.title === 'CRM' || page.title === 'EVENTOS 2026' || isFinancas || isFotosSel || isFreelancers || isCalendario
            const internalHref    = page.title === 'CRM' ? '/crm'
              : page.title === 'EVENTOS 2026' ? '/eventos-2026'
              : isFinancas ? '/financas'
              : isFotosSel ? '/fotos-selecao'
              : isFreelancers ? '/freelancers'
              : isCalendario ? '/calendario'
              : '/'
            return isInternal ? (
              <Link
                key={page.id}
                href={internalHref}
                className="group flex items-center justify-between px-5 py-4 border border-gold/30 rounded-xl bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-200"
              >
                <span className="text-sm tracking-wider text-gold/80 group-hover:text-gold uppercase">
                  {page.title}
                </span>
                <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">›</span>
              </Link>
            ) : (
              <a
                key={page.id}
                href={page.notion_url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between px-5 py-4 border border-white/10 rounded-xl bg-white/3 hover:bg-white/8 hover:border-gold/50 transition-all duration-200"
              >
                <span className="text-sm tracking-wider text-white/70 group-hover:text-white uppercase">
                  {page.title}
                </span>
                <span className="text-gold/50 group-hover:text-gold text-lg transition-colors">↗</span>
              </a>
            )
          })}
        </div>
      )}

      {/* Sem conteúdo (só mostra se não for secção especial e não tiver páginas) */}
      {(!pages || pages.length === 0) && !section.name?.toUpperCase().includes('FINANÇ') && (
        <div className="text-center py-16 text-white/20 text-sm tracking-widest">
          SEM CONTEÚDO AINDA
        </div>
      )}
    </main>
  )
}
