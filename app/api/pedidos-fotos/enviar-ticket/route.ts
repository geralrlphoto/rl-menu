import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildTicketHtml } from '@/lib/ticket-html'

export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, fotografias, responsavel, metodo_pagamento, mbway_conta, created_at'

// POST { id } ou { pedido } → reenvia o ticket (o mesmo do cliente) ao email da encomenda.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = String(b.id ?? '').trim()
  const pedido = String(b.pedido ?? '').trim()
  if (!id && !pedido) return NextResponse.json({ error: 'id ou pedido obrigatório' }, { status: 400 })

  const sb = db()
  let q = sb.from('photo_orders').select(COLS)
  q = id ? q.eq('id', id) : q.eq('pedido', pedido)
  const { data: o, error } = await q.maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!o) return NextResponse.json({ error: 'encomenda não encontrada' }, { status: 404 })
  const email = String(o.email ?? '').trim()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'a encomenda não tem email do cliente' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'envio de email não configurado' }, { status: 500 })
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL, to: [email], reply_to: email,
      subject: `Comprovativo de aquisição de fotografias — ${o.pedido}`,
      html: buildTicketHtml(o),
    }),
  })
  if (!res.ok) return NextResponse.json({ error: 'falha no envio do email' }, { status: 502 })
  return NextResponse.json({ ok: true, email })
}
