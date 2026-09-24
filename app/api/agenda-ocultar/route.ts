import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Esconde um item só da faixa "Próximos 30 dias" do /photo.
// Não mexe no evento, na reunião nem na lead: guarda apenas a chave em photo_agenda_ocultos.
const CHAVE_RE = /^(evento|reuniao|wa):[\w:.-]{1,120}$/

// DELETE: repõe todos os itens escondidos
export async function DELETE() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabase.from('photo_agenda_ocultos').delete().neq('chave', '')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('photo-agenda-ocultos', { expire: 0 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { chave } = await req.json().catch(() => ({}))
  if (typeof chave !== 'string' || !CHAVE_RE.test(chave)) {
    return NextResponse.json({ error: 'chave inválida' }, { status: 400 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabase.from('photo_agenda_ocultos').upsert({ chave }, { onConflict: 'chave', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('photo-agenda-ocultos', { expire: 0 })
  return NextResponse.json({ ok: true })
}
