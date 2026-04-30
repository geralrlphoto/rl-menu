import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('media_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('media_leads')
    .insert([{
      nome:       body.nome,
      empresa:    body.empresa || null,
      email:      body.email || null,
      telefone:   body.telefone || null,
      tipo:       body.tipo || null,
      fonte:      body.fonte || null,
      mensagem:   body.mensagem || null,
      estado:     body.estado || 'Novo',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const RESEND_HEADERS = {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  }
  const FROM = 'RL Media <geral@rlphotovideo.pt>'

  // ── 1. Notificação interna para o admin ──────────────────────────────
  try {
    const linhas = [
      `<b>Nome:</b> ${body.nome}`,
      body.empresa  ? `<b>Empresa:</b> ${body.empresa}` : null,
      body.email    ? `<b>Email:</b> ${body.email}`     : null,
      body.telefone ? `<b>Telefone:</b> ${body.telefone}` : null,
      body.tipo     ? `<b>Tipo de Serviço:</b> ${body.tipo}` : null,
      body.fonte    ? `<b>Como nos encontrou:</b> ${body.fonte}` : null,
      body.mensagem ? `<b>Mensagem:</b><br>${String(body.mensagem).replace(/\n/g, '<br>')}` : null,
    ].filter(Boolean).join('<br><br>')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: RESEND_HEADERS,
      body: JSON.stringify({
        from: FROM,
        to: 'geral.rlmedia@gmail.com',
        subject: `Nova Lead — ${body.nome}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
            <div style="background:#0a0a0f;padding:24px 28px;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;color:#aaa;text-transform:uppercase;">RL Media · Audiovisual</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:300;letter-spacing:0.2em;color:#fff;text-transform:uppercase;">Nova Lead</h1>
            </div>
            <div style="background:#f9f9f9;padding:28px;">
              <p style="font-size:13px;line-height:1.8;color:#333;">${linhas}</p>
            </div>
            <div style="background:#0a0a0f;padding:14px 28px;">
              <p style="margin:0;font-size:10px;color:#555;letter-spacing:0.2em;">RL Media CRM · Notificação automática</p>
            </div>
          </div>
        `,
      }),
    })
  } catch (_e) { /* não bloqueia */ }

  // ── 2. Card de confirmação → cliente ────────────────────────────────
  try {
    if (!body.email || !body.email.trim()) return NextResponse.json({ ok: true, lead: data })

    const primeiroNome = String(body.nome).split(' ')[0]
    const tipoTxt = body.tipo || 'Produção Audiovisual'

    const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020204;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#020204;">
<tr><td align="center" style="padding:48px 16px 56px;">

  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

    <!-- Accent top -->
    <tr><td height="1" style="background:linear-gradient(90deg,#020204 0%,rgba(255,255,255,0.45) 50%,#020204 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Card -->
    <tr><td style="background:#0c0c16;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);padding:64px 60px 60px;text-align:center;">

      <!-- Logo -->
      <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
        width="60" height="60" alt="RL Media"
        style="display:block;margin:0 auto 44px;width:60px;height:60px;object-fit:contain;opacity:0.9;" />

      <!-- Eyebrow -->
      <p style="margin:0 0 44px;font-size:9px;letter-spacing:7px;color:rgba(255,255,255,0.18);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>

      <!-- Nome do cliente -->
      <h1 style="margin:0 0 10px;font-size:40px;font-weight:200;letter-spacing:9px;color:rgba(255,255,255,0.92);text-transform:uppercase;line-height:1.05;">
        ${primeiroNome}
      </h1>

      <!-- Tipo de serviço -->
      <p style="margin:0 0 52px;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,0.2);text-transform:uppercase;">
        ${tipoTxt}
      </p>

      <!-- Linha fina -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;">
        <tr><td width="56" height="1" style="background:rgba(255,255,255,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <!-- Mensagem principal -->
      <p style="margin:0 0 14px;font-size:17px;font-weight:300;color:rgba(255,255,255,0.58);line-height:1.5;">
        Recebemos o teu pedido.
      </p>

      <!-- Submensagem -->
      <p style="margin:0;font-size:13px;font-weight:300;color:rgba(255,255,255,0.26);line-height:1.9;">
        A nossa equipa vai entrar em contacto<br>contigo muito em breve.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#07070e;border:1px solid rgba(255,255,255,0.05);border-top:none;padding:22px 60px;text-align:center;">
      <p style="margin:0;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;">
        RL Media &nbsp;&middot;&nbsp; Audiovisual
      </p>
    </td></tr>

  </table>

</td></tr>
</table>

</body>
</html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: RESEND_HEADERS,
      body: JSON.stringify({
        from: FROM,
        to: [body.email.trim()],
        subject: `RL Media — Recebemos o teu pedido, ${primeiroNome}`,
        html: cardHtml,
      }),
    })
  } catch (_e) { /* não bloqueia */ }

  return NextResponse.json({ ok: true, lead: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  const { error } = await supabase
    .from('media_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
