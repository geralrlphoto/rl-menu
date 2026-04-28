import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Adiciona N dias úteis (seg–sex) a uma data
function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++ // ignora sábado (6) e domingo (0)
  }
  return result
}

export async function GET() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr  = today.toISOString().split('T')[0]
    const in14 = new Date(today); in14.setDate(in14.getDate() + 14)
    const in14Str   = in14.toISOString().split('T')[0]
    const ago30 = new Date(today); ago30.setDate(ago30.getDate() - 30)
    const ago30Str  = ago30.toISOString().split('T')[0]
    // 180 dias úteis ≈ 252 dias calendário; buscamos 300 para apanhar atrasados
    const ago300 = new Date(today); ago300.setDate(ago300.getDate() - 300)
    const ago300Str = ago300.toISOString().split('T')[0]

    const database = sb()

    const [
      { data: leads },
      { data: portais },
      { data: pagamentos },
      { data: eventosData },
      { data: fotosData },
      { data: videosData },
      { data: albunsData },
      { data: albunsAprovData },
      { data: novosEventosData },
    ] = await Promise.all([
      database.from('crm_contacts')
        .select('id,nome,status,lead_prioridade,data_casamento,data_entrada,como_chegou,contato,email,tipo_evento')
        .not('status', 'in', '("Fechou","NÃO FECHOU","Sem resposta","Encerrado","Cancelado")')
        .order('data_entrada', { ascending: false }),
      database.from('portais').select('referencia,settings,noiva,noivo'),
      database.from('pagamentos_noivos')
        .select('referencia,fase_pagamento,valor_liquidado,data_pagamento,metodo_pagamento')
        .order('data_pagamento', { ascending: false })
        .limit(200),
      // ── Supabase: eventos próximos 14 dias ──────────────────────────────
      database.from('evento_equipa')
        .select('evento_id,referencia,cliente,data_casamento,local,fotografo,videografo,status,tipo_evento')
        .gte('data_casamento', todayStr)
        .lte('data_casamento', in14Str)
        .order('data_casamento', { ascending: true }),
      // ── Supabase: prazos fotos (eventos últimos 30 dias) ─────────────────
      database.from('evento_equipa')
        .select('evento_id,referencia,cliente,data_casamento,estado_sel_fotos')
        .gte('data_casamento', ago30Str)
        .lte('data_casamento', todayStr)
        .or('estado_sel_fotos.neq.Entregue,estado_sel_fotos.is.null')
        .order('data_casamento', { ascending: true }),
      // ── Supabase: vídeos não entregues (últimos 300 dias) ────────────────
      database.from('evento_equipa')
        .select('evento_id,referencia,cliente,data_casamento,estado_video')
        .lte('data_casamento', todayStr)
        .gte('data_casamento', ago300Str)
        .or('estado_video.neq.Entregue,estado_video.is.null')
        .order('data_casamento', { ascending: true }),
      // ── Supabase: álbuns com prazo nos próximos 14 dias ──────────────────
      database.from('albuns_casamento')
        .select('nome,ref_evento,data_prevista_entrega,status')
        .gte('data_prevista_entrega', todayStr)
        .lte('data_prevista_entrega', in14Str)
        .neq('status', 'ENTREGUE')
        .order('data_prevista_entrega', { ascending: true }),
      // ── Supabase: álbuns para aprovação ──────────────────────────────────
      database.from('albuns_casamento')
        .select('nome,ref_evento,status')
        .eq('status', 'PARA APROVAÇÃO'),
      // ── Supabase: eventos novos ou sem referência (em eventos_2026) ──────
      database.from('eventos_2026')
        .select('id,notion_id,cliente,referencia,data_evento,local,tipo_evento')
        .or('referencia.is.null,referencia.eq.,referencia.ilike.AGUARDAR%')
        .order('data_evento', { ascending: true }),
    ])

    // ── Parse eventos próximos (Supabase evento_equipa) ───────────────────
    const toArr = (v: any): string[] => {
      if (!v) return []
      if (Array.isArray(v)) return v
      return String(v).split(', ').filter(Boolean)
    }
    const eventos = (eventosData ?? []).map((e: any) => ({
      id:          e.evento_id,
      referencia:  e.referencia  ?? '—',
      cliente:     e.cliente     ?? '—',
      data_evento: e.data_casamento,
      local:       e.local       ?? '—',
      fotografo:   toArr(e.fotografo),
      videografo:  toArr(e.videografo),
      status:      e.status      ?? null,
      tipo_evento: toArr(e.tipo_evento),
      dias:        e.data_casamento ? daysUntil(e.data_casamento) : 99,
    })).sort((a: any, b: any) => a.dias - b.dias)

    // ── Parse prazos fotos (prazo = data_casamento + 30 dias, Supabase) ──
    const fotosNotionAlerta = (fotosData ?? []).map((e: any) => {
      const dataEvento = e.data_casamento
      if (!dataEvento) return null
      if (e.estado_sel_fotos === 'S/SERVIÇO') return null
      const prazo = new Date(dataEvento + 'T00:00:00')
      prazo.setDate(prazo.getDate() + 30)
      const dias = Math.round((prazo.getTime() - today.getTime()) / 86400000)
      if (dias > 15) return null
      return {
        nome: e.cliente   ?? '—',
        ref:  e.referencia ?? '',
        dias,
        tipo: 'Sel. Fotos',
      }
    }).filter(Boolean)

    // ── Parse seleção fotos noivos (prazo = selecao_enviada + 30 dias) ────
    const selecaoNoivosAlerta = (portais ?? []).flatMap((portal: any) => {
      const s = portal.settings ?? {}
      const selecaoEnviada: string | null = s.selecao_enviada ?? null
      const estado: string | null = s.selecao_fotos_noivos_estado ?? null
      if (!selecaoEnviada) return []
      if (estado === 'Entregue' || estado === 'Concluído') return []
      const prazo = new Date(selecaoEnviada)
      prazo.setDate(prazo.getDate() + 30)
      const dias = Math.round((prazo.getTime() - today.getTime()) / 86400000)
      if (dias > 15) return []
      const nomes = [s.noiva || portal.noiva, s.noivo || portal.noivo].filter(Boolean).join(' & ') || portal.referencia
      return [{ nome: nomes, ref: portal.referencia ?? '', dias, tipo: 'Sel. Fotos Noivos' }]
    })

    // Combinar e ordenar por urgência
    const fotosAlerta = [...fotosNotionAlerta, ...selecaoNoivosAlerta]
      .sort((a: any, b: any) => a.dias - b.dias)

    // ── Parse vídeos (prazo = data_casamento + 180 dias úteis) ────────────
    const videosAlerta = (videosData ?? []).map((e: any) => {
      if (!e.data_casamento) return null
      if (e.estado_video === 'S/SERVIÇO') return null
      const prazo = addBusinessDays(new Date(e.data_casamento + 'T00:00:00'), 180)
      const dias  = Math.round((prazo.getTime() - today.getTime()) / 86400000)
      if (dias > 15) return null
      return {
        cliente: e.cliente   ?? '—',
        ref:     e.referencia ?? '',
        dias,
        formula: dias < 0
          ? `${-dias} dias em atraso`
          : dias === 0
            ? 'Entrega hoje'
            : `Faltam ${dias} dias`,
      }
    }).filter(Boolean)

    // ── Parse álbuns (Supabase) ────────────────────────────────────────────
    const albuns = (albunsData ?? []).map((a: any) => ({
      nome: a.nome ?? '—',
      ref:  a.ref_evento ?? '',
      data: a.data_prevista_entrega ?? null,
      dias: a.data_prevista_entrega ? daysUntil(a.data_prevista_entrega) : 99,
      status: a.status ?? null,
    }))

    const albunsAprovacao = (albunsAprovData ?? []).map((a: any) => ({
      nome: a.nome ?? '—',
      ref:  a.ref_evento ?? '',
    }))

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
    // Deduplicar por notion_id (sync pode ter inserido duplicados sem UNIQUE constraint)
    // Mantém o registo com id mais alto (mais recente) para ter data_entrada correcta
    const leadsMap = new Map<string, any>()
    for (const l of (leads ?? [])) {
      const key = l.notion_id || l.nome
      const existing = leadsMap.get(key)
      if (!existing || l.id > existing.id) leadsMap.set(key, l)
    }
    const leadsUniq = Array.from(leadsMap.values())

    const leadsUrgentes = leadsUniq.filter(l => {
      const d = new Date(l.data_entrada + 'T00:00:00')
      return (Date.now() - d.getTime()) / 86400000 <= 3
    })
    const leadsMorno = leadsUniq.filter(l => {
      const dias = (Date.now() - new Date(l.data_entrada + 'T00:00:00').getTime()) / 86400000
      return dias > 3 && dias <= 10
    })
    const leadsTotal = leadsUniq

    // ── Parse pagamentos recentes ──────────────────────────────────────────
    const pagamentosRecentes = (pagamentos ?? [])
      .filter(p => isRecent(p.data_pagamento, 7))
      .slice(0, 20)

    // ── Parse novos eventos / sem referência ────────────────────────────────
    const novosEventos = (novosEventosData ?? []).map((e: any) => ({
      id:          e.id,
      notion_id:   e.notion_id,
      cliente:     e.cliente || '(sem cliente)',
      referencia:  e.referencia || null,
      data_evento: e.data_evento,
      local:       e.local || '—',
      tipo_evento: toArr(e.tipo_evento),
    }))

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
        novos_eventos: novosEventos.length,
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
      novos_eventos: novosEventos,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
