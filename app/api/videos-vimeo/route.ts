/**
 * /api/videos-vimeo — links dos vídeos da página /videos (só admin)
 *
 * GET    → lista (mais recentes primeiro)
 * POST   { url, titulo? } → guarda; a capa, o título e a duração vêm do oEmbed
 *        do Vimeo (ou do YouTube) uma só vez, aqui, para a página não os pedir sempre
 * DELETE ?id=… → apaga
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, naoAutorizado } from '@/lib/api-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function idYouTube(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

async function infoVideo(url: string): Promise<{ titulo?: string; thumb?: string; duracao_seg?: number }> {
  try {
    const yt = idYouTube(url)
    const oembed = yt
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : /vimeo\.com\//i.test(url)
        ? `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`
        : null
    if (!oembed) return {}
    const r = await fetch(oembed, { headers: { 'User-Agent': 'RL-Photo-Video' } })
    if (!r.ok) return yt ? { thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` } : {}
    const j = await r.json()
    return {
      titulo: j.title || undefined,
      thumb: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : (j.thumbnail_url || undefined),
      duracao_seg: typeof j.duration === 'number' ? j.duration : undefined,
    }
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const { data, error } = await supabase.from('videos_vimeo')
    .select('id, url, titulo, thumb, duracao_seg, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ videos: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const body = await req.json().catch(() => ({}))
  const url = String(body.url ?? '').trim()
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  const info = await infoVideo(url)
  const titulo = String(body.titulo ?? '').trim() || info.titulo || null
  const { data, error } = await supabase.from('videos_vimeo')
    .insert({ url, titulo, thumb: info.thumb ?? null, duracao_seg: info.duracao_seg ?? null })
    .select('id, url, titulo, thumb, duracao_seg, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ video: data })
}

export async function DELETE(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id' }, { status: 400 })
  const { error } = await supabase.from('videos_vimeo').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
