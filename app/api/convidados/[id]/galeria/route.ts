// GET /api/convidados/<id do portal>/galeria — fotografias da galeria dos convidados
// (Wfolio: convidados_url, ou a Galeria Online) numa só pasta, para a página pública
// /convidados/<id>. Só leitura: a escolha dos convidados fica no dispositivo deles e
// segue para o formulário de compra. O id do portal não se adivinha.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehGaleriaWfolio, lerGaleriaWfolio, WFOLIO_CDN } from '@/lib/wfolioGaleria'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: 'id' }, { status: 400 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb.from('portais').select('settings').eq('id', id).maybeSingle()
  const s: any = data?.settings ?? {}
  const url = String(s.convidados_url || s.galerias_url || '')
  if (!ehGaleriaWfolio(url)) return NextResponse.json({ ok: false, error: 'sem_galeria' })
  try {
    const g = await lerGaleriaWfolio(url)
    // Uma só pasta com todas as fotografias, sem repetidas
    const vistas = new Set<string>()
    const fotos = g.pastas.flatMap(p => p.fotos).filter(f => (vistas.has(f.n) ? false : (vistas.add(f.n), true)))
    return NextResponse.json(
      { ok: true, cdn: WFOLIO_CDN, pastas: [{ nome: 'Fotografias', slug: 'fotografias', fotos }] },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
    )
  } catch (e) {
    console.error('[convidados/galeria] wfolio:', e)
    return NextResponse.json({ ok: false, error: 'wfolio' }, { status: 502 })
  }
}
