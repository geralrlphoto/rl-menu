import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ============================================================
   /api/guioes-12meses
   Estado e link do vídeo de cada mês do projecto
   "12 Meses 12 Vídeos". O texto dos guiões vive no código;
   aqui só vivem os dois campos editáveis.
   ============================================================ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ESTADOS = ['por gravar', 'gravado', 'editado', 'publicado'] as const

// GET → { meses: [{ n, estado, link }] } — uma leitura por abertura da página
export async function GET() {
  const { data, error } = await supabase
    .from('guioes_12meses')
    .select('n, estado, link')
    .order('n')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meses: data ?? [] })
}

// PATCH { n, estado?, link? } → grava só o mês tocado
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const n = Number(body.n)
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      return NextResponse.json({ error: 'n tem de ser 1 a 12' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (body.estado !== undefined) {
      if (!ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
      }
      updates.estado = body.estado
    }

    if (body.link !== undefined) {
      const link = String(body.link ?? '').trim()
      updates.link = link === '' ? null : link
    }

    const { data, error } = await supabase
      .from('guioes_12meses')
      .upsert({ n, ...updates }, { onConflict: 'n' })
      .select('n, estado, link')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, mes: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
