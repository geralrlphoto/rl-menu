import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('tarefas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ tarefas: [] })
  return NextResponse.json({ tarefas: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { titulo, descricao, status, data_prazo } = body

  if (!titulo?.trim()) {
    return NextResponse.json({ error: 'titulo obrigatório' }, { status: 400 })
  }

  const { data, error } = await db()
    .from('tarefas')
    .insert({
      titulo:     titulo.trim(),
      descricao:  descricao?.trim() || null,
      status:     status ?? 'NOVA',
      data_prazo: data_prazo || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tarefa: data })
}
