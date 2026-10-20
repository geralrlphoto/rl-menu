import { NextRequest, NextResponse } from 'next/server'
import { encontrarEventoSelecao, limiteFotosPacote } from '@/lib/selecao-fotos-ref'

// Formulário de seleção de fotos: dados do casamento pela referência (vinda do
// link do portal), para o formulário os mostrar trancados. Só nomes, data e o
// número de fotografias do pacote (para avisar se escolherem mais).
export async function GET(req: NextRequest) {
  const ev = await encontrarEventoSelecao(req.nextUrl.searchParams.get('ref'))
  if (!ev) return NextResponse.json({ ok: false }, { status: 404 })
  const limite = await limiteFotosPacote(ev.referencia).catch(() => null)
  return NextResponse.json({ ok: true, referencia: ev.referencia, nome_noivos: ev.nome, date: ev.data, limite })
}
