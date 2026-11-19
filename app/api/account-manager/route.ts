import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ============================================================
   /api/account-manager
   Ponto de situação de todos os projetos RL Photo.Video, calculado
   na hora (só quando se carrega em Atualizar: sem polling).
   Junta o que os departamentos já calculam (fotografia e vídeo, pelas
   próprias rotas, para as regras de prazo serem as mesmas) com:
   fotos dos convidados, WhatsApp, tarefas, leads, equipas e objetivos.
   A análise escrita (prioridades) é do Claude Code, em account_manager_notas.
   Só admin (o middleware protege /api por defeito).
   ============================================================ */

export const dynamic = 'force-dynamic'

type Nivel = 'alto' | 'medio' | 'baixo'
type Alerta = { area: string; titulo: string; detalhe: string; dias: number | null; nivel: Nivel; link: string | null }

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const hojeISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' })
const diasEntre = (de: string, ate: string) =>
  Math.round((new Date(ate.slice(0, 10) + 'T12:00:00Z').getTime() - new Date(de.slice(0, 10) + 'T12:00:00Z').getTime()) / 86400000)
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])

const FASE_FOTO: Record<string, string> = {
  sneakpeek: 'Sneak peek', galerias: 'Galeria online (convidados)', selecao: 'Fotos para seleção',
  escolha: 'Seleção dos noivos', edicao: 'Edição das fotos',
}

/** Chama uma rota da própria app com os cookies do pedido (mesmas regras de prazo que os departamentos). */
async function interna(req: NextRequest, caminho: string): Promise<any | null> {
  try {
    const r = await fetch(new URL(caminho, req.nextUrl.origin), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    return r.ok ? await r.json() : null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const sb = db()
  const hoje = hojeISO()
  const ano = Number(hoje.slice(0, 4))
  const daqui = (dias: number) => new Date(new Date(hoje + 'T12:00:00Z').getTime() + dias * 86400000).toISOString().slice(0, 10)

  const [
    foto, video,
    { data: encomendas }, { data: pedidosConv },
    { data: wa }, { data: tarefas }, { data: leads },
    { data: eventos }, { data: objetivos }, { data: nota },
  ] = await Promise.all([
    interna(req, '/api/edicao-fotografia'),
    interna(req, '/api/edicao-video'),
    sb.from('photo_orders').select('id, pedido, nome, telefone, noivos, data_casamento, formato, quantidade, total, estado, created_at, impressao_preparada_em, fotos_enviadas_em, envio_erro, metodo_pagamento, comprovativo_url, responsavel').neq('estado', 'Entregue').order('created_at'),
    sb.from('fotos_convidados').select('id, nome_convidado, nome_noivos, data_casamento, tipo_entrega, numero_fotografias, status, created_at').in('status', ['NOVO', 'EM ANALISE', 'EM ANÁLISE']).order('created_at'),
    sb.from('whatsapp_sugestoes').select('id, cliente, data_mensagem, created_at').eq('estado', 'pendente'),
    sb.from('tarefas').select('id, titulo, data_prazo, status').neq('status', 'CONCLUIDA').not('data_prazo', 'is', null).lte('data_prazo', daqui(3)).order('data_prazo'),
    sb.from('crm_contacts').select('id, nome, status, data_entrada, data_casamento').in('status', ['Por Contactar', 'Contactado', 'Negociação', 'Reunião Agendada']).order('data_entrada'),
    sb.from('eventos_2026').select('id, notion_id, referencia, cliente, data_evento, local, tipo_evento, valor_foto, valor_video, valor_liquido, servico_foto, servico_video').gte('data_evento', `${ano}-01-01`).order('data_evento'),
    sb.from('objetivos').select('id, label, target, ano').eq('ano', ano),
    sb.from('account_manager_notas').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const urgentes: Alerta[] = []

  // ── Fotografia (mesmas fases e prazos do /edicao-fotografia) ─────────────
  const projFoto: any[] = foto?.projetos ?? []
  const galeriasConvidados: { cliente: string; data: string; dias: number; link: string }[] = []
  for (const p of projFoto) {
    if (p.fase === 'entregue' || p.alertaOff || p.diasPrazo === null || p.diasPrazo === undefined) continue
    const link = `/eventos-2026/${p.fichaId ?? p.id}`
    if (p.fase === 'galerias' && p.diasPrazo < 0) galeriasConvidados.push({ cliente: p.cliente, data: p.data, dias: -p.diasPrazo, link })
    if (p.diasPrazo > 2) continue
    urgentes.push({
      area: 'Fotografia',
      titulo: `${p.cliente}: ${FASE_FOTO[p.fase] ?? p.fase}`,
      detalhe: p.diasPrazo < 0 ? `Atrasado ${-p.diasPrazo} dias (prazo ${p.prazo})` : p.diasPrazo === 0 ? 'Prazo hoje' : `Prazo em ${p.diasPrazo} dias`,
      dias: p.diasPrazo, nivel: p.diasPrazo < 0 ? 'alto' : 'medio', link,
    })
  }

  // ── Vídeo (prazo de 180 dias úteis; alerta a 30 dias) ────────────────────
  const semEditor: string[] = []
  for (const p of (video?.projetos ?? []) as any[]) {
    if (['Entregue', 'Sem registo'].includes(p.fase) || typeof p.diasPrazo !== 'number') continue
    const link = `/eventos-2026/${p.fichaId ?? p.id}`
    if (p.diasPrazo <= 30) {
      urgentes.push({
        area: 'Vídeo', titulo: `${p.cliente}: vídeo ${p.fase === 'Por atribuir' ? 'sem editor' : p.fase.toLowerCase()}`,
        detalhe: p.diasPrazo < 0 ? `Atrasado ${-p.diasPrazo} dias` : `Prazo de entrega em ${p.diasPrazo} dias`,
        dias: p.diasPrazo, nivel: p.diasPrazo < 0 ? 'alto' : p.diasPrazo <= 10 ? 'medio' : 'baixo', link,
      })
    } else if (p.fase === 'Por atribuir' && p.diaTeaser >= 7) {
      semEditor.push(p.cliente)
    }
  }
  if (semEditor.length) {
    urgentes.push({ area: 'Vídeo', titulo: `${semEditor.length} vídeo${semEditor.length > 1 ? 's' : ''} sem editor atribuído`, detalhe: semEditor.slice(0, 4).join(', ') + (semEditor.length > 4 ? '…' : ''), dias: null, nivel: 'medio', link: '/edicao-video' })
  }

  // ── Fotos dos convidados (cuidado especial) ─────────────────────────────
  const fotosConvidados = {
    encomendas: (encomendas ?? []).map(o => {
      const desde = (o.estado === 'Impressão' && o.impressao_preparada_em) ? o.impressao_preparada_em : o.created_at
      const dias = diasEntre(desde, hoje)
      const digitalPorEnviar = o.formato === 'digital' && !o.fotos_enviadas_em
      let problema = ''
      if (o.envio_erro) problema = `Erro no envio: ${o.envio_erro}`
      else if (o.estado === 'Aguardar' && !o.comprovativo_url) problema = 'À espera do pagamento'
      else if (o.estado === 'Aguardar') problema = 'Pago, por tratar'
      else if (o.estado === 'Impressão') problema = 'Em impressão / por enviar ao convidado'
      else if (digitalPorEnviar) problema = 'Fotos digitais por enviar'
      return {
        id: o.id, pedido: o.pedido, convidado: o.nome, telefone: o.telefone, noivos: o.noivos, data_casamento: o.data_casamento,
        formato: o.formato, quantidade: o.quantidade, total: o.total, estado: o.estado, dias, problema, responsavel: o.responsavel,
        nivel: (o.envio_erro || dias > 21 ? 'alto' : dias > 7 ? 'medio' : 'baixo') as Nivel,
      }
    }),
    pedidos: (pedidosConv ?? []).map(p => ({
      id: p.id, convidado: p.nome_convidado, noivos: p.nome_noivos, data_casamento: p.data_casamento,
      entrega: p.tipo_entrega, fotos: p.numero_fotografias, status: p.status, dias: diasEntre(p.created_at, hoje),
    })),
    galeriasAtrasadas: galeriasConvidados.sort((a, b) => b.dias - a.dias),
  }
  for (const e of fotosConvidados.encomendas.filter(e => e.nivel !== 'baixo')) {
    urgentes.push({ area: 'Fotos dos convidados', titulo: `${e.convidado} (${e.noivos ?? 'sem noivos'}) · ${e.pedido ?? ''}`.trim(), detalhe: `${e.problema || e.estado}, há ${e.dias} dias`, dias: -e.dias, nivel: e.nivel, link: '/fotos-convidados' })
  }
  for (const p of fotosConvidados.pedidos.filter(p => p.dias > 3)) {
    urgentes.push({ area: 'Fotos dos convidados', titulo: `Pedido de ${p.convidado ?? 'convidado'} (${p.noivos ?? ''})`, detalhe: `${p.status} há ${p.dias} dias`, dias: -p.dias, nivel: p.dias > 14 ? 'alto' : 'medio', link: '/fotos-convidados' })
  }

  // ── WhatsApp por responder ───────────────────────────────────────────────
  for (const w of wa ?? []) {
    const dias = diasEntre(w.data_mensagem ?? w.created_at, hoje)
    if (dias < 1) continue
    urgentes.push({ area: 'WhatsApp', titulo: `${w.cliente} à espera de resposta`, detalhe: `Há ${dias} dias`, dias: -dias, nivel: dias >= 7 ? 'alto' : 'medio', link: '/social-media/whatsapp' })
  }

  // ── Tarefas vencidas ou a vencer (3 dias) ────────────────────────────────
  const esquecidas = (tarefas ?? []).filter(t => diasEntre(hoje, t.data_prazo) < -30)
  if (esquecidas.length) {
    urgentes.push({ area: 'Tarefas', titulo: `${esquecidas.length} tarefas atrasadas há mais de um mês`, detalhe: 'Rever: concluir ou apagar', dias: null, nivel: 'medio', link: '/tarefas' })
  }
  for (const t of tarefas ?? []) {
    const dias = diasEntre(hoje, t.data_prazo)
    if (dias < -30) continue
    urgentes.push({ area: 'Tarefas', titulo: t.titulo, detalhe: dias < 0 ? `Atrasada ${-dias} dias` : dias === 0 ? 'Para hoje' : `Para daqui a ${dias} dias`, dias, nivel: dias < 0 ? 'alto' : 'medio', link: '/tarefas' })
  }

  // ── Leads paradas ───────────────────────────────────────────────────────
  for (const l of leads ?? []) {
    if (!l.data_entrada) continue
    const dias = diasEntre(l.data_entrada, hoje)
    const limite = l.status === 'Por Contactar' ? 1 : 7
    if (dias <= limite) continue
    urgentes.push({ area: 'CRM', titulo: `${l.nome}: ${l.status}`, detalhe: `Entrou há ${dias} dias`, dias: -dias, nivel: l.status === 'Por Contactar' ? 'alto' : 'baixo', link: `/crm/${l.id}` })
  }

  const ordemNivel: Record<Nivel, number> = { alto: 0, medio: 1, baixo: 2 }
  urgentes.sort((a, b) => ordemNivel[a.nivel] - ordemNivel[b.nivel] || (a.dias ?? 0) - (b.dias ?? 0))

  // ── Equipas dos próximos eventos ────────────────────────────────────────
  const proximos = (eventos ?? []).filter(e => e.data_evento >= hoje && !/teste/i.test(e.cliente ?? '')).slice(0, 20)
  const refs = proximos.map(e => e.referencia).filter(Boolean) as string[]
  const [{ data: eqs }, { data: conf }, { data: valores }, { data: freelancers }] = await Promise.all([
    refs.length ? sb.from('evento_equipa').select('referencia, fotografo, videografo').in('referencia', refs) : Promise.resolve({ data: [] as any[] }),
    refs.length ? sb.from('freelancer_casamentos').select('referencia, freelancer_id, data_confirmada, indisponivel, data_confirmada_videografo, indisponivel_videografo').in('referencia', refs) : Promise.resolve({ data: [] as any[] }),
    sb.from('freelancer_valores').select('freelancer_id, servico, valor_servico, kms, valor_ao_km'),
    sb.from('freelancers').select('id, nome, status'),
  ])
  const eqPorRef = new Map((eqs ?? []).map((q: any) => [q.referencia, q]))
  const flPorNome = new Map((freelancers ?? []).map((f: any) => [norm(f.nome), f]))
  const flPorId = new Map((freelancers ?? []).map((f: any) => [f.id, f]))
  const custoDe = (id: string | undefined): number | null => {
    if (!id) return null
    const v = (valores ?? []).filter((x: any) => x.freelancer_id === id)
    if (!v.length) return null
    const c = v.find((x: any) => /casamento|evento|dia/i.test(x.servico ?? '')) ?? v[0]
    return Number(c.valor_servico ?? 0) + Number(c.kms ?? 0) * Number(c.valor_ao_km ?? 0)
  }
  const equipas = proximos.map(e => {
    const sf = lista(e.servico_foto).join(' ').toUpperCase()
    const sv = lista(e.servico_video).join(' ').toUpperCase()
    const precisaFoto = Number(e.valor_foto ?? 0) > 0 || sf.length > 0 ? (/DOIS FOT|2 FOT/.test(sf) ? 2 : 1) : 0
    const precisaVideo = Number(e.valor_video ?? 0) > 0 || sv.length > 0 ? (/DOIS VIDE|2 VIDE/.test(sv) ? 2 : 1) : 0
    const eq = eqPorRef.get(e.referencia)
    const fotografos = arr(eq?.fotografo)
    const videografos = arr(eq?.videografo)
    const confs = (conf ?? []).filter((c: any) => c.referencia === e.referencia)
    const confirmados = confs.filter((c: any) => c.data_confirmada || c.data_confirmada_videografo).map((c: any) => flPorId.get(c.freelancer_id)?.nome).filter(Boolean)
    const indisponiveis = confs.filter((c: any) => c.indisponivel || c.indisponivel_videografo).map((c: any) => flPorId.get(c.freelancer_id)?.nome).filter(Boolean)
    const falta: string[] = []
    if (fotografos.length < precisaFoto) falta.push(precisaFoto - fotografos.length === 1 ? '1 fotógrafo' : `${precisaFoto - fotografos.length} fotógrafos`)
    if (videografos.length < precisaVideo) falta.push(precisaVideo - videografos.length === 1 ? '1 videógrafo' : `${precisaVideo - videografos.length} videógrafos`)
    const receita = Number(e.valor_liquido ?? 0) || (Number(e.valor_foto ?? 0) + Number(e.valor_video ?? 0))
    const custos = [...fotografos, ...videografos].map(n => custoDe(flPorNome.get(norm(n))?.id))
    const custo = custos.length && custos.every(c => c !== null) ? custos.reduce((s, c) => s + (c ?? 0), 0) : null
    const dias = diasEntre(hoje, e.data_evento)
    if (falta.length && dias <= 60) {
      urgentes.push({ area: 'Equipas', titulo: `${e.cliente}: falta ${falta.join(' e ')}`, detalhe: `Evento em ${dias} dias (${e.data_evento})`, dias, nivel: dias <= 21 ? 'alto' : 'medio', link: `/eventos-2026/${e.notion_id ?? e.id}` })
    }
    return {
      referencia: e.referencia, cliente: e.cliente, data: e.data_evento, local: e.local, dias,
      tipo: lista(typeof e.tipo_evento === 'string' ? (() => { try { return JSON.parse(e.tipo_evento) } catch { return [e.tipo_evento] } })() : e.tipo_evento).join(', '),
      precisaFoto, precisaVideo, fotografos, videografos, confirmados, indisponiveis, falta,
      receita, custo, margem: custo !== null ? receita - custo : null,
      link: `/eventos-2026/${e.notion_id ?? e.id}`,
    }
  })
  urgentes.sort((a, b) => ordemNivel[a.nivel] - ordemNivel[b.nivel] || (a.dias ?? 0) - (b.dias ?? 0))

  // ── Objetivos do ano ────────────────────────────────────────────────────
  const doAno = (eventos ?? []).filter(e => e.data_evento <= `${ano}-12-31`)
  const casamentos = doAno.filter(e => /CASAMENTO/i.test(String(e.tipo_evento ?? ''))).length
  const faturado = doAno.reduce((s, e) => s + (Number(e.valor_liquido ?? 0) || (Number(e.valor_foto ?? 0) + Number(e.valor_video ?? 0))), 0)
  const objetivosOut = (objetivos ?? []).map(o => {
    const atual = /casamento/i.test(o.id) ? casamentos : /fatura/i.test(o.id) ? faturado : null
    return { id: o.id, label: o.label, target: Number(o.target), atual, fonte: /fatura/i.test(o.id) ? 'Soma dos valores dos eventos do ano na app (os eventos sem valor preenchido contam 0)' : 'Eventos do ano marcados como casamento' }
  })

  return NextResponse.json({
    ok: true, hoje, atualizado: new Date().toISOString(),
    resumo: {
      alto: urgentes.filter(u => u.nivel === 'alto').length,
      medio: urgentes.filter(u => u.nivel === 'medio').length,
      fotosConvidados: fotosConvidados.encomendas.length + fotosConvidados.pedidos.length + fotosConvidados.galeriasAtrasadas.length,
      semValoresEquipa: (valores ?? []).length === 0,
      fontesEmFalta: [!foto && 'fotografia', !video && 'vídeo'].filter(Boolean),
    },
    urgentes, fotosConvidados, equipas, objetivos: objetivosOut, nota: nota ?? null,
  })
}
