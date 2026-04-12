import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('albuns_casamento')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(req: NextRequest) {
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
  const updates: Record<string, any> = {}
  if (status !== undefined) updates.status = status
  if (data_aprovacao !== undefined) updates.data_aprovacao = data_aprovacao
  if (data_prevista_entrega !== undefined) updates.data_prevista_entrega = data_prevista_entrega

  // Auto-set dates when approving
  if (status === 'APROVADO' && !data_aprovacao) {
    const today = new Date().toISOString().split('T')[0]
    updates.data_aprovacao = today
    const d = new Date(today)
    d.setDate(d.getDate() + 35)
    updates.data_prevista_entrega = d.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('albuns_casamento')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync status to freelancer_album when approving
  if (status === 'APROVADO' && data?.ref_evento) {
    await supabase
      .from('freelancer_album')
      .update({ status: 'APROVADO' })
      .eq('referencia_album', data.ref_evento)
  }

  // When delivered: clean up alteration requests
  if (status === 'ENTREGUE' && data?.ref_evento) {
    await supabase.from('album_alteracoes').delete().eq('ref_evento', data.ref_evento)
  }

  // When PARA APROVAÇÃO (admin): email the bride
  if (status === 'PARA APROVAÇÃO' && data?.ref_evento) {
    const ref = data.ref_evento
    const eventoRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rl-menu-lake.vercel.app'}/api/evento-by-ref?ref=${encodeURIComponent(ref)}`).then(r => r.json()).catch(() => null)
    const emailNoiva = eventoRes?.evento?.email_noiva
    const nomeNoiva  = eventoRes?.evento?.nome_noiva ?? 'Cliente'
    if (emailNoiva) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'RL Photo.Video <noreply@rlphotovideo.pt>',
          to: [emailNoiva],
          subject: 'O seu álbum está pronto para aprovação',
          html: `
            <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 48px 32px; background: #000; color: #fff;">
              <p style="font-size: 10px; letter-spacing: 0.5em; color: #888; text-transform: uppercase; margin: 0 0 32px;">RL PHOTO.VIDEO</p>
              <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 24px; color: #fff;">Álbum para Aprovação</h1>
              <p style="font-size: 15px; color: #bbb; line-height: 1.7; margin: 0 0 16px;">Olá ${nomeNoiva},</p>
              <p style="font-size: 15px; color: #bbb; line-height: 1.7; margin: 0 0 32px;">O seu álbum de casamento está pronto e aguarda a sua aprovação. Por favor aceda ao seu portal para visualizar e aprovar.</p>
              <p style="font-size: 10px; color: #555; letter-spacing: 0.3em; text-transform: uppercase; margin: 48px 0 0;">RL Photo.Video · rlphotovideo.pt</p>
            </div>
          `,
        }),
      }).catch(() => null)
    }
  }

  return NextResponse.json({ row: data })
}
