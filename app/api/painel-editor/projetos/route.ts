import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function parseMeta(mensagem: string): any {
  const m = (mensagem ?? '').match(/^__META__(.*?)__\/META__/)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

// Separa a mensagem em META + texto legível, para poder reescrever só a META.
function splitMeta(mensagem: string): { meta: any; resto: string } {
  const raw = mensagem ?? ''
  const m = raw.match(/^__META__(.*?)__\/META__/)
  if (!m) return { meta: {}, resto: raw }
  let meta: any = {}
  try { meta = JSON.parse(m[1]) ?? {} } catch { meta = {} }
  return { meta, resto: raw.slice(m[0].length) }
}

function joinMeta(meta: any, resto: string): string {
  return `__META__${JSON.stringify(meta)}__/META__${resto}`
}

// Campos que o admin pode reescrever no projeto. Guardados em META.overrides e
// aplicados por cima do que é derivado do envio original.
const CAMPOS_EDITAVEIS = [
  'referencia', 'noivos', 'local', 'foto', 'duracao', 'recebido',
  'dataCasamento', 'entregaPrevista', 'preco', 'observacoes', 'notas',
  'clientLink', 'finalLink', 'materialStatus', 'downloadStatus',
  'ultimoDownload', 'approval', 'archived',
] as const

// GET: trabalhos reais enviados a um editor (tipo 'relatorio_editor').
//   Para cada evento, junta os links de download e o(s) relatório(s) da equipa.
export async function GET(req: NextRequest) {
  const freelancer = req.nextUrl.searchParams.get('freelancer')
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })

  const supabase = db()

  const { data: notifs } = await supabase
    .from('freelancer_notificacoes')
    .select('id, mensagem, lida, created_at')
    .eq('freelancer_id', freelancer)
    .eq('tipo', 'relatorio_editor')
    .order('created_at', { ascending: false })
    .limit(100)

  // Dedupe por referência (fica o envio mais recente)
  const byRef = new Map<string, any>()
  for (const n of (notifs ?? []) as any[]) {
    const meta = parseMeta(n.mensagem) ?? {}
    const key = meta.referencia || meta.evento_id || n.id
    if (byRef.has(key)) continue
    byRef.set(key, {
      notifId: n.id,
      referencia: meta.referencia ?? null,
      evento_id: meta.evento_id ?? null,
      local: meta.local ?? null,
      data_casamento: meta.data_casamento ?? null,
      downloads: Array.isArray(meta.downloads) ? meta.downloads : [],
      // Edições do admin (PATCH) — a página aplica-as por cima do derivado.
      overrides: (meta.overrides && typeof meta.overrides === 'object') ? meta.overrides : null,
      lida: !!n.lida,
      sentAt: n.created_at,
    })
  }
  const jobs = Array.from(byRef.values())

  // Enriquecer com relatórios diários da equipa + links de download (por referência).
  // NB: freelancer_casamentos NÃO tem coluna de nome dos noivos — usar local/meta para o título.
  const refs = jobs.map(j => j.referencia).filter(Boolean) as string[]
  if (refs.length) {
    const { data: fcs } = await supabase
      .from('freelancer_casamentos')
      .select('referencia, local, relatorio_diario')
      .in('referencia', refs)
    for (const j of jobs) {
      const rows = (fcs ?? []).filter((r: any) => r.referencia === j.referencia)
      // Local da equipa como fallback do título, caso a meta não traga
      if (!j.local) j.local = rows.map((r: any) => r.local).find(Boolean) ?? null
      j.relatorios = rows.map((r: any) => r.relatorio_diario).filter(Boolean)
      // junta downloads dos relatórios (caso a meta esteja desatualizada)
      const extra = rows.map((r: any) => r.relatorio_diario?.downloadUrl).filter(Boolean) as string[]
      j.downloads = Array.from(new Set([...(j.downloads ?? []), ...extra]))
    }
  }

  // Enriquecer com o estado da revisão de vídeo (Frame.io) por referência.
  if (refs.length) {
    const { data: revs } = await supabase
      .from('video_revisoes')
      .select('referencia, link, status, feedback, entrega_link, entrega_em')
      .in('referencia', refs)
    for (const j of jobs) {
      const r = (revs ?? []).find((x: any) => x.referencia === j.referencia)
      if (r) j.revisao = { link: r.link, status: r.status, feedback: r.feedback, entregaLink: r.entrega_link, entregaEm: r.entrega_em }
    }
  }

  return NextResponse.json({ jobs })
}

// PATCH { freelancer, notifId, patch } — grava as edições do admin em
// META.overrides da notificação que originou o projeto. O envio original
// (downloads, relatórios) fica intacto.
export async function PATCH(req: NextRequest) {
  const { freelancer, notifId, patch } = await req.json()
  if (!freelancer || !notifId) return NextResponse.json({ error: 'freelancer e notifId obrigatórios' }, { status: 400 })
  if (!patch || typeof patch !== 'object') return NextResponse.json({ error: 'patch obrigatório' }, { status: 400 })

  const supabase = db()
  const { data: row, error: readErr } = await supabase
    .from('freelancer_notificacoes')
    .select('id, mensagem')
    .eq('id', notifId)
    .eq('freelancer_id', freelancer)
    .maybeSingle()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'projeto não encontrado' }, { status: 404 })

  const limpo: Record<string, any> = {}
  for (const k of CAMPOS_EDITAVEIS) {
    if (patch[k] !== undefined) limpo[k] = patch[k]
  }
  if (Object.keys(limpo).length === 0) return NextResponse.json({ ok: true, ignorado: true })

  const { meta, resto } = splitMeta(row.mensagem)
  meta.overrides = { ...(meta.overrides ?? {}), ...limpo }

  const { error } = await supabase
    .from('freelancer_notificacoes')
    .update({ mensagem: joinMeta(meta, resto) })
    .eq('id', row.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, overrides: meta.overrides })
}

// DELETE ?freelancer=<id>&notif=<id> — elimina o projeto do painel do editor,
// apagando a notificação de envio que lhe deu origem.
export async function DELETE(req: NextRequest) {
  const freelancer = req.nextUrl.searchParams.get('freelancer')
  const notifId = req.nextUrl.searchParams.get('notif')
  if (!freelancer || !notifId) return NextResponse.json({ error: 'freelancer e notif obrigatórios' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase
    .from('freelancer_notificacoes')
    .delete()
    .eq('id', notifId)
    .eq('freelancer_id', freelancer)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
