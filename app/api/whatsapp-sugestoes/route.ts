import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encontrarPromessa } from '@/lib/whatsappPromessas'

/* ============================================================
   /api/whatsapp-sugestoes
   Sugestões de resposta ao WhatsApp. Quem as escreve é o Claude Code
   (lê a conversa no WhatsApp Web e grava aqui); o Rui vê em
   /social-media/whatsapp, copia ou abre no WhatsApp e envia ele. Sem API paga.
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
// GET ?base=1   → { sugestoes: [...] }  respostas-base (por tema)
// GET ?estado=pendente|enviada|arquivada → { sugestoes: [...] }
//   Por enviar: quem espera há mais tempo primeiro. Outras: mais recentes primeiro.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  if (sp.get('contar')) {
    const { count, error } = await db()
      .from('whatsapp_sugestoes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendente')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ pendentes: count ?? 0 })
  }
  if (sp.get('base')) {
    const { data, error } = await db()
      .from('whatsapp_sugestoes')
      .select('*')
      .eq('base', true)
      .order('tema', { ascending: true })
      .limit(100)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sugestoes: data ?? [] })
  }
  const estado = sp.get('estado') ?? 'pendente'
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

// PATCH { id, estado?, sugestao?, telefone?, base?, tema? } → atualiza
//   sugestao_original nunca muda: é a versão do Claude, comparada com a enviada
//   para o Claude aprender o tom do Rui.
//   Na primeira vez que passa a 'enviada':
//     · se a resposta promete algo com data ("para a semana", "até sexta"…) → tarefa em /tarefas
//     · se o cliente tem ficha no CRM → fica no histórico da ficha
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  const sb = db()
  const agora = new Date().toISOString()
  const upd: Record<string, string | boolean | null> = { updated_at: agora }

  if (typeof b.sugestao === 'string' && b.sugestao.trim()) upd.sugestao = b.sugestao
  if (typeof b.telefone === 'string') upd.telefone = b.telefone.trim().slice(0, 30)
  if (typeof b.base === 'boolean') upd.base = b.base
  if (typeof b.tema === 'string') upd.tema = b.tema.trim().slice(0, 60) || null

  let tarefaPrazo: string | null = null
  if (typeof b.estado === 'string' && (ESTADOS as readonly string[]).includes(b.estado)) {
    upd.estado = b.estado
    if (b.estado === 'enviada') {
      const { data: atual } = await sb
        .from('whatsapp_sugestoes')
        .select('cliente, sugestao, crm_contact_id, tarefa_id, enviada_em')
        .eq('id', id)
        .maybeSingle()
      if (atual && !atual.enviada_em) {
        upd.enviada_em = agora
        const texto = (upd.sugestao as string | undefined) ?? atual.sugestao ?? ''

        const promessa = atual.tarefa_id ? null : encontrarPromessa(texto)
        if (promessa) {
          const { data: tarefa } = await sb.from('tarefas').insert({
            titulo: `WhatsApp · ${atual.cliente}: cumprir o prometido`,
            descricao: `Prometeste por WhatsApp: "${promessa.frase}"\n\nResposta enviada:\n${texto}`,
            data_prazo: promessa.prazo,
            status: 'NOVA',
          }).select('id').single()
          if (tarefa?.id) {
            upd.tarefa_id = tarefa.id
            upd.tarefa_prazo = promessa.prazo
            tarefaPrazo = promessa.prazo
          }
        }

        if (atual.crm_contact_id) {
          const resumo = texto.replace(/\s+/g, ' ').trim()
          await sb.from('crm_status_history').insert({
            contact_id: atual.crm_contact_id,
            evento: `WhatsApp enviado: "${resumo.length > 90 ? resumo.slice(0, 90) + '…' : resumo}"`,
          })
        }
      }
    }
  }

  const { error } = await sb.from('whatsapp_sugestoes').update(upd).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, tarefa_prazo: tarefaPrazo })
}
