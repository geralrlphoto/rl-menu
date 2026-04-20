import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, nome, skip_confirmation } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email: email.toLowerCase().trim(),
        nome: nome || null,
        source: 'admin',
        status: skip_confirmation ? 'active' : 'pending',
        confirmed_at: skip_confirmation ? new Date().toISOString() : null,
      }, { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, subscriber: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
