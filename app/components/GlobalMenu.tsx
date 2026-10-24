'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AdminNotificationsBell } from './AdminNotificationsBell'
import MediaPillNav from '@/app/media/_components/MediaPillNav'

const HIDDEN_PATHS = ['/login', '/portal-cliente', '/portal-batizado', '/freelancer-view', '/r/', '/b/', '/nova-lead', '/portal-media', '/painel-editor', '/convidados/', '/opiniao', '/equipa-rlprod/']
// Paths em que o menu lateral permanente é colapsado (só botão flutuante visível)
const COLLAPSED_PATHS = ['/freelancers/', '/painel-fotografo']
const HIDDEN_EXACT = ['/'] // brand selector — sem menu lateral

const MEDIA_LINKS = [
  {
    href: '/media', label: 'RL PROD', sub: 'Menu principal',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    exact: true,
  },
  {
    href: '/media/crm', label: 'CRM', sub: 'Leads e contactos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/media/equipa', label: 'Equipa', sub: 'Videógrafos, fotógrafos, editores',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="9" cy="8" r="3.2"/><path strokeLinecap="round" d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path strokeLinecap="round" d="M16.5 13.6c2.6.2 4.5 2.1 4.5 4.9"/></svg>,
  },
  {
    href: '/media/recursos-humanos', label: 'Recursos Humanos', sub: 'Equipa e gestão',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>,
  },
  {
    href: '/media/financas', label: 'Finanças', sub: 'Pagamentos e receitas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/media/portal-cliente', label: 'Projetos', sub: 'Portais dos clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
]

// Secção Finanças do menu (lá dentro está tudo: receitas, orçamentos, etc.)
const FINANCAS_SECAO = '/secao/657aa823-19f0-4bc8-a1a1-a0a712f6d6e0'

// Menus Produção e Gestão: colunas com título dourado e cartões de acesso (estilo da coluna Staff)
type ColunaMenu = { titulo: string; links: Array<{ href: string; pill: string; label?: string; sub?: string }> }
const COLUNAS_MENU: Record<string, ColunaMenu[]> = {
  Produção: [
  { titulo: 'Dep. de Vídeo', links: [
    { href: '/edicao-video', pill: 'Quadro' },
    { href: '/edicao-video/fluxo', pill: 'Fases' },
    { href: '/videos', pill: 'Entregas' },
    { href: '/painel-editor', pill: 'Editor' },
  ] },
  { titulo: 'Dep. de Fotografia', links: [
    { href: '/edicao-fotografia', pill: 'Quadro' },
    { href: '/edicao-fotografia/albuns', pill: 'Álbuns' },
    { href: '/galerias', pill: 'Entregas' },
    { href: '/ticket-fotos-dia', pill: 'Papel' },
    { href: '/fotos-convidados', pill: 'Convidados' },
    { href: '/painel-fotografo', pill: 'Fotógrafo' },
  ] },
  ],
  Gestão: [
  { titulo: 'Finanças', links: [
    { href: FINANCAS_SECAO, pill: 'Receitas' },
    { href: '/registar-pagamento', pill: 'Pagamentos' },
    { href: '/orcamento-servico', pill: 'Serviço' },
    { href: '/orcamento-deslocacao', pill: 'Deslocação' },
  ] },
  { titulo: 'Organização', links: [
    { href: '/calendario', pill: 'Agenda' },
    { href: '/relatorio-diario', pill: 'Análise' },
    { href: '/tarefas', pill: 'Por fazer' },
    { href: '/formularios', pill: 'Entradas' },
    { href: '/tickets', pill: 'Tickets', label: 'Emails Enviados', sub: 'Exemplos' },
  ] },
  { titulo: 'Gestão', links: [
    { href: '/crm', pill: 'Leads', label: 'CRM Casamentos' },
    { href: '/crm/follow-up', pill: 'Contactos' },
    { href: '/crm/analises', pill: 'Reuniões' },
    { href: '/crm/stats', pill: 'Números' },
    { href: '/crescimento', pill: 'Marketing' },
    { href: '/social-media', pill: 'Redes' },
    { href: '/newsletter-admin', pill: 'Emails' },
  ] },
  { titulo: 'Staff', links: [
    { href: '/staff', pill: 'Equipa' },
    { href: '/freelancers', pill: 'Equipa' },
    { href: '/recrutamento', pill: 'Candidatos' },
  ] },
  ],
}

const LINKS = [
  {
    href: '/photo', label: 'Menu Principal', sub: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    exact: true,
  },
  {
    href: '/crm', label: 'CRM', sub: 'Clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/calendario', label: 'Calendário', sub: 'Agenda',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: FINANCAS_SECAO, label: 'Finanças', sub: 'Receitas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/casamentos', label: 'Casamentos', sub: 'Eventos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.498 3.498 1 6.5 1c1.8 0 3.4.9 4.5 2.3A5.49 5.49 0 0115.5 1C18.502 1 21 3.498 21 7.191c0 4.105-5.37 8.863-11 14.402z"/></svg>,
  },
  {
    href: '/staff', label: 'Staff', sub: 'Equipa nos emails',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="9" cy="8" r="3.2"/><path strokeLinecap="round" d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8"/><circle cx="17" cy="9" r="2.4"/><path strokeLinecap="round" d="M15.5 14.4c2.3.2 4 1.6 4.6 4.6"/></svg>,
  },
  {
    href: '/relatorio-diario', label: 'Relatório Diário', sub: 'Análise',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    href: '/edicao-video', label: 'Dep. de Vídeo', sub: 'Departamento',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="6" width="13" height="12" rx="2"/><path strokeLinejoin="round" d="M16 10.5l5-3v9l-5-3"/></svg>,
  },
  {
    href: '/edicao-fotografia', label: 'Dep. de Fotografia', sub: 'Departamento',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinejoin="round" d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  },
  {
    href: '/freelancers', label: 'Freelancers', sub: 'Equipa',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>,
  },
  {
    href: '/tickets', label: 'Tickets', sub: 'Exemplos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z"/><path strokeLinecap="round" strokeDasharray="2 2" d="M15 5v14"/></svg>,
  },
  {
    href: '/edicao-fotografia/albuns', label: 'Álbuns', sub: 'Fotografia',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>,
  },
  {
    href: '/portais-clientes', label: 'Portais Clientes', sub: 'Acesso',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
  {
    href: '/eventos-2026', label: 'Eventos 2026', sub: 'Agenda',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  },
]

export default function GlobalMenu() {
  // useSearchParams requires Suspense em Next.js 16
  return (
    <Suspense fallback={null}>
      <GlobalMenuInner />
    </Suspense>
  )
}

function GlobalMenuInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  // Barra estreita (só ícones) — fica guardado entre visitas
  const [compact, setCompact] = useState(false)
  const [busca, setBusca] = useState('')
  // Grupo da barra de topo com o painel aberto (ao passar o rato)
  const [mega, setMega] = useState<string | null>(null)
  const fecharMega = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCompact(localStorage.getItem('rl-menu-compacto') === '1')
  }, [])

  // O conteúdo das páginas acompanha a largura da barra
  useEffect(() => {
    document.documentElement.style.setProperty('--rl-sidebar', '0px') // o menu passou para o topo
  }, [compact])

  function toggleCompact() {
    setCompact(v => {
      localStorage.setItem('rl-menu-compacto', v ? '0' : '1')
      return !v
    })
  }

  const isHidden = HIDDEN_EXACT.includes(pathname) || HIDDEN_PATHS.some(p => pathname.startsWith(p))
  // Esconder também quando ?view=freelancer (modo "Ver como Freelancer")
  const isFreelancerView = searchParams?.get('view') === 'freelancer'
  if (isHidden || isFreelancerView) return null

  // Em paths colapsados: sidebar permanente escondida, só botão flutuante (drawer)
  const isCollapsed = COLLAPSED_PATHS.some(p => pathname.startsWith(p))

  const isMedia = pathname.startsWith('/media')
  // RL PROD: barra em pílula em todos os tamanhos (sem barra de topo nem gaveta)
  if (isMedia) return <MediaPillNav />
  const gold = 'rgba(201,168,76,'
  const accent = (op: number) => isMedia ? `rgba(255,255,255,${op})` : `${gold}${op})`

  const navLinks = isMedia ? MEDIA_LINKS : LINKS

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/') || (href !== '/photo' && href !== '/media' && pathname.startsWith(href)))

  const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  // ── Link item — shared between drawer and sidebar ──────────────────────────
  const NavItem = ({ href, label, sub, icon, exact, mini }: { href: string; label: string; sub?: string; icon: ReactNode; exact?: boolean; mini?: boolean }) => {
    const active = isActive(href, exact)
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        title={mini ? label : undefined}
        className={`group relative flex items-center ${mini ? 'justify-center' : 'gap-2.5'} rounded-full transition-all duration-200`}
        style={{
          padding: mini ? '3px 0' : '3px 8px',
          background: active ? '#141414' : 'transparent',
          border: `1px solid ${active ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          borderLeft: `2px solid ${active ? accent(0.95) : 'transparent'}`,
          boxShadow: active ? `0 0 26px -14px ${accent(0.7)}` : 'none',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Ícone em círculo, como os cartões do painel */}
        <span className="shrink-0 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{
            width: '24px', height: '24px',
            color: active ? accent(0.95) : accent(0.6),
            background: active ? (isMedia ? 'rgba(255,255,255,0.10)' : `${gold}0.14)`) : (isMedia ? 'rgba(255,255,255,0.04)' : `${gold}0.06)`),
          }}>
          {icon}
        </span>

        {!mini && (
          <div className="flex-1 min-w-0">
            <p className="font-cond text-[14px] leading-tight truncate transition-colors duration-200"
              style={{ color: active ? '#fff' : 'rgba(255,255,255,0.68)' }}>
              {label}
            </p>
            {false && sub && (
              <p className="font-cond text-[11.5px] leading-tight mt-0.5 truncate"
                style={{ color: active ? accent(0.7) : 'rgba(255,255,255,0.3)' }}>
                {sub}
              </p>
            )}
          </div>
        )}
      </Link>
    )
  }

  // ── Cross-brand switcher ───────────────────────────────────────────────────
  const BrandSwitch = ({ mini }: { mini?: boolean }) => (
    <Link
      href={isMedia ? '/photo' : '/media'}
      onClick={() => setOpen(false)}
      title={mini ? (isMedia ? 'RL Photo.Video' : 'RL PROD') : undefined}
      className={`flex items-center ${mini ? 'justify-center' : 'gap-3'} rounded-full transition-all duration-200`}
      style={{ padding: mini ? '10px 0' : '9px 14px', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
    >
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
        </svg>
      </span>
      {!mini && (
        <>
          <span className="font-cond text-[14px] font-medium flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {isMedia ? 'RL Photo.Video' : 'RL PROD'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>→</span>
        </>
      )}
    </Link>
  )

  // ── Sidebar content (shared) ───────────────────────────────────────────────
  // mini = barra estreita (só no desktop); comToggle = tem o botão de encolher
  const SidebarContent = ({ mini = false, comToggle = false }: { mini?: boolean; comToggle?: boolean }) => {
    const filtro = semAcentos(busca.trim())
    const visiveis = filtro
      ? navLinks.filter((l: any) => semAcentos(l.label).includes(filtro) || semAcentos(l.sub ?? '').includes(filtro))
      : navLinks

    return (
      <>
        {/* Brilho dourado no canto superior */}
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
          style={{ background: `radial-gradient(120% 80% at 0% 0%, ${accent(0.08)}, transparent 70%)` }} />

        {/* Header */}
        <div className={`relative flex items-center ${mini ? 'justify-center' : 'justify-between'} px-4 py-3`}>
          <Link href={isMedia ? '/media' : '/photo'} onClick={() => setOpen(false)}
            className={`flex items-center ${mini ? '' : 'gap-3'} min-w-0`}>
            <span className="shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: '30px', height: '30px',
                border: `1px solid ${accent(0.35)}`,
                background: `linear-gradient(140deg, ${accent(0.16)}, transparent)`,
                color: accent(0.95),
                boxShadow: `0 0 18px -6px ${accent(0.6)}`,
              }}>
              <span className="font-cond text-[13px] font-semibold">RL</span>
            </span>
            {!mini && (
              <div className="min-w-0">
                <p className="font-cond text-[11px] tracking-[0.2em] uppercase font-medium truncate" style={{ color: accent(0.9) }}>
                  {isMedia ? 'RL PROD' : 'Photo · Video'}
                </p>
                <p className="font-cond font-semibold text-[17px] leading-tight text-white mt-0.5">
                  Admin
                </p>
              </div>
            )}
          </Link>

          {!comToggle && (
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Pesquisa — retirada para o menu ficar baixo (há Ctrl+K no painel) */}
        {false && !mini && (
          <div className="relative px-3 pb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.22)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                  <circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="M21 21l-4-4"/>
                </svg>
              </span>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Procurar…"
                className="w-full rounded-full pl-9 pr-8 py-2.5 font-cond text-[13px] text-white/80 placeholder-white/20 focus:outline-none transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onFocus={ev => { ev.currentTarget.style.borderColor = accent(0.35); ev.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onBlur={ev => { ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; ev.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              />
              {busca && (
                <button onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors text-sm leading-none">
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className={`relative flex-1 min-h-0 overflow-y-auto ${mini ? 'px-2.5' : 'px-3'} pb-3 flex flex-col gap-0`}>
          {/* Sino de Notificações — só no menu RL Photo (não no MEDIA) */}
          {!isMedia && (
            <>
              <AdminNotificationsBell compact={mini} />
              <div className="h-px my-1.5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {visiveis.map(({ href, label, sub, icon, exact }: any) => (
            <NavItem key={href} href={href} label={label} sub={sub} icon={icon} exact={exact} mini={mini} />
          ))}
          {visiveis.length === 0 && (
            <p className="text-[11px] text-white/25 italic px-2 py-3">Nada com esse nome.</p>
          )}

          <div className="h-px my-1.5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <BrandSwitch mini={mini} />
        </nav>

        {/* Footer */}
        {comToggle && <div className={`relative flex items-center ${mini ? 'justify-center' : 'justify-between'} gap-2 px-4 py-3`}
          style={{ borderTop: `1px solid ${accent(0.07)}` }}>
          {!mini && (
            <p className="font-cond text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {isMedia ? '© RL PROD' : '© RL Photo · Video'}
            </p>
          )}
          {comToggle && (
            <button
              onClick={toggleCompact}
              title={mini ? 'Alargar menu' : 'Encolher menu'}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor = accent(0.4); ev.currentTarget.style.color = accent(0.9) }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; ev.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"
                style={{ transform: mini ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6"/>
              </svg>
            </button>
          )}
        </div>}
      </>
    )
  }


  // ── Barra de topo (desktop): grupos com menus suspensos ────────────────────
  const GRUPOS: Array<{ nome: string; hrefs: string[] }> = isMedia
    ? MEDIA_LINKS.map(l => ({ nome: l.label, hrefs: [l.href] }))
    : [
        { nome: 'Início', hrefs: ['/photo'] },
        { nome: 'Clientes', hrefs: ['/crm', '/casamentos', '/eventos-2026', '/portais-clientes'] },
        { nome: 'Produção', hrefs: COLUNAS_MENU['Produção'].flatMap(c => c.links.map(l => l.href)) },
        { nome: 'Gestão', hrefs: COLUNAS_MENU['Gestão'].flatMap(c => c.links.map(l => l.href)) },
      ]
  const EXTRA_LINKS = [{
    href: '/tarefas', label: 'Tarefas', sub: 'Por fazer',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/></svg>,
  },
  // Páginas que só aparecem nos separadores do menu Produção
  {
    href: '/edicao-video/fluxo', label: 'Fluxo de Edição', sub: 'Fases do vídeo',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path strokeLinecap="round" d="M7 12h4m0 0l6-5m-6 5l6 5"/></svg>,
  },
  {
    href: '/videos', label: 'Vídeos', sub: 'Entregas Vimeo',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="9"/><path strokeLinejoin="round" d="M10 8.5l5 3.5-5 3.5z"/></svg>,
  },
  {
    href: '/painel-editor', label: 'Painel do Editor', sub: 'Vista do editor',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="4" width="18" height="13" rx="2"/><path strokeLinecap="round" d="M8 21h8M12 17v4"/></svg>,
  },
  {
    href: '/galerias', label: 'Galerias', sub: 'Entregas Wfolio',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>,
  },
  {
    href: '/ticket-fotos-dia', label: 'Tickets do Dia', sub: 'Fotos em papel',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinejoin="round" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z"/></svg>,
  },
  {
    href: '/fotos-convidados', label: 'Fotos dos Convidados', sub: 'Convidados',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="9" cy="8" r="3.2"/><path strokeLinecap="round" d="M3.5 19c.8-3.2 3-4.8 5.5-4.8s4.7 1.6 5.5 4.8"/><circle cx="17" cy="9" r="2.4"/></svg>,
  },
  {
    href: '/painel-fotografo', label: 'Painel do Fotógrafo', sub: 'Vista do fotógrafo',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="4" width="18" height="13" rx="2"/><path strokeLinecap="round" d="M8 21h8M12 17v4"/></svg>,
  },
  // Páginas que só aparecem nas colunas do menu Gestão
  {
    href: '/registar-pagamento', label: 'Registar Pagamento', sub: 'Pagamentos dos noivos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="5" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M2 10h20M6 15h4"/></svg>,
  },
  {
    href: '/orcamento-servico', label: 'Orçamento de Serviço', sub: 'Orçamentos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinejoin="round" d="M6 2h9l5 5v15H6z"/><path strokeLinecap="round" d="M9 12h8M9 16h8M9 8h3"/></svg>,
  },
  {
    href: '/orcamento-deslocacao', label: 'Orçamento de Deslocação', sub: 'Quilómetros e custos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>,
  },
  {
    href: '/formularios', label: 'Formulários', sub: 'Entradas e rollup',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="4" y="3" width="16" height="18" rx="2"/><path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5"/></svg>,
  },
  {
    href: '/crm/follow-up', label: 'Follow-up', sub: 'Leads por contactar',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0113.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.7L4 15.5M4 20v-4.5h4.5"/></svg>,
  },
  {
    href: '/crm/analises', label: 'Análises de Reuniões', sub: 'Reuniões gravadas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="9" y="3" width="6" height="11" rx="3"/><path strokeLinecap="round" d="M5 11a7 7 0 0014 0M12 18v3"/></svg>,
  },
  {
    href: '/crm/stats', label: 'Estatísticas do CRM', sub: 'Conversão',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l4-4 3 3 5-6"/></svg>,
  },
  {
    href: '/crescimento', label: 'Crescimento', sub: 'Marketing',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>,
  },
  {
    href: '/social-media', label: 'Social Media', sub: 'Publicações',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>,
  },
  {
    href: '/newsletter-admin', label: 'Newsletter', sub: 'Envios',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="5" width="18" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6"/></svg>,
  },
  {
    href: '/recrutamento', label: 'Recrutamento', sub: 'Novos freelancers',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="10" cy="8" r="3.5"/><path strokeLinecap="round" d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.4 0 2.7.4 3.8 1.1M18 14v6M15 17h6"/></svg>,
  }]
  const linkDe = (href: string) => ([...navLinks, ...EXTRA_LINKS] as any[]).find(l => l.href === href)

  // Conteúdo do painel de cada grupo, em 4 colunas: destaque (com globo), dois cartões,
  // cartão "mensagem" com botão, e a lista de atalhos do grupo
  const PAINEIS: Record<string, { destaque: string; medidor: string; pares: Array<{ href: string; pill: string }>; mensagem: { href: string; frase: string; botao: string } }> = {
    Clientes: {
      destaque: '/crm', medidor: 'leads',
      pares: [{ href: '/casamentos', pill: 'Agenda' }, { href: '/eventos-2026', pill: 'Fichas' }],
      mensagem: { href: '/portais-clientes', frase: 'Os noivos acompanham tudo no seu portal.', botao: 'Abrir os portais' },
    },
    Produção: {
      destaque: '/edicao-fotografia', medidor: 'fases',
      pares: [{ href: '/edicao-video', pill: 'Vídeo' }],
      mensagem: { href: '/tarefas', frase: 'Tudo o que falta fazer, num só sítio.', botao: 'Ver as tarefas' },
    },
    Gestão: {
      destaque: FINANCAS_SECAO, medidor: 'receitas',
      pares: [{ href: '/calendario', pill: 'Agenda' }, { href: '/relatorio-diario', pill: 'Análise' }, { href: '/tarefas', pill: 'Por fazer' }],
      mensagem: { href: '/tarefas', frase: 'Tudo o que falta fazer, num só sítio.', botao: 'Ver as tarefas' },
    },
  }

  function abrirMega(nome: string | null) {
    if (fecharMega.current) clearTimeout(fecharMega.current)
    if (nome) setMega(nome)
  }
  function sairMega() {
    if (fecharMega.current) clearTimeout(fecharMega.current)
    fecharMega.current = setTimeout(() => setMega(null), 180)
  }

  const BarraTopo = () => (
    <header data-global-menu className="hidden lg:block relative z-40 print:hidden bg-[#0b0b0b]" onMouseLeave={sairMega}>
      <div className="h-16 px-6 xl:px-10 flex items-center gap-6">
        {/* Marca */}
        <Link href={isMedia ? '/media' : '/photo'} className="flex items-center gap-3 shrink-0 w-[220px]">
          {isMedia ? (
            <>
              <span className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ border: `1px solid ${accent(0.4)}`, background: `linear-gradient(140deg, ${accent(0.16)}, transparent)`, color: accent(0.95), boxShadow: `0 0 18px -6px ${accent(0.6)}` }}>
                <span className="font-cond text-[13px] font-semibold">RL</span>
              </span>
              <span className="font-cond text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: accent(0.9) }}>
                RL PROD
              </span>
            </>
          ) : (
            // Logo dourado (o mesmo da Proposta Criativa); o PNG tem muita margem, por isso é recortado
            <span className="flex items-center justify-center overflow-hidden" style={{ width: '42px', height: '52px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_rl_gold.png" alt="RL Photo · Video" className="max-w-none" style={{ width: '96px', marginTop: '3px' }} />
            </span>
          )}
        </Link>

        {/* Navegação ao centro */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {GRUPOS.map(g => {
            const links = g.hrefs.map(linkDe).filter(Boolean)
            const ativo = links.some((l: any) => isActive(l.href, l.exact))
            const corTexto = ativo || mega === g.nome ? accent(0.95) : 'rgba(255,255,255,0.82)'
            if (links.length === 1) {
              const l: any = links[0]
              return (
                <Link key={g.nome} href={l.href} onMouseEnter={() => setMega(null)}
                  className="px-4 py-2 rounded-full font-cond text-[16px] font-medium transition-colors hover:bg-white/[0.05]"
                  style={{ color: corTexto }}>
                  {g.nome}
                </Link>
              )
            }
            return (
              <button key={g.nome} onMouseEnter={() => abrirMega(g.nome)} onClick={() => setMega(m => m === g.nome ? null : g.nome)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-cond text-[16px] font-medium transition-colors"
                style={{ color: corTexto, background: mega === g.nome ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                {g.nome}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 opacity-50 transition-transform duration-200"
                  style={{ transform: mega === g.nome ? 'rotate(180deg)' : 'none' }} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )
          })}
        </nav>

        {/* À direita: notificações, troca de marca e dois atalhos */}
        <div className="flex items-center gap-3 shrink-0 w-[220px] justify-end">
          {!isMedia && <div className="w-10"><AdminNotificationsBell compact topo /></div>}
          <span className="w-px h-6 bg-white/[0.12]" />
          <Link href={isMedia ? '/photo' : '/media'}
            className="font-cond text-[15px] text-white/45 hover:text-white transition-colors whitespace-nowrap">
            {isMedia ? 'RL Photo' : 'RL PROD'}
          </Link>
          {!isMedia && (
            <>
              <Link href="/tarefas"
                className="hidden xl:inline-flex rounded-full border border-white/[0.16] hover:border-white/35 bg-[#0e0e0e] px-4 py-2 font-cond text-[15px] font-semibold text-white transition-colors whitespace-nowrap">
                Tarefas
              </Link>
              <Link href="/calendario"
                className="rounded-full border px-4 py-2 font-cond text-[15px] font-semibold text-white transition-all whitespace-nowrap hover:brightness-125"
                style={{ borderColor: accent(0.5), background: accent(0.1), boxShadow: `0 0 24px -10px ${accent(0.7)}` }}>
                Calendário
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Painel largo por baixo da barra: só o do grupo apontado, em 4 colunas */}
      {!isMedia && (() => {
        const g = GRUPOS.find(x => x.nome === mega)
        const pn = g ? PAINEIS[g.nome] : null
        const links = g ? (g.hrefs.map(linkDe).filter(Boolean) as any[]) : []
        const dest = pn ? linkDe(pn.destaque) : null
        const msg = pn ? linkDe(pn.mensagem.href) : null
        const coluna = 'relative rounded-[20px] bg-[#0e1213] border border-white/[0.04] p-4 min-h-[250px] flex flex-col'
        // Produção e Gestão: colunas com título e cartões (COLUNAS_MENU); os outros grupos usam o painel antigo
        const colunas = g ? COLUNAS_MENU[g.nome] : undefined
        const titulo = (t: string) => colunas ? (
          <p className="absolute z-10 top-3.5 left-5 font-cond text-[11px] tracking-[0.25em] uppercase font-medium" style={{ color: accent(0.8) }}>{t}</p>
        ) : null
        const cartao = 'rounded-[16px] border border-white/[0.08] bg-[#1a1f20] transition-all duration-200 hover:border-white/[0.18] hover:bg-[#202627]'
        const pill = (aqui: boolean, texto: string) => (
          <span className="shrink-0 rounded-full border px-2.5 py-0.5 font-cond text-[12.5px] font-semibold"
            style={aqui
              ? { color: '#0b0b0b', background: accent(0.85), borderColor: accent(0.85) }
              : { color: accent(0.95), background: accent(0.12), borderColor: accent(0.3) }}>
            {aqui ? 'Estás aqui' : texto}
          </span>
        )
        return (
          <div className="absolute left-0 right-0 top-full z-50 px-6 xl:px-10 pt-3 pb-10 transition-all duration-200"
            style={{
              opacity: pn ? 1 : 0, visibility: pn ? 'visible' : 'hidden',
              transform: pn ? 'translateY(0)' : 'translateY(-6px)',
              background: 'linear-gradient(180deg, rgba(11,11,11,0.98) 75%, rgba(11,11,11,0))',
            }}
            onMouseEnter={() => abrirMega(mega)} onMouseLeave={sairMega}>
            {pn && g && dest && msg && (
              <div key={g.nome} className="max-w-7xl mx-auto grid grid-cols-4 gap-5 [animation:megaIn_.25s_ease-out]">

                {/* Produção e Gestão: uma coluna por tema (título + cartões de acesso, como a coluna Staff) */}
                {colunas && colunas.map(c => (
                  <div key={c.titulo} className={`${coluna} pt-11 gap-3`}>
                    {titulo(c.titulo)}
                    {c.links.map(({ href, pill: textoPill, label, sub }) => {
                      const l = linkDe(href)
                      if (!l) return null
                      return (
                        <Link key={href} href={l.href} onClick={() => setMega(null)} className={`${cartao} px-4 py-3.5`}>
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ color: accent(0.95), background: accent(0.14) }}>{l.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-cond font-semibold text-[17px] text-white truncate">{label ?? l.label}</span>
                              <span className="block font-cond text-[14px] text-white/50 truncate">{sub ?? l.sub}</span>
                            </span>
                            {pill(isActive(l.href, l.exact), textoPill)}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ))}

                {/* 1 · Destaque com globo pontilhado */}
                {!colunas && <div className={`${coluna} overflow-hidden justify-end`}>
                  {titulo('Finanças')}
                  <svg viewBox="0 0 200 200" className="absolute -top-6 left-1/2 -translate-x-1/2 w-[230px] h-[230px]" aria-hidden>
                    <defs>
                      <pattern id="mega-pontos" width="5" height="5" patternUnits="userSpaceOnUse">
                        <circle cx="2.5" cy="2.5" r="0.9" fill={accent(0.55)} />
                      </pattern>
                      <radialGradient id="mega-luz" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#fff" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                      </radialGradient>
                      <mask id="mega-mask"><circle cx="100" cy="100" r="78" fill="url(#mega-luz)" /></mask>
                    </defs>
                    <circle cx="100" cy="100" r="78" fill="url(#mega-pontos)" mask="url(#mega-mask)" />
                    <ellipse cx="100" cy="100" rx="96" ry="34" fill="none" stroke={accent(0.45)} strokeWidth="0.8" transform="rotate(-38 100 100)" />
                    <circle cx="152" cy="62" r="4" fill="none" stroke={accent(0.8)} strokeWidth="0.8" />
                    <circle cx="152" cy="62" r="1.6" fill={accent(0.95)} />
                  </svg>
                  <Link href={dest.href} onClick={() => setMega(null)} className={`relative ${cartao} px-4 py-3.5 backdrop-blur-md`}>
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ color: accent(0.95), background: accent(0.14) }}>{dest.icon}</span>
                      <span className="font-cond font-semibold text-[17px] text-white flex-1 truncate">{dest.label}</span>
                      <span className="flex items-end gap-[2px] h-3" aria-hidden>
                        {Array.from({ length: 9 }).map((_, i) => (
                          <span key={i} className="w-[2px] rounded-full" style={{ height: '100%', background: i < 7 ? accent(0.9) : 'rgba(255,255,255,0.15)' }} />
                        ))}
                      </span>
                      <span className="font-cond text-[13px] text-white/50">{pn.medidor}</span>
                    </div>
                    <p className="font-cond text-[14px] text-white/50 mt-1.5 pl-12">{dest.sub}</p>
                  </Link>
                </div>}

                {/* 2 · Dois cartões com pílula */}
                {!colunas && <div className={`${coluna} justify-center gap-3`}>
                  {titulo('Organização')}
                  {pn.pares.map(par => {
                    const l = linkDe(par.href)
                    if (!l) return null
                    return (
                      <Link key={par.href} href={l.href} onClick={() => setMega(null)} className={`${cartao} px-4 py-3.5`}>
                        <p className="font-cond font-semibold text-[17px] text-white">{l.label}</p>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className="font-cond text-[14px] text-white/50 truncate">{l.sub}</p>
                          {pill(isActive(l.href, l.exact), par.pill)}
                        </div>
                      </Link>
                    )
                  })}
                </div>}

                {/* 3 · Cartão "mensagem" com botão */}
                {!colunas && <div className={`${coluna} justify-center`}>
                  {titulo('Gestão')}
                  <div className={`${cartao} hover:bg-[#1a1f20] px-4 py-4`}>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ color: accent(0.95), background: accent(0.14), border: `1px solid ${accent(0.3)}` }}>{msg.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-cond font-semibold text-[17px] text-white truncate">{msg.label}</span>
                        <span className="block font-cond text-[14px] text-white/50 truncate">{msg.sub}</span>
                      </span>
                      <span className="font-cond text-[13px] text-white/40">RL</span>
                    </div>
                    <p className="font-cond italic text-[14px] text-white/55 mt-3 pl-3 border-l-2 border-white/[0.12]">“{pn.mensagem.frase}”</p>
                    <Link href={msg.href} onClick={() => setMega(null)}
                      className="mt-3 flex items-center gap-2.5 rounded-[12px] bg-white/[0.10] hover:bg-white/[0.16] px-4 py-2.5 font-cond font-semibold text-[15px] text-white transition-colors">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill={accent(0.95)} aria-hidden><path d="M10 2.5l1.6 4.9 4.9 1.6-4.9 1.6L10 15.5l-1.6-4.9L3.5 9l4.9-1.6z" /></svg>
                      {pn.mensagem.botao}
                    </Link>
                  </div>
                </div>}

                {/* 4 · Lista de atalhos do grupo */}
                {!colunas && <div className={`${coluna} justify-center`}>
                  <div className="rounded-[16px] border border-white/[0.08] bg-[#1a1f20]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
                      <p className="font-cond font-semibold text-[17px] text-white">{g.nome}</p>
                      <p className="font-cond text-[14px] text-white/45">{links.length} / {links.length}</p>
                    </div>
                    <div className="px-2 py-2 flex flex-col">
                      {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setMega(null)}
                          className="flex items-center gap-3 rounded-[10px] px-2 py-2 hover:bg-white/[0.05] transition-colors">
                          <span className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center" style={{ background: accent(isActive(l.href, l.exact) ? 0.95 : 0.7) }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#0b0b0b" strokeWidth="3.2" className="w-3 h-3" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                          </span>
                          <span className="font-cond font-semibold text-[16px] text-white">{l.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>}
              </div>
            )}
          </div>
        )
      })()}

      {/* Faixa fina riscada por baixo, a dourado */}
      <div className="h-[5px]" style={{
        background: `repeating-linear-gradient(90deg, ${accent(0.35)} 0 1px, transparent 1px 4px)`,
        maskImage: 'linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)',
      }} />
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent(0.45)}, transparent)` }} />
    </header>
  )

  return (
    <>
      {/* Esconde tudo no PDF / print */}
      <style jsx global>{`
        @media print {
          [data-global-menu] { display: none !important; }
        }
        @keyframes megaIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
      `}</style>

      {/* ── DESKTOP: barra de topo (nos paths colapsados fica só o botão flutuante) ── */}
      {!isCollapsed && BarraTopo()}

      {/* ── Botão hambúrguer/seta (mobile sempre; desktop só em paths colapsados) ── */}
      <button
        onClick={() => setOpen(true)}
        data-global-menu
        className={`${isCollapsed ? '' : 'lg:hidden'} fixed top-4 z-[60] w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-200 print:hidden`}
        style={{
          left: isCollapsed ? 'auto' : '1rem',
          right: isCollapsed ? '1rem' : 'auto',
          background: 'rgba(0,4,10,0.75)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${accent(0.2)}`,
          boxShadow: `0 0 16px ${accent(0.06)}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent(0.45); e.currentTarget.style.boxShadow = `0 0 20px ${accent(0.12)}` }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = accent(0.2);  e.currentTarget.style.boxShadow = `0 0 16px ${accent(0.06)}` }}
        aria-label="Menu"
        title="Menu Principal"
      >
        {isCollapsed ? (
          /* Seta indicando 'abrir menu' */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" style={{ color: accent(0.85) }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <>
            <span className="block rounded-full" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
            <span className="block rounded-full" style={{ width: '10px', height: '1px', background: accent(0.5) }} />
            <span className="block rounded-full" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
          </>
        )}
      </button>

      {/* Drawer overlay (mobile sempre; desktop só em paths colapsados) */}
      {open && (
        <div
          data-global-menu
          className={`${isCollapsed ? '' : 'lg:hidden'} fixed inset-0 z-[55] print:hidden`}
          style={{ background: 'rgba(0,4,10,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer (mobile sempre; desktop só em paths colapsados) */}
      <div
        data-global-menu
        className={`${isCollapsed ? '' : 'lg:hidden'} fixed top-3 left-3 max-h-[calc(100dvh-24px)] rounded-[20px] overflow-hidden z-[60] flex flex-col transition-transform duration-300 ease-in-out print:hidden ${open ? 'translate-x-0' : '-translate-x-[115%]'}`}
        style={{
          width: '220px',
          background: '#0b0b0b',
          border: `1px solid ${accent(0.14)}`,
          boxShadow: `0 20px 50px -10px rgba(0,0,0,0.8)`,
        }}
      >
        <SidebarContent />
      </div>
    </>
  )
}

