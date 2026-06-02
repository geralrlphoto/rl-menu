/* ============================================================
   /api/freelancer-tarefas?id={freelancerId}  (GET)

   Devolve todas as tarefas da tabela `tarefas` que têm o
   freelancer_id passado dentro do array assigned_to[].

   Cada item normalizado para o shape TarefaItem usado em
   /freelancers/[id] (Minhas Tarefas):

     {
       id: 'tarefa-supabase:<uuid>',
       text: titulo,
       description: descricao,
       priority: 'Média' (default),
       status: 'Pendente' | 'Concluída',
       dueDate: data_prazo,
       createdAt: enviado_em (quando o admin disparou),
       done: status === 'CONCLUIDA',
       project: '',  // pode ser preenchido depois
       _source: 'admin-tarefas',
     }

   Tolerante a falhas: devolve [] em vez de 500.
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ ok: true, tarefas: [] })

  try {
    // Buscar todas tarefas; em SQL puro daria para filtrar com
    //   assigned_to @> '[{"freelancer_id": "..."}]'
    // mas como o cliente JS do supabase-js v2 não suporta jsonb contains
    // bem em alguns plans, fazemos o filtro em memória — N é pequeno.
    const { data, error } = await db()
      .from('tarefas')
      .select('id, titulo, descricao, status, data_prazo, created_at, updated_at, assigned_to')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ ok: true, tarefas: [] })

    const tarefas = (data ?? [])
      .map((t: any) => {
        const envios = Array.isArray(t.assigned_to) ? t.assigned_to : []
        const meuEnvio = envios.find((e: any) => e?.freelancer_id === id)
        if (!meuEnvio) return null
        const isDone = t.status === 'CONCLUIDA'
        return {
          id: `tarefa-supabase:${t.id}`,
          text: String(t.titulo ?? ''),
          description: t.descricao ? String(t.descricao) : '',
          priority: 'Média',
          status: isDone ? 'Concluída' : 'Pendente',
          dueDate: t.data_prazo ?? undefined,
          createdAt: meuEnvio.enviado_em ?? t.created_at,
          done: isDone,
          project: '',
          _source: 'admin-tarefas',
          _supabaseId: t.id,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ ok: true, tarefas })
  } catch {
    return NextResponse.json({ ok: true, tarefas: [] })
  }
}
