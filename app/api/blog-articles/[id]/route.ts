/* ============================================================
   /api/blog-articles/[id]  (PATCH, DELETE)
   - PATCH: muda status ou edita campos
   - DELETE: remove
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const allowed = [
    'title', 'subtitle', 'body', 'seo_keywords',
    'instagram_feed', 'instagram_stories', 'facebook_post',
    'status', 'used_at',
  ]
  const updates: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updates[k] = v
  }
  if (body.status === 'used' && !body.used_at) {
    updates.used_at = new Date().toISOString()
  }
  if (body.status === 'draft') {
    updates.used_at = null
  }

  try {
    const { error } = await db()
      .from('blog_articles')
      .update(updates)
      .eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { error } = await db().from('blog_articles').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
