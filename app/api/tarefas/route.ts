import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Helper: soma N dias úteis a uma data ISO (skip Sat/Sun) ─────────────
function addWorkingDays(isoStart: string, n: number): string {
  const d = new Date(isoStart)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const wd = d.getDay() // 0 Sun ... 6 Sat
    if (wd !== 0 && wd !== 6) added++
  }
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET() {
  const supabase = db()
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .order('created_at', { ascending: false })
  const baseTarefas: any[] = error ? [] : (data ?? [])

  // ── Virtual tasks: mensagens dos noivos (portais.settings.noivos_messages) ──
  //   Cada mensagem aparece como tarefa PENDENTE com data_prazo = ts + 8 dias úteis.
  //   Quando respondido_em existe → CONCLUIDA.
  const virtualTarefas: any[] = []
  try {
    const { data: portais } = await supabase
      .from('portais')
      // JSON-path select — só o array `noivos_messages`, não o `settings` inteiro
      // de até 500 portais (era das leituras mais pesadas do sistema).
      .select('referencia, noivos_messages:settings->noivos_messages')
      .limit(500)
    for (const p of (portais ?? []) as any[]) {
      const msgs = Array.isArray(p.noivos_messages) ? p.noivos_messages : []
      for (const m of msgs) {
        if (!m?.id || !m?.ts) continue
        const isDone = !!m.respondido_em
        const prazo = addWorkingDays(String(m.ts), 8)
        const nome = m.nome_noivos ?? p.referencia ?? 'Noivos'
        const ref = p.referencia ?? ''
        const tituloMsg = String(m.titulo ?? '').trim()
        virtualTarefas.push({
          id: `noivos_msg::${ref}::${m.id}`,
          titulo: tituloMsg
            ? `💬 ${tituloMsg}`
            : `💬 Mensagem dos Noivos · ${nome}`,
          descricao: [
            `De: ${nome}`,
            ref ? `Referência: ${ref}` : '',
            m.email_noiva ? `E-mail: ${m.email_noiva}` : '',
            '',
            String(m.mensagem ?? ''),
          ].filter(Boolean).join('\n'),
          status: isDone ? 'CONCLUIDA' : 'PENDENTE',
          data_prazo: prazo,
          created_at: m.ts,
          updated_at: m.respondido_em ?? m.ts,
          _is_noivos_msg: true,
          _ref: ref,
        })
      }
    }
  } catch { /* silencioso */ }

  return NextResponse.json({ tarefas: [...virtualTarefas, ...baseTarefas] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { titulo, descricao, status, data_prazo, hora, evento_id, assigned_to } = body

  if (!titulo?.trim()) {
    return NextResponse.json({ error: 'titulo obrigatório' }, { status: 400 })
  }

  const baseInsert: Record<string, any> = {
    titulo:     titulo.trim(),
    descricao:  descricao?.trim() || null,
    status:     status ?? 'NOVA',
    data_prazo: data_prazo || null,
    hora:       hora || null,
    evento_id:  evento_id || null,
  }
  if (Array.isArray(assigned_to)) baseInsert.assigned_to = assigned_to

  let { data, error } = await db()
    .from('tarefas')
    .insert(baseInsert)
    .select()
    .single()

  // Coluna assigned_to ainda por criar? Retry sem ela.
  if (error && /assigned_to/i.test(error.message ?? '')) {
    const { assigned_to: _omit, ...rest } = baseInsert
    const retry = await db().from('tarefas').insert(rest).select().single()
    data  = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tarefa: data })
}
