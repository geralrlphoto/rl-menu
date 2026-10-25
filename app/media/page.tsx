import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { FUNDO, FUNDO_TAMANHO, COR } from '@/app/media/_lib/estilo'
import { lerFontesMedia, montarEventos, chaveDia, lerData, hojeLisboa, TIPOS } from '@/app/media/_lib/eventos'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ACCENT = '#5a8bff'
const AZUL = '#2e6cf6'

const SECTION_META: Record<string, { href: string; icon: string }> = {
  'CRM':              { href: '/media/crm',              icon: '◈' },
  'Recursos Humanos': { href: '/media/recursos-humanos', icon: '◉' },
  'Finanças':         { href: '/media/financas',         icon: '◇' },
  'Portal Cliente':   { href: '/media/portal-cliente',   icon: '◎' },
}

// Cards fixos que não vêm da tabela media_sections
const STATIC_CARDS = [
  { id: 'equipa',            name: 'Equipa',            href: '/media/equipa',            icon: '◍' },
  { id: 'proposta-criativa', name: 'Proposta Criativa', href: '/media/proposta-criativa', icon: '✦' },
  { id: 'orcamentos',        name: 'Orçamentos',        href: '/media/orcamentos',        icon: '◊' },
  { id: 'ficha-cliente',     name: 'Ficha de Cliente',  href: '/media/ficha-cliente',     icon: '◑' },
]

const euros = (n: number) => n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const diaCurto = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })

export default async function MediaDashboard() {
  const [{ data: sections }, { data: todasLeads }, { portais, leads }] = await Promise.all([
    supabase.from('media_sections').select('*').order('order_index'),
    supabase.from('media_leads').select('id, nome, empresa, estado, created_at, updated_at').order('created_at', { ascending: false }).limit(300),
    lerFontesMedia(supabase),
  ])
  const listaLeads = (todasLeads ?? []) as { id: string; nome: string | null; empresa: string | null; estado: string; created_at: string; updated_at: string | null }[]
  const leadsNovas = listaLeads.filter(l => l.estado === 'Novo').length
  const propostasEnv = listaLeads.filter(l => l.estado === 'Negociação').length
  const eventos = montarEventos(portais, leads)

  // Pagamentos em falta: pendentes + em atraso de todos os portais
  let emFalta = 0
  let nEmFalta = 0
  // Próximos trabalhos: filmagens e entregas de hoje para a frente
  const hoje = hojeLisboa()
  const proximas: Date[] = []
  for (const p of portais) {
    for (const pg of Array.isArray(p.pagamentos) ? p.pagamentos : []) {
      if (pg?.estado === 'pendente' || pg?.estado === 'em_atraso') { emFalta += Number(pg.valor) || 0; nEmFalta++ }
    }
    for (const d of [lerData(p.filmagem), lerData(p.entrega)]) if (d && d >= hoje) proximas.push(d)
  }
  proximas.sort((a, b) => a.getTime() - b.getTime())

  const NUMEROS = [
    { valor: String(leadsNovas ?? 0), titulo: 'Leads novas', sub: 'por contactar', href: '/media/crm/leads' },
    { valor: String(propostasEnv ?? 0), titulo: 'Em negociação', sub: 'à espera de decisão', href: '/media/crm/leads' },
    { valor: euros(emFalta), titulo: 'Pagamentos em falta', sub: nEmFalta === 1 ? '1 prestação' : `${nEmFalta} prestações`, href: '/media/financas' },
    { valor: String(proximas.length), titulo: 'Próximos trabalhos', sub: proximas[0] ? `o próximo a ${diaCurto(proximas[0])}` : 'nada marcado', href: '/media/portal-cliente' },
  ]

  // ── Hoje: o que precisa de atenção ──────────────────────────────────────
  const DIA_MS = 86400000
  const diasDesde = (iso: string | null) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DIA_MS) : 0
  type Tarefa = { cor: string; etiqueta: string; titulo: string; detalhe: string; href: string; peso: number }
  const tarefas: Tarefa[] = []
  for (const l of listaLeads) {
    const nome = l.empresa || l.nome || 'Lead'
    if (l.estado === 'Novo' && diasDesde(l.created_at) >= 2) {
      tarefas.push({ cor: ACCENT, etiqueta: 'Contactar', titulo: nome, detalhe: `Entrou há ${diasDesde(l.created_at)} dias e ainda não foi contactada`, href: `/media/crm/leads?lead=${l.id}`, peso: 2 })
    }
    if (l.estado === 'Negociação' && diasDesde(l.updated_at ?? l.created_at) >= 5) {
      tarefas.push({ cor: '#a9c1ff', etiqueta: 'Seguimento', titulo: nome, detalhe: `Em negociação sem resposta há ${diasDesde(l.updated_at ?? l.created_at)} dias`, href: `/media/crm/leads?lead=${l.id}`, peso: 3 })
    }
  }
  for (const p of portais) {
    for (const pg of Array.isArray(p.pagamentos) ? p.pagamentos : []) {
      const d = lerData(pg?.data)
      if (pg?.estado === 'em_atraso' || (pg?.estado === 'pendente' && d && d < hoje)) {
        tarefas.push({ cor: '#ff4747', etiqueta: 'Cobrar', titulo: `${p.nome || p.ref}`, detalhe: `${pg?.descricao || 'Pagamento'} · ${euros(Number(pg?.valor) || 0)} em atraso`, href: '/media/financas', peso: 4 })
      }
    }
  }
  const em7 = new Date(hoje); em7.setDate(em7.getDate() + 7)
  for (const e of eventos) {
    const d = lerData(e.dia)
    if (d && d >= hoje && d <= em7) {
      tarefas.push({ cor: TIPOS[e.tipo].cor, etiqueta: TIPOS[e.tipo].nome, titulo: e.titulo, detalhe: d.getTime() === hoje.getTime() ? 'Hoje' : d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' }), href: e.href, peso: 1 })
    }
  }
  tarefas.sort((a, b) => b.peso - a.peso)

  // Calendário dos próximos 30 dias, alinhado à semana (segunda a domingo)
  const porDia = new Map<string, typeof eventos>()
  for (const e of eventos) porDia.set(e.dia, [...(porDia.get(e.dia) ?? []), e])
  const dias30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(hoje); d.setDate(d.getDate() + i); return d })
  const eventos30 = dias30.reduce((n, d) => n + (porDia.get(chaveDia(d))?.length ?? 0), 0)

  const items = [
    ...(sections ?? []).map(s => ({
      id: String(s.id),
      // A secção "Portal Cliente" aparece como "Projetos" (o nome na tabela fica igual)
      name: s.name === 'Portal Cliente' ? 'Projetos' : s.name as string,
      image_url: s.image_url as string | null,
      href: SECTION_META[s.name]?.href ?? `/media/secao/${s.id}`,
      icon: SECTION_META[s.name]?.icon ?? '◌',
    })),
    ...STATIC_CARDS.map(c => ({ ...c, image_url: null })),
  ]

  return (
    <main className={`rlp min-h-screen text-white relative overflow-hidden`}>

      {/* ── Fundo do rlprod.pt: azul-marinho, brilho azul e grelha fina ── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO, backgroundSize: FUNDO_TAMANHO }} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-10 sm:pt-12 text-center">
        <span className="rlp-m traco text-[11px] text-[#5a8bff]">Menu Interno</span>

        <h1 className="mt-6 text-[44px] sm:text-[64px] lg:text-[76px] rlp-t leading-[1.02] ">
          Photography &amp; Video
          <br />
          <span style={{ color: ACCENT }}>for brands</span>
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-[14px] sm:text-[15px] leading-relaxed text-white/60">
          CRM, propostas, orçamentos, clientes e finanças da RL Prod, tudo num só lugar.
        </p>

        <Link href="/media/crm"
          className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-medium text-white transition-transform hover:scale-[1.03]"
          style={{ background: AZUL, boxShadow: `0 8px 30px ${AZUL}55` }}>
          Abrir o CRM <span aria-hidden>→</span>
        </Link>
      </section>

      {/* ── Números do dia a dia ───────────────────────────────────────── */}
      <section className="relative z-10 px-4 mt-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {NUMEROS.map(n => (
            <Link key={n.titulo} href={n.href}
              className="group rounded-2xl border border-white/[0.08] bg-[#0c2236]/80 px-5 py-4 text-left
                         hover:border-[#2e6cf6]/60 transition-colors">
              <p className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] leading-none" style={{ color: ACCENT }}>{n.valor}</p>
              <p className="mt-2 text-[13px] font-medium text-white/85">{n.titulo}</p>
              <p className="text-[11.5px] text-white/40">{n.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Hoje ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 mt-10">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="rlp-m traco text-[10px] text-[#5a8bff]">Hoje</p>
              <h2 className="mt-1 text-[20px] rlp-t">O que precisa de ti</h2>
            </div>
            <p className="text-[12px] text-white/45">{tarefas.length === 0 ? 'Está tudo em dia' : tarefas.length === 1 ? '1 coisa por tratar' : `${tarefas.length} coisas por tratar`}</p>
          </div>
          {tarefas.length === 0 ? (
            <p className="text-[14px] text-white/55">Sem leads paradas, pagamentos em atraso ou trabalhos nos próximos 7 dias.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {tarefas.slice(0, 8).map((t, i) => (
                <li key={i}>
                  <Link href={t.href} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0c2236]/60 hover:border-white/25 px-3.5 py-2.5 transition-colors">
                    <span className="rlp-m shrink-0 w-[86px] text-[9px]" style={{ color: t.cor }}>{t.etiqueta}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-white/90">{t.titulo}</span>
                      <span className="block truncate text-[11.5px] text-white/45">{t.detalhe}</span>
                    </span>
                    <span className="text-white/30 group-hover:text-[#5a8bff]">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {tarefas.length > 8 && (
            <Link href="/media/crm/leads" className="mt-3 inline-block text-[12px] text-[#5a8bff] hover:underline">Ver tudo no CRM →</Link>
          )}
        </div>
      </section>

      {/* ── Calendário: próximos 30 dias ───────────────────────────────── */}
      <section className="relative z-10 px-4 mt-10">
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-[#0c2236]/80 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="rlp-m traco text-[10px] text-[#5a8bff]">Calendário</p>
              <h2 className="mt-1 text-[20px] rlp-t">Próximos 30 dias</h2>
              <p className="text-[12px] text-white/40">{eventos30 === 0 ? 'Nada marcado' : eventos30 === 1 ? '1 evento' : `${eventos30} eventos`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {Object.values(TIPOS).map(t => (
                <span key={t.nome} className="flex items-center gap-1.5 text-[11px] text-white/55">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.cor }} />{t.nome}
                </span>
              ))}
              <Link href="/media/calendario"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#2e6cf6]/10"
                style={{ borderColor: `${ACCENT}80`, color: ACCENT }}>
                Ver mais <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Uma fila de 30 dias com deslize lateral */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-2 overflow-x-auto snap-x pb-2
                          [scrollbar-width:thin] [scrollbar-color:rgba(46,108,246,0.35)_transparent]">
            {dias30.map((d, i) => {
              const evs = porDia.get(chaveDia(d)) ?? []
              const fimDeSemana = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={i}
                  className={`snap-start shrink-0 w-[118px] rounded-xl border min-h-[112px] p-2.5 flex flex-col gap-1.5
                    ${i === 0 ? 'border-[#2e6cf6]/70 bg-[#2e6cf6]/[0.06]' : evs.length ? 'border-white/[0.14] bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.015]'}`}>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-[10px] uppercase tracking-[0.12em] ${i === 0 ? 'text-[#5a8bff]' : fimDeSemana ? 'text-white/30' : 'text-white/45'}`}>
                      {i === 0 ? 'Hoje' : d.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-[10px] text-white/35">{d.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <span className={`text-[22px] leading-none font-semibold ${i === 0 ? 'text-[#5a8bff]' : 'text-white/85'}`}>{d.getDate()}</span>
                  {evs.slice(0, 2).map((e, j) => (
                    <Link key={j} href={e.href} title={`${TIPOS[e.tipo].nome}: ${e.titulo}`}
                      className="truncate rounded px-1.5 py-0.5 text-[10.5px] leading-tight"
                      style={{ background: `${TIPOS[e.tipo].cor}22`, color: TIPOS[e.tipo].cor }}>
                      {e.titulo}
                    </Link>
                  ))}
                  {evs.length > 2 && <span className="text-[10px] text-white/40 px-1">+{evs.length - 2}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Moldura com a imagem RL PROD ───────────────────────────────── */}
      <section className="relative z-10 px-4 mt-10">
        <div className="max-w-5xl mx-auto rounded-2xl p-[1px]"
          style={{ background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT}55 60%, ${ACCENT}22 100%)`, boxShadow: `0 0 50px ${ACCENT}1f` }}>
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/9]" aria-label="RL PROD · Photography & Video">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/MEDIA%20HERO.png")' }} />
            {/* Tom verde-água por cima (tira o dourado da imagem) */}
            <div className="absolute inset-0" style={{ background: ACCENT, mixBlendMode: 'color', opacity: 0.55 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,20,31,0.35) 0%, rgba(0,20,31,0.6) 100%)' }} />
          </div>
        </div>
      </section>

      {/* ── Atalhos ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-16 pb-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-center rlp-m text-[10px] text-[#5a8bff] mb-6">Áreas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <Link key={item.id} href={item.href}
                className={`${i === items.length - 1 && items.length % 2 === 1 ? 'sm:col-span-2' : ''} group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c2236]/80
                           hover:border-[#2e6cf6]/60 transition-all duration-300 hover:-translate-y-0.5
                           hover:shadow-[0_0_30px_rgba(46,108,246,0.12)] p-5 min-h-[140px] flex flex-col justify-between`}
              >
                {item.image_url && (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                      style={{ backgroundImage: `url(${item.image_url})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c2236] to-[#0c2236]/40" />
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
                  <span className="text-white/30 group-hover:text-[#5a8bff] group-hover:translate-x-1 transition-all">→</span>
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
