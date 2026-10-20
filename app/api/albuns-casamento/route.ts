import { NextRequest, NextResponse } from 'next/server'
import { ehAdmin, sessaoNoivos, sessaoMembro, naoAutorizado } from '@/lib/api-guard'
import { aplicarEstadoAlbum, ESTADOS_ALBUM, type EstadoAlbum } from '@/lib/albumEstado'
import { exigeAdmin } from '@/lib/api-guard'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  // Admin vê todos; um membro (editor de álbuns) só os álbuns que tem no seu portal
  let refs: string[] | null = null
  if (!ehAdmin(req)) {
    const membro = await sessaoMembro(req)
    if (!membro) return naoAutorizado()
    const { data: meus } = await db().from('freelancer_album').select('referencia_album').eq('freelancer_id', membro.id)
    refs = (meus ?? []).map(m => m.referencia_album).filter(Boolean) as string[]
    if (!refs.length) return NextResponse.json({ rows: [] })
  }
  let q = db().from('albuns_casamento').select('*').order('created_at', { ascending: false })
  if (refs) q = q.in('ref_evento', refs)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req) // só admin
  if (bloqueio) return bloqueio
  const body = await req.json().catch(() => ({}))
  const { nome, ref_evento, num_fotografias, data_entrega_fotos, check_existing } = body

  const supabase = db()

  // Check for existing entry — if found, update fields and return
  if (check_existing && ref_evento) {
    const { data: existing } = await supabase
      .from('albuns_casamento')
      .select('id')
      .eq('ref_evento', ref_evento)
      .maybeSingle()
    if (existing) {
      const updateFields: Record<string, any> = {}
      if (nome) updateFields.nome = nome
      if (num_fotografias) updateFields.num_fotografias = num_fotografias
      if (data_entrega_fotos) updateFields.data_entrega_fotos = data_entrega_fotos
      if (Object.keys(updateFields).length > 0) {
        await supabase.from('albuns_casamento')
          .update(updateFields)
          .eq('id', existing.id)
      }
      const { data: row } = await supabase
        .from('albuns_casamento')
        .select('*')
        .eq('id', existing.id)
        .maybeSingle()
      return NextResponse.json({ row, already_exists: true })
    }
  }

  const { data, error } = await supabase
    .from('albuns_casamento')
    .insert({
      nome: nome || 'Novo Álbum',
      status: 'NOVO ÁLBUM',
      ref_evento: ref_evento ?? null,
      num_fotografias: num_fotografias ?? null,
      data_entrega_fotos: data_entrega_fotos ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { id, status, data_aprovacao, data_prevista_entrega } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()
  const { data: alb } = await supabase.from('albuns_casamento').select('ref_evento, status').eq('id', id).maybeSingle()
  if (!alb) return NextResponse.json({ error: 'álbum não encontrado' }, { status: 404 })
  const admin = ehAdmin(req)

  // Os noivos só aprovam o álbum do próprio casamento, e só depois de a RL lhes enviar a maqueta
  if (!admin) {
    const nv = await sessaoNoivos(req)
    const proprio = !!nv && !!alb.ref_evento && String(alb.ref_evento).toLowerCase() === nv.referencia.toLowerCase()
    if (!proprio || status !== 'APROVADO' || data_aprovacao !== undefined || data_prevista_entrega !== undefined) return naoAutorizado()
    if (alb.status !== 'PARA APROVAÇÃO') return NextResponse.json({ error: 'A maqueta ainda não está para aprovação.' }, { status: 409 })
  }

  // Datas à mão (só admin)
  const datas: Record<string, any> = {}
  if (data_aprovacao !== undefined) datas.data_aprovacao = data_aprovacao
  if (data_prevista_entrega !== undefined) datas.data_prevista_entrega = data_prevista_entrega
  if (Object.keys(datas).length) await supabase.from('albuns_casamento').update(datas).eq('id', id)

  // Estado: um só sítio que o propaga (editor, ficha, portal, avisos, histórico)
  if (status !== undefined && status !== alb.status) {
    if (!ESTADOS_ALBUM.includes(status)) return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
    if (!alb.ref_evento) {
      await supabase.from('albuns_casamento').update({ status }).eq('id', id)
    } else {
      const r = await aplicarEstadoAlbum(req.nextUrl.origin, { referencia: alb.ref_evento, estado: status as EstadoAlbum, origem: admin ? 'RL' : 'Noivos' })
      if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 })
    }
  }

  const { data } = await supabase.from('albuns_casamento').select('*').eq('id', id).maybeSingle()
  return NextResponse.json({ row: data })
}
