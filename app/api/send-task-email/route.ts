import { NextRequest, NextResponse } from 'next/server'
import { emailTarefaNoivos } from '@/lib/emailsNoivos'
import { exigeAcessoRef } from '@/lib/api-guard'
import { createClient } from '@supabase/supabase-js'

// POST /api/send-task-email
// Body: { referencia: string, taskText: string, kind?: 'new' | 'completed', tipo?: 'casamento' | 'batizado' }
//
// Disparado quando admin:
//   - kind='new'       → adiciona nova tarefa em "Gestão de Tarefas" do portal
//   - kind='completed' → marca uma tarefa como concluída
// Envia card dourado ao cliente com link para o portal.

const RESEND_KEY = process.env.RESEND_API_KEY!
const SITE_BASE  = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Procura email da noiva no Notion (ficha do evento — "DADOS DOS NOIVOS")
async function findEmailNotion(referencia: string): Promise<string | null> {
  const NOTION_TOKEN = process.env.NOTION_TOKEN
  if (!NOTION_TOKEN) return null
  const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: referencia } },
        page_size: 1,
      }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const page = data.results?.[0]
    if (!page) return null
    const props = page.properties ?? {}
    return props['E-mail da noiva']?.email
        || props['E-mail do noivo']?.email
        || null
  } catch { return null }
}

async function resolveDadosCliente(referencia: string) {
  const sb = db()

  // Carrega TODAS as fontes em paralelo (mais rápido + permite preencher
  // o email da noiva mesmo quando dados_contrato_cps não tem)
  const [contratoRes, portalRes, eventosRes] = await Promise.all([
    sb.from('dados_contrato_cps')
      .select('nome_noivos, nome_noiva, nome_noivo, nome_crianca, email_noiva, email_noivo, tipo_evento, data_casamento')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('portais')
      .select('noiva, noivo, data, settings')
      .eq('referencia', referencia)
      .maybeSingle(),
    (async () => {
      for (const t of ['eventos_2026', 'eventos_2027']) {
        const { data } = await sb.from(t)
          .select('email_noiva, email_noivo, nome_noiva, nome_noivo, cliente, tipo_evento, nome_crianca, data_evento')
          .eq('referencia', referencia)
          .maybeSingle()
        if (data) return data
      }
      return null
    })(),
  ])
  const contrato = contratoRes.data
  const portal   = portalRes.data
  const evento   = eventosRes
  const portalSettings = portal?.settings ?? {}

  // Email: 1) contrato CPS  2) portais.settings  3) eventos_YYYY  4) Notion
  let email: string | null =
       contrato?.email_noiva
    || contrato?.email_noivo
    || portalSettings.email_noiva
    || portalSettings.email_noivo
    || evento?.email_noiva
    || evento?.email_noivo
    || null
  if (!email) email = await findEmailNotion(referencia)

  // Nome: melhor disponível
  const nome =
       contrato?.nome_noivos
    || [contrato?.nome_noiva, contrato?.nome_noivo].filter(Boolean).join(' & ')
    || contrato?.nome_crianca
    || [portal?.noiva, portal?.noivo].filter(Boolean).join(' & ')
    || [evento?.nome_noiva, evento?.nome_noivo].filter(Boolean).join(' & ')
    || evento?.cliente
    || evento?.nome_crianca
    || portalSettings.nomeCrianca
    || ''

  // Tipo: tenta detetar pelo contrato/settings/eventos_tipo_evento, fallback pela referência
  const tipoFromAny =
       contrato?.tipo_evento
    || portalSettings.tipo
    || portalSettings.tipoPortal
    || (Array.isArray(evento?.tipo_evento) && evento?.tipo_evento.find((t: string) => /batizado/i.test(t)) ? 'batizado' : null)
    || (typeof evento?.tipo_evento === 'string' && /batizado/i.test(evento.tipo_evento) ? 'batizado' : null)
    || (referencia.toUpperCase().startsWith('BAT_') ? 'batizado' : 'casamento')
  const tipo: 'casamento' | 'batizado' = tipoFromAny === 'batizado' ? 'batizado' : 'casamento'

  if (!email) return null
  return { email, nome, tipo, data: (contrato?.data_casamento ?? portal?.data ?? evento?.data_evento ?? null) as string | null }
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia = String(body.referencia ?? '').trim()
    const taskText   = String(body.taskText ?? '').trim()
    const kind: 'new' | 'completed' = body.kind === 'new' ? 'new' : 'completed'
    const tipoInput  = (body.tipo === 'batizado' ? 'batizado' : (body.tipo === 'casamento' ? 'casamento' : null)) as 'casamento' | 'batizado' | null

    if (!referencia) return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
    const bloqueio = await exigeAcessoRef(req, referencia) // admin ou os próprios noivos
    if (bloqueio) return bloqueio
    if (!taskText)   return NextResponse.json({ error: 'taskText obrigatório' }, { status: 400 })

    const dados = await resolveDadosCliente(referencia)
    if (!dados || !dados.email) {
      return NextResponse.json({ error: 'Email do cliente não encontrado para esta referência.' }, { status: 404 })
    }

    const tipo = tipoInput ?? dados.tipo
    const portalUrl = tipo === 'batizado'
      ? `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(referencia)}`
      : `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(referencia)}`

    const subject = kind === 'new'
      ? `📋 Nova tarefa no vosso portal — ${taskText}`
      : `✓ Tarefa concluída — ${taskText}`

    const ok = await sendEmail(
      dados.email,
      subject,
      emailTarefaNoivos({ nome: dados.nome, taskText, url: portalUrl, tipo, kind, data: dados.data }),
    )

    if (!ok) return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    return NextResponse.json({ ok: true, email: dados.email, tipo, kind })
  } catch (err: any) {
    console.error('[send-task-email]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
