'use client'

import { useEffect, useRef, useState } from 'react'
import type { Episodio, EstadoEpisodio } from '@/lib/podcast/tipos'
import { gerarSlug } from '@/lib/podcast/tipos'
import GravacaoEpisodio from './GravacaoEpisodio'
import ConvidadosEpisodio from './ConvidadosEpisodio'
import PotenciaisEpisodio from './PotenciaisEpisodio'

/* ============================================================
   Back-office dos episódios do podcast.
   Lê e escreve em /api/podcast-episodios, que só responde ao admin.
   ============================================================ */

const ESTADOS: EstadoEpisodio[] = ['rascunho', 'agendado', 'publicado']

export default function EpisodiosClient() {
  const [episodios, setEpisodios] = useState<Episodio[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [aCriar, setACriar] = useState(false)

  useEffect(() => {
    fetch('/api/podcast-episodios')
      .then(r => r.json())
      .then(j => setEpisodios(j.episodios ?? []))
      .catch(() => setErro('Não foi possível carregar os episódios.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setAberto(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  function confirmar(msg: string) {
    setAviso(msg)
    setTimeout(() => setAviso(null), 1800)
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
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error ?? 'erro')
      confirmar('Guardado')
    } catch (e: any) {
      setErro(e?.message === 'o endereço de um episódio publicado não pode mudar'
        ? 'O endereço de um episódio publicado não pode mudar.'
        : 'Não foi possível guardar.')
    }
  }

  async function criar() {
    if (novoTitulo.trim().length < 3) { setErro('Escreve o título do episódio.'); return }
    setACriar(true); setErro(null)
    try {
      const r = await fetch('/api/podcast-episodios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: novoTitulo.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error ?? 'erro')
      setEpisodios(prev => [j.episodio, ...prev])
      setNovoTitulo('')
      setAberto(j.episodio.id)
    } catch {
      setErro('Não foi possível criar o episódio.')
    } finally {
      setACriar(false)
    }
  }

  async function eliminar(ep: Episodio) {
    if (!confirm(`Eliminar o episódio "${ep.titulo}"? Esta acção não pode ser desfeita.`)) return
    setEpisodios(prev => prev.filter(e => e.id !== ep.id))
    setAberto(null)
    await fetch(`/api/podcast-episodios?id=${ep.id}`, { method: 'DELETE' }).catch(() => {})
  }

  const emEdicao = episodios.find(e => e.id === aberto) ?? null

  if (loading) return <p className="pc-info">A carregar episódios…</p>

  return (
    <>
      <div className="pc-bar">
        <p className="pc-count">
          {episodios.length === 0 ? 'Sem episódios' : `${episodios.length} ${episodios.length === 1 ? 'episódio' : 'episódios'}`}
        </p>
        <div className="pc-novo">
          <input
            className="pc-input"
            placeholder="Título do novo episódio"
            value={novoTitulo}
            onChange={e => setNovoTitulo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') criar() }}
          />
          <button type="button" className="pc-btn" onClick={criar} disabled={aCriar}>
            {aCriar ? 'A criar…' : '+ Criar'}
          </button>
        </div>
      </div>

      {erro && <p className="pc-erro">{erro}</p>}
      {aviso && <p className="pc-ok">{aviso}</p>}

      {episodios.length === 0 && (
        <section className="pc-empty">
          <p className="pc-empty-title">Ainda sem episódios</p>
          <p className="pc-empty-desc">Escreve um título acima e carrega em Criar.</p>
        </section>
      )}

      <div className="pc-list">
        {episodios.map(ep => (
          <button key={ep.id} type="button" className="pc-item" onClick={() => setAberto(ep.id)}>
            <span className="pc-item-num">{String(ep.numero).padStart(2, '0')}</span>
            <span className="pc-item-body">
              <span className="pc-item-title">{ep.titulo}</span>
              <span className="pc-item-meta">{ep.descricao_curta || 'Sem descrição'}</span>
            </span>
            <span className={`pc-badge is-${ep.estado}`}>{ep.estado}</span>
          </button>
        ))}
      </div>

      {emEdicao && (
        <div className="pc-overlay" onClick={() => setAberto(null)}>
          <div className="pc-panel" onClick={e => e.stopPropagation()}>
            <div className="pc-panel-head">
              <p className="pc-panel-eyebrow">Episódio {String(emEdicao.numero).padStart(2, '0')}</p>
              <h2 className="pc-panel-title">{emEdicao.titulo}</h2>
              <button type="button" className="pc-close" onClick={() => setAberto(null)}>×</button>
            </div>

            <div className="pc-panel-body">
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
                <p className="pc-dica">
                  Só os episódios <strong>publicados</strong> com data já passada aparecem em /podcast.
                </p>
              </div>

              <Campo label="Título" valor={emEdicao.titulo}
                onChange={v => guardar(emEdicao.id, { titulo: v })} />

              <div className="pc-campo">
                <label className="pc-label">Endereço (slug)</label>
                <div className="pc-slug">
                  <code>/podcast/{emEdicao.slug}</code>
                  {emEdicao.estado !== 'publicado' && (
                    <button type="button" className="pc-mini"
                      onClick={() => guardar(emEdicao.id, { slug: gerarSlug(emEdicao.numero, emEdicao.titulo) })}>
                      Gerar do título
                    </button>
                  )}
                </div>
                <p className="pc-dica">Depois de publicado, o endereço não muda.</p>
              </div>

              <Campo label="Subtítulo" valor={emEdicao.subtitulo ?? ''}
                onChange={v => guardar(emEdicao.id, { subtitulo: v })} />
              <Area label="Descrição curta (cartões e Google)" linhas={3} valor={emEdicao.descricao_curta ?? ''}
                onChange={v => guardar(emEdicao.id, { descricao_curta: v })} />

              <div className="pc-dois">
                <Campo label="Número" tipo="number" valor={String(emEdicao.numero ?? '')}
                  onChange={v => guardar(emEdicao.id, { numero: Number(v) })} />
                <Campo label="Duração (minutos)"
                  tipo="number"
                  valor={emEdicao.duracao_segundos ? String(Math.round(emEdicao.duracao_segundos / 60)) : ''}
                  onChange={v => guardar(emEdicao.id, { duracao_segundos: Number(v) * 60 })} />
              </div>

              <Campo label="Data de publicação" tipo="datetime-local"
                valor={(emEdicao.data_publicacao ?? '').slice(0, 16)}
                onChange={v => guardar(emEdicao.id, { data_publicacao: new Date(v).toISOString() })} />

              <CampoCapa capa={emEdicao.capa_url}
                onChange={url => guardar(emEdicao.id, { capa_url: url })} />

              <div className="pc-dois">
                <Campo label="ID do YouTube" valor={emEdicao.youtube_id ?? ''} placeholder="dQw4w9WgXcQ"
                  onChange={v => guardar(emEdicao.id, { youtube_id: v })} />
                <Campo label="Ficheiro de áudio (URL)" valor={emEdicao.audio_url ?? ''}
                  onChange={v => guardar(emEdicao.id, { audio_url: v })} />
              </div>
              <div className="pc-dois">
                <Campo label="Spotify" valor={emEdicao.spotify_url ?? ''}
                  onChange={v => guardar(emEdicao.id, { spotify_url: v })} />
                <Campo label="Apple Podcasts" valor={emEdicao.apple_url ?? ''}
                  onChange={v => guardar(emEdicao.id, { apple_url: v })} />
              </div>

              <GravacaoEpisodio episodioId={emEdicao.id} />
              <ConvidadosEpisodio episodioId={emEdicao.id} />
              <PotenciaisEpisodio episodioId={emEdicao.id} />

              <Area label="Guião — perguntas âncora (interno, não sai no site)" linhas={14}
                valor={emEdicao.guiao_md ?? ''}
                onChange={v => guardar(emEdicao.id, { guiao_md: v })} />

              <Area label="Notas do episódio (Markdown)" linhas={12} valor={emEdicao.notas_md ?? ''}
                onChange={v => guardar(emEdicao.id, { notas_md: v })} />
              <Area label="Transcrição" linhas={8} valor={emEdicao.transcricao ?? ''}
                onChange={v => guardar(emEdicao.id, { transcricao: v })} />

              <div className="pc-acoes">
                <button type="button" className="pc-btn-danger" onClick={() => eliminar(emEdicao)}>
                  Eliminar
                </button>
                <a className="pc-btn-ghost" href={`/podcast/${emEdicao.slug}`} target="_blank" rel="noreferrer">
                  Ver página ↗
                </a>
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
      <input type={tipo} value={local} placeholder={placeholder} className="pc-input"
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}

function Area({ label, valor, onChange, linhas = 8 }: {
  label: string; valor: string; onChange: (v: string) => void; linhas?: number
}) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <textarea value={local} rows={linhas} className="pc-input pc-area"
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}

/** A capa passa pelo /api/upload-image, que já converte para WebP a 1400 px. */
function CampoCapa({ capa, onChange }: { capa: string | null; onChange: (url: string) => void }) {
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function enviar(f: File) {
    if (f.size > 5 * 1024 * 1024) { setErro('Imagem demasiado grande (máx 5 MB).'); return }
    setErro(null); setAEnviar(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form }).then(r => r.json())
      if (!res?.url) throw new Error('sem url')
      onChange(res.url)
    } catch {
      setErro('Não foi possível carregar a imagem.')
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <div className="pc-campo">
      <label className="pc-label">Capa</label>
      <div className="pc-capa">
        {capa
          ? <img src={capa} alt="" className="pc-capa-img" />
          : <span className="pc-capa-vazia">Sem capa</span>}
        <div>
          <button type="button" className="pc-btn-ghost" onClick={() => input.current?.click()} disabled={aEnviar}>
            {aEnviar ? 'A carregar…' : capa ? 'Trocar imagem' : 'Carregar imagem'}
          </button>
          <input ref={input} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) enviar(f) }} />
          <p className="pc-dica">Convertida para WebP e reduzida a 1400 px no envio.</p>
        </div>
      </div>
      {erro && <p className="pc-erro" style={{ margin: 0 }}>{erro}</p>}
    </div>
  )
}
