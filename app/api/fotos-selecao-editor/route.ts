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
  if (!id) {
    // Return all assignments
    const { data, error } = await db().from('fotos_selecao_editor').select('notion_page_id, editor, editor_album')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ editors: data ?? [] })
  }
  const { data, error } = await db()
    .from('fotos_selecao_editor')
    .select('editor, editor_album')
    .eq('notion_page_id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ editor: data?.editor ?? null, editor_album: data?.editor_album ?? null })
}

export async function PATCH(req: NextRequest) {
  const { notion_page_id, editor, editor_album } = await req.json()
  if (!notion_page_id) return NextResponse.json({ error: 'notion_page_id required' }, { status: 400 })
  const upsertData: any = { notion_page_id, updated_at: new Date().toISOString() }
  if (editor !== undefined) upsertData.editor = editor ?? null
  if (editor_album !== undefined) upsertData.editor_album = editor_album ?? null
  const { error } = await db()
    .from('fotos_selecao_editor')
    .upsert(upsertData, { onConflict: 'notion_page_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
