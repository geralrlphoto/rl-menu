import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: perfil do editor (freelancers.perfil_editor) + identidade base da BD.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('freelancer')
  if (!id) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const supabase = db()

  // ?only=foto — devolve só a foto (JSON-path select). Evita arrastar o
  // perfil_editor inteiro para o dashboard, que só precisa do avatar.
  if (req.nextUrl.searchParams.get('only') === 'foto') {
    const { data } = await supabase
      .from('freelancers')
      .select('foto_url, perfil_editor->>foto')
      .eq('id', id)
      .maybeSingle()
    const row = data as { foto_url?: string | null; foto?: string | null } | null
    return NextResponse.json({ foto: row?.foto_url || row?.foto || null })
  }
  const { data } = await supabase
    .from('freelancers')
    .select('id, nome, email, contato, foto_url, perfil_editor')
    .eq('id', id)
    .maybeSingle()
  return NextResponse.json({
    base: data ? { nome: data.nome, email: data.email, contato: data.contato, foto_url: data.foto_url } : null,
    perfil: data?.perfil_editor ?? null,
  })
}

// PATCH: grava o perfil do editor em freelancers.perfil_editor.
export async function PATCH(req: NextRequest) {
  const { freelancer, perfil } = await req.json()
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const supabase = db()
  const { error } = await supabase
    .from('freelancers')
    .update({ perfil_editor: perfil ?? {} })
    .eq('id', freelancer)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
