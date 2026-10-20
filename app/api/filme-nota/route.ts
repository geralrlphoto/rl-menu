import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'

// Nota dos noivos ao filme (portal › O Nosso Filme), 1 a 5 estrelas e um comentário.
// GET ?ref=  → { nota, comentario }   ·   POST { referencia, nota, comentario }
// Fica em video_avaliacoes, ao lado das notas da RL (ranking dos editores no departamento).

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const bloqueio = await exigeAcessoRef(req, ref)
  if (bloqueio) return bloqueio
  const { data } = await db().from('video_avaliacoes').select('nota_noivos, comentario_noivos').eq('referencia', ref!).maybeSingle()
  return NextResponse.json({ nota: data?.nota_noivos ?? null, comentario: data?.comentario_noivos ?? null })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const referencia = String(b.referencia ?? '').trim()
  const bloqueio = await exigeAcessoRef(req, referencia)
  if (bloqueio) return bloqueio
  const nota = Math.round(Number(b.nota))
  if (!(nota >= 1 && nota <= 5)) return NextResponse.json({ error: 'nota inválida' }, { status: 400 })
  const { error } = await db().from('video_avaliacoes').upsert({
    referencia, nota_noivos: nota,
    comentario_noivos: String(b.comentario ?? '').trim().slice(0, 1000) || null, noivos_em: new Date().toISOString(),
  }, { onConflict: 'referencia' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
