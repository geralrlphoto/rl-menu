import { NextRequest, NextResponse } from 'next/server'

type Body = {
  to: string                // email do freelancer (destinatário)
  freelancerNome?: string
  titulo: string
  descricao?: string
  projeto?: string          // nome do casal/projeto (opcional)
  prazo: string             // dd/mm/yyyy
  hora?: string             // HH:mm
  prioridade: 'Alta' | 'Média' | 'Baixa'
  status?: string
  adminEmail?: string       // email do admin para onde voltam as respostas
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { to, freelancerNome, titulo, descricao, projeto, prazo, hora, prioridade, status, adminEmail } = body

  if (!to || !titulo || !prazo || !prioridade) {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios (to, titulo, prazo, prioridade)' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  // Codifica payload em base64url para o freelancer abrir e responder
  const payload = {
    titulo,
    projeto,
    prazo,
    hora,
    prioridade,
    freelancerNome: freelancerNome ?? 'Freelancer',
    freelancerEmail: to,
    adminEmail: adminEmail ?? 'ruimngpro@gmail.com',
  }
  const payloadStr = JSON.stringify(payload)
  // Buffer está disponível em Node runtime (Next API routes)
  const b64 = Buffer.from(payloadStr, 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const portalUrl = `https://rl-menu-lake.vercel.app/tarefa-resposta?d=${b64}`

  // Card minimalista — sem dados específicos da tarefa
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">

      <!-- Outer gold-bordered frame -->
      <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#0a0a0c;border:1px solid rgba(201,164,92,0.45);border-radius:24px;">

        <tr><td style="padding:48px 40px 40px;text-align:center;">

          <!-- Logo RL em círculo -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td align="center" width="78" height="78" style="border:1.5px solid rgba(201,164,92,0.55);border-radius:50%;background:rgba(10,10,12,0.6);">
              <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
                width="56" alt="RL"
                style="display:block;margin:0 auto;width:56px;height:56px;object-fit:contain;" />
            </td></tr>
          </table>

          <!-- PHOTO VIDEO -->
          <p style="margin:0;font-size:38px;font-weight:300;letter-spacing:8px;color:rgba(255,255,255,0.92);font-family:Georgia,serif;line-height:1;">PHOTO</p>
          <p style="margin:6px 0 14px;font-size:38px;font-weight:300;letter-spacing:8px;color:rgba(255,255,255,0.92);font-family:Georgia,serif;line-height:1;">VIDEO</p>
          <p style="margin:0 0 32px;font-size:10px;letter-spacing:6px;color:rgba(201,164,92,0.75);font-family:Georgia,serif;text-transform:uppercase;">Wedding Moments</p>

          <!-- Divider gold com sparkle -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;width:80%;"><tr>
            <td height="1" style="background:linear-gradient(90deg, transparent, rgba(201,164,92,0.5), transparent);font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>

          <!-- Ícone pessoa + download badge -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td align="center" width="160" height="160" style="border:1.5px solid rgba(201,164,92,0.55);border-radius:32px;background:radial-gradient(circle at 30% 30%, rgba(201,164,92,0.12), rgba(201,164,92,0.02));position:relative;">
              <!-- pessoa SVG inline (gold stroke) -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" style="padding:34px 0 0;position:relative;">
                <img src="https://rl-menu-lake.vercel.app/icon-person-task.png" width="80" alt=""
                  onerror="this.style.display='none'"
                  style="display:block;width:80px;height:80px;" />
                <!-- fallback emoji (caso a img acima 404) -->
                <span style="font-size:64px;line-height:1;color:#C9A45C;display:inline-block;">👤</span>
              </td></tr></table>
            </td></tr>
          </table>

          <!-- Label -->
          <p style="margin:0 0 18px;font-size:11px;letter-spacing:5px;color:rgba(201,164,92,0.75);text-transform:uppercase;font-family:Georgia,serif;font-weight:bold;">Nova Tarefa</p>

          <!-- Título -->
          <p style="margin:0 0 16px;font-size:26px;font-weight:300;letter-spacing:0.5px;color:rgba(255,255,255,0.95);font-family:Georgia,serif;line-height:1.25;">
            Nova tarefa atribuída
          </p>

          <!-- Mini divider -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 22px;width:60px;"><tr><td height="1" style="background:rgba(201,164,92,0.5);font-size:0;line-height:0;">&nbsp;</td></tr></table>

          <!-- Descrição -->
          <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;font-family:Arial,sans-serif;font-weight:300;padding:0 12px;">
            Consulte o portal para ver todos<br>
            os detalhes da tarefa atribuída a si.
          </p>

          <!-- Wave gold subtle no fim -->
          <table cellpadding="0" cellspacing="0" style="margin:32px auto 0;width:100%;"><tr>
            <td height="1" style="background:linear-gradient(90deg, transparent 0%, rgba(201,164,92,0.4) 30%, rgba(201,164,92,0.6) 50%, rgba(201,164,92,0.4) 70%, transparent 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>

        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: [to],
      subject: `Nova tarefa atribuída · RL Photo.Video`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data?.message ?? 'Erro ao enviar email' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function metaRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;font-family:Arial,sans-serif;width:80px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.85);font-family:Arial,sans-serif;font-weight:500;">${escapeHtml(value)}</td>
  </tr>`
}
