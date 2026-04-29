import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const { data, error } = await db()
      .from('pagamentos_noivos')
      .select('id, nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado, atualizado')
      .order('data_casamento', { ascending: true, nullsFirst: false })

    if (error) return NextResponse.json({ rows: [] })

    const rows = (data ?? []).map(row => ({
      id:               row.id,
      nome_noivos:      row.nome_noivos ?? '',
      referencia:       row.referencia ?? '',
      data_casamento:   row.data_casamento,
      data_pagamento:   row.data_pagamento,
      fase_pagamento:   Array.isArray(row.fase_pagamento) ? row.fase_pagamento : [],
      metodo_pagamento: Array.isArray(row.metodo_pagamento) ? row.metodo_pagamento : [],
      valor_liquidado:  row.valor_liquidado,
      atualizado:       row.atualizado ?? false,
    }))

    return NextResponse.json({ rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try { body = await req.json() } catch { /* sem body → linha vazia na página financas */ }

    const { nome_noivos, referencia, data_casamento, data_pagamento, fase_pagamento, metodo_pagamento, valor_liquidado } = body

    const { data, error } = await db()
      .from('pagamentos_noivos')
      .insert({
        nome_noivos:      nome_noivos ?? 'Novo Registo',
        referencia:       referencia ?? null,
        data_casamento:   data_casamento ?? null,
        data_pagamento:   data_pagamento ?? null,
        fase_pagamento:   fase_pagamento ?? [],
        metodo_pagamento: metodo_pagamento ?? [],
        valor_liquidado:  valor_liquidado ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      row: {
        id:               data.id,
        nome_noivos:      data.nome_noivos,
        referencia:       data.referencia ?? '',
        data_casamento:   data.data_casamento,
        data_pagamento:   data.data_pagamento,
        fase_pagamento:   Array.isArray(data.fase_pagamento) ? data.fase_pagamento : [],
        metodo_pagamento: Array.isArray(data.metodo_pagamento) ? data.metodo_pagamento : [],
        valor_liquidado:  data.valor_liquidado,
        atualizado:       false,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
