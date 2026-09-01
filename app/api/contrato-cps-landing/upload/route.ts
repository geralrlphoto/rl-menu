import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { optimizeImage, extensaoPara, IMAGE_CACHE_CONTROL } from '@/lib/optimize-image'

export const runtime = 'nodejs'

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
    // Auth admin (só admin pode trocar fotos da landing)
    const auth = req.cookies.get('rl_auth')?.value
    if (!auth || auth !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const which = String(form.get('which') ?? '')

    if (!file)                                  return NextResponse.json({ error: 'no file' }, { status: 400 })
    if (!['casamento', 'batizado'].includes(which))
      return NextResponse.json({ error: 'invalid which' }, { status: 400 })

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    let path = `contrato-cps-landing/${which}-${Date.now()}.${ext}`

    // Redimensiona (máx 2000px, q80) antes de gravar para poupar egress.
    const { buffer: buf, contentType } = await optimizeImage(
      Buffer.from(await file.arrayBuffer()),
      file.type || 'image/jpeg',
      file.name,
    )
  // A extensão segue o formato final, para o URL não dizer .png a servir WebP.
    path = path.replace(/\.[^.]+$/, `.${extensaoPara(contentType, ext)}`)

    const sb = db()
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, {
      contentType,
      cacheControl: IMAGE_CACHE_CONTROL,
      upsert: true,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ ok: true, url: pub.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
