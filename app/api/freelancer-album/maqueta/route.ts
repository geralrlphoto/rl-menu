import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, sessaoMembro, naoAutorizado } from '@/lib/api-guard'
import { aplicarEstadoAlbum } from '@/lib/albumEstado'

// O editor do álbum envia a maqueta (link) a partir do portal dele.
// POST { referencia, url } → o álbum passa a REVISÃO RL: a RL vê-a no
// Departamento de Fotografia › Álbuns antes de a enviar aos noivos.
export async function POST(req: NextRequest) {
  const { referencia, url } = await req.json().catch(() => ({}))
  const link = String(url ?? '').trim()
  if (!referencia || !/^https?:\/\//i.test(link)) {
    return NextResponse.json({ error: 'Cola o link da maqueta (https://…).' }, { status: 400 })
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let origem = 'RL'
  if (!ehAdmin(req)) {
    const membro = await sessaoMembro(req)
    if (!membro) return naoAutorizado()
    const { data: meu } = await sb.from('freelancer_album').select('id').eq('freelancer_id', membro.id).eq('referencia_album', referencia).maybeSingle()
    if (!meu) return naoAutorizado()
    const { data: fl } = await sb.from('freelancers').select('nome').eq('id', membro.id).maybeSingle()
    origem = String(fl?.nome ?? 'Editor').trim()
  }
  const r = await aplicarEstadoAlbum(req.nextUrl.origin, { referencia, estado: 'REVISÃO RL', origem, maqueteUrl: link })
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 })
  return NextResponse.json({ ok: true })
}
