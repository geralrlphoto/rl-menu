import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ============================================================
   /api/whatsapp-sugestoes
   Sugestões de resposta ao WhatsApp. Quem as escreve é o Claude Code
   (lê a conversa no WhatsApp Web e grava aqui); o Rui vê em /whatsapp,
   copia ou abre no WhatsApp e envia ele. Sem API paga.
   Só admin (o middleware protege /api por defeito).
   ============================================================ */

export const dynamic = 'force-dynamic'

const ESTADOS = ['pendente', 'enviada', 'arquivada'] as const

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// GET ?estado=pendente|enviada|arquivada → { sugestoes: [...] }
export async function GET(req: NextRequest) {
  const estado = req.nextUrl.searchParams.get('estado') ?? 'pendente'
  const { data, error } = await db()
    .from('whatsapp_sugestoes')
    .select('*')
    .eq('estado', estado)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sugestoes: data ?? [] })
}

// PATCH { id, estado?, sugestao? } → atualiza
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  const upd: Record<string, string> = { updated_at: new Date().toISOString() }
  if (typeof b.estado === 'string' && (ESTADOS as readonly string[]).includes(b.estado)) upd.estado = b.estado
  if (typeof b.sugestao === 'string' && b.sugestao.trim()) upd.sugestao = b.sugestao
  const { error } = await db().from('whatsapp_sugestoes').update(upd).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
