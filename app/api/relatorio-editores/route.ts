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

  // ── Email (card TRABALHO EDIÇÃO) via Resend ──
  let emailsSent = 0
  if (process.env.RESEND_API_KEY) {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rl-menu-lake.vercel.app'
    const CARD_URL = `${SITE}/card-trabalho-edicao.png`
    const { data: editores } = await supabase.from('freelancers').select('id, nome, email').in('id', editorIds)
    const subject = localStr ? `Trabalho de edição — ${localStr}` : 'Novo trabalho de edição'

    for (const ed of (editores ?? []) as Array<{ id: string; nome: string | null; email: string | null }>) {
      if (!ed.email) continue
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [ed.email],
            subject,
            html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0901;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0901;padding:32px 16px;">
    <tr>
      <td align="center">
        <a href="${SITE}/freelancers/${ed.id}?view=freelancer" style="display:block;text-decoration:none;">
          <img src="${CARD_URL}" width="560" alt="Novo trabalho de edição"
            style="display:block;width:100%;max-width:560px;border:0;" />
        </a>
      </td>
    </tr>
  </table>
</body>
</html>`,
          }),
        })
        emailsSent++
      } catch (e) {
        console.warn(`[relatorio-editores email] falhou para ${ed.email}:`, e)
      }
    }
  }

  return NextResponse.json({ ok: true, sent: editorIds.length, downloads: downloads.length, emailsSent })
}
