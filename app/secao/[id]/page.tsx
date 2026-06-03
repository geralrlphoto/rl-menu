import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MagazineViewer from './MagazineViewer'
import './menu-geral.css'

export const revalidate = 60

type Props = {
  params: Promise<{ id: string }>
}

/* ============================================================
   Re-skin "Atmosphère + Atelier" — back-office Menu Geral
   Design tokens directamente do handoff:
     bg: #120d08
     surfaces: #1e1812 / #181410
     gold: #c8a866  gold-soft: #d7bd87  gold-deep: #9c7c47
     ink: #efe7d6  ink-2: #c3b8a3  ink-3: #8c8170  ink-4: #5f574b
     line: rgba(239,231,214,.10)
     raios: 6/12/20px
   Tipografia: Cormorant Garamond (títulos+numerais) + Hanken Grotesk (UI)

   NOTA: lógica/destinos/comportamentos exactamente IGUAIS ao
   ficheiro original. Só muda o aspecto.
   ============================================================ */

/* ── Mapping de descrição e ícone por título do item ─────────── */
type Meta = { desc: string; group: 'op' | 'cli' | 'eq' }
function metaFor(label: string): Meta {
  const k = label.toUpperCase().trim()
  if (k.includes('NEWSLETTER'))
    return { desc: 'Campanhas e subscritores', group: 'cli' }
  if (k.includes('CASAMENTO') || k.includes('EVENTOS 2026'))
    return { desc: 'Gestão dos eventos do ano', group: 'op' }
  if (k === 'CRM' || k.includes('CRM'))
    return { desc: 'Leads, contactos e propostas', group: 'cli' }
  if (k.includes('TAREFA'))
    return { desc: 'Lista de afazeres da equipa', group: 'op' }
  if (k.includes('FREELANC'))
    return { desc: 'Membros e equipa externa', group: 'eq' }
  if (k.includes('OBJECTIVO') || k.includes('OBJETIVO'))
    return { desc: 'Metas e indicadores do estúdio', group: 'eq' }
  if (k.includes('SCRIPT') || k.includes('REUNIÃO') || k.includes('REUNIAO'))
    return { desc: 'Guião para reuniões com noivos', group: 'op' }
  if (k.includes('RELATÓRIO') || k.includes('RELATORIO'))
    return { desc: 'Resumos pós-casamento e métricas', group: 'eq' }
  if (k.includes('CALENDARIO') || k.includes('CALENDÁRIO'))
    return { desc: 'Agenda de toda a operação', group: 'op' }
  if (k.includes('FINANÇ') || k.includes('FINANCEIRO') || k.includes('PAGAMENTO'))
    return { desc: 'Fluxo financeiro do estúdio', group: 'op' }
  if (k.includes('SELEÇ') || k.includes('SELEC'))
    return { desc: 'Selecções enviadas pelos noivos', group: 'cli' }
  if (k.includes('ÁLBUM') || k.includes('ALBUM'))
    return { desc: 'Maquetes e produção de álbuns', group: 'cli' }
  if (k.includes('PORTAL'))
    return { desc: 'Portais dos noivos', group: 'cli' }
  if (k.includes('CONTRATO') || k.includes('CPS'))
    return { desc: 'Cláusulas e dados contratuais', group: 'cli' }
  if (k.includes('CONVIDADO'))
    return { desc: 'Fotos enviadas pelos convidados', group: 'cli' }
  if (k.includes('REDES') || k.includes('SOCIAL'))
    return { desc: 'Conteúdo para Instagram e redes', group: 'cli' }
  if (k.includes('ORÇAMENTO') || k.includes('ORCAMENTO'))
    return { desc: 'Cálculo de orçamentos', group: 'op' }
  return { desc: 'Aceder a esta secção', group: 'eq' }
}

/* ── Ícone de linha fina (stroke 1.3) por nome ─────────────── */
function iconFor(label: string): JSX.Element {
  const k = label.toUpperCase().trim()
  // Newsletter / email
  if (k.includes('NEWSLETTER')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  )
  // Casamentos / coração
  if (k.includes('CASAMENTO') || k.includes('EVENTOS 2026')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
    </svg>
  )
  // CRM / users
  if (k === 'CRM' || k.includes('CRM')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" /><path d="M17 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  // Tarefas / checklist
  if (k.includes('TAREFA')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
  // Freelancers / equipa
  if (k.includes('FREELANC')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" />
    </svg>
  )
  // Objectivos / target
  if (k.includes('OBJECTIVO') || k.includes('OBJETIVO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
  // Script / livro
  if (k.includes('SCRIPT') || k.includes('REUNIÃO') || k.includes('REUNIAO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
  // Relatório / barras
  if (k.includes('RELATÓRIO') || k.includes('RELATORIO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
  // Calendário
  if (k.includes('CALENDARIO') || k.includes('CALENDÁRIO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
  // Finanças
  if (k.includes('FINANÇ') || k.includes('FINANCEIRO') || k.includes('PAGAMENTO') || k.includes('ORÇAMENTO') || k.includes('ORCAMENTO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
    </svg>
  )
  // Foto / câmara (selecção, álbum, portal cliente, convidados)
  if (k.includes('SELEÇ') || k.includes('SELEC') || k.includes('ÁLBUM') || k.includes('ALBUM') || k.includes('PORTAL') || k.includes('CONVIDADO')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
  // Contrato
  if (k.includes('CONTRATO') || k.includes('CPS')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  )
  // Redes sociais
  if (k.includes('REDES') || k.includes('SOCIAL')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
  // Default — losango
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 10-10 10L2 12 12 2z" />
    </svg>
  )
}

/* ── Cartão (interno ou externo) ─────────────────────────────── */
function Tile({
  href, label, idx, internal,
}: { href: string; label: string; idx: number; internal: boolean }) {
  const meta = metaFor(label)
  const icon = iconFor(label)
  const content = (
    <>
      <span className="tile-sweep" />
      <div className="tile-row">
        <div className="tile-num">{String(idx).padStart(2, '0')}</div>
        <div className="tile-icon">{icon}</div>
        <div className="tile-body">
          <p className="tile-name">{label}</p>
          <p className="tile-desc">{meta.desc}</p>
        </div>
        <span className={`tile-arrow ${internal ? 'is-internal' : 'is-external'}`}>
          {internal ? '→' : '↗'}
        </span>
      </div>
    </>
  )
  if (internal) {
    return (
      <Link href={href} className="tile">
        {content}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="tile">
      {content}
    </a>
  )
}

export default async function SecaoPage({ params }: Props) {
  const { id } = await params

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  const [{ data: section }, { data: pages }, { data: images }] = await Promise.all([
    supabase.from('menu_sections').select('*').eq('id', id).single(),
    supabase.from('pages').select('*').eq('section_id', id).order('order_index'),
    supabase.from('section_images').select('*').eq('section_id', id).order('order_index'),
  ])

  if (!section) notFound()

  /* ── Recolher botões extra (fixos) ─────────────────────────── */
  const extraButtons: { href: string; label: string; internal: boolean }[] = []

  if (section.name?.toUpperCase().includes('CLIENTE')) {
    extraButtons.push(
      { href: '/fotos-selecao',   label: 'Fotos Seleção Noivos', internal: true },
      { href: '/albuns-casamento', label: 'Álbuns de Casamento',  internal: true },
      { href: '/portais-clientes', label: 'Portal do Cliente',    internal: true },
      { href: '/contrato-cps',     label: 'Dados para Contrato CPS', internal: true },
    )
  }

  if (section.name?.toUpperCase().includes('FINANÇ') || id === '657aa823-19f0-4bc8-a1a1-a0a712f6d6e0') {
    extraButtons.push(
      { href: '/financas',                label: 'Pagamentos Noivos',       internal: true },
      { href: '/financas-gerais',         label: 'Finanças Gerais',          internal: true },
      { href: '/orcamento-deslocacao',    label: 'Orçamento de Deslocação',  internal: true },
    )
  }

  /* ── Filtrar páginas (excluir eventos 2025/2027) ─────────── */
  const filteredPages = (pages ?? []).filter(page => {
    const t = page.title?.toUpperCase() ?? ''
    return !(t.includes('EVENTO') && (t.includes('2025') || t.includes('2027')))
  })

  /* ── Mapear páginas → botões ─────────────────────────────── */
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
      t.includes('TAREFA')          ||
      t.includes('OBJECTIVO')       ||
      t.includes('OBJETIVO')        ||
      t.includes('REDES')           ||
      t.includes('SOCIAL')          ||
      t.includes('CONVIDADO')

    const href = isInternal
      ? page.title === 'CRM'          ? '/crm'
      : page.title === 'EVENTOS 2026' ? '/casamentos'
      : t.includes('FINANÇ')          ? '/financas'
      : t.includes('SELEÇÃO') || t.includes('SELECAO') ? '/fotos-selecao'
      : t.includes('FREELANC')        ? '/freelancers'
      : t.includes('CALENDARIO') || t.includes('CALENDÁRIO') ? '/calendario'
      : t.includes('NEWSLETTER')      ? '/newsletter-admin'
      : t.includes('TAREFA')                                    ? '/tarefas'
      : t.includes('OBJECTIVO') || t.includes('OBJETIVO')        ? '/objetivos'
      : t.includes('REDES')    || t.includes('SOCIAL')          ? '/redes'
      : t.includes('CONVIDADO')                                  ? '/fotos-convidados'
      : '/'
      : (page.notion_url ?? '#')

    return {
      href,
      label: page.title === 'EVENTOS 2026' ? 'CASAMENTOS' : (page.title ?? ''),
      internal: isInternal,
    }
  })

  const allButtons: Btn[] = [...extraButtons, ...pageButtons]

  /* ── Agrupar visualmente (Operação / Clientes / Equipa & Metas)
       só para Menu Geral. Mantém ordem original. */
  const groupTitles = { op: 'Operação', cli: 'Clientes', eq: 'Equipa & Metas' } as const
  const grouped: Record<'op' | 'cli' | 'eq', Btn[]> = { op: [], cli: [], eq: [] }
  allButtons.forEach(b => {
    const g = metaFor(b.label).group
    grouped[g].push(b)
  })
  let counter = 0

  return (
    <main className="rl-mg">
      {/* ── Voltar ────────────────────────────────────────── */}
      <div className="rl-mg-back-row">
        <Link href="/photo" className="rl-mg-back">
          <span className="chev">‹</span> Voltar ao Menu
        </Link>
      </div>

      {/* ── Cabeçalho de marca ─────────────────────────── */}
      <header className="rl-mg-head">
        <div className="rl-mg-mono" aria-hidden="true">
          <span>RL</span>
        </div>
        <p className="rl-mg-eyebrow">RL Photo · Video — Back-office</p>
        <h1 className="rl-mg-title">
          {section.name?.toUpperCase().includes('GERAL') ? (
            <>MENU <em>Geral</em></>
          ) : (
            section.name
          )}
        </h1>
        <hr className="rl-mg-rule" />
      </header>

      {/* Revista de fotos (só quando há fotos) */}
      {(images && images.length > 0) && (
        <MagazineViewer
          images={images ?? []}
          sectionId={id}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Cartões agrupados ───────────────────────────── */}
      {allButtons.length > 0 ? (
        <div className="rl-mg-groups">
          {(['op', 'cli', 'eq'] as const).map(gKey => {
            const items = grouped[gKey]
            if (items.length === 0) return null
            return (
              <section key={gKey} className="rl-mg-group">
                <p className="rl-mg-group-label">{groupTitles[gKey]}</p>
                <div className="rl-mg-grid">
                  {items.map(btn => {
                    counter += 1
                    return (
                      <Tile
                        key={btn.href + counter}
                        href={btn.href}
                        label={btn.label}
                        idx={counter}
                        internal={btn.internal}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="rl-mg-empty">Sem conteúdo ainda</div>
      )}
    </main>
  )
}
