import { NextRequest, NextResponse } from 'next/server'
import { encontrarEventoSelecao } from '@/lib/selecao-fotos-ref'

// Formulário de seleção de fotos: dados do casamento pela referência (vinda do
// link do portal), para o formulário os mostrar trancados. Só nomes e data.
export async function GET(req: NextRequest) {
  const ev = await encontrarEventoSelecao(req.nextUrl.searchParams.get('ref'))
  if (!ev) return NextResponse.json({ ok: false }, { status: 404 })
  return NextResponse.json({ ok: true, referencia: ev.referencia, nome_noivos: ev.nome, date: ev.data })
}
