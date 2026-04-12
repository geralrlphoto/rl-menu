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

  // APROVADO e ENTREGUE só podem ser definidos pelo cliente/admin — bloqueado aqui
  if (fields.status === 'APROVADO') {
    return NextResponse.json({ error: 'Status APROVADO só pode ser definido pelo cliente.' }, { status: 403 })
  }
  if (fields.status === 'ENTREGUE') {
    return NextResponse.json({ error: 'Status ENTREGUE só pode ser definido pelo admin.' }, { status: 403 })
  }

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
        const adminUpdate: Record<string, any> = { status: adminStatus }

        // When approved: record approval date and calculate delivery date (+35 days)
        if (newStatus === 'APROVADO') {
          const today = new Date()
          const delivery = new Date(today)
          delivery.setDate(delivery.getDate() + 35)
          const toISO = (d: Date) => d.toISOString().split('T')[0]
          adminUpdate.data_aprovacao = toISO(today)
          adminUpdate.data_prevista_entrega = toISO(delivery)
        }

        await supabase
          .from('albuns_casamento')
          .update(adminUpdate)
          .eq('ref_evento', ref)
      }

      // When delivered: clean up alteration requests
      if (newStatus === 'ENTREGUE') {
        await supabase.from('album_alteracoes').delete().eq('ref_evento', ref)
      }

      // When EM APROVAÇÃO: email the bride
      if (newStatus === 'EM APROVAÇÃO') {
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
