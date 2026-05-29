import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/calendario-add/pre-wedding — adiciona um slot de pré-wedding ao
// portal e marca-o como reservado (ficando visível no calendário e nos
// time blocks).
// Body: {
//   referencia: string,
//   data: 'YYYY-MM-DD',
//   hora?: 'HH:MM',
//   local?: string,
//   freelancer_id?: string   ← opcional: notifica o membro e fica visível
//                              no calendário dele
// }
export async function POST(req: Request) {
  const body = await req.json()
  const { referencia, data, hora, local, freelancer_id } = body

  if (!referencia || !data) {
    return NextResponse.json({ error: 'referencia e data são obrigatórios' }, { status: 400 })
  }

  const supabase = db()

  // Carrega settings atuais
  const { data: row, error: fetchErr } = await supabase
    .from('portais')
    .select('settings, noiva, noivo')
    .eq('referencia', referencia)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Portal não encontrado para esta referência' }, { status: 404 })
  }

  const settings = row.settings ?? {}
  const slots: any[] = Array.isArray(settings.preWeddingSlots) ? [...settings.preWeddingSlots] : []

  // Cria novo slot (ou reusa se já houver um com a mesma data/hora)
  const id = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const newSlot = {
    id,
    date: data,
    time: hora ?? null,
    local: local ?? null,
    freelancer_id: freelancer_id ?? null,
    label: `${data}${hora ? ' às ' + hora : ''}${local ? ' · ' + local : ''}`,
  }
  slots.push(newSlot)

  const newSettings = {
    ...settings,
    preWeddingSlots: slots,
    preWeddingReservedSlotId: id,
  }

  const { error: updErr } = await supabase
    .from('portais')
    .update({ settings: newSettings })
    .eq('referencia', referencia)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // ── Notifica o membro escolhido (e regista META para calendário) ──
  if (freelancer_id) {
    try {
      const nomes = [row.noiva, row.noivo].filter(Boolean).join(' & ')
      const horaLabel = hora ? ` às ${hora}` : ''
      const localLabel = local ? ` · ${local}` : ''
      const fmtData = (() => {
        try {
          return new Date(data + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
        } catch { return data }
      })()

      const meta = JSON.stringify({
        tipo: 'pre_wedding',
        referencia,
        data,
        hora: hora ?? null,
        local: local ?? null,
        nomeNoivos: nomes || null,
      })
      const mensagem = `__META__${meta}__/META__\nFoste atribuído ao Pré-Wedding de ${nomes || referencia} em ${fmtData}${horaLabel}${localLabel}.`

      await supabase.from('freelancer_notificacoes').insert({
        freelancer_id,
        titulo: `📷 Pré-Wedding · ${nomes || referencia}`,
        mensagem,
        tipo: 'pre_wedding_atribuido',
        lida: false,
      })
    } catch (err) {
      console.warn('[pre-wedding] notificação falhou:', err)
      // não bloqueia — o slot foi guardado com sucesso
    }
  }

  return NextResponse.json({ ok: true, slot: newSlot })
}

// DELETE /api/calendario-add/pre-wedding?referencia=CAS_xxx
// Limpa o slot reservado no portal, remove o time_block correspondente E
// apaga a notificação que foi enviada ao membro atribuído (para o PW
// também desaparecer do calendário dele).
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const referencia = searchParams.get('referencia')
  if (!referencia) return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })

  const supabase = db()

  // 1. Limpa preWeddingReservedSlotId no portal (mantém slots para histórico)
  const { data: row } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', referencia)
    .maybeSingle()
  if (row) {
    const settings = row.settings ?? {}
    const newSettings = { ...settings, preWeddingReservedSlotId: null }
    await supabase.from('portais').update({ settings: newSettings }).eq('referencia', referencia)
  }

  // 2. Remove o(s) time_block(s) com evento_id = pw_<referencia>
  await supabase.from('time_blocks').delete().eq('evento_id', `pw_${referencia}`)

  // 3. Apaga a notificação 'pre_wedding_atribuido' enviada ao membro
  //    (procura no META embutido por referencia exata). Assim, o evento
  //    deixa de aparecer no calendário e na sineta do membro.
  try {
    await supabase
      .from('freelancer_notificacoes')
      .delete()
      .eq('tipo', 'pre_wedding_atribuido')
      .ilike('mensagem', `%"referencia":"${referencia}"%`)
  } catch (err) {
    console.warn('[pre-wedding DELETE] limpar notificações falhou:', err)
    // não bloqueia — o slot/timeblock já foi removido
  }

  return NextResponse.json({ ok: true })
}
