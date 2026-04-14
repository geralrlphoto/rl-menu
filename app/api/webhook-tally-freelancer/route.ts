import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DB_ID = '2f3220116d8a8027b435c5b4c0f48948'

const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getField(fields: any[], label: string): string | null {
  const f = fields.find((f: any) =>
    f.label?.trim().toUpperCase() === label.trim().toUpperCase()
  )
  if (!f) return null
  const v = f.value
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) return v[0]?.trim() || null
  return null
}

function buildConfirmacaoHtml(nome: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Candidatura Recebida</title>
</head>
<body style="margin:0;padding:0;background:#111009;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111009;min-height:100vh;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(160deg,#1c1710 0%,#110e08 60%,#0e0c07 100%);border:1px solid #2e2416;border-radius:4px;overflow:hidden;">

        <!-- Corner decorations -->
        <tr>
          <td style="padding:28px 28px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:18px;height:18px;border-top:1px solid #8a6a30;border-left:1px solid #8a6a30;"></td>
                <td></td>
                <td style="width:18px;height:18px;border-top:1px solid #8a6a30;border-right:1px solid #8a6a30;"></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:32px 40px 8px;">
            <img src="data:image/png;base64,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" width="72" height="72" alt="RL Photo Video" style="display:block;margin:0 auto;opacity:0.90;"/>
          </td>
        </tr>

        <!-- Obrigado -->
        <tr>
          <td align="center" style="padding:28px 40px 4px;">
            <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:26px;color:#c9a55a;letter-spacing:0.02em;">Obrigado!</p>
          </td>
        </tr>

        <!-- Título principal -->
        <tr>
          <td align="center" style="padding:8px 40px 4px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:400;color:#f0ece4;line-height:1.2;text-align:center;letter-spacing:-0.01em;">
              Recebemos a tua
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 40px 24px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:36px;font-style:italic;color:#c9a55a;line-height:1.2;text-align:center;">
              candidatura.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td align="center" style="padding:4px 40px 28px;">
            <table cellpadding="0" cellspacing="0" style="width:200px;">
              <tr>
                <td style="width:60px;border-bottom:1px solid #6b5020;vertical-align:middle;">&nbsp;</td>
                <td align="center" style="padding:0 10px;color:#8a6a30;font-size:12px;letter-spacing:5px;vertical-align:middle;white-space:nowrap;">· ◆ ·</td>
                <td style="width:60px;border-bottom:1px solid #6b5020;vertical-align:middle;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body text -->
        <tr>
          <td align="center" style="padding:0 48px 28px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#b8aa95;line-height:1.75;text-align:center;">
              Agradecemos o teu interesse<br/>
              em colaborar com a <strong style="color:#d4bc8a;font-weight:600;">RL Photo.Video</strong>.<br/>
              A nossa equipa vai <strong style="color:#e8dcc8;">analisar</strong><br/>
              <strong style="color:#e8dcc8;">o teu portfólio</strong> com atenção.
            </p>
          </td>
        </tr>

        <!-- Box próximo passo -->
        <tr>
          <td align="center" style="padding:0 48px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #8a6a30;border-radius:2px;">
              <tr>
                <td align="center" style="padding:18px 24px 20px;">
                  <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:9px;color:#8a6a30;letter-spacing:0.35em;text-transform:uppercase;">Próximo Passo</p>
                  <p style="margin:0;font-family:Georgia,serif;font-style:italic;font-size:22px;color:#c9a55a;letter-spacing:0.02em;">Análise de Portfólio</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer text -->
        <tr>
          <td align="center" style="padding:0 48px 32px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#8a7d68;line-height:1.75;text-align:center;">
              Entraremos em contacto assim que<br/>
              a análise estiver <strong style="color:#b8aa95;">concluída</strong>.<br/>
              Obrigado pela paciência.
            </p>
          </td>
        </tr>

        <!-- Corner bottom -->
        <tr>
          <td style="padding:0 28px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:18px;height:18px;border-bottom:1px solid #8a6a30;border-left:1px solid #8a6a30;"></td>
                <td></td>
                <td style="width:18px;height:18px;border-bottom:1px solid #8a6a30;border-right:1px solid #8a6a30;"></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom bar -->
        <tr>
          <td style="padding:16px 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:Arial,sans-serif;font-size:9px;color:#4a4030;letter-spacing:0.25em;text-transform:uppercase;">RL PHOTO · VIDEO</td>
                <td align="right" style="font-family:Arial,sans-serif;font-size:9px;color:#4a4030;letter-spacing:0.25em;text-transform:uppercase;">Recrutamento</td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    const nome          = getField(fields, 'NOME')

    // Tentar encontrar email por label ou por tipo ou por valor com @
    const emailByLabel  = getField(fields, 'EMAIL') ?? getField(fields, 'E-MAIL') ?? getField(fields, 'EMAIL ADDRESS')
    const emailByType   = fields.find((f: any) => f.type === 'INPUT_EMAIL')?.value ?? null
    const emailByValue  = fields.find((f: any) => typeof f.value === 'string' && f.value.includes('@') && f.value.includes('.'))?.value ?? null
    const emailFromResp = body.data?.respondent?.email ?? null
    const email         = emailByLabel ?? emailByType ?? emailByValue ?? emailFromResp ?? null

    console.log('[webhook-tally-freelancer] email found:', email)
    console.log('[webhook-tally-freelancer] all fields:', JSON.stringify(fields.map((f:any) => ({ label: f.label, type: f.type, value: f.value }))))
    const telefone      = getField(fields, 'CONTATO')
    const funcao        = getField(fields, 'FUNÇÃO')
    const valor_servico = getField(fields, 'VALOR PELO SERVIÇO')
    const drone         = getField(fields, 'DRONE')
    const valor_drone   = getField(fields, 'VALOR COM DRONE (SÓ DRONE)')
    const faz_edicao    = getField(fields, 'FAZES EDIÇÃO ATÉ 20MIN')
    const valor_edicao  = getField(fields, 'VALOR POR EDIÇÃO')
    const zona          = getField(fields, 'ZONA RESIDÊNCIA')
    const link_trailer  = getField(fields, 'LINK DE VIDEO DE CASAMENTO TRAILER')
    const link_video    = getField(fields, 'LINK DE VIDEO DE CASAMENTO COMPLETO')
    const mensagem      = getField(fields, 'SE TIVERES ALGO ACRESCENTAR COLOCA AQUI')

    if (!nome) {
      return NextResponse.json({ error: 'Nome em falta' }, { status: 400 })
    }

    // ── Supabase ──────────────────────────────────────────────────────────
    const supabasePromise = db()
      .from('freelancers_novos')
      .insert({
        tally_response_id: body.data?.responseId ?? null,
        nome, email, funcao, zona, telefone, valor_servico,
        valor_drone, valor_edicao, drone, faz_edicao,
        link_trailer, link_video, mensagem,
        tipo_eventos: [], avaliacao: [], servicos_feitos: null,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error('[webhook-tally-freelancer] Supabase error:', error)
      })

    // ── Notion ────────────────────────────────────────────────────────────
    const notionProps: Record<string, any> = {
      'Nome': { title: [{ text: { content: nome } }] },
    }
    if (funcao)        notionProps['FUNÇÃO']               = { select: { name: funcao } }
    if (zona)          notionProps['ZONA DE RESIDÊNCIA']   = { select: { name: zona } }
    if (telefone)      notionProps['Telefone']             = { phone_number: telefone }
    if (valor_servico) notionProps['VALOR POR SERVIÇO']    = { rich_text: [{ text: { content: valor_servico } }] }
    if (valor_drone)   notionProps['VALOR DO DRONE']       = { rich_text: [{ text: { content: valor_drone } }] }
    if (valor_edicao)  notionProps['VALOR EDIÇÃO 20 MIN']  = { rich_text: [{ text: { content: valor_edicao } }] }
    if (drone)         notionProps['DRONE']                = { select: { name: drone } }
    if (faz_edicao)    notionProps['FAZ EDIÇÃO DE VIDEO']  = { select: { name: faz_edicao } }
    if (link_trailer)  notionProps['LINK TRAILER']         = { url: link_trailer }
    if (link_video)    notionProps['LINK VIDEO COMPLETO']  = { url: link_video }
    if (mensagem)      notionProps['MENSAGEM']             = { rich_text: [{ text: { content: mensagem } }] }

    const notionPromise = fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: notionH,
      body: JSON.stringify({ parent: { database_id: DB_ID }, properties: notionProps }),
    }).then(async r => {
      if (!r.ok) {
        const e = await r.json()
        console.error('[webhook-tally-freelancer] Notion error:', e)
      }
    })

    // ── Email confirmação ao freelancer ───────────────────────────────────
    const emailPromise = email
      ? fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [email],
            subject: 'Recebemos a tua candidatura · RL Photo.Video',
            html: buildConfirmacaoHtml(nome),
          }),
        }).then(async r => {
          if (!r.ok) {
            const e = await r.json()
            console.error('[webhook-tally-freelancer] Resend error:', e)
          }
        })
      : Promise.resolve()

    await Promise.allSettled([supabasePromise, notionPromise, emailPromise])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[webhook-tally-freelancer]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
