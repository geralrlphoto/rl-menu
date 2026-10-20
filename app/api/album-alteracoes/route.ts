import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'
import { aplicarEstadoAlbum } from '@/lib/albumEstado'

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
  // Só os noivos deste casamento (ou a RL) pedem alterações
  const bloqueio = await exigeAcessoRef(req, ref_evento)
  if (bloqueio) return bloqueio

  const supabase = db()

  // Save alteration request
  const { error: insertError } = await supabase
    .from('album_alteracoes')
    .insert({ ref_evento, paginas_alterar, tipos_alteracao, observacoes, foto_url: foto_url ?? null })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Volta ao editor (estado ALTERAÇÕES): avisa-o por email e no portal, e a RL no sino
  const resumo = [
    paginas_alterar ? `Páginas: ${paginas_alterar}` : '',
    Array.isArray(tipos_alteracao) && tipos_alteracao.length ? `O que mudar: ${tipos_alteracao.join(', ')}` : (tipos_alteracao ? `O que mudar: ${tipos_alteracao}` : ''),
    observacoes ? `Notas: ${observacoes}` : '',
  ].filter(Boolean).join('\n')
  await aplicarEstadoAlbum(req.nextUrl.origin, { referencia: ref_evento, estado: 'ALTERAÇÕES', origem: 'Noivos', nota: resumo || null })

  return NextResponse.json({ ok: true })
}
