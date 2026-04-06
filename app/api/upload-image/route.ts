import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const name = `portal/${Date.now()}.${ext}`

  const blob = await put(name, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
