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

  const [{ data: equipa }, { data: evs }] = await Promise.all([
    sb.from('freelancers').select('id, nome, foto_url, status').in('status', ['FOTOGRAFO', 'ASSISTENTE']).order('nome'),
    sb.from('eventos_2026')
      .select('id, notion_id, referencia, cliente, data_evento, local, tipo_servico, valor_foto, valor_real_foto, sel_fotos_estado, fotos_edicao_estado')
      .gte('data_evento', DESDE).lte('data_evento', hoje).order('data_evento'),
  ])

  const temFotografia = (e: any) => {
    const tipos = (Array.isArray(e.tipo_servico) ? e.tipo_servico : [e.tipo_servico]).filter(Boolean).join(' ')
    return /foto/i.test(tipos) || Number(e.valor_real_foto ?? e.valor_foto) > 0
  }
  const comFoto = (evs ?? []).filter(e => e.referencia && temFotografia(e)
    && e.sel_fotos_estado !== 'S/SERVIÇO' && e.fotos_edicao_estado !== 'S/SERVIÇO')
  const refs = comFoto.map(e => e.referencia as string)

  const vazio = Promise.resolve({ data: [] as any[] })
  const [{ data: ports }, { data: eqs }, { data: sels }, { data: hist }, { data: contratos }] = await Promise.all([
    refs.length ? sb.from('portais').select('id, referencia, settings').in('referencia', refs) : vazio,
    refs.length ? sb.from('evento_equipa').select('referencia, editor_fotos, fotografo').in('referencia', refs) : vazio,
    refs.length ? sb.from('fotos_selecao').select('referencia, data_entrada').in('referencia', refs) : vazio,
    refs.length ? sb.from('fotografia_historico').select('referencia, etapa, origem, criado_em').in('referencia', refs).order('criado_em') : vazio,
    // nomes e telemóveis dos noivos (contrato), para o lembrete por WhatsApp
    refs.length ? sb.from('dados_contrato_cps').select('id, referencia_evento, nome_noiva, nome_noivo, tel_noiva, tel_noivo').in('referencia_evento', refs).order('id') : vazio,
  ])
  const contratoPorRef = new Map((contratos ?? []).map(c => [c.referencia_evento, c]))   // fica o mais recente
  const portalPorRef = new Map((ports ?? []).map(p => [p.referencia, p]))
  const eqPorRef = new Map((eqs ?? []).map(q => [q.referencia, q]))
  const selPorRef = new Map<string, string>()
  for (const s of sels ?? []) if (s.referencia && s.data_entrada) selPorRef.set(s.referencia, String(s.data_entrada).slice(0, 10))
  const histPorRef = new Map<string, any[]>()
  for (const h of hist ?? []) histPorRef.set(h.referencia, [...(histPorRef.get(h.referencia) ?? []), { etapa: h.etapa, origem: h.origem, em: h.criado_em }])

  const porNome = new Map((equipa ?? []).map(f => [norm(f.nome ?? ''), f]))
  const limiteEntregue = new Date(Date.now() - ENTREGUES_RECENTES * 86400000).toISOString().slice(0, 10)
  const diasAte = (iso: string) => Math.round((new Date(iso + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime()) / 86400000)

  const projetos = comFoto.map(e => {
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
      contacto: (() => { const c = contratoPorRef.get(e.referencia); return c ? { noiva: c.nome_noiva ?? null, noivo: c.nome_noivo ?? null, tel: c.tel_noiva || c.tel_noivo || null } : null })(),
      links: { sneakpeek: s.sneakpeek_url ?? null, galerias: s.galerias_url ?? null, selecao: s.selecao_url ?? null, entregue: s.fotos_finais_url ?? null },
      enviadas: { sneakpeek: s.sneakpeek_enviada ?? null, galerias: s.galerias_enviada ?? null, selecao: s.selecao_enviada ?? null, entregue: s.fotos_finais_enviada ?? null },
      portalId: p?.id ?? null,
      historico: histPorRef.get(e.referencia) ?? [],
    }
  }).filter(p => p.fase !== 'entregue' || String(p.enviadas.entregue ?? '').slice(0, 10) >= limiteEntregue)

  return NextResponse.json({ ok: true, hoje, equipa: equipa ?? [], projetos })
}
