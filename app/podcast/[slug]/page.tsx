import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { listarSlugs, obterEpisodio, vizinhos } from '@/lib/podcast/dados'
import { dataLegivel, duracaoLegivel } from '@/lib/podcast/tipos'
import { markdownParaHtml } from '@/lib/podcast/markdown'
import { PROGRAMA, BASE_URL } from '@/lib/podcast/programa'
import FormularioLead from '../FormularioLead'
import LeitorEpisodio from '../LeitorEpisodio'

/* ============================================================
   /podcast/[slug] — página do episódio.
   Gerada no servidor com ISR e caminhos conhecidos de antemão.
   ============================================================ */

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await listarSlugs()
  return slugs.map(s => ({ slug: s.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const ep = await obterEpisodio(slug)
  if (!ep) return { title: 'Episódio não encontrado' }

  const titulo = `${String(ep.numero).padStart(2, '0')}. ${ep.titulo}`
  const url = `${BASE_URL}/podcast/${ep.slug}`
  const imagem = ep.capa_url ?? (ep.youtube_id ? `https://i.ytimg.com/vi/${ep.youtube_id}/maxresdefault.jpg` : undefined)

  return {
    title: titulo,
    description: ep.descricao_curta,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'pt_PT',
      title: `${titulo} · ${PROGRAMA.nome}`,
      description: ep.descricao_curta,
      url,
      publishedTime: ep.data_publicacao,
      ...(imagem ? { images: [{ url: imagem }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} · ${PROGRAMA.nome}`,
      description: ep.descricao_curta,
      ...(imagem ? { images: [imagem] } : {}),
    },
  }
}

/** Segundos → duração ISO 8601 ("PT45M"), como o schema.org espera. */
function duracaoIso(segundos: number | null): string | undefined {
  if (!segundos || segundos <= 0) return undefined
  const m = Math.round(segundos / 60)
  return m >= 60 ? `PT${Math.floor(m / 60)}H${m % 60}M` : `PT${m}M`
}

export default async function EpisodioPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const ep = await obterEpisodio(slug)
  if (!ep) notFound()

  const { anterior, seguinte } = await vizinhos(ep.numero)
  const notas = markdownParaHtml(ep.notas_md)
  const url = `${BASE_URL}/podcast/${ep.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    url,
    name: ep.titulo,
    description: ep.descricao_curta,
    datePublished: ep.data_publicacao,
    episodeNumber: ep.numero,
    inLanguage: 'pt-PT',
    ...(duracaoIso(ep.duracao_segundos) ? { timeRequired: duracaoIso(ep.duracao_segundos) } : {}),
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: PROGRAMA.nome,
      url: `${BASE_URL}/podcast`,
    },
    ...(ep.audio_url || ep.youtube_id
      ? {
          associatedMedia: {
            '@type': 'MediaObject',
            contentUrl: ep.audio_url ?? `https://www.youtube.com/watch?v=${ep.youtube_id}`,
          },
        }
      : {}),
  }

  return (
    <div className="pod-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p style={{ marginBottom: 28 }}>
        <Link className="pod-voltar" href="/podcast"><span aria-hidden="true">‹</span> Todos os episódios</Link>
      </p>

      <header>
        <p className="pod-eyebrow">Episódio {String(ep.numero).padStart(2, '0')}</p>
        <h1 className="pod-h1" style={{ fontSize: 'clamp(30px, 5.5vw, 48px)' }}>{ep.titulo}</h1>
        {ep.subtitulo && <p className="pod-lede">{ep.subtitulo}</p>}
        <p className="pod-meta">
          {dataLegivel(ep.data_publicacao)}
          {ep.duracao_segundos ? ` · ${duracaoLegivel(ep.duracao_segundos)}` : ''}
        </p>
      </header>

      <section style={{ marginTop: 8 }}>
        <LeitorEpisodio
          youtubeId={ep.youtube_id}
          audioUrl={ep.audio_url}
          titulo={ep.titulo}
          capaUrl={ep.capa_url}
          capitulos={ep.capitulos}
        />
      </section>

      {/* Onde ouvir */}
      {(ep.spotify_url || ep.apple_url || ep.youtube_id) && (
        <section className="pod-seccao" style={{ marginTop: 40 }}>
          <h2 className="pod-h3">Ouvir noutro sítio</h2>
          <div className="pod-plataformas" style={{ marginTop: 0 }}>
            {ep.spotify_url && <a className="pod-btn-linha" href={ep.spotify_url} target="_blank" rel="noopener noreferrer">Spotify</a>}
            {ep.apple_url && <a className="pod-btn-linha" href={ep.apple_url} target="_blank" rel="noopener noreferrer">Apple Podcasts</a>}
            {ep.youtube_id && <a className="pod-btn-linha" href={`https://www.youtube.com/watch?v=${ep.youtube_id}`} target="_blank" rel="noopener noreferrer">YouTube</a>}
          </div>
        </section>
      )}

      {/* Convidados */}
      {ep.convidados.length > 0 && (
        <section className="pod-seccao">
          <h2 className="pod-h3">{ep.convidados.length > 1 ? 'Convidados' : 'Convidado'}</h2>
          <div className="pod-convidados">
            {ep.convidados.map(c => (
              <article key={c.id} className="pod-bloco pod-convidado">
                {c.foto_url && (
                  <Image
                    src={c.foto_url}
                    alt={`Retrato de ${c.nome}`}
                    width={200}
                    height={200}
                    sizes="120px"
                    className="pod-convidado-foto"
                  />
                )}
                <div>
                  <h3 className="pod-h2" style={{ fontSize: 24, marginBottom: 6 }}>{c.nome}</h3>
                  <p className="pod-meta">{[c.profissao, c.empresa].filter(Boolean).join(' · ')}</p>
                  {c.bio && <p className="pod-texto">{c.bio}</p>}
                  <div className="pod-plataformas" style={{ marginTop: 12 }}>
                    {c.website && <a className="pod-btn-linha" href={c.website} target="_blank" rel="noopener noreferrer">Site</a>}
                    {c.instagram && <a className="pod-btn-linha" href={c.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Notas */}
      {notas && (
        <section className="pod-seccao">
          <h2 className="pod-h3">Notas do episódio</h2>
          <div className="pod-texto" dangerouslySetInnerHTML={{ __html: notas }} />
        </section>
      )}

      {/* Transcrição */}
      {ep.transcricao && (
        <section className="pod-seccao">
          <details className="pod-transcricao">
            <summary>Transcrição completa</summary>
            <div className="pod-texto" style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>
              {ep.transcricao}
            </div>
          </details>
        </section>
      )}

      {/* Conversão, já com a origem preenchida */}
      <section className="pod-seccao">
        <FormularioLead
          origemEpisodioId={ep.id}
          intro="Se este episódio vos foi útil, falamos com muito gosto sobre a fotografia e o vídeo do vosso dia."
        />
      </section>

      {/* Anterior e seguinte */}
      {(anterior || seguinte) && (
        <nav className="pod-vizinhos" aria-label="Outros episódios">
          {anterior ? (
            <Link className="pod-vizinho" href={`/podcast/${anterior.slug}`}>
              <span className="pod-meta" style={{ margin: 0 }}>Anterior</span>
              <span>{anterior.titulo}</span>
            </Link>
          ) : <span />}
          {seguinte && (
            <Link className="pod-vizinho is-fim" href={`/podcast/${seguinte.slug}`}>
              <span className="pod-meta" style={{ margin: 0 }}>Seguinte</span>
              <span>{seguinte.titulo}</span>
            </Link>
          )}
        </nav>
      )}

      <style>{`
        .pod-plataformas { display: flex; flex-wrap: wrap; gap: 10px; }
        .pod-meta { font-size: 13px; color: var(--ink-4); margin: 0 0 18px; }

        .pod-convidados { display: flex; flex-direction: column; gap: 14px; }
        .pod-convidado { display: flex; gap: 24px; align-items: flex-start; }
        @media (max-width: 640px) { .pod-convidado { flex-direction: column; } }
        .pod-convidado-foto {
          width: 120px; height: 120px; flex: none;
          border-radius: 12px; object-fit: cover;
          border: 1px solid var(--gold-faint);
        }

        .pod-transcricao {
          border: 1px solid var(--line); border-radius: 12px;
          padding: 20px clamp(20px, 4vw, 28px);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
        }
        .pod-transcricao summary {
          cursor: pointer; list-style: none;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold);
        }
        .pod-transcricao summary::-webkit-details-marker { display: none; }

        .pod-vizinhos {
          display: flex; justify-content: space-between; gap: 16px;
          margin-top: clamp(48px, 8vw, 72px);
          padding-top: 28px; border-top: 1px solid var(--line);
        }
        .pod-vizinho {
          display: flex; flex-direction: column; gap: 6px;
          max-width: 46%; text-decoration: none; color: var(--ink-2);
          font-family: 'Cormorant Garamond', serif; font-size: 19px; line-height: 1.3;
        }
        .pod-vizinho:hover { color: var(--gold-soft); }
        .pod-vizinho.is-fim { text-align: right; margin-left: auto; }
      `}</style>
    </div>
  )
}
