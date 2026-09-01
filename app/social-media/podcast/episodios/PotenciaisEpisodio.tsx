'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Potenciais convidados de um episódio.
   A lista de quem queres abordar para aquele tema, com o estado de
   cada abordagem. Não confundir com as candidaturas, que são de quem
   se propõe sozinho pelo formulário público.
   ============================================================ */

const ESTADOS = ['a contactar', 'contactado', 'aceitou', 'recusou'] as const
type Estado = typeof ESTADOS[number]

type Potencial = {
  id: string
  nome: string
  email: string | null
  contacto: string | null
  instagram: string | null
  empresa: string | null
  notas: string | null
  estado: Estado
}

export default function PotenciaisEpisodio({ episodioId }: { episodioId: string }) {
  const [lista, setLista] = useState<Potencial[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [novo, setNovo] = useState('')
  const [aCriar, setACriar] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/podcast-potenciais?episodio=${episodioId}`)
      .then(r => r.json())
      .then(j => setLista(j.potenciais ?? []))
      .catch(() => setErro('Não foi possível carregar a lista.'))
      .finally(() => setLoading(false))
  }, [episodioId])

  async function criar() {
    if (novo.trim().length < 2) { setErro('Escreve o nome.'); return }
    setACriar(true); setErro(null)
    try {
      const r = await fetch('/api/podcast-potenciais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodio: episodioId, nome: novo.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error ?? 'erro')
      setLista(prev => [...prev, j.potencial])
      setNovo('')
    } catch {
      setErro('Não foi possível acrescentar.')
    } finally {
      setACriar(false)
    }
  }

  async function guardar(id: string, patch: Partial<Potencial>) {
    setLista(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
    await fetch('/api/podcast-potenciais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    }).catch(() => setErro('Não foi possível guardar.'))
  }

  async function apagar(p: Potencial) {
    if (!confirm(`Remover ${p.nome} da lista?`)) return
    setLista(prev => prev.filter(x => x.id !== p.id))
    await fetch(`/api/podcast-potenciais?id=${p.id}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div className="pc-campo">
      <label className="pc-label">Potenciais convidados</label>
      <p className="pc-dica">Quem queres abordar para este tema. Não aparece em lado nenhum público.</p>

      {loading && <p className="pc-dica">A carregar…</p>}
      {erro && <p className="pc-erro" style={{ margin: 0 }}>{erro}</p>}

      {lista.map(p => (
        <div key={p.id} className="pc-sub">
          <div className="pc-dois">
            <Campo label="Nome" valor={p.nome} onChange={v => guardar(p.id, { nome: v })} />
            <Campo label="Empresa" valor={p.empresa ?? ''} onChange={v => guardar(p.id, { empresa: v })} />
          </div>
          <div className="pc-dois">
            <Campo label="Email" valor={p.email ?? ''} onChange={v => guardar(p.id, { email: v })} />
            <Campo label="Contacto" valor={p.contacto ?? ''} marcador="Telefone"
              onChange={v => guardar(p.id, { contacto: v })} />
          </div>
          <Campo label="Instagram" valor={p.instagram ?? ''} marcador="@ ou endereço"
            onChange={v => guardar(p.id, { instagram: v })} />
          <Area label="Notas" valor={p.notas ?? ''} onChange={v => guardar(p.id, { notas: v })} />

          <div className="pc-campo">
            <label className="pc-label">Estado</label>
            <div className="pc-estados">
              {ESTADOS.map(e => (
                <button key={e} type="button"
                  className={`pc-estado ${p.estado === e ? 'is-on' : ''}`}
                  onClick={() => guardar(p.id, { estado: e })}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="button" className="pc-mini" onClick={() => apagar(p)}>Remover</button>
          </div>
        </div>
      ))}

      {!loading && (
        <div className="pc-novo">
          <input
            className="pc-input"
            placeholder="Nome de quem queres convidar"
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); criar() } }}
          />
          <button type="button" className="pc-btn-ghost" onClick={criar} disabled={aCriar}>
            {aCriar ? 'A juntar…' : '+ Juntar'}
          </button>
        </div>
      )}
    </div>
  )
}

function Campo({ label, valor, onChange, marcador }: {
  label: string; valor: string; onChange: (v: string) => void; marcador?: string
}) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <input className="pc-input" value={local} placeholder={marcador}
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
      <textarea className="pc-input pc-area" rows={3} value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}
