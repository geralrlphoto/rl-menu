/* ============================================================
   /api/blog-subscribers/[id]  (PATCH, DELETE)
   - PATCH: muda status (active/unsubscribed)
   - DELETE: remove definitivamente
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const updates: Record<string, any> = {}
  if (body.status === 'active' || body.status === 'unsubscribed') {
    updates.status = body.status
    updates.unsubscribed_at = body.status === 'unsubscribed' ? new Date().toISOString() : null
  }

  try {
    const { error } = await db()
      .from('blog_subscribers')
      .update(updates)
      .eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const barrado = exigeAdmin(_req)
  if (barrado) return barrado
  const { id } = await params
  try {
    const { error } = await db().from('blog_subscribers').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
