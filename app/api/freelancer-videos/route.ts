import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, exigeAdminOuProprio } from '@/lib/api-guard'

// Vídeos partilhados com a equipa (tabela video_partilhas).
// A RL escolhe no /edicao-video com quem partilha cada filme; o membro só o vê
// na pasta Vídeos do portal dele depois de o filme estar Entregue (entregue_em).
//  GET ?freelancer=<id>  → os vídeos entregues partilhados com esse membro
//  PUT { referencia, cliente, data, local, filmeUrl, entregue, freelancerIds[] } → (admin) grava a lista

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const freelancer = req.nextUrl.searchParams.get('freelancer')
  const bloqueio = await exigeAdminOuProprio(req, freelancer)
  if (bloqueio) return bloqueio
  const db = sb()
  const { data, error } = await db.from('video_partilhas')
    .select('id, referencia, cliente, data_casamento, local, filme_url, entregue_em, capa_url')
    .eq('freelancer_id', freelancer!).not('entregue_em', 'is', null)
    .order('entregue_em', { ascending: false })
  if (error) return NextResponse.json({ error: 'Não foi possível ler os vídeos.' }, { status: 500 })
  // Capa do filme: lida uma vez do Vimeo/YouTube e guardada ('' = link sem capa, ex.: Smash)
  const videos = await Promise.all((data ?? []).map(async v => {
    if (v.capa_url !== null || !v.filme_url) return v
    const capa = await capaDoFilme(v.filme_url)
    await db.from('video_partilhas').update({ capa_url: capa }).eq('referencia', v.referencia).eq('filme_url', v.filme_url)
    return { ...v, capa_url: capa }
  }))
  return NextResponse.json({ ok: true, videos })
}

async function capaDoFilme(url: string): Promise<string> {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  if (/vimeo\.com\//i.test(url)) {
    const limpo = url.split('?')[0]
    const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(limpo)}&width=1280`).catch(() => null)
    const d = r?.ok ? await r.json().catch(() => null) : null
    if (d?.thumbnail_url) return String(d.thumbnail_url)
  }
  return ''
}

export async function PUT(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { referencia, cliente, data, local, filmeUrl, entregue, freelancerIds } = await req.json().catch(() => ({}))
  if (!referencia || !Array.isArray(freelancerIds)) return NextResponse.json({ error: 'Falta a referência.' }, { status: 400 })
  const ids = [...new Set(freelancerIds.map(String).filter(Boolean))]
  const db = sb()

  const { data: atuais } = await db.from('video_partilhas').select('freelancer_id, entregue_em').eq('referencia', referencia)
  const tirar = (atuais ?? []).filter(a => !ids.includes(a.freelancer_id)).map(a => a.freelancer_id)
  if (tirar.length) await db.from('video_partilhas').delete().eq('referencia', referencia).in('freelancer_id', tirar)

  if (ids.length) {
    const agora = new Date().toISOString()
    const antes = new Map((atuais ?? []).map(a => [a.freelancer_id, a.entregue_em]))
    const { error } = await db.from('video_partilhas').upsert(ids.map(fid => ({
      referencia, freelancer_id: fid, cliente: cliente ?? null, data_casamento: data ? String(data).slice(0, 10) : null, local: local ?? null,
      filme_url: filmeUrl ?? null, capa_url: null, entregue_em: entregue ? (antes.get(fid) ?? agora) : null,
    })), { onConflict: 'referencia,freelancer_id' })
    if (error) return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
