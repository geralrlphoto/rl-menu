import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const supabase = db()
  const { data, error } = await supabase.from('freelancer_edicao').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []

  // ── Filtro: só mostra trabalhos onde este freelancer está atribuído
  //          como `editor_fotos` em `evento_equipa` para a referência.
  // Regra do utilizador: "se eu não escolhi ninguém aqui, não pode aparecer
  // nada no portal do membro". Aplica-se SÓ a records que têm `referencia`
  // — records manualmente criados sem referência ficam visíveis.
  try {
    const refs = Array.from(new Set(rows.filter((r: any) => r.referencia).map((r: any) => r.referencia)))
    if (refs.length === 0) return NextResponse.json({ edicao: rows })

    const { data: equipa } = await supabase
      .from('evento_equipa')
      .select('referencia, editor_fotos')
      .in('referencia', refs)

    const editorByRef = new Map<string, string[]>()
    for (const e of (equipa ?? []) as any[]) {
      if (!e.referencia) continue
      const list = Array.isArray(e.editor_fotos) ? e.editor_fotos : (e.editor_fotos ? [e.editor_fotos] : [])
      editorByRef.set(e.referencia, list)
    }

    const filtered = rows.filter((r: any) => {
      // Sem referência → mantém (job manual)
      if (!r.referencia) return true
      const editores = editorByRef.get(r.referencia)
      // Sem entrada em evento_equipa → não há editor atribuído → esconde
      if (!editores) return false
      // Freelancer não está na lista de editores → esconde
      return editores.includes(fid)
    })

    return NextResponse.json({ edicao: filtered })
  } catch (err) {
    // Se a tabela evento_equipa não existir ou falhar, devolve tudo (não bloqueia)
    console.warn('[freelancer-edicao GET] filter by evento_equipa failed:', err)
    return NextResponse.json({ edicao: rows })
  }
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
