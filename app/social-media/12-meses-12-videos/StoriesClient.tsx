'use client'

import { useMemo, useRef, useState } from 'react'
import { Prompter } from './GuioesClient'
import { CATEGORIAS, DICAS_STORIES, STORIES, type Categoria, type Story } from './_data/stories'

/* ============================================================
   Stories de 1 minuto: negócio, empreendedorismo e confiança.
   Lista por categoria + palco com gancho, guião, sticker e nota.
   Reutiliza o modo teleponto dos 12 meses.
   ============================================================ */

const PALAVRAS_POR_SEG = 2.5

function textoCompleto(s: Story): string {
  return [s.gancho, ...s.teleponto.map(p => p.text ?? '')].join('\n\n')
}

export default function StoriesClient() {
  const [cat, setCat]           = useState<Categoria | 'todas'>('todas')
  const [sel, setSel]           = useState<string>(STORIES[0].id)
  const [prompter, setPrompter] = useState(false)
  const [copiado, setCopiado]   = useState(false)
  const palcoRef = useRef<HTMLElement>(null)

  const lista = useMemo(
    () => (cat === 'todas' ? STORIES : STORIES.filter(s => s.categoria === cat)),
    [cat],
  )
  const story = STORIES.find(s => s.id === sel)!
  const nPal = textoCompleto(story).split(/\s+/).filter(Boolean).length
  const segs = Math.round(nPal / PALAVRAS_POR_SEG)

  function escolher(id: string) {
    setSel(id)
    requestAnimationFrame(() =>
      palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoCompleto(story))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch { /* sem permissão de clipboard */ }
  }

  return (
    <section className="st">
      <header className="st-head">
        <p className="mv-stage-meta">Fora do calendário · Instagram Stories</p>
        <h2 className="mv-plano-title">Stories de 1 minuto</h2>
        <p className="st-sub">
          {STORIES.length} temas sobre negócio, empreendedorismo e confiança. Um minuto, olhar na lente, sem produção.
        </p>
      </header>

      <div className="st-cats">
        <button
          type="button"
          className={`mv-plano-tab ${cat === 'todas' ? 'is-on' : ''}`}
          onClick={() => setCat('todas')}
        >Todas <b>{STORIES.length}</b></button>
        {CATEGORIAS.map(c => (
          <button
            key={c}
            type="button"
            className={`mv-plano-tab ${cat === c ? 'is-on' : ''}`}
            onClick={() => setCat(c)}
          >{c} <b>{STORIES.filter(s => s.categoria === c).length}</b></button>
        ))}
      </div>

      <div className="st-grid">
        {lista.map(s => (
          <button
            key={s.id}
            type="button"
            className={`st-card ${s.id === sel ? 'is-sel' : ''}`}
            onClick={() => escolher(s.id)}
          >
            <span className="st-card-cat">{s.categoria}</span>
            <span className="st-card-titulo">{s.titulo}</span>
            <span className="st-card-gancho">“{s.gancho}”</span>
          </button>
        ))}
      </div>

      <article key={story.id} ref={palcoRef} className="mv-stage from-right st-stage">
        <header className="mv-stage-head">
          <p className="mv-stage-meta">
            {story.categoria}<span>·</span> 1 minuto<span>·</span> {nPal} palavras · ~{segs}s
          </p>
          <h3 className="mv-stage-titulo">{story.titulo}</h3>
        </header>

        <p className="st-gancho"><small>Gancho · primeiros 3 segundos</small>{story.gancho}</p>

        <div className="mv-tele">
          {story.teleponto.map((par, i) => (
            <p key={i} style={{ animationDelay: `${i * 45}ms` }}>{par.text}</p>
          ))}
        </div>

        <div className="st-extras">
          <p className="st-extra"><small>Sticker</small>{story.sticker}</p>
          <p className="st-extra"><small>Realização</small>{story.nota}</p>
        </div>

        <div className="st-acoes">
          <button type="button" className="mv-prompter-btn" onClick={() => setPrompter(true)}>
            <span className="mv-play" aria-hidden="true">▶</span> Abrir modo teleponto
          </button>
          <button type="button" className="mv-prompter-btn st-copiar" onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar texto'}
          </button>
        </div>
      </article>

      <div className="mv-plano st-dicas">
        <h2 className="mv-plano-title">Como gravar as stories</h2>
        <ol className="mv-plano-list">
          {DICAS_STORIES.map((t, i) => (
            <li key={i} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="mv-plano-n">{String(i + 1).padStart(2, '0')}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      {prompter && (
        <Prompter
          guiao={{ teleponto: [{ text: story.gancho }, ...story.teleponto] }}
          onClose={() => setPrompter(false)}
        />
      )}
    </section>
  )
}
