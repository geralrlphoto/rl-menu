import { NextRequest, NextResponse } from 'next/server'
import { exigeAcessoRef } from '@/lib/api-guard'
import { db, ADMIN_EMAIL } from '@/lib/portalCriar'

// POST multipart { referencia, ficheiro } — os noivos enviam o contrato assinado.
// O ficheiro segue por email para o admin (anexo) e não fica guardado na app.
// Marca portais.settings.contratoAssinadoEm (desbloqueia o portal com a adjudicação paga).

const MAX_BYTES = 4 * 1024 * 1024 // limite do pedido na Vercel (~4,5 MB)
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const referencia = String(form?.get('referencia') ?? '').trim()
  const ficheiro = form?.get('ficheiro')
  if (!referencia || !(ficheiro instanceof File)) {
    return NextResponse.json({ error: 'Escolham o ficheiro do contrato assinado.' }, { status: 400 })
  }
  const bloqueio = await exigeAcessoRef(req, referencia) // admin ou os próprios noivos
  if (bloqueio) return bloqueio
  if (ficheiro.size > MAX_BYTES) {
    return NextResponse.json({ error: 'O ficheiro tem mais de 4 MB. Enviem um PDF mais leve ou uma fotografia.' }, { status: 400 })
  }
  if (ficheiro.type && !TIPOS.includes(ficheiro.type)) {
    return NextResponse.json({ error: 'Enviem o contrato em PDF ou numa fotografia (JPG ou PNG).' }, { status: 400 })
  }

  const sb = db()
  const { data: portal } = await sb.from('portais').select('id, settings, noiva, noivo').ilike('referencia', referencia).maybeSingle()
  if (!portal) return NextResponse.json({ error: 'Portal não encontrado' }, { status: 404 })

  const nomes = [portal.noiva, portal.noivo].filter(Boolean).join(' & ') || referencia
  const ext = (ficheiro.name.split('.').pop() || 'pdf').toLowerCase()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: `✍ Contrato assinado: ${nomes} (${referencia})`,
      html: `<p style="font-family:Georgia,serif;font-size:16px">Os noivos <strong>${nomes}</strong> enviaram o contrato assinado pelo portal.</p>
<p style="font-family:Georgia,serif;font-size:14px;color:#555">Referência: ${referencia}<br>O ficheiro vai em anexo e não ficou guardado na app.</p>`,
      attachments: [{ filename: `Contrato assinado ${referencia}.${ext}`, content: Buffer.from(await ficheiro.arrayBuffer()).toString('base64') }],
    }),
  })
  if (!res.ok) {
    console.error('[portais-contrato-assinado] Resend', await res.text())
    return NextResponse.json({ error: 'Não foi possível enviar. Tentem novamente daqui a pouco.' }, { status: 502 })
  }

  const contratoAssinadoEm = new Date().toISOString()
  await sb.from('portais').update({
    settings: { ...(portal.settings ?? {}), contratoAssinadoEm },
    updated_at: contratoAssinadoEm,
  }).eq('id', portal.id)

  return NextResponse.json({ ok: true, contratoAssinadoEm })
}
