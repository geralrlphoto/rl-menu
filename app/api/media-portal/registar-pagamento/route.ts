import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const empresa    = (formData.get('empresa')    as string) || ''
  const referencia = (formData.get('referencia') as string) || ''
  const valor      = (formData.get('valor')      as string) || ''
  const metodo     = (formData.get('metodo')     as string) || ''
  const data       = (formData.get('data')       as string) || ''
  const file       = formData.get('comprovativo') as File | null

  // Upload comprovativo
  let comprativoUrl = ''
  if (file && file.size > 0) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `comprovativos/${referencia}-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error } = await supabase.storage
      .from('portal-images')
      .upload(fileName, buffer, { contentType: file.type || 'image/jpeg', upsert: false })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('portal-images')
        .getPublicUrl(fileName)
      comprativoUrl = publicUrl
    }
  }

  // Format date
  const dataPT = data
    ? new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0a0a12;border:1px solid rgba(255,255,255,0.1);">

        <!-- Top accent -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.25),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="padding:44px 48px 40px;text-align:center;">

          <!-- Logo -->
          <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
            width="72" alt="RL Media"
            style="display:block;margin:0 auto 28px;width:72px;height:72px;object-fit:contain;" />

          <!-- Label -->
          <p style="margin:0 0 4px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.18);text-transform:uppercase;">Registo de Pagamento</p>
          <p style="margin:0 0 28px;font-size:20px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.85);text-transform:uppercase;">${empresa}</p>

          <!-- Divider -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;width:40px;"><tr><td height="1" style="background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr></table>

          <!-- Details table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);">
            ${[
              ['Referência',  referencia],
              ['Valor',       `${valor} €`],
              ['Método',      metodo],
              ['Data',        dataPT],
            ].map(([label, val], i, arr) => `
            <tr>
              <td style="padding:14px 20px;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.25);text-transform:uppercase;white-space:nowrap;border-bottom:${i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">${label}</td>
              <td style="padding:14px 20px;font-size:13px;color:rgba(255,255,255,0.65);font-weight:300;border-bottom:${i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">${val}</td>
            </tr>`).join('')}
          </table>

          ${comprativoUrl ? `
          <!-- Comprovativo -->
          <p style="margin:28px 0 12px;font-size:9px;letter-spacing:4px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Comprovativo</p>
          <a href="${comprativoUrl}" style="display:block;">
            <img src="${comprativoUrl}" alt="Comprovativo"
              style="display:block;max-width:100%;width:100%;border:1px solid rgba(255,255,255,0.08);" />
          </a>
          <p style="margin:8px 0 0;font-size:9px;color:rgba(255,255,255,0.15);word-break:break-all;">${comprativoUrl}</p>
          ` : `
          <p style="margin:28px 0 0;font-size:11px;color:rgba(255,255,255,0.2);font-style:italic;">Sem comprovativo anexado.</p>
          `}

        </td></tr>

        <!-- Bottom accent -->
        <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.1),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 48px;text-align:center;">
          <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">
            RL Media &middot; Portal do Cliente &middot; rlmedia.pt
          </p>
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
      from: 'RL Media <geral@rlphotovideo.pt>',
      to: ['rl@rlmedia.pt'],
      subject: `Pagamento Registado — ${empresa} · ${referencia}`,
      html,
    }),
  })

  const result = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: result.message }, { status: 500 })
  return NextResponse.json({ ok: true, comprativoUrl })
}
