import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { optimizeImage, extensaoPara, IMAGE_CACHE_CONTROL } from '@/lib/optimize-image'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'portal-images'

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 })

  // Rota pública (propostas, registo de pagamento): só imagens e PDF, até 20 MB.
  // Impede alojar HTML/SVG ou outros ficheiros no domínio do Supabase.
  const tipo = (file.type || '').toLowerCase()
  const permitido = /^image\/(jpeg|png|webp|gif|heic|heif|avif)$/.test(tipo) || tipo === 'application/pdf'
  if (!permitido) return NextResponse.json({ error: 'Tipo de ficheiro não permitido' }, { status: 415 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 20 MB)' }, { status: 413 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'

  // Redimensiona e converte para WebP antes de gravar, para poupar egress.
  const { buffer, contentType } = await optimizeImage(
    Buffer.from(await file.arrayBuffer()),
    file.type || 'image/jpeg',
    file.name,
  )
  // A extensão segue o formato final, para o URL não dizer .png a servir WebP.
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensaoPara(contentType, ext)}`

  const { error } = await supabase.storage.from(BUCKET).upload(name, buffer, {
    contentType,
    cacheControl: IMAGE_CACHE_CONTROL,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return NextResponse.json({ url: data.publicUrl })
}
