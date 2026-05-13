import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/contrato-cps/aprovar-contrato
// Body: { referencia: string, aprovar: boolean }
//
// Marca o contrato CPS como aprovado (ou reverte) em dados_contrato_cps.
// Pré-requisito antes de criar o portal do cliente.
//
// Auth: cookie rl_auth obrigatório.

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.cookies.get('rl_auth')?.value
    if (!auth || auth !== process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const referencia = String(body.referencia ?? '').trim()
    const aprovar = body.aprovar !== false // default true
    if (!referencia) {
      return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
    }

    const sb = db()

    // Procura a entrada mais recente do contrato CPS
    const { data: contrato } = await sb
      .from('dados_contrato_cps')
      .select('id, contrato_aprovado_em')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!contrato) {
      return NextResponse.json({
        error: `Nenhum contrato encontrado para a referência ${referencia}. O cliente ainda preencheu o formulário?`,
      }, { status: 404 })
    }

    const contrato_aprovado_em = aprovar ? new Date().toISOString() : null
    await sb
      .from('dados_contrato_cps')
      .update({ contrato_aprovado_em })
      .eq('id', contrato.id)

    return NextResponse.json({ ok: true, contrato_aprovado_em })
  } catch (err: any) {
    console.error('[contrato-cps/aprovar-contrato]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
