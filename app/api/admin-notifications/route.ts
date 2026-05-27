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
        .in('tipo', ['atribuicao_confirmada', 'atribuicao_indisponivel'])
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
        notifications.push({
          id: `atrib_resp::${n.id}`,
          tipo: n.tipo,
          tipo_label: isConf ? 'Membro confirmou atribuição' : 'Membro marcou-se indisponível',
          tipo_icon: isConf ? '✓' : '✕',
          casamento_id: '',
          freelancer_id: n.freelancer_id,
          freelancer_nome: respNomes.get(n.freelancer_id) ?? '—',
          local: (n.titulo ?? '').slice(0, 80),
          data_casamento: null,
          url: `/freelancers/${n.freelancer_id}?tab=notificacoes`,
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

    // Ordenar por sent_at DESC
    notifications.sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))

    return NextResponse.json({ notifications: notifications.slice(0, 50) })
  } catch (err: any) {
    return NextResponse.json({ notifications: [], error: err.message }, { status: 200 })
  }
}
