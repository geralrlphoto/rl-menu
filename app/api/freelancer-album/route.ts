import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const { data, error } = await db().from('freelancer_album').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ album: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await db().from('freelancer_album').insert({ ...body, updated_at: new Date().toISOString() }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, album: data })
}

// Freelancer status → albuns_casamento status → Notion album_estado
const STATUS_TO_ADMIN: Record<string, string> = {
  'AGUARDAR':      'NOVO ÁLBUM',
  'EM EDIÇÃO':     'EM EDIÇÃO',
  'EM APROVAÇÃO':  'PARA APROVAÇÃO',
  'APROVADO':      'APROVADO',
  'ENTREGUE':      'ENTREGUE',
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()

  // Update freelancer_album
  const { error } = await supabase
    .from('freelancer_album')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If status changed, sync upstream
  if (fields.status) {
    const newStatus = fields.status as string

    // Get referencia_album from the record
    const { data: record } = await supabase
      .from('freelancer_album')
      .select('referencia_album')
      .eq('id', id)
      .maybeSingle()

    const ref = record?.referencia_album
    if (ref) {
      const adminStatus = STATUS_TO_ADMIN[newStatus]

      // Update albuns_casamento
      if (adminStatus) {
        await supabase
          .from('albuns_casamento')
          .update({ status: adminStatus })
          .eq('ref_evento', ref)
      }

    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_album').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
