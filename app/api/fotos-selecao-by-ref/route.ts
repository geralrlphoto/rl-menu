import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ row: null })

  // Nota: a mesma referência pode ter mais do que uma seleção (ex.: casamento +
  // batizado com a mesma etiqueta). Devolvemos TODAS (mais recente primeiro).
  // `row` fica com a mais recente por retrocompatibilidade; `rows` traz todas.
  const { data, error } = await db()
    .from('fotos_selecao')
    .select('*')
    .eq('referencia', ref)
    .order('data_entrada', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ row: null, rows: [] })
  return NextResponse.json({ row: (data && data[0]) ?? null, rows: data ?? [] })
}
