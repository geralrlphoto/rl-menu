import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function dateLabelFrom(data_casamento: string | null): string {
  if (!data_casamento) return ''
  try {
    const dateStr = String(data_casamento).slice(0, 10)
    const [y, m, d] = dateStr.split('-').map(Number)
    if ([y, m, d].every(n => Number.isFinite(n))) {
      const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      return `${String(d).padStart(2,'0')} ${MESES[m-1]} ${y}`
    }
  } catch {/* ignore */}
  return ''
}

// ── GET: membros (freelancers) atribuídos ao evento + estado do briefing ──
//    Devolve o briefing_url guardado (no portal) e a lista de membros, cada um
//    com `enviado` = já tem o briefing desbloqueado no seu portal.
export async function GET(req: NextRequest) {
  const ref       = req.nextUrl.searchParams.get('ref')
  const evento_id = req.nextUrl.searchParams.get('evento_id')
  if (!ref && !evento_id) return NextResponse.json({ error: 'ref or evento_id required' }, { status: 400 })

  const supabase = db()

  const eq = ref
    ? (await supabase.from('evento_equipa').select('briefing_url').eq('referencia', ref).maybeSingle()).data
    : (await supabase.from('evento_equipa').select('briefing_url').eq('evento_id', evento_id!).maybeSingle()).data
  const briefingUrl = eq?.briefing_url ?? null

  // Registos deste evento (quem já está atribuído + estado do briefing)
  const fcs = ref
    ? (await supabase.from('freelancer_casamentos').select('freelancer_id, briefing_url').eq('referencia', ref)).data
    : (await supabase.from('freelancer_casamentos').select('freelancer_id, briefing_url').eq('evento_id', evento_id!)).data
  const rows = (fcs ?? []).filter((r: any) => r.freelancer_id)

  // TODOS os fotógrafos + videógrafos da equipa (para se poder escolher a quem enviar)
  const { data: fls } = await supabase
    .from('freelancers')
    .select('id, nome, status, email')
    .in('status', ['FOTOGRAFO', 'VIDEOGRAFO'])
    .order('nome', { ascending: true })

  const membros = (fls ?? []).map((f: any) => {
    const row = rows.find((r: any) => r.freelancer_id === f.id)
    return {
      id: f.id, nome: f.nome, status: f.status, email: f.email,
      assigned: !!row,              // já atribuído a este evento
      enviado: !!row?.briefing_url, // já recebeu o briefing
    }
  })

  return NextResponse.json({ briefingUrl, membros })
}

// ── POST: envia o briefing aos membros selecionados ──
//    1) desbloqueia "Ver Briefing" no portal de cada membro (briefing_url)
//    2) cria notificação no sino do portal do freelancer
//    3) envia email com o card "NOVO BRIEFING" (CTA → portal do membro)
export async function POST(req: NextRequest) {
  const { referencia, evento_id, freelancerIds, local, data_casamento } = await req.json()
  if (!referencia && !evento_id) return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })
  if (!Array.isArray(freelancerIds) || freelancerIds.length === 0) {
    return NextResponse.json({ error: 'freelancerIds required' }, { status: 400 })
  }

  const supabase = db()

  // briefing_url a distribuir (tem de ter sido preparado/enviado a partir do portal)
  const eq = referencia
    ? (await supabase.from('evento_equipa').select('briefing_url, local, data_casamento').eq('referencia', referencia).maybeSingle()).data
    : (await supabase.from('evento_equipa').select('briefing_url, local, data_casamento').eq('evento_id', evento_id).maybeSingle()).data
  const briefingUrl = eq?.briefing_url ?? null
  if (!briefingUrl) {
    return NextResponse.json({ error: 'Briefing ainda não foi preparado. Envia primeiro a partir do portal dos noivos.' }, { status: 400 })
  }

  const localStr = String(local ?? eq?.local ?? '').trim()
  const dataCas  = data_casamento ?? eq?.data_casamento ?? null
  const dateLabel = dateLabelFrom(dataCas)

  // 1) Desbloquear "Ver Briefing" no portal de cada membro selecionado.
  //    Se ainda não estiver atribuído a este evento, cria-se o registo
  //    (passa a ver o evento + briefing no portal dele).
  for (const fid of freelancerIds) {
    let q = supabase.from('freelancer_casamentos').select('id').eq('freelancer_id', fid).limit(1)
    q = referencia ? q.eq('referencia', referencia) : q.eq('evento_id', evento_id)
    const { data: existRows } = await q
    const existing = (existRows ?? [])[0]
    if (existing) {
      await supabase.from('freelancer_casamentos').update({ briefing_url: briefingUrl }).eq('id', existing.id)
    } else {
      await supabase.from('freelancer_casamentos').insert({
        freelancer_id: fid,
        referencia: referencia ?? null,
        evento_id: evento_id ?? null,
        local: localStr || null,
        data_casamento: dataCas,
        briefing_url: briefingUrl,
        order_index: 999,
      })
    }
  }

  // 2) Notificação no sino (idempotente por freelancer+referência não lida)
  const meta = JSON.stringify({ briefing_url: briefingUrl, referencia: referencia ?? null, local: localStr || null, data_casamento: dataCas })
  const corpo = localStr
    ? `O briefing do casamento em ${localStr}${dateLabel ? ` (${dateLabel})` : ''} está disponível. Carrega para consultar.`
    : `O briefing do teu próximo evento${dateLabel ? ` de ${dateLabel}` : ''} está disponível.`
  const mensagem = `__META__${meta}__/META__\n${corpo}`

  for (const fid of freelancerIds) {
    const { data: existing } = await supabase
      .from('freelancer_notificacoes')
      .select('id')
      .eq('freelancer_id', fid)
      .eq('tipo', 'briefing_enviado')
      .ilike('mensagem', `%"referencia":"${referencia ?? ''}"%`)
      .eq('lida', false)
      .maybeSingle()
    if (existing) continue
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: fid,
      titulo: '◧ Novo Briefing disponível',
      mensagem,
      tipo: 'briefing_enviado',
      lida: false,
    })
  }

  // 3) Email (card NOVO BRIEFING) via Resend
  let emailsSent = 0
  if (process.env.RESEND_API_KEY) {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rl-menu-lake.vercel.app'
    const CARD_URL = `${SITE}/card-novo-briefing.png`
    const { data: members } = await supabase.from('freelancers').select('id, nome, email').in('id', freelancerIds)
    const subject = localStr
      ? `Briefing disponível — ${localStr}${dateLabel ? ` · ${dateLabel}` : ''}`
      : 'Novo Briefing disponível'

    for (const m of (members ?? []) as Array<{ id: string; nome: string | null; email: string | null }>) {
      if (!m.email) continue
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [m.email],
            subject,
            html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${SITE}/freelancers/${m.id}?view=freelancer" style="display:block;text-decoration:none;">
          <img src="${CARD_URL}"
            width="560" alt="Novo Briefing disponível"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`,
          }),
        })
        emailsSent++
      } catch (e) {
        console.warn(`[briefing-equipa email] falhou para ${m.email}:`, e)
      }
    }
  }

  return NextResponse.json({ ok: true, sent: freelancerIds.length, emailsSent })
}
