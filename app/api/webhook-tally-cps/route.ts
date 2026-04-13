import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tally webhook — Dados para Contrato CPS (https://tally.so/r/3XXZIV)
// Guarda independentemente em:
//   1. Supabase → tabela dados_contrato_cps
//   2. Notion   → base de dados EVENTOS 2026

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1' // EVENTOS 2026

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Extrair campo pelo label ─────────────────────────────────────────────────
function getField(fields: any[], ...labels: string[]): string | null {
  for (const label of labels) {
    const f = fields.find(
      (f: any) => f.label?.trim().toLowerCase() === label.trim().toLowerCase()
    )
    if (f && f.value !== null && f.value !== undefined) {
      const v = String(f.value).trim()
      if (v) return v
    }
  }
  return null
}

// ─── Guardar no Notion (EVENTOS 2026) ────────────────────────────────────────
async function saveToNotion(data: Record<string, any>) {
  try {
    const rt = (v: string | null) => ({ rich_text: [{ text: { content: v ?? '' } }] })

    const properties: Record<string, any> = {
      // Título = "AGUARDAR — Nome dos Noivos" (admin atribui referência depois)
      'REFERÊNCIA DO EVENTO': { title: [{ text: { content: `AGUARDAR — ${data.nome_noivos ?? ''}` } }] },
      'CLIENTE':              rt(data.nome_noivos),
    }

    if (data.data_casamento)  properties['DATA DO EVENTO']          = { date: { start: data.data_casamento } }
    if (data.local_cerimonia) properties['LOCAL']                   = rt(data.local_cerimonia)
    if (data.proposta)        properties['PROPOSTA ESCOLHIDA']      = { select: { name: data.proposta } }
    if (data.nome_noiva)      properties['Nome da Noiva']           = rt(data.nome_noiva)
    if (data.email_noiva)     properties['E-mail da noiva']         = { email: data.email_noiva }
    if (data.tel_noiva)       properties['Telefone da noiva']       = { phone_number: data.tel_noiva }
    if (data.morada_noiva)    properties['Morada da Noiva']         = rt(data.morada_noiva)
    if (data.cc_noiva)        properties['N.º C.Cidadão da noiva']  = rt(data.cc_noiva)
    if (data.nif_noiva)       properties['N.º Iden.Fiscal Noiva']   = rt(data.nif_noiva)
    if (data.nome_noivo)      properties['nome do noivo']           = rt(data.nome_noivo)
    if (data.email_noivo)     properties['E-mail do noivo']         = { email: data.email_noivo }
    if (data.tel_noivo)       properties['Telefone do noivo']       = { phone_number: data.tel_noivo }
    if (data.morada_noivo)    properties['Morada do noivo']         = rt(data.morada_noivo)
    if (data.cc_noivo)        properties['N.ºC.Cidadao Noivo']      = rt(data.cc_noivo)
    if (data.nif_noivo)       properties['N.º Iden. Fiscal Noivo']  = rt(data.nif_noivo)

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: EVENTOS_DB }, properties }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[webhook-tally-cps] Notion error:', err)
      return { ok: false, error: err }
    }

    const page = await res.json()
    console.log('[webhook-tally-cps] Notion page created:', page.id)
    return { ok: true, id: page.id }

  } catch (e: any) {
    console.error('[webhook-tally-cps] Notion exception:', e)
    return { ok: false, error: e.message }
  }
}

// ─── Guardar no Supabase ──────────────────────────────────────────────────────
async function saveToSupabase(data: Record<string, any>) {
  try {
    const { data: saved, error } = await db()
      .from('dados_contrato_cps')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('[webhook-tally-cps] Supabase error:', error)
      return { ok: false, error: error.message }
    }

    console.log('[webhook-tally-cps] Supabase row saved:', saved?.id)
    return { ok: true, id: saved?.id }

  } catch (e: any) {
    console.error('[webhook-tally-cps] Supabase exception:', e)
    return { ok: false, error: e.message }
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    // Mapear campos do formulário Tally
    const data = {
      tally_response_id: body.data?.responseId ?? null,
      nome_noivos:    getField(fields, 'NOME DOS NOIVOS/PAIS', 'Nome dos Noivos/Pais'),
      data_casamento: getField(fields, 'DATA DO CASAMENTO/BATIZADO', 'Data do Casamento/Batizado'),
      local_cerimonia:getField(fields, 'LOCAL DA CERIMÓNIA (IGREJA+QUINTA)', 'Local da Cerimónia (Igreja+Quinta)'),
      proposta:       getField(fields, 'PROPOSTA ESCOLHIDA', 'Proposta Escolhida'),
      // Noiva/Mãe
      nome_noiva:     getField(fields, 'NOME DA NOIVA/MÃE', 'Nome da Noiva/Mãe'),
      morada_noiva:   getField(fields, 'MORADA COMPLETA DA NOIVA/MÃE', 'Morada Completa da Noiva/Mãe'),
      tel_noiva:      getField(fields, 'CONTATO NOIVA/MÃE', 'Contato Noiva/Mãe'),
      cc_noiva:       getField(fields, 'N.º C. DE CIDADÃO NOIVA/MÃE', 'N.º C. de Cidadão Noiva/Mãe'),
      nif_noiva:      getField(fields, 'N.º IDEN.FISCAL NOIVA/MÃE', 'N.º Iden.Fiscal Noiva/Mãe'),
      email_noiva:    getField(fields, 'E-MAIL NOIVA/MÃE', 'E-mail Noiva/Mãe', 'E-MAIL NOIVA'),
      // Noivo/Pai
      nome_noivo:     getField(fields, 'NOME DO NOIVO/PAI', 'Nome do Noivo/Pai'),
      morada_noivo:   getField(fields, 'MORADA COMPLETA DO NOIVO/PAI', 'Morada Completa do Noivo/Pai'),
      tel_noivo:      getField(fields, 'CONTATO DO NOIVO/PAI', 'Contato do Noivo/Pai'),
      cc_noivo:       getField(fields, 'N.º C.CIDADÃO NOIVO/PAI', 'N.º C.Cidadão Noivo/Pai'),
      nif_noivo:      getField(fields, 'N.º IDE.FISCAL NOIVO/PAI', 'N.º Ide.Fiscal Noivo/Pai'),
      email_noivo:    getField(fields, 'E-MAIL DO NOIVO/PAI', 'E-mail do Noivo/Pai', 'E-MAIL NOIVO'),
      // Serviço
      servico:        getField(fields, 'SERVIÇO PRETENDIDO', 'Serviço Pretendido'),
    }

    console.log('[webhook-tally-cps] Dados recebidos:', data.nome_noivos, data.email_noiva)

    // ── Guardar nos dois sítios em paralelo e de forma independente ──────────
    const [supabaseResult, notionResult] = await Promise.allSettled([
      saveToSupabase(data),
      saveToNotion(data),
    ])

    return NextResponse.json({
      ok: true,
      supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { ok: false, error: 'rejected' },
      notion:   notionResult.status   === 'fulfilled' ? notionResult.value   : { ok: false, error: 'rejected' },
    })

  } catch (err: any) {
    console.error('[webhook-tally-cps] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-cps' })
}
