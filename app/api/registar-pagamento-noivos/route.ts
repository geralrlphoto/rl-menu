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

// Card personalizado do comprovativo de pagamento. O MESMO card é enviado ao
// admin e à noiva (estilo escuro/dourado da marca, email-safe com tabelas).
function cardPagamento(o: any): string {
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f2ede4;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f2ede4;padding:36px 14px;font-family:Georgia,'Times New Roman',serif;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#0e0b07;border:1px solid #3a2e18;">
      <tr><td style="height:3px;background:#c9a96e;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:40px 48px 8px;text-align:center;">
        <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png" width="130" alt="RL Photo Video" style="width:130px;height:auto;display:inline-block;">
      </td></tr>
      <tr><td style="padding:14px 48px 0;text-align:center;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.42em;color:#c9a96e;text-transform:uppercase;">Comprovativo de Pagamento</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 48px 0;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" valign="middle"
          style="width:70px;height:70px;border:1px solid #c9a96e;border-radius:50%;color:#e6c680;font-size:30px;line-height:70px;text-align:center;">&#10003;</td></tr></table>
      </td></tr>
      <tr><td style="padding:22px 48px 0;text-align:center;">
        <p style="margin:0;font-size:30px;font-style:italic;color:#f0e8d8;">${o.nome_noivos}</p>
      </td></tr>
      <tr><td style="padding:6px 48px 0;text-align:center;">
        <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Valor Pago</p>
        <p style="margin:0;font-size:52px;line-height:1;color:#e6c680;">${eur(o.valor)}</p>
      </td></tr>
      <tr><td style="padding:24px 48px 4px;text-align:center;">
        <span style="color:#6a5430;font-size:12px;letter-spacing:0.35em;">&mdash; &middot; &#9670; &middot; &mdash;</span>
      </td></tr>
      <tr><td style="padding:8px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${[
            ['Referência', o.referencia || '—'],
            ['Método', o.metodo || '—'],
            ['Data', o.data],
          ].map(([k, v]) => `<tr>
            <td style="padding:11px 0;border-bottom:1px solid #241c11;font-size:12px;color:#8c7a55;">${k}</td>
            <td style="padding:11px 0;border-bottom:1px solid #241c11;font-size:13px;color:#f0e8d8;text-align:right;">${v}</td>
          </tr>`).join('')}
        </table>
      </td></tr>
      ${o.comprovativo_url ? `
      <tr><td style="padding:26px 48px 0;text-align:center;">
        <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Comprovativo Anexado</p>
        <a href="${o.comprovativo_url}" target="_blank" style="text-decoration:none;">
          <img src="${o.comprovativo_url}" alt="Comprovativo" width="464" style="width:100%;max-width:464px;border:1px solid #2a2114;border-radius:4px;display:block;">
        </a>
      </td></tr>` : ''}
      <tr><td style="padding:28px 48px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#8c8170;line-height:1.7;font-style:italic;">Este documento confirma o pagamento efetuado.<br>Obrigado pela vossa confiança.</p>
      </td></tr>
      <tr><td style="background:#0a0805;padding:18px 48px;text-align:center;border-top:1px solid #241c11;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;color:#9a855c;text-transform:uppercase;">RL Photo &middot; Video</p>
        <p style="margin:5px 0 0;font-size:11px;color:#6a5f4c;">geral.rlphoto@gmail.com &middot; 912 832 788</p>
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
  const cardHtml = cardPagamento(payload)

  await sendEmail({
    from: FROM_EMAIL, to: [ADMIN_EMAIL], reply_to: emailNoivaAddr || undefined,
    subject: `Novo pagamento — ${nome_noivos}${referencia ? ` (${referencia})` : ''} · ${eur(valor)}`,
    html: cardHtml,
  })

  let recibo_enviado = false
  if (emailNoivaAddr && emailNoivaAddr.includes('@')) {
    recibo_enviado = await sendEmail({
      from: FROM_EMAIL, to: [emailNoivaAddr],
      subject: `Comprovativo de pagamento — ${eur(valor)}`,
      html: cardHtml,
    })
  }

  return NextResponse.json({ ok: true, recibo_enviado, recibo_para: emailNoivaAddr })
}
