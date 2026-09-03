import { NextRequest, NextResponse } from 'next/server'
import { runPreWeddingProposta } from '../_lib/preWeddingProposta'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET → verifica os eventos com envio de proposta agendado e envia o email aos
// que já estão a 60 dias (ou menos) do casamento.
// A verificação diária corre sozinha dentro de /api/newsletter-cron (cron das 8h);
// esta rota serve para forçar/testar a verificação a partir do admin.
// Fica protegida pelo cookie de admin (middleware.ts) — não está na lista pública.
// ?ref=CAS_034_26_RL → verifica apenas esse evento.
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') ?? undefined
  const r = await runPreWeddingProposta({ referencia: ref })
  return NextResponse.json(r, { status: r.ok ? 200 : 500 })
}
