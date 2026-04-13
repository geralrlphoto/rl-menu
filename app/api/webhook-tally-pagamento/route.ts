import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tally webhook — Registo de Pagamento (https://tally.so/r/A72PQB)
// On submission:
//   1. Guarda em Supabase (pagamentos_noivos)
//   2. Envia email de comprovativo ao CLIENTE (se tiver email)
//   3. Envia notificação ao ADMIN (Rui)

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const RESEND_KEY  = process.env.RESEND_API_KEY!
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rl-menu-lake.vercel.app'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Helper: extrair campo pelo label ─────────────────────────────────────────
function getField(fields: any[], ...labels: string[]): string | null {
  for (const label of labels) {
    const f = fields.find(
      (f: any) => f.label?.trim().toLowerCase() === label.trim().toLowerCase()
    )
    if (f && f.value !== null && f.value !== undefined) {
      const v = String(f.value).trim()
      if (v) return v
    }
  }
  return null
}

// ─── Email comprovativo → CLIENTE ─────────────────────────────────────────────
function buildComprovatvoClienteEmail(data: {
  nome_noivos: string
  referencia: string | null
  valor: string | null
  forma_pagamento: string | null
  data_pagamento: string | null
  notas: string | null
}): string {
  const valorFormatado = data.valor
    ? data.valor.includes('€') ? data.valor : `${data.valor} €`
    : null

  const dataFormatada = data.data_pagamento
    ? (() => {
        try {
          return new Date(data.data_pagamento + 'T12:00:00').toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'long', year: 'numeric'
          })
        } catch { return data.data_pagamento }
      })()
    : new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Cantos superiores -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <!-- Check circle -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <!-- Olá! -->
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, ${data.nome_noivos.split(' ')[0]}!</p>

          <!-- Título -->
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Pagamento</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">registado.</p>

          <!-- Divider -->
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <!-- Texto -->
          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            Recebemos o registo do vosso pagamento.<br>
            <strong style="color:#c9b88a;font-weight:500;">Obrigado pela vossa confiança.</strong>
          </p>

          <!-- Caixa detalhes -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:400px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Noivos</p>
              <p style="margin:0 0 20px;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${data.nome_noivos}</p>

              ${data.referencia ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Referência</p>
              <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.1em;color:#b8a070;">${data.referencia}</p>
              ` : ''}

              ${valorFormatado ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Valor</p>
              <p style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f0e8d8;">${valorFormatado}</p>
              ` : ''}

              ${data.forma_pagamento ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Forma de Pagamento</p>
              <p style="margin:0 0 16px;font-size:13px;color:#d4c9b0;">${data.forma_pagamento}</p>
              ` : ''}

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Data</p>
              <p style="margin:0;font-size:13px;color:#d4c9b0;">${dataFormatada}</p>

            </td></tr>
          </table>

          <!-- Texto final -->
          <p style="margin:0 0 8px;font-size:14px;color:#7a6a50;line-height:1.8;">
            Para qualquer questão estamos sempre disponíveis.
          </p>
          <p style="margin:0;font-size:14px;color:#7a6a50;line-height:1.8;">
            <a href="mailto:${ADMIN_EMAIL}" style="color:#c9a96e;text-decoration:none;">${ADMIN_EMAIL}</a>
          </p>

        </td></tr>

        <!-- Cantos inferiores -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Email notificação → ADMIN ────────────────────────────────────────────────
function buildAdminNotifEmail(data: {
  nome_noivos: string
  referencia: string | null
  valor: string | null
  forma_pagamento: string | null
  email_cliente: string | null
  notas: string | null
}): string {
  const valorFormatado = data.valor
    ? data.valor.includes('€') ? data.valor : `${data.valor} €`
    : null

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Novo pagamento</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">registado.</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:400px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Noivos</p>
              <p style="margin:0 0 20px;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${data.nome_noivos}</p>

              ${data.referencia ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Referência</p>
              <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.1em;color:#b8a070;">${data.referencia}</p>
              ` : ''}

              ${valorFormatado ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Valor</p>
              <p style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f0e8d8;">${valorFormatado}</p>
              ` : ''}

              ${data.forma_pagamento ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Forma de Pagamento</p>
              <p style="margin:0 0 16px;font-size:13px;color:#d4c9b0;">${data.forma_pagamento}</p>
              ` : ''}

              ${data.email_cliente ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Email do Cliente</p>
              <p style="margin:0 0 16px;font-size:13px;color:#d4c9b0;">${data.email_cliente}</p>
              ` : ''}

              ${data.notas ? `
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Notas</p>
              <p style="margin:0;font-size:13px;color:#d4c9b0;">${data.notas}</p>
              ` : ''}

            </td></tr>
          </table>

          <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
            Consulta o <strong style="color:#c9b88a;font-weight:500;">painel de administração</strong><br>para veres todos os detalhes.
          </p>

        </td></tr>

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Enviar email via Resend ───────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [to],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[webhook-tally-pagamento] Resend error:', err)
    return false
  }
  return true
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    // Extrair campos do formulário
    // ⚠️ Ajusta os labels abaixo para corresponderem EXATAMENTE aos campos do teu formulário Tally
    const nome_noivos     = getField(fields, 'Nome dos Noivos', 'NOME DOS NOIVOS', 'Nome', 'NOME') ?? 'Noivos'
    const referencia      = getField(fields, 'Referência', 'REFERÊNCIA', 'Referencia', 'REFERENCIA', 'Referência do Evento', 'REFERÊNCIA DO EVENTO')
    const email_cliente   = getField(fields, 'Email', 'EMAIL', 'E-mail', 'E-MAIL', 'Email do Cliente', 'EMAIL DO CLIENTE')
    const valor           = getField(fields, 'Valor a Liquidar', 'VALOR A LIQUIDAR', 'Valor', 'VALOR', 'Valor Pago', 'VALOR PAGO', 'Montante', 'MONTANTE')
    const forma_pagamento = getField(fields, 'Forma de Pagamento', 'FORMA DE PAGAMENTO', 'Método de Pagamento', 'MÉTODO DE PAGAMENTO')
    const data_pagamento  = getField(fields, 'Data', 'DATA', 'Data de Pagamento', 'DATA DE PAGAMENTO')
    const notas           = getField(fields, 'Notas', 'NOTAS', 'Observações', 'OBSERVAÇÕES', 'Nota', 'NOTA')

    const paymentData = { nome_noivos, referencia, valor, forma_pagamento, data_pagamento, email_cliente, notas }

    console.log('[webhook-tally-pagamento] Recebido:', paymentData)

    // ── 1. Guardar em Supabase ───────────────────────────────────────────────
    const valorNumerico = valor ? parseFloat(valor.replace(/[^0-9.,]/g, '').replace(',', '.')) : null
    db().from('pagamentos_noivos').insert({
      tally_response_id: body.data?.responseId ?? null,
      nome_noivos,
      referencia:       referencia ?? null,
      data_pagamento:   data_pagamento ?? null,
      metodo_pagamento: forma_pagamento ? [forma_pagamento] : [],
      valor_liquidado:  isNaN(valorNumerico!) ? null : valorNumerico,
      email_cliente:    email_cliente ?? null,
      notas:            notas ?? null,
    }).then(({ error }) => {
      if (error) console.error('[webhook-tally-pagamento] Supabase error:', error)
      else console.log('[webhook-tally-pagamento] Supabase guardado')
    })

    // ── 2. Email ao CLIENTE (se tiver email) ────────────────────────────────
    if (email_cliente) {
      const htmlCliente = buildComprovatvoClienteEmail(paymentData)
      const sent = await sendEmail(
        email_cliente,
        `✓ Pagamento registado — RL Photo Video`,
        htmlCliente
      )
      console.log('[webhook-tally-pagamento] Email cliente:', sent ? 'OK' : 'FALHOU')
    } else {
      console.warn('[webhook-tally-pagamento] Sem email do cliente — comprovativo não enviado')
    }

    // ── 2. Notificação ao ADMIN ──────────────────────────────────────────────
    const htmlAdmin = buildAdminNotifEmail(paymentData)
    const adminSent = await sendEmail(
      ADMIN_EMAIL,
      `💳 Pagamento registado — ${nome_noivos}${referencia ? ` (${referencia})` : ''}`,
      htmlAdmin
    )
    console.log('[webhook-tally-pagamento] Email admin:', adminSent ? 'OK' : 'FALHOU')

    return NextResponse.json({
      ok: true,
      emailCliente: email_cliente ? 'enviado' : 'sem email',
      emailAdmin: adminSent ? 'enviado' : 'falhou',
    })

  } catch (err: any) {
    console.error('[webhook-tally-pagamento] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Tally verifica o endpoint com GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-pagamento' })
}
