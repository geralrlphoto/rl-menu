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
  const FROM = 'RL PROD <geral@rlphotovideo.pt>'

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
        to: ['geral.rlmedia@gmail.com'],
        subject: `${body.tipo?.toLowerCase().includes('batizado') ? '🕊 Batizado' : '✦ Nova Lead'} — ${body.nome}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">
            <div style="background:#0a0a0f;padding:24px 28px;">
              <p style="margin:0;font-size:10px;letter-spacing:0.4em;color:#aaa;text-transform:uppercase;">RL PROD · Photography & Video</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:300;letter-spacing:0.2em;color:#fff;text-transform:uppercase;">Nova Lead</h1>
            </div>
            <div style="background:#f9f9f9;padding:28px;">
              <p style="font-size:13px;line-height:1.8;color:#333;">${linhas}</p>
            </div>
            <div style="background:#0a0a0f;padding:14px 28px;">
              <p style="margin:0;font-size:10px;color:#555;letter-spacing:0.2em;">RL PROD CRM · Notificação automática</p>
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
    const tipoTxt = body.tipo || 'Produção Photography & Video'

    const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020810;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#020810;min-height:100vh;">
<tr><td align="center" style="padding:0;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#020810;padding:56px 16px;">
  <tr><td align="center">

    <table width="460" cellpadding="0" cellspacing="0" border="0"
      style="max-width:460px;width:100%;
             background-color:#07101f;
             background-image:
               linear-gradient(rgba(30,80,220,0.13) 1px, transparent 1px),
               linear-gradient(90deg, rgba(30,80,220,0.13) 1px, transparent 1px);
             background-size:44px 44px;
             border:1px solid rgba(40,100,255,0.22);
             border-top:none;">

      <!-- Linha neon topo -->
      <tr>
        <td height="3"
          style="background:linear-gradient(90deg,#020810,#2563eb,#020810);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <tr><td style="padding:52px 44px 44px;text-align:center;">

        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
          <tr>
            <td style="width:100px;height:100px;
                       border-radius:50%;
                       border:1px solid rgba(255,255,255,0.22);
                       box-shadow:0 0 18px rgba(255,255,255,0.1),inset 0 0 12px rgba(255,255,255,0.04);
                       background:rgba(255,255,255,0.04);
                       text-align:center;vertical-align:middle;padding:0;">
              <img src="https://rl-menu-lake.vercel.app/logo-rl-prod-branco.png"
                width="68" alt="RL PROD"
                style="display:block;margin:16px auto;width:68px;height:auto;
                       mix-blend-mode:screen;opacity:0.95;" />
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
          <tr><td height="1"
            style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent);
                   font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Badge -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 30px;">
          <tr><td style="border:1px solid rgba(96,165,250,0.35);
                         background:rgba(96,165,250,0.07);
                         padding:8px 24px;text-align:center;">
            <p style="margin:0;font-size:8px;letter-spacing:7px;
                      color:rgba(96,165,250,0.9);text-transform:uppercase;">
              Pedido Recebido
            </p>
          </td></tr>
        </table>

        <!-- Nome -->
        <p style="margin:0 0 6px;font-size:9px;letter-spacing:5px;
                  color:rgba(255,255,255,0.18);text-transform:uppercase;">Olá,</p>
        <p style="margin:0 0 36px;font-size:28px;font-weight:200;letter-spacing:6px;
                  color:rgba(255,255,255,0.88);text-transform:uppercase;">${primeiroNome}</p>

        <!-- Tipo serviço -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 32px;">
          <tr>
            <td style="border:1px solid rgba(37,99,235,0.2);
                       background:rgba(37,99,235,0.05);
                       padding:14px 22px;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:4px;
                        color:rgba(96,165,250,0.7);text-transform:uppercase;">${tipoTxt}</p>
            </td>
          </tr>
        </table>

        <!-- Mensagem -->
        <p style="margin:0 0 10px;font-size:15px;font-weight:300;
                  color:rgba(255,255,255,0.75);line-height:1.7;">
          Recebemos o teu pedido.
        </p>
        <p style="margin:0;font-size:13px;font-weight:300;
                  color:rgba(255,255,255,0.35);line-height:1.9;">
          A nossa equipa vai entrar em contacto<br>contigo muito em breve.
        </p>

      </td></tr>

      <!-- Linha neon fundo -->
      <tr>
        <td height="1"
          style="background:linear-gradient(90deg,transparent,rgba(37,99,235,0.35),transparent);
                 font-size:0;line-height:0;">&nbsp;</td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 44px;text-align:center;background:#040c1c;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;
                    color:rgba(255,255,255,0.1);text-transform:uppercase;">
            RL PROD &middot; Photography &amp; Video &middot; rlphotovideo.pt
          </p>
        </td>
      </tr>

    </table>
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
        subject: `RL PROD — Recebemos o teu pedido, ${primeiroNome}`,
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

