import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text') return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date') return p.date?.start ?? null
    if (type === 'select') return p.select?.name ?? null
    if (type === 'status') return p.status?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number') return p.number ?? p.formula?.number ?? null
    if (type === 'email') return p.email ?? null
    if (type === 'phone') return p.phone_number ?? null
    if (type === 'checkbox') return p.checkbox ?? false
    if (type === 'url') return p.url ?? null
  } catch { return null }
  return null
}

// Mapa: campo interno → { notionKey, notionType }
const FIELD_MAP: Record<string, { key: string; type: string }> = {
  referencia:       { key: 'REFERÊNCIA DO EVENTO',       type: 'title' },
  cliente:          { key: 'CLIENTE',                    type: 'text' },
  local:            { key: 'LOCAL',                      type: 'text' },
  fotografo:        { key: 'FOTOGRAFO',                  type: 'multi_select' },
  videografo:       { key: 'VÍDEOGRAFO ',                type: 'multi_select' },
  editor_fotos:     { key: 'EDITOR DE FOTOS',            type: 'select' },
  proposta:         { key: 'PROPOSTA ESCOLHIDA',         type: 'select' },
  data_evento:      { key: 'DATA DO EVENTO',               type: 'date' },
  valor_foto:       { key: 'VALOR SERVIÇO FOTO',         type: 'number' },
  valor_video:      { key: 'VALOR DO SERVIÇO VÍDEO',     type: 'number' },
  valor_extras:     { key: 'VALOR DOS EXTRAS',           type: 'number' },
  valor_liquido:    { key: 'VALOR LIQUIDO A RECEBER',    type: 'number' },
  data_entrega:     { key: 'DATA FINAL ENTREGA FOTOS',   type: 'date' },
  data_entrega_ini: { key: 'DATA ENTREGA FOTOS',         type: 'date' },
  data_entrada:     { key: 'DATA DE ENTRADA',            type: 'date' },
  fotos_enviadas:   { key: 'FOTOS EDITADAS ANVIADAS',    type: 'checkbox' },
  sel_enviado:      { key: 'FOTOS. SEL ENVIADO',         type: 'checkbox' },
  alerta_30du:      { key: 'ALERTA 30DU ENVIADO',        type: 'checkbox' },
  agendamento_email:{ key: 'AGENDAMENTO EMAIL',          type: 'select' },
  contratos:        { key: 'CONTRATOS',                  type: 'url' },
  nome_noiva:       { key: 'Nome da Noiva',              type: 'text' },
  nome_noivo:       { key: 'nome do noivo',              type: 'text' },
  email_noiva:      { key: 'E-mail da noiva',            type: 'email' },
  email_noivo:      { key: 'E-mail do noivo',            type: 'email' },
  tel_noiva:        { key: 'Telefone da noiva',          type: 'phone' },
  tel_noivo:        { key: 'Telefone do noivo',          type: 'phone' },
  morada_noiva:     { key: 'Morada da Noiva',            type: 'text' },
  morada_noivo:     { key: 'Morada do noivo',            type: 'text' },
  cc_noiva:         { key: 'N.º C.Cidadão da noiva',     type: 'text' },
  cc_noivo:         { key: 'N.ºC.Cidadao Noivo',         type: 'text' },
  nif_noiva:        { key: 'N.º Iden.Fiscal Noiva',      type: 'text' },
  nif_noivo:        { key: 'N.º Iden. Fiscal Noivo',     type: 'text' },
  servico_foto:     { key: 'serviço de fotografia',      type: 'multi_select' },
  servico_video:    { key: 'serviço de video',           type: 'multi_select' },
  nome_disco:       { key: 'NOME DO DISCO',              type: 'multi_select' },
  backup_disco:     { key: 'BACKUP DISCO',               type: 'multi_select' },
  servico_extra:        { key: 'SERVIÇO EXTRA',              type: 'multi_select' },
  servicos_dia:         { key: 'SERVIÇOS DO DIA',            type: 'multi_select' },
  fotos_edicao_estado:  { key: 'FOTOS P/ EDIÇÃO',            type: 'select' },
  sel_fotos_estado:     { key: 'ESTADO SEL. FOTOS',          type: 'select' },
  video_estado:         { key: 'ESTADO DO VIDEO',            type: 'select' },
  album_estado:         { key: 'ESTADO ÁLBUM',               type: 'select' },
}

function buildNotionValue(type: string, value: any): any {
  if (type === 'title')        return { title: [{ text: { content: value ?? '' } }] }
  if (type === 'text')         return { rich_text: [{ text: { content: value ?? '' } }] }
  if (type === 'number')       return { number: value === '' || value === null ? null : Number(value) }
  if (type === 'email')        return { email: value || null }
  if (type === 'phone')        return { phone_number: value || null }
  if (type === 'url')          return { url: value || null }
  if (type === 'checkbox')     return { checkbox: Boolean(value) }
  if (type === 'select')       return { select: value ? { name: value } : null }
  if (type === 'date')         return { date: value ? { start: value } : null }
  if (type === 'multi_select') return { multi_select: (value as string[]).map((n: string) => ({ name: n })) }
  return {}
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const properties: Record<string, any> = {}

    // ── CASCATA DE RENAME DE REFERÊNCIA ──────────────────────────────────────
    // Se o admin alterou a referência do evento (CAS_xxx → CAS_xxx_yy_RL),
    // precisamos de propagar para TODAS as tabelas que usam essa referência
    // como chave: dados_contrato_cps, portais, pagamentos_noivos, etc.
    // Senão fica tudo dessincronizado.
    if (body.referencia !== undefined && body.referencia !== null) {
      const newRef = String(body.referencia).trim()
      if (newRef) {
        const sb = supabase()
        // Procura a referência ANTERIOR — pelo notion_id OU pelo id (orphan)
        const findOld = async (t: string) => {
          const { data } = await sb.from(t).select('referencia').or(`notion_id.eq.${id},id.eq.${id}`).maybeSingle()
          return data?.referencia ?? null
        }
        let oldRef: string | null = null
        for (const t of ['eventos_2026', 'eventos_2027']) {
          oldRef = await findOld(t)
          if (oldRef) break
        }
        if (oldRef && oldRef !== newRef) {
          console.log(`[eventos-notion PATCH] Cascading rename: ${oldRef} → ${newRef}`)
          // dados_contrato_cps
          await sb.from('dados_contrato_cps')
            .update({ referencia_evento: newRef })
            .eq('referencia_evento', oldRef)
          // portais (settings.referencia também precisa de atualizar)
          const { data: oldPortal } = await sb.from('portais').select('settings').eq('referencia', oldRef).maybeSingle()
          if (oldPortal) {
            const newSettings = { ...(oldPortal.settings ?? {}), referencia: newRef }
            // Apaga eventual row com newRef vazio (pode existir por engano)
            await sb.from('portais').delete().eq('referencia', newRef)
            // Renomeia
            await sb.from('portais')
              .update({ referencia: newRef, settings: newSettings })
              .eq('referencia', oldRef)
          }
          // pagamentos_noivos (se tiver coluna referencia)
          try {
            await sb.from('pagamentos_noivos').update({ referencia: newRef }).eq('referencia', oldRef)
          } catch {/* tabela ou coluna pode não existir */}
        }
      }
    }
    // ── /CASCATA ──────────────────────────────────────────────────────────────

    for (const [field, val] of Object.entries(body)) {
      const mapping = FIELD_MAP[field]
      if (!mapping) continue
      properties[mapping.key] = buildNotionValue(mapping.type, val)
    }

    // Só faz PATCH ao Notion se houver propriedades Notion para actualizar
    // Não é fatal se falhar (eventos órfãos sem notion_id devem continuar a
    // sincronizar para Supabase).
    let notionOk = true
    let notionErr: any = null
    if (Object.keys(properties).length > 0) {
      const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!res.ok) {
        notionOk = false
        try { notionErr = await res.json() } catch { notionErr = null }
        console.warn('[eventos-notion PATCH] Notion failed, continuing to Supabase sync:', notionErr?.message)
      }
    }

    // ── Sync campos relevantes para Supabase evento_equipa ─────────────────
    const syncMap: Record<string, string> = {
      sel_fotos_estado:    'estado_sel_fotos',
      video_estado:        'estado_video',
      fotos_edicao_estado: 'fotos_edicao_estado',
      album_estado:        'album_estado',
      cliente:             'cliente',
      status:              'status',
      local:               'local',
      data_evento:         'data_casamento',
    }
    const sbFields: Record<string, any> = {}
    for (const [internal, col] of Object.entries(syncMap)) {
      if (body[internal] !== undefined) sbFields[col] = body[internal]
    }
    if (body.tipo_evento !== undefined) sbFields.tipo_evento = Array.isArray(body.tipo_evento) ? body.tipo_evento.join(', ') : body.tipo_evento
    if (Object.keys(sbFields).length > 0) {
      await supabase().from('evento_equipa').update(sbFields).eq('evento_id', id)
    }

    // ── Sync campos principais para tabela eventos_2026/2027 ──────────────
    // NOTA: na ficha, o user edita `valor_video` (VALOR DO SERVIÇO VÍDEO do Notion).
    // Mas o "Total Vídeo" da página /eventos-2026 soma `valor_liquido` no Supabase.
    // Mapeamento pedido pelo user: valor_video (ficha) → valor_liquido (Supabase)
    const eventosSyncMap: Record<string, string> = {
      cliente:             'cliente',
      local:               'local',
      data_evento:         'data_evento',
      status:              'status',
      valor_foto:          'valor_foto',
      valor_real_foto:     'valor_real_foto',
      // valor_video tem coluna própria agora (separada de valor_liquido).
      // valor_liquido = valor_video + valor_extras - despesas (calculado em separado pela ficha)
      valor_video:         'valor_video',
      valor_liquido:       'valor_liquido',
      fotografo:           'fotografo',
      tipo_evento:         'tipo_evento',
      tipo_servico:        'tipo_servico',
      servicos_dia:        'servicos_dia',
      referencia:          'referencia',
      fotos_enviadas:      'fotos_enviadas',
      // Estado das Entregas — guardados em Supabase para fiabilidade
      sel_fotos_estado:    'sel_fotos_estado',
      video_estado:        'video_estado',
      fotos_edicao_estado: 'fotos_edicao_estado',
      album_estado:        'album_estado',
      // Serviços do contrato — essenciais para mostrar no PDF do contrato
      // mesmo em eventos sem Notion (fallback Supabase)
      servico_foto:        'servico_foto',
      servico_video:       'servico_video',
    }
    const evFields: Record<string, any> = {}
    // Colunas que são text (guardam JSON string)
    const JSON_STRING_COLS = new Set(['tipo_evento', 'fotografo'])
    // Colunas que são array Postgres (text[])
    const PG_ARRAY_COLS = new Set(['tipo_servico', 'servicos_dia'])
    for (const [internal, col] of Object.entries(eventosSyncMap)) {
      if (body[internal] !== undefined) {
        const v = body[internal]
        if (JSON_STRING_COLS.has(col)) {
          if (Array.isArray(v)) evFields[col] = JSON.stringify(v)
          else if (typeof v === 'string') {
            const s = v.trim()
            evFields[col] = s.startsWith('[') ? s : JSON.stringify(s ? [s] : [])
          } else if (v == null) evFields[col] = null
          else evFields[col] = JSON.stringify([String(v)])
        } else if (PG_ARRAY_COLS.has(col)) {
          // text[]: passar array Postgres diretamente
          if (Array.isArray(v)) evFields[col] = v
          else if (typeof v === 'string' && v.trim().startsWith('[')) {
            try { evFields[col] = JSON.parse(v) } catch { evFields[col] = v ? [v] : null }
          } else if (v == null || v === '') evFields[col] = null
          else evFields[col] = [String(v)]
        } else {
          evFields[col] = v
        }
      }
    }
    if (Object.keys(evFields).length > 0) {
      // Determinar tabela pelo ano da data, se existir
      let ano = 2026
      if (body.data_evento) {
        ano = parseInt(String(body.data_evento).slice(0, 4)) || 2026
      } else {
        // Buscar data atual do Supabase para determinar a tabela (procura por notion_id OU id)
        for (const t of ['eventos_2026', 'eventos_2027']) {
          const { data } = await supabase().from(t).select('data_evento').or(`notion_id.eq.${id},id.eq.${id}`).limit(1).maybeSingle()
          if (data) {
            ano = parseInt(String(data.data_evento).slice(0, 4)) || 2026
            break
          }
        }
      }
      const table = ano === 2027 ? 'eventos_2027' : 'eventos_2026'
      // Tenta por notion_id primeiro
      const { data: byNotion } = await supabase().from(table).update(evFields).eq('notion_id', id).select('id, referencia')
      // Se não houve match (evento órfão sem notion_id), tenta por id (Supabase PK)
      if (!byNotion || byNotion.length === 0) {
        await supabase().from(table).update(evFields).eq('id', id)
      }

      // ── Sync para freelancer_casamentos (servicos_dia + local_cerimonia + hora_inicio) ──
      // Quando admin edita o evento, propaga estes campos para todos os
      // freelancer_casamentos com a mesma referência (ou local+data se sem ref).
      if (body.servicos_dia !== undefined || body.local_cerimonia !== undefined || body.hora_inicio !== undefined) {
        const refToSync = (byNotion?.[0]?.referencia ?? body.referencia) as string | undefined
        const fcFields: Record<string, any> = {}
        if (body.servicos_dia !== undefined)    fcFields.servicos_dia    = body.servicos_dia
        if (body.local_cerimonia !== undefined) fcFields.local_cerimonia = body.local_cerimonia
        if (body.hora_inicio !== undefined)     fcFields.hora_inicio     = body.hora_inicio
        if (Object.keys(fcFields).length > 0) {
          const sb = supabase()
          // 1) Match por referência
          if (refToSync) {
            await sb.from('freelancer_casamentos').update(fcFields).eq('referencia', refToSync).then(() => {}).catch(() => {})
          }
          // 2) Fallback: match por local + data_evento (case-insensitive)
          //    Útil para casamentos sem referencia ainda associada
          try {
            // Buscar local/data do evento (do payload ou do row Supabase)
            let eventLocal: string | undefined = body.local
            let eventData: string | undefined = body.data_evento
            if (!eventLocal || !eventData) {
              const { data: evRow } = await sb.from(table).select('local, data_evento').eq('id', byNotion?.[0]?.id ?? id).maybeSingle()
              if (evRow) {
                eventLocal = eventLocal ?? evRow.local
                eventData = eventData ?? evRow.data_evento
              }
            }
            if (eventLocal && eventData) {
              // Match por ilike (case-insensitive contains) no local + data exata
              await sb.from('freelancer_casamentos')
                .update(fcFields)
                .ilike('local', `%${eventLocal}%`)
                .eq('data_casamento', eventData)
                .then(() => {}).catch(() => {})
            }
          } catch { /* ignora se colunas não existem */ }
        }
      }
    }

    if (!notionOk && Object.keys(properties).length > 0) {
      // Notion falhou mas Supabase deve ter sincronizado — devolve ok mas com aviso
      return NextResponse.json({ ok: true, notionWarning: notionErr?.message ?? 'Notion update failed' })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Fallback: o [id] pode ser um id Supabase de um evento criado sem Notion
      // (ex.: form /contrato-cps cujo saveToNotion falhou). Carrega do Supabase
      // e devolve uma "página virtual" com a mesma forma que o Notion devolveria.
      const sb = supabase()
      const { data: orphan } = await sb
        .from('eventos_2026')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!orphan) {
        const err = await res.json()
        return NextResponse.json({ error: err.message }, { status: res.status })
      }

      // Constrói o evento usando só dados Supabase
      let tipoEventoArr: string[] = []
      try { tipoEventoArr = typeof orphan.tipo_evento === 'string' ? JSON.parse(orphan.tipo_evento) : (orphan.tipo_evento ?? []) } catch { tipoEventoArr = [] }

      // Procura os dados detalhados em dados_contrato_cps (form submission)
      // Match por referencia_evento; fallback por nome_noivos+data
      let contrato: any = null
      if (orphan.referencia) {
        const { data } = await sb
          .from('dados_contrato_cps')
          .select('*')
          .eq('referencia_evento', orphan.referencia)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
        contrato = data
      }
      if (!contrato && orphan.cliente && orphan.data_evento) {
        const { data } = await sb
          .from('dados_contrato_cps')
          .select('*')
          .eq('nome_noivos', orphan.cliente)
          .eq('data_casamento', orphan.data_evento)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle()
        contrato = data
      }

      const event = {
        id: orphan.id,
        referencia:       orphan.referencia ?? '',
        cliente:          orphan.cliente ?? '',
        data_evento:      orphan.data_evento ?? null,
        local:            orphan.local ?? '',
        tipo_evento:      tipoEventoArr,
        tipo_servico:     orphan.tipo_servico ?? [],
        servico_extra:    [],
        status:           orphan.status ?? 'Não iniciada',
        fotografo:        (() => { try { return JSON.parse(orphan.fotografo ?? '[]') } catch { return [] } })(),
        videografo:       [],
        editor_fotos:     null,
        proposta:         contrato?.proposta ?? null,
        valor_liquido:    orphan.valor_liquido ?? null,
        valor_foto:       orphan.valor_foto ?? null,
        valor_video:      (orphan as any).valor_video ?? null,
        valor_real_foto:  orphan.valor_real_foto ?? null,
        fotos_edicao_estado: orphan.fotos_edicao_estado ?? null,
        sel_fotos_estado:    orphan.sel_fotos_estado ?? null,
        video_estado:        orphan.video_estado ?? null,
        album_estado:        orphan.album_estado ?? null,
        valor_extras:     null,
        data_entrega:     null,
        data_entrega_ini: null,
        data_entrada:     null,
        fotos_enviadas:   orphan.fotos_enviadas ?? false,
        sel_enviado:      false,
        alerta_30du:      false,
        agendamento_email: null,
        contratos:        null,
        // Dados dos noivos / pais — vindos do form
        nome_noiva:       contrato?.nome_noiva   ?? null,
        nome_noivo:       contrato?.nome_noivo   ?? null,
        email_noiva:      contrato?.email_noiva  ?? null,
        email_noivo:      contrato?.email_noivo  ?? null,
        tel_noiva:        contrato?.tel_noiva    ?? null,
        tel_noivo:        contrato?.tel_noivo    ?? null,
        morada_noiva:     contrato?.morada_noiva ?? null,
        morada_noivo:     contrato?.morada_noivo ?? null,
        cc_noiva:         contrato?.cc_noiva     ?? null,
        cc_noivo:         contrato?.cc_noivo     ?? null,
        nif_noiva:        contrato?.nif_noiva    ?? null,
        nif_noivo:        contrato?.nif_noivo    ?? null,
        // Campos extra (batizado)
        nome_crianca:     (orphan as any).nome_crianca ?? contrato?.nome_crianca ?? null,
        idade_crianca:    (orphan as any).idade_crianca ?? contrato?.idade_crianca ?? null,
        // Serviços contratados (para mostrar no PDF do contrato)
        servico_foto:     (orphan as any).servico_foto  ?? [],
        servico_video:    (orphan as any).servico_video ?? [],
        notion_url:       null,
        _orphan: true, // flag para a UI saber que este evento ainda não tem Notion
      }
      return NextResponse.json({ event })
    }

    const page = await res.json()
    const p = page.properties ?? {}

    // Buscar campos do Supabase (mais fiável que Notion para campos de estado)
    const sbClient = supabase()
    const { data: sbRow } = await sbClient
      .from('eventos_2026')
      .select('*')
      .eq('notion_id', id)
      .maybeSingle()

    // Buscar dados detalhados em dados_contrato_cps (form submission) para
    // suplementar/substituir campos quando Notion não os tem (retry com payload mínimo)
    const refFromNotion = getProp(p, 'REFERÊNCIA DO EVENTO', 'title')
    const refForLookup = sbRow?.referencia ?? refFromNotion
    let contrato: any = null
    if (refForLookup) {
      const { data: cps } = await sbClient
        .from('dados_contrato_cps')
        .select('*')
        .eq('referencia_evento', refForLookup)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      contrato = cps
    }

    const event = {
      id: page.id,
      referencia:       getProp(p, 'REFERÊNCIA DO EVENTO', 'title'),
      cliente:          getProp(p, 'CLIENTE', 'text'),
      data_evento:      getProp(p, 'DATA DO EVENTO', 'date') ?? contrato?.data_casamento ?? null,
      local:            getProp(p, 'LOCAL', 'text') ?? contrato?.local_cerimonia ?? '',
      tipo_evento:      getProp(p, 'TIPO DE EVENTO', 'multi_select'),
      tipo_servico:     getProp(p, 'TIPO DE SERVIÇO', 'multi_select'),
      servicos_dia:     (getProp(p, 'SERVIÇOS DO DIA', 'multi_select') ?? []).length > 0
                          ? getProp(p, 'SERVIÇOS DO DIA', 'multi_select')
                          : ((sbRow as any)?.servicos_dia ?? []),
      servico_extra:    getProp(p, 'SERVIÇO EXTRA', 'multi_select'),
      status:           getProp(p, 'Status', 'status'),
      fotografo:        getProp(p, 'FOTOGRAFO', 'multi_select'),
      videografo:       getProp(p, 'VÍDEOGRAFO ', 'multi_select'),
      editor_fotos:     getProp(p, 'EDITOR DE FOTOS', 'select'),
      proposta:         getProp(p, 'PROPOSTA ESCOLHIDA', 'select') ?? contrato?.proposta ?? null,
      valor_liquido:    getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
      valor_foto:       getProp(p, 'VALOR SERVIÇO FOTO', 'number') ?? sbRow?.valor_foto ?? null,
      valor_real_foto:  sbRow?.valor_real_foto ?? null,
      // Estado das entregas — Supabase como fonte primária; Notion como fallback
      fotos_edicao_estado:  (sbRow as any)?.fotos_edicao_estado ?? getProp(p, 'FOTOS P/ EDIÇÃO', 'select'),
      sel_fotos_estado:     (sbRow as any)?.sel_fotos_estado    ?? getProp(p, 'ESTADO SEL. FOTOS', 'select'),
      video_estado:         (sbRow as any)?.video_estado        ?? getProp(p, 'ESTADO DO VIDEO', 'select'),
      album_estado:         (sbRow as any)?.album_estado        ?? getProp(p, 'ESTADO ÁLBUM', 'select'),
      valor_video:      getProp(p, 'VALOR DO SERVIÇO VÍDEO', 'number') ?? (sbRow as any)?.valor_video ?? null,
      valor_extras:     getProp(p, 'VALOR DOS EXTRAS', 'number'),
      data_entrega:     getProp(p, 'DATA FINAL ENTREGA FOTOS', 'date'),
      data_entrega_ini: getProp(p, 'DATA ENTREGA FOTOS', 'date'),
      data_entrada:     getProp(p, 'DATA DE ENTRADA', 'date'),
      fotos_enviadas:   getProp(p, 'FOTOS EDITADAS ANVIADAS', 'checkbox'),
      sel_enviado:      getProp(p, 'FOTOS. SEL ENVIADO', 'checkbox'),
      alerta_30du:      getProp(p, 'ALERTA 30DU ENVIADO', 'checkbox'),
      agendamento_email:getProp(p, 'AGENDAMENTO EMAIL', 'select'),
      contratos:        getProp(p, 'CONTRATOS', 'url'),
      // Dados dos noivos / pais — Notion primeiro, dados_contrato_cps como fallback
      nome_noiva:       getProp(p, 'Nome da Noiva', 'text')         ?? contrato?.nome_noiva   ?? null,
      nome_noivo:       getProp(p, 'nome do noivo', 'text')         ?? contrato?.nome_noivo   ?? null,
      email_noiva:      getProp(p, 'E-mail da noiva', 'email')      ?? contrato?.email_noiva  ?? null,
      email_noivo:      getProp(p, 'E-mail do noivo', 'email')      ?? contrato?.email_noivo  ?? null,
      tel_noiva:        getProp(p, 'Telefone da noiva', 'phone')    ?? contrato?.tel_noiva    ?? null,
      tel_noivo:        getProp(p, 'Telefone do noivo', 'phone')    ?? contrato?.tel_noivo    ?? null,
      morada_noiva:     getProp(p, 'Morada da Noiva', 'text')       ?? contrato?.morada_noiva ?? null,
      morada_noivo:     getProp(p, 'Morada do noivo', 'text')       ?? contrato?.morada_noivo ?? null,
      cc_noiva:         getProp(p, 'N.º C.Cidadão da noiva', 'text')?? contrato?.cc_noiva     ?? null,
      cc_noivo:         getProp(p, 'N.ºC.Cidadao Noivo', 'text')    ?? contrato?.cc_noivo     ?? null,
      nif_noiva:        getProp(p, 'N.º Iden.Fiscal Noiva', 'text') ?? contrato?.nif_noiva    ?? null,
      nif_noivo:        getProp(p, 'N.º Iden. Fiscal Noivo', 'text')?? contrato?.nif_noivo    ?? null,
      // Campos extra (batizado)
      nome_crianca:     (sbRow as any)?.nome_crianca  ?? contrato?.nome_crianca  ?? null,
      idade_crianca:    (sbRow as any)?.idade_crianca ?? contrato?.idade_crianca ?? null,
      // Serviços: Notion primeiro (multi_select), fallback Supabase (JSONB)
      servico_foto:     (() => { const v = getProp(p, 'serviço de fotografia', 'multi_select'); return (Array.isArray(v) && v.length > 0) ? v : ((sbRow as any)?.servico_foto ?? []) })(),
      servico_video:    (() => { const v = getProp(p, 'serviço de video', 'multi_select'); return (Array.isArray(v) && v.length > 0) ? v : ((sbRow as any)?.servico_video ?? []) })(),
      nome_disco:           getProp(p, 'NOME DO DISCO', 'multi_select'),
      backup_disco:         getProp(p, 'BACKUP DISCO', 'multi_select'),
      notion_url:           page.url,
    }

    return NextResponse.json({ event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params  // Notion page ID
  const referencia  = _req.nextUrl.searchParams.get('referencia')
  const supabaseId  = _req.nextUrl.searchParams.get('supabaseId')

  try {
    const sb = supabase()
    await Promise.all([
      // Apagar da lista pelo Supabase UUID (id direto) — mais fiável
      ...(supabaseId ? [
        sb.from('eventos_2026').delete().eq('id', supabaseId),
        sb.from('eventos_2027').delete().eq('id', supabaseId),
      ] : [
        // Fallback: por notion_id se não tiver supabaseId
        sb.from('eventos_2026').delete().eq('notion_id', id),
        sb.from('eventos_2027').delete().eq('notion_id', id),
      ]),
      // Limpar restantes tabelas se tiver referência
      ...(referencia ? [
        sb.from('freelancer_casamentos').delete().eq('referencia', referencia),
        sb.from('evento_equipa').delete().eq('referencia', referencia),
      ] : []),
    ])

    // Arquivar no Notion
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived: true }),
    })
    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message }, { status: res.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
