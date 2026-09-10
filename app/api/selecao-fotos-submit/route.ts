import { NextRequest, NextResponse } from 'next/server'
import { saveSelecao, type SelecaoFotos } from '@/lib/selecao-fotos-save'

// Formulário próprio de seleção de fotos (/form-selecao-fotos/casamento).
// Segue o mesmo fluxo do webhook do Tally: linha em fotos_selecao (Supabase)
// + página na base "FOTOS P/SELEÇÃO" (Notion).

function clean(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const mapped: SelecaoFotos = {
      nome_noivos:   clean(body.nome_noivos)   ?? 'Novo Registo',
      referencia:    clean(body.referencia),
      date:          clean(body.date),
      data_entrada:  today,
      sessao_noivos: clean(body.sessao_noivos),
      fotos_noiva:   clean(body.fotos_noiva),
      fotos_noivo:   clean(body.fotos_noivo),
      convidados:    clean(body.convidados),
      cerimonia:     clean(body.cerimonia),
      bolo_bouquet:  clean(body.bolo_bouquet),
      sala_animacao: clean(body.sala_animacao),
      fotos_album:   clean(body.fotos_album),
      detalhes:      clean(body.detalhes),
    }

    const { id, error } = await saveSelecao(mapped, 'selecao-fotos-submit')
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ ok: true, id })
  } catch (err: any) {
    console.error('[selecao-fotos-submit] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
