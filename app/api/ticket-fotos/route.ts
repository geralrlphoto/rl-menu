import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FROM_EMAIL  = process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'geral.rlphoto@gmail.com'
const PRECO_FOTO  = 5
const PORTES_PAPEL = 4

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
const eur = (n: number) => `${Number(n).toFixed(2)} €`

function buildHtml(o: any): string {
  const data = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  const isPapel = o.formato === 'papel'
  const fotos = String(o.fotografias ?? '').split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean)
  const row = (label: string, value: string, strong = false) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value}</td></tr>`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Ticket Fotos/Dia</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${row('Nº do pedido', o.pedido, true)}
            ${row('Data', data)}
            ${row('Responsável pela venda', o.responsavel)}
            ${row('Cliente', o.nome)}
            ${o.noivos ? row('Nome dos noivos', o.noivos) : ''}
            ${o.data_casamento ? row('Data do casamento', o.data_casamento) : ''}
            ${row('Email', o.email)}
            ${row('Telefone', o.telefone)}
            ${isPapel && o.morada ? row('Morada', o.morada) : ''}
            ${row('Formato', isPapel ? 'Papel (carta registada)' : 'Digital')}
            ${row(`Fotografias (× ${eur(PRECO_FOTO)})`, String(o.quantidade))}
            ${fotos.length ? row('Nº das fotografias', fotos.join(', ')) : ''}
            ${row('Subtotal', eur(o.subtotal))}
            ${row('Portes', o.portes > 0 ? eur(o.portes) : 'Grátis')}
            ${row('TOTAL', eur(o.total), true)}
            ${row('Método de pagamento', o.metodo_pagamento, true)}
            ${o.metodo_pagamento === 'MBWay' ? row('Conta MB WAY', o.mbway_conta) : ''}
          </table>
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0;font-size:12px;color:#3a352e;line-height:1.7;">
              <strong style="color:#0b0a08;">Prazo de entrega:</strong>
              ${isPapel ? 'até 30 dias úteis, por carta registada.' : 'até 15 dias úteis (entrega digital).'}
            </p>
          </div>
        </td></tr>
        <tr><td style="background:#0b0a08;padding:18px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8c8170;">geral.rlphoto@gmail.com · 912 832 788</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
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

    const reg = {
      pedido, nome, email, telefone, noivos, data_casamento, morada, formato,
      quantidade, subtotal, portes, total, mensagem, fotografias,
      responsavel, responsavel_email, mbway_conta, metodo_pagamento: metodo,
      origem: 'ticket', estado: 'Aguardar', comprovativo_url: null,
      // Associa o ticket ao membro que fez a venda (o "responsável"), para que
      // apareça no "Ver Encomendas" do portal dele, filtrado por casamento.
      enviado_para_id: responsavel_id,
      enviado_para_nome: responsavel_id ? responsavel : null,
      enviado_em: responsavel_id ? new Date().toISOString() : null,
    }
    const { error: insErr } = await supabase.from('photo_orders').insert(reg)
    if (insErr) throw new Error(insErr.message)

    const html = buildHtml(reg)
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
