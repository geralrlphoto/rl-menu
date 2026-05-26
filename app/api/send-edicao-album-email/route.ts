import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PORTAL_BASE = 'https://rl-menu-lake.vercel.app/freelancer-view'
const IMG_URL     = 'https://rl-menu-lake.vercel.app/card-edicao-album.png'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { freelancer_id, nome_noivos, referencia } = await req.json().catch(() => ({}))

  if (!freelancer_id) {
    return NextResponse.json({ error: 'freelancer_id obrigatório' }, { status: 400 })
  }

  const { data: freelancer, error } = await supabase()
    .from('freelancers')
    .select('id, nome, email')
    .eq('id', freelancer_id)
    .single()

  if (error || !freelancer?.email) {
    return NextResponse.json({ error: 'Freelancer não encontrado ou sem email' }, { status: 404 })
  }

  const portalUrl = `${PORTAL_BASE}/${freelancer_id}`
  const subject = nome_noivos
    ? `Nova edição de álbum · ${nome_noivos}`
    : `Nova edição de álbum atribuída a ti`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [freelancer.email],
      subject,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${portalUrl}" style="display:block;text-decoration:none;">
          <img src="${IMG_URL}"
            width="320" alt="Nova edição de álbum"
            style="display:block;width:100%;max-width:320px;border:0;" />
        </a>
        ${nome_noivos || referencia ? `
        <p style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#a09070;letter-spacing:0.05em;">
          ${nome_noivos ?? ''}${nome_noivos && referencia ? ' &middot; ' : ''}${referencia ?? ''}
        </p>` : ''}
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-edicao-album-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
