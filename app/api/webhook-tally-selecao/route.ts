import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tally webhook — FOTOS P/ SELEÇÃO NOIVOS (https://tally.so/r/448PrO)
// Receives form submission and creates a row in fotos_selecao (Supabase)

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
  // Date fields come as ISO strings — keep only YYYY-MM-DD
  if (f.type === 'INPUT_DATE' || (typeof f.value === 'string' && f.value.includes('T'))) {
    return f.value.split('T')[0]
  }
  return String(f.value).trim() || null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Tally sends: { eventType: "FORM_RESPONSE", data: { fields: [...] } }
    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []

    const row = {
      // Use Tally responseId as id so duplicate submissions don't create duplicates
      id:            body.data?.responseId ?? undefined,
      nome_noivos:   getField(fields, 'NOME DOS NOIVOS')          ?? 'Novo Registo',
      referencia:    getField(fields, 'REFERÊNCIA DO EVENTOS')     ?? null,
      date:          getField(fields, 'DATA DO CASAMENTO')         ?? null,
      data_entrada:  new Date().toISOString().split('T')[0],       // data de submissão
      sessao_noivos: getField(fields, 'SESSÃO NOIVOS')             ?? null,
      fotos_noiva:   getField(fields, 'FOTOS DA NOIVA')            ?? null,
      fotos_noivo:   getField(fields, 'FOTOS DO NOIVO')            ?? null,
      convidados:    getField(fields, 'CONVIDADOS')                ?? null,
      cerimonia:     getField(fields, 'CERIMÓNIA')                 ?? null,
      bolo_bouquet:  getField(fields, 'BOLO E BOUQUET')            ?? null,
      sala_animacao: getField(fields, 'SALA E ANIMAÇÃO')           ?? null,
      fotos_album:   getField(fields, 'FOTOS PARA ÁLBUM')          ?? null,
      detalhes:      getField(fields, 'DETALHES')                  ?? null,
    }

    // Remove id if undefined (let Supabase auto-generate)
    if (!row.id) delete (row as any).id

    const { data, error } = await db()
      .from('fotos_selecao')
      .upsert(row, { onConflict: row.id ? 'id' : undefined } as any)
      .select()
      .single()

    if (error) {
      console.error('[webhook-tally-selecao] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[webhook-tally-selecao] Created row:', data?.id, data?.nome_noivos)
    return NextResponse.json({ ok: true, id: data?.id })

  } catch (err: any) {
    console.error('[webhook-tally-selecao] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow Tally to verify the endpoint with GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-selecao' })
}
