import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const TIPO_LABELS: Record<string, string> = {
  selecao:                  'Seleção de Fotos',
  provas:                   'Fotos Prova',
  editadas:                 'Fotos Editadas',
  album:                    'Maquete Álbum',
  nova_selecao:             'Nova Seleção dos Noivos',
  status_selecao:           'Estado · Seleção de Fotos',
  status_editadas:          'Estado · Fotos Editadas',
  status_album:             'Estado · Maquete Álbum',
  status_provas:            'Estado · Fotos Prova',
  fotos_convidados_email:   'Fotos Convidados · Email Enviado',
  fotos_convidados_ctt:     'Fotos Convidados · CTT Enviado',
  nova_tarefa_atribuida:    'Tarefa enviada entre membros',
  album_aprovado:           'Álbum Aprovado pelos Noivos',
  mensagem_noivos:          'Mensagem dos Noivos',
  blog_subscriber:          'Nova Subscrição do Blog',
  video_prazo:              'Prazo de Entrega do Vídeo',
  fotos_edicao_prazo:       'Prazo das Fotos em Edição',
  noivos_selecao_falta:     'Noivos em Falta — Escolher Fotos',
  booking_reservado:        'Marcação Reservada pelos Noivos',
  prewedding_alerta:        'Alerta — Marcar Pré-Wedding',
  relatorio_diario_enviado: 'Relatório Diário enviado',
  video_estado_alterado:    'Estado do Vídeo · Editor',
  video_revisao_enviada:    'Vídeo para Revisão · Editor',
}

const TIPO_ICONS: Record<string, string> = {
  selecao:                  '◫',
  provas:                   '◧',
  editadas:                 '✓',
  album:                    '◐',
  nova_selecao:             '★',
  status_selecao:           '◫',
  status_editadas:          '✓',
  status_album:             '◐',
  status_provas:            '◧',
  fotos_convidados_email:   '@',
  fotos_convidados_ctt:     '✉',
  nova_tarefa_atribuida:    '✈',
  album_aprovado:           '✓',
  mensagem_noivos:          '💬',
  blog_subscriber:          '✉',
  video_prazo:              '🎬',
  fotos_edicao_prazo:       '✎',
  noivos_selecao_falta:     '⏰',
  booking_reservado:        '📅',
  prewedding_alerta:        '💍',
  relatorio_diario_enviado: '🎥',
  video_estado_alterado:    '🎬',
  video_revisao_enviada:    '🎞',
}

// Soma dias úteis a uma data (igual ao cálculo da ficha do evento).
function addWorkingDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + 'T00:00:00')
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d
}

type Notif = {
  id: string             // único — usado para "marcar como lido"
  tipo: string           // selecao | provas | editadas | album
  tipo_label: string
  tipo_icon: string
  casamento_id: string
  freelancer_id: string
  freelancer_nome: string
  local: string
  data_casamento: string | null
  url: string
  sent_at: string        // ISO timestamp
  // Detalhes adicionais para o modal 'Ver Mais'
  referencia?: string | null
  urls?: {
    selecao?: string | null
    provas?: string | null
    editadas?: string | null
    album?: string | null
  }
  status?: {
    selecao?: string | null
    provas?: string | null
    editadas?: string | null
    album?: string | null
  }
  mensagem?: string | null
}

export async function GET() {
  const supabase = db()

  // Buscar casamentos com qualquer url_*_enviado_em preenchido (com tolerância a colunas ausentes)
  // Trazemos também o nome do freelancer via join manual
  try {
    // Inclui também as colunas de status + timestamps de alteração
    //   Se alguma coluna não existir, faz fallback ao select sem essas colunas
    let casamentos: any[] | null = null
    let error: any = null
    const cols = 'id, freelancer_id, referencia, local, data_casamento, url_selecao, url_provas, url_editadas, url_album, url_selecao_enviado_em, url_provas_enviado_em, url_editadas_enviado_em, url_album_enviado_em, status_selecao, status_editadas, status_album, status_provas, status_selecao_alterado_em, status_editadas_alterado_em, status_album_alterado_em, status_provas_alterado_em'
    let res = await supabase
      .from('freelancer_casamentos')
      .select(cols)
      .order('data_casamento', { ascending: false })
      .limit(200)
    if (res.error) {
      // Fallback: apenas colunas core (sem status/alterado_em)
      res = await supabase
        .from('freelancer_casamentos')
        .select('id, freelancer_id, referencia, local, data_casamento, url_selecao, url_provas, url_editadas, url_album, url_selecao_enviado_em, url_provas_enviado_em, url_editadas_enviado_em, url_album_enviado_em')
        .order('data_casamento', { ascending: false })
        .limit(200)
    }
    casamentos = res.data
    error = res.error

    if (error) {
      // Provavelmente colunas ainda não foram criadas — devolve array vazio
      return NextResponse.json({ notifications: [] })
    }

    // Buscar nomes dos freelancers num único query
    const freelancerIds = Array.from(new Set((casamentos ?? []).map((c: any) => c.freelancer_id).filter(Boolean)))
    let nomesById = new Map<string, string>()
    if (freelancerIds.length > 0) {
      const { data: freelancers } = await supabase
        .from('freelancers')
        .select('id, nome')
        .in('id', freelancerIds)
      nomesById = new Map((freelancers ?? []).map((f: any) => [f.id, f.nome]))
    }

    // Helper para construir o snapshot completo do casamento (urls + status)
    function buildExtras(c: any) {
      return {
        referencia: c.referencia ?? null,
        urls: {
          selecao:  c.url_selecao ?? null,
          provas:   c.url_provas ?? null,
          editadas: c.url_editadas ?? null,
          album:    c.url_album ?? null,
        },
        status: {
          selecao:  c.status_selecao ?? null,
          provas:   c.status_provas ?? null,
          editadas: c.status_editadas ?? null,
          album:    c.status_album ?? null,
        },
      }
    }

    // Expandir para notificações (1 casamento pode gerar até 4 notifs)
    const tipos = ['selecao', 'provas', 'editadas', 'album'] as const
    const notifications: Notif[] = []
    for (const c of (casamentos ?? []) as any[]) {
      const extras = buildExtras(c)
      for (const tipo of tipos) {
        const tsField = `url_${tipo}_enviado_em`
        const urlField = `url_${tipo}`
        const sentAt = c[tsField]
        const url = c[urlField]
        if (!sentAt || !url) continue
        notifications.push({
          id: `${c.id}::${tipo}`,
          tipo,
          tipo_label: TIPO_LABELS[tipo],
          tipo_icon: TIPO_ICONS[tipo],
          casamento_id: c.id,
          freelancer_id: c.freelancer_id,
          freelancer_nome: nomesById.get(c.freelancer_id) ?? '—',
          local: c.local ?? '—',
          data_casamento: c.data_casamento,
          url,
          sent_at: sentAt,
          ...extras,
        })
      }
    }

    // ── Notificações de ALTERAÇÃO DE ESTADO (status_*_alterado_em) ──
    // Sempre que o freelancer (ou admin via mesmo PATCH) mexe num status,
    // a coluna status_*_alterado_em é atualizada → criamos uma notif aqui.
    const statusTipos = [
      { col: 'status_selecao_alterado_em',  val: 'status_selecao',  notif_tipo: 'status_selecao'  },
      { col: 'status_editadas_alterado_em', val: 'status_editadas', notif_tipo: 'status_editadas' },
      { col: 'status_album_alterado_em',    val: 'status_album',    notif_tipo: 'status_album'    },
      { col: 'status_provas_alterado_em',   val: 'status_provas',   notif_tipo: 'status_provas'   },
    ]
    for (const c of (casamentos ?? []) as any[]) {
      const extras = buildExtras(c)
      for (const st of statusTipos) {
        const ts = c[st.col]
        const value = c[st.val]
        if (!ts || !value) continue
        notifications.push({
          ...extras,
          id: `${st.notif_tipo}::${c.id}::${ts}`,
          tipo: st.notif_tipo,
          tipo_label: `${TIPO_LABELS[st.notif_tipo]} — ${value}`,
          tipo_icon: TIPO_ICONS[st.notif_tipo],
          casamento_id: c.id,
          freelancer_id: c.freelancer_id,
          freelancer_nome: nomesById.get(c.freelancer_id) ?? '—',
          local: c.local ?? '—',
          data_casamento: c.data_casamento,
          url: `/freelancers/${c.freelancer_id}`,
          sent_at: ts,
        })
      }
    }

    // ── Respostas de atribuição (membro confirmou ou está indisponível) ──
    try {
      const { data: respostas } = await supabase
        .from('freelancer_notificacoes')
        .select('id, freelancer_id, titulo, mensagem, tipo, created_at')
        .in('tipo', ['atribuicao_confirmada', 'atribuicao_indisponivel', 'album_aprovado'])
        .order('created_at', { ascending: false })
        .limit(50)
      const respRecipIds = Array.from(new Set((respostas ?? []).map((n: any) => n.freelancer_id).filter(Boolean)))
      const respNomes = new Map<string, string>(nomesById)
      const respMissing = respRecipIds.filter(id => !respNomes.has(id))
      if (respMissing.length > 0) {
        const { data: fls3 } = await supabase.from('freelancers').select('id, nome').in('id', respMissing)
        for (const f of (fls3 ?? []) as any[]) respNomes.set(f.id, f.nome)
      }
      for (const n of (respostas ?? []) as any[]) {
        const isConf = n.tipo === 'atribuicao_confirmada'
        const isAlbum = n.tipo === 'album_aprovado'
        // Tenta extrair referência, nome dos noivos E data de entrega do META
        let referencia: string | null = null
        let metaNomeNoivos: string | null = null
        let metaDataEntrega: string | null = null
        try {
          const m = (n.mensagem ?? '').match(/__META__(.+?)__\/META__/)
          if (m) {
            const parsed = JSON.parse(m[1])
            referencia = (parsed?.referencia ?? null) as string | null
            metaNomeNoivos = (parsed?.nomeNoivos ?? null) as string | null
            metaDataEntrega = (parsed?.data_prevista_entrega ?? null) as string | null
          }
        } catch { /* keep null */ }
        // Para notifs de álbum: mostra o nome dos NOIVOS como freelancer_nome
        const memberName = respNomes.get(n.freelancer_id) ?? '—'
        const displayName = isAlbum
          ? (metaNomeNoivos ?? memberName)
          : memberName
        // Mensagem detalhada para o modal Ver Mais (mantém META oculto)
        const cleanMensagem = (n.mensagem ?? '').replace(/^__META__.+?__\/META__\n?/s, '').trim()
        notifications.push({
          id: `${n.tipo}::${n.id}`,
          tipo: n.tipo,
          tipo_label: isAlbum
            ? 'Álbum Aprovado pelos Noivos'
            : isConf ? 'Membro confirmou atribuição' : 'Membro marcou-se indisponível',
          tipo_icon: isAlbum ? '✓' : (isConf ? '✓' : '✕'),
          casamento_id: '',
          freelancer_id: n.freelancer_id,
          freelancer_nome: displayName,
          local: (n.titulo ?? '').slice(0, 80),
          data_casamento: isAlbum ? metaDataEntrega : null,
          referencia,
          mensagem: cleanMensagem || undefined,
          url: isAlbum && referencia
            ? `/eventos-2026?ref=${encodeURIComponent(referencia)}`
            : `/freelancers/${n.freelancer_id}?tab=notificacoes`,
          sent_at: n.created_at,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] atribuicao_resposta read failed:', err)
    }

    // ── Tarefas enviadas entre membros (freelancer_notificacoes tipo='nova_tarefa_atribuida') ──
    try {
      const { data: tasksSent } = await supabase
        .from('freelancer_notificacoes')
        .select('id, freelancer_id, titulo, mensagem, created_at')
        .eq('tipo', 'nova_tarefa_atribuida')
        .order('created_at', { ascending: false })
        .limit(50)
      // Map de id → nome para destinatários
      const recipIds = Array.from(new Set((tasksSent ?? []).map((n: any) => n.freelancer_id).filter(Boolean)))
      const moreNomesById = new Map<string, string>(nomesById)
      const missing = recipIds.filter(id => !moreNomesById.has(id))
      if (missing.length > 0) {
        const { data: fls2 } = await supabase.from('freelancers').select('id, nome').in('id', missing)
        for (const f of (fls2 ?? []) as any[]) moreNomesById.set(f.id, f.nome)
      }
      for (const n of (tasksSent ?? []) as any[]) {
        notifications.push({
          id: `nova_tarefa::${n.id}`,
          tipo: 'nova_tarefa_atribuida',
          tipo_label: TIPO_LABELS.nova_tarefa_atribuida,
          tipo_icon: TIPO_ICONS.nova_tarefa_atribuida,
          casamento_id: '',
          freelancer_id: n.freelancer_id,
          freelancer_nome: moreNomesById.get(n.freelancer_id) ?? '—',
          local: (n.titulo ?? '').replace(/^✈ Nova tarefa de /,'').slice(0, 80),
          data_casamento: null,
          url: `/freelancers/${n.freelancer_id}`,
          sent_at: n.created_at,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] nova_tarefa_atribuida read failed:', err)
    }

    // ── Estado do vídeo alterado pelo editor (freelancer_notificacoes tipo='video_estado_alterado') ──
    try {
      const { data: videoChanges } = await supabase
        .from('freelancer_notificacoes')
        .select('id, freelancer_id, titulo, mensagem, created_at')
        .eq('tipo', 'video_estado_alterado')
        .order('created_at', { ascending: false })
        .limit(50)
      const vRecipIds = Array.from(new Set((videoChanges ?? []).map((n: any) => n.freelancer_id).filter(Boolean)))
      const vNomes = new Map<string, string>(nomesById)
      const vMissing = vRecipIds.filter(id => !vNomes.has(id))
      if (vMissing.length > 0) {
        const { data: flsV } = await supabase.from('freelancers').select('id, nome').in('id', vMissing)
        for (const f of (flsV ?? []) as any[]) vNomes.set(f.id, f.nome)
      }
      for (const n of (videoChanges ?? []) as any[]) {
        let meta: any = {}
        const m = String(n.mensagem ?? '').match(/^__META__(.*?)__\/META__/)
        if (m) { try { meta = JSON.parse(m[1]) } catch { meta = {} } }
        notifications.push({
          id: `video_estado::${n.id}`,
          tipo: 'video_estado_alterado',
          tipo_label: TIPO_LABELS.video_estado_alterado,
          tipo_icon: TIPO_ICONS.video_estado_alterado,
          casamento_id: '',
          freelancer_id: n.freelancer_id,
          freelancer_nome: vNomes.get(n.freelancer_id) ?? '—',
          local: meta.local ?? '',
          data_casamento: meta.data_casamento ?? null,
          url: `/painel-editor?freelancer=${n.freelancer_id}`,
          sent_at: n.created_at,
          referencia: meta.referencia ?? null,
          mensagem: `Estado do vídeo: ${meta.video_estado ?? '—'}${meta.stage ? ` (${meta.stage})` : ''}.`,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] video_estado_alterado read failed:', err)
    }

    // ── Vídeo enviado para revisão pelo editor (freelancer_notificacoes tipo='video_revisao_enviada') ──
    try {
      const { data: vrevs } = await supabase
        .from('freelancer_notificacoes')
        .select('id, freelancer_id, titulo, mensagem, created_at')
        .eq('tipo', 'video_revisao_enviada')
        .order('created_at', { ascending: false })
        .limit(50)
      const vrIds = Array.from(new Set((vrevs ?? []).map((n: any) => n.freelancer_id).filter(Boolean)))
      const vrNomes = new Map<string, string>(nomesById)
      const vrMissing = vrIds.filter(id => !vrNomes.has(id))
      if (vrMissing.length > 0) {
        const { data: flsVr } = await supabase.from('freelancers').select('id, nome').in('id', vrMissing)
        for (const f of (flsVr ?? []) as any[]) vrNomes.set(f.id, f.nome)
      }
      for (const n of (vrevs ?? []) as any[]) {
        let meta: any = {}
        const m = String(n.mensagem ?? '').match(/^__META__(.*?)__\/META__/)
        if (m) { try { meta = JSON.parse(m[1]) } catch { meta = {} } }
        notifications.push({
          id: `video_revisao::${n.id}`,
          tipo: 'video_revisao_enviada',
          tipo_label: TIPO_LABELS.video_revisao_enviada,
          tipo_icon: TIPO_ICONS.video_revisao_enviada,
          casamento_id: '',
          freelancer_id: n.freelancer_id,
          freelancer_nome: vrNomes.get(n.freelancer_id) ?? '—',
          local: meta.local ?? meta.noivos ?? '',
          data_casamento: null,
          url: meta.referencia ? `/eventos-2026/${meta.evento_id ?? ''}` : '/freelancers',
          sent_at: n.created_at,
          referencia: meta.referencia ?? null,
          mensagem: 'O editor enviou o vídeo para revisão.',
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] video_revisao_enviada read failed:', err)
    }

    // ── Relatório Diário enviado pela equipa (freelancer_casamentos.relatorio_diario) ──
    try {
      const { data: rels } = await supabase
        .from('freelancer_casamentos')
        .select('id, freelancer_id, local, data_casamento, referencia, relatorio_diario')
        .not('relatorio_diario', 'is', null)
        .limit(200)
      const relRecipIds = Array.from(new Set((rels ?? []).map((r: any) => r.freelancer_id).filter(Boolean)))
      const relNomes = new Map<string, string>(nomesById)
      const relMissing = relRecipIds.filter(id => !relNomes.has(id))
      if (relMissing.length > 0) {
        const { data: flsR } = await supabase.from('freelancers').select('id, nome').in('id', relMissing)
        for (const f of (flsR ?? []) as any[]) relNomes.set(f.id, f.nome)
      }
      for (const r of (rels ?? []) as any[]) {
        const rd = r.relatorio_diario ?? {}
        if (!rd.enviado || !rd.enviadoEm) continue
        notifications.push({
          id: `relatorio_diario::${r.id}`,
          tipo: 'relatorio_diario_enviado',
          tipo_label: TIPO_LABELS.relatorio_diario_enviado,
          tipo_icon: TIPO_ICONS.relatorio_diario_enviado,
          casamento_id: r.id,
          freelancer_id: r.freelancer_id,
          freelancer_nome: relNomes.get(r.freelancer_id) ?? '—',
          local: r.local ?? '—',
          data_casamento: r.data_casamento ?? null,
          url: r.referencia ? `/eventos-2026?ref=${encodeURIComponent(r.referencia)}` : `/freelancers/${r.freelancer_id}`,
          sent_at: rd.enviadoEm,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] relatorio_diario read failed:', err)
    }

    // ── Notificações de NOVA SELEÇÃO DOS NOIVOS (tabela fotos_selecao) ──
    // Sempre que os noivos submetem o formulário Tally, é criada uma row em
    // fotos_selecao. Mostramos no sino do admin para o avisar.
    try {
      const { data: selecoes } = await supabase
        .from('fotos_selecao')
        .select('id, nome_noivos, referencia, date, data_entrada, created_at')
        .order('data_entrada', { ascending: false, nullsFirst: false })
        .limit(50)
      for (const s of (selecoes ?? []) as any[]) {
        const sent = s.data_entrada || s.created_at
        if (!sent) continue
        notifications.push({
          id: `nova_selecao::${s.id}`,
          tipo: 'nova_selecao',
          tipo_label: TIPO_LABELS.nova_selecao,
          tipo_icon: TIPO_ICONS.nova_selecao,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: s.nome_noivos ?? '—',
          local: s.referencia ?? '—',
          data_casamento: s.date ?? null,
          url: `/secao/${s.id}`,
          sent_at: typeof sent === 'string' && sent.length === 10 ? `${sent}T00:00:00.000Z` : sent,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] fotos_selecao read failed:', err)
    }

    // ── Notificações de ÁLBUNS APROVADOS pelos noivos ──
    //    Cada vez que os noivos clicam 'Aprovar' o álbum, a tabela
    //    albuns_casamento ganha status='APROVADO' e data_aprovacao=<hoje>.
    //    Mostramos no sino para o admin saber.
    try {
      const { data: albunsAprov } = await supabase
        .from('albuns_casamento')
        .select('id, nome, ref_evento, status, data_aprovacao, data_prevista_entrega, num_fotografias, updated_at, created_at')
        .eq('status', 'APROVADO')
        .order('data_aprovacao', { ascending: false, nullsFirst: false })
        .limit(50)
      for (const a of (albunsAprov ?? []) as any[]) {
        const sent = a.data_aprovacao || a.updated_at || a.created_at
        if (!sent) continue
        const sentIso = typeof sent === 'string' && sent.length === 10 ? `${sent}T12:00:00.000Z` : sent
        notifications.push({
          id: `album_aprovado::${a.id}`,
          tipo: 'album_aprovado',
          tipo_label: TIPO_LABELS.album_aprovado,
          tipo_icon: TIPO_ICONS.album_aprovado,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: a.nome ?? '—',
          local: a.ref_evento ?? '—',
          data_casamento: null,
          referencia: a.ref_evento ?? null,
          url: a.ref_evento ? `/eventos-2026?ref=${encodeURIComponent(a.ref_evento)}` : '/eventos-2026',
          sent_at: sentIso,
          mensagem: a.data_prevista_entrega
            ? `Os noivos aprovaram a maquete. Entrega prevista: ${new Date(a.data_prevista_entrega).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}.`
            : 'Os noivos aprovaram a maquete do álbum.',
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] albuns_casamento aprovado read failed:', err)
    }

    // ── Notificações de FOTOS CONVIDADOS (portais.settings) ──
    //    Dois canais separados: email_enviada (15d) e ctt_enviada (30d).
    try {
      const { data: portais } = await supabase
        .from('portais')
        .select('referencia, settings')
        .limit(500)
      for (const p of (portais ?? []) as any[]) {
        const s = p.settings ?? {}
        const canais: Array<{ key: 'fotos_convidados_email' | 'fotos_convidados_ctt'; sent: string | null }> = [
          { key: 'fotos_convidados_email', sent: s.fotos_convidados_email_enviada ?? null },
          { key: 'fotos_convidados_ctt',   sent: s.fotos_convidados_ctt_enviada   ?? null },
        ]
        for (const { key, sent } of canais) {
          if (!sent) continue
          notifications.push({
            id: `${key}::${p.referencia}`,
            tipo: key,
            tipo_label: TIPO_LABELS[key],
            tipo_icon: TIPO_ICONS[key],
            casamento_id: '',
            freelancer_id: '',
            freelancer_nome: p.referencia ?? '—',
            local: p.referencia ?? '—',
            data_casamento: null,
            url: `/eventos-2026?ref=${encodeURIComponent(p.referencia ?? '')}`,
            sent_at: typeof sent === 'string' && sent.length === 10 ? `${sent}T00:00:00.000Z` : sent,
          })
        }
      }
    } catch (err) {
      console.warn('[admin-notifications] portais read failed:', err)
    }

    // ── Mensagens enviadas pelos NOIVOS (portais.settings.noivos_messages) ──
    try {
      const { data: portaisMsg } = await supabase
        .from('portais')
        .select('referencia, settings')
        .limit(500)
      for (const p of (portaisMsg ?? []) as any[]) {
        const s = p.settings ?? {}
        const msgs = Array.isArray(s.noivos_messages) ? s.noivos_messages : []
        for (const m of msgs) {
          if (!m?.id || !m?.ts) continue
          notifications.push({
            id: `mensagem_noivos::${p.referencia}::${m.id}`,
            tipo: 'mensagem_noivos',
            tipo_label: TIPO_LABELS.mensagem_noivos,
            tipo_icon: TIPO_ICONS.mensagem_noivos,
            casamento_id: '',
            freelancer_id: '',
            freelancer_nome: m.nome_noivos ?? p.referencia ?? '—',
            local: p.referencia ?? '—',
            data_casamento: null,
            referencia: p.referencia ?? null,
            url: p.referencia ? `/eventos-2026?ref=${encodeURIComponent(p.referencia)}` : '/eventos-2026',
            sent_at: m.ts,
            mensagem: String(m.mensagem ?? '').slice(0, 800),
          })
        }
      }
    } catch (err) {
      console.warn('[admin-notifications] noivos_messages read failed:', err)
    }

    // ── Notificações de SUBSCRIÇÃO AO BLOG ──
    //   Cada vez que alguém subscreve (form do site OU import OU manual no admin)
    //   aparece no sino. Os recém-importados em batch são todos do mesmo dia,
    //   por isso limitamos a últimos 30 dias para não inundar.
    try {
      const { data: subscribers } = await supabase
        .from('blog_subscribers')
        .select('id, email, source, status, created_at')
        .eq('status', 'active')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50)
      for (const s of (subscribers ?? []) as any[]) {
        if (!s.created_at || !s.email) continue
        // Não mostra os importados em batch (poluem o sino).
        // Mostra os que vêm do site público ou adicionados manualmente.
        const src = String(s.source ?? '').toLowerCase()
        if (src === 'import') continue
        notifications.push({
          id: `blog_subscriber::${s.id}`,
          tipo: 'blog_subscriber',
          tipo_label: TIPO_LABELS.blog_subscriber,
          tipo_icon: TIPO_ICONS.blog_subscriber,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: s.email,
          local: src === 'site' ? 'Formulário do site' : src === 'admin' ? 'Adicionado manualmente' : (s.source ?? '—'),
          data_casamento: null,
          url: '/social-media/blog/subscritores',
          sent_at: s.created_at,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] blog_subscribers read failed:', err)
    }

    // ── Notificações de PRAZO DE ENTREGA DO VÍDEO (≤ 30 dias) ──
    //    Prazo = data do evento + 180 dias úteis. Alerta quando faltam 30 dias
    //    ou menos (e ainda não está Entregue / S-SERVIÇO).
    try {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      for (const tabela of ['eventos_2026', 'eventos_2027']) {
        const { data: eventos } = await supabase
          .from(tabela)
          .select('referencia, cliente, data_evento, video_estado')
          .not('data_evento', 'is', null)
          .limit(500)
        for (const ev of (eventos ?? []) as any[]) {
          const estado = String(ev.video_estado ?? '').trim().toLowerCase()
          if (estado === 'entregue' || estado === 's/serviço' || estado === 's-serviço') continue
          const dataEvento = String(ev.data_evento).slice(0, 10)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEvento)) continue
          const prazo = addWorkingDays(dataEvento, 180); prazo.setHours(0, 0, 0, 0)
          const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000)
          if (diasRestantes > 30) continue // ainda não entrou na janela de alerta
          const prazoLabel = prazo.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
          const tagDias = diasRestantes < 0
            ? `${Math.abs(diasRestantes)} dia(s) de atraso`
            : diasRestantes === 0 ? 'Termina hoje'
            : `Faltam ${diasRestantes} dia(s)`
          notifications.push({
            id: `video_prazo::${ev.referencia ?? ev.cliente}`,
            tipo: 'video_prazo',
            tipo_label: TIPO_LABELS.video_prazo,
            tipo_icon: TIPO_ICONS.video_prazo,
            casamento_id: '',
            freelancer_id: '',
            freelancer_nome: ev.cliente ?? ev.referencia ?? '—',
            local: ev.referencia ?? '—',
            data_casamento: null,
            referencia: ev.referencia ?? null,
            url: ev.referencia ? `/eventos-2026?ref=${encodeURIComponent(ev.referencia)}` : '/casamentos',
            // sent_at estável = momento em que o alerta abriu (prazo − 30 dias),
            // para não contar sempre como "novo" e o "Marcar lidas" funcionar.
            sent_at: new Date(prazo.getTime() - 30 * 86400000).toISOString(),
            mensagem: `${tagDias} para a entrega do vídeo (prazo: ${prazoLabel}).`,
          })
        }
      }
    } catch (err) {
      console.warn('[admin-notifications] video prazo read failed:', err)
    }

    // ── Notificações de PRAZO DAS FOTOS EM EDIÇÃO (≤ 7 dias) ──
    //    Prazo = data de entrada (fotos_selecao) + 30 dias úteis. Alerta quando
    //    faltam 7 dias ou menos (e ainda não está Entregue / S-SERVIÇO).
    try {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      // Map referencia → { cliente, fotos_edicao_estado }
      const eventoByRef = new Map<string, { cliente: string | null; fotos_edicao_estado: string | null }>()
      for (const tabela of ['eventos_2026', 'eventos_2027']) {
        const { data: eventos } = await supabase
          .from(tabela)
          .select('referencia, cliente, fotos_edicao_estado')
          .limit(500)
        for (const ev of (eventos ?? []) as any[]) {
          if (ev.referencia) eventoByRef.set(ev.referencia, { cliente: ev.cliente ?? null, fotos_edicao_estado: ev.fotos_edicao_estado ?? null })
        }
      }
      const { data: selecoesPrazo } = await supabase
        .from('fotos_selecao')
        .select('referencia, data_entrada')
        .not('data_entrada', 'is', null)
        .limit(500)
      for (const s of (selecoesPrazo ?? []) as any[]) {
        if (!s.referencia) continue
        const ev = eventoByRef.get(s.referencia)
        const estado = String(ev?.fotos_edicao_estado ?? '').trim().toLowerCase()
        if (estado === 'entregue' || estado === 's/serviço' || estado === 's-serviço') continue
        const dataEntrada = String(s.data_entrada).slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEntrada)) continue
        const prazo = addWorkingDays(dataEntrada, 30); prazo.setHours(0, 0, 0, 0)
        const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / 86400000)
        if (diasRestantes > 7) continue // ainda não entrou na janela de alerta
        const prazoLabel = prazo.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
        const tagDias = diasRestantes < 0
          ? `${Math.abs(diasRestantes)} dia(s) de atraso`
          : diasRestantes === 0 ? 'Termina hoje'
          : `Faltam ${diasRestantes} dia(s)`
        notifications.push({
          id: `fotos_edicao_prazo::${s.referencia}`,
          tipo: 'fotos_edicao_prazo',
          tipo_label: TIPO_LABELS.fotos_edicao_prazo,
          tipo_icon: TIPO_ICONS.fotos_edicao_prazo,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: ev?.cliente ?? s.referencia ?? '—',
          local: s.referencia ?? '—',
          data_casamento: null,
          referencia: s.referencia ?? null,
          url: `/eventos-2026?ref=${encodeURIComponent(s.referencia)}`,
          // sent_at estável = momento em que o alerta abriu (prazo − 7 dias).
          sent_at: new Date(prazo.getTime() - 7 * 86400000).toISOString(),
          mensagem: `${tagDias} para a entrega das fotos em edição (prazo: ${prazoLabel}).`,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] fotos edicao prazo read failed:', err)
    }

    // ── Notificação: NOIVOS EM FALTA — ESCOLHER FOTOS (30 dias) ──
    //    Quando a Seleção de Fotos é marcada "Entregue", regista-se a data em
    //    settings.sel_fotos_entregue_em. Se passarem 30 dias e os noivos ainda
    //    não tiverem submetido a seleção (sem row em fotos_selecao para a ref e
    //    selecao_fotos_noivos_estado ainda não Concluído/Entregue) → alerta.
    try {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      // Referências cuja seleção dos noivos já foi submetida (form Tally → fotos_selecao)
      const { data: selFeitas } = await supabase.from('fotos_selecao').select('referencia')
      const refsSubmetidas = new Set((selFeitas ?? []).map((s: any) => s.referencia).filter(Boolean))
      const { data: portaisSel } = await supabase.from('portais').select('referencia, settings').limit(500)
      for (const p of (portaisSel ?? []) as any[]) {
        const s = p.settings ?? {}
        const entregueEm = s.sel_fotos_entregue_em
        if (!entregueEm) continue
        if (refsSubmetidas.has(p.referencia)) continue // noivos já escolheram
        const estadoNoivos = String(s.selecao_fotos_noivos_estado ?? '').trim().toLowerCase()
        if (estadoNoivos === 'concluído' || estadoNoivos === 'concluido' || estadoNoivos === 'entregue') continue
        const d = new Date(String(entregueEm).slice(0, 10) + 'T00:00:00'); d.setHours(0, 0, 0, 0)
        if (isNaN(d.getTime())) continue
        const diasDesde = Math.floor((hoje.getTime() - d.getTime()) / 86400000)
        if (diasDesde < 30) continue
        const nomeNoivos = [s.noiva, s.noivo].filter(Boolean).join(' & ') || p.referencia || '—'
        notifications.push({
          id: `noivos_selecao_falta::${p.referencia}`,
          tipo: 'noivos_selecao_falta',
          tipo_label: TIPO_LABELS.noivos_selecao_falta,
          tipo_icon: TIPO_ICONS.noivos_selecao_falta,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: nomeNoivos,
          local: p.referencia ?? '—',
          data_casamento: null,
          referencia: p.referencia ?? null,
          url: p.referencia ? `/eventos-2026?ref=${encodeURIComponent(p.referencia)}` : '/eventos-2026',
          // sent_at estável = momento em que o alerta abriu (entregue + 30 dias).
          sent_at: new Date(d.getTime() + 30 * 86400000).toISOString(),
          mensagem: `Já passaram ${diasDesde} dias desde a entrega da seleção e os noivos ainda não escolheram as fotos.`,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] noivos selecao falta read failed:', err)
    }

    // ── Notificação: MARCAÇÃO RESERVADA PELOS NOIVOS ──
    //    Quando os noivos escolhem um slot no portal, fica gravado em
    //    settings.bookingReservedSlotId + bookingReservedAt. Mostra no sino.
    try {
      const { data: portaisBk } = await supabase.from('portais').select('referencia, settings').limit(500)
      const fmtDataBk = (d: string) => {
        try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
        catch { return d }
      }
      for (const p of (portaisBk ?? []) as any[]) {
        const s = p.settings ?? {}
        const slotId = s.bookingReservedSlotId
        const at = s.bookingReservedAt
        if (!slotId || !at) continue
        const slot = (Array.isArray(s.bookingSlots) ? s.bookingSlots : []).find((x: any) => x?.id === slotId)
        if (!slot) continue
        const tipoLabel = s.bookingType === 'reuniao' ? 'Reunião' : 'Sessão / Pré-Wedding'
        const nomeNoivos = [s.noiva, s.noivo].filter(Boolean).join(' & ') || p.referencia || '—'
        notifications.push({
          id: `booking_reservado::${p.referencia}::${slotId}`,
          tipo: 'booking_reservado',
          tipo_label: TIPO_LABELS.booking_reservado,
          tipo_icon: TIPO_ICONS.booking_reservado,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: nomeNoivos,
          local: p.referencia ?? '—',
          data_casamento: null,
          referencia: p.referencia ?? null,
          url: p.referencia ? `/eventos-2026?ref=${encodeURIComponent(p.referencia)}` : '/eventos-2026',
          sent_at: at,
          mensagem: `${tipoLabel} reservada: ${fmtDataBk(slot.date)} · ${slot.time}${slot.local ? ' · ' + slot.local : ''}.`,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] booking reservado read failed:', err)
    }

    // ── Alerta: MARCAR PRÉ-WEDDING (≤ 35 dias do evento) ──
    //    Quando o serviço Pré-Wedding está ativo (settings.preWeddingServico)
    //    e ainda não há reserva, alerta a 35 dias ou menos do dia do evento.
    try {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      const evDateByRef = new Map<string, { cliente: string | null; data_evento: string | null }>()
      for (const tabela of ['eventos_2026', 'eventos_2027']) {
        const { data: eventos } = await supabase
          .from(tabela)
          .select('referencia, cliente, data_evento')
          .not('data_evento', 'is', null)
          .limit(500)
        for (const ev of (eventos ?? []) as any[]) {
          if (ev.referencia) evDateByRef.set(ev.referencia, { cliente: ev.cliente ?? null, data_evento: ev.data_evento ?? null })
        }
      }
      const { data: portaisPw } = await supabase.from('portais').select('referencia, settings').limit(500)
      const fmtDataPw = (d: string) => {
        try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
        catch { return d }
      }
      for (const p of (portaisPw ?? []) as any[]) {
        const s = p.settings ?? {}
        if (!s.preWeddingServico) continue        // só se o serviço está ativo
        if (s.bookingReservedSlotId) continue      // já reservado → sem alerta
        const ev = evDateByRef.get(p.referencia)
        if (!ev?.data_evento) continue
        const dataEvento = String(ev.data_evento).slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEvento)) continue
        const dEvento = new Date(dataEvento + 'T00:00:00'); dEvento.setHours(0, 0, 0, 0)
        const dias = Math.ceil((dEvento.getTime() - hoje.getTime()) / 86400000)
        if (dias > 35 || dias < 0) continue        // só dentro da janela dos 35 dias
        const nomeNoivos = [s.noiva, s.noivo].filter(Boolean).join(' & ') || ev.cliente || p.referencia || '—'
        notifications.push({
          id: `prewedding_alerta::${p.referencia}`,
          tipo: 'prewedding_alerta',
          tipo_label: TIPO_LABELS.prewedding_alerta,
          tipo_icon: TIPO_ICONS.prewedding_alerta,
          casamento_id: '',
          freelancer_id: '',
          freelancer_nome: nomeNoivos,
          local: p.referencia ?? '—',
          data_casamento: null,
          referencia: p.referencia ?? null,
          url: p.referencia ? `/eventos-2026?ref=${encodeURIComponent(p.referencia)}` : '/eventos-2026',
          // sent_at estável = momento em que o alerta abriu (evento − 35 dias)
          sent_at: new Date(dEvento.getTime() - 35 * 86400000).toISOString(),
          mensagem: `Faltam ${dias} dia(s) para o evento e o pré-wedding ainda não está marcado (evento: ${fmtDataPw(dataEvento)}).`,
        })
      }
    } catch (err) {
      console.warn('[admin-notifications] prewedding alerta read failed:', err)
    }

    // Ordenar por sent_at DESC
    notifications.sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))

    return NextResponse.json({ notifications: notifications.slice(0, 50) })
  } catch (err: any) {
    return NextResponse.json({ notifications: [], error: err.message }, { status: 200 })
  }
}
