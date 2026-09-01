'use client'

import { useState } from 'react'
import Image from 'next/image'
import { marcaTemporal, type Capitulo } from '@/lib/podcast/tipos'

/* ============================================================
   Leitor do episódio.

   O iframe do YouTube só é carregado ao clique: até lá mostra-se a
   miniatura. É a "fachada" que o briefing pede, e é o que evita que
   o YouTube pese na página de quem só quer ler as notas.

   Os capítulos são botões: carregar num deles abre o vídeo já no
   minuto certo.
   ============================================================ */

type Props = {
  youtubeId: string | null
  audioUrl: string | null
  titulo: string
  capaUrl: string | null
  capitulos: Capitulo[]
}

export default function LeitorEpisodio({ youtubeId, audioUrl, titulo, capaUrl, capitulos }: Props) {
  const [separador, setSeparador] = useState<'video' | 'audio'>(youtubeId ? 'video' : 'audio')
  const [inicio, setInicio] = useState<number | null>(null)   // null = ainda não carregou o iframe

  const temVideo = !!youtubeId
  const temAudio = !!audioUrl
  if (!temVideo && !temAudio) return null

  const miniatura = capaUrl ?? (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg` : null)

  return (
    <div className="lei">
      {temVideo && temAudio && (
        <div className="lei-tabs" role="tablist" aria-label="Formato do episódio">
          <button role="tab" aria-selected={separador === 'video'}
            className={`lei-tab ${separador === 'video' ? 'is-on' : ''}`}
            onClick={() => setSeparador('video')}>Vídeo</button>
          <button role="tab" aria-selected={separador === 'audio'}
            className={`lei-tab ${separador === 'audio' ? 'is-on' : ''}`}
            onClick={() => setSeparador('audio')}>Áudio</button>
        </div>
      )}

      {separador === 'video' && temVideo && (
        inicio === null ? (
          <button className="lei-fachada" onClick={() => setInicio(0)}
            aria-label={`Ver o episódio ${titulo} no YouTube`}>
            {miniatura && (
              <Image
                src={miniatura}
                alt=""
                width={1280}
                height={720}
                sizes="(max-width: 880px) 100vw, 880px"
                className="lei-miniatura"
                priority={false}
              />
            )}
            <span className="lei-play" aria-hidden="true">▶</span>
          </button>
        ) : (
          <div className="lei-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?start=${inicio}&autoplay=1&rel=0`}
              title={titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )
      )}

      {separador === 'audio' && temAudio && (
        <audio className="lei-audio" controls preload="none" src={audioUrl!}>
          O teu navegador não consegue reproduzir este áudio.
        </audio>
      )}

      {capitulos.length > 0 && (
        <div className="lei-capitulos">
          <h2 className="pod-h3">Capítulos</h2>
          <ol className="lei-lista">
            {capitulos.map(c => (
              <li key={c.id}>
                <button className="lei-cap"
                  onClick={() => { setSeparador('video'); setInicio(c.inicio_segundos) }}
                  disabled={!temVideo}>
                  <span className="lei-cap-tempo">{marcaTemporal(c.inicio_segundos)}</span>
                  <span className="lei-cap-titulo">{c.titulo}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <style>{`
        .lei-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .lei-tab {
          font-family: inherit; cursor: pointer;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 10px 20px; border-radius: 999px;
          border: 1px solid var(--line); background: transparent; color: var(--ink-4);
          transition: 0.2s; min-height: 44px;
        }
        .lei-tab:hover { color: var(--ink); border-color: var(--gold-line); }
        .lei-tab.is-on { color: #17110a; background: var(--gold); border-color: var(--gold); }

        .lei-fachada {
          position: relative; display: block; width: 100%;
          aspect-ratio: 16 / 9; padding: 0; cursor: pointer;
          border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
          background: var(--surface-2);
        }
        .lei-miniatura { width: 100%; height: 100%; object-fit: cover; }
        .lei-play {
          position: absolute; inset: 0; margin: auto;
          width: 74px; height: 74px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; color: #17110a;
          background: var(--gold);
          box-shadow: 0 12px 40px -8px rgba(0,0,0,0.7);
          transition: transform 0.25s;
        }
        .lei-fachada:hover .lei-play { transform: scale(1.06); }

        .lei-video {
          position: relative; width: 100%; aspect-ratio: 16 / 9;
          border-radius: 12px; overflow: hidden; border: 1px solid var(--line);
        }
        .lei-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

        .lei-audio { width: 100%; margin-top: 4px; }

        .lei-capitulos { margin-top: 28px; }
        .lei-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
        .lei-cap {
          display: flex; align-items: baseline; gap: 16px; width: 100%;
          font-family: inherit; text-align: left; cursor: pointer;
          padding: 11px 14px; border-radius: 8px;
          border: 1px solid transparent; background: transparent;
          transition: 0.2s; min-height: 44px;
        }
        .lei-cap:hover:not([disabled]) { background: rgba(200,168,102,0.06); border-color: var(--gold-faint); }
        .lei-cap[disabled] { cursor: default; }
        .lei-cap-tempo {
          font-size: 12.5px; font-variant-numeric: tabular-nums;
          color: var(--gold); min-width: 46px; flex: none;
        }
        .lei-cap-titulo { font-size: 14.5px; color: var(--ink-2); }
      `}</style>
    </div>
  )
}
