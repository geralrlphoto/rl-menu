import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const { data, error } = await db().from('freelancer_edicao').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ edicao: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await db().from('freelancer_edicao').insert({ ...body, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, edicao: data })
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase.from('freelancer_edicao').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync status to portal when freelancer changes their editing state
  if (fields.status) {
    const statusMap: Record<string, string> = {
      'NOVO TRABALHO': 'Aguardar',
      'EM EDIÇÃO':     'Em Edição',
      'CONCLUÍDO':     'Concluído',
    }
    const portalEstado = statusMap[fields.status]
    if (portalEstado) {
      const { data: rec } = await supabase.from('freelancer_edicao').select('referencia').eq('id', id).single()
      if (rec?.referencia) {
        const { data: portal } = await supabase.from('portais').select('settings').ilike('referencia', rec.referencia).maybeSingle()
        if (portal) {
          await supabase.from('portais')
            .update({ settings: { ...(portal.settings ?? {}), selecao_fotos_noivos_estado: portalEstado } })
            .ilike('referencia', rec.referencia)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_edicao').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
