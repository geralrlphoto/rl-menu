import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL  = 'geral.rlphoto@gmail.com'
const ADMIN_URL    = 'https://rl-menu-lake.vercel.app'
const IMG_BASE     = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const PORTAL_BASE  = 'https://rl-menu-lake.vercel.app/freelancer-view'
const NOTIF_IMG    = 'https://rl-menu-lake.vercel.app/email-notificacao-equipa.png'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const freelancer_id  = searchParams.get('freelancer_id')
  const casamento_id   = searchParams.get('casamento_id')
  let query = supabase()
    .from('freelancer_mensagens')
    .select('*')
    .order('created_at', { ascending: true })
  if (freelancer_id) query = query.eq('freelancer_id', freelancer_id)
  if (casamento_id)  query = query.eq('casamento_id', casamento_id)
  const { data, error } = await query
  if (error) { console.error('[freelancer-mensagens GET]', error); return NextResponse.json({ mensagens: [] }) }
  return NextResponse.json({ mensagens: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase().from('freelancer_mensagens').insert(body).select().single()
  if (error) { console.error('[freelancer-mensagens POST]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }

  // Enviar email ao admin quando o freelancer envia mensagem
  if (body.remetente === 'freelancer' && body.freelancer_id) {
    try {
      const sb = supabase()

      // Buscar nome do freelancer
      const { data: freelancer } = await sb
        .from('freelancers')
        .select('nome')
        .eq('id', body.freelancer_id)
        .single()

      // Buscar local do casamento
      const { data: casamento } = body.casamento_id
        ? await sb.from('freelancer_casamentos').select('local, data_casamento').eq('id', body.casamento_id).single()
        : { data: null }

      const nomeFree    = freelancer?.nome ?? 'Membro da equipa'
      const localEvento = casamento?.local ?? '—'
      const dataEvento  = casamento?.data_casamento ?? null
      const adminUrl    = `${ADMIN_URL}/freelancers/${body.freelancer_id}`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RL Photo.Video <geral@rlphotovideo.pt>',
          to: [ADMIN_EMAIL],
          subject: `💬 Nova mensagem de ${nomeFree} — ${localEvento}`,
          html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Corner ornaments top -->
        <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
          <td></td>
          <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
        </tr></table></td></tr>

        <tr><td style="padding:8px 48px 52px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="${IMG_BASE}/logo_rl_gold.png" width="72" alt="RL Photo Video"
            style="display:block;margin:0 auto 20px;width:72px;height:auto;opacity:0.9;" />

          <!-- Ícone mensagem em círculo -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;">
            <tr><td align="center" valign="middle" style="font-size:20px;line-height:1;">💬</td></tr>
          </table>

          <!-- Título -->
          <p style="margin:0;font-size:13px;letter-spacing:0.3em;color:#7a6340;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Nova mensagem de</p>
          <p style="margin:4px 0 28px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">${nomeFree}</p>

          <!-- Divider -->
          <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <!-- Evento -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:20px 28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.45em;color:#7a6340;text-transform:uppercase;">Evento</p>
              <p style="margin:0 ${dataEvento ? '0 12px' : '0'};font-size:20px;font-style:italic;color:#c9a96e;font-family:Georgia,'Times New Roman',serif;">${localEvento}</p>
              ${dataEvento ? `<p style="margin:0;font-size:11px;color:#7a6340;letter-spacing:0.08em;">${dataEvento}</p>` : ''}
            </td></tr>
          </table>

          <!-- Mensagem -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;width:100%;max-width:420px;">
            <tr><td style="padding:18px 24px;background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.08);border-radius:4px;text-align:left;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.4em;color:#5a4a28;text-transform:uppercase;">Mensagem</p>
              <p style="margin:0;font-size:15px;color:#d4c9b0;line-height:1.75;font-family:Georgia,'Times New Roman',serif;">${body.mensagem}</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <a href="${adminUrl}" style="display:inline-block;border:0.5px solid #6a5430;padding:14px 40px;text-decoration:none;font-size:10px;letter-spacing:0.35em;color:#c9a96e;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">
            Ver Conversa
          </a>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
          <td style="padding:0 20px 16px;vertical-align:bottom;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="text-align:left;"><p style="margin:0;font-size:8px;letter-spacing:0.38em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">RL PHOTO &middot; VIDEO</p></td>
              <td style="text-align:right;"><p style="margin:0;font-size:8px;letter-spacing:0.3em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Equipa</p></td>
            </tr></table>
          </td>
          <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
        </tr></table></td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      })
    } catch (e) {
      console.error('[freelancer-mensagens email admin]', e)
    }
  }

  // Enviar email ao freelancer quando o admin envia mensagem
  if (body.remetente === 'admin' && body.freelancer_id) {
    try {
      const sb = supabase()

      const { data: freelancer } = await sb
        .from('freelancers')
        .select('email')
        .eq('id', body.freelancer_id)
        .single()

      if (freelancer?.email) {
        const portalUrl = `${PORTAL_BASE}/${body.freelancer_id}`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [freelancer.email],
            subject: 'Tens uma nova mensagem no portal',
            html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${portalUrl}" style="display:block;text-decoration:none;">
          <img src="${NOTIF_IMG}"
            width="560" alt="Tens uma nova mensagem"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`,
          }),
        })
      }
    } catch (e) {
      console.error('[freelancer-mensagens email freelancer]', e)
    }
  }

  return NextResponse.json({ mensagem: data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabase().from('freelancer_mensagens').update(rest).eq('id', id).select().single()
  if (error) { console.error('[freelancer-mensagens PATCH]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ mensagem: data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancer_mensagens').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
