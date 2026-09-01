'use client'

import { useEffect, useRef, useState } from 'react'

/* ============================================================
   Ficha do convidado de um episódio, dentro do painel de edição.
   Tudo passa por /api/podcast-convidados, que só responde ao admin.
   Estes dados alimentam a página pública do episódio.
   ============================================================ */

type Convidado = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  profissao: string | null
  empresa: string | null
  bio: string | null
  notas: string | null
  foto_url: string | null
  website: string | null
  instagram: string | null
}

export default function ConvidadosEpisodio({ episodioId }: { episodioId: string }) {
  const [lista, setLista] = useState<Convidado[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [aCriar, setACriar] = useState(false)

  function carregar() {
    setLoading(true)
    fetch(`/api/podcast-convidados?episodio=${episodioId}`)
      .then(r => r.json())
      .then(j => setLista(j.convidados ?? []))
      .catch(() => setErro('Não foi possível carregar o convidado.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [episodioId])

  // Quando um potencial aceita, ele passa para aqui: a lista recarrega ao
  // ouvir o aviso, em vez de estado partilhado entre os dois componentes.
  useEffect(() => {
    function aoPromover() { carregar() }
    window.addEventListener('podcast:convidado-novo', aoPromover)
    return () => window.removeEventListener('podcast:convidado-novo', aoPromover)
  }, [episodioId])

  async function criar() {
    if (novoNome.trim().length < 2) { setErro('Escreve o nome do convidado.'); return }
    setACriar(true); setErro(null)
    try {
      const r = await fetch('/api/podcast-convidados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodio: episodioId, nome: novoNome.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error ?? 'erro')
      setLista(prev => [...prev, j.convidado])
      setNovoNome('')
    } catch {
      setErro('Não foi possível criar a ficha.')
    } finally {
      setACriar(false)
    }
  }

  async function guardar(id: string, patch: Partial<Convidado>) {
    setLista(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
    await fetch('/api/podcast-convidados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    }).catch(() => setErro('Não foi possível guardar.'))
  }

  async function apagar(c: Convidado) {
    if (!confirm(`Remover ${c.nome} deste episódio? A ficha é apagada.`)) return
    setLista(prev => prev.filter(x => x.id !== c.id))
    await fetch(`/api/podcast-convidados?id=${c.id}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div className="pc-campo">
      <label className="pc-label">Convidado</label>

      {loading && <p className="pc-dica">A carregar…</p>}
      {erro && <p className="pc-erro" style={{ margin: 0 }}>{erro}</p>}

      {lista.map(c => (
        <details key={c.id} className="pc-sub pc-dobra">
          <summary>
            <span className="pc-dobra-nome">{c.nome}</span>
            <span className="pc-dobra-meta">
              {[c.profissao, c.empresa].filter(Boolean).join(' · ') || 'Sem profissão'}
            </span>
            {/* Dentro do <summary>: sem travar o clique, o botão abria a ficha. */}
            <button
              type="button"
              className="pc-dobra-remover"
              aria-label={`Remover ${c.nome}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); apagar(c) }}>
              Remover
            </button>
          </summary>

          <div className="pc-dois">
            <Campo label="Nome" valor={c.nome} onChange={v => guardar(c.id, { nome: v })} />
            <Campo label="Profissão" valor={c.profissao ?? ''} onChange={v => guardar(c.id, { profissao: v })} />
          </div>
          <div className="pc-dois">
            <Campo label="Empresa" valor={c.empresa ?? ''} onChange={v => guardar(c.id, { empresa: v })} />
            <Campo label="Instagram" valor={c.instagram ?? ''} onChange={v => guardar(c.id, { instagram: v })} />
          </div>
          <div className="pc-dois">
            <Campo label="Email" valor={c.email ?? ''} onChange={v => guardar(c.id, { email: v })} />
            <Campo label="Telefone" valor={c.telefone ?? ''} onChange={v => guardar(c.id, { telefone: v })} />
          </div>
          <Campo label="Site" valor={c.website ?? ''} onChange={v => guardar(c.id, { website: v })} />
          <Area label="Bio (sai na página pública)" valor={c.bio ?? ''} onChange={v => guardar(c.id, { bio: v })} />
          <Area label="Notas internas" valor={c.notas ?? ''} onChange={v => guardar(c.id, { notas: v })} />
          <Foto foto={c.foto_url} onChange={url => guardar(c.id, { foto_url: url })} />
        </details>
      ))}

      {!loading && (
        <div className="pc-novo">
          <input
            className="pc-input"
            placeholder={lista.length === 0 ? 'Nome do convidado' : 'Nome de outro convidado'}
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar() } }}
          />
          <button type="button" className="pc-btn-ghost" onClick={criar} disabled={aCriar}>
            {aCriar ? 'A criar…' : '+ Adicionar'}
          </button>
        </div>
      )}
    </div>
  )
}

function Campo({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}

function Area({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <textarea className="pc-input pc-area" rows={5} value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}

/** A foto passa pelo /api/upload-image, que converte para WebP a 1400 px. */
function Foto({ foto, onChange }: { foto: string | null; onChange: (url: string) => void }) {
  const [aEnviar, setAEnviar] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function enviar(f: File) {
    setAEnviar(true)
    try {
      const form = new FormData()
      form.append('file', f)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form }).then(r => r.json())
      if (res?.url) onChange(res.url)
    } finally {
      setAEnviar(false)
    }
  }

  return (
    <div className="pc-campo">
      <label className="pc-label">Retrato</label>
      <div className="pc-capa">
        {foto
          ? <img src={foto} alt="" className="pc-capa-img" />
          : <span className="pc-capa-vazia">Sem foto</span>}
        <div>
          <button type="button" className="pc-btn-ghost" onClick={() => input.current?.click()} disabled={aEnviar}>
            {aEnviar ? 'A carregar…' : foto ? 'Trocar' : 'Carregar'}
          </button>
          <input ref={input} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) enviar(f) }} />
        </div>
      </div>
    </div>
  )
}
