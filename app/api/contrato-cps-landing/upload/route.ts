import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Upload de foto para os cards da landing /contrato-cps
// Body: FormData { file: File, which: 'casamento' | 'batizado' }
// Guarda em Supabase Storage bucket 'portal-images' com path 'contrato-cps-landing/{which}-{timestamp}.{ext}'
// Devolve URL pública.

const BUCKET = 'portal-images'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const which = String(form.get('which') ?? '')

    if (!file)                                  return NextResponse.json({ error: 'no file' }, { status: 400 })
    if (!['casamento', 'batizado'].includes(which))
      return NextResponse.json({ error: 'invalid which' }, { status: 400 })

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const path = `contrato-cps-landing/${which}-${Date.now()}.${ext}`

    const buf = Buffer.from(await file.arrayBuffer())

    const sb = db()
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ ok: true, url: pub.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
