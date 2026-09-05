/* ============================================================
   Tipos da secção do podcast.

   Escritos à mão a partir do esquema em migrations/20260901_podcast.sql.
   O briefing pedia tipos gerados do esquema, mas isso exige a CLI do
   Supabase, que não está no projeto e não podemos instalar. Mantendo-os
   aqui, num sítio só, o efeito prático é o mesmo: se a migração mudar,
   muda-se este ficheiro e o TypeScript aponta tudo o que partiu.
   ============================================================ */

export type EstadoEpisodio = 'rascunho' | 'agendado' | 'publicado'

export type Episodio = {
  id: string
  numero: number
  temporada: number
  slug: string
  titulo: string
  subtitulo: string | null
  descricao_curta: string
  notas_md: string | null
  /* Guião de trabalho: perguntas âncora da conversa. Uso interno,
     não sai na página pública do episódio. */
  guiao_md: string | null
  duracao_segundos: number | null
  data_publicacao: string
  estado: EstadoEpisodio
  capa_url: string | null
  youtube_id: string | null
  spotify_url: string | null
  apple_url: string | null
  audio_url: string | null
  transcricao: string | null
  created_at?: string
  updated_at?: string
}

export type Convidado = {
  id: string
  nome: string
  slug: string
  profissao: string | null
  empresa: string | null
  bio: string | null
  foto_url: string | null
  website: string | null
  instagram: string | null
  /* Contacto e notas: uso interno, não saem na página pública. */
  email: string | null
  telefone: string | null
  notas: string | null
}

export type Capitulo = {
  id: string
  episodio_id: string
  titulo: string
  inicio_segundos: number
  ordem: number
}

/** Episódio com o que a página precisa de mostrar à volta dele. */
export type EpisodioCompleto = Episodio & {
  convidados: Convidado[]
  capitulos: Capitulo[]
}

export const AREAS_CANDIDATURA = [
  'planner', 'quinta', 'catering', 'flores', 'beleza',
  'musica', 'vestido', 'celebrante', 'outro',
] as const

export type AreaCandidatura = typeof AREAS_CANDIDATURA[number]

export const ETIQUETAS_AREA: Record<AreaCandidatura, string> = {
  planner:    'Wedding planner',
  quinta:     'Quinta ou espaço',
  catering:   'Catering',
  flores:     'Flores e decoração',
  beleza:     'Beleza e maquilhagem',
  musica:     'Música e animação',
  vestido:    'Vestidos e fatos',
  celebrante: 'Celebrante',
  outro:      'Outro',
}

/** Segundos → "45 min" ou "1 h 05". Usado nos cartões e no cabeçalho. */
export function duracaoLegivel(segundos: number | null): string {
  if (!segundos || segundos <= 0) return ''
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')}`
}

/** Segundos → "12:34", para os marcadores dos capítulos. */
export function marcaTemporal(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Data ISO → "3 de setembro de 2026", em português europeu. */
export function dataLegivel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return ''
  }
}

/** "01" + título → "01-titulo-em-kebab-case". O slug nunca muda depois de publicado. */
export function gerarSlug(numero: number, titulo: string): string {
  const base = (titulo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `${String(numero).padStart(2, '0')}-${base}`
}
