import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { sbAdmin, hojeLisboa, UUID_RE } from '@/lib/preparacao'

// Admin: disponibilidade para a reunião de preparação (comum a todos os casais).
// GET lista os horários a partir de hoje; POST acrescenta; DELETE remove um livre;
// PATCH { id, libertar: true } cancela a reserva de um horário.

export async function GET() {
  const sb = sbAdmin()
  const { data, error } = await sb.from('preparacao_slots')
    .select('id, data, hora, evento_id, formato, reservado_em')
    .gte('data', hojeLisboa()).order('data').order('hora').limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = [...new Set((data ?? []).map(s => s.evento_id).filter(Boolean))] as string[]
  let nomes: Record<string, string> = {}
  if (ids.length) {
    const { data: evs } = await sb.from('eventos_2026').select('id, cliente').in('id', ids)
    nomes = Object.fromEntries((evs ?? []).map(e => [e.id, e.cliente ?? '']))
  }
  return NextResponse.json({ ok: true, slots: (data ?? []).map(s => ({ ...s, cliente: s.evento_id ? nomes[s.evento_id] ?? '' : null })) })
}

export async function POST(req: NextRequest) {
  const { data, hora } = await req.json().catch(() => ({}))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? '') || !/^\d{2}:\d{2}$/.test(hora ?? '')) {
    return NextResponse.json({ error: 'Data ou hora inválida' }, { status: 400 })
  }
  if (data < hojeLisboa()) return NextResponse.json({ error: 'Essa data já passou' }, { status: 400 })
  const { error } = await sbAdmin().from('preparacao_slots').upsert({ data, hora }, { onConflict: 'data,hora', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const { error } = await sbAdmin().from('preparacao_slots').delete().eq('id', id).is('evento_id', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { id, libertar } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(id ?? '') || !libertar) return NextResponse.json({ error: 'pedido inválido' }, { status: 400 })
  const { error } = await sbAdmin().from('preparacao_slots')
    .update({ evento_id: null, formato: null, reservado_em: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('photo-whatsapp', { expire: 0 })
  return NextResponse.json({ ok: true })
}
