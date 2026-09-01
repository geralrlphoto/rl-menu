import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { optimizeImage, extensaoPara, IMAGE_CACHE_CONTROL } from '@/lib/optimize-image'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  let fileName = `proposta/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Redimensiona (máx 2000px, q80) antes de gravar para poupar egress.
  const { buffer, contentType } = await optimizeImage(
    Buffer.from(await file.arrayBuffer()),
    file.type || 'image/jpeg',
    file.name,
  )
  // A extensão segue o formato final, para o URL não dizer .png a servir WebP.
  fileName = fileName.replace(/\.[^.]+$/, `.${extensaoPara(contentType, ext)}`)

  const { error } = await supabase.storage
    .from('portal-images')
    .upload(fileName, buffer, {
      contentType,
      cacheControl: IMAGE_CACHE_CONTROL,
      upsert: false,
    })

  if (error) {
    // Se o bucket não existe, tentar criar e re-upload
    if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
      await supabase.storage.createBucket('portal-images', { public: true })
      const { error: e2 } = await supabase.storage
        .from('portal-images')
        .upload(fileName, buffer, { contentType, cacheControl: IMAGE_CACHE_CONTROL, upsert: false })
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('portal-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ url: publicUrl })
}
