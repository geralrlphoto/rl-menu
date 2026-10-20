import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Departamento de Edição de Vídeo (/edicao-video): junta numa chamada
// os editores (freelancers EDITORES), os casamentos com vídeo já realizados,
// o editor atribuído (evento_equipa.editor_video), a fase (eventos_2026.video_estado),
// o prazo (casamento + 180 dias úteis) e as entregas feitas no portal
// (portais.settings *_enviada), os pagamentos aos editores (freelancer_pagamentos,
// a mesma tabela do Painel do Editor) e o histórico (video_estado_historico).
// Só lê colunas necessárias (egress baixo).

const PRAZO_DIAS_UTEIS = 180
const JANELA_DIAS = 420          // casamentos por entregar até ~14 meses atrás
const ENTREGUES_RECENTES = 90    // entregues nos últimos 90 dias ficam visíveis

function maisDiasUteis(iso: string, dias: number): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00Z')
  let n = 0
  while (n < dias) {
    d.setUTCDate(d.getUTCDate() + 1)
    const w = d.getUTCDay()
    if (w !== 0 && w !== 6) n++
  }
  return d.toISOString().slice(0, 10)
}

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string' && v.trim()) {
    const s = v.trim()
    if (s.startsWith('[')) { try { const p = JSON.parse(s); return Array.isArray(p) ? p.map(String) : [] } catch { return [s] } }
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const hoje = new Date().toISOString().slice(0, 10)
  const desde = new Date(Date.now() - JANELA_DIAS * 86400000).toISOString().slice(0, 10)

  const [{ data: eds }, { data: evs }] = await Promise.all([
    sb.from('freelancers').select('id, nome, foto_url').eq('status', 'EDITORES').order('nome'),
    sb.from('eventos_2026')
      .select('id, notion_id, referencia, cliente, data_evento, local, tipo_servico, valor_video, video_estado')
      .gte('data_evento', desde).lte('data_evento', hoje).order('data_evento'),
  ])

  // Só casamentos/eventos com vídeo contratado
  const comVideo = (evs ?? []).filter(e =>
    e.video_estado !== 'S/SERVIÇO' &&
    (Number(e.valor_video) > 0 || arr(e.tipo_servico).some(t => /v[ií]deo/i.test(t))))

  const refs = comVideo.map(e => e.referencia).filter(Boolean) as string[]
  const ids = comVideo.flatMap(e => [e.notion_id, String(e.id)]).filter(Boolean) as string[]
  const [{ data: eqRef }, { data: eqId }, { data: ports }] = await Promise.all([
    refs.length ? sb.from('evento_equipa').select('evento_id, referencia, editor_video').in('referencia', refs) : Promise.resolve({ data: [] as any[] }),
    ids.length ? sb.from('evento_equipa').select('evento_id, referencia, editor_video').in('evento_id', ids) : Promise.resolve({ data: [] as any[] }),
    refs.length
      ? sb.from('portais').select('id, referencia, s:settings->teaser_enviada, w:settings->wedding_film_enviada, d:settings->same_day_edit_enviada, p:settings->video_prewedding_enviada, u:settings->wedding_film_url').in('referencia', refs)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const editorPorRef = new Map<string, string[]>()
  const editorPorId = new Map<string, string[]>()
  for (const r of [...(eqRef ?? []), ...(eqId ?? [])]) {
    const ed = arr(r.editor_video)
    if (!ed.length) continue
    if (r.referencia) editorPorRef.set(r.referencia, ed)
    if (r.evento_id) editorPorId.set(String(r.evento_id), ed)
  }
  // revisões enviadas pelos editores (link, estado, notas)
  const { data: revs } = refs.length
    ? await sb.from('video_revisoes').select('referencia, link, status, feedback').in('referencia', refs)
    : { data: [] as any[] }
  const revPorRef = new Map((revs ?? []).map(r => [r.referencia, r]))

  // Pagamentos dos editores (descrição começa pela referência) e histórico dos projetos
  const idsEditores = (eds ?? []).map(e => e.id)
  const [{ data: pags }, { data: hist }] = await Promise.all([
    idsEditores.length
      ? sb.from('freelancer_pagamentos').select('id, freelancer_id, descricao, valor, status, data_pago, data_prevista').in('freelancer_id', idsEditores)
      : Promise.resolve({ data: [] as any[] }),
    refs.length
      ? sb.from('video_estado_historico').select('referencia, estado, origem, criado_em').in('referencia', refs).order('criado_em')
      : Promise.resolve({ data: [] as any[] }),
  ])
  const pendente = (p: any) => !['PAGO', 'CANCELADO'].includes(String(p.status ?? '').toUpperCase())
  const porPagar: Record<string, number> = {}
  for (const p of pags ?? []) if (pendente(p)) porPagar[p.freelancer_id] = (porPagar[p.freelancer_id] ?? 0) + (Number(p.valor) || 0)
  const histPorRef = new Map<string, any[]>()
  for (const h of hist ?? []) histPorRef.set(h.referencia, [...(histPorRef.get(h.referencia) ?? []), { estado: h.estado, origem: h.origem, em: h.criado_em }])
  const portalPorRef = new Map<string, any>()
  for (const p of ports ?? []) portalPorRef.set(p.referencia, p)

  const editoresPorNome = new Map((eds ?? []).map(e => [norm(e.nome), e]))

  // Sem editor na equipa do evento: vê se algum editor já recebeu o projeto no
  // Painel do Editor (notificação 'relatorio_editor' com "referencia" no __META__),
  // como faz a gaveta de vídeos. Fica o envio mais recente.
  const semEditor = comVideo.filter(e => e.referencia && !editorPorRef.has(e.referencia) && !editorPorId.has(e.notion_id ?? '') && !editorPorId.has(String(e.id)))
    .map(e => e.referencia as string)
  if (semEditor.length) {
    const nomePorId = new Map((eds ?? []).map(e => [e.id, e.nome]))
    const { data: notifs } = await sb.from('freelancer_notificacoes')
      .select('freelancer_id, mensagem')
      .eq('tipo', 'relatorio_editor')
      .or(semEditor.map(r => `mensagem.ilike.%"referencia":"${r}"%`).join(','))
      .order('created_at', { ascending: false })
    for (const n of notifs ?? []) {
      const ref = String(n.mensagem ?? '').match(/"referencia":"([^"]+)"/)?.[1]
      const nome = n.freelancer_id ? nomePorId.get(n.freelancer_id) : undefined
      if (ref && nome && !editorPorRef.has(ref)) editorPorRef.set(ref, [nome])
    }
  }
  const limiteEntregue = new Date(Date.now() - ENTREGUES_RECENTES * 86400000).toISOString().slice(0, 10)

  const projetos = comVideo.map(e => {
    const editores = editorPorRef.get(e.referencia ?? '') ?? editorPorId.get(e.notion_id ?? '') ?? editorPorId.get(String(e.id)) ?? []
    const p = portalPorRef.get(e.referencia ?? '')
    const entregas = {
      teaser: !!p?.s, sde: !!p?.d, filme: !!p?.w, prewedding: !!p?.p,
    }
    const prazo = maisDiasUteis(e.data_evento, PRAZO_DIAS_UTEIS)
    const entregue = e.video_estado === 'Entregue' || entregas.filme
    const fase = entregue ? 'Entregue'
      : e.video_estado && ['Em Edição', 'Em Revisão', 'Finalizado'].includes(e.video_estado) ? e.video_estado
      : editores.length ? 'Aguardar' : 'Por atribuir'
    const diasPrazo = Math.round((new Date(prazo + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime()) / 86400000)
    // Sem editor nem fase e com o prazo já ultrapassado: quase sempre entregues
    // antes de haver registo no portal. Ficam à parte para não encherem o quadro.
    const faseFinal = fase === 'Por atribuir' && diasPrazo < 0 ? 'Sem registo' : fase
    return {
      id: e.id, fichaId: e.notion_id ?? String(e.id), referencia: e.referencia, cliente: e.cliente, data: e.data_evento, local: e.local,
      fase: faseFinal, editores, editorIds: editores.map(n => editoresPorNome.get(norm(n))?.id ?? null),
      prazo, diasPrazo, entregas, portalId: p?.id ?? null,
      entregueEm: typeof p?.w === 'string' ? p.w.slice(0, 10) : null,
      filmeUrl: typeof p?.u === 'string' ? p.u : null,
      revisao: revPorRef.get(e.referencia ?? '') ?? null,
      pagamentos: e.referencia
        ? (pags ?? []).filter(p => String(p.descricao ?? '').startsWith(e.referencia!))
            .map(p => ({ id: p.id, freelancerId: p.freelancer_id, valor: Number(p.valor) || 0, pago: String(p.status ?? '').toUpperCase() === 'PAGO', dataPago: p.data_pago }))
        : [],
      historico: histPorRef.get(e.referencia ?? '') ?? [],
    }
  })
  // Entregues antigos saem do quadro (ficam só os recentes)
    .filter(p => p.fase !== 'Entregue' || (p.entregueEm ? p.entregueEm >= limiteEntregue : p.diasPrazo > -ENTREGUES_RECENTES))

  return NextResponse.json({ ok: true, hoje, editores: eds ?? [], projetos, porPagar })
}
