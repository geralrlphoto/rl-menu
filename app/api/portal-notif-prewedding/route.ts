import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const NOTION_TOKEN  = process.env.NOTION_TOKEN!
const EVENTOS_DB    = '1ad220116d8a804b839ddc36f1e7ecf1'

async function getEmailFromNotion(referencia: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: referencia } },
        page_size: 1,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const page = data.results?.[0]
    if (!page) return null
    return page.properties?.['E-mail da noiva']?.email ?? null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const { emailNoiva, referencia } = await req.json().catch(() => ({}))

  let email = emailNoiva ?? null
  if (!email && referencia) {
    email = await getEmailFromNotion(referencia)
  }
  if (!email) {
    return NextResponse.json({ error: 'Email da noiva não encontrado' }, { status: 400 })
  }

  // Ler card diretamente do public/
  const cardPath = path.join(process.cwd(), 'public', 'card_prewedding_marcar_mobile.png')
  const cardBase64 = fs.readFileSync(cardPath).toString('base64')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [email],
      subject: 'O seu Pré-Wedding — RL Photo.Video',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#000000;"><img src="cid:card_prewedding" alt="Pré-Wedding" style="display:block;width:100%;max-width:100%;height:auto;" /></body></html>`,
      attachments: [{
        content: cardBase64,
        filename: 'card_prewedding_marcar_mobile.png',
        content_type: 'image/png',
        content_id: 'card_prewedding',
      }],
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, email: data })
}
