import { createClient } from '@supabase/supabase-js'
import type { Capitulo, Convidado, Episodio, EpisodioCompleto } from './tipos'

/* ============================================================
   Acesso a dados do podcast. Só corre no servidor: estas funções são
   chamadas apenas de componentes de servidor e de route handlers. Não se
   usa o pacote `server-only` para o garantir porque não está instalado e
   não podemos acrescentar dependências.

   As páginas públicas leem com a chave ANÓNIMA de propósito: assim é
   o RLS a decidir o que sai, e um episódio em rascunho fica invisível
   mesmo que alguém se engane no filtro. A service role só aparece nos
   route handlers das submissões e na área de administração.

   Uma query por página, sem polling e sem realtime.
   ============================================================ */

function clientePublico() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}

export function clienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}

const CAMPOS_LISTA =
  'id, numero, temporada, slug, titulo, subtitulo, descricao_curta, duracao_segundos, data_publicacao, estado, capa_url, youtube_id'

/** Episódios publicados, do mais recente para o mais antigo. */
export async function listarEpisodios(limite?: number): Promise<Episodio[]> {
  let q = clientePublico()
    .from('podcast_episodios')
    .select(CAMPOS_LISTA)
    .order('data_publicacao', { ascending: false })
  if (limite) q = q.limit(limite)

  const { data, error } = await q
  if (error) {
    console.error('[podcast] listarEpisodios', error.message)
    return []
  }
  return (data ?? []) as Episodio[]
}

/** Slugs publicados, para o generateStaticParams e o sitemap. */
export async function listarSlugs(): Promise<{ slug: string; data_publicacao: string }[]> {
  const { data, error } = await clientePublico()
    .from('podcast_episodios')
    .select('slug, data_publicacao')
    .order('data_publicacao', { ascending: false })
  if (error) {
    console.error('[podcast] listarSlugs', error.message)
    return []
  }
  return data ?? []
}

/**
 * Um episódio com convidados e capítulos.
 * São três leituras numa página que é gerada de hora a hora, não por visita.
 */
export async function obterEpisodio(slug: string): Promise<EpisodioCompleto | null> {
  const sb = clientePublico()

  const { data: episodio, error } = await sb
    .from('podcast_episodios')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !episodio) return null

  const [{ data: ligacoes }, { data: capitulos }] = await Promise.all([
    sb.from('podcast_episodio_convidados')
      .select('ordem, podcast_convidados (*)')
      .eq('episodio_id', episodio.id)
      .order('ordem'),
    sb.from('podcast_capitulos')
      .select('*')
      .eq('episodio_id', episodio.id)
      .order('ordem'),
  ])

  const convidados = (ligacoes ?? [])
    .map((l: any) => l.podcast_convidados)
    .filter(Boolean) as Convidado[]

  return {
    ...(episodio as Episodio),
    convidados,
    capitulos: (capitulos ?? []) as Capitulo[],
  }
}

/** Episódio anterior e seguinte, para a navegação no fundo da página. */
export async function vizinhos(numero: number) {
  const sb = clientePublico()
  const [{ data: anterior }, { data: seguinte }] = await Promise.all([
    sb.from('podcast_episodios').select('slug, titulo, numero')
      .lt('numero', numero).order('numero', { ascending: false }).limit(1).maybeSingle(),
    sb.from('podcast_episodios').select('slug, titulo, numero')
      .gt('numero', numero).order('numero', { ascending: true }).limit(1).maybeSingle(),
  ])
  return { anterior: anterior ?? null, seguinte: seguinte ?? null }
}
