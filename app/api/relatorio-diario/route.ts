import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DBS: Record<string, string> = {
  '2026': '1ad220116d8a804b839ddc36f1e7ecf1',
  '2027': '2a6220116d8a80b4b439fe091b2ac804',
}
const ALBUNS_DB = '306220116d8a808e9fc0d77766504e52'

const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function daysUntil(d: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000)
}

function isRecent(dateStr: string | null, days = 7): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  return (Date.now() - d.getTime()) <= days * 86400000
}

export async function GET() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr  = today.toISOString().split('T')[0]
    const in14 = new Date(today); in14.setDate(in14.getDate() + 14)
    const in14Str   = in14.toISOString().split('T')[0]
    const ago30 = new Date(today); ago30.setDate(ago30.getDate() - 30)
    const ago30Str  = ago30.toISOString().split('T')[0]

    const database = sb()

    // ── Notion: eventos próximos 14 dias (todas as bases) ──────────────────
    const eventosPromises = Object.values(EVENTOS_DBS).map(dbId =>
      fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST', headers: notionH,
        body: JSON.stringify({
          filter: { and: [
            { property: 'DATA DO EVENTO', date: { on_or_after: todayStr } },
            { property: 'DATA DO EVENTO', date: { on_or_before: in14Str } },
          ]},
          sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
          page_size: 20,
        }),
      }).then(r => r.json()).catch(() => ({ results: [] }))
    )

    // ── Notion: prazos fotos (eventos últimos 30 dias) ─────────────────────
    const fotosPromises = Object.values(EVENTOS_DBS).map(dbId =>
      fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST', headers: notionH,
        body: JSON.stringify({
          filter: { and: [
            { property: 'DATA DO EVENTO', date: { on_or_after: ago30Str } },
            { property: 'DATA DO EVENTO', date: { on_or_before: todayStr } },
            { property: 'ESTADO SEL. FOTOS', select: { does_not_equal: 'Entregue' } },
          ]},
          sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
          page_size: 50,
        }),
      }).then(r => r.json()).catch(() => ({ results: [] }))
    )

    // ── Notion: vídeos com prazo próximo ───────────────────────────────────
    const videosPromises = Object.values(EVENTOS_DBS).map(dbId =>
      fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST', headers: notionH,
        body: JSON.stringify({
          filter: { property: 'ESTADO DO VIDEO', select: { does_not_equal: 'Entregue' } },
          sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
          page_size: 100,
        }),
      }).then(r => r.json()).catch(() => ({ results: [] }))
    )

    // ── Notion: álbuns prazo próximo + para aprovação ──────────────────────
    const albunsPromise = fetch(`https://api.notion.com/v1/databases/${ALBUNS_DB}/query`, {
      method: 'POST', headers: notionH,
      body: JSON.stringify({
        filter: { and: [
          { property: 'Data prevista de entrega', date: { on_or_after: todayStr } },
          { property: 'Data prevista de entrega', date: { on_or_before: in14Str } },
        ]},
        sorts: [{ property: 'Data prevista de entrega', direction: 'ascending' }],
        page_size: 10,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] }))

    const albunsAprovPromise = fetch(`https://api.notion.com/v1/databases/${ALBUNS_DB}/query`, {
      method: 'POST', headers: notionH,
      body: JSON.stringify({
        filter: { property: 'Status', status: { equals: 'PARA APROVAÇÃO' } },
        page_size: 10,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] }))

    const [
      eventosRaw,
      fotosRaw,
      videosRaw,
      albunsRes,
      albunsAprovRes,
      { data: leads },
      { data: portais },
      { data: pagamentos },
      { data: freelancers },
    ] = await Promise.all([
      Promise.all(eventosPromises),
      Promise.all(fotosPromises),
      Promise.all(videosPromises),
      albunsPromise,
      albunsAprovPromise,
      database.from('crm_contacts')
        .select('id,nome,status,lead_prioridade,data_casamento,data_entrada,como_chegou,contato,email,tipo_evento')
        .not('status', 'in', '("Fechou","NÃO FECHOU","Sem resposta","Encerrado","Cancelado")')
        .order('data_entrada', { ascending: false }),
      database.from('portais').select('referencia,settings,noiva,noivo'),
      database.from('pagamentos_noivos')
        .select('referencia,fase_pagamento,valor_liquidado,data_pagamento,metodo_pagamento')
        .order('data_pagamento', { ascending: false })
        .limit(200),
      database.from('freelancers').select('nome,email,status').order('nome'),
    ])

    // ── Parse eventos próximos ─────────────────────────────────────────────
    const eventos = eventosRaw.flatMap((r: any) =>
      (r.results ?? []).map((p: any) => {
        const pr = p.properties ?? {}
        const dataEvento = pr['DATA DO EVENTO']?.date?.start ?? null
        return {
          id: p.id,
          referencia: pr['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? '—',
          cliente: pr['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—',
          data_evento: dataEvento,
          local: pr['LOCAL']?.rich_text?.[0]?.plain_text ?? '—',
          fotografo: pr['FOTOGRAFO']?.multi_select?.map((s: any) => s.name) ?? [],
          videografo: pr['VÍDEOGRAFO ']?.multi_select?.map((s: any) => s.name) ?? [],
          status: pr['Status']?.status?.name ?? null,
          tipo_evento: pr['TIPO DE EVENTO']?.multi_select?.map((s: any) => s.name) ?? [],
          dias: dataEvento ? daysUntil(dataEvento) : 99,
        }
      })
    ).sort((a: any, b: any) => a.dias - b.dias)

    // ── Parse prazos fotos (prazo = data_evento + 30 dias) ────────────────
    const fotosAlerta = fotosRaw.flatMap((r: any) =>
      (r.results ?? []).map((p: any) => {
        const pr = p.properties ?? {}
        const dataEvento = pr['DATA DO EVENTO']?.date?.start ?? null
        if (!dataEvento) return null
        const prazo = new Date(dataEvento + 'T00:00:00')
        prazo.setDate(prazo.getDate() + 30)
        const dias = Math.round((prazo.getTime() - today.getTime()) / 86400000)
        if (dias > 15) return null
        return {
          nome: pr['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—',
          ref: pr['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? '',
          dias,
          tipo: 'Sel. Fotos',
        }
      }).filter(Boolean)
    )

    // ── Parse vídeos em atraso/prazo ───────────────────────────────────────
    function parseVideoFormula(formula: string | null): number {
      if (!formula) return 999
      const faltam = formula.match(/Faltam (\d+) dias?/); if (faltam) return parseInt(faltam[1])
      const restantes = formula.match(/(\d+) dias? restantes/); if (restantes) return parseInt(restantes[1])
      const atraso = formula.match(/(\d+) dias? em atraso/); if (atraso) return -parseInt(atraso[1])
      return 999
    }
    const videosAlerta = videosRaw.flatMap((r: any) =>
      (r.results ?? []).map((p: any) => {
        const pr = p.properties ?? {}
        const formula = pr['DATA ENTREGA VIDEO']?.formula?.string ?? null
        const dias = parseVideoFormula(formula)
        if (dias > 15) return null
        return {
          cliente: pr['CLIENTE']?.rich_text?.[0]?.plain_text ?? '—',
          ref: pr['REFERÊNCIA DO EVENTO']?.title?.[0]?.plain_text ?? '',
          dias,
          formula,
        }
      }).filter(Boolean)
    )

    // ── Parse álbuns ───────────────────────────────────────────────────────
    const albuns = (albunsRes.results ?? []).map((p: any) => {
      const pr = p.properties ?? {}
      const data = pr['Data prevista de entrega']?.date?.start ?? null
      return {
        nome: pr['Nome']?.title?.[0]?.plain_text ?? '—',
        ref: pr['REF. EVENTO']?.rich_text?.[0]?.plain_text ?? '',
        data,
        dias: data ? daysUntil(data) : 99,
        status: pr['Status']?.status?.name ?? null,
      }
    })

    const albunsAprovacao = (albunsAprovRes.results ?? []).map((p: any) => {
      const pr = p.properties ?? {}
      return {
        nome: pr['Nome']?.title?.[0]?.plain_text ?? '—',
        ref: pr['REF. EVENTO']?.rich_text?.[0]?.plain_text ?? '',
      }
    })

    // ── Parse portais — atividade recente (7 dias) ─────────────────────────
    const PORTAL_ACTIONS = [
      { key: 'portal_enviada',         label: 'Portal enviado aos noivos',       categoria: 'noivos' },
      { key: 'selecao_enviada',         label: 'Seleção de Fotos enviada',        categoria: 'noivos' },
      { key: 'fotos_finais_enviada',    label: 'Fotos Finais enviadas',           categoria: 'noivos' },
      { key: 'prewedding_enviada',      label: 'Pré-Wedding enviado',             categoria: 'noivos' },
      { key: 'maquete_enviada',         label: 'Maquete do Álbum enviada',        categoria: 'noivos' },
      { key: 'wedding_film_enviada',    label: 'Wedding Film enviado',            categoria: 'noivos' },
      { key: 'same_day_edit_enviada',   label: 'Same Day Edit enviado',           categoria: 'noivos' },
      { key: 'teaser_enviada',          label: 'Teaser/Trailer enviado',          categoria: 'noivos' },
      { key: 'galerias_enviada',        label: 'Galerias Online enviadas',        categoria: 'noivos' },
      { key: 'notif_foto_enviada',      label: 'Notificação ao Fotógrafo',        categoria: 'equipa' },
      { key: 'notif_video_enviada',     label: 'Notificação ao Videógrafo',       categoria: 'equipa' },
    ]

    const portalAtividade: any[] = []
    for (const portal of portais ?? []) {
      const s = portal.settings ?? {}
      const nomes = [s.noiva || portal.noiva, s.noivo || portal.noivo].filter(Boolean).join(' & ') || portal.referencia
      for (const action of PORTAL_ACTIONS) {
        const dateStr = s[action.key]
        if (isRecent(dateStr, 7)) {
          portalAtividade.push({
            referencia: portal.referencia,
            nomes,
            label: action.label,
            categoria: action.categoria,
            date: dateStr,
            diasAtras: Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000),
          })
        }
      }
    }
    portalAtividade.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // ── Parse leads CRM ───────────────────────────────────────────────────
    const leadsUrgentes = (leads ?? []).filter(l => {
      const d = new Date(l.data_entrada + 'T00:00:00')
      return (Date.now() - d.getTime()) / 86400000 <= 3
    })
    const leadsMorno = (leads ?? []).filter(l => {
      const dias = (Date.now() - new Date(l.data_entrada + 'T00:00:00').getTime()) / 86400000
      return dias > 3 && dias <= 10
    })
    const leadsTotal = leads ?? []

    // ── Parse pagamentos recentes ──────────────────────────────────────────
    const pagamentosRecentes = (pagamentos ?? [])
      .filter(p => isRecent(p.data_pagamento, 7))
      .slice(0, 20)

    return NextResponse.json({
      gerado_em: new Date().toISOString(),
      resumo: {
        eventos_proximos: eventos.length,
        leads_urgentes: leadsUrgentes.length,
        leads_total_ativas: leadsTotal.length,
        portal_atividade: portalAtividade.length,
        prazos_fotos: fotosAlerta.length,
        prazos_videos: videosAlerta.length,
        albuns_prazo: albuns.length,
        albuns_aprovacao: albunsAprovacao.length,
        pagamentos_recentes: pagamentosRecentes.length,
      },
      eventos,
      leads_urgentes: leadsUrgentes,
      leads_morno: leadsMorno,
      portal_atividade: portalAtividade,
      fotos_alerta: fotosAlerta,
      videos_alerta: videosAlerta,
      albuns,
      albuns_aprovacao: albunsAprovacao,
      pagamentos_recentes: pagamentosRecentes,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
