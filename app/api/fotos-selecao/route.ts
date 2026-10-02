import { NextRequest, NextResponse } from 'next/server'
import { exigeSessao } from '@/lib/api-guard'
import { exigeAdmin } from '@/lib/api-guard'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const bloqueio = await exigeSessao(req) // admin ou equipa
  if (bloqueio) return bloqueio
  const { data, error } = await db()
    .from('fotos_selecao')
    .select('*')
    .order('date', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(req: Request) {
  const bloqueio = exigeAdmin(req) // só admin
  if (bloqueio) return bloqueio
  const { data, error } = await db()
    .from('fotos_selecao')
    .insert({ nome_noivos: 'Novo Registo' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
