import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'portal-images'

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 })

  // Create bucket if it doesn't exist yet
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name)
  return NextResponse.json({ url: data.publicUrl })
}
