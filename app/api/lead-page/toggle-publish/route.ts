import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { camposPublicar } from '@/lib/portalReuniao'

export async function POST(req: NextRequest) {
  const { id, publish } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ao publicar: copia tudo da maquete e preserva só o que é de cada casal (lib/portalReuniao)
  const { token, campos } = await camposPublicar(supabase, id, !!publish)

  const { error } = await supabase
    .from('crm_contacts')
    .update(campos)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, token })
}
