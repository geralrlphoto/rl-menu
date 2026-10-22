import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

export const runtime = 'nodejs'

// Foto do membro do staff para o chat do Atendimento (pública, como /api/staff/cartao).
// Pequena (96 px, WebP) e guardada na CDN da Vercel: o Supabase só é lido quando a cache expira.
const CACHE = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from('staff').select('foto_url').eq('id', id).maybeSingle()
  if (!data?.foto_url) return new Response(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  try {
    const r = await fetch(data.foto_url)
    if (!r.ok) throw new Error()
    const webp = await sharp(Buffer.from(await r.arrayBuffer()), { failOn: 'none' }).resize(96, 96, { fit: 'cover' }).webp({ quality: 80 }).toBuffer()
    return new Response(new Uint8Array(webp), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE } })
  } catch {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  }
}
