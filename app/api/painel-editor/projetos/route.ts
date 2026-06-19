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
      .select('referencia, link, status, feedback')
      .in('referencia', refs)
    for (const j of jobs) {
      const r = (revs ?? []).find((x: any) => x.referencia === j.referencia)
      if (r) j.revisao = { link: r.link, status: r.status, feedback: r.feedback }
    }
  }

  return NextResponse.json({ jobs })
}
