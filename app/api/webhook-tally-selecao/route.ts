import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tally webhook — FOTOS P/ SELEÇÃO NOIVOS (https://tally.so/r/448PrO)
// On submission: creates row in Supabase fotos_selecao AND page in Notion DB

const NOTION_TOKEN  = process.env.NOTION_TOKEN!
const NOTION_DB_ID  = '30d220116d8a80cf8568e19df7af1d7b' // "FOTOS P/SELEÇÃO" database

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getField(fields: any[], label: string): string | null {
  const f = fields.find(
    (f: any) => f.label?.trim().toLowerCase() === label.trim().toLowerCase()
  )
  if (!f || f.value === null || f.value === undefined) return null
  if (f.type === 'INPUT_DATE' || (typeof f.value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(f.value))) {
    return f.value.split('T')[0]
  }
  return String(f.value).trim() || null
}

function rt(text: string | null) {
  // Notion rich_text property value
  return { rich_text: [{ text: { content: text ?? '' } }] }
}

async function saveToNotion(data: {
  nome_noivos: string
  referencia: string | null
  date: string | null
  data_entrada: string
  sessao_noivos: string | null
  fotos_noiva: string | null
  fotos_noivo: string | null
  convidados: string | null
  cerimonia: string | null
  bolo_bouquet: string | null
  sala_animacao: string | null
  fotos_album: string | null
  detalhes: string | null
}) {
  const properties: Record<string, any> = {
    'NOME DOS NOIVOS':      { title: [{ text: { content: data.nome_noivos } }] },
    'REFERÊNCIA DO EVENTO': rt(data.referencia),
    'SESSÃO NOIVOS':        rt(data.sessao_noivos),
    'FOTOS DA NOIVA':       rt(data.fotos_noiva),
    'FOTOS DO NOIVO':       rt(data.fotos_noivo),
    'CONVIDADOS':           rt(data.convidados),
    'CERIMÓNIA':            rt(data.cerimonia),
    'BOLO E BOUQUET':       rt(data.bolo_bouquet),
    'SALA E ANIMAÇÃO':      rt(data.sala_animacao),
    'FOTOS P/ÁLBUM':        rt(data.fotos_album),
    'DETALHES':             rt(data.detalhes),
  }

  if (data.date) {
    properties['Date'] = { date: { start: data.date } }
  }
  properties['Data  de Entrada'] = { date: { start: data.data_entrada } }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[webhook-tally-selecao] Notion error:', err)
  } else {
    const page = await res.json()
    console.log('[webhook-tally-selecao] Notion page created:', page.id)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []
    const today = new Date().toISOString().split('T')[0]

    const mapped = {
      nome_noivos:   getField(fields, 'NOME DOS NOIVOS')       ?? 'Novo Registo',
      referencia:    getField(fields, 'REFERÊNCIA DO EVENTOS')  ?? null,
      date:          getField(fields, 'DATA DO CASAMENTO')      ?? null,
      data_entrada:  today,
      sessao_noivos: getField(fields, 'SESSÃO NOIVOS')          ?? null,
      fotos_noiva:   getField(fields, 'FOTOS DA NOIVA')         ?? null,
      fotos_noivo:   getField(fields, 'FOTOS DO NOIVO')         ?? null,
      convidados:    getField(fields, 'CONVIDADOS')             ?? null,
      cerimonia:     getField(fields, 'CERIMÓNIA')              ?? null,
      bolo_bouquet:  getField(fields, 'BOLO E BOUQUET')         ?? null,
      sala_animacao: getField(fields, 'SALA E ANIMAÇÃO')        ?? null,
      fotos_album:   getField(fields, 'FOTOS PARA ÁLBUM')       ?? null,
      detalhes:      getField(fields, 'DETALHES')               ?? null,
    }

    // ── 1. Supabase ───────────────────────────────────────────────────────────
    const { data: saved, error } = await db()
      .from('fotos_selecao')
      .insert(mapped)
      .select()
      .single()

    if (error) {
      console.error('[webhook-tally-selecao] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.log('[webhook-tally-selecao] Supabase row saved:', saved?.id, saved?.nome_noivos)

    // ── 2. Notion (non-blocking — don't fail if Notion is slow) ──────────────
    saveToNotion(mapped).catch(e =>
      console.error('[webhook-tally-selecao] Notion save failed:', e)
    )

    return NextResponse.json({ ok: true, id: saved?.id })

  } catch (err: any) {
    console.error('[webhook-tally-selecao] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow Tally to verify the endpoint with GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-selecao' })
}
