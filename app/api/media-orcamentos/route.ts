import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Orçamentos da RL PROD (antes só no localStorage do browser).
// Cada orçamento é guardado inteiro em `dados` (formato de app/media/orcamentos/dados.ts).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data, error } = await supabase.from('media_orcamentos').select('dados').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data?.dados ?? null)
  }

  const { data, error } = await supabase.from('media_orcamentos').select('dados').order('criado_em', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map(r => r.dados))
}

// Grava um ou vários orçamentos (vários = migração do localStorage)
export async function PUT(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json()
  const lista: any[] = Array.isArray(body) ? body : [body]
  const linhas = lista
    .filter(o => o && typeof o.id === 'string' && o.id)
    .map(o => ({ id: o.id, dados: o, criado_em: o.criado_em || new Date().toISOString(), atualizado_em: new Date().toISOString() }))
  if (!linhas.length) return NextResponse.json({ error: 'Orçamento inválido.' }, { status: 400 })

  const { error } = await supabase.from('media_orcamentos').upsert(linhas, { onConflict: 'id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, gravados: linhas.length })
}

export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { error } = await supabase.from('media_orcamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
