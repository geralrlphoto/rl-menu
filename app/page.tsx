import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { DashboardCarousel, type DashCol } from '@/app/components/DashboardCarousel'
import { LogoutButton } from './components/LogoutButton'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sectionImages: Record<string, string> = {
  'MENU GERAL':    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  'MENU CLIENTES': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80',
  'MENU FINANÇAS': 'https://images.unsplash.com/photo-1554941829-202a0b2403b8?w=1200&q=80',
  'APRESENTAÇÕES': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80',
  'LINKS DO SITE': 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
}
const fallbackImage = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80'

const PORTAL_PAGE_ID   = '311220116d8a80d29468e817ae7bb79f'
const SETTINGS_PREFIX  = '__PORTAL_SETTINGS__:'

function parsePortalSettings(blocks: any[]): any {
  for (const b of blocks) {
    const rt = b?.paragraph?.rich_text ?? b?.code?.rich_text ?? []
    const text: string = rt[0]?.plain_text ?? ''
    if (text.startsWith(SETTINGS_PREFIX)) {
      try { return JSON.parse(text.slice(SETTINGS_PREFIX.length)) } catch { return {} }
    }
  }
  return {}
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmt(d: string | null) {
  if (!d) return null
  const dt = new Date(d.split('T')[0] + 'T00:00:00')
  if (isNaN(dt.getTime())) return null
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]}`
}

function daysUntil(d: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(d + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

// Calcula data_evento + N dias úteis
function addWorkingDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + 'T00:00:00')
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d
}

export default async function Home() {
  const { data: sections } = await supabase
    .from('menu_sections')
    .select('*')
    .order('order_index')

  const allItems = [
    ...(sections ?? []).map(s => ({
      id: s.id,
      name: s.name,
      href: `/secao/${s.id}`,
      img: sectionImages[s.name] ?? fallbackImage,
    })),
    { id: 'crm', name: 'CRM', href: '/crm',
      img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80' },
  ]

  // ── Datas de referência ───────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const in14Days = new Date(); in14Days.setDate(in14Days.getDate() + 14)
  const in14DaysStr = in14Days.toISOString().split('T')[0]

  const NOTION_TOKEN   = process.env.NOTION_TOKEN!
  const ALBUNS_DB      = '306220116d8a808e9fc0d77766504e52'
  const EVENTOS_DB     = '1ad220116d8a804b839ddc36f1e7ecf1'
  const notionH = {
    'Authorization': `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  // Range para prazos de fotos: eventos dos últimos 90 dias
  const in15Days = new Date(); in15Days.setDate(in15Days.getDate() + 15)
  const in15DaysStr = in15Days.toISOString().split('T')[0]
  const ago90 = new Date(); ago90.setDate(ago90.getDate() - 90)
  const ago90Str = ago90.toISOString().split('T')[0]

  const ago10 = new Date(); ago10.setDate(ago10.getDate() - 10)
  const ago10Str = ago10.toISOString().split('T')[0]

  const [
    { data: leadsAtivas },
    prazosRes,
    aprovacaoRes,
    videosRes,
    fotosRes,
    portalRes,
    { data: refPortais },
  ] = await Promise.all([
    supabase.from('crm_contacts').select('nome, tipo_evento, como_chegou, data_entrada, status')
      .gte('data_entrada', ago10Str)
      .not('status', 'in', '("Fechou","NÃO FECHOU","Sem resposta","Encerrado","Cancelado")')
      .order('data_entrada', { ascending: false }),

    fetch(`https://api.notion.com/v1/databases/${ALBUNS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { and: [
          { property: 'Data prevista de entrega', date: { on_or_after: todayStr } },
          { property: 'Data prevista de entrega', date: { on_or_before: in14DaysStr } },
        ]},
        sorts: [{ property: 'Data prevista de entrega', direction: 'ascending' }],
        page_size: 8,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] })),

    fetch(`https://api.notion.com/v1/databases/${ALBUNS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { property: 'Status', status: { equals: 'PARA APROVAÇÃO' } },
        page_size: 8,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] })),

    fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { property: 'ESTADO DO VIDEO', select: { does_not_equal: 'ENTREGUE' } },
        sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
        page_size: 100,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] })),

    // Prazos fotos: eventos últimos 90 dias, ou com DATA ENTREGA FOTOS nos próximos 15 dias
    fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { or: [
          // Sel. Fotos: eventos dos últimos 15-45 dias (prazo 30 dias a acabar)
          { and: [
            { property: 'DATA DO EVENTO', date: { on_or_after: ago90Str } },
            { property: 'DATA DO EVENTO', date: { on_or_before: todayStr } },
            { property: 'ESTADO SEL. FOTOS', select: { does_not_equal: 'Entregue' } },
          ]},
          // Fotos p/ edição: DATA ENTREGA FOTOS nos próximos 15 dias
          { and: [
            { property: 'DATA ENTREGA FOTOS', date: { on_or_after: todayStr } },
            { property: 'DATA ENTREGA FOTOS', date: { on_or_before: in15DaysStr } },
            { property: 'FOTOS P/ EDIÇÃO', select: { does_not_equal: 'Entregue' } },
          ]},
        ]},
        sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
        page_size: 50,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] })),

    // Portal settings — reservas pré-wedding
    fetch(`https://api.notion.com/v1/blocks/${PORTAL_PAGE_ID}/children?page_size=100`, {
      headers: notionH, cache: 'no-store',
    }).then(r => r.json()).catch(() => ({ results: [] })),

    // Ref portais — reservas pré-wedding (Supabase)
    supabase.from('portais').select('referencia, settings, noiva, noivo'),
  ])

  // ── Parsear Notion ────────────────────────────────────────────────────────
  const prazosAlbuns = (prazosRes.results ?? []).map((p: any) => {
    const props = p.properties ?? {}
    const nome = props['Nome']?.title?.[0]?.plain_text ?? '—'
    const data = props['Data prevista de entrega']?.date?.start ?? null
    const dias = data ? daysUntil(data) : 99
    return { nome, data, dias }
  })

  const albumsAprovacao = (aprovacaoRes.results ?? []).map((p: any) => {
    const props = p.properties ?? {}
    return {
      nome: props['Nome']?.title?.[0]?.plain_text ?? '—',
      ref:  props['REF. EVENTO']?.rich_text?.[0]?.plain_text ?? '',
    }
  })

  function parseVideoFormula(formula: string | null): number {
    if (!formula) return 999
    // "Faltam 7 dias!" ou "Faltam 7 dia!"
    const faltam = formula.match(/Faltam (\d+) dias?/)
    if (faltam) return parseInt(faltam[1])
    // "281 dias restantes"
    const restantes = formula.match(/(\d+) dias? restantes/)
    if (restantes) return parseInt(restantes[1])
    // "5 dias em atraso"
    const atraso = formula.match(/(\d+) dias? em atraso/)
    if (atraso) return -parseInt(atraso[1])
    return 999
  }

  const fotosAlerta = (fotosRes.results ?? []).map((p: any) => {
    const props = p.properties ?? {}
    const nome = props['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—'
    const ref  = props['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? ''
    const dataEvento   = props['DATA DO EVENTO']?.date?.start ?? null
    const dataEntrega  = props['DATA ENTREGA FOTOS']?.date?.start ?? null
    const selEstado    = props['ESTADO SEL. FOTOS']?.select?.name ?? null
    const fotosEstado  = props['FOTOS P/ EDIÇÃO']?.select?.name ?? null

    // Prazo sel fotos = data_evento + 30 dias
    let tipo = '', diasRestantes = 999, label = ''
    if (dataEvento) {
      const prazoSel = new Date(dataEvento + 'T00:00:00')
      prazoSel.setDate(prazoSel.getDate() + 30)
      const today = new Date(); today.setHours(0,0,0,0)
      const d = Math.round((prazoSel.getTime() - today.getTime()) / 86400000)
      if (d <= 15 && selEstado !== 'Entregue') { diasRestantes = d; tipo = 'sel'; label = 'Sel. Fotos' }
    }
    if (dataEntrega && fotosEstado !== 'Entregue') {
      const d = daysUntil(dataEntrega)
      if (d <= 15 && d < diasRestantes) { diasRestantes = d; tipo = 'fotos'; label = 'Fotos Edição' }
    }
    return { nome, ref, diasRestantes, label, tipo }
  }).filter(f => f.diasRestantes <= 15)

  const videosAlerta = (videosRes.results ?? [])
    .map((p: any) => {
      const props = p.properties ?? {}
      const cliente   = props['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—'
      const referencia = props['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? ''
      const formula   = props['DATA ENTREGA VIDEO']?.formula?.string ?? null
      const diasRestantes = parseVideoFormula(formula)
      return { cliente, referencia, diasRestantes }
    })
    .filter((v: any) => v.diasRestantes <= 15)

  // ── Pré-wedding reservas ──────────────────────────────────────────────────
  const ps = parsePortalSettings(portalRes.results ?? [])
  const noiva: string  = ps.noiva  ?? ''
  const noivo: string  = ps.noivo  ?? ''
  const pwSlots: any[] = ps.preWeddingSlots ?? []
  const pwReservedId: string | null   = ps.preWeddingReservedSlotId ?? null
  const pwReservedAt: string | null   = ps.preWeddingReservedAt ?? null
  const pwReservedSlot = pwReservedId ? pwSlots.find((s: any) => s.id === pwReservedId) : null
  const coupleNames = [noiva, noivo].filter(Boolean).join(' & ') || 'Casal'

  function fmtPwDate(date: string, time: string, local: string) {
    const [, m, d] = date.split('-').map(Number)
    return `${String(d).padStart(2,'0')} ${MESES[m-1]}${time ? ` · ${time}` : ''}${local ? ` · ${local}` : ''}`
  }

  // Show if: reserved ≤5 days ago, OR pre-wedding date ≤15 days away
  const pwItems: { main: string; sub: string; tag: string | null; tagColor: string }[] = []
  if (pwReservedSlot) {
    const reservedDaysAgo  = pwReservedAt
      ? Math.round((Date.now() - new Date(pwReservedAt).getTime()) / 86400000)
      : 0
    const daysToEvent = daysUntil(pwReservedSlot.date)
    const show = reservedDaysAgo <= 5 || daysToEvent <= 15
    if (show) {
      const isUrgent = daysToEvent <= 15
      pwItems.push({
        main: coupleNames,
        sub: fmtPwDate(pwReservedSlot.date, pwReservedSlot.time, pwReservedSlot.local),
        tag: isUrgent ? `${daysToEvent}d` : '✓ Reservado',
        tagColor: isUrgent ? 'text-red-400' : 'text-emerald-400',
      })
    }
  }

  // Ref portais (Supabase) — pré-wedding reservas
  for (const portal of refPortais ?? []) {
    const rps = portal.settings ?? {}
    const rSlots: any[] = rps.preWeddingSlots ?? []
    const rReservedId: string | null = rps.preWeddingReservedSlotId ?? null
    const rReservedAt: string | null = rps.preWeddingReservedAt ?? null
    const rSlot = rReservedId ? rSlots.find((s: any) => s.id === rReservedId) : null
    if (!rSlot) continue
    const reservedDaysAgo = rReservedAt
      ? Math.round((Date.now() - new Date(rReservedAt).getTime()) / 86400000)
      : 0
    const daysToEvent = daysUntil(rSlot.date)
    const show = reservedDaysAgo <= 5 || daysToEvent <= 15
    if (!show) continue
    const isUrgent = daysToEvent <= 15
    const rNoiva: string = rps.noiva ?? portal.noiva ?? ''
    const rNoivo: string = rps.noivo ?? portal.noivo ?? ''
    const rNames = [rNoiva, rNoivo].filter(Boolean).join(' & ') || portal.referencia
    pwItems.push({
      main: rNames,
      sub: fmtPwDate(rSlot.date, rSlot.time, rSlot.local),
      tag: isUrgent ? `${daysToEvent}d` : '✓ Reservado',
      tagColor: isUrgent ? 'text-red-400' : 'text-emerald-400',
    })
  }

  // ── Temperatura das leads ─────────────────────────────────────────────────
  function daysSince(d: string) {
    const today = new Date(); today.setHours(0,0,0,0)
    return Math.round((today.getTime() - new Date(d + 'T00:00:00').getTime()) / 86400000)
  }
  // Deduplicar por nome trimado (a BD pode ter duplicados por sync Notion)
  const leadsDedup = new Map<string, any>()
  for (const l of (leadsAtivas ?? [])) {
    const key = (l.nome || '').trim()
    if (key && !leadsDedup.has(key)) leadsDedup.set(key, l)
  }
  const leadsQuenteMorno = Array.from(leadsDedup.values()).filter(l => daysSince(l.data_entrada) <= 10)
  const quente = leadsQuenteMorno.filter(l => daysSince(l.data_entrada) <= 3)
  const morno  = leadsQuenteMorno.filter(l => daysSince(l.data_entrada) > 3)

  // ── Colunas do carousel ───────────────────────────────────────────────────
  const cols: DashCol[] = [
    {
      key: 'leads',
      title: ['LEADS'],
      subtitle: `${quente.length} quente${quente.length !== 1 ? 's' : ''} · ${morno.length} morno${morno.length !== 1 ? 's' : ''}`,
      empty: 'Sem leads quentes ou mornas',
      items: leadsQuenteMorno.map(l => ({
        main: l.nome || '—',
        sub: [l.tipo_evento, l.como_chegou].filter(Boolean).join(' · '),
        tag: daysSince(l.data_entrada) <= 3 ? '🔥 Quente' : '🌡 Morno',
        tagColor: daysSince(l.data_entrada) <= 3 ? 'text-red-400' : 'text-amber-400',
      })),
      href: '/crm',
    },
    {
      key: 'prazos-fotos',
      title: ['PRAZOS', 'FOTOS'],
      subtitle: fotosAlerta.length > 0 ? `${fotosAlerta.length} prazo${fotosAlerta.length !== 1 ? 's' : ''} urgente${fotosAlerta.length !== 1 ? 's' : ''}` : 'Sem prazos urgentes',
      empty: 'Todos os prazos em dia',
      items: fotosAlerta.map(f => ({
        main: f.nome,
        sub: `${f.label} · ${f.ref}`,
        tag: f.diasRestantes < 0 ? `${Math.abs(f.diasRestantes)}d atraso` : f.diasRestantes === 0 ? 'Hoje' : `${f.diasRestantes}d`,
        tagColor: f.diasRestantes < 0 ? 'text-red-500' : f.diasRestantes <= 3 ? 'text-red-400' : f.diasRestantes <= 7 ? 'text-amber-400' : 'text-emerald-400/80',
      })),
      href: '/eventos-2026',
    },
    {
      key: 'prazos-albuns',
      title: ['PRAZOS', 'ÁLBUNS'],
      subtitle: `${prazosAlbuns.length > 0 ? `${prazosAlbuns.length} prazo${prazosAlbuns.length !== 1 ? 's' : ''}` : 'Sem prazos'}${albumsAprovacao.length > 0 ? ` · ${albumsAprovacao.length} aprovação` : ''}`,
      empty: 'Sem prazos ou aprovações',
      items: [
        ...prazosAlbuns.map(a => ({
          main: a.nome,
          sub: a.data ? (fmt(a.data) ?? '') : '',
          tag: a.dias === 0 ? 'Hoje' : a.dias === 1 ? 'Amanhã' : `${a.dias}d`,
          tagColor: a.dias <= 2 ? 'text-red-400' : a.dias <= 5 ? 'text-amber-400' : 'text-emerald-400/80',
        })),
        ...albumsAprovacao.map(a => ({
          main: a.nome,
          sub: a.ref,
          tag: '✓ Aprov.',
          tagColor: 'text-[#C9A84C]/60',
        })),
      ],
      href: '/albuns-casamento',
    },
    {
      key: 'pre-wedding',
      title: ['PRÉ', 'WEDDING'],
      subtitle: pwItems.length > 0 ? `${pwItems.length} reserva${pwItems.length !== 1 ? 's' : ''}` : 'Sem reservas',
      empty: 'Sem reservas recentes',
      items: pwItems,
      href: '/pre-wedding',
    },
    {
      key: 'videos-prazo',
      title: ['VÍDEOS', 'PRAZO'],
      subtitle: videosAlerta.length > 0
        ? `${videosAlerta.length} com prazo ≤ 15 dias`
        : 'Sem prazos urgentes',
      empty: 'Todos os vídeos em dia',
      items: videosAlerta.map(v => ({
        main: v.cliente,
        sub: v.referencia,
        tag: v.diasRestantes < 0
          ? `${Math.abs(v.diasRestantes)}d atraso`
          : v.diasRestantes === 0 ? 'Hoje'
          : v.diasRestantes === 1 ? 'Amanhã'
          : `${v.diasRestantes}d`,
        tagColor: v.diasRestantes < 0 ? 'text-red-500' : v.diasRestantes <= 3 ? 'text-red-400' : v.diasRestantes <= 7 ? 'text-amber-400' : 'text-emerald-400/80',
      })),
      href: '/eventos-2026',
    },
  ]

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col">

      {/* Header — hero com foto */}
      <div className="relative overflow-hidden shrink-0" style={{ height: '420px' }}>
        {/* Foto de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/casamentos-2028.png')" }}
        />
        {/* Overlay base */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Desvanecer topo */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#080808] to-transparent" />
        {/* Desvanecer fundo — funde com o resto da página */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
        {/* Vinheta lateral */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/50 via-transparent to-[#080808]/50" />
        {/* Logout */}
        <div className="absolute top-4 right-4 z-10">
          <LogoutButton />
        </div>
        {/* Logo centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-[8px] tracking-[0.6em] text-white/30 uppercase">Menu Interno</p>
          <h1 className="text-3xl sm:text-4xl font-extralight tracking-[0.4em] text-white/80 uppercase">
            RL <span className="text-[#C9A84C]">PHOTO</span>.VIDEO
          </h1>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#C9A84C]/50 to-transparent" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            alt="RL Photo Video"
            className="mt-1 opacity-70"
            style={{ height: '150px', width: 'auto' }}
          />
        </div>
      </div>

      {/* Grid principal — desktop */}
      <div className="hidden sm:flex flex-1 items-center justify-center px-10 py-12 pt-16">
        <div className="w-full max-w-6xl flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {allItems.slice(0, 3).map((item) => (
              <Link key={item.id} href={item.href}
                className="relative overflow-hidden group rounded-lg"
                style={{ height: '160px' }}>
                <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url(${item.img})` }} />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-[2px] bg-[#C9A84C]/60 group-hover:bg-[#C9A84C] transition-all duration-300" style={{ height: '12px' }} />
                    <span className="text-[10px] tracking-[0.3em] font-medium text-white/70 group-hover:text-white uppercase transition-colors duration-200 whitespace-nowrap">{item.name}</span>
                  </div>
                  <span className="text-[#C9A84C]/40 group-hover:text-[#C9A84C] group-hover:translate-x-1 transition-all duration-300">→</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid gap-2"
            style={{ gridTemplateColumns: allItems.slice(3).length === 3 ? '1.2fr 0.9fr 1fr' : allItems.slice(3).length === 2 ? '3fr 2fr' : '1fr' }}>
            {allItems.slice(3).map((item) => (
              <Link key={item.id} href={item.href}
                className="relative overflow-hidden group rounded-lg"
                style={{ height: '160px' }}>
                <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url(${item.img})` }} />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-[2px] bg-[#C9A84C]/60 group-hover:bg-[#C9A84C] transition-all duration-300" style={{ height: '12px' }} />
                    <span className="text-[10px] tracking-[0.3em] font-medium text-white/70 group-hover:text-white uppercase transition-colors duration-200 whitespace-nowrap">{item.name}</span>
                  </div>
                  <span className="text-[#C9A84C]/40 group-hover:text-[#C9A84C] group-hover:translate-x-1 transition-all duration-300">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Menu mobile — lista vertical com imagem */}
      <div className="sm:hidden flex-1 flex flex-col px-4 py-6 gap-3">
        {allItems.map((item) => (
          <Link key={item.id} href={item.href}
            className="relative overflow-hidden group rounded-2xl flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] active:bg-white/[0.06] transition-colors"
            style={{ height: '72px' }}>
            {/* Imagem à esquerda */}
            <div className="relative w-20 h-full shrink-0 overflow-hidden rounded-l-2xl">
              <div className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.img})` }} />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            {/* Nome */}
            <span className="text-white font-semibold tracking-[0.12em] uppercase text-sm flex-1">{item.name}</span>
            {/* Seta */}
            <span className="text-[#C9A84C]/60 text-lg pr-4">›</span>
          </Link>
        ))}
      </div>

      {/* ── Relatório Diário Banner ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#060606] px-4 sm:px-10 py-12 sm:py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d0d0d] px-8 sm:px-12 pt-10 pb-10 overflow-hidden">

            {/* Linha dourada de destaque no topo do card */}
            <div className="absolute top-0 left-0 w-2/3 h-[2px] bg-gradient-to-r from-[#C9A84C]/70 via-[#C9A84C]/20 to-transparent" />

            {/* Label */}
            <p className="text-[9px] tracking-[0.55em] text-white/20 uppercase mb-6">RL PHOTO · VIDEO</p>

            {/* Títulos */}
            <div className="mb-9">
              <p className="text-[clamp(3rem,9vw,5.5rem)] font-black tracking-tighter leading-[0.85] text-white uppercase">
                RELATÓRIO
              </p>

              {/* Filtro SVG — efeito papel machucado/amassado */}
              <svg className="absolute w-0 h-0" aria-hidden="true" style={{ overflow: 'hidden' }}>
                <defs>
                  <filter id="papel-machucado" x="-10%" y="-15%" width="120%" height="130%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.07" numOctaves="4" seed="11" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>
              <p
                className="text-[clamp(3rem,9vw,5.5rem)] font-black tracking-tighter leading-[0.85] text-[#C9A84C] uppercase"
                style={{ filter: 'url(#papel-machucado)' }}
              >
                DIÁRIO
              </p>
            </div>

            {/* Descrição + Botão */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
              <p className="text-white/30 text-sm leading-relaxed max-w-xs">
                Eventos, leads, portais e prazos —{' '}
                <span className="text-white/50 italic">tudo num só lugar</span>, em tempo real.
              </p>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <Link
                  href="/relatorio-diario"
                  className="flex items-center gap-3 px-7 py-3.5 rounded-full border border-white/60 text-white font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:border-white hover:bg-white/[0.05]"
                  style={{ boxShadow: '0 0 18px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.05)' }}
                >
                  ENTRAR
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <p className="text-[9px] tracking-[0.35em] text-white/15 uppercase">GERADO A PEDIDO</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Dashboard carousel ──────────────────────────────────────────────── */}
      <div className="border-t border-[#C9A84C]/25 bg-[#0d0d0d] sm:mt-[80px]">
        <DashboardCarousel cols={cols} />
      </div>

      {/* Footer marquee */}
      <div className="h-10 border-t border-white/[0.06] overflow-hidden flex items-center">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[10px] tracking-[0.5em] text-white/15 uppercase mx-10">
              RL <span className="text-[#C9A84C]/30">PHOTO</span>.VIDEO
              <span className="mx-10 text-[#C9A84C]/20">✦</span>
            </span>
          ))}
        </div>
        <div className="flex animate-marquee whitespace-nowrap" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[10px] tracking-[0.5em] text-white/15 uppercase mx-10">
              RL <span className="text-[#C9A84C]/30">PHOTO</span>.VIDEO
              <span className="mx-10 text-[#C9A84C]/20">✦</span>
            </span>
          ))}
        </div>
      </div>

    </main>
  )
}
