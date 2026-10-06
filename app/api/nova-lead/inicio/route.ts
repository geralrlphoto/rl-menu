import { NextRequest, NextResponse } from 'next/server'

// Público (/nova-lead, primeira página): assim que os noivos deixam nome e contactos
// e carregam em "Começar o nosso filme", o admin recebe logo um email com esses dados,
// mesmo que depois não acabem o briefing. O briefing completo continua em /api/nova-lead.

const esc = (s: unknown) => String(s ?? '').trim().slice(0, 200)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const nome = esc(b.nome)
  const contato = esc(b.contato)
  const email = esc(b.email)
  if (nome.length < 2 || contato.replace(/\D/g, '').length < 9 || !email.includes('@')) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }
  const linhas: [string, string][] = [
    ['Telemóvel', contato],
    ['E-mail', email],
    ['Zona de residência', esc(b.zona_residencia)],
    ['Como chegaram', esc(b.como_chegou)],
  ]
  const rows = linhas.filter(([, v]) => v).map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#666;white-space:nowrap;border-bottom:1px solid #111;">${k}</td>
      <td style="padding:8px 12px;font-size:13px;color:#ccc;border-bottom:1px solid #111;">${v}</td>
    </tr>`).join('')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: ['geral.rlphoto@gmail.com'],
      subject: `Novo contacto (briefing iniciado) · ${nome}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#000;color:#fff;">
          <p style="font-size:10px;letter-spacing:0.5em;color:#555;text-transform:uppercase;margin:0 0 28px;">RL PHOTO.VIDEO · BRIEFING INICIADO</p>
          <h1 style="font-size:22px;font-weight:300;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 6px;color:#fff;">${nome}</h1>
          <p style="font-size:12px;color:#C9A84C;letter-spacing:0.1em;margin:0 0 28px;">Começaram o briefing em /nova-lead. Se o acabarem, chega outro email com tudo.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">${rows}</table>
          <p style="font-size:10px;color:#333;letter-spacing:0.3em;text-transform:uppercase;">RL Photo.Video</p>
        </div>`,
    }),
  }).catch(() => null)

  if (!res?.ok) return NextResponse.json({ error: 'Não foi possível enviar.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
