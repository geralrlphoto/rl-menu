import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { id } → marca a encomenda para (re)envio automático das fotos.
//   Repõe estado=Aguardar, limpa a data de envio e liga envio_auto, para o robô
//   a apanhar na próxima passagem e enviar (se as fotos/pasta existirem).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = String(b.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await db()
    .from('photo_orders')
    .update({ estado: 'Aguardar', fotos_enviadas_em: null, envio_auto: true, envio_erro: null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
