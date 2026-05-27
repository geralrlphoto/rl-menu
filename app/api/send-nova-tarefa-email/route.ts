import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PORTAL_BASE = 'https://rl-menu-lake.vercel.app/freelancer-view'
const IMG_URL     = 'https://rl-menu-lake.vercel.app/card-nova-tarefa.png'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { freelancer_id, titulo, descricao, prazo, prioridade } = await req.json().catch(() => ({}))

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
  const subject = titulo
    ? `Nova tarefa atribuída · ${titulo}`
    : 'Nova tarefa atribuída a ti'

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
            width="320" alt="Nova tarefa atribuída"
            style="display:block;width:100%;max-width:320px;border:0;" />
        </a>
        ${titulo ? `
        <p style="margin:20px 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#f0e8d8;letter-spacing:0.02em;">
          ${titulo}
        </p>` : ''}
        ${descricao ? `
        <p style="margin:8px auto 0;max-width:420px;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#a09070;line-height:1.6;font-style:italic;">
          ${descricao}
        </p>` : ''}
        ${(prazo || prioridade) ? `
        <p style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:#7a6340;letter-spacing:0.35em;text-transform:uppercase;">
          ${prioridade ? `Prioridade: ${prioridade}` : ''}${prioridade && prazo ? ' &nbsp;·&nbsp; ' : ''}${prazo ? `Prazo: ${prazo}` : ''}
        </p>` : ''}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
          <tr>
            <td align="center" style="border-radius:8px;background:#c9a96e;">
              <a href="${portalUrl}" target="_blank"
                style="display:inline-block;padding:14px 36px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.4em;font-weight:700;border-radius:8px;border:1px solid #c9a96e;">
                ABRIR PORTAL &nbsp;→
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-nova-tarefa-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
