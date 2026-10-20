import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Departamento de Edição de Vídeo › avaliação de qualidade do filme na aprovação.
// POST { referencia, freelancerId, ritmo, cor, audio, historia, notas } (1 a 5 cada)
// Guarda em video_avaliacoes (a nota dos noivos fica na mesma linha, vinda do portal).

const nota = (v: unknown) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : null }

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json().catch(() => ({}))
  const referencia = String(b.referencia ?? '').trim()
  const notas = { ritmo: nota(b.ritmo), cor: nota(b.cor), audio: nota(b.audio), historia: nota(b.historia) }
  if (!referencia || Object.values(notas).some(v => v === null)) {
    return NextResponse.json({ error: 'Dá uma nota de 1 a 5 a ritmo, cor, áudio e história.' }, { status: 400 })
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await sb.from('video_avaliacoes').upsert({
    referencia, freelancer_id: b.freelancerId || null, ...notas,
    notas_rl: String(b.notas ?? '').trim() || null, avaliado_em: new Date().toISOString(),
  }, { onConflict: 'referencia' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
