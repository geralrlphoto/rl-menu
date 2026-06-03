/* ============================================================
   /api/blog-ai/article  (POST) — DESATIVADO
   O blog agora funciona em modo grátis (copy-paste com Claude
   no chat). Este endpoint mantém-se apenas para devolver uma
   mensagem clara caso seja chamado por engano.
   Para usar o agente, abre /social-media/blog e clica no boneco.
   ============================================================ */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Endpoint desactivado',
      hint: 'O agente IA do blog agora funciona em modo grátis. Abre /social-media/blog, clica no boneco e segue o fluxo de copy-paste.',
    },
    { status: 410 },
  )
}
