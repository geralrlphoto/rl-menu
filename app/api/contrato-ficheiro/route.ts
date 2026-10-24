import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Abre um contrato guardado no bucket privado "contratos" (casamentos e batizados).
// O link guardado no evento/Notion é este endereço fixo; aqui, só com sessão de
// admin, gera-se um link temporário (10 min) e redireciona-se para o ficheiro.
export async function GET(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const path = req.nextUrl.searchParams.get('p') ?? ''
  if (!path || path.includes('..')) return NextResponse.json({ error: 'Ficheiro inválido.' }, { status: 400 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.storage.from('contratos').createSignedUrl(path, 600)
  if (error || !data) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl)
}
