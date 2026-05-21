import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function toSeconds(hms: string): number {
  // accepts "HH:MM" or "HH:MM:SS"
  const parts = hms.split(':').map(n => parseInt(n, 10))
  const [h, m, s] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
  return h * 3600 + m * 60 + s
}

function diffMinutes(start: string, end: string): number {
  const a = toSeconds(start)
  const b = toSeconds(end)
  return Math.max(0, Math.round((b - a) / 60))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')   // YYYY-MM-DD

  let q = db().from('time_blocks').select('*').order('hora_inicio', { ascending: true })
  if (data) q = q.eq('data', data)

  const { data: rows, error } = await q
  if (error) return NextResponse.json({ blocks: [], error: error.message }, { status: 500 })
  return NextResponse.json({ blocks: rows ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, categoria, titulo, cor, hora_inicio, hora_fim, ordem, evento_id } = body

  if (!data || !categoria || !titulo || !cor || !hora_inicio || !hora_fim) {
    return NextResponse.json({ error: 'campos obrigatórios em falta' }, { status: 400 })
  }
  // Note: evento_id is enforced client-side for 'editar' category, but the
  // server allows null so that auto-create and one-off imports keep working.
  const dur = diffMinutes(hora_inicio, hora_fim)
  if (dur <= 0) {
    return NextResponse.json({ error: 'a hora de fim tem de ser posterior à de início' }, { status: 400 })
  }

  const { data: row, error } = await db()
    .from('time_blocks')
    .insert({
      data,
      categoria,
      titulo: String(titulo).trim(),
      cor,
      hora_inicio,
      hora_fim,
      duracao_minutos: dur,
      ordem: ordem ?? 0,
      evento_id: evento_id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ block: row })
}
