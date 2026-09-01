'use client'

import { useEffect, useState } from 'react'
import { GUIOES, type Estado } from './_data/guioes'

/* ============================================================
   Grelha dos 12 meses + painel do guião.
   Estado e link do vídeo são guardados em /api/guioes-12meses.
   ============================================================ */

const ESTADOS: Estado[] = ['por gravar', 'gravado', 'editado', 'publicado']

type Campos = { estado: Estado; link: string }

export default function GuioesClient() {
  const [dados, setDados]   = useState<Record<number, Campos>>({})
  const [loading, setLoading] = useState(true)
  const [aberto, setAberto] = useState<number | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [erro, setErro]     = useState<string | null>(null)

  // Uma leitura por abertura da página
  useEffect(() => {
    fetch('/api/guioes-12meses')
      .then(r => r.json())
      .then(j => {
        const map: Record<number, Campos> = {}
        for (const m of j.meses ?? []) {
          map[m.n] = { estado: (m.estado ?? 'por gravar') as Estado, link: m.link ?? '' }
        }
        setDados(map)
      })
      .catch(() => setErro('Não foi possível carregar o estado dos meses.'))
      .finally(() => setLoading(false))
  }, [])

  // Fechar o painel com Esc
  useEffect(() => {
    if (aberto === null) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setAberto(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  function campos(n: number): Campos {
    return dados[n] ?? { estado: 'por gravar', link: '' }
  }

  async function guardar(n: number, patch: Partial<Campos>) {
    setDados(prev => ({ ...prev, [n]: { ...campos(n), ...patch } }))
    setErro(null)
    try {
      const r = await fetch('/api/guioes-12meses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, ...patch }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1800)
    } catch (e: any) {
      setErro(`Não foi possível guardar: ${e.message}`)
    }
  }

  const publicados = GUIOES.filter(g => campos(g.n).estado === 'publicado').length
  const guiao = aberto === null ? null : GUIOES.find(g => g.n === aberto) ?? null

  return (
    <>
      {/* Contador */}
      <p className="mv-contador">
        12 vídeos · <strong>{publicados}</strong> publicados
      </p>

      {erro && <p className="mv-erro">{erro}</p>}

      {/* Grelha */}
      <section className="mv-grid">
        {GUIOES.map(g => {
          const c = campos(g.n)
          return (
            <button
              key={g.n}
              type="button"
              className={`mv-card is-${slug(c.estado)}`}
              onClick={() => setAberto(g.n)}
            >
              <span className="mv-card-top">
                <span className="mv-num">{String(g.n).padStart(2, '0')}</span>
                <span className="mv-dot" aria-hidden="true" />
              </span>
              <span className="mv-mes">{g.mes} {g.ano}</span>
              <span className="mv-titulo">{g.titulo}</span>
              <span className="mv-card-foot">
                <span className="mv-estado">{loading ? '—' : c.estado}</span>
                {c.link && <span className="mv-tem-link" title="Tem link">▶</span>}
              </span>
            </button>
          )
        })}
      </section>

      {/* Painel do guião */}
      {guiao && (
        <div className="mv-overlay" onClick={() => setAberto(null)}>
          <article className="mv-painel" onClick={e => e.stopPropagation()}>
            <header className="mv-painel-head">
              <div>
                <p className="mv-painel-mes">{guiao.mes} {guiao.ano} · {guiao.duracao}</p>
                <h2 className="mv-painel-titulo">{guiao.titulo}</h2>
              </div>
              <button type="button" className="mv-fechar" onClick={() => setAberto(null)} aria-label="Fechar">×</button>
            </header>

            {/* Campos editáveis */}
            <div className="mv-campos">
              <label className="mv-campo">
                <span className="mv-campo-label">Estado</span>
                <select
                  className="mv-select"
                  value={campos(guiao.n).estado}
                  onChange={e => guardar(guiao.n, { estado: e.target.value as Estado })}
                >
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </label>

              <label className="mv-campo mv-campo--link">
                <span className="mv-campo-label">Link do vídeo</span>
                <input
                  type="url"
                  className="mv-input"
                  placeholder="https://"
                  defaultValue={campos(guiao.n).link}
                  key={`link-${guiao.n}`}
                  onBlur={e => {
                    const v = e.target.value.trim()
                    if (v !== campos(guiao.n).link) guardar(guiao.n, { link: v })
                  }}
                />
              </label>

              {campos(guiao.n).link && (
                <a className="mv-abrir" href={campos(guiao.n).link} target="_blank" rel="noreferrer">Abrir ↗</a>
              )}

              <span className={`mv-guardado ${guardado ? 'is-on' : ''}`}>Guardado</span>
            </div>

            {guiao.publicacao && (
              <p className="mv-pub">
                <span className="mv-pub-label">Publicação</span> {guiao.publicacao}
              </p>
            )}

            <h3 className="mv-h3">Nota de realização</h3>
            <p className="mv-nota">{guiao.nota}</p>

            <h3 className="mv-h3">Teleponto</h3>
            <div className="mv-tele">
              {guiao.teleponto.map((par, i) => (
                <p key={i}>
                  {par.label && <strong>{par.label}</strong>}
                  {par.label && par.text ? ' ' : null}
                  {par.text}
                </p>
              ))}
            </div>
          </article>
        </div>
      )}
    </>
  )
}

function slug(estado: Estado) {
  return estado.replace(/\s+/g, '-')
}
