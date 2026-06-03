/* ============================================================
   /api/blog-articles  (GET, POST)
   CRUD para artigos do blog guardados na tabela blog_articles.

   Schema esperado:
   create table if not exists blog_articles (
     id uuid primary key default gen_random_uuid(),
     title text not null,
     subtitle text,
     body text not null,
     seo_keywords text,
     category text,
     reading_min int,
     instagram_feed jsonb default '{}'::jsonb,
     instagram_stories jsonb default '[]'::jsonb,
     facebook_post text,
     status text not null default 'draft',  -- 'draft' | 'used'
     used_at timestamptz,
     created_at timestamptz not null default now()
   );

   Se a tabela não existir, devolve [] com warning.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET() {
  try {
    const { data, error } = await db()
      .from('blog_articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Tabela ainda não criada — devolve vazio + setup
      return NextResponse.json({
        ok: true,
        articles: [],
        setup: error.message,
      })
    }
    return NextResponse.json({ ok: true, articles: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ ok: true, articles: [], error: e?.message })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const a = body?.article ?? body

  if (!a?.title || !a?.body) {
    return NextResponse.json({ ok: false, error: 'title e body obrigatórios' }, { status: 400 })
  }

  try {
    const { data, error } = await db()
      .from('blog_articles')
      .insert({
        title: String(a.title),
        subtitle: a.subtitle ? String(a.subtitle) : null,
        body: String(a.body),
        seo_keywords: a.seoKeywords ? String(a.seoKeywords) : null,
        category: a.category ? String(a.category) : null,
        reading_min: a.readingMin ?? null,
        instagram_feed: a.instagramFeed ?? {},
        instagram_stories: Array.isArray(a.instagramStories) ? a.instagramStories : [],
        facebook_post: a.facebookPost ? String(a.facebookPost) : null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, article: data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
