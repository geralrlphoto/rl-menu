import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Email do admin que recebe todos os registos de pagamento dos noivos.
const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'RL Photo.Video <geral@rlphotovideo.pt>'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const eur = (n: number) => `${Number(n).toFixed(2)} €`

// Variantes da referência (com e sem zero à frente do ano), tal como noutras
// APIs de pagamentos, para o lookup do contrato ser tolerante.
function refVariants(ref: string): string[] {
  const v = new Set<string>([ref, ref.trim()])
  v.add(ref.replace(/_(\d{2})_RL/, (_: string, y: string) => `_0${y}_RL`))
  v.add(ref.replace(/_0(\d{2})_RL/, (_: string, y: string) => `_${y}_RL`))
  return Array.from(v).filter(Boolean)
}

async function sendEmail(payload: Record<string, any>) {
  if (!process.env.RESEND_API_KEY) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.ok
}

function emailAdmin(o: any): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:1px solid #4a3a1e;border-radius:6px;overflow:hidden;">
        <tr><td style="padding:30px 44px;text-align:center;border-bottom:1px solid #2a2114;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#c9a96e;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:20px;color:#f0e8d8;font-style:italic;">Novo pagamento registado</p>
        </td></tr>
        <tr><td style="padding:28px 44px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ['Noivos', o.nome_noivos],
              ['Referência', o.referencia || '—'],
              ['Valor', eur(o.valor)],
              ['Método', o.metodo || '—'],
              ['Data', o.data],
            ].map(([k, v]) => `<tr>
              <td style="padding:9px 0;border-bottom:1px solid #241c11;font-size:12px;color:#8c7a55;">${k}</td>
              <td style="padding:9px 0;border-bottom:1px solid #241c11;font-size:13px;color:#f0e8d8;text-align:right;font-weight:bold;">${v}</td>
            </tr>`).join('')}
          </table>
          ${o.comprovativo_url ? `
          <p style="margin:24px 0 8px;font-size:10px;letter-spacing:0.3em;color:#7a6340;text-transform:uppercase;">Comprovativo</p>
          <a href="${o.comprovativo_url}" target="_blank" style="text-decoration:none;">
            <img src="${o.comprovativo_url}" alt="Comprovativo" style="width:100%;max-width:472px;border-radius:6px;border:1px solid #2a2114;display:block;" />
          </a>
          <p style="margin:10px 0 0;text-align:center;"><a href="${o.comprovativo_url}" target="_blank" style="font-size:11px;color:#c9a96e;">Abrir comprovativo em tamanho real →</a></p>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function emailNoiva(o: any): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3ede1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede1;padding:32px 16px;font-family:Georgia,serif;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#fffdf8;border:1px solid #e6dcc8;border-radius:4px;overflow:hidden;">
        <tr><td style="background:#0b0a08;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:0.45em;color:#d8be93;text-transform:uppercase;">RL Photo · Video</p>
          <p style="margin:8px 0 0;font-size:22px;color:#f0e8d8;font-style:italic;">Comprovativo de Pagamento</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:14px;color:#3a352e;line-height:1.7;">Olá ${o.nome_noivos},<br>Confirmamos que recebemos o vosso pagamento. Obrigado!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #d8be93;">
            ${[
              ['Valor pago', eur(o.valor)],
              ['Método', o.metodo || '—'],
              ['Referência', o.referencia || '—'],
              ['Data', o.data],
            ].map(([k, v]) => `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#6a6258;">${k}</td>
              <td style="padding:10px 0;border-bottom:1px solid #ece4d4;font-size:13px;color:#0b0a08;text-align:right;font-weight:bold;">${v}</td>
            </tr>`).join('')}
          </table>
          <p style="margin:22px 0 0;font-size:12px;color:#8c8170;line-height:1.7;">Este email serve como comprovativo do pagamento efetuado. Qualquer questão, responde a este email.</p>
        </td></tr>
        <tr><td style="background:#0b0a08;padding:18px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8c8170;">geral.rlphoto@gmail.com · 912 832 788</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// POST: regista um pagamento feito pelos noivos e envia email ao admin (com o
//   comprovativo) e recibo à noiva. O comprovativo já vem como URL (upload feito
//   antes via /api/upload-image).
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const nome_noivos = String(b.nome_noivos ?? '').trim()
  const referencia = String(b.referencia ?? '').trim()
  const metodo = String(b.metodo ?? '').trim()
  const comprovativo_url = String(b.comprovativo_url ?? '').trim() || null
  const valor = Number(b.valor)

  if (!nome_noivos) return NextResponse.json({ ok: false, error: 'Falta o nome dos noivos.' }, { status: 400 })
  if (!Number.isFinite(valor) || valor <= 0) return NextResponse.json({ ok: false, error: 'Indica um valor válido.' }, { status: 400 })
  if (!comprovativo_url) return NextResponse.json({ ok: false, error: 'Falta o comprovativo.' }, { status: 400 })

  const sb = db()
  const hoje = new Date().toISOString().slice(0, 10)

  // Procura o contrato para obter o email da noiva e a data do casamento.
  let emailNoivaAddr: string | null = null
  let data_casamento: string | null = null
  if (referencia) {
    const { data: cps } = await sb
      .from('dados_contrato_cps')
      .select('email_noiva, email_noivo, data_casamento')
      .in('referencia_evento', refVariants(referencia))
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    emailNoivaAddr = (cps?.email_noiva || cps?.email_noivo || '').trim() || null
    data_casamento = cps?.data_casamento ?? null
  }

  // Grava o pagamento em pagamentos_noivos (aparece em /financas).
  try {
    await sb.from('pagamentos_noivos').insert({
      nome_noivos,
      referencia: referencia || null,
      data_casamento,
      data_pagamento: hoje,
      metodo_pagamento: metodo ? [metodo] : [],
      valor_liquidado: valor,
      atualizado: false,
    })
  } catch { /* não bloqueia o envio dos emails */ }

  const dataFmt = `${hoje.slice(8, 10)}/${hoje.slice(5, 7)}/${hoje.slice(0, 4)}`
  const payload = { nome_noivos, referencia, valor, metodo, data: dataFmt, comprovativo_url }

  // Email ao admin (sempre) + recibo à noiva (se tivermos email).
  await sendEmail({
    from: FROM_EMAIL, to: [ADMIN_EMAIL], reply_to: emailNoivaAddr || undefined,
    subject: `Novo pagamento — ${nome_noivos}${referencia ? ` (${referencia})` : ''} · ${eur(valor)}`,
    html: emailAdmin(payload),
  })

  let recibo_enviado = false
  if (emailNoivaAddr && emailNoivaAddr.includes('@')) {
    recibo_enviado = await sendEmail({
      from: FROM_EMAIL, to: [emailNoivaAddr],
      subject: `Comprovativo de pagamento — ${eur(valor)}`,
      html: emailNoiva(payload),
    })
  }

  return NextResponse.json({ ok: true, recibo_enviado, recibo_para: emailNoivaAddr })
}
