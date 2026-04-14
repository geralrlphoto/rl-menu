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
<body style="margin:0;padding:0;background:#0e0c07;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0c07;">
  <tr>
    <td align="center" style="padding:32px 20px;">
      <img src="https://rl-menu-lake.vercel.app/card-freelancer-obrigado.png" width="560" alt="Recebemos a tua candidatura" style="display:block;max-width:100%;border:0;"/>
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
