import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin, cabecalhoInterno } from '@/lib/api-guard'
import { aplicarEstadoVideo } from '@/lib/videoEstado'

// Departamento de Edição de Vídeo › Entregar o filme aos noivos.
// POST { referencia, url }: envia o email do Wedding Film (rota de envio existente),
// marca a entrega no portal (wedding_film_url + wedding_film_enviada) e põe o vídeo em Entregue.

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { referencia, url } = await req.json().catch(() => ({}))
  const link = String(url ?? '').trim()
  if (!referencia || !/^https?:\/\//i.test(link)) {
    return NextResponse.json({ error: 'Indica a referência e o link do filme (https://…).' }, { status: 400 })
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: p } = await sb.from('portais').select('id, noiva, noivo, settings').eq('referencia', referencia).maybeSingle()
  if (!p) return NextResponse.json({ error: 'Este casamento não tem portal.' }, { status: 404 })

  // 1) email aos noivos (só marca a entrega se o email sair)
  const r = await fetch(`${req.nextUrl.origin}/api/send-wedding-film-email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...cabecalhoInterno() },
    body: JSON.stringify({ email_noiva: null, nome_noiva: p.noiva ?? null, nome_noivo: p.noivo ?? null, url: link, referencia }),
  }).catch(() => null)
  const d = r ? await r.json().catch(() => ({})) : {}
  if (!r || !r.ok) return NextResponse.json({ error: (d as any).error || 'Não foi possível enviar o email aos noivos.' }, { status: 502 })

  // 2) portal: o cartão do Wedding Film fica Disponível
  const hoje = new Date().toISOString().slice(0, 10)
  await sb.from('portais').update({ settings: { ...(p.settings ?? {}), wedding_film_url: link, wedding_film_enviada: hoje } }).eq('id', p.id)

  // 3) estado Entregue em todo o lado
  await aplicarEstadoVideo(req.nextUrl.origin, { referencia, estado: 'Entregue' })
  return NextResponse.json({ ok: true })
}
