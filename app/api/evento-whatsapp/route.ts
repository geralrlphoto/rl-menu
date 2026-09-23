import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Registo das mensagens de WhatsApp enviadas a partir da ficha do evento
// (e do /photo). GET diz o que já foi enviado; POST regista um envio.
const EVENTOS = ['reuniao_preparacao']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const eventoId = req.nextUrl.searchParams.get('eventoId') ?? ''
  if (!UUID_RE.test(eventoId)) return NextResponse.json({ error: 'eventoId inválido' }, { status: 400 })
  const { data, error } = await sb().from('eventos_whatsapp_envios').select('evento, created_at').eq('evento_id', eventoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, envios: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { eventoId, evento } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(eventoId ?? '') || !EVENTOS.includes(evento)) {
    return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  }
  const { error } = await sb().from('eventos_whatsapp_envios')
    .upsert({ evento_id: eventoId, evento }, { onConflict: 'evento_id,evento', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('photo-whatsapp', { expire: 0 })
  return NextResponse.json({ ok: true })
}
