import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || 'cat'
}

export async function GET() {
  const { data, error } = await db()
    .from('time_block_categorias')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) return NextResponse.json({ categorias: [], error: error.message }, { status: 500 })
  return NextResponse.json({ categorias: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { label, cor, duracao_default_minutos } = body

  if (!label?.trim() || !cor) {
    return NextResponse.json({ error: 'label e cor são obrigatórios' }, { status: 400 })
  }

  const supabase = db()

  // Build a unique key from the label
  let baseKey = slugify(label)
  let key = baseKey
  let i = 2
  while (true) {
    const { data: existing } = await supabase
      .from('time_block_categorias').select('key').eq('key', key).maybeSingle()
    if (!existing) break
    key = `${baseKey}_${i++}`
    if (i > 99) { key = `${baseKey}_${Date.now()}`; break }
  }

  // Compute next ordem
  const { data: last } = await supabase
    .from('time_block_categorias')
    .select('ordem').order('ordem', { ascending: false }).limit(1).maybeSingle()
  const nextOrdem = (last?.ordem ?? 0) + 1

  const { data: row, error } = await supabase
    .from('time_block_categorias')
    .insert({
      key,
      label: label.trim(),
      cor,
      duracao_default_minutos: Math.max(1, Number(duracao_default_minutos) || 60),
      ordem: nextOrdem,
      fixo: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categoria: row })
}
