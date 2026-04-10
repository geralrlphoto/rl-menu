import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('notion_page_id')
  if (!id) return NextResponse.json({ error: 'notion_page_id required' }, { status: 400 })
  const { data, error } = await db()
    .from('fotos_selecao_editor')
    .select('editor')
    .eq('notion_page_id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ editor: data?.editor ?? null })
}

export async function PATCH(req: NextRequest) {
  const { notion_page_id, editor } = await req.json()
  if (!notion_page_id) return NextResponse.json({ error: 'notion_page_id required' }, { status: 400 })
  const { error } = await db()
    .from('fotos_selecao_editor')
    .upsert({ notion_page_id, editor: editor ?? null, updated_at: new Date().toISOString() }, { onConflict: 'notion_page_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
