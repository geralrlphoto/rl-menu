/**
 * /api/galerias-links — galerias (Wfolio) da página /galerias (só admin)
 *
 * GET    → lista (mais recentes primeiro)
 * POST   { url, titulo?, categoria, capa? } → guarda; se faltar título ou capa,
 *        lê o og:title / og:image da própria galeria, uma só vez, aqui
 * DELETE ?id=… → apaga
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, naoAutorizado } from '@/lib/api-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CATEGORIAS = ['casamentos', 'prewedding', 'trash']

// Lê o título e a imagem de partilha da página da galeria
async function metaPagina(url: string): Promise<{ titulo?: string; capa?: string }> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (RL-Photo-Video)' }, redirect: 'follow', signal: AbortSignal.timeout(8000) })
    if (!r.ok) return {}
    const html = (await r.text()).slice(0, 300_000)
    const meta = (prop: string) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
        ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'))
      return m?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
    }
    const capa = meta('og:image') ?? meta('twitter:image')
    return {
      titulo: meta('og:title') ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim(),
      capa: capa ? new URL(capa, url).toString() : undefined,
    }
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const { data, error } = await supabase.from('galerias_links')
    .select('id, url, titulo, categoria, capa, created_at')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ galerias: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const body = await req.json().catch(() => ({}))
  const url = String(body.url ?? '').trim()
  const categoria = String(body.categoria ?? '')
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  if (!CATEGORIAS.includes(categoria)) return NextResponse.json({ error: 'Escolhe a categoria' }, { status: 400 })
  let titulo = String(body.titulo ?? '').trim()
  let capa = String(body.capa ?? '').trim()
  if (!titulo || !capa) {
    const m = await metaPagina(url)
    titulo = titulo || m.titulo || ''
    capa = capa || m.capa || ''
  }
  const { data, error } = await supabase.from('galerias_links')
    .insert({ url, titulo: titulo || null, categoria, capa: capa || null })
    .select('id, url, titulo, categoria, capa, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ galeria: data })
}

export async function DELETE(req: NextRequest) {
  if (!ehAdmin(req)) return naoAutorizado()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id' }, { status: 400 })
  const { error } = await supabase.from('galerias_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
