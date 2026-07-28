import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Config ───────────────────────────────────────────────────────────────────
const ALLOW_ORIGIN = 'https://rlphotovideo.pt'
const FROM_EMAIL   = process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>'
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL ?? 'geral.rlphoto@gmail.com'
const PRECO_FOTO   = 5     // € por fotografia
const PORTES_PAPEL = 4     // € (papel, < 5 fotos)

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const CORS = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
}

function json(body: any, status = 200) {
  return NextResponse.json(body, { status, headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

const eur = (n: number) => `${Number(n).toFixed(2)} €`

// ── Template HTML do email (tom RL) ──────────────────────────────────────────
function buildEmailHtml(o: {
  pedido: string; nome: string; email: string; telefone: string; morada?: string | null
  noivos?: string | null; data_casamento?: string | null; fotografias?: string | null
  formato: string; quantidade: number; subtotal: number; portes: number; total: number
}): string {
  const data = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  const isPapel = o.formato === 'papel'
  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:${strong ? '#0b0a08' : '#3a352e'};font-weight:${strong ? 700 : 500};text-align:right;">${value}</td>
    </tr>`
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <!-- Header escuro -->
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Comprovativo de aquisição</p>
        </td></tr>
        <!-- Corpo -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 4px;font-size:18px;color:#0b0a08;">Olá, ${o.nome}!</p>
          <p style="margin:0 0 20px;font-size:13px;color:#6a6258;line-height:1.7;">
            Recebemos o teu pedido de fotografias. Aqui ficam os detalhes:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${row('Nº do pedido', o.pedido, true)}
            ${row('Data', data)}
            ${row('Nome', o.nome)}
            ${o.noivos ? row('Nome dos noivos', o.noivos) : ''}
            ${o.data_casamento ? row('Data do casamento', o.data_casamento) : ''}
            ${row('Email', o.email)}
            ${row('Telefone', o.telefone)}
            ${isPapel && o.morada ? row('Morada', o.morada) : ''}
            ${row('Formato', isPapel ? 'Papel (carta registada)' : 'Digital')}
            ${row(`Fotografias (× ${eur(PRECO_FOTO)})`, String(o.quantidade))}
            ${o.fotografias ? row('Nº das fotografias', String(o.fotografias).split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(', ')) : ''}
            ${row('Subtotal', eur(o.subtotal))}
            ${row('Portes', o.portes > 0 ? eur(o.portes) : 'Grátis')}
            ${row('TOTAL', eur(o.total), true)}
          </table>
          <div style="margin:24px 0 0;padding:16px 18px;background:#faf5ea;border:1px solid #ece4d4;border-radius:4px;">
            <p style="margin:0 0 6px;font-size:12px;color:#3a352e;line-height:1.7;">
              <strong style="color:#0b0a08;">Prazo de entrega:</strong>
              ${isPapel ? 'até 30 dias úteis, por carta registada.' : 'até 15 dias úteis (entrega digital).'}
            </p>
            <p style="margin:0;font-size:12px;color:#3a352e;line-height:1.7;">
              <strong style="color:#0b0a08;">Pagamento:</strong> MB WAY 916 162 728 (Liliana Gonçalves) — comprovativo recebido.
            </p>
          </div>
        </td></tr>
        <!-- Rodapé -->
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

// ── POST /api/photo-orders ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let form: FormData
  try { form = await req.formData() } catch { return json({ ok: false, error: 'Pedido inválido' }, 400) }

  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }
  const nome = get('nome'), email = get('email'), telefone = get('telefone')
  const noivos = get('noivos')
  const data_casamento = get('data_casamento')
  const morada = get('morada') || null
  const formato = (get('formato') || 'digital').toLowerCase() === 'papel' ? 'papel' : 'digital'
  const quantidade = parseInt(get('quantidade') || '0', 10) || 0
  const fotografias = get('fotografias') || null
  const mensagem = get('mensagem') || null
  const comprovativo = form.get('comprovativo')

  // ── Validação ──
  if (!nome || !email || !telefone || !noivos || !data_casamento || !quantidade) {
    return json({ ok: false, error: 'Faltam campos obrigatórios (nome, email, telefone, noivos, data do casamento, fotografias).' }, 400)
  }
  if (formato === 'papel' && !morada) {
    return json({ ok: false, error: 'A morada é obrigatória para entrega em papel.' }, 400)
  }
  if (!(comprovativo instanceof File) || comprovativo.size === 0) {
    return json({ ok: false, error: 'O comprovativo de pagamento é obrigatório.' }, 400)
  }

  // ── Valores (recalculados no servidor) ──
  const subtotal = quantidade * PRECO_FOTO
  const portes = formato === 'papel' ? (quantidade < 5 ? PORTES_PAPEL : 0) : 0
  const total = subtotal + portes

  const supabase = db()

  try {
    // ── Nº de pedido sequencial: RL-<ano>-<4 dígitos> ──
    const ano = new Date().getFullYear()
    const { data: counter, error: cErr } = await supabase.rpc('next_photo_order_counter', { p_year: ano })
    if (cErr) throw new Error(cErr.message)
    const pedido = `RL-${ano}-${String(counter).padStart(4, '0')}`

    // ── Upload do comprovativo ──
    const ext = (comprovativo.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${ano}/${pedido}.${ext}`
    const bytes = new Uint8Array(await comprovativo.arrayBuffer())
    const { error: upErr } = await supabase.storage.from('comprovativos')
      .upload(path, bytes, { contentType: comprovativo.type || 'application/octet-stream', upsert: true })
    if (upErr) throw new Error(upErr.message)
    // Signed URL de validade longa (~10 anos)
    const { data: signed } = await supabase.storage.from('comprovativos').createSignedUrl(path, 315360000)
    const comprovativo_url = signed?.signedUrl ?? ''

    // ── Insere o pedido ──
    const { error: insErr } = await supabase.from('photo_orders').insert({
      pedido, nome, email, telefone, noivos, data_casamento, morada, formato,
      quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url,
      origem: 'adquirir', // aquisição via link /adquirir-fotografias (distingue dos tickets)
    })
    if (insErr) throw new Error(insErr.message)

    // ── Emails ──
    const html = buildEmailHtml({ pedido, nome, email, telefone, noivos, data_casamento, fotografias, morada, formato, quantidade, subtotal, portes, total })
    const b64 = Buffer.from(bytes).toString('base64')

    // (A) cliente
    await sendEmail({
      from: FROM_EMAIL, to: [email],
      subject: `Comprovativo de aquisição de fotografias — ${pedido}`,
      html,
    })
    // (B) admin (com anexo do comprovativo)
    await sendEmail({
      from: FROM_EMAIL, to: [ADMIN_EMAIL], reply_to: email,
      subject: `Novo pedido de fotografias — ${pedido} (${nome})`,
      html,
      attachments: [{ filename: comprovativo.name || `comprovativo.${ext}`, content: b64 }],
    })

    return json({ ok: true, pedido })
  } catch (err: any) {
    console.error('[photo-orders] erro:', err?.message)
    return json({ ok: false, error: err?.message ?? 'Erro ao processar o pedido.' }, 500)
  }
}
