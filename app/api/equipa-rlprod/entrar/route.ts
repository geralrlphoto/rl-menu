import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assinaturaStaff, cookieStaff, normSenha, STAFF_COOKIE_MAX_AGE } from '@/lib/staffRlprod'

// Entrada no portal do staff: valida o link (token) + a senha e deixa o cookie do membro.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { token, senha } = await req.json().catch(() => ({})) as { token?: string; senha?: string }
  if (!token || !/^[0-9a-f]{32}$/.test(token) || !senha) return NextResponse.json({ error: 'Escreve a senha.' }, { status: 400 })

  const { data: m } = await supabase.from('media_equipa').select('id, senha, ativo').eq('acesso_token', token).maybeSingle()
  // Pequena pausa para travar tentativas em série
  await new Promise(r => setTimeout(r, 400))
  if (!m || !m.ativo || normSenha(m.senha) !== normSenha(senha)) {
    return NextResponse.json({ error: 'Senha errada. Confirma com a RL PROD.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieStaff(m.id), assinaturaStaff(token, m.senha), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: STAFF_COOKIE_MAX_AGE,
  })
  return res
}
