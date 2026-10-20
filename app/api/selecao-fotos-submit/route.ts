import { NextRequest, NextResponse } from 'next/server'
import { saveSelecao, type SelecaoFotos } from '@/lib/selecao-fotos-save'
import { enviarEmailAdminSelecao } from '@/lib/selecao-fotos-email'
import { encontrarEventoSelecao, nomesBatem } from '@/lib/selecao-fotos-ref'
import { enviarTicketFotos } from '@/lib/ticketFotos'
import { registarFoto } from '@/lib/fotografiaHistorico'

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

    // A referência tem de existir e de ser destes noivos: assim a seleção chega
    // sempre ligada ao casamento certo (antes vinham "00", "LA", "Casamento"...).
    const ev = await encontrarEventoSelecao(clean(body.referencia))
    if (!ev) {
      return NextResponse.json({ error: 'Esta referência não existe. Copiem-na do vosso portal (ex.: CAS_011_26_RL) ou abram o formulário a partir do portal.' }, { status: 400 })
    }
    if (!nomesBatem(clean(body.nome_noivos), ev.nome)) {
      return NextResponse.json({ error: 'A referência não corresponde aos nomes dos noivos. Confirmem a referência no vosso portal.' }, { status: 400 })
    }
    body.referencia = ev.referencia
    if (!clean(body.date) && ev.data) body.date = ev.data

    const mapped: SelecaoFotos = {
      nome_noivos:   clean(body.nome_noivos)   ?? 'Novo Registo',
      referencia:    clean(body.referencia),
      date:          clean(body.date),
      data_entrada:  today,
      preparacao:    clean(body.preparacao),
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

    // Aviso por email ao admin — não deve impedir a resposta ao formulário
    const tipo = body.tipo === 'batizado' ? 'batizado' : 'casamento'
    await enviarEmailAdminSelecao(mapped, tipo).catch(e =>
      console.error('[selecao-fotos-submit] email falhou:', e)
    )

    // Ticket das Fotografias aos noivos: "Recebemos a vossa seleção" + histórico do departamento
    await enviarTicketFotos('recebida', ev.referencia).catch(() => null)
    await registarFoto(ev.referencia, 'Seleção recebida', 'Noivos')

    return NextResponse.json({ ok: true, id })
  } catch (err: any) {
    console.error('[selecao-fotos-submit] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
