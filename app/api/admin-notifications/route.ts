import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const TIPO_LABELS: Record<string, string> = {
  selecao:  'Seleção de Fotos',
  provas:   'Fotos Prova',
  editadas: 'Fotos Editadas',
  album:    'Maquete Álbum',
}

const TIPO_ICONS: Record<string, string> = {
  selecao:  '◫',
  provas:   '◧',
  editadas: '✓',
  album:    '◐',
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
}

export async function GET() {
  const supabase = db()

  // Buscar casamentos com qualquer url_*_enviado_em preenchido (com tolerância a colunas ausentes)
  // Trazemos também o nome do freelancer via join manual
  try {
    const { data: casamentos, error } = await supabase
      .from('freelancer_casamentos')
      .select('id, freelancer_id, local, data_casamento, url_selecao, url_provas, url_editadas, url_album, url_selecao_enviado_em, url_provas_enviado_em, url_editadas_enviado_em, url_album_enviado_em')
      .order('data_casamento', { ascending: false })
      .limit(200)

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

    // Expandir para notificações (1 casamento pode gerar até 4 notifs)
    const tipos = ['selecao', 'provas', 'editadas', 'album'] as const
    const notifications: Notif[] = []
    for (const c of (casamentos ?? []) as any[]) {
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
        })
      }
    }

    // Ordenar por sent_at DESC
    notifications.sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))

    return NextResponse.json({ notifications: notifications.slice(0, 50) })
  } catch (err: any) {
    return NextResponse.json({ notifications: [], error: err.message }, { status: 200 })
  }
}
