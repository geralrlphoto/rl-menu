import { NextRequest, NextResponse } from 'next/server'
import { saveSelecao, type SelecaoFotos } from '@/lib/selecao-fotos-save'

// Tally webhook — FOTOS P/ SELEÇÃO NOIVOS (https://tally.so/r/448PrO)
// On submission: creates row in Supabase fotos_selecao AND page in Notion DB
// (mesma gravação usada pelo formulário próprio — ver lib/selecao-fotos-save)

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.eventType !== 'FORM_RESPONSE') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fields: any[] = body.data?.fields ?? []
    const today = new Date().toISOString().split('T')[0]

    const mapped: SelecaoFotos = {
      nome_noivos:   getField(fields, 'NOME DOS NOIVOS')       ?? 'Novo Registo',
      referencia:    getField(fields, 'REFERÊNCIA DO EVENTOS')  ?? null,
      date:          getField(fields, 'DATA DO CASAMENTO')      ?? null,
      data_entrada:  today,
      preparacao:    null,
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

    const { id, error } = await saveSelecao(mapped, 'webhook-tally-selecao')
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ ok: true, id })

  } catch (err: any) {
    console.error('[webhook-tally-selecao] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow Tally to verify the endpoint with GET
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-selecao' })
}
