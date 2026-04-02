import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const BUCKET = 'contratos'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const eventId = form.get('eventId') as string | null

    if (!file) return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'pdf'
    const fileName = `${eventId ?? 'contrato'}-${Date.now()}.${ext}`
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

    // URL pública
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    const publicUrl = urlData.publicUrl

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
