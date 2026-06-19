import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: notificações do editor sobre decisões do admin (vídeo aprovado / rever
//   alterações). Lidas pela sineta do painel do editor.
export async function GET(req: NextRequest) {
  const freelancer = req.nextUrl.searchParams.get('freelancer')
  if (!freelancer) return NextResponse.json({ error: 'freelancer required' }, { status: 400 })
  const supabase = db()
  const { data } = await supabase
    .from('freelancer_notificacoes')
    .select('id, tipo, titulo, mensagem, lida, created_at')
    .eq('freelancer_id', freelancer)
    .in('tipo', ['video_aprovado', 'video_alteracoes'])
    .order('created_at', { ascending: false })
    .limit(50)

  const notifs = (data ?? []).map((n: any) => {
    let meta: any = {}
    const m = String(n.mensagem ?? '').match(/^__META__(.*?)__\/META__/)
    if (m) { try { meta = JSON.parse(m[1]) } catch { meta = {} } }
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      lida: !!n.lida,
      created_at: n.created_at,
      referencia: meta.referencia ?? null,
      noivos: meta.noivos ?? null,
      local: meta.local ?? null,
      feedback: meta.feedback ?? null,
      status: meta.status ?? null,
    }
  })
  return NextResponse.json({ notifs })
}
