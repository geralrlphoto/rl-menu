import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  const fileName = `proposta/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from('portal-images')
    .upload(fileName, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (error) {
    // Se o bucket não existe, tentar criar e re-upload
    if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
      await supabase.storage.createBucket('portal-images', { public: true })
      const { error: e2 } = await supabase.storage
        .from('portal-images')
        .upload(fileName, buffer, { contentType: file.type || 'image/jpeg', upsert: false })
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
