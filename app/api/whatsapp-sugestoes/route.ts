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

// GET ?contar=1 → { pendentes: n }  (contador do menu; só conta, não lê linhas)
// GET ?estado=pendente|enviada|arquivada → { sugestoes: [...] }
//   Por enviar: quem espera há mais tempo primeiro. Outras: mais recentes primeiro.
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('contar')) {
    const { count, error } = await db()
      .from('whatsapp_sugestoes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendente')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pendentes: count ?? 0 })
  }
  const estado = req.nextUrl.searchParams.get('estado') ?? 'pendente'
  const pendente = estado === 'pendente'
  const { data, error } = await db()
    .from('whatsapp_sugestoes')
    .select('*')
    .eq('estado', estado)
    .order(pendente ? 'data_mensagem' : 'updated_at', { ascending: pendente, nullsFirst: false })
    .order('created_at', { ascending: pendente })
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sugestoes: data ?? [] })
}

// PATCH { id, estado?, sugestao?, telefone? } → atualiza
//   sugestao_original nunca muda: é a versão do Claude, comparada com a enviada
//   para o Claude aprender o tom do Rui.
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  const upd: Record<string, string | null> = { updated_at: new Date().toISOString() }
  if (typeof b.estado === 'string' && (ESTADOS as readonly string[]).includes(b.estado)) {
    upd.estado = b.estado
    if (b.estado === 'enviada') upd.enviada_em = upd.updated_at
  }
  if (typeof b.sugestao === 'string' && b.sugestao.trim()) upd.sugestao = b.sugestao
  if (typeof b.telefone === 'string') upd.telefone = b.telefone.trim().slice(0, 30)
  const { error } = await db().from('whatsapp_sugestoes').update(upd).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
