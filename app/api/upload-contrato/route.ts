import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Contratos dos eventos: bucket PRIVADO "contratos" (têm NIF e moradas).
// O link que se guarda é /api/contrato-ficheiro?p=…, que só abre com sessão de admin.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://portal.rlphotovideo.pt'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const BUCKET = 'contratos'

export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const eventId = form.get('eventId') as string | null

    if (!file) return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 })

    const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
    const fileName = `${(eventId ?? 'contrato').replace(/[^A-Za-z0-9_-]/g, '')}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Link fixo da app (abre só com sessão de admin)
    const publicUrl = `${BASE_URL}/api/contrato-ficheiro?p=${encodeURIComponent(fileName)}`

    // Guardar no Notion se tiver eventId
    if (eventId) {
      await fetch(`https://api.notion.com/v1/pages/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            'CONTRATO': { url: publicUrl },
          },
        }),
      })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
