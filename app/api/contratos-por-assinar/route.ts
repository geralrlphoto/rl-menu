import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { contratosPorAssinar } from '@/lib/contratosPorAssinar'

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET: lista dos contratos por assinar (separador Contratos da página /tarefas)
export async function GET(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  return NextResponse.json({ contratos: await contratosPorAssinar(sb()) })
}

// POST { referencia }: marca à mão o contrato como assinado (recebido por email,
// WhatsApp ou em papel). Tem o mesmo efeito que o envio pelo portal: desbloqueia o
// portal se a adjudicação estiver paga e tira o casal da lista.
export async function POST(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const { referencia } = await req.json().catch(() => ({}))
  if (!referencia) return NextResponse.json({ error: 'referencia em falta' }, { status: 400 })
  const db = sb()
  const { data: portal } = await db.from('portais').select('id, settings').ilike('referencia', String(referencia)).maybeSingle()
  if (!portal) return NextResponse.json({ error: 'Portal não encontrado' }, { status: 404 })
  const contratoAssinadoEm = new Date().toISOString()
  const { error } = await db.from('portais').update({
    settings: { ...(portal.settings ?? {}), contratoAssinadoEm, contratoAssinadoManual: true },
    updated_at: contratoAssinadoEm,
  }).eq('id', portal.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateTag('photo-whatsapp', { expire: 0 })
  return NextResponse.json({ ok: true, contratoAssinadoEm })
}
