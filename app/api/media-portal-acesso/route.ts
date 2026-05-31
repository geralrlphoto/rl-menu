/* ============================================================
   /api/media-portal-acesso  (POST)
   Login do cliente no portal RL PROD.
   Recebe { email, senha }, procura em media_portais a row onde
     dados.fichaCliente.email == email   AND
     dados.senha             == senha
   Se encontrar → devolve { ok:true, ref:'XXX' } e define cookie
   pm_XXX para o middleware do /portal-media/[ref] reconhecer.
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let body: any = {}
  try { body = await req.json() } catch { /* noop */ }
  const email = String(body?.email ?? '').trim().toLowerCase()
  const senha = String(body?.senha ?? '').trim()

  if (!email || !senha) {
    return NextResponse.json({ ok: false, error: 'Indica email e palavra-passe.' }, { status: 400 })
  }

  // Procura por email — usa filtro JSONB. Apanha ambos os formatos:
  // dados.fichaCliente.email (objecto) e dados.email (top-level, se existir).
  const { data: rows, error } = await supabase
    .from('media_portais')
    .select('ref, dados')

  if (error) {
    return NextResponse.json({ ok: false, error: 'Erro de ligação. Tenta novamente.' }, { status: 500 })
  }

  // Filtrar do lado da app (mais flexível que SQL JSONB para múltiplas paths)
  const match = (rows ?? []).find((r: any) => {
    const dados = r.dados ?? {}
    const fcEmail = String(dados?.fichaCliente?.email ?? '').trim().toLowerCase()
    const topEmail = String(dados?.email ?? '').trim().toLowerCase()
    const portalSenha = String(dados?.senha ?? '').trim()
    if (!portalSenha) return false
    const emailHit = email === fcEmail || (topEmail && email === topEmail)
    if (!emailHit) return false
    return senha === portalSenha
  })

  if (!match) {
    return NextResponse.json({ ok: false, error: 'Email ou palavra-passe incorrectos.' }, { status: 401 })
  }

  const ref = String(match.ref).toUpperCase()
  const senhaDados = String(match.dados?.senha ?? '')

  const res = NextResponse.json({ ok: true, ref })
  // Cookie reconhecido pela página /portal-media/[ref] (mesmo formato que /api/media-portal/[ref]/auth)
  res.cookies.set(`pm_${ref}`, senhaDados, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
    sameSite: 'lax',
  })
  return res
}
