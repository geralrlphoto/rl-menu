import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      nome,
      email,
      contato,
      zona_residencia,
      data_casamento,
      local_casamento,
      como_chegou,
      servicos,
      tipo_cerimonia,
      tipo_evento,
      orcamento,
      num_convidados,
      estilo,
      visao_20anos,
      trabalho_favorito,
      mensagem,
    } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome em falta' }, { status: 400 })
    }

    const { error } = await supabase.from('crm_contacts').insert({
      nome:            nome ?? '',
      email:           email ?? '',
      contato:         contato ?? '',
      data_casamento:  data_casamento ?? '',
      local_casamento: local_casamento ?? '',
      como_chegou:     como_chegou ?? '',
      servicos:        Array.isArray(servicos) ? servicos.join(', ') : (servicos ?? ''),
      tipo_cerimonia:  Array.isArray(tipo_cerimonia) ? tipo_cerimonia.join(', ') : (tipo_cerimonia ?? ''),
      tipo_evento:     tipo_evento ?? '',
      orcamento:       orcamento ?? '',
      num_convidados:  num_convidados ?? '',
      mensagem:        [zona_residencia ? `Zona: ${zona_residencia}` : '', mensagem ?? ''].filter(Boolean).join('\n\n'),
      status:          'Por Contactar',
      lead_prioridade: 'Alta',
      data_entrada:    new Date().toISOString().slice(0, 10),
    })

    if (error) throw new Error(error.message)

    // ── Email de notificação ──────────────────────────────────────────────────
    const fields: [string, string][] = [
      ['Nome',              nome],
      ['Email',             email],
      ['Contacto',          contato],
      ['Zona de Residência', zona_residencia],
      ['Data do Casamento', data_casamento],
      ['Local',             local_casamento],
      ['Tipo de Evento',    tipo_evento],
      ['Tipo de Cerimónia', Array.isArray(tipo_cerimonia) ? tipo_cerimonia.join(', ') : tipo_cerimonia],
      ['Nº de Convidados',  num_convidados],
      ['Como nos Encontrou',como_chegou],
      ['Serviços',          Array.isArray(servicos) ? servicos.join(', ') : servicos],
      ['Orçamento',         orcamento],
      ['Estilo',            estilo],
      ['Visão a 20 anos',   visao_20anos],
      ['Trabalho favorito', trabalho_favorito],
      ['Mensagem',          mensagem],
    ]

    const rows = fields
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `
        <tr>
          <td style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#666;white-space:nowrap;border-bottom:1px solid #111;">${k}</td>
          <td style="padding:8px 12px;font-size:13px;color:#ccc;border-bottom:1px solid #111;">${v}</td>
        </tr>`).join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: ['geral.rlphoto@gmail.com'],
        subject: `Nova Lead — ${nome}${data_casamento ? ' · ' + data_casamento : ''}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#000;color:#fff;">
            <p style="font-size:10px;letter-spacing:0.5em;color:#555;text-transform:uppercase;margin:0 0 28px;">RL PHOTO.VIDEO · NOVA LEAD</p>
            <h1 style="font-size:22px;font-weight:300;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;color:#fff;">${nome}</h1>
            ${email ? `<p style="font-size:12px;color:#C9A84C;letter-spacing:0.2em;margin:0 0 28px;">${email}</p>` : ''}
            <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
              ${rows}
            </table>
            <p style="font-size:10px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">RL Photo.Video · rlphotovideo.pt</p>
          </div>
        `,
      }),
    }).catch(() => null)

    // ── Email para os noivos ─────────────────────────────────────────────────
    if (email) {
      const servicosList = (Array.isArray(servicos) ? servicos.join(', ') : (servicos ?? '')).trim()

      const emailHtml = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no">
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  @media only screen and (max-width:620px){
    .container{width:100%!important;max-width:100%!important;}
    .mobile-pad{padding-left:24px!important;padding-right:24px!important;}
    .h1{font-size:30px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0c0907;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;">
<tr><td align="center" style="padding:32px 16px 48px;">

  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0"
    style="max-width:600px;width:100%;background:#13100c;border:1px solid rgba(201,168,76,0.18);border-radius:4px;overflow:hidden;">

    <!-- Topo dourado fino -->
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>

    <!-- Header logo -->
    <tr><td align="center" style="padding:40px 40px 32px;background:rgba(201,168,76,0.03);" class="mobile-pad">
      <img src="https://rl-menu-lake.vercel.app/logo-email.png" alt="RL Photo.Video"
        width="72" style="display:block;margin:0 auto 14px;width:72px;height:auto;border:0;" />
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:5px;color:#c9a84c;text-transform:uppercase;">
        RL PHOTO &amp; VIDEO
      </p>
    </td></tr>

    <!-- Divisor -->
    <tr><td style="padding:0 40px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-top:1px solid rgba(201,168,76,0.12);height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>
    </td></tr>

    <!-- Hero imagem -->
    <tr><td style="padding:0;">
      <img src="https://rl-menu-lake.vercel.app/casamentos-2028.png" alt=""
        width="600" style="display:block;width:100%;height:auto;border:0;" />
    </td></tr>

    <!-- Corpo principal -->
    <tr><td style="padding:48px 48px 40px;" class="mobile-pad">

      <!-- Etiqueta -->
      <p style="margin:0 0 20px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
        Mensagem recebida
      </p>

      <!-- Título -->
      <h1 class="h1" style="margin:0 0 20px;font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:300;line-height:1.2;color:#f5f0e8;">
        Obrigado pelo<br><em style="font-style:italic;color:#c9a84c;">vosso contacto</em>
      </h1>

      <!-- Linha dourada -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
        <td style="width:40px;border-top:1px solid #c9a84c;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>

      <!-- Texto -->
      <p style="margin:0 0 16px;font-family:'Montserrat',Arial,sans-serif;font-size:14px;font-weight:300;line-height:1.85;color:#a09585;">
        Recebemos a vossa mensagem e entraremos em contacto convosco em breve.
      </p>
      ${nome ? `<p style="margin:0 0 32px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;font-style:italic;line-height:1.6;color:#c9a84c;">${nome}</p>` : '<div style="margin-bottom:32px;"></div>'}

      ${servicosList ? `
      <!-- Serviços -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;border:1px solid rgba(201,168,76,0.2);border-radius:2px;">
        <tr><td style="padding:18px 22px;">
          <p style="margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;">Serviços</p>
          <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:300;color:#d4c9b0;line-height:1.6;">${servicosList}</p>
        </td></tr>
      </table>` : ''}

      <!-- Divisor -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
        <td style="border-top:1px solid rgba(201,168,76,0.1);height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr></table>

      <!-- Blog texto -->
      <p style="margin:0 0 24px;font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:300;line-height:1.8;color:#7a6a55;">
        Enquanto aguardam, inspirem-se no nosso blog com histórias de casamentos que eternizámos.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#c9a84c;padding:15px 36px;">
          <a href="https://rlphotovideo.pt/blog-list1"
            style="display:block;color:#0c0907;text-decoration:none;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
            Ver o Blog
          </a>
        </td>
      </tr></table>

    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 48px 32px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(201,168,76,0.08);" class="mobile-pad">
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#4a3d2a;text-transform:uppercase;text-align:center;">
        RL Photo.Video &nbsp;·&nbsp; rlphotovideo.pt
      </p>
    </td></tr>

    <!-- Base dourada -->
    <tr><td style="background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent);height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>

  </table>

</td></tr>
</table>

</body>
</html>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RL Photo.Video <geral@rlphotovideo.pt>',
          to: [email],
          subject: `Recebemos o vosso contacto — RL Photo.Video`,
          html: emailHtml,
        }),
      }).catch(() => null)
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('nova-lead error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
