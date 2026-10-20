import { NextRequest, NextResponse } from 'next/server'
import { eventoParaEquipa } from '@/lib/cardEquipa'
import { emailTrabalhoEdicao } from '@/lib/emailsFreelancers'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function addWorkingDays(dateStr: string, days: number): string | null {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d.toISOString().split('T')[0]
}

// POST: envia o(s) relatório(s) diário(s) do evento aos editores selecionados.
//   Cria uma notificação no sino do portal de cada editor, com o link de
//   download do conteúdo (relatorio_diario.downloadUrl) para descarregarem.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referencia, evento_id, local, data_casamento } = body
  if (!referencia && !evento_id) return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })

  const supabase = db()

  // A ficha do evento guarda o Editor de Vídeo pelo nome; aqui resolve-se o id.
  let editorIds: string[] = Array.isArray(body.editorIds) ? body.editorIds : []
  if (editorIds.length === 0 && Array.isArray(body.editorNomes) && body.editorNomes.length) {
    const alvo = body.editorNomes.map((n: string) => String(n).toLowerCase().trim())
    const { data: fls } = await supabase.from('freelancers').select('id, nome')
    editorIds = (fls ?? []).filter((f: any) => alvo.includes(String(f.nome ?? '').toLowerCase().trim())).map((f: any) => f.id)
  }
  if (editorIds.length === 0) {
    return NextResponse.json({ error: 'Editor não encontrado na equipa' }, { status: 400 })
  }

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
  // Meta estruturada para o painel do editor listar os trabalhos (parse __META__…__/META__).
  const meta = JSON.stringify({ referencia: referencia ?? null, evento_id: evento_id ?? null, local: localStr || null, data_casamento: data_casamento ?? null, downloads })
  const mensagem = `__META__${meta}__/META__\n${linhas.join('\n')}`

  for (const eid of editorIds) {
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: eid,
      titulo,
      mensagem,
      tipo: 'relatorio_editor',
      lida: false,
    })
  }

  // Cada trabalho enviado é dinheiro a receber pelo editor: cria o pagamento
  // pendente para aparecer em /painel-editor/pagamentos. Valor = "Valor Editor
  // Vídeo" da ficha; prazo = entrega do vídeo (evento + 180 dias úteis).
  if (referencia) {
    const { data: portal } = await supabase
      .from('portais').select('valor_editor_video:settings->>valor_editor_video')
      .ilike('referencia', referencia).maybeSingle()
    const valor = Number((portal as any)?.valor_editor_video) || 0
    const descricao = [referencia, localStr].filter(Boolean).join(' — ')
    const prazo = data_casamento ? addWorkingDays(String(data_casamento).slice(0, 10), 180) : null
    for (const eid of editorIds) {
      const { data: jaExiste } = await supabase
        .from('freelancer_pagamentos').select('id')
        .eq('freelancer_id', eid).ilike('descricao', `${referencia}%`)
        .limit(1).maybeSingle()
      if (jaExiste) continue
      const { error: pagErr } = await supabase.from('freelancer_pagamentos').insert({
        freelancer_id: eid, descricao, valor, data_prevista: prazo, status: 'PENDENTE',
      })
      if (pagErr) console.warn('[relatorio-editores] pagamento nao criado:', pagErr.message)
    }
  }

  // ── Email (card TRABALHO EDIÇÃO) via Resend ──
  let emailsSent = 0
  if (process.env.RESEND_API_KEY) {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.rlphotovideo.pt'
    const { data: editores } = await supabase.from('freelancers').select('id, nome, email').in('id', editorIds)
    const ev = await eventoParaEquipa(referencia)
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
            html: emailTrabalhoEdicao({ editorId: ed.id, nome: ed.nome, referencia, noivos: ev.noivos, data: data_casamento ?? ev.data, local: localStr || ev.local, downloads }),
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
