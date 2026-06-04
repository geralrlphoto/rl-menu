/* ============================================================
   /api/blog-subscribers  (GET, POST)

   Schema esperado:
   create table if not exists blog_subscribers (
     id uuid primary key default gen_random_uuid(),
     email text not null unique,
     status text not null default 'active',  -- 'active' | 'unsubscribed'
     source text,                              -- 'admin' | 'public' | 'import'
     created_at timestamptz not null default now(),
     unsubscribed_at timestamptz
   );

   GET    → lista todos (admin only — middleware protege)
   POST   → adiciona subscritor { email, source? }
            (público — formulário do blog faz POST aqui)
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// CORS — endpoint POST tem de ser acessível de qualquer domínio (site público).
// GET fica admin (middleware bloqueia tudo o resto).
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  try {
    const { data, error } = await db()
      .from('blog_subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        ok: true,
        subscribers: [],
        setup: error.message,
      })
    }
    return NextResponse.json({ ok: true, subscribers: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ ok: true, subscribers: [], error: e?.message })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const emailRaw = String(body?.email ?? '').trim().toLowerCase()
  const source = body?.source ? String(body.source).slice(0, 20) : 'public'

  if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json(
      { ok: false, error: 'Email inválido' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  try {
    // Upsert by email — se já existir e estava unsubscribed, reactiva
    const { data, error } = await db()
      .from('blog_subscribers')
      .upsert(
        {
          email: emailRaw,
          status: 'active',
          source,
          unsubscribed_at: null,
        },
        { onConflict: 'email' },
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: CORS_HEADERS },
      )
    }
    return NextResponse.json(
      { ok: true, subscriber: data },
      { headers: CORS_HEADERS },
    )
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
