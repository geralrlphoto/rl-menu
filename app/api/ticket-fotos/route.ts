import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildTicketHtml } from '@/lib/ticket-html'

const FROM_EMAIL  = process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'geral.rlphoto@gmail.com'
const PRECO_FOTO  = 5
const PORTES_PAPEL = 4

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function sendEmail(payload: Record<string, any>) {
  if (!process.env.RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// POST: cria um ticket de fotos/dia (sem comprovativo). Guarda em photo_orders
//   (origem='ticket') e envia o pedido ao responsável + admin.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const nome = (b.nome ?? '').trim(), email = (b.email ?? '').trim(), telefone = (b.telefone ?? '').trim()
  const noivos = (b.noivos ?? '').trim(), data_casamento = (b.data_casamento ?? '').trim()
  const morada = (b.morada ?? '').trim() || null
  const formato = (b.formato || 'digital').toLowerCase() === 'papel' ? 'papel' : 'digital'
  const quantidade = parseInt(b.quantidade, 10) || 0
  const fotografias = (b.fotografias ?? '').trim() || null
  const mensagem = (b.mensagem ?? '').trim() || null
  const responsavel = (b.responsavel ?? '').trim()
  const responsavel_id = (b.responsavel_id ?? '').trim() || null
  const responsavel_email = (b.responsavel_email ?? '').trim()
  const mbway_conta = (b.mbway_conta ?? '').trim()
  const envio_auto = b.envio_auto === true
  const metodo = ['Numerário', 'MBWay', 'Multibanco'].includes(b.metodo_pagamento) ? b.metodo_pagamento : ''

  // ── Validação: todos obrigatórios ──
  if (!responsavel || !mbway_conta || !metodo || !nome || !email || !telefone || !noivos || !data_casamento || !quantidade) {
    return NextResponse.json({ ok: false, error: 'Preenche todos os campos obrigatórios.' }, { status: 400 })
  }
  if (formato === 'papel' && !morada) {
    return NextResponse.json({ ok: false, error: 'A morada é obrigatória para entrega em papel.' }, { status: 400 })
  }

  const subtotal = quantidade * PRECO_FOTO
  const portes = formato === 'papel' ? (quantidade < 5 ? PORTES_PAPEL : 0) : 0
  const total = subtotal + portes

  const supabase = db()
  try {
    const ano = new Date().getFullYear()
    const { data: counter, error: cErr } = await supabase.rpc('next_photo_order_counter', { p_year: ano })
    if (cErr) throw new Error(cErr.message)
    const pedido = `RL-${ano}-${String(counter).padStart(4, '0')}`

    // Associa o ticket ao membro que fez a venda (o "responsável"), para que
    // apareça no "Ver Encomendas" do portal dele, filtrado por casamento.
    // Preferimos o id enviado pelo formulário; se faltar (ex.: bundle antigo em
    // cache no browser), resolvemos aqui pelo email e depois pelo nome. Assim a
    // encomenda fica sempre associada, sem depender do frontend.
    let enviadoParaId: string | null = responsavel_id
    let enviadoParaNome: string | null = responsavel_id ? responsavel : null
    if (!enviadoParaId && (responsavel_email || responsavel)) {
      const { data: fr } = await supabase.from('freelancers').select('id, nome, email')
      const emailLc = responsavel_email.toLowerCase()
      const nomeLc = responsavel.toLowerCase()
      const match = (fr ?? []).find((f: any) =>
        (emailLc && String(f.email ?? '').trim().toLowerCase() === emailLc)) ||
        (fr ?? []).find((f: any) => nomeLc && String(f.nome ?? '').trim().toLowerCase() === nomeLc)
      if (match) { enviadoParaId = match.id; enviadoParaNome = match.nome }
    }

    const reg = {
      pedido, nome, email, telefone, noivos, data_casamento, morada, formato,
      quantidade, subtotal, portes, total, mensagem, fotografias,
      responsavel, responsavel_email, mbway_conta, metodo_pagamento: metodo,
      origem: 'ticket', estado: 'Aguardar', comprovativo_url: null,
      // Só faz sentido em digital; o robô só apanha os digitais na mesma.
      envio_auto: envio_auto && formato === 'digital',
      enviado_para_id: enviadoParaId,
      enviado_para_nome: enviadoParaId ? (enviadoParaNome ?? responsavel) : null,
      enviado_em: enviadoParaId ? new Date().toISOString() : null,
    }
    const { error: insErr } = await supabase.from('photo_orders').insert(reg)
    if (insErr) throw new Error(insErr.message)

    const html = buildTicketHtml(reg)
    const to: string[] = []
    if (responsavel_email && responsavel_email.includes('@')) to.push(responsavel_email)
    if (email && email.includes('@')) to.push(email)  // cliente que adquiriu
    const recipients = Array.from(new Set(to))
    await sendEmail({ from: FROM_EMAIL, to: recipients, reply_to: email || undefined, subject: `Comprovativo de aquisição de fotografias — ${pedido}`, html })

    return NextResponse.json({ ok: true, pedido })
  } catch (err: any) {
    console.error('[ticket-fotos] erro:', err?.message)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro ao registar o ticket.' }, { status: 500 })
  }
}
