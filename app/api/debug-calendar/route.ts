import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('freelancer_casamentos')
    .select(`
      id,
      data_casamento,
      data_confirmada,
      confirmado_em,
      data_confirmada_videografo,
      confirmado_videografo_em,
      indisponivel_videografo,
      indisponivel_videografo_em,
      freelancers!inner ( nome )
    `)
    .or('data_confirmada.eq.true,indisponivel.eq.true,data_confirmada_videografo.eq.true,indisponivel_videografo.eq.true')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((c: any) => ({
    nome:                    c.freelancers?.nome,
    data_casamento:          c.data_casamento,
    data_confirmada:         c.data_confirmada,
    confirmado_em:           c.confirmado_em,
    confirmado_videografo_em: c.confirmado_videografo_em,
    indisponivel_videografo: c.indisponivel_videografo,
    indisponivel_videografo_em: c.indisponivel_videografo_em,
    // what the calendar actually uses:
    cal_date_foto:  c.data_confirmada ? (c.confirmado_em ?? null) : null,
    cal_date_video: c.data_confirmada_videografo ? (c.confirmado_videografo_em ?? null) : (c.indisponivel_videografo ? (c.indisponivel_videografo_em ?? null) : null),
  }))

  return NextResponse.json({ total: result.length, entries: result })
}
