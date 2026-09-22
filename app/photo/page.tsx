import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { LogoutButton } from '@/app/components/LogoutButton'
import { EntregasDrawer, type EntregaAtraso } from '@/app/components/EntregasDrawer'
import { TarefasCard } from '@/app/components/TarefasCard'

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

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
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

  const NOTION_TOKEN   = process.env.NOTION_TOKEN!
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

  // ── Wrappers cached (10 min runtime) ────────────────────────────────────
  // Cada query corre uma vez por chave (recalcula só quando a data de hoje
  // muda OU passam 10 min). Resultado: 1ª visita lenta, restantes instant.
  const fetchNotion = (cacheKey: string, body: any) =>
    unstable_cache(
      async () => {
        const res = await fetch(`https://api.notion.com/v1/databases/${body._db}/query`, {
          method: 'POST',
          headers: notionH,
          body: JSON.stringify(body),
        }).then(r => r.json()).catch(() => ({ results: [] }))
        return res
      },
      [cacheKey],
      { revalidate: 1800, tags: ['photo-dashboard'] }
    )()

  // Só os campos do settings de que o painel precisa (entregas e alertas) — não o conteúdo inteiro de cada portal. Tag 'photo-portais' é
  // limpa pelo PATCH de /api/portais quando se marca uma entrega na ficha.
  const CAMPOS_PORTAL = [
    'galerias_enviada', 'selecao_enviada', 'fotos_finais_enviada', 'selecao_recebida',
    'galerias_alerta_off', 'selecao_alerta_off', 'fotos_finais_alerta_off', 'alertas_fotografia_ativos',
    'wedding_film_enviada', 'wedding_film_alerta_off',
  ]
  const getRefPortais = unstable_cache(
    async () => {
      const cols = CAMPOS_PORTAL.map(c => `s_${c}:settings->${c}`).join(', ')
      const { data } = await supabase.from('portais').select(`referencia, noiva, noivo, ${cols}`)
      return (data ?? []).map((r: any) => {
        const settings: Record<string, any> = {}
        for (const c of CAMPOS_PORTAL) if (r[`s_${c}`] !== null && r[`s_${c}`] !== undefined) settings[c] = r[`s_${c}`]
        return { referencia: r.referencia as string | null, noiva: r.noiva, noivo: r.noivo, settings }
      })
    },
    ['photo-portais-v3'],
    { revalidate: 1800, tags: ['photo-dashboard', 'photo-portais'] }
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
    fotosRes,
    refPortais,
    albunsAprovadosSb,
  ] = await Promise.all([
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
    getRefPortais(),
    getAlbunsAprovadosSb(),
  ])

  // ── Refs com alertas de fotografia DESATIVADOS pelo admin ───────────────
  //   Para eventos onde a RL não é responsável pela parte fotográfica, o
  //   admin desliga o sino no card do casamento (/freelancers/[id]).
  //   Esses eventos NÃO aparecem nos PRAZOS FOTOS aqui.
  //   Estado guardado em portais.settings.alertas_fotografia_ativos.
  // Reaproveita a leitura dos portais acima (já traz alertas_fotografia_ativos)
  const alertasOffRefs = new Set(
    (refPortais ?? [])
      .filter((r: any) => r.referencia && r.settings?.alertas_fotografia_ativos === false)
      .map((r: any) => r.referencia as string)
  )

  // ── Parsear Notion ────────────────────────────────────────────────────────
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
   // A seleção passou a ter regra própria (botão Fotos p/ Seleção, 30 dias) —
   // ver 'selecoes' mais abaixo. Daqui fica só a edição de fotos.
   .filter(f => f.tipo !== 'sel')
   // Ordena: atrasados (mais antigos primeiro) → críticos próximos → resto
   .sort((a, b) => a.diasRestantes - b.diasRestantes)

  // Breakdown de estados críticos para mostrar no subtítulo
  const fotosAtrasados = fotosAlerta.filter(f => f.diasRestantes < 0).length
  // Aviso: últimos 5 dias do prazo (a laranja)

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

  // Reuniões marcadas nas fichas de CRM, na mesma janela de 30 dias
  const getReunioes = unstable_cache(
    async () => {
      const { data } = await supabase.from('crm_contacts')
        .select('id, nome, reuniao_data, reuniao_hora, reuniao_tipo')
        .gte('reuniao_data', semanaDias[0])
        .lte('reuniao_data', semanaDias[DIAS_AGENDA - 1])
        .order('reuniao_data', { ascending: true })
        .limit(80)
      return data ?? []
    },
    [`photo-agenda30-reunioes-${semanaDias[0]}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const reunioesSemana = await getReunioes()

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
      reunioes: reunioesSemana
        .filter((r: any) => r.reuniao_data === iso)
        .sort((a: any, b: any) => String(a.reuniao_hora ?? '').localeCompare(String(b.reuniao_hora ?? ''))),
    }
  })

  // ── Saudação e data (hora de Lisboa) ────────────────────────────────────
  const horaLx = Number(new Intl.DateTimeFormat('pt-PT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Lisbon' }).format(new Date()))
  const saudacao = horaLx < 6 ? 'Boa noite' : horaLx < 13 ? 'Bom dia' : horaLx < 20 ? 'Boa tarde' : 'Boa noite'
  const dataLonga = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Lisbon' }).format(new Date())

  // ── Ações Fotografia com prazo: Galerias Online (7 dias) e Fotos p/ Seleção (30 dias)
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
        .select('id, referencia, cliente, data_evento, tipo_servico, valor_foto, valor_real_foto, valor_video, sel_fotos_estado, video_estado')
        .gte('data_evento', GALERIA_DESDE)
        .lte('data_evento', hojeLx)
        .order('data_evento', { ascending: true })
      return data ?? []
    },
    [`photo-acoes-foto-v2-${hojeLx}`],
    { revalidate: 1800, tags: ['photo-dashboard'] }
  )
  const eventosRealizados = await getEventosRealizados()
  const settingsPorRef = new Map<string, any>()
  for (const p of (refPortais ?? []) as Array<{ referencia: string | null; settings: any }>) {
    if (p.referencia) settingsPorRef.set(p.referencia.toUpperCase(), p.settings ?? {})
  }
  const galeriaFeita = new Map<string, boolean>()
  for (const [ref, st] of settingsPorRef) galeriaFeita.set(ref, !!st?.galerias_enviada)
  const temFotografia = (e: any) => {
    const tipos = (Array.isArray(e.tipo_servico) ? e.tipo_servico : [e.tipo_servico]).filter(Boolean).join(' ')
    return /foto/i.test(tipos) || Number(e.valor_real_foto ?? e.valor_foto) > 0
  }
  const galerias = eventosRealizados
    .filter((e: any) => e.referencia && temFotografia(e))
    .filter((e: any) => !alertasOffRefs.has(e.referencia))
    .filter((e: any) => !galeriaFeita.get(String(e.referencia).toUpperCase()))
    // Alerta desligado na ficha (botão "Desligar alerta" das Ações Fotografia)
    .filter((e: any) => !settingsPorRef.get(String(e.referencia).toUpperCase())?.galerias_alerta_off)
    .map((e: any) => {
      const limite = new Date(e.data_evento + 'T12:00:00Z')
      limite.setUTCDate(limite.getUTCDate() + GALERIA_PRAZO_DIAS)
      const dias = Math.round((limite.getTime() - new Date(hojeLx + 'T12:00:00Z').getTime()) / 86400000)
      return { id: e.id, nome: (e.cliente ?? '').trim() || e.referencia, ref: e.referencia, dias }
    })
    .sort((a: any, b: any) => a.dias - b.dias)
  const galeriasAtraso = galerias.filter((g: any) => g.dias < 0)

  //   Fotos p/ Seleção: 30 dias após o casamento. Conta como feita se o botão
  //   Fotos p/ Seleção foi carregado (settings.selecao_enviada) OU se o
  //   Estado das Entregas já tem a seleção como Entregue.
  const SELECAO_PRAZO_DIAS = 30
  const selecoes = eventosRealizados
    .filter((e: any) => e.referencia && temFotografia(e))
    .filter((e: any) => !alertasOffRefs.has(e.referencia))
    .filter((e: any) => {
      const st = settingsPorRef.get(String(e.referencia).toUpperCase()) ?? {}
      return !st.selecao_enviada && !st.selecao_alerta_off && String(e.sel_fotos_estado ?? '').toLowerCase() !== 'entregue'
    })
    .map((e: any) => {
      const limite = new Date(e.data_evento + 'T12:00:00Z')
      limite.setUTCDate(limite.getUTCDate() + SELECAO_PRAZO_DIAS)
      const dias = Math.round((limite.getTime() - new Date(hojeLx + 'T12:00:00Z').getTime()) / 86400000)
      return { id: e.id, nome: (e.cliente ?? '').trim() || e.referencia, ref: e.referencia, dias }
    })
    .sort((a: any, b: any) => a.dias - b.dias)
  const selecoesAtraso = selecoes.filter((g: any) => g.dias < 0)

  //   Fotos Finais: 30 dias depois de os noivos entregarem a seleção
  //   (settings.selecao_recebida, preenchido na ficha). Feito = settings.fotos_finais_enviada.
  //   Sem data de seleção recebida ainda não há prazo a contar.
  const FINAIS_PRAZO_DIAS = 30
  const finais = eventosRealizados
    .filter((e: any) => e.referencia && temFotografia(e))
    .filter((e: any) => !alertasOffRefs.has(e.referencia))
    .map((e: any) => ({ e, st: settingsPorRef.get(String(e.referencia).toUpperCase()) ?? {} }))
    .filter(({ st }: any) => typeof st.selecao_recebida === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(st.selecao_recebida))
    .filter(({ st }: any) => !st.fotos_finais_enviada && !st.fotos_finais_alerta_off)
    .map(({ e, st }: any) => {
      const limite = new Date(st.selecao_recebida + 'T12:00:00Z')
      limite.setUTCDate(limite.getUTCDate() + FINAIS_PRAZO_DIAS)
      const dias = Math.round((limite.getTime() - new Date(hojeLx + 'T12:00:00Z').getTime()) / 86400000)
      return { id: e.id, nome: (e.cliente ?? '').trim() || e.referencia, ref: e.referencia, dias }
    })
    .sort((a: any, b: any) => a.dias - b.dias)
  const finaisAtraso = finais.filter((g: any) => g.dias < 0)

  // ── Vídeos: Wedding Film até 180 dias úteis (seg–sex) após o casamento ──
  //   Aviso a laranja nos últimos 30 dias, vermelho quando passa.
  //   Feito = settings.wedding_film_enviada (botão Wedding Film das Ações Vídeo)
  //   ou video_estado Entregue / S-Serviço. Alerta desligável na ficha
  //   (settings.wedding_film_alerta_off). Só casamentos com vídeo, desde 2026:
  //   os de 2025 não têm estado registado na app.
  const VIDEO_PRAZO_UTEIS = 180
  const VIDEO_AVISO_DIAS = 30
  const somaDiasUteis = (iso: string, n: number) => {
    const d = new Date(iso + 'T12:00:00Z')
    let c = 0
    while (c < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) c++ }
    return d
  }
  const temVideo = (e: any) => {
    const tipos = (Array.isArray(e.tipo_servico) ? e.tipo_servico : [e.tipo_servico]).filter(Boolean).join(' ')
    return /v[ií]d/i.test(tipos) || Number(e.valor_video) > 0
  }
  const videosAlerta = eventosRealizados
    .filter((e: any) => e.referencia && temVideo(e))
    .filter((e: any) => {
      const st = settingsPorRef.get(String(e.referencia).toUpperCase()) ?? {}
      const estado = String(e.video_estado ?? '').trim().toLowerCase()
      return !st.wedding_film_enviada && !st.wedding_film_alerta_off
        && !['entregue', 's/serviço', 's-serviço'].includes(estado)
    })
    .map((e: any) => {
      const limite = somaDiasUteis(String(e.data_evento).slice(0, 10), VIDEO_PRAZO_UTEIS)
      const diasRestantes = Math.round((limite.getTime() - new Date(hojeLx + 'T12:00:00Z').getTime()) / 86400000)
      return { id: e.id, cliente: (e.cliente ?? '').trim() || e.referencia, referencia: e.referencia, diasRestantes }
    })
    .filter((v: any) => v.diasRestantes <= VIDEO_AVISO_DIAS)
    .sort((a: any, b: any) => a.diasRestantes - b.diasRestantes)
  const videosAtrasados = videosAlerta.filter((v: any) => v.diasRestantes < 0).length
  const videosLista: EntregaAtraso[] = videosAlerta.map((v: any) => ({
    tipo: 'Vídeo', nome: v.cliente, ref: v.referencia,
    dias: Math.abs(v.diasRestantes),
    href: `/eventos-2026/${v.id}`,
    estado: v.diasRestantes < 0 ? 'atraso' as const : 'aviso' as const,
    acao: 'wedding_film' as const,
  }))

  // ── Lista das entregas em atraso (gaveta do +) com link para a ficha ─────
  const fotosEmAtraso = fotosAlerta.filter(f => f.diasRestantes < 0)
  // Avisos: prazos a terminar nos próximos 5 dias (galerias ficam de fora)
  const dentroAviso = (d: number) => d >= 0 && d <= 5
  const fotosEmAviso = fotosAlerta.filter(f => dentroAviso(f.diasRestantes))
  const refsSemId = Array.from(new Set([
    ...fotosEmAtraso.map(f => f.ref),
    ...fotosEmAviso.map(f => f.ref),
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
    ...galeriasAtraso.map((g: any) => ({ tipo: 'Galeria Online', nome: g.nome, ref: g.ref, dias: Math.abs(g.dias), href: `/eventos-2026/${g.id}`, estado: 'atraso' as const, acao: 'galerias' as const })),
    ...selecoesAtraso.map((g: any) => ({ tipo: 'Fotos p/ Seleção', nome: g.nome, ref: g.ref, dias: Math.abs(g.dias), href: `/eventos-2026/${g.id}`, estado: 'atraso' as const, acao: 'selecao' as const })),
    ...finaisAtraso.map((g: any) => ({ tipo: 'Fotos Finais', nome: g.nome, ref: g.ref, dias: Math.abs(g.dias), href: `/eventos-2026/${g.id}`, estado: 'atraso' as const, acao: 'fotos_finais' as const })),
    ...fotosEmAtraso.map(f => ({
      tipo: f.tipo === 'sel' ? 'Seleção de fotos' : 'Edição de fotos',
      nome: f.nome, ref: f.ref, dias: Math.abs(f.diasRestantes), href: fichaDe(f.ref, f.eventoId), estado: 'atraso' as const,
    })),
  ]

  const entregasAviso: EntregaAtraso[] = [
    ...selecoes.filter((g: any) => dentroAviso(g.dias)).map((g: any) => ({ tipo: 'Fotos p/ Seleção', nome: g.nome, ref: g.ref, dias: g.dias, href: `/eventos-2026/${g.id}`, estado: 'aviso' as const, acao: 'selecao' as const })),
    ...finais.filter((g: any) => dentroAviso(g.dias)).map((g: any) => ({ tipo: 'Fotos Finais', nome: g.nome, ref: g.ref, dias: g.dias, href: `/eventos-2026/${g.id}`, estado: 'aviso' as const, acao: 'fotos_finais' as const })),
    ...fotosEmAviso.map(f => ({ tipo: 'Edição de fotos', nome: f.nome, ref: f.ref, dias: f.diasRestantes, href: fichaDe(f.ref, f.eventoId), estado: 'aviso' as const })),
  ]

  // ── Prioridades: o que pede atenção, tirado dos alertas já carregados ────
  // Os vídeos têm cartão próprio (ver videosLista) — aqui só fotografia
  const atrasados = fotosAtrasados + galeriasAtraso.length + selecoesAtraso.length + finaisAtraso.length
  // Aviso: prazos que terminam nos próximos 5 dias (a laranja) — é o tamanho
  // da lista da gaveta, para o número e a lista baterem sempre certo.
  const avisos5 = entregasAviso.length
  const albunsPorEntregar = albumsAprovacao.length
  const prioridades = [
    // Atrasos e prazos a terminar juntos num só cartão (e numa só gaveta)
    { n: atrasados, rotulo: 'Entregas em atraso', sub: 'Galerias, seleções e fotos finais', cor: '#f87171', href: '/casamentos',
      gaveta: [...entregasAtraso, ...entregasAviso], aviso: avisos5, avisoTexto: 'a terminar em 5 dias', titulo: 'Entregas' },
    { n: videosAtrasados, rotulo: 'Vídeos em atraso', sub: 'Wedding Film · 180 dias úteis', cor: '#f87171', href: '/casamentos',
      gaveta: videosLista, aviso: videosAlerta.length - videosAtrasados, avisoTexto: 'a terminar em 30 dias', titulo: 'Vídeos' },
    // Tarefas: cartão próprio (componente cliente, com gaveta e criação de tarefas)
    { n: 0, rotulo: 'Tarefas', sub: '', cor: '#a78bfa', href: '/tarefas', tarefas: true },
    { n: albunsPorEntregar, rotulo: 'Álbuns por entregar', sub: 'Aprovados pelos noivos', cor: '#C9A84C', href: '/albuns-casamento' },
  ]
  const totalCasamentosSemana = eventosSemana.filter((e: any) => e.data_evento <= semanaDias[6]).length
  const totalCasamentos30 = eventosSemana.length
  const totalReunioes30 = reunioesSemana.length



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
              if ('tarefas' in p && p.tarefas) return <TarefasCard key="tarefas" />
              const avisoN = 'aviso' in p ? (p.aviso as number) : 0
              const itensGaveta = 'gaveta' in p ? (p.gaveta as EntregaAtraso[]) : []
              const comGaveta = itensGaveta.length > 0
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
                    <p className="text-[10px] text-white/30 mt-0.5">{p.n === 0 && avisoN === 0 ? 'Tudo em dia' : p.sub}</p>
                    {avisoN > 0 && (
                      <p className="text-[11px] mt-2 font-medium" style={{ color: '#fb923c' }}>
                        ⚠ {avisoN} {'avisoTexto' in p ? p.avisoTexto : ''}
                      </p>
                    )}
                  </Link>
                  {/* + abre a gaveta com a lista; fica fora do Link para não haver botão dentro de link */}
                  {comGaveta && (
                    <div className="absolute top-3.5 right-3.5">
                      <EntregasDrawer itens={itensGaveta}
                        titulo={'titulo' in p ? p.titulo : undefined}
                        avisoTitulo={'avisoTexto' in p && p.avisoTexto ? `Termina em ${p.avisoTexto.replace('a terminar em ', '')}` : undefined} />
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
            {totalReunioes30 > 0 && ` · ${totalReunioes30} ${totalReunioes30 === 1 ? 'reunião' : 'reuniões'}`}
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
              const cheio = d.eventos.length > 0 || d.reunioes.length > 0
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
                      {d.eventos.length === 0 && d.reunioes.length === 0 && <span className="text-[10px] text-white/15">—</span>}
                      {d.eventos.map((e: any) => (
                        <Link key={e.id} href={`/eventos-2026/${e.id}`}
                          className="group block rounded-lg px-2 py-1.5 bg-white/[0.03] hover:bg-[#C9A84C]/10 border border-white/[0.05] hover:border-[#C9A84C]/35 transition-all">
                          <p className="text-[11px] text-white/85 group-hover:text-white leading-tight truncate uppercase tracking-wide">
                            {(e.cliente ?? '').trim() || e.referencia}
                          </p>
                          {e.local && <p className="text-[9px] text-white/35 truncate mt-0.5">{e.local}</p>}
                        </Link>
                      ))}
                      {/* Reuniões marcadas no CRM: tracejado, para nao se confundirem com casamentos */}
                      {d.reunioes.map((r: any) => (
                        <Link key={`r-${r.id}`} href={`/crm/${r.id}`}
                          className="group block rounded-lg px-2 py-1.5 border border-dashed transition-all hover:bg-[#C9A84C]/10"
                          style={{ borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.04)' }}>
                          <p className="text-[8px] tracking-[0.25em] uppercase" style={{ color: 'rgba(201,168,76,0.8)' }}>
                            Reunião{r.reuniao_hora ? ` ${String(r.reuniao_hora).slice(0, 5)}` : ''}
                          </p>
                          <p className="text-[11px] text-white/80 group-hover:text-white leading-tight truncate mt-0.5">
                            {(r.nome ?? '').trim() || 'Sem nome'}
                          </p>
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
