'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Lista de episódios do podcast + painel de edição.
   Tudo vive em /api/podcast-episodios (tabela podcast_episodios).
   ============================================================ */

const ESTADOS = ['ideia', 'guião', 'gravado', 'editado', 'publicado'] as const
type Estado = typeof ESTADOS[number]

type Episodio = {
  id: string
  numero: number | null
  titulo: string
  tema: string | null
  convidado: string | null
  notas: string | null
  estado: Estado
  link: string | null
  data_publicacao: string | null
}

const VAZIO = { titulo: '', tema: '', convidado: '', notas: '', estado: 'ideia' as Estado, link: '', data_publicacao: '' }

export default function EpisodiosClient() {
  const [episodios, setEpisodios] = useState<Episodio[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [novo, setNovo] = useState(false)
  const [rascunho, setRascunho] = useState({ ...VAZIO })
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    fetch('/api/podcast-episodios')
      .then(r => r.json())
      .then(j => setEpisodios(j.episodios ?? []))
      .catch(() => setErro('Não foi possível carregar os episódios.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (aberto === null && !novo) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setAberto(null); setNovo(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, novo])

  function avisarGuardado() {
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1600)
  }

  async function guardar(id: string, patch: Partial<Episodio>) {
    setEpisodios(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)))
    setErro(null)
    try {
      const r = await fetch('/api/podcast-episodios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      if (!r.ok) throw new Error((await r.json())?.error ?? 'erro')
      avisarGuardado()
    } catch {
      setErro('Não foi possível guardar. A alteração fica só neste ecrã.')
    }
  }

  async function criar() {
    if (rascunho.titulo.trim().length < 3) { setErro('O título é obrigatório.'); return }
    setErro(null)
    try {
      const r = await fetch('/api/podcast-episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rascunho),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error ?? 'erro')
      setEpisodios(prev => [j.episodio, ...prev])
      setRascunho({ ...VAZIO })
      setNovo(false)
      avisarGuardado()
    } catch {
      setErro('Não foi possível criar o episódio.')
    }
  }

  async function eliminar(id: string, titulo: string) {
    if (!confirm(`Eliminar "${titulo}"? Esta acção não pode ser desfeita.`)) return
    setEpisodios(prev => prev.filter(e => e.id !== id))
    setAberto(null)
    try {
      await fetch(`/api/podcast-episodios?id=${id}`, { method: 'DELETE' })
    } catch { /* já saiu da lista; o reload mostra a verdade */ }
  }

  const emEdicao = episodios.find(e => e.id === aberto) ?? null

  if (loading) return <p className="pc-info">A carregar episódios…</p>

  return (
    <>
      <div className="pc-bar">
        <p className="pc-count">
          {episodios.length === 0 ? 'Sem episódios' : `${episodios.length} ${episodios.length === 1 ? 'episódio' : 'episódios'}`}
        </p>
        <button type="button" className="pc-btn" onClick={() => { setNovo(true); setRascunho({ ...VAZIO }) }}>
          + Novo episódio
        </button>
      </div>

      {erro && <p className="pc-erro">{erro}</p>}
      {guardado && <p className="pc-ok">Guardado</p>}

      {episodios.length === 0 && !novo && (
        <section className="pc-empty">
          <p className="pc-empty-title">Ainda sem episódios</p>
          <p className="pc-empty-desc">Carrega em "Novo episódio" para começar a escrever o primeiro.</p>
        </section>
      )}

      <div className="pc-list">
        {episodios.map(ep => (
          <button key={ep.id} type="button" className="pc-item" onClick={() => setAberto(ep.id)}>
            <span className="pc-item-num">{ep.numero != null ? String(ep.numero).padStart(2, '0') : '··'}</span>
            <span className="pc-item-body">
              <span className="pc-item-title">{ep.titulo}</span>
              <span className="pc-item-meta">
                {[ep.tema, ep.convidado ? `com ${ep.convidado}` : null].filter(Boolean).join(' · ') || 'Sem tema definido'}
              </span>
            </span>
            <span className={`pc-badge is-${ep.estado.replace('ã', 'a')}`}>{ep.estado}</span>
          </button>
        ))}
      </div>

      {/* Painel: novo episódio */}
      {novo && (
        <div className="pc-overlay" onClick={() => setNovo(false)}>
          <div className="pc-panel" onClick={e => e.stopPropagation()}>
            <div className="pc-panel-head">
              <p className="pc-panel-eyebrow">Novo</p>
              <h2 className="pc-panel-title">Episódio</h2>
              <button type="button" className="pc-close" onClick={() => setNovo(false)}>×</button>
            </div>
            <div className="pc-panel-body">
              <Campo label="Título" valor={rascunho.titulo} onChange={v => setRascunho(r => ({ ...r, titulo: v }))} />
              <Campo label="Tema" valor={rascunho.tema} onChange={v => setRascunho(r => ({ ...r, tema: v }))} />
              <Campo label="Convidado" valor={rascunho.convidado} onChange={v => setRascunho(r => ({ ...r, convidado: v }))} />
              <Area label="Notas e guião" valor={rascunho.notas} onChange={v => setRascunho(r => ({ ...r, notas: v }))} />
              <div className="pc-acoes">
                <button type="button" className="pc-btn-ghost" onClick={() => setNovo(false)}>Cancelar</button>
                <button type="button" className="pc-btn" onClick={criar}>Criar episódio</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel: editar episódio */}
      {emEdicao && (
        <div className="pc-overlay" onClick={() => setAberto(null)}>
          <div className="pc-panel" onClick={e => e.stopPropagation()}>
            <div className="pc-panel-head">
              <p className="pc-panel-eyebrow">
                Episódio {emEdicao.numero != null ? String(emEdicao.numero).padStart(2, '0') : ''}
              </p>
              <h2 className="pc-panel-title">{emEdicao.titulo}</h2>
              <button type="button" className="pc-close" onClick={() => setAberto(null)}>×</button>
            </div>

            <div className="pc-panel-body">
              <Campo label="Título" valor={emEdicao.titulo}
                onChange={v => guardar(emEdicao.id, { titulo: v })} />
              <Campo label="Tema" valor={emEdicao.tema ?? ''}
                onChange={v => guardar(emEdicao.id, { tema: v })} />
              <Campo label="Convidado" valor={emEdicao.convidado ?? ''}
                onChange={v => guardar(emEdicao.id, { convidado: v })} />

              <div className="pc-campo">
                <label className="pc-label">Estado</label>
                <div className="pc-estados">
                  {ESTADOS.map(e => (
                    <button key={e} type="button"
                      className={`pc-estado ${emEdicao.estado === e ? 'is-on' : ''}`}
                      onClick={() => guardar(emEdicao.id, { estado: e })}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <Campo label="Link do episódio" valor={emEdicao.link ?? ''} placeholder="https://…"
                onChange={v => guardar(emEdicao.id, { link: v })} />
              <Campo label="Data de publicação" tipo="date" valor={emEdicao.data_publicacao ?? ''}
                onChange={v => guardar(emEdicao.id, { data_publicacao: v })} />
              <Area label="Notas e guião" valor={emEdicao.notas ?? ''}
                onChange={v => guardar(emEdicao.id, { notas: v })} />

              <div className="pc-acoes">
                <button type="button" className="pc-btn-danger"
                  onClick={() => eliminar(emEdicao.id, emEdicao.titulo)}>
                  Eliminar
                </button>
                <button type="button" className="pc-btn" onClick={() => setAberto(null)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Campos ────────────────────────────────────────────────── */

function Campo({ label, valor, onChange, placeholder, tipo = 'text' }: {
  label: string; valor: string; onChange: (v: string) => void; placeholder?: string; tipo?: string
}) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <input
        type={tipo}
        value={local}
        placeholder={placeholder}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }}
        className="pc-input"
      />
    </div>
  )
}

function Area({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <textarea
        value={local}
        rows={10}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }}
        className="pc-input pc-area"
        placeholder="Tópicos, perguntas, ordem da conversa…"
      />
    </div>
  )
}
