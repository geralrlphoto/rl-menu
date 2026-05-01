import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { lead_id, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link } = body
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Reutilizar token existente se já tiver
  const { data: existing } = await supabase
    .from('media_leads')
    .select('page_token')
    .eq('id', lead_id)
    .single()

  const token = existing?.page_token || crypto.randomBytes(12).toString('hex')

  const { error } = await supabase
    .from('media_leads')
    .update({
      page_token: token,
      page_publicada: true,
      reuniao_data: reuniao_data || null,
      reuniao_hora: reuniao_hora || null,
      reuniao_tipo: reuniao_tipo || 'Presencial',
      reuniao_link: reuniao_link || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, token })
}
