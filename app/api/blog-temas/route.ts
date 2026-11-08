/* ============================================================
   /api/blog-temas  (GET, POST, DELETE)
   Fila de temas do blog. O Rui escolhe os temas em
   /social-media/blog; o Claude pega nos "pendente", escreve o
   artigo em blog_articles e marca o tema como "escrito".
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('blog_temas')
    .select('id, tema, categoria, status, article_id, escrito_at, created_at')
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) return NextResponse.json({ ok: false, temas: [], error: error.message })
  return NextResponse.json({ ok: true, temas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const tema = String(body?.tema ?? '').trim()
  if (!tema) return NextResponse.json({ ok: false, error: 'Escreve o tema' }, { status: 400 })
  const { data, error } = await db()
    .from('blog_temas')
    .insert({ tema: tema.slice(0, 300), categoria: body?.categoria ? String(body.categoria) : null })
    .select('id, tema, categoria, status, article_id, escrito_at, created_at')
    .single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  revalidateTag('blog-temas', { expire: 0 }) // alerta "Blog · Escolher temas" do /photo
  return NextResponse.json({ ok: true, tema: data })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id em falta' }, { status: 400 })
  const { error } = await db().from('blog_temas').delete().eq('id', id).eq('status', 'pendente')
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  revalidateTag('blog-temas', { expire: 0 })
  return NextResponse.json({ ok: true })
}
