import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { optimizeImage, IMAGE_CACHE_CONTROL } from '@/lib/optimize-image'

export const runtime = 'nodejs'

const BUCKET = 'SECTION-IMAGES'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET
}

/* ── POST — upload photo ────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const sectionId = formData.get('sectionId') as string | null

  if (!file || !sectionId) {
    return NextResponse.json({ error: 'Missing file or sectionId' }, { status: 400 })
  }

  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${sectionId}/${Date.now()}.${ext}`

  // Redimensiona (máx 2000px, q80) antes de gravar e aplica cache de 1 ano,
  // para os uploads novos entrarem leves e bem cacheados (poupa egress).
  const { buffer, contentType } = await optimizeImage(
    Buffer.from(await file.arrayBuffer()),
    file.type || 'image/jpeg',
    file.name,
  )

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, cacheControl: IMAGE_CACHE_CONTROL, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  /* Garantir que a secção existe em menu_sections (cria automaticamente se não existir) */
  await supabase
    .from('menu_sections')
    .upsert({ id: sectionId, name: sectionId, order_index: 0 }, { onConflict: 'id', ignoreDuplicates: true })

  /* next order_index */
  const { data: existing } = await supabase
    .from('section_images')
    .select('order_index')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1

  const { data: newRow, error: insertErr } = await supabase
    .from('section_images')
    .insert({ section_id: sectionId, image_url: publicUrl, order_index: nextOrder, link_url: null })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json(newRow)
}

/* ── DELETE — remove photo ──────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()
  const { imageId } = await req.json()

  if (!imageId) {
    return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
  }

  /* fetch image_url to delete from storage */
  const { data: img } = await supabase
    .from('section_images')
    .select('image_url')
    .eq('id', imageId)
    .single()

  if (img?.image_url) {
    try {
      const url = new URL(img.image_url)
      const marker = `/storage/v1/object/public/${BUCKET}/`
      const idx = url.pathname.indexOf(marker)
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length))
        await supabase.storage.from(BUCKET).remove([storagePath])
      }
    } catch {
      /* best-effort — still delete the DB row */
    }
  }

  const { error: delErr } = await supabase
    .from('section_images')
    .delete()
    .eq('id', imageId)

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/* ── PATCH — reorder photos ─────────────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()
  const { updates } = await req.json() as { updates: { id: string; order_index: number }[] }

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'Missing updates' }, { status: 400 })
  }

  await Promise.all(
    updates.map(({ id, order_index }) =>
      supabase.from('section_images').update({ order_index }).eq('id', id)
    )
  )

  return NextResponse.json({ ok: true })
}
