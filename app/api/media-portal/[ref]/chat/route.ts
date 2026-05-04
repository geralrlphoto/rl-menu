import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = { params: Promise<{ ref: string }> }

/* ── GET — buscar mensagens ── */
export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params
  const { data } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mensagens = data?.dados?.chatMensagens ?? []
  return NextResponse.json({ mensagens })
}

/* ── POST — enviar mensagem ── */
export async function POST(req: NextRequest, { params }: Params) {
  const { ref } = await params
  const body = await req.json()
  const { texto, autor, isAdmin } = body

  if (!texto?.trim()) {
    return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })
  }

  /* verificar se isAdmin bate certo com o cookie */
  const cookieStore = await cookies()
  const authOk = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET
  const adminReal = isAdmin && authOk

  const novaMensagem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    texto: texto.trim(),
    autor: adminReal ? (autor || 'RL Media') : (autor || 'Cliente'),
    isAdmin: adminReal,
    criadoEm: new Date().toISOString(),
  }

  /* buscar dados actuais e fazer append */
  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .single()

  const mensagens = [...(existing?.dados?.chatMensagens ?? []), novaMensagem]

  const merged = { ...(existing?.dados ?? {}), chatMensagens: mensagens }

  const { error } = await supabase
    .from('media_portais')
    .upsert(
      { ref: ref.toUpperCase(), dados: merged, updated_at: new Date().toISOString() },
      { onConflict: 'ref' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, mensagem: novaMensagem })
}
