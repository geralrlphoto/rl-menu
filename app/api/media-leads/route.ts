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

  // ── 2. Card de confirmação → cliente + cópia para o admin ver ────────
  try {
    const primeiroNome = String(body.nome).split(' ')[0]
    const tipoTxt = body.tipo || 'Produção Audiovisual'

    const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0a0a12;border:1px solid rgba(255,255,255,0.09);">

      <!-- linha topo -->
      <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.22),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

      <tr><td style="padding:52px 48px 44px;text-align:center;">

        <!-- Logo -->
        <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
          width="72" alt="RL Media"
          style="display:block;margin:0 auto 36px;width:72px;height:72px;object-fit:contain;" />

        <!-- Label -->
        <p style="margin:0 0 6px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.18);text-transform:uppercase;">RL Media &middot; Audiovisual</p>

        <!-- Divisor -->
        <table cellpadding="0" cellspacing="0" style="margin:16px auto 28px;width:32px;"><tr><td height="1" style="background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr></table>

        <!-- Título -->
        <p style="margin:0 0 6px;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">${tipoTxt}</p>
        <h1 style="margin:0 0 32px;font-size:28px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.88);text-transform:uppercase;">${primeiroNome}</h1>

        <!-- Mensagem -->
        <p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.9;font-weight:300;">
          Recebemos o teu pedido com sucesso.
        </p>
        <p style="margin:0 0 40px;font-size:12px;color:rgba(255,255,255,0.28);line-height:2;font-weight:300;">
          A nossa equipa irá analisar a tua mensagem<br>
          e entrar em contacto muito em breve.
        </p>

        <!-- Linha separadora -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;width:100%;"><tr>
          <td width="40%" height="1" style="background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</td>
          <td width="8" style="padding:0 8px;color:rgba(255,255,255,0.15);font-size:6px;text-align:center;">◆</td>
          <td width="40%" height="1" style="background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</td>
        </tr></table>

        <!-- Contacto -->
        <p style="margin:0;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.18);text-transform:uppercase;">
          geral.rlmedia@gmail.com
        </p>

      </td></tr>

      <!-- linha fundo -->
      <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.08),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- Footer -->
      <tr><td style="padding:18px 48px;text-align:center;">
        <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">
          RL Media &middot; Audiovisual
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

    // Destinatários: cliente (se tiver email) + sempre uma cópia para o admin ver
    const destinatarios: string[] = ['geral.rlmedia@gmail.com']
    if (body.email && body.email.trim()) destinatarios.push(body.email.trim())

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: RESEND_HEADERS,
      body: JSON.stringify({
        from: FROM,
        to: destinatarios,
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
