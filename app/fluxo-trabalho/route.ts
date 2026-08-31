import { NextResponse } from 'next/server'
import { FLUXO_TRABALHO_HTML } from './fluxo-html'

// ─────────────────────────────────────────────────────────────────────────
//  /fluxo-trabalho — Fluxo de Trabalho dos Fotógrafos
//
//  Serve o documento HTML aprovado tal e qual (ver fluxo-html.ts). É um route
//  handler, e não uma page React, de propósito: assim o ficheiro chega ao
//  browser byte a byte igual ao original — sem layout, sem CSS global, sem
//  transposição para JSX. Fica pixel-a-pixel como o design aprovado.
//
//  Acesso: protegido no middleware (admin `rl_auth` ou freelancer `fl_session`).
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(FLUXO_TRABALHO_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
