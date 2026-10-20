// Emails de entrega de fotografias e vídeos aos noivos, no layout do bilhete
// (lib/bilheteNoivos.ts). Muda a pílula, a frase e o botão, que leva diretamente
// ao link da entrega. Usado pelas rotas send-*-email e pela página Tickets.
import { createClient } from '@supabase/supabase-js'
import { buildBilheteNoivos, nomesBilhete } from './bilheteNoivos'

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

export type TipoEntrega =
  | 'selecao' | 'prewedding' | 'fotos_finais' | 'galerias' | 'maquete'
  | 'video_prewedding' | 'wedding_film' | 'same_day_edit' | 'teaser'

export const ENTREGAS: Record<TipoEntrega, { assunto: string; titulo: string; frase: string; cta: string; onde: string }> = {
  selecao: {
    assunto: 'As vossas fotos estão prontas para seleção',
    titulo: 'As fotos para seleção',
    frase: 'Chegou a parte mais bonita: escolher. Com calma, escolham as fotos que contam a vossa história.',
    cta: 'Escolher as fotos',
    onde: 'Fotografias → Seleção',
  },
  prewedding: {
    assunto: 'As vossas fotos pré-wedding estão prontas',
    titulo: 'As fotos pré-wedding',
    frase: 'Um dia só vosso, antes do grande dia. As fotos da vossa sessão já estão prontas.',
    cta: 'Ver as fotos',
    onde: 'Fotografias → Pré-Wedding',
  },
  fotos_finais: {
    assunto: 'As vossas fotos já estão editadas',
    titulo: 'As fotos finais',
    frase: 'Cada fotografia foi editada com cuidado. Estão prontas para serem vossas para sempre.',
    cta: 'Ver as fotos',
    onde: 'Fotografias → Fotos Finais',
  },
  galerias: {
    assunto: 'As fotos do dia já estão disponíveis',
    titulo: 'As fotos do dia',
    frase: 'O vosso dia, de volta. As primeiras fotografias já estão à vossa espera.',
    cta: 'Ver a galeria',
    onde: 'Fotografias → Galerias Online',
  },
  maquete: {
    assunto: 'A vossa maquete do álbum está pronta',
    titulo: 'A maquete do álbum',
    frase: 'O vosso álbum começa a ganhar forma. Vejam a maquete e digam-nos o que sentem.',
    cta: 'Ver a maquete',
    onde: 'Fotografias → Álbum',
  },
  video_prewedding: {
    assunto: 'O vosso vídeo pré-wedding está pronto',
    titulo: 'O vídeo pré-wedding',
    frase: 'Carreguem no play e revivam a vossa sessão. O vosso vídeo pré-wedding está pronto.',
    cta: 'Ver o vídeo',
    onde: 'O Nosso Filme → Pré-Wedding',
  },
  wedding_film: {
    assunto: 'O vosso Wedding Film está pronto',
    titulo: 'O vosso Wedding Film',
    frase: 'O vosso dia, contado como um filme. Chamem quem mais gostam e carreguem no play.',
    cta: 'Ver o filme',
    onde: 'O Nosso Filme → Wedding Film',
  },
  same_day_edit: {
    assunto: 'O vosso Same Day Edit está pronto',
    titulo: 'O Same Day Edit',
    frase: 'O vosso dia, contado no próprio dia. O Same Day Edit está pronto para verem.',
    cta: 'Ver o vídeo',
    onde: 'O Nosso Filme → Same Day Edit',
  },
  teaser: {
    assunto: 'O vosso Teaser está pronto',
    titulo: 'O vosso Teaser',
    frase: 'Um primeiro olhar sobre o vosso filme. O teaser está pronto para verem.',
    cta: 'Ver o teaser',
    onde: 'O Nosso Filme → Teaser',
  },
}

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** Data e local do evento, para o bilhete. */
async function eventoDaReferencia(referencia?: string | null): Promise<{ data: string | null; local: string | null }> {
  if (!referencia) return { data: null, local: null }
  for (const t of ['eventos_2026', 'eventos_2027', 'eventos_2028']) {
    try {
      const { data } = await db().from(t).select('data_evento, local').eq('referencia', referencia).maybeSingle()
      if (data) return { data: data.data_evento ?? null, local: data.local ?? null }
    } catch { /* tabela pode não existir */ }
  }
  return { data: null, local: null }
}

export function buildEntregaEmailHtml(tipo: TipoEntrega, o: {
  nomes: string
  url: string
  data?: string | null
  local?: string | null
  referencia?: string | null
  batizado?: boolean
}): string {
  const cfg = ENTREGAS[tipo]
  return buildBilheteNoivos({
    pill: cfg.titulo,
    nomes: o.nomes,
    data: o.data,
    tipo: o.batizado ? 'batizado' : 'casamento',
    frase: cfg.frase,
    campos: [
      { k: 'Local', v: o.local ?? '' },
      { k: 'No portal', v: cfg.onde },
      { k: 'Referência', v: o.referencia ?? '', mono: true },
    ],
    cta: { label: cfg.cta, url: o.url },
    preheader: `${o.nomes.replace(' | ', ' e ')}, temos uma coisa para vocês.`,
  })
}

/** Monta e envia o email de entrega. Usado pelas rotas send-*-email. */
export async function enviarEmailEntrega(tipo: TipoEntrega, o: {
  email: string
  nome_noiva?: string | null
  nome_noivo?: string | null
  url?: string | null
  referencia?: string | null
}): Promise<{ ok: boolean; id?: string; error?: any }> {
  const ref = String(o.referencia ?? '').trim()
  const batizado = /^BAT/i.test(ref)
  const loginUrl = `${SITE_BASE}/${batizado ? 'login-batizado' : 'login-noivos'}`
  const url = String(o.url ?? '').trim() || loginUrl
  const evento = await eventoDaReferencia(ref)
  const html = buildEntregaEmailHtml(tipo, {
    nomes: nomesBilhete(o.nome_noiva, o.nome_noivo) || 'Para vocês',
    url, data: evento.data, local: evento.local, referencia: ref, batizado,
  })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'RL Photo.Video <geral@rlphotovideo.pt>', to: [o.email], subject: ENTREGAS[tipo].assunto, html }),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? { ok: true, id: data.id } : { ok: false, error: data }
}
