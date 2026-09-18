import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { DashboardCarousel, type DashCol } from '@/app/components/DashboardCarousel'
import { LogoutButton } from '@/app/components/LogoutButton'
import { EntregasDrawer, type EntregaAtraso } from '@/app/components/EntregasDrawer'

// Server-render por request — não tenta gerar estaticamente no build.
// /photo faz 8 fetches paralelos (Supabase CRM + 7 DBs Notion) e estoura
// o timeout de 60s do Vercel para SSG. force-dynamic salta esse passo.
//
// IMPORTANTE: force-dynamic desliga o cache do fetch() (revalidate é
// ignorado). Usamos unstable_cache abaixo para envolver cada fetch ao
// Notion e cada query Supabase pesada — cache runtime de 600s mantém
// o painel snappy (1ª visita lenta, restantes instantâneas).
export const dynamic = 'force-dynamic'
export const revalidate = 120 // mantido como fallback se algo respeitar

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

export default async function PhotoDashboard() {
  const { data: sections } = await supabase
    .from('menu_sections')
    .select('*')
    .order('order_index')

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const allItems = [
    ...(sections ?? [])
      .filter(s => s.name && !UUID_RE.test(s.name.trim()))
      .map(s => ({
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

  const in15Days = new Date(); in15Days.setDate(in15Days.getDate() + 15)
  const in15DaysStr = in15Days.toISOString().split('T')[0]
  const ago90 = new Date(); ago90.setDate(ago90.getDate() - 90)
  const ago90Str = ago90.toISOString().split('T')[0]
  const ago10 = new Date(); ago10.setDate(ago10.getDate() - 10)
  const ago10Str = ago10.toISOString().split('T')[0]

  // ── Wrappers cached (10 min runtime) ────────────────────────────────────
  // Cada query corre uma vez por chave (recalcula só quando a data de hoje
  // muda OU passam 10 min). Resultado: 1ª visita lenta, restantes instant.
  const fetchNotion = (cacheKey: string, body: any, blocks = false) =>
    unstable_cache(
      async () => {
        const url = blocks
          ? `https://api.notion.com/v1/blocks/${PORTAL_PAGE_ID}/children?page_size=100`
          : `https://api.notion.com/v1/databases/${body._db}/query`
        const res = await fetch(url, {
          method: blocks ? 'GET' : 'POST',
          headers: notionH,
          ...(blocks ? {} : { body: JSON.stringify(body) }),
        }).then(r => r.json()).catch(() => ({ results: [] }))
        return res
      },
      [cacheKey],
      { revalidate: 1800, tags: ['photo-dashboard'] }
    )()

  const getLeadsAtivas = unstable_cache(
    async () => {
      const { data } = await supabase.from('crm_contacts')
        .select('nome, tipo_evento, como_chegou, data_entrada, status')
        .gte('data_entrada', ago10Str)
        .not('status', 'in', '("Fechou","NÃO FECHOU","Sem resposta","Encerrado","Cancelado")')
        .order('data_entrada', { ascending: false })
      return data ?? []
    },
    [`photo-leads-${ago10Str}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )

  const getRefPortais = unstable_cache(
    async () => {
      const { data } = await supabase.from('portais').select('referencia, settings, noiva, noivo')
      return data ?? []
    },
    ['photo-portais'],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )

  const getAlbunsAprovadosSb = unstable_cache(
    async () => {
      const { data } = await supabase
        .from('albuns_casamento')
        .select('id, nome, ref_evento, data_aprovacao, data_prevista_entrega')
        .eq('status', 'APROVADO')
        .order('data_prevista_entrega', { ascending: true, nullsFirst: false })
        .limit(20)
      return data ?? []
    },
    ['photo-albuns-aprovados'],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )

  const [
    leadsAtivas,
    prazosRes,
    aprovacaoRes,
    videosRes,
    fotosRes,
    portalRes,
    refPortais,
    albunsAprovadosSb,
  ] = await Promise.all([
    getLeadsAtivas(),
    fetchNotion(`photo-prazos-${todayStr}`, {
      _db: ALBUNS_DB,
      filter: { and: [
        { property: 'Data prevista de entrega', date: { on_or_after: todayStr } },
        { property: 'Data prevista de entrega', date: { on_or_before: in14DaysStr } },
      ]},
      sorts: [{ property: 'Data prevista de entrega', direction: 'ascending' }],
      page_size: 8,
    }),
    fetchNotion('photo-aprovacao', {
      _db: ALBUNS_DB,
      filter: { property: 'Status', status: { equals: 'PARA APROVAÇÃO' } },
      page_size: 8,
    }),
    fetchNotion('photo-videos', {
      _db: EVENTOS_DB,
      filter: { property: 'ESTADO DO VIDEO', select: { does_not_equal: 'ENTREGUE' } },
      sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
      page_size: 100,
    }),
    fetchNotion(`photo-fotos-${todayStr}`, {
      _db: EVENTOS_DB,
      filter: { or: [
        { and: [
          { property: 'DATA DO EVENTO', date: { on_or_after: ago90Str } },
          { property: 'DATA DO EVENTO', date: { on_or_before: todayStr } },
          { property: 'ESTADO SEL. FOTOS', select: { does_not_equal: 'Entregue' } },
        ]},
        { and: [
          { property: 'DATA ENTREGA FOTOS', date: { on_or_after: todayStr } },
          { property: 'DATA ENTREGA FOTOS', date: { on_or_before: in15DaysStr } },
          { property: 'FOTOS P/ EDIÇÃO', select: { does_not_equal: 'Entregue' } },
        ]},
      ]},
      sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
      page_size: 50,
    }),
    fetchNotion('photo-portal-blocks', null, true),
    getRefPortais(),
    getAlbunsAprovadosSb(),
  ])

  // ── Refs com alertas de fotografia DESATIVADOS pelo admin ───────────────
  //   Para eventos onde a RL não é responsável pela parte fotográfica, o
  //   admin desliga o sino no card do casamento (/freelancers/[id]).
  //   Esses eventos NÃO aparecem nos PRAZOS FOTOS aqui.
  //   Estado guardado em portais.settings.alertas_fotografia_ativos.
  const getAlertasOff = unstable_cache(
    async () => {
      const { data } = await supabase.from('portais').select('referencia, settings')
      const out: string[] = []
      for (const r of (data ?? []) as Array<{ referencia: string | null; settings: any }>) {
        if (r.referencia && r.settings?.alertas_fotografia_ativos === false) out.push(r.referencia)
      }
      return out
    },
    ['photo-alertas-off'],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const alertasOffRefs = new Set(await getAlertasOff())

  // ── Parsear Notion ────────────────────────────────────────────────────────
  const prazosAlbuns = (prazosRes.results ?? []).map((p: any) => {
    const props = p.properties ?? {}
    const nome = props['Nome']?.title?.[0]?.plain_text ?? '—'
    const data = props['Data prevista de entrega']?.date?.start ?? null
    const dias = data ? daysUntil(data) : 99
    return { nome, data, dias }
  })

  // Antes: lia 'PARA APROVAÇÃO' do Notion (notif para o admin actuar).
  // Agora: lê APROVADO do Supabase. Ficam aqui até o admin clicar 'Entregue'.
  //         Inclui a data limite de entrega (30 dias após aprovação) para
  //         o admin saber até quando tem de produzir o álbum.
  const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  function fmtPrazoEntrega(iso: string | null): { label: string; daysLeft: number | null } {
    if (!iso) return { label: '', daysLeft: null }
    try {
      const d = new Date(iso + 'T12:00:00')
      const day = String(d.getDate()).padStart(2, '0')
      const today = new Date(); today.setHours(0,0,0,0)
      const dl = Math.round((d.getTime() - today.getTime()) / 86400000)
      const sufixo = dl < 0 ? ` · ${Math.abs(dl)}d atraso` : dl === 0 ? ' · Hoje' : dl <= 7 ? ` · ${dl}d` : ''
      return { label: `Entrega até ${day} ${MESES_SHORT[d.getMonth()]} ${d.getFullYear()}${sufixo}`, daysLeft: dl }
    } catch { return { label: '', daysLeft: null } }
  }
  const albumsAprovacao = (albunsAprovadosSb ?? []).map((a: any) => {
    const prazo = fmtPrazoEntrega(a.data_prevista_entrega)
    return {
      id: a.id as string,
      nome: a.nome ?? '—',
      ref:  a.ref_evento ?? '',
      prazoLabel: prazo.label,
      daysLeft: prazo.daysLeft,
    }
  })

  function parseVideoFormula(formula: string | null): number {
    if (!formula) return 999
    const faltam = formula.match(/Faltam (\d+) dias?/)
    if (faltam) return parseInt(faltam[1])
    const restantes = formula.match(/(\d+) dias? restantes/)
    if (restantes) return parseInt(restantes[1])
    const atraso = formula.match(/(\d+) dias? em atraso/)
    if (atraso) return -parseInt(atraso[1])
    return 999
  }

  const fotosAlerta = (fotosRes.results ?? []).map((p: any) => {
    const props = p.properties ?? {}
    const nome = props['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—'
    const ref  = props['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? ''
    const eventoId = p.id ?? null
    const dataEvento   = props['DATA DO EVENTO']?.date?.start ?? null
    const dataEntrega  = props['DATA ENTREGA FOTOS']?.date?.start ?? null
    const selEstado    = props['ESTADO SEL. FOTOS']?.select?.name ?? null
    const fotosEstado  = props['FOTOS P/ EDIÇÃO']?.select?.name ?? null

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
    return { nome, ref, diasRestantes, label, tipo, eventoId }
  }).filter(f => f.diasRestantes <= 15 && !alertasOffRefs.has(f.ref))
   // Ordena: atrasados (mais antigos primeiro) → críticos próximos → resto
   .sort((a, b) => a.diasRestantes - b.diasRestantes)

  // Breakdown de estados críticos para mostrar no subtítulo
  const fotosAtrasados = fotosAlerta.filter(f => f.diasRestantes < 0).length
  const fotosCriticos  = fotosAlerta.filter(f => f.diasRestantes >= 0 && f.diasRestantes <= 3).length
  const fotosUrgentes  = fotosAlerta.filter(f => f.diasRestantes > 3 && f.diasRestantes <= 7).length

  const videosAlerta = (videosRes.results ?? [])
    .map((p: any) => {
      const props = p.properties ?? {}
      const cliente    = props['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—'
      const referencia = props['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? ''
      const formula    = props['DATA ENTREGA VIDEO']?.formula?.string ?? null
      const diasRestantes = parseVideoFormula(formula)
      return { cliente, referencia, diasRestantes }
    })
    .filter((v: any) => v.diasRestantes <= 30)
    .sort((a: any, b: any) => a.diasRestantes - b.diasRestantes)

  const videosAtrasados = videosAlerta.filter((v: any) => v.diasRestantes < 0).length
  const videosCriticos  = videosAlerta.filter((v: any) => v.diasRestantes >= 0 && v.diasRestantes <= 3).length
  const videosUrgentes  = videosAlerta.filter((v: any) => v.diasRestantes > 3 && v.diasRestantes <= 30).length

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
  const leadsDedup = new Map<string, any>()
  for (const l of (leadsAtivas ?? [])) {
    const key = (l.nome || '').trim()
    if (key && !leadsDedup.has(key)) leadsDedup.set(key, l)
  }
  const leadsQuenteMorno = Array.from(leadsDedup.values()).filter(l => daysSince(l.data_entrada) <= 10)
  const quente = leadsQuenteMorno.filter(l => daysSince(l.data_entrada) <= 3)
  const morno  = leadsQuenteMorno.filter(l => daysSince(l.data_entrada) > 3)

  // ── Próximos 30 dias: casamentos por dia (hora de Lisboa) ───────────────
  const lisboaISO = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(d)
  const hojeLx = lisboaISO(new Date())
  const DIAS_AGENDA = 30
  const semanaDias = Array.from({ length: DIAS_AGENDA }).map((_, i) => {
    const d = new Date(hojeLx + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().split('T')[0]
  })
  const getSemana = unstable_cache(
    async () => {
      const { data } = await supabase.from('eventos_2026')
        .select('id, referencia, cliente, data_evento, local')
        .gte('data_evento', semanaDias[0])
        .lte('data_evento', semanaDias[DIAS_AGENDA - 1])
        .order('data_evento', { ascending: true })
        .limit(80)
      return data ?? []
    },
    [`photo-agenda30-${semanaDias[0]}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const eventosSemana = await getSemana()
  const DIAS_SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MESES_LONGOS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const semana = semanaDias.map((iso, i) => {
    const d = new Date(iso + 'T12:00:00Z')
    return {
      iso,
      rotulo: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DIAS_SEM[d.getUTCDay()],
      dia: d.getUTCDate(),
      mes: MESES[d.getUTCMonth()],
      fimDeSemana: d.getUTCDay() === 0 || d.getUTCDay() === 6,
      // Mostra o mês por cima do primeiro dia e sempre que muda
      novoMes: i === 0 || d.getUTCDate() === 1,
      mesLongo: MESES_LONGOS[d.getUTCMonth()],
      eventos: eventosSemana.filter((e: any) => e.data_evento === iso),
    }
  })

  // ── Saudação e data (hora de Lisboa) ────────────────────────────────────
  const horaLx = Number(new Intl.DateTimeFormat('pt-PT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Lisbon' }).format(new Date()))
  const saudacao = horaLx < 6 ? 'Boa noite' : horaLx < 13 ? 'Bom dia' : horaLx < 20 ? 'Boa tarde' : 'Boa noite'
  const dataLonga = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Lisbon' }).format(new Date())

  // ── Galerias Online: prazo de 7 dias após o casamento ───────────────────
  //   Regra: cada casamento com fotografia tem de ter as fotos na Galeria
  //   Online até 7 dias depois da data. "Feito" = portais.settings.galerias_enviada
  //   (o botão Galerias Online das Ações Fotografia na ficha do evento).
  //   Só casamentos com fotografia: tipo de serviço com FOTO ou valor de foto > 0.
  //   Ficam de fora os eventos com alertas de fotografia desligados.
  //   Só desde 2026: antes disso as galerias não passavam por este botão.
  const GALERIA_PRAZO_DIAS = 7
  const GALERIA_DESDE = '2026-01-01'
  const getEventosRealizados = unstable_cache(
    async () => {
      const { data } = await supabase.from('eventos_2026')
        .select('id, referencia, cliente, data_evento, tipo_servico, valor_foto, valor_real_foto')
        .gte('data_evento', GALERIA_DESDE)
        .lte('data_evento', hojeLx)
        .order('data_evento', { ascending: true })
      return data ?? []
    },
    [`photo-galerias-${hojeLx}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const eventosRealizados = await getEventosRealizados()
  const galeriaFeita = new Map<string, boolean>()
  for (const p of (refPortais ?? []) as Array<{ referencia: string | null; settings: any }>) {
    if (p.referencia) galeriaFeita.set(p.referencia.toUpperCase(), !!p.settings?.galerias_enviada)
  }
  const temFotografia = (e: any) => {
    const tipos = (Array.isArray(e.tipo_servico) ? e.tipo_servico : [e.tipo_servico]).filter(Boolean).join(' ')
    return /foto/i.test(tipos) || Number(e.valor_real_foto ?? e.valor_foto) > 0
  }
  const galerias = eventosRealizados
    .filter((e: any) => e.referencia && temFotografia(e))
    .filter((e: any) => !alertasOffRefs.has(e.referencia))
    .filter((e: any) => !galeriaFeita.get(String(e.referencia).toUpperCase()))
    .map((e: any) => {
      const limite = new Date(e.data_evento + 'T12:00:00Z')
      limite.setUTCDate(limite.getUTCDate() + GALERIA_PRAZO_DIAS)
      const dias = Math.round((limite.getTime() - new Date(hojeLx + 'T12:00:00Z').getTime()) / 86400000)
      return { id: e.id, nome: (e.cliente ?? '').trim() || e.referencia, ref: e.referencia, dias }
    })
    .sort((a: any, b: any) => a.dias - b.dias)
  const galeriasAtraso = galerias.filter((g: any) => g.dias < 0)
  const galeriasAVencer = galerias.filter((g: any) => g.dias >= 0)

  // ── Lista das entregas em atraso (gaveta do +) com link para a ficha ─────
  const fotosEmAtraso = fotosAlerta.filter(f => f.diasRestantes < 0)
  const videosEmAtraso = videosAlerta.filter((v: any) => v.diasRestantes < 0)
  const refsSemId = Array.from(new Set([
    ...fotosEmAtraso.map(f => f.ref),
    ...videosEmAtraso.map((v: any) => v.referencia),
  ].filter(Boolean))).sort()
  const getIdsPorRef = unstable_cache(
    async () => {
      if (refsSemId.length === 0) return [] as Array<{ id: string; referencia: string }>
      const { data } = await supabase.from('eventos_2026').select('id, referencia').in('referencia', refsSemId)
      return (data ?? []) as Array<{ id: string; referencia: string }>
    },
    [`photo-ids-atraso-${refsSemId.join(',')}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const idPorRef = new Map<string, string>()
  for (const r of await getIdsPorRef()) if (r.referencia) idPorRef.set(r.referencia.toUpperCase(), r.id)
  const fichaDe = (ref: string, alternativa?: string | null) => {
    const id = idPorRef.get((ref ?? '').toUpperCase()) ?? alternativa ?? null
    return id ? `/eventos-2026/${id}` : null
  }
  const entregasAtraso: EntregaAtraso[] = [
    ...galeriasAtraso.map((g: any) => ({ tipo: 'Galeria Online', nome: g.nome, ref: g.ref, dias: Math.abs(g.dias), href: `/eventos-2026/${g.id}` })),
    ...fotosEmAtraso.map(f => ({
      tipo: f.tipo === 'sel' ? 'Seleção de fotos' : 'Edição de fotos',
      nome: f.nome, ref: f.ref, dias: Math.abs(f.diasRestantes), href: fichaDe(f.ref, f.eventoId),
    })),
    ...videosEmAtraso.map((v: any) => ({ tipo: 'Vídeo', nome: v.cliente, ref: v.referencia, dias: Math.abs(v.diasRestantes), href: fichaDe(v.referencia) })),
  ]

  // ── Prioridades: o que pede atenção, tirado dos alertas já carregados ────
  const atrasados = fotosAtrasados + videosAtrasados + galeriasAtraso.length
  const aVencer7 = fotosAlerta.filter(f => f.diasRestantes >= 0 && f.diasRestantes <= 7).length
    + videosAlerta.filter((v: any) => v.diasRestantes >= 0 && v.diasRestantes <= 7).length
    + galeriasAVencer.length
  const albunsPorEntregar = albumsAprovacao.length
  const prioridades = [
    { n: atrasados, rotulo: 'Entregas em atraso', sub: 'Galerias, fotos e vídeos', cor: '#f87171', href: '/casamentos', gaveta: true },
    { n: aVencer7, rotulo: 'A vencer em 7 dias', sub: 'Galerias, seleções e vídeos', cor: '#fbbf24', href: '/casamentos' },
    { n: quente.length, rotulo: 'Leads quentes', sub: 'Entraram nos últimos 3 dias', cor: '#fb923c', href: '/crm' },
    { n: albunsPorEntregar, rotulo: 'Álbuns por entregar', sub: 'Aprovados pelos noivos', cor: '#C9A84C', href: '/albuns-casamento' },
  ]
  const totalCasamentosSemana = eventosSemana.filter((e: any) => e.data_evento <= semanaDias[6]).length
  const totalCasamentos30 = eventosSemana.length

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
      key: 'galerias',
      title: ['GALERIAS', 'ONLINE'],
      subtitle: galerias.length === 0
        ? 'Todas publicadas'
        : [
            galeriasAtraso.length > 0 && `⚠ ${galeriasAtraso.length} atrasada${galeriasAtraso.length !== 1 ? 's' : ''}`,
            galeriasAVencer.length > 0 && `${galeriasAVencer.length} a publicar`,
          ].filter(Boolean).join(' · '),
      empty: 'Todas as galerias publicadas',
      items: galerias.map((g: any) => ({
        main: g.nome,
        sub: `Prazo 7 dias · ${g.ref}`,
        tag: g.dias < 0 ? `${Math.abs(g.dias)}d atraso` : g.dias === 0 ? 'Hoje' : `${g.dias}d`,
        tagColor: g.dias < 0 ? 'text-red-500' : g.dias <= 2 ? 'text-red-400' : 'text-amber-400',
      })),
      href: '/casamentos',
    },
    {
      key: 'prazos-fotos',
      title: ['PRAZOS', 'FOTOS'],
      subtitle: fotosAlerta.length === 0
        ? 'Sem prazos urgentes'
        : [
            fotosAtrasados > 0 && `⚠ ${fotosAtrasados} atrasado${fotosAtrasados !== 1 ? 's' : ''}`,
            fotosCriticos  > 0 && `${fotosCriticos} crítico${fotosCriticos !== 1 ? 's' : ''}`,
            fotosUrgentes  > 0 && `${fotosUrgentes} urgente${fotosUrgentes !== 1 ? 's' : ''}`,
          ].filter(Boolean).join(' · ') || `${fotosAlerta.length} prazo${fotosAlerta.length !== 1 ? 's' : ''}`,
      empty: 'Todos os prazos em dia',
      items: fotosAlerta.map(f => ({
        main: f.nome,
        sub: `${f.label} · ${f.ref}`,
        tag: f.diasRestantes < 0 ? `${Math.abs(f.diasRestantes)}d atraso` : f.diasRestantes === 0 ? 'Hoje' : `${f.diasRestantes}d`,
        tagColor: f.diasRestantes < 0 ? 'text-red-500' : f.diasRestantes <= 3 ? 'text-red-400' : f.diasRestantes <= 7 ? 'text-amber-400' : 'text-emerald-400/80',
        prazoEventoId: f.eventoId,
        prazoField: f.tipo === 'sel' ? 'sel_fotos_estado' as const : f.tipo === 'fotos' ? 'fotos_edicao_estado' as const : undefined,
        canClose: !!f.eventoId && (f.tipo === 'sel' || f.tipo === 'fotos'),
      })),
      href: '/casamentos',
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
          // Mostra ref + data limite. Se houver atraso, fica em vermelho via tag visual.
          sub: [a.ref, a.prazoLabel].filter(Boolean).join(' · '),
          tag: '✓ Entregue',
          tagColor: 'text-emerald-300',
          albumId: a.id,
          canDeliver: true,
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
      subtitle: videosAlerta.length === 0
        ? 'Sem prazos urgentes'
        : [
            videosAtrasados > 0 && `⚠ ${videosAtrasados} atrasado${videosAtrasados !== 1 ? 's' : ''}`,
            videosCriticos  > 0 && `${videosCriticos} crítico${videosCriticos !== 1 ? 's' : ''}`,
            videosUrgentes  > 0 && `${videosUrgentes} urgente${videosUrgentes !== 1 ? 's' : ''}`,
          ].filter(Boolean).join(' · ') || `${videosAlerta.length} prazo${videosAlerta.length !== 1 ? 's' : ''}`,
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
      href: '/casamentos',
    },
  ]

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col">

      {/* ── Hero: saudação + data ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden shrink-0 border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-cover bg-[center_35%]"
          style={{ backgroundImage: "url('/casamentos-2028.png')" }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.78) 45%, rgba(8,8,8,0.35) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #080808 0%, transparent 55%)' }} />

        <div className="absolute top-4 right-4 z-10">
          <LogoutButton />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-10 pt-16 sm:pt-20 pb-10 sm:pb-12">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_rl_gold.png" alt="" className="h-9 w-auto opacity-80" />
            <p className="text-[9px] tracking-[0.5em] text-white/40 uppercase">
              RL <span className="text-[#C9A84C]/80">Photo</span>.Video · Menu interno
            </p>
          </div>

          <h1 className="font-cormorant font-light text-white text-5xl sm:text-7xl leading-[0.95] tracking-[0.02em] mt-7">
            {saudacao}, <span className="italic text-[#C9A84C]">Rui</span>
          </h1>
          <p className="font-cormorant italic text-white/55 text-lg sm:text-xl mt-3 first-letter:uppercase">
            {dataLonga}
            {totalCasamentosSemana > 0 && (
              <> · {totalCasamentosSemana} casamento{totalCasamentosSemana !== 1 ? 's' : ''} nos próximos 7 dias</>
            )}
          </p>

          {/* Prioridades */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-9">
            {prioridades.map(p => {
              const comGaveta = 'gaveta' in p && p.gaveta && p.n > 0
              return (
                <div key={p.rotulo} className="relative">
                  <Link href={p.href}
                    className="group block h-full rounded-2xl border px-4 sm:px-5 py-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      borderColor: p.n > 0 ? `${p.cor}55` : 'rgba(255,255,255,0.08)',
                      background: p.n > 0 ? `${p.cor}10` : 'rgba(0,0,0,0.35)',
                    }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-3xl sm:text-4xl font-extralight leading-none" style={{ color: p.n > 0 ? p.cor : 'rgba(255,255,255,0.35)' }}>
                        {p.n}
                      </p>
                      {!comGaveta && (
                        <span className="text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all">→</span>
                      )}
                    </div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-white/70 mt-2.5">{p.rotulo}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{p.n === 0 ? 'Tudo em dia' : p.sub}</p>
                  </Link>
                  {/* + abre a gaveta com a lista; fica fora do Link para não haver botão dentro de link */}
                  {comGaveta && (
                    <div className="absolute top-3.5 right-3.5">
                      <EntregasDrawer itens={entregasAtraso} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Próximos 30 dias (scroll horizontal) ─────────────────────────── */}
      <section className="max-w-6xl w-full mx-auto px-5 sm:px-10 pt-10">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] tracking-[0.45em] uppercase text-white/35">Próximos 30 dias</span>
          <span className="text-[10px] text-white/25">
            {totalCasamentos30} casamento{totalCasamentos30 !== 1 ? 's' : ''}
          </span>
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="hidden sm:inline text-[9px] tracking-[0.3em] uppercase text-white/20">desliza →</span>
          <Link href="/calendario" className="text-[9px] tracking-[0.3em] uppercase text-white/25 hover:text-[#C9A84C] transition-colors">
            Calendário →
          </Link>
        </div>

        <div className="relative">
          {/* Esbatido na ponta direita: indica que há mais para a frente */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-16 z-10 bg-gradient-to-l from-[#080808] to-transparent" />

          <div className="agenda-scroll flex gap-2 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
            {semana.map((d, i) => {
              const cheio = d.eventos.length > 0
              return (
                <div key={d.iso} className="snap-start shrink-0 w-[150px] sm:w-[158px] flex flex-col">
                  {/* Mês por cima do primeiro dia e de cada dia 1 */}
                  <p className="h-5 text-[9px] tracking-[0.35em] uppercase text-[#C9A84C]/60 pl-1">
                    {d.novoMes ? d.mesLongo : ''}
                  </p>
                  <div
                    className="flex-1 rounded-xl border px-3 py-3 min-h-[118px] flex flex-col"
                    style={{
                      borderColor: i === 0 ? 'rgba(201,168,76,0.5)' : cheio ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.06)',
                      background: i === 0 ? 'rgba(201,168,76,0.07)' : cheio ? 'rgba(201,168,76,0.03)' : 'rgba(255,255,255,0.015)',
                    }}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[9px] tracking-[0.25em] uppercase"
                        style={{ color: i === 0 ? '#C9A84C' : d.fimDeSemana ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)' }}>
                        {d.rotulo}
                      </span>
                      <span className="font-cormorant text-xl leading-none" style={{ color: cheio ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {d.dia} <span className="text-[10px] text-white/30 font-sans">{d.mes}</span>
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {d.eventos.length === 0 && <span className="text-[10px] text-white/15">—</span>}
                      {d.eventos.map((e: any) => (
                        <Link key={e.id} href={`/eventos-2026/${e.id}`}
                          className="group block rounded-lg px-2 py-1.5 bg-white/[0.03] hover:bg-[#C9A84C]/10 border border-white/[0.05] hover:border-[#C9A84C]/35 transition-all">
                          <p className="text-[11px] text-white/85 group-hover:text-white leading-tight truncate uppercase tracking-wide">
                            {(e.cliente ?? '').trim() || e.referencia}
                          </p>
                          {e.local && <p className="text-[9px] text-white/35 truncate mt-0.5">{e.local}</p>}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Menu ──────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl w-full mx-auto px-5 sm:px-10 pt-12 pb-14">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] tracking-[0.45em] uppercase text-white/35">Menu</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allItems.map((item, i) => (
            <Link key={item.id} href={item.href}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] hover:border-[#C9A84C]/45 transition-all duration-300"
              style={{ height: '150px' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${item.img})` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30 group-hover:from-black/80 transition-all duration-500" />
              <div className="relative h-full flex flex-col justify-between p-5">
                <span className="font-cormorant italic text-[#C9A84C]/70 text-lg leading-none">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex items-end justify-between gap-3">
                  <span className="text-[13px] tracking-[0.28em] font-medium text-white/80 group-hover:text-white uppercase transition-colors">
                    {item.name}
                  </span>
                  <span className="w-8 h-8 rounded-full border border-[#C9A84C]/35 text-[#C9A84C] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-[#C9A84C] group-hover:text-black">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Relatório Diário Banner ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#060606] px-4 sm:px-10 py-12 sm:py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d0d0d] px-8 sm:px-12 pt-10 pb-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-2/3 h-[2px] bg-gradient-to-r from-[#C9A84C]/70 via-[#C9A84C]/20 to-transparent" />
            <p className="text-[9px] tracking-[0.55em] text-white/20 uppercase mb-6">RL PHOTO · VIDEO</p>
            <div className="mb-9">
              <p className="text-[clamp(3rem,9vw,5.5rem)] font-black tracking-tighter leading-[0.85] text-white uppercase">
                RELATÓRIO
              </p>
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

      {/* ── Redes Sociais ───────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] bg-[#060606] px-6 py-5 flex items-center justify-center gap-2 sm:gap-4">
        <span className="text-[8px] tracking-[0.5em] text-white/15 uppercase mr-4 hidden sm:block">Redes</span>
        {[
          {
            label: 'Instagram', href: 'https://www.instagram.com/rlphoto_fotografia.video/',
            color: '#E1306C',
            svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
          },
          {
            label: 'Facebook', href: 'https://www.facebook.com/people/RL_Photo/100089058572642/?locale=pt_PT',
            color: '#1877F2',
            svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
          },
          {
            label: 'YouTube', href: 'https://www.youtube.com/@rlphotovideo3062',
            color: '#FF0000',
            svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
          },
          {
            label: 'Website', href: 'https://www.rlprod.pt',
            color: '#C9A84C',
            svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
          },
        ].map(r => (
          <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300">
            <span className="transition-colors duration-200" style={{ color: `${r.color}70` }}>
              <span className="group-hover:scale-110 transition-transform duration-200 block" style={{ color: r.color }}>
                {r.svg}
              </span>
            </span>
            <span className="text-[9px] tracking-[0.3em] text-white/30 group-hover:text-white/70 uppercase transition-colors duration-200 hidden sm:block">
              {r.label}
            </span>
          </a>
        ))}
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
