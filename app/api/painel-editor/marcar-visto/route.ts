import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST: marca como lido (lida=true) o trabalho 'relatorio_editor' de um editor.
//   Chamado quando o editor abre o projeto — deixa de aparecer como "Novo".
export async function POST(req: NextRequest) {
  const { freelancer, referencia, notifId } = await req.json().catch(() => ({}))
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  if (!referencia && !notifId) {
    return NextResponse.json({ error: 'referencia or notifId required' }, { status: 400 })
  }

  const supabase = db()
  let updated = 0

  // Por referência: vai a todas as notificações deste evento (a referência vive
  // na meta JSON da mensagem). Faz match exato em JS — evita que o '_' da
  // referência seja tratado como wildcard num ILIKE.
  if (referencia) {
    const { data: rows } = await supabase
      .from('freelancer_notificacoes')
      .select('id, mensagem')
      .eq('freelancer_id', freelancer)
      .eq('tipo', 'relatorio_editor')
      .eq('lida', false)
      .limit(200)
    const ids = (rows ?? []).filter((r: any) => {
      const m = String(r.mensagem ?? '').match(/^__META__(.*?)__\/META__/)
      if (!m) return false
      try { return JSON.parse(m[1]).referencia === referencia } catch { return false }
    }).map((r: any) => r.id)
    if (ids.length) {
      await supabase.from('freelancer_notificacoes').update({ lida: true }).in('id', ids)
      updated = ids.length
    }
  }

  // Fallback: marca a notificação específica pelo id.
  if (updated === 0 && notifId) {
    await supabase.from('freelancer_notificacoes').update({ lida: true }).eq('id', notifId)
  }

  return NextResponse.json({ ok: true, updated })
}
