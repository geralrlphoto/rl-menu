import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { aplicarEstadoAlbum, ESTADOS_ALBUM, type EstadoAlbum } from '@/lib/albumEstado'

// Departamento de Fotografia › Álbuns (/edicao-fotografia/albuns).
// GET: os álbuns (albuns_casamento) com o editor (evento_equipa.editor_album), a
//   maqueta (portais.settings.maquete_url), o último pedido de alterações e o
//   histórico; mais os casamentos com seleção recebida que ainda não têm álbum
//   ("Por nomear", vindos do quadro do departamento).
// POST { referencia, estado, nota? }: a RL muda o estado (lib/albumEstado.ts).

const PRAZO_MAQUETA_DIAS = 30
const ENTREGUES_RECENTES = 90
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const arr = (v: unknown): string[] => Array.isArray(v) ? v.filter(Boolean).map(String) : (typeof v === 'string' && v.trim() ? [v.trim()] : [])
const mais = (iso: string, n: number) => new Date(new Date(iso.slice(0, 10) + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const hoje = new Date().toISOString().slice(0, 10)
  const diasAte = (iso: string) => Math.round((new Date(iso.slice(0, 10) + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime()) / 86400000)

  // Quadro do departamento: dá os casamentos, a seleção e a equipa (mesmas regras)
  const dep = await fetch(`${req.nextUrl.origin}/api/edicao-fotografia`, { headers: cabecalhoInterno() }).then(r => r.json()).catch(() => null)
  const projetos: any[] = dep?.projetos ?? []
  const porRef = new Map(projetos.map(p => [p.referencia, p]))

  const { data: albs } = await sb.from('albuns_casamento').select('*').not('ref_evento', 'is', null).order('created_at', { ascending: false })
  const refs = (albs ?? []).map(a => a.ref_evento as string)
  const vazio = Promise.resolve({ data: [] as any[] })
  const [{ data: eqs }, { data: ports }, { data: alts }, { data: hist }, { data: evs }, { data: equipa }] = await Promise.all([
    refs.length ? sb.from('evento_equipa').select('referencia, editor_album').in('referencia', refs) : vazio,
    refs.length ? sb.from('portais').select('referencia, settings->maquete_url, settings->maquete_enviada').in('referencia', refs) : vazio,
    refs.length ? sb.from('album_alteracoes').select('*').in('ref_evento', refs).order('created_at', { ascending: false }) : vazio,
    refs.length ? sb.from('fotografia_historico').select('referencia, etapa, origem, criado_em').in('referencia', refs).like('etapa', 'Álbum%').order('criado_em') : vazio,
    refs.length ? sb.from('eventos_2026').select('id, notion_id, referencia, cliente, data_evento').in('referencia', refs) : vazio,
    sb.from('freelancers').select('id, nome, foto_url, status, contato').in('status', ['FOTOGRAFO', 'ASSISTENTE']).order('nome'),
  ])
  const eqPorRef = new Map((eqs ?? []).map(q => [q.referencia, arr(q.editor_album)]))
  const ptPorRef = new Map((ports ?? []).map((p: any) => [p.referencia, p]))
  const altPorRef = new Map<string, any>()
  for (const a of alts ?? []) if (!altPorRef.has(a.ref_evento)) altPorRef.set(a.ref_evento, a)
  const histPorRef = new Map<string, any[]>()
  for (const h of hist ?? []) histPorRef.set(h.referencia, [...(histPorRef.get(h.referencia) ?? []), { etapa: h.etapa, origem: h.origem, em: h.criado_em }])
  const evPorRef = new Map((evs ?? []).map(e => [e.referencia, e]))
  const porNome = new Map((equipa ?? []).map(f => [norm(f.nome ?? ''), f]))
  const limite = new Date(Date.now() - ENTREGUES_RECENTES * 86400000).toISOString().slice(0, 10)

  // Álbuns criados com a referência errada (vinda da seleção): liga-se ao casamento pelos nomes
  const nomesDe = (t: unknown) => new Set(norm(String(t ?? '')).split(/[^a-z]+/).filter(w => w.length > 2 && !['casamento', 'batizado'].includes(w)))
  const projetoDe = (a: any) => porRef.get(a.ref_evento) ?? projetos.find(p => {
    const x = nomesDe(a.nome), y = nomesDe(p.cliente)
    return [...x].filter(n => y.has(n)).length >= 2
  })
  // Nº de fotografias: alguns álbuns têm a lista dos códigos em vez do número
  const contaFotos = (v: unknown) => {
    const t = String(v ?? '').trim()
    if (!t) return null
    if (/^\d+$/.test(t)) return Number(t)
    const n = t.split(/[\s,;]+/).filter(x => /\d/.test(x)).length
    return n || null
  }

  const albuns = (albs ?? []).map(a => {
    const p = projetoDe(a)
    const ref = (p?.referencia ?? a.ref_evento) as string
    const ev = evPorRef.get(a.ref_evento) ?? evPorRef.get(ref)
    const editores = eqPorRef.get(a.ref_evento) ?? eqPorRef.get(ref) ?? []
    const pt = ptPorRef.get(a.ref_evento) ?? ptPorRef.get(ref)
    const estado = (ESTADOS_ALBUM as readonly string[]).includes(a.status) ? a.status as EstadoAlbum : 'NOVO ÁLBUM'
    // prazo: maqueta (seleção + 30 dias) enquanto se edita; produção depois de aprovado
    const base = a.data_entrega_fotos ? String(a.data_entrega_fotos).slice(0, 10) : (p?.recebida ?? null)
    const prazo = estado === 'APROVADO' ? (a.data_prevista_entrega ? String(a.data_prevista_entrega).slice(0, 10) : null)
      : ['NOVO ÁLBUM', 'EM EDIÇÃO', 'ALTERAÇÕES'].includes(estado) ? (a.prazo_maquete ? String(a.prazo_maquete).slice(0, 10) : base ? mais(base, PRAZO_MAQUETA_DIAS) : null)
      : null
    return {
      id: a.id, referencia: ref, nome: a.nome, cliente: p?.cliente ?? ev?.cliente ?? a.nome, data: p?.data ?? ev?.data_evento ?? null,
      fichaId: p?.fichaId ?? ev?.notion_id ?? (ev?.id ? String(ev.id) : null),
      estado, editores, editorIds: editores.map(n => porNome.get(norm(n))?.id ?? null),
      refErrada: !!p && p.referencia !== a.ref_evento ? a.ref_evento : null,
      numFotos: contaFotos(a.num_fotografias), entradaFotos: base, prazo, diasPrazo: prazo ? diasAte(prazo) : null,
      maqueteUrl: typeof pt?.maquete_url === 'string' ? pt.maquete_url : null,
      maqueteEnviada: typeof pt?.maquete_enviada === 'string' ? pt.maquete_enviada : null,
      alteracao: altPorRef.get(a.ref_evento) ?? null, historico: histPorRef.get(a.ref_evento) ?? histPorRef.get(ref) ?? [],
      refAlbum: a.ref_evento as string,
      entregueEm: a.entrega_album ?? null, aprovadoEm: a.data_aprovacao ?? null,
      ficha: { ref_album: a.ref_album ?? '', design: a.design ?? '', opcao: a.opcao ?? '', num_fotografias: a.num_fotografias ?? '', texto_album: a.texto_album ?? '', texto_caixa: a.texto_caixa ?? '' },
    }
  }).filter(a => a.estado !== 'ENTREGUE' || String(a.entregueEm ?? a.aprovadoEm ?? '9999').slice(0, 10) >= limite)

  // Por nomear: seleção recebida, sem álbum nem editor do álbum
  const comAlbum = new Set([...refs, ...albuns.map(a => a.referencia)])
  const porNomear = projetos
    .filter(p => (p.fase === 'edicao' || p.fase === 'entregue') && (p.selecao || p.recebida) && !comAlbum.has(p.referencia) && !p.editorAlbum)
    .map(p => ({ referencia: p.referencia, cliente: p.cliente, data: p.data, fichaId: p.fichaId, recebida: p.recebida,
      numFotos: (p.selecaoFotos ?? []).find((c: any) => c.categoria === 'Álbum')?.fotos ?? null }))

  return NextResponse.json({ ok: true, hoje, albuns, porNomear, equipa: equipa ?? [] })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { referencia, estado, nota } = await req.json().catch(() => ({}))
  if (!referencia || !(ESTADOS_ALBUM as readonly string[]).includes(estado)) return NextResponse.json({ error: 'Referência ou estado inválidos.' }, { status: 400 })
  const r = await aplicarEstadoAlbum(req.nextUrl.origin, { referencia, estado, origem: 'RL', nota: nota ?? null })
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 })
  return NextResponse.json({ ok: true })
}
