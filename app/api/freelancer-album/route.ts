import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aplicarEstadoAlbum, type EstadoAlbum } from '@/lib/albumEstado'
import { exigeSessao, exigeAdmin, cabecalhoInterno, exigeAdminOuProprio, ehAdmin, sessaoMembro, naoAutorizado } from '@/lib/api-guard'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const fid = req.nextUrl.searchParams.get('freelancer_id')
  // Membro da equipa só lê os próprios dados (o admin lê tudo)
  const soProprio = await exigeAdminOuProprio(req, fid)
  if (soProprio) return soProprio
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const supabase = db()
  const { data, error } = await supabase.from('freelancer_album').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []

  // ── Filtro: só mostra álbuns onde este freelancer está atribuído como
  //          `editor_album` em `evento_equipa`. Records sem referencia_album
  //          (manuais) ficam visíveis.
  try {
    const refs = Array.from(new Set(rows.filter((r: any) => r.referencia_album).map((r: any) => r.referencia_album)))
    if (refs.length === 0) return NextResponse.json({ album: rows })

    const { data: equipa } = await supabase
      .from('evento_equipa')
      .select('referencia, editor_album')
      .in('referencia', refs)

    const editorByRef = new Map<string, string[]>()
    for (const e of (equipa ?? []) as any[]) {
      if (!e.referencia) continue
      const list = Array.isArray(e.editor_album) ? e.editor_album : (e.editor_album ? [e.editor_album] : [])
      editorByRef.set(e.referencia, list)
    }

    // editor_album guarda NOMES (não ids): compara com o nome deste membro
    const { data: eu } = await supabase.from('freelancers').select('nome').eq('id', fid).maybeSingle()
    const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    const meuNome = norm(String(eu?.nome ?? ''))
    const filtered = rows.filter((r: any) => {
      if (!r.referencia_album) return true
      const editores = editorByRef.get(r.referencia_album)
      if (!editores) return false
      return editores.some(n => norm(String(n)) === meuNome || String(n) === fid)
    })

    return NextResponse.json({ album: filtered })
  } catch (err) {
    console.warn('[freelancer-album GET] filter by evento_equipa failed:', err)
    return NextResponse.json({ album: rows })
  }
}

export async function POST(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const body = await req.json()
  const { data, error } = await db().from('freelancer_album').insert({ ...body, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, album: data })
}

// Estado do álbum mudado pelo editor no portal dele: só AGUARDAR / EM EDIÇÃO.
// A maqueta segue para a RL com o link (POST /api/freelancer-album/maqueta);
// aprovar e entregar são dos noivos e da RL. Tudo passa por lib/albumEstado.ts.
const DO_EDITOR: Record<string, EstadoAlbum> = { 'AGUARDAR': 'NOVO ÁLBUM', 'EM EDIÇÃO': 'EM EDIÇÃO' }

export async function PATCH(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (fields.status === 'EM APROVAÇÃO') {
    return NextResponse.json({ error: 'Para enviar a maqueta, cola o link e carrega em Enviar para revisão.' }, { status: 400 })
  }
  if (fields.status && !DO_EDITOR[fields.status]) {
    return NextResponse.json({ error: 'Aprovar e entregar o álbum é dos noivos e da RL.' }, { status: 403 })
  }

  const supabase = db()
  const { status, ...outros } = fields
  if (Object.keys(outros).length) {
    const { error } = await supabase.from('freelancer_album').update({ ...outros, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (status) {
    const { data: record } = await supabase.from('freelancer_album').select('referencia_album, freelancer_id').eq('id', id).maybeSingle()
    if (record?.referencia_album) {
      const { data: fl } = await supabase.from('freelancers').select('nome').eq('id', record.freelancer_id).maybeSingle()
      await aplicarEstadoAlbum(req.nextUrl.origin, { referencia: record.referencia_album, estado: DO_EDITOR[status], origem: String(fl?.nome ?? 'Editor').trim() })
    } else {
      await supabase.from('freelancer_album').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    }
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_album').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
