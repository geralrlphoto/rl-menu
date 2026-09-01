import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { listarEpisodios } from '@/lib/podcast/dados'
import { dataLegivel, duracaoLegivel } from '@/lib/podcast/tipos'
import { PROGRAMA, BASE_URL } from '@/lib/podcast/programa'
import FormularioLead from './FormularioLead'
import LeitorEpisodio from './LeitorEpisodio'

/* ============================================================
   /podcast — página principal.
   Renderizada no servidor e reconstruída de hora a hora (ISR).
   Uma leitura à base de dados por reconstrução, não por visita.
   ============================================================ */

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Antes do Sim — Podcast sobre casamentos',
  description: PROGRAMA.promessa,
  alternates: { canonical: `${BASE_URL}/podcast` },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    title: 'Antes do Sim — Podcast sobre casamentos',
    description: PROGRAMA.promessa,
    url: `${BASE_URL}/podcast`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antes do Sim — Podcast sobre casamentos',
    description: PROGRAMA.promessa,
  },
}

const POR_PAGINA = 12

export default async function PodcastPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>
}) {
  const { pagina: paginaParam } = await searchParams
  const pagina = Math.max(1, Number(paginaParam) || 1)

  const todos = await listarEpisodios()
  const destaque = todos[0] ?? null
  const restantes = todos.slice(1)

  const totalPaginas = Math.max(1, Math.ceil(restantes.length / POR_PAGINA))
  const inicio = (pagina - 1) * POR_PAGINA
  const visiveis = restantes.slice(inicio, inicio + POR_PAGINA)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: PROGRAMA.nome,
    description: PROGRAMA.descricao,
    url: `${BASE_URL}/podcast`,
    inLanguage: 'pt-PT',
    author: { '@type': 'Organization', name: PROGRAMA.autor },
    ...(PROGRAMA.plataformas.rss ? { webFeed: PROGRAMA.plataformas.rss } : {}),
  }

  return (
    <div className="pod-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Herói ─────────────────────────────────────────── */}
      <header className="pod-heroi">
        <div>
          <p className="pod-eyebrow">Podcast · RL Photo Video</p>
          <h1 className="pod-h1">Antes do <em>Sim</em></h1>
          <p className="pod-lede">{PROGRAMA.promessa}</p>
          <div className="pod-plataformas">
            {PROGRAMA.plataformas.spotify && (
              <a className="pod-btn" href={PROGRAMA.plataformas.spotify} target="_blank" rel="noopener noreferrer">Spotify</a>
            )}
            {PROGRAMA.plataformas.apple && (
              <a className="pod-btn-linha" href={PROGRAMA.plataformas.apple} target="_blank" rel="noopener noreferrer">Apple Podcasts</a>
            )}
            {PROGRAMA.plataformas.youtube && (
              <a className="pod-btn-linha" href={PROGRAMA.plataformas.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
            )}
          </div>
        </div>
        <div className="pod-heroi-capa">
          <Image
            src={PROGRAMA.capa}
            alt={`Capa do podcast ${PROGRAMA.nome}`}
            width={480}
            height={480}
            sizes="(max-width: 780px) 60vw, 340px"
            priority
          />
        </div>
      </header>

      {/* ── Episódio em destaque ──────────────────────────── */}
      {destaque && (
        <section className="pod-seccao" aria-labelledby="destaque-titulo">
          <h2 className="pod-h3">Episódio mais recente</h2>
          <div className="pod-bloco is-destaque">
            <p className="pod-num">Episódio {String(destaque.numero).padStart(2, '0')}</p>
            <h3 className="pod-h2" id="destaque-titulo">
              <Link href={`/podcast/${destaque.slug}`}>{destaque.titulo}</Link>
            </h3>
            <p className="pod-meta">
              {dataLegivel(destaque.data_publicacao)}
              {destaque.duracao_segundos ? ` · ${duracaoLegivel(destaque.duracao_segundos)}` : ''}
            </p>
            <p className="pod-lede">{destaque.descricao_curta}</p>

            <LeitorEpisodio
              youtubeId={destaque.youtube_id}
              audioUrl={null}
              titulo={destaque.titulo}
              capaUrl={destaque.capa_url}
              capitulos={[]}
            />

            <p style={{ marginTop: 24, marginBottom: 0 }}>
              <Link className="pod-btn-linha" href={`/podcast/${destaque.slug}`}>
                Ver notas do episódio
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* ── Lista de episódios ────────────────────────────── */}
      <section className="pod-seccao" aria-labelledby="lista-titulo">
        <h2 className="pod-h3" id="lista-titulo">Todos os episódios</h2>

        {todos.length === 0 && (
          <div className="pod-bloco">
            <p className="pod-lede" style={{ margin: 0 }}>
              O primeiro episódio está a caminho. Volta em breve.
            </p>
          </div>
        )}

        {visiveis.length > 0 && (
          <ul className="pod-lista">
            {visiveis.map(ep => (
              <li key={ep.id}>
                <Link className="pod-cartao" href={`/podcast/${ep.slug}`}>
                  <span className="pod-cartao-capa">
                    {ep.capa_url ? (
                      <Image
                        src={ep.capa_url}
                        alt=""
                        width={320}
                        height={320}
                        sizes="(max-width: 640px) 96px, 128px"
                      />
                    ) : (
                      <span className="pod-cartao-num">{String(ep.numero).padStart(2, '0')}</span>
                    )}
                  </span>
                  <span className="pod-cartao-corpo">
                    <span className="pod-cartao-titulo">{ep.titulo}</span>
                    <span className="pod-cartao-desc">{ep.descricao_curta}</span>
                    <span className="pod-meta">
                      {dataLegivel(ep.data_publicacao)}
                      {ep.duracao_segundos ? ` · ${duracaoLegivel(ep.duracao_segundos)}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPaginas > 1 && (
          <nav className="pod-paginacao" aria-label="Páginas de episódios">
            {pagina > 1 && (
              <Link className="pod-btn-linha" href={`/podcast?pagina=${pagina - 1}`}>‹ Anteriores</Link>
            )}
            <span className="pod-meta">Página {pagina} de {totalPaginas}</span>
            {pagina < totalPaginas && (
              <Link className="pod-btn-linha" href={`/podcast?pagina=${pagina + 1}`}>Seguintes ›</Link>
            )}
          </nav>
        )}
      </section>

      {/* ── Conversão ─────────────────────────────────────── */}
      <section className="pod-seccao" aria-labelledby="lead-titulo">
        <h2 className="pod-h3" id="lead-titulo">Para os noivos</h2>
        <FormularioLead />
      </section>

      {/* ── Profissionais ─────────────────────────────────── */}
      <section className="pod-seccao">
        <div className="pod-faixa">
          <div>
            <p className="pod-h3" style={{ marginBottom: 8 }}>É profissional de casamentos?</p>
            <p className="pod-meta" style={{ margin: 0 }}>
              Recebemos candidaturas de convidados para os próximos episódios.
            </p>
          </div>
          <Link className="pod-btn-linha" href="/podcast/convidados">Quero ser convidado</Link>
        </div>
      </section>

      <style>{`
        .pod-heroi {
          display: grid; grid-template-columns: 1fr 340px;
          gap: clamp(24px, 5vw, 56px); align-items: center;
          padding-top: clamp(24px, 6vw, 56px);
        }
        @media (max-width: 780px) {
          .pod-heroi { grid-template-columns: 1fr; }
          .pod-heroi-capa { order: -1; max-width: 220px; }
        }
        .pod-heroi-capa img {
          width: 100%; height: auto; border-radius: 14px;
          border: 1px solid var(--gold-line);
        }
        .pod-plataformas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }

        .pod-num {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--gold-deep); margin: 0 0 10px;
        }
        .pod-meta { font-size: 13px; color: var(--ink-4); margin: 0 0 18px; }
        .pod-h2 a { color: inherit; text-decoration: none; }
        .pod-h2 a:hover { color: var(--gold-soft); }

        .pod-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .pod-cartao {
          display: flex; gap: 20px; align-items: center;
          padding: 18px; border-radius: 12px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, var(--surface), var(--surface-2));
          text-decoration: none; color: inherit;
          transition: transform 0.3s cubic-bezier(0.2,0.85,0.25,1), border-color 0.3s;
        }
        .pod-cartao:hover { transform: translateY(-2px); border-color: var(--gold-line); }
        .pod-cartao-capa {
          width: 96px; height: 96px; flex: none;
          border-radius: 10px; overflow: hidden;
          border: 1px solid var(--gold-faint);
          background: rgba(200,168,102,0.05);
          display: flex; align-items: center; justify-content: center;
        }
        .pod-cartao-capa img { width: 100%; height: 100%; object-fit: cover; }
        .pod-cartao-num {
          font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-size: 34px; color: var(--gold-deep);
        }
        .pod-cartao-corpo { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pod-cartao-titulo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; line-height: 1.25; color: var(--ink);
        }
        .pod-cartao-desc { font-size: 14px; color: var(--ink-3); }
        .pod-cartao .pod-meta { margin: 4px 0 0; }

        .pod-paginacao {
          display: flex; align-items: center; justify-content: center;
          gap: 18px; margin-top: 28px;
        }

        .pod-faixa {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px;
          padding: 26px clamp(20px, 4vw, 34px);
          border-radius: 12px;
          border: 1px dashed var(--gold-faint);
          background: rgba(200,168,102,0.03);
        }
      `}</style>
    </div>
  )
}
