import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { id, publish } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar token existente
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('page_token')
    .eq('id', id)
    .single()

  const token = existing?.page_token || randomUUID()

  const { error } = await supabase
    .from('crm_contacts')
    .update({
      page_publicada: publish,
      page_token: token,
      ...(publish ? {} : {}),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, token })
}
