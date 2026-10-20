import { NextRequest, NextResponse } from 'next/server'
import { resolveEmailNoiva } from '../_lib/emailNoiva'
import { emailPortalPronto } from '@/lib/emailsNoivos'
import { SITE_URL } from '@/lib/site-url'

export async function POST(req: NextRequest) {
  const { email_noiva, nome_noiva, nome_noivo, referencia, password, portal_url } = await req.json().catch(() => ({}))

  const resolvedEmail = await resolveEmailNoiva(email_noiva, referencia)
  if (!resolvedEmail) {
    return NextResponse.json({ error: 'Email da noiva não encontrado. Preenche o email na ficha do evento.' }, { status: 400 })
  }

  const nomes = [nome_noiva, nome_noivo].filter(Boolean).join(' & ') || 'Noivos'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [resolvedEmail],
      subject: 'O vosso Portal dos Noivos está pronto',
      html: emailPortalPronto({ nomes, referencia, password, portalUrl: portal_url || `${SITE_URL}/login-noivos` }),
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
