import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST: envia o(s) relatório(s) diário(s) do evento aos editores selecionados.
//   Cria uma notificação no sino do portal de cada editor, com o link de
//   download do conteúdo (relatorio_diario.downloadUrl) para descarregarem.
export async function POST(req: NextRequest) {
  const { referencia, evento_id, editorIds, local, data_casamento } = await req.json()
  if (!referencia && !evento_id) return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })
  if (!Array.isArray(editorIds) || editorIds.length === 0) {
    return NextResponse.json({ error: 'editorIds required' }, { status: 400 })
  }

  const supabase = db()

  // Reúne os relatórios do evento (com link de download, se existir)
  const { data: fcs } = referencia
    ? await supabase.from('freelancer_casamentos').select('freelancer_id, relatorio_diario').eq('referencia', referencia)
    : await supabase.from('freelancer_casamentos').select('freelancer_id, relatorio_diario').eq('evento_id', evento_id)
  const rows = (fcs ?? []).filter((r: any) => r.relatorio_diario)

  const downloads: string[] = []
  for (const r of rows) {
    const u = (r.relatorio_diario?.downloadUrl ?? '').trim()
    if (u) downloads.push(u)
  }

  const localStr = String(local ?? '').trim()
  const titulo = '🎬 Conteúdo para edição disponível'
  const linhas = [
    localStr ? `Evento: ${localStr}` : 'Novo conteúdo para edição.',
    data_casamento ? `Data: ${String(data_casamento).slice(0, 10)}` : '',
    downloads.length
      ? `\nLink(s) de download:\n${downloads.join('\n')}`
      : '\n(Ainda sem link de download — será adicionado.)',
  ].filter(Boolean)
  const mensagem = linhas.join('\n')

  for (const eid of editorIds) {
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: eid,
      titulo,
      mensagem,
      tipo: 'relatorio_editor',
      lida: false,
    })
  }

  return NextResponse.json({ ok: true, sent: editorIds.length, downloads: downloads.length })
}
