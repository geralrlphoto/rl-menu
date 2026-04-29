import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

type Props = {
  params: Promise<{ id: string }>
}

/* ─── Botão interno (link interno) ─────────────────────────────────────────── */
function BtnInternal({ href, label, idx }: { href: string; label: string; idx: number }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 px-6 py-5 overflow-hidden
                 border-l-2 border-l-gold/70 border border-white/[0.06]
                 bg-white/[0.02] hover:bg-gold/[0.03]
                 transition-colors duration-300"
    >
      {/* sweep */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/[0.07] via-gold/[0.02] to-transparent
                      -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
      {/* index */}
      <span className="relative z-10 text-[10px] font-mono text-white/15 w-5 shrink-0 select-none">
        {String(idx).padStart(2, '0')}
      </span>
      {/* label */}
      <span className="relative z-10 flex-1 text-[11px] tracking-[0.3em] font-medium text-gold/70 group-hover:text-gold uppercase transition-colors duration-200">
        {label}
      </span>
      {/* arrow */}
      <span className="relative z-10 text-gold/30 group-hover:text-gold group-hover:translate-x-1
                       transition-all duration-200 text-sm">
        →
      </span>
    </Link>
  )
}

/* ─── Botão externo (link Notion / externo) ─────────────────────────────────── */
function BtnExternal({ href, label, idx }: { href: string; label: string; idx: number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center gap-4 px-6 py-5 overflow-hidden
                 border-l-2 border-l-white/20 border border-white/[0.05]
                 bg-white/[0.015] hover:bg-white/[0.04]
                 transition-colors duration-300"
    >
      {/* sweep */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.04] via-white/[0.01] to-transparent
                      -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
      {/* index */}
      <span className="relative z-10 text-[10px] font-mono text-white/15 w-5 shrink-0 select-none">
        {String(idx).padStart(2, '0')}
      </span>
      {/* label */}
      <span className="relative z-10 flex-1 text-[11px] tracking-[0.3em] font-medium text-white/40 group-hover:text-white/80 uppercase transition-colors duration-200">
        {label}
      </span>
      {/* external arrow */}
      <span className="relative z-10 text-white/20 group-hover:text-white/60
                       group-hover:-translate-y-0.5 group-hover:translate-x-0.5
                       transition-all duration-200 text-xs">
        ↗
      </span>
    </a>
  )
}

export default async function SecaoPage({ params }: Props) {
  const { id } = await params
  const [{ data: section }, { data: pages }, { data: images }] = await Promise.all([
    supabase.from('menu_sections').select('*').eq('id', id).single(),
    supabase.from('pages').select('*').eq('section_id', id).order('order_index'),
    supabase.from('section_images').select('*').eq('section_id', id).order('order_index'),
  ])

  if (!section) notFound()

  /* ── Recolher botões extra (fixos) ───────────────────────────────────────── */
  const extraButtons: { href: string; label: string; internal: boolean }[] = []

  if (section.name?.toUpperCase().includes('CLIENTE')) {
    extraButtons.push(
      { href: '/fotos-selecao',   label: 'Fotos Seleção Noivos', internal: true },
      { href: '/albuns-casamento', label: 'Álbuns de Casamento',  internal: true },
      { href: '/portais-clientes', label: 'Portal do Cliente',    internal: true },
    )
  }

  if (section.name?.toUpperCase().includes('FINANÇ') || id === '657aa823-19f0-4bc8-a1a1-a0a712f6d6e0') {
    extraButtons.push(
      { href: '/financas',        label: 'Pagamentos Noivos', internal: true },
      { href: '/financas-gerais', label: 'Finanças Gerais',   internal: true },
    )
  }

  /* ── Filtrar páginas (excluir eventos 2025/2027) ─────────────────────────── */
  const filteredPages = (pages ?? []).filter(page => {
    const t = page.title?.toUpperCase() ?? ''
    return !(t.includes('EVENTO') && (t.includes('2025') || t.includes('2027')))
  })

  /* ── Mapear páginas → botões ─────────────────────────────────────────────── */
  type Btn = { href: string; label: string; internal: boolean }
  const pageButtons: Btn[] = filteredPages.map(page => {
    const t = page.title?.toUpperCase() ?? ''
    const isInternal =
      page.title === 'CRM'          ||
      page.title === 'EVENTOS 2026' ||
      t.includes('FINANÇ')          ||
      t.includes('SELEÇÃO')         ||
      t.includes('SELECAO')         ||
      t.includes('FREELANC')        ||
      t.includes('CALENDARIO')      ||
      t.includes('CALENDÁRIO')      ||
      t.includes('NEWSLETTER')      ||
      t.includes('TAREFA')

    const href = isInternal
      ? page.title === 'CRM'          ? '/crm'
      : page.title === 'EVENTOS 2026' ? '/casamentos'
      : t.includes('FINANÇ')          ? '/financas'
      : t.includes('SELEÇÃO') || t.includes('SELECAO') ? '/fotos-selecao'
      : t.includes('FREELANC')        ? '/freelancers'
      : t.includes('CALENDARIO') || t.includes('CALENDÁRIO') ? '/calendario'
      : t.includes('NEWSLETTER')      ? '/newsletter-admin'
      : t.includes('TAREFA')          ? '/tarefas'
      : '/'
      : (page.notion_url ?? '#')

    return {
      href,
      label: page.title === 'EVENTOS 2026' ? 'CASAMENTOS' : (page.title ?? ''),
      internal: isInternal,
    }
  })

  const allButtons: Btn[] = [...extraButtons, ...pageButtons]

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      {/* Voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-12 uppercase"
      >
        ‹ Voltar ao Menu
      </Link>

      {/* Título */}
      <header className="mb-12">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-gold uppercase">
          {section.name}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-gold/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {/* Imagens (se existirem) */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {images.map((img) => (
            <a key={img.id} href={img.link_url ?? '#'} target="_blank" rel="noopener noreferrer">
              <img
                src={img.image_url}
                alt=""
                className="w-full rounded-sm object-cover hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* Botões */}
      {allButtons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
          {allButtons.map((btn, i) =>
            btn.internal
              ? <BtnInternal key={btn.href + i} href={btn.href} label={btn.label} idx={i + 1} />
              : <BtnExternal key={btn.href + i} href={btn.href} label={btn.label} idx={i + 1} />
          )}
        </div>
      )}

      {/* Sem conteúdo */}
      {allButtons.length === 0 && (
        <div className="text-center py-16 text-white/15 text-[10px] tracking-[0.5em] uppercase">
          Sem conteúdo ainda
        </div>
      )}
    </main>
  )
}
