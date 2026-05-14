import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/send-task-email
// Body: { referencia: string, taskText: string, kind?: 'new' | 'completed', tipo?: 'casamento' | 'batizado' }
//
// Disparado quando admin:
//   - kind='new'       → adiciona nova tarefa em "Gestão de Tarefas" do portal
//   - kind='completed' → marca uma tarefa como concluída
// Envia card dourado ao cliente com link para o portal.

const RESEND_KEY = process.env.RESEND_API_KEY!
const SITE_BASE  = process.env.NEXT_PUBLIC_SITE_URL || 'https://rl-menu-lake.vercel.app'

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
      .select('nome_noivos, nome_noiva, nome_noivo, nome_crianca, email_noiva, email_noivo, tipo_evento')
      .eq('referencia_evento', referencia)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('portais')
      .select('noiva, noivo, settings')
      .eq('referencia', referencia)
      .maybeSingle(),
    (async () => {
      for (const t of ['eventos_2026', 'eventos_2027']) {
        const { data } = await sb.from(t)
          .select('email_noiva, email_noivo, nome_noiva, nome_noivo, cliente, tipo_evento, nome_crianca')
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
  return { email, nome, tipo }
}

function buildEmailHtml(opts: {
  nome: string
  taskText: string
  url: string
  tipo: 'casamento' | 'batizado'
  kind: 'new' | 'completed'
}): string {
  const primeiroNome = (opts.nome || '').split(/[\s&]/)[0] || 'Olá'
  const evento = opts.tipo === 'batizado' ? 'batizado' : 'casamento'

  const isCompleted = opts.kind === 'completed'
  const lead     = isCompleted ? `Uma etapa do ${evento}` : 'Nova tarefa no'
  const leadCont = isCompleted ? 'foi concluída.' : `vosso portal do ${evento}.`
  const eyebrow  = isCompleted ? 'Tarefa concluída' : 'Nova tarefa atribuída'
  const icon     = isCompleted
    ? '<span style="color:#7dd3a4;font-weight:700;margin-right:8px;">&#10003;</span>'
    : '<span style="color:#c9a96e;font-weight:700;margin-right:8px;">&#9679;</span>'
  const body = isCompleted
    ? 'Continuamos atentos a todas as etapas até ao grande dia.<br>Podem acompanhar o ponto de situação no vosso portal.'
    : 'Acabámos de adicionar uma nova tarefa no vosso portal.<br>Quando estiver concluída, vão receber a confirmação.'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:0.9;" />

          <p style="margin:0 0 4px;font-size:24px;font-style:italic;font-weight:300;color:#c9a96e;">Olá, ${primeiroNome}!</p>
          <p style="margin:0;font-size:30px;font-weight:400;color:#f0e8d8;">${lead}</p>
          <p style="margin:0 0 28px;font-size:30px;font-weight:400;font-style:italic;color:#c9a96e;">${leadCont}</p>

          <div style="margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>

          <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">${eyebrow}</p>

          <!-- Caixa com o nome da tarefa -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:420px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 28px;text-align:center;">
              <p style="margin:0;font-size:18px;color:#f0e8d8;line-height:1.5;letter-spacing:0.02em;">
                ${icon}${opts.taskText}
              </p>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;font-size:14px;color:#a09070;line-height:1.8;">
            ${body}
          </p>

          <!-- BOTÃO BULLETPROOF -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
            <tr>
              <td align="center" style="border-radius:8px;background:#c9a96e;">
                <a href="${opts.url}" target="_blank"
                  style="display:inline-block;padding:16px 40px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.4em;font-weight:700;border-radius:8px;mso-padding-alt:0;border:1px solid #c9a96e;">
                  ABRIR PORTAL &nbsp;→
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:11px;color:#5a4a30;line-height:1.6;">
            Caso o botão não funcione, copia este link:<br>
            <a href="${opts.url}" style="color:#c9a96e;text-decoration:underline;word-break:break-all;">${opts.url}</a>
          </p>

          <p style="margin:32px 0 0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
            RL PHOTO &middot; VIDEO
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
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
      buildEmailHtml({ nome: dados.nome, taskText, url: portalUrl, tipo, kind }),
    )

    if (!ok) return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    return NextResponse.json({ ok: true, email: dados.email, tipo, kind })
  } catch (err: any) {
    console.error('[send-task-email]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
