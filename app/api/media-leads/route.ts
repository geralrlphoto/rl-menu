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
<body style="margin:0;padding:0;background:#080d18;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#080d18;">
<tr><td align="center" style="padding:36px 12px 44px;">

  <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;border-radius:12px;overflow:hidden;border:1px solid rgba(180,150,90,0.18);">

    <!-- Corpo principal -->
    <tr><td style="background:radial-gradient(ellipse 100% 85% at 50% 10%,#1c2a4a 0%,#101928 50%,#080d18 100%);padding:52px 52px 48px;text-align:center;">

      <!-- Logo circular com neon -->
      <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
        width="88" height="88" alt="RL Media"
        style="display:block;margin:0 auto 32px;width:88px;height:88px;object-fit:cover;border-radius:50%;border:1.5px solid rgba(200,170,100,0.65);box-shadow:0 0 10px rgba(200,170,100,0.7),0 0 24px rgba(200,170,100,0.35),0 0 50px rgba(200,170,100,0.15);" />

      <!-- Brand -->
      <p style="margin:0 0 36px;font-size:9px;letter-spacing:7px;color:rgba(180,150,90,0.6);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>

      <!-- Nome — elemento principal -->
      <h1 style="margin:0 0 10px;font-size:52px;font-weight:400;letter-spacing:12px;color:#c4a46a;text-transform:uppercase;line-height:1;font-family:Georgia,'Times New Roman',serif;">
        ${primeiroNome}
      </h1>

      <!-- Tipo de serviço -->
      <p style="margin:0 0 40px;font-size:10px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;">
        ${tipoTxt}
      </p>

      <!-- Separador com diamante -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;width:200px;">
        <tr>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
          <td style="padding:0 12px;color:rgba(180,150,90,0.6);font-size:9px;white-space:nowrap;line-height:1;">&#9670;</td>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
        </tr>
      </table>

      <!-- Mensagem -->
      <p style="margin:0 0 14px;font-size:17px;font-weight:300;color:rgba(255,255,255,0.80);line-height:1.4;">
        Recebemos o teu pedido.
      </p>
      <p style="margin:0;font-size:13px;font-weight:300;color:rgba(255,255,255,0.33);line-height:1.9;">
        A nossa equipa vai entrar em contacto<br>contigo muito em breve.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#060a12;border-top:1px solid rgba(180,150,90,0.12);padding:20px 52px;text-align:center;">
      <p style="margin:0;font-size:8px;letter-spacing:6px;color:rgba(180,150,90,0.32);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
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

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('media_leads')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
