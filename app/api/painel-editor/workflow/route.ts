import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: estado de edição por trabalho + biblioteca de músicas do editor.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('freelancer')
  if (!id) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const supabase = db()
  const { data } = await supabase
    .from('freelancers')
    .select('editor_workflow, editor_musicas')
    .eq('id', id)
    .maybeSingle()
  return NextResponse.json({
    workflow: data?.editor_workflow ?? {},
    musicas: Array.isArray(data?.editor_musicas) ? data.editor_musicas : [],
  })
}

// PATCH: atualiza o estado de UM trabalho (merge) e/ou a lista de músicas.
export async function PATCH(req: NextRequest) {
  const { freelancer, referencia, stage, musicas } = await req.json()
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const supabase = db()

  const { data: cur } = await supabase
    .from('freelancers')
    .select('editor_workflow, editor_musicas')
    .eq('id', freelancer)
    .maybeSingle()

  const updates: Record<string, any> = {}
  if (referencia && typeof stage === 'string') {
    const wf = (cur?.editor_workflow && typeof cur.editor_workflow === 'object') ? cur.editor_workflow : {}
    updates.editor_workflow = { ...wf, [referencia]: stage }
  }
  if (Array.isArray(musicas)) {
    updates.editor_musicas = musicas
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nada a atualizar' }, { status: 400 })
  }

  const { error } = await supabase.from('freelancers').update(updates).eq('id', freelancer)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
