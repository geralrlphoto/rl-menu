import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { ref_evento, paginas_alterar, tipos_alteracao, observacoes } = body

  if (!ref_evento) return NextResponse.json({ error: 'ref_evento required' }, { status: 400 })

  const supabase = db()

  // Save alteration request
  const { error: insertError } = await supabase
    .from('album_alteracoes')
    .insert({ ref_evento, paginas_alterar, tipos_alteracao, observacoes })

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
