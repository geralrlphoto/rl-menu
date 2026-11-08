/* ============================================================
   /api/blog-cancelar  (GET, público)
   Link "Não quero receber mais" do card do blog enviado às noivas.
   Valida a assinatura do link e guarda o email em blog_noivas_removidas.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assinaturaCancelar } from '@/lib/blogCancelar'

export async function GET(req: NextRequest) {
  const email = String(req.nextUrl.searchParams.get('e') ?? '').toLowerCase().trim()
  const t = req.nextUrl.searchParams.get('t') ?? ''
  const pagina = (msg: string) => new NextResponse(
    `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RL Photo Video</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0b0b;color:#efe7d6;font-family:Georgia,serif;text-align:center;padding:24px">
<div><p style="color:#d8be93;letter-spacing:.3em;font-size:12px;font-family:monospace">RL PHOTO · VIDEO</p><p style="font-size:22px;font-style:italic;max-width:420px">${msg}</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
  if (!email || t !== assinaturaCancelar(email)) return pagina('Este link não é válido.')

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await sb.from('blog_noivas_removidas').upsert({ email }, { onConflict: 'email' })
  return pagina('Feito. Não volta a receber os nossos artigos por email.')
}
