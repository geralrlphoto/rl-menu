import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getProjeto } from '@/app/portal-media/_data/mockProject'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { ref } = await params
  const { senha } = await req.json()

  if (!senha?.trim())
    return NextResponse.json({ error: 'Senha em falta' }, { status: 400 })

  /* ── ler dados do projecto ── */
  const { data: row } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mock = getProjeto(ref)
  const dados = row?.dados ? { ...(mock ?? {}), ...row.dados } : mock

  if (!dados)
    return NextResponse.json({ error: 'Portal não encontrado' }, { status: 404 })

  const senhaDados = dados.senha
  if (!senhaDados)
    return NextResponse.json({ error: 'Este portal não tem senha configurada' }, { status: 400 })

  if (senha.trim() !== senhaDados)
    return NextResponse.json({ ok: false, error: 'Senha incorrecta. Tenta novamente.' }, { status: 401 })

  /* ── definir cookie ── */
  const res = NextResponse.json({ ok: true })
  res.cookies.set(`pm_${ref.toUpperCase()}`, senhaDados, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/',
    sameSite: 'lax',
  })

  return res
}
