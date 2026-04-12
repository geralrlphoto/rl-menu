import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/album-alteracoes?refs=CAS_001,CAS_002
// Returns latest alteration per ref_evento
export async function GET(req: NextRequest) {
  const refs = req.nextUrl.searchParams.get('refs')
  if (!refs) return NextResponse.json({ alteracoes: [] })
  const refList = refs.split(',').map(r => r.trim()).filter(Boolean)
  const { data, error } = await db()
    .from('album_alteracoes')
    .select('*')
    .in('ref_evento', refList)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep only the most recent per ref
  const latest: Record<string, any> = {}
  for (const row of (data ?? [])) {
    if (!latest[row.ref_evento]) latest[row.ref_evento] = row
  }
  return NextResponse.json({ alteracoes: Object.values(latest) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { ref_evento, paginas_alterar, tipos_alteracao, observacoes, foto_url } = body

  if (!ref_evento) return NextResponse.json({ error: 'ref_evento required' }, { status: 400 })

  const supabase = db()

  // Save alteration request
  const { error: insertError } = await supabase
    .from('album_alteracoes')
    .insert({ ref_evento, paginas_alterar, tipos_alteracao, observacoes, foto_url: foto_url ?? null })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Set album status back to EM EDIÇÃO
  const { data: album } = await supabase
    .from('albuns_casamento')
    .select('id')
    .eq('ref_evento', ref_evento)
    .maybeSingle()

  if (album) {
    await supabase
      .from('albuns_casamento')
      .update({ status: 'EM EDIÇÃO' })
      .eq('id', album.id)
  }

  // Sync freelancer_album
  await supabase
    .from('freelancer_album')
    .update({ status: 'EM EDIÇÃO' })
    .eq('referencia_album', ref_evento)

  return NextResponse.json({ ok: true })
}
