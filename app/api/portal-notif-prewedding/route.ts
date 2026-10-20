import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef, ehAdmin } from '@/lib/api-guard'
import { emailMarcarPreWedding } from '@/lib/emailsNoivos'
import { SITE_URL } from '@/lib/site-url'
import { portalPathFor } from '@/lib/noivos-session'

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
  try {
    const { emailNoiva, referencia } = await req.json().catch(() => ({}))
    const bloqueio = await exigeAcessoRef(req, referencia) // admin ou os próprios noivos
    if (bloqueio) return bloqueio

    // Só o admin pode indicar o destinatário; para os noivos vem sempre da ficha
    let email = ehAdmin(req) ? (emailNoiva ?? null) : null
    if (!email && referencia) {
      email = await getEmailFromNotion(referencia)
    }
    if (!email) {
      return NextResponse.json({ error: 'Email da noiva não encontrado' }, { status: 400 })
    }

    // Nomes, data e local para o bilhete
    const { data: p } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .from('portais').select('noiva, noivo, data, local').ilike('referencia', String(referencia ?? '')).maybeSingle()
    const html = emailMarcarPreWedding({
      nomes: [p?.noiva, p?.noivo].filter(Boolean).join(' & '),
      data: p?.data ?? null,
      local: p?.local ?? null,
      portalUrl: `${SITE_URL}${portalPathFor(String(referencia ?? ''), 'casamento')}`,
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [email],
        subject: 'O vosso Pré-Wedding — RL Photo.Video',
        html,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
    return NextResponse.json({ ok: true, email: data })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
