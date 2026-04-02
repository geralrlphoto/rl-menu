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

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3001'

  const [
    { data: leadsHoje },
    { data: leadsPendentes },
    prazosRes,
    aprovacaoRes,
    eventosRes,
  ] = await Promise.all([
    supabase.from('crm_contacts').select('nome, tipo_evento, como_chegou')
      .eq('data_entrada', todayStr).order('created_at', { ascending: false }),

    supabase.from('crm_contacts').select('nome, tipo_evento, data_casamento')
      .eq('status', 'Por Contactar').order('created_at', { ascending: false }).limit(8),

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

    fetch(`${baseUrl}/api/eventos-notion`, { cache: 'no-store' })
      .then(r => r.json()).catch(() => ({ events: [] })),
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

  const videosAlerta = (eventosRes.events ?? [])
    .filter((e: any) => (e.video_estado ?? '').toUpperCase() !== 'ENTREGUE')
    .map((e: any) => {
      const diasRestantes = parseVideoFormula(e.data_entrega_video_formula)
      return { cliente: e.cliente || '—', referencia: e.referencia || '', diasRestantes, videoEstado: e.video_estado }
    })
    .filter((v: any) => v.diasRestantes <= 15)

  // ── Colunas do carousel ───────────────────────────────────────────────────
  const cols: DashCol[] = [
    {
      key: 'leads-hoje',
      title: ['LEADS', 'HOJE'],
      subtitle: `${leadsHoje?.length ?? 0} novo${(leadsHoje?.length ?? 0) !== 1 ? 's' : ''} contacto${(leadsHoje?.length ?? 0) !== 1 ? 's' : ''}`,
      empty: 'Nenhuma lead hoje',
      items: (leadsHoje ?? []).map(l => ({
        main: l.nome || '—',
        sub: [l.tipo_evento, l.como_chegou].filter(Boolean).join(' · '),
        tag: null,
        tagColor: '',
      })),
      href: '/crm',
    },
    {
      key: 'por-contactar',
      title: ['POR', 'CONTACTAR'],
      subtitle: `${leadsPendentes?.length ?? 0} pendente${(leadsPendentes?.length ?? 0) !== 1 ? 's' : ''}`,
      empty: 'Sem leads pendentes',
      items: (leadsPendentes ?? []).map(l => ({
        main: l.nome || '—',
        sub: l.tipo_evento ?? '',
        tag: l.data_casamento ? fmt(l.data_casamento) : null,
        tagColor: 'text-[#C9A84C]/70',
      })),
      href: '/crm',
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
      <div className="border-t border-[#C9A84C]/25 bg-[#0d0d0d]">
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
