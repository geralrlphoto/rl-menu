import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SUPABASE-ONLY. Single-event GET para /eventos-2026/[id] do admin.
// Mesma forma de objecto que /api/eventos-notion/[id] devolve, mas SEM ir ao
// Notion. Isto garante que evento.referencia vem sempre de Supabase, evitando
// a desconexão admin ↔ portal quando o Notion tem o campo Referência vazio.
//
// Aceita `id` como:
//   - Supabase PK uuid (`eventos_2026.id`)
//   - Notion page id (`eventos_2026.notion_id`)
// Procura por ambos e devolve a primeira match.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function supabase() {
  return createClient(SUPABASE_URL, SERVICE_KEY)
}

const parseArr = (v: any): string[] => {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [s] }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const sb = supabase()

    // Procura em eventos_2026 e eventos_2027 por notion_id OU id
    let row: any = null
    for (const table of ['eventos_2026', 'eventos_2027']) {
      const { data } = await sb
        .from(table)
        .select('*')
        .or(`notion_id.eq.${id},id.eq.${id}`)
        .limit(1)
        .maybeSingle()
      if (data) { row = data; break }
    }
    if (!row) {
      return NextResponse.json({ error: 'event not found' }, { status: 404 })
    }

    // Equipa
    const { data: equipa } = await sb
      .from('evento_equipa')
      .select('fotografo, videografo, editor_album, editor_video, editor_fotos')
      .or(`evento_id.eq.${row.notion_id ?? row.id},referencia.eq.${row.referencia ?? ''}`)
      .limit(1)
      .maybeSingle()

    // Dados detalhados em dados_contrato_cps (noivos, contactos, fiscais)
    let contrato: any = null
    if (row.referencia) {
      const { data } = await sb
        .from('dados_contrato_cps')
        .select('*')
        .eq('referencia_evento', row.referencia)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      contrato = data
    }
    if (!contrato && row.cliente && row.data_evento) {
      const { data } = await sb
        .from('dados_contrato_cps')
        .select('*')
        .eq('nome_noivos', row.cliente)
        .eq('data_casamento', row.data_evento)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      contrato = data
    }

    const fotografo: string[] = (equipa?.fotografo?.length ? equipa.fotografo : parseArr(row.fotografo))
    const videografo: string[] = (equipa?.videografo?.length ? equipa.videografo : parseArr(row.videografo))

    // Mesma forma de objecto que /api/eventos-notion/[id] devolve no fallback
    const event = {
      id:                row.notion_id ?? row.id,
      _supabase_id:      row.id,
      referencia:        row.referencia ?? '',
      cliente:           row.cliente ?? '',
      data_evento:       row.data_evento ?? null,
      local:             row.local ?? '',
      tipo_evento:       parseArr(row.tipo_evento),
      tipo_servico:      parseArr(row.tipo_servico),
      servicos_dia:      parseArr(row.servicos_dia),
      servico_extra:     parseArr((row as any).servico_extra),
      status:            row.status ?? 'Não iniciada',
      fotografo,
      videografo,
      editor_fotos:      equipa?.editor_fotos ?? row.editor_fotos ?? null,
      editor_album:      equipa?.editor_album ?? [],
      editor_video:      equipa?.editor_video ?? [],
      proposta:          contrato?.proposta ?? null,
      valor_liquido:     row.valor_liquido ?? null,
      valor_foto:        row.valor_foto ?? null,
      valor_real_foto:   row.valor_real_foto ?? null,
      valor_video:       (row as any).valor_video ?? null,
      valor_extras:      row.valor_extras ?? null,
      // Estado das entregas — Supabase é fonte primária
      fotos_edicao_estado: row.fotos_edicao_estado ?? null,
      sel_fotos_estado:    row.sel_fotos_estado ?? null,
      video_estado:        row.video_estado ?? null,
      album_estado:        row.album_estado ?? null,
      data_entrega:      row.data_entrega ?? null,
      data_entrega_ini:  row.data_entrega_ini ?? null,
      data_entrada:      row.data_entrada ?? null,
      fotos_enviadas:    row.fotos_enviadas ?? false,
      sel_enviado:       row.sel_enviado ?? false,
      alerta_30du:       row.alerta_30du ?? false,
      agendamento_email: row.agendamento_email ?? null,
      contratos:         row.contratos ?? null,
      local_cerimonia:   row.local_cerimonia ?? null,
      hora_inicio:       row.hora_inicio ?? null,
      // Dados dos noivos / pais — dados_contrato_cps como fonte única
      nome_noiva:        contrato?.nome_noiva   ?? null,
      nome_noivo:        contrato?.nome_noivo   ?? null,
      email_noiva:       contrato?.email_noiva  ?? null,
      email_noivo:       contrato?.email_noivo  ?? null,
      tel_noiva:         contrato?.tel_noiva    ?? null,
      tel_noivo:         contrato?.tel_noivo    ?? null,
      morada_noiva:      contrato?.morada_noiva ?? null,
      morada_noivo:      contrato?.morada_noivo ?? null,
      cc_noiva:          contrato?.cc_noiva     ?? null,
      cc_noivo:          contrato?.cc_noivo     ?? null,
      nif_noiva:         contrato?.nif_noiva    ?? null,
      nif_noivo:         contrato?.nif_noivo    ?? null,
      // Campos extra (batizado)
      nome_crianca:      (row as any).nome_crianca  ?? contrato?.nome_crianca  ?? null,
      idade_crianca:     (row as any).idade_crianca ?? contrato?.idade_crianca ?? null,
      // Serviços contratados
      servico_foto:      (row as any).servico_foto  ?? [],
      servico_video:     (row as any).servico_video ?? [],
      nome_disco:        parseArr(row.nome_disco),
      backup_disco:      parseArr(row.backup_disco),
      notion_url:        row.notion_id ? `https://www.notion.so/${String(row.notion_id).replace(/-/g, '')}` : null,
      _from_supabase:    true,
    }

    return NextResponse.json({ event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
