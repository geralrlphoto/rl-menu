import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { faseFoto } from '@/lib/fotografiaFluxo'

// Departamento de Fotografia (/edicao-fotografia): numa chamada, os casamentos com
// fotografia já realizados (desde 1 de janeiro de 2026, como o /photo), a fase de cada um
// (lib/fotografiaFluxo.ts, a partir de portais.settings), o editor de fotos
// (evento_equipa.editor_fotos), a seleção dos noivos (fotos_selecao) e o histórico.
// Só lê colunas necessárias (egress baixo).

const DESDE = '2026-01-01'
const ENTREGUES_RECENTES = 90

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  if (typeof v === 'string' && v.trim()) return v.split(',').map(x => x.trim()).filter(Boolean)
  return []
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const hoje = new Date().toISOString().slice(0, 10)

  const COLS_EV = 'id, notion_id, referencia, cliente, data_evento, local, tipo_servico, valor_foto, valor_real_foto, sel_fotos_estado, fotos_edicao_estado, servico_foto'
  const [{ data: equipa }, { data: evsAno }, { data: selsRecentes }] = await Promise.all([
    sb.from('freelancers').select('id, nome, foto_url, status, contato').in('status', ['FOTOGRAFO', 'ASSISTENTE']).order('nome'),
    sb.from('eventos_2026').select(COLS_EV).gte('data_evento', DESDE).lte('data_evento', hoje).order('data_evento'),
    sb.from('fotos_selecao').select('referencia').gte('created_at', DESDE),
  ])
  // Casamentos anteriores a DESDE entram também se a seleção dos noivos chegou depois
  // (ex.: casamento de 2025 com seleção enviada em 2026): ainda há fotos para editar.
  const refsSel = [...new Set((selsRecentes ?? []).map(s => s.referencia).filter(r => /^[A-Z]{3}_/.test(r ?? '')))] as string[]
  const { data: evsAntigos } = refsSel.length
    ? await sb.from('eventos_2026').select(COLS_EV).lt('data_evento', DESDE).in('referencia', refsSel).order('data_evento')
    : { data: [] as any[] }
  const evs = [...(evsAntigos ?? []), ...(evsAno ?? [])]

  const temFotografia = (e: any) => {
    const tipos = (Array.isArray(e.tipo_servico) ? e.tipo_servico : [e.tipo_servico]).filter(Boolean).join(' ')
    return /foto/i.test(tipos) || Number(e.valor_real_foto ?? e.valor_foto) > 0
  }
  // Retirados à mão do departamento (não são da responsabilidade da RL)
  const { data: excl } = await sb.from('fotografia_excluidos').select('referencia')
  const retiradosRefs = new Set((excl ?? []).map(x => x.referencia))
  const todos = (evs ?? []).filter(e => e.referencia && temFotografia(e)
    && e.sel_fotos_estado !== 'S/SERVIÇO' && e.fotos_edicao_estado !== 'S/SERVIÇO')
  const comFoto = todos.filter(e => !retiradosRefs.has(e.referencia))
  const retirados = todos.filter(e => retiradosRefs.has(e.referencia))
    .map(e => ({ referencia: e.referencia, cliente: e.cliente, data: e.data_evento }))
  const refs = comFoto.map(e => e.referencia as string)

  const vazio = Promise.resolve({ data: [] as any[] })
  const [{ data: ports }, { data: eqs }, { data: sels }, { data: hist }, { data: contratos }] = await Promise.all([
    refs.length ? sb.from('portais').select('id, referencia, settings').in('referencia', refs) : vazio,
    refs.length ? sb.from('evento_equipa').select('referencia, editor_fotos, editor_album, fotografo').in('referencia', refs) : vazio,
    // seleções dos noivos (tabela pequena): ligam-se pela referência ou, se vier mal escrita, pela data e nomes
    refs.length ? sb.from('fotos_selecao').select('*').order('created_at', { ascending: false }) : vazio,
    refs.length ? sb.from('fotografia_historico').select('referencia, etapa, origem, criado_em').in('referencia', refs).order('criado_em') : vazio,
    // nomes e telemóveis dos noivos (contrato), para o lembrete por WhatsApp
    refs.length ? sb.from('dados_contrato_cps').select('id, referencia_evento, nome_noiva, nome_noivo, tel_noiva, tel_noivo').in('referencia_evento', refs).order('id') : vazio,
  ])
  const contratoPorRef = new Map((contratos ?? []).map(c => [c.referencia_evento, c]))   // fica o mais recente
  const portalPorRef = new Map((ports ?? []).map(p => [p.referencia, p]))

  // Tem álbum? Como o portal dos noivos: os serviços da proposta aceite no CRM
  // (portais.settings.propostaToken), senão os serviços de fotografia da ficha.
  const tokens = (ports ?? []).map(p => p.settings?.propostaToken).filter(Boolean) as string[]
  const { data: crms } = tokens.length
    ? await sb.from('crm_contacts').select('page_token, page_content').in('page_token', tokens)
    : { data: [] as any[] }
  const servicosPorToken = new Map<string, string[]>()
  for (const c of crms ?? []) {
    const pc = typeof c.page_content === 'string' ? JSON.parse(c.page_content || '{}') : (c.page_content || {})
    const aceite = pc.propostaAceite
    const prop = aceite?.nome ? aceite : (pc.propostas ?? [])[pc.propostaPage?.propostaAtiva ?? 0]
    if (!prop) continue
    const extras = (aceite?.extras ?? pc.extras_proposta ?? []).map((e: any) => String(e?.nome ?? ''))
    servicosPorToken.set(c.page_token, [...(prop.servicos_foto ?? []), ...extras].map(String))
  }
  const temAlbumDe = (e: any): boolean | null => {
    const tk = portalPorRef.get(e.referencia)?.settings?.propostaToken
    const lista = (tk && servicosPorToken.get(tk)) || (Array.isArray(e.servico_foto) && e.servico_foto.length ? e.servico_foto.map(String) : null)
    return lista ? lista.some((x: string) => /[áa]lbum/i.test(x)) : null
  }
  const eqPorRef = new Map((eqs ?? []).map(q => [q.referencia, q]))
  // Seleção de cada casamento: pela referência; senão pela data do casamento e um nome em comum
  const nomesDe = (t: unknown) => new Set(norm(String(t ?? '')).split(/[^a-z]+/).filter(w => w.length > 2 && w !== 'casamento'))
  const selecaoDe = new Map<string, any>()
  for (const e of comFoto) {
    const porRef = (sels ?? []).find((s: any) => norm(s.referencia ?? '') === norm(e.referencia))
    const mesmoDia = (sels ?? []).filter((s: any) => String(s.date ?? '').slice(0, 10) === e.data_evento)
    const casamentosNoDia = comFoto.filter(x => x.data_evento === e.data_evento).length
    const meus = nomesDe(e.cliente)
    const porData = mesmoDia.find((s: any) => casamentosNoDia === 1 || [...nomesDe(s.nome_noivos)].some(n => meus.has(n)))
    const s = porRef ?? porData
    if (s) selecaoDe.set(e.referencia, s)
  }
  const selPorRef = new Map<string, string>()
  for (const [ref, s] of selecaoDe) if (s.data_entrada) selPorRef.set(ref, String(s.data_entrada).slice(0, 10))
  const histPorRef = new Map<string, any[]>()
  for (const h of hist ?? []) histPorRef.set(h.referencia, [...(histPorRef.get(h.referencia) ?? []), { etapa: h.etapa, origem: h.origem, em: h.criado_em }])

  const porNome = new Map((equipa ?? []).map(f => [norm(f.nome ?? ''), f]))
  const limiteEntregue = new Date(Date.now() - ENTREGUES_RECENTES * 86400000).toISOString().slice(0, 10)
  const diasAte = (iso: string) => Math.round((new Date(iso + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime()) / 86400000)

  // O que cada editor está a editar: a seleção dos noivos (fotos por categoria) e o
  // estado do trabalho no portal do editor (freelancer_edicao). Só para quem está em Edição.
  const CATEGORIAS: [string, string][] = [
    ['preparacao', 'Preparação'], ['sessao_noivos', 'Sessão dos noivos'], ['fotos_noiva', 'Fotos da noiva'], ['fotos_noivo', 'Fotos do noivo'],
    ['cerimonia', 'Cerimónia'], ['convidados', 'Convidados'], ['bolo_bouquet', 'Bolo e bouquet'], ['sala_animacao', 'Sala e animação'],
    ['fotos_album', 'Álbum'],
  ]
  const emEdicao = comFoto.filter(e => {
    const s = portalPorRef.get(e.referencia)?.settings ?? {}
    return faseFoto(e.data_evento, s, selPorRef.get(e.referencia) ?? null, e.sel_fotos_estado).fase === 'edicao'
  }).map(e => e.referencia as string)
  const { data: trabalhos } = emEdicao.length
    ? await sb.from('freelancer_edicao').select('referencia, freelancer_id, status, updated_at').in('referencia', emEdicao)
    : { data: [] as any[] }
  const conta = (t: unknown) => String(t ?? '').split(/[\s,;]+/).filter(x => /\d/.test(x)).length
  const selecaoPorRef = new Map<string, { categoria: string; fotos: number }[]>()
  for (const [ref, r] of selecaoDe) {
    selecaoPorRef.set(ref, CATEGORIAS.map(([k, l]) => ({ categoria: l, fotos: conta(r[k]) })).filter(c => c.fotos > 0))
  }
  // Seleção completa (listas dos códigos das fotos), para ver, copiar e corrigir no departamento
  const selecaoCompleta = (ref: string) => {
    const r = selecaoDe.get(ref)
    if (!r) return null
    return {
      id: r.id, referencia: r.referencia ?? null, nome: r.nome_noivos ?? null, entrada: r.data_entrada ?? null,
      categorias: CATEGORIAS.map(([k, l]) => ({ campo: k, titulo: l, texto: String(r[k] ?? '') })),
      detalhes: r.detalhes ?? null,
    }
  }

  const todosProj = comFoto.map(e => {
    const p = portalPorRef.get(e.referencia)
    const s: Record<string, any> = p?.settings ?? {}
    const { fase, prazo, recebida } = faseFoto(e.data_evento, s, selPorRef.get(e.referencia) ?? null, e.sel_fotos_estado)
    const eq = eqPorRef.get(e.referencia)
    const editores = arr(eq?.editor_fotos)
    // Alerta desligado na ficha (sino) para esta fase: não conta como atraso
    const chaveAlerta = fase === 'galerias' ? 'galerias' : fase === 'selecao' ? 'selecao' : fase === 'edicao' ? 'fotos_finais' : fase
    return {
      id: e.id, fichaId: e.notion_id ?? String(e.id), referencia: e.referencia, cliente: e.cliente, data: e.data_evento, local: e.local,
      fase, prazo, diasPrazo: prazo ? diasAte(prazo) : null, alertaOff: !!s[`${chaveAlerta}_alerta_off`] || s.alertas_fotografia_ativos === false,
      recebida, editores, editorIds: editores.map(n => porNome.get(norm(n))?.id ?? null),
      fotografos: arr(eq?.fotografo),
      temAlbum: temAlbumDe(e),
      editorAlbum: arr(eq?.editor_album)[0] ?? null,
      selecaoFotos: selecaoPorRef.get(e.referencia) ?? null,
      selecao: selecaoCompleta(e.referencia),
      trabalhos: (trabalhos ?? []).filter(t => t.referencia === e.referencia).map(t => ({ freelancerId: t.freelancer_id, estado: t.status, em: t.updated_at })),
      contacto: (() => { const c = contratoPorRef.get(e.referencia); return c ? { noiva: c.nome_noiva ?? null, noivo: c.nome_noivo ?? null, tel: c.tel_noiva || c.tel_noivo || null } : null })(),
      links: { sneakpeek: s.sneakpeek_url ?? null, galerias: s.galerias_url ?? null, selecao: s.selecao_url ?? null, entregue: s.fotos_finais_url ?? null },
      enviadas: { sneakpeek: s.sneakpeek_enviada ?? null, galerias: s.galerias_enviada ?? null, selecao: s.selecao_enviada ?? null, entregue: s.fotos_finais_enviada ?? null },
      portalId: p?.id ?? null,
      historico: histPorRef.get(e.referencia) ?? [],
    }
  })
  const projetos = todosProj.filter(p => p.fase !== 'entregue' || String(p.enviadas.entregue ?? '').slice(0, 10) >= limiteEntregue)

  // Tempos reais por fase (todos os casamentos desde janeiro, com as datas registadas)
  const entre = (a?: string | null, b?: string | null) => a && b ? Math.round((new Date(String(b).slice(0, 10) + 'T12:00:00Z').getTime() - new Date(String(a).slice(0, 10) + 'T12:00:00Z').getTime()) / 86400000) : null
  const media = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null && x >= 0 && x < 400); return v.length ? { media: Math.round(v.reduce((s, x) => s + x, 0) / v.length), n: v.length } : { media: null, n: 0 } }
  const tempos = {
    galeria: { ...media(todosProj.map(p => entre(p.data, p.enviadas.galerias))), objetivo: 7 },
    selecao: { ...media(todosProj.map(p => entre(p.data, p.enviadas.selecao))), objetivo: 30 },
    escolha: { ...media(todosProj.map(p => entre(p.enviadas.selecao, p.recebida))), objetivo: null },
    edicao: { ...media(todosProj.map(p => entre(p.recebida, p.enviadas.entregue))), objetivo: 30 },
    total: { ...media(todosProj.map(p => entre(p.data, p.enviadas.entregue))), objetivo: null },
    // por editor (o nome no evento pode vir em maiúsculas: agrupa e mostra o nome da equipa)
    porEditor: [...new Set(todosProj.flatMap(p => p.editores.map(norm)))].map(k => ({
      nome: porNome.get(k)?.nome ?? todosProj.flatMap(p => p.editores).find(n => norm(n) === k) ?? k,
      ...media(todosProj.filter(p => p.editores.some(n => norm(n) === k)).map(p => entre(p.recebida, p.enviadas.entregue))),
    })).filter(x => x.n > 0).sort((a, b) => (a.media ?? 0) - (b.media ?? 0)),
  }

  return NextResponse.json({ ok: true, hoje, equipa: equipa ?? [], projetos, retirados, tempos })
}
