import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * POST { referencia, messageId, texto }
 * Adiciona uma resposta do admin a uma mensagem dos noivos.
 * Guarda em portais.settings.noivos_messages[i].respostas[].
 * A resposta passa a aparecer no portal (página Atendimento) e na ficha.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia = String(body?.referencia ?? '').trim()
    const messageId  = String(body?.messageId ?? '').trim()
    const texto      = String(body?.texto ?? '').trim()

    if (!referencia || !messageId || !texto) {
      return NextResponse.json({ ok: false, error: 'referencia, messageId e texto required' }, { status: 400 })
    }

    const supabase = db()
    const { data: portalRow } = await supabase
      .from('portais')
      .select('settings')
      .ilike('referencia', referencia)
      .maybeSingle()

    if (!portalRow) return NextResponse.json({ ok: false, error: 'portal não encontrado' }, { status: 404 })

    const settings = (portalRow.settings ?? {}) as Record<string, any>
    const messages = Array.isArray(settings.noivos_messages) ? settings.noivos_messages : []
    const idx = messages.findIndex((m: any) => m?.id === messageId)
    if (idx === -1) return NextResponse.json({ ok: false, error: 'mensagem não encontrada' }, { status: 404 })

    const agora = new Date().toISOString()
    const resposta = { id: `r_${Date.now()}`, texto, ts: agora }
    const respostas = Array.isArray(messages[idx].respostas) ? messages[idx].respostas : []
    messages[idx] = { ...messages[idx], respostas: [...respostas, resposta], lida: true }

    // Adiciona também uma notificação ao sino do portal dos noivos.
    const notifs = Array.isArray(settings.noivos_notifications) ? settings.noivos_notifications : []
    const notif = {
      id: `n_${Date.now()}`,
      titulo: 'Nova Mensagem · Atendimento',
      texto: 'Recebeste uma resposta da nossa equipa. Consulta a página Atendimento do portal.',
      ts: agora,
    }

    const newSettings = { ...settings, noivos_messages: messages, noivos_notifications: [notif, ...notifs] }
    await supabase.from('portais').update({ settings: newSettings }).ilike('referencia', referencia)

    return NextResponse.json({ ok: true, resposta })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'erro' }, { status: 500 })
  }
}
