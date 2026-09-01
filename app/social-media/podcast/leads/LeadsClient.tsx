'use client'

import { useEffect, useMemo, useState } from 'react'

/* ============================================================
   Leads do podcast, com filtro pelo episódio de origem.
   É isto que responde à pergunta que interessa: que episódios
   trazem trabalho.
   ============================================================ */

type Lead = {
  id: string
  nome: string
  email: string
  telefone: string | null
  data_casamento: string | null
  local: string | null
  servico_interesse: string | null
  origem_episodio_id: string | null
  created_at: string
  episodio?: { numero: number; titulo: string } | null
}

export default function LeadsClient() {
  const [linhas, setLinhas] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [origem, setOrigem] = useState<string>('todos')

  useEffect(() => {
    fetch('/api/podcast-leads')
      .then(r => r.json())
      .then(j => setLinhas(j.leads ?? []))
      .catch(() => setErro('Não foi possível carregar os leads.'))
      .finally(() => setLoading(false))
  }, [])

  const origens = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const l of linhas) {
      if (l.origem_episodio_id && l.episodio) {
        mapa.set(l.origem_episodio_id, `${String(l.episodio.numero).padStart(2, '0')} — ${l.episodio.titulo}`)
      }
    }
    return [...mapa.entries()]
  }, [linhas])

  if (loading) return <p className="pc-info">A carregar leads…</p>
  if (erro) return <p className="pc-erro">{erro}</p>

  const visiveis = origem === 'todos'
    ? linhas
    : origem === 'sem-origem'
      ? linhas.filter(l => !l.origem_episodio_id)
      : linhas.filter(l => l.origem_episodio_id === origem)

  return (
    <>
      <div className="pc-bar">
        <p className="pc-count">
          {linhas.length === 0 ? 'Sem leads' : `${visiveis.length} de ${linhas.length}`}
        </p>
        {linhas.length > 0 && (
          <div className="pc-campo" style={{ minWidth: 260 }}>
            <label className="pc-label" htmlFor="origem">Episódio de origem</label>
            <select id="origem" className="pc-input" value={origem} onChange={e => setOrigem(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="sem-origem">Página principal do podcast</option>
              {origens.map(([id, etiqueta]) => (
                <option key={id} value={id}>{etiqueta}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {visiveis.length === 0 ? (
        <section className="pc-empty">
          <p className="pc-empty-title">Nada por aqui</p>
          <p className="pc-empty-desc">
            Os contactos deixados nos formulários do podcast aparecem nesta lista.
          </p>
        </section>
      ) : (
        <div className="pc-tabela-envolve">
          <table className="pc-tabela">
            <thead>
              <tr>
                <th>Quem</th>
                <th>Casamento</th>
                <th>Interesse</th>
                <th>Veio de</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(l => (
                <tr key={l.id}>
                  <td>
                    <strong style={{ color: 'var(--ink)' }}>{l.nome}</strong><br />
                    <a href={`mailto:${l.email}`} style={{ color: 'var(--gold-soft)' }}>{l.email}</a>
                    {l.telefone && <><br />{l.telefone}</>}
                  </td>
                  <td>
                    {l.data_casamento ? new Date(l.data_casamento).toLocaleDateString('pt-PT') : '—'}
                    {l.local && <><br /><span style={{ color: 'var(--ink-4)' }}>{l.local}</span></>}
                  </td>
                  <td>{l.servico_interesse ?? '—'}</td>
                  <td>
                    {l.episodio
                      ? `${String(l.episodio.numero).padStart(2, '0')} — ${l.episodio.titulo}`
                      : 'Página principal'}
                    <br />
                    <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>
                      {new Date(l.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
