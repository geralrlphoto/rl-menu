/* ============================================================
   /api/social-anuncios  (GET, POST, PATCH, DELETE)
   Anúncios pagos do Instagram/Facebook, guardados à mão (ou pelo
   Claude) em social_anuncios. Lidos em /social-media/anuncios.
   ============================================================ */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const TEXTO = ['nome', 'plataforma', 'publicacao_url', 'formato', 'objetivo', 'publico', 'estado', 'inicio', 'fim', 'notas'] as const
const NUMERO = ['orcamento_diario', 'orcamento_total', 'gasto', 'visualizacoes', 'alcance', 'resultados'] as const

/** Só deixa passar os campos conhecidos; vazio passa a null. */
function limpar(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of TEXTO) if (k in body) {
    const v = String(body[k] ?? '').trim()
    out[k] = v ? v.slice(0, 500) : null
  }
  for (const k of NUMERO) if (k in body) {
    const bruto = String(body[k] ?? '').replace(',', '.').trim()
    const n = Number(bruto)
    out[k] = bruto === '' || !Number.isFinite(n) ? null : n
  }
  // colunas obrigatórias com valor por defeito
  for (const k of ['gasto', 'visualizacoes', 'resultados'] as const) if (out[k] === null) out[k] = 0
  return out
}

export async function GET(req: NextRequest) {
  const erro = exigeAdmin(req); if (erro) return erro
  const { data, error } = await db().from('social_anuncios').select('*')
    .order('fim', { ascending: false, nullsFirst: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, anuncios: data ?? [] })
}

export async function POST(req: NextRequest) {
  const erro = exigeAdmin(req); if (erro) return erro
  const campos = limpar(await req.json().catch(() => ({})))
  if (!campos.nome || !campos.objetivo) return NextResponse.json({ ok: false, error: 'Falta o nome ou o objetivo' }, { status: 400 })
  const { data, error } = await db().from('social_anuncios').insert(campos).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, anuncio: data })
}

export async function PATCH(req: NextRequest) {
  const erro = exigeAdmin(req); if (erro) return erro
  const body = await req.json().catch(() => ({}))
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ ok: false, error: 'id em falta' }, { status: 400 })
  const campos = limpar(body)
  if ('nome' in campos && !campos.nome) delete campos.nome
  if ('objetivo' in campos && !campos.objetivo) delete campos.objetivo
  const { data, error } = await db().from('social_anuncios')
    .update({ ...campos, atualizado_em: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, anuncio: data })
}

export async function DELETE(req: NextRequest) {
  const erro = exigeAdmin(req); if (erro) return erro
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: false, error: 'id em falta' }, { status: 400 })
  const { error } = await db().from('social_anuncios').delete().eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
