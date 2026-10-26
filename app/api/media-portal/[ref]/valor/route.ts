import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { aplicarValorProjeto } from '@/lib/portalMediaModelo'

// Valor do projeto (só admin), definido no cartão em Projetos. Ver aplicarValorProjeto.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { ref } = await params
  const { valor } = await req.json().catch(() => ({}))
  const total = Number(String(valor ?? '').replace(/\s/g, '').replace(',', '.'))
  const r = await aplicarValorProjeto(supabase, ref, total)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json(r)
}
