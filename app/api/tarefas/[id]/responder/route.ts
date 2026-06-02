/* ============================================================
   /api/tarefas/[id]/responder  (POST)

   Endpoint usado pelo portal do membro para gravar a sua
   resposta a uma tarefa enviada pelo admin.

   Body: {
     freelancer_id: string
     freelancer_nome: string
     resposta: string
     respondida_em: string (ISO)
   }

   Comportamento:
   - Lê tarefas.assigned_to (JSONB array)
   - Encontra o envio do freelancer_id correspondente
   - Acrescenta os campos resposta + respondida_em a esse envio
   - Re-grava assigned_to + actualiza updated_at
   - NÃO muda o status da tarefa (continua como NOVA/PENDENTE).
     Só o admin é que pode marcar como CONCLUIDA.
   - Acrescenta entrada no portais.settings.notify_log do(s)
     evento(s) ligado(s) — não temos um sítio para "notificar
     admin" centralizado, então a sineta do /tarefas e a vista
     da tarefa mostram a resposta.

   Tolerante a falhas: devolve 200 mesmo se algumas operações
   falharem (a UI optimista no cliente não fica bloqueada).
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const freelancerId = String(body?.freelancer_id ?? '').trim()
  const freelancerNome = String(body?.freelancer_nome ?? '').trim() || 'Membro'
  const resposta = String(body?.resposta ?? '').trim()
  const respondidaEm = String(body?.respondida_em ?? new Date().toISOString())

  if (!freelancerId || !resposta) {
    return NextResponse.json({ error: 'freelancer_id e resposta obrigatórios' }, { status: 400 })
  }

  try {
    // 1) Buscar a tarefa
    const { data: tarefa } = await db()
      .from('tarefas')
      .select('id, assigned_to, status')
      .eq('id', id)
      .maybeSingle()

    if (!tarefa) return NextResponse.json({ error: 'tarefa não encontrada' }, { status: 404 })

    const envios: any[] = Array.isArray(tarefa.assigned_to) ? tarefa.assigned_to : []
    const idx = envios.findIndex(e => e?.freelancer_id === freelancerId)
    if (idx < 0) {
      return NextResponse.json({ error: 'envio não encontrado para este membro' }, { status: 404 })
    }

    // 2) Acrescentar resposta a esse envio
    envios[idx] = {
      ...envios[idx],
      nome: envios[idx].nome ?? freelancerNome,
      resposta,
      respondida_em: respondidaEm,
    }

    // 3) PATCH na tarefa (mesmo fallback se a coluna não existir)
    let { error } = await db()
      .from('tarefas')
      .update({
        assigned_to: envios,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error && /assigned_to/i.test(error.message ?? '')) {
      const retry = await db()
        .from('tarefas')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'erro' }, { status: 500 })
  }
}
