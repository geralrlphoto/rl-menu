import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function refVariants(ref: string): string[] {
  const variants = new Set<string>([ref])
  variants.add(ref.replace(/_(\d{2})_RL/, (_: string, yr: string) => `_0${yr}_RL`))
  variants.add(ref.replace(/_0(\d{2})_RL/, (_: string, yr: string) => `_${yr}_RL`))
  return Array.from(variants)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ payments: [] })

  const variants = refVariants(ref)

  const { data, error } = await db()
    .from('pagamentos_noivos')
    .select('id, nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado, atualizado')
    .in('referencia', variants)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ payments: [] })

  const payments = (data ?? []).map(row => ({
    id:               row.id,
    nome_noivos:      row.nome_noivos,
    referencia:       row.referencia,
    data_casamento:   row.data_casamento,
    data_pagamento:   row.data_pagamento,
    fase_pagamento:   Array.isArray(row.fase_pagamento) ? row.fase_pagamento : (row.fase_pagamento ? [row.fase_pagamento] : []),
    metodo_pagamento: Array.isArray(row.metodo_pagamento) ? row.metodo_pagamento : (row.metodo_pagamento ? [row.metodo_pagamento] : []),
    valor_liquidado:  row.valor_liquidado,
    atualizado:       row.atualizado,
  }))

  return NextResponse.json({ payments })
}
