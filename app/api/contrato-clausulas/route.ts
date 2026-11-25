import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/contrato-clausulas?eventoId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventoId = searchParams.get('eventoId')
  if (!eventoId) return NextResponse.json({ error: 'eventoId em falta' }, { status: 400 })

  const { data, error } = await supabase
    .from('contrato_clausulas')
    .select('clausulas')
    .eq('evento_id', eventoId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Datas das assinaturas (contrato versão 2): a RL assina na data em que foi
  // criado o portal dos noivos (onde o contrato fica disponível); os noivos quando
  // o enviam assinado. Sem portal, usa a data de aprovação do contrato.
  let aprovadoEm: string | null = null
  let assinadoEm: string | null = null
  const { data: ev } = await supabase.from('eventos_2026').select('referencia').eq('id', eventoId).maybeSingle()
  if (ev?.referencia) {
    const [{ data: cps }, { data: portal }] = await Promise.all([
      supabase.from('dados_contrato_cps').select('contrato_aprovado_em')
        .ilike('referencia_evento', ev.referencia).not('contrato_aprovado_em', 'is', null)
        .order('contrato_aprovado_em', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('portais').select('created_at, assinado:settings->>contratoAssinadoEm').ilike('referencia', ev.referencia).maybeSingle(),
    ])
    aprovadoEm = (portal as any)?.created_at ?? cps?.contrato_aprovado_em ?? null
    assinadoEm = (portal as any)?.assinado ?? null
  }
  return NextResponse.json({ clausulas: data?.clausulas ?? null, aprovadoEm, assinadoEm })
}

// POST /api/contrato-clausulas  { eventoId, clausulas }
export async function POST(req: Request) {
  const { eventoId, clausulas } = await req.json()
  if (!eventoId || !clausulas) return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })

  const { error } = await supabase
    .from('contrato_clausulas')
    .upsert({ evento_id: eventoId, clausulas, updated_at: new Date().toISOString() }, { onConflict: 'evento_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
