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
  ] = await Promise.all([
    supabase.from('crm_contacts').select('nome, tipo_evento, como_chegou, data_entrada')
      .gte('data_entrada', ago10Str).order('data_entrada', { ascending: false }),

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

  // ── Temperatura das leads ─────────────────────────────────────────────────
  function daysSince(d: string) {
    const today = new Date(); today.setHours(0,0,0,0)
    return Math.round((today.getTime() - new Date(d + 'T00:00:00').getTime()) / 86400000)
  }
  const leadsQuenteMorno = (leadsAtivas ?? []).filter(l => daysSince(l.data_entrada) <= 10)
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
      subtitle: 'Próximos 14 dias',
      empty: 'Sem prazos próximos',
      items: prazosAlbuns.map(a => ({
        main: a.nome,
        sub: a.data ? (fmt(a.data) ?? '') : '',
        tag: a.dias === 0 ? 'Hoje' : a.dias === 1 ? 'Amanhã' : `${a.dias}d`,
        tagColor: a.dias <= 2 ? 'text-red-400' : a.dias <= 5 ? 'text-amber-400' : 'text-emerald-400/80',
      })),
      href: '/albuns-casamento',
    },
    {
      key: 'para-aprovacao',
      title: ['PARA', 'APROVAÇÃO'],
      subtitle: `${albumsAprovacao.length} álbum${albumsAprovacao.length !== 1 ? 's' : ''}`,
      empty: 'Nenhum álbum em aprovação',
      items: albumsAprovacao.map(a => ({
        main: a.nome,
        sub: a.ref,
        tag: null,
        tagColor: '',
      })),
      href: '/albuns-casamento',
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

      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-white/[0.06] shrink-0 relative">
        <h1 className="text-sm font-light tracking-[0.5em] text-white uppercase">
          RL <span className="text-[#C9A84C]">PHOTO</span>.VIDEO
        </h1>
        <div className="absolute right-4">
          <LogoutButton />
        </div>
      </div>

      {/* Grid principal */}
      <div className="flex-1 flex items-center justify-center px-10 py-5">
        <div className="w-full max-w-6xl flex flex-col gap-2">

          <div className="grid grid-cols-3 gap-2">
            {allItems.slice(0, 3).map((item) => (
              <Link key={item.id} href={item.href}
                className="relative overflow-hidden group rounded-lg"
                style={{ height: '160px' }}>
                <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url(${item.img})` }} />
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 right-0">
                  <div className="bg-[#C9A84C] group-hover:bg-white transition-colors duration-300 px-4 py-2.5 rounded-tl-lg">
                    <span className="text-black text-[11px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">{item.name}</span>
                  </div>
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
                <div className="absolute inset-0 bg-cover bg-center scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url(${item.img})` }} />
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 right-0">
                  <div className="bg-[#C9A84C] group-hover:bg-white transition-colors duration-300 px-4 py-2.5 rounded-tl-lg">
                    <span className="text-black text-[11px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">{item.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>

      {/* ── Dashboard carousel ──────────────────────────────────────────────── */}
      <div className="mt-8 border-t border-[#C9A84C]/25 bg-[#0d0d0d]">
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
