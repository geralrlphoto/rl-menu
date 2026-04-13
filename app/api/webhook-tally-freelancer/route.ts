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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    const nome          = getField(fields, 'NOME')
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
        nome,
        funcao,
        zona,
        telefone,
        valor_servico,
        valor_drone,
        valor_edicao,
        drone,
        faz_edicao,
        link_trailer,
        link_video,
        mensagem,
        tipo_eventos:  [],
        avaliacao:     [],
        servicos_feitos: null,
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

    // Guardar nos dois em paralelo — falhas independentes
    await Promise.allSettled([supabasePromise, notionPromise])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[webhook-tally-freelancer]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
