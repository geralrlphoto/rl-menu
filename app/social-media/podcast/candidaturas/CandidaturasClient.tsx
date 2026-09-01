'use client'

import { useEffect, useState } from 'react'
import { ETIQUETAS_AREA, type AreaCandidatura } from '@/lib/podcast/tipos'

/* ============================================================
   Candidaturas a convidado, com mudança de estado.
   Lê e escreve em /api/podcast-candidaturas, só admin.
   ============================================================ */

const ESTADOS = ['nova', 'contactada', 'agendada', 'recusada'] as const
type Estado = typeof ESTADOS[number]

type Candidatura = {
  id: string
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  area: AreaCandidatura
  zona: string | null
  porque_tema: string | null
  links: string | null
  estado: Estado
  created_at: string
}

export default function CandidaturasClient() {
  const [linhas, setLinhas] = useState<Candidatura[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todas' | Estado>('todas')

  useEffect(() => {
    fetch('/api/podcast-candidaturas')
      .then(r => r.json())
      .then(j => setLinhas(j.candidaturas ?? []))
      .catch(() => setErro('Não foi possível carregar as candidaturas.'))
      .finally(() => setLoading(false))
  }, [])

  async function mudarEstado(id: string, estado: Estado) {
    setLinhas(prev => prev.map(c => (c.id === id ? { ...c, estado } : c)))
    await fetch('/api/podcast-candidaturas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    }).catch(() => setErro('Não foi possível guardar o estado.'))
  }

  if (loading) return <p className="pc-info">A carregar candidaturas…</p>
  if (erro) return <p className="pc-erro">{erro}</p>

  const visiveis = filtro === 'todas' ? linhas : linhas.filter(c => c.estado === filtro)

  return (
    <>
      <div className="pc-bar">
        <p className="pc-count">
          {linhas.length === 0 ? 'Sem candidaturas' : `${visiveis.length} de ${linhas.length}`}
        </p>
        <div className="pc-estados">
          {(['todas', ...ESTADOS] as const).map(e => (
            <button key={e} type="button"
              className={`pc-estado ${filtro === e ? 'is-on' : ''}`}
              onClick={() => setFiltro(e)}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <section className="pc-empty">
          <p className="pc-empty-title">Nada por aqui</p>
          <p className="pc-empty-desc">
            As candidaturas enviadas em /podcast/convidados aparecem nesta lista.
          </p>
        </section>
      ) : (
        <div className="pc-tabela-envolve">
          <table className="pc-tabela">
            <thead>
              <tr>
                <th>Quem</th>
                <th>Área</th>
                <th>Tema</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ color: 'var(--ink)' }}>{c.nome}</strong><br />
                    <a href={`mailto:${c.email}`} style={{ color: 'var(--gold-soft)' }}>{c.email}</a>
                    {c.telefone && <><br />{c.telefone}</>}
                    {c.empresa && <><br /><span style={{ color: 'var(--ink-4)' }}>{c.empresa}</span></>}
                    {c.links && (
                      <><br /><a href={c.links.startsWith('http') ? c.links : `https://${c.links}`}
                        target="_blank" rel="noreferrer" style={{ color: 'var(--gold-soft)' }}>links ↗</a></>
                    )}
                  </td>
                  <td>
                    {ETIQUETAS_AREA[c.area] ?? c.area}
                    {c.zona && <><br /><span style={{ color: 'var(--ink-4)' }}>{c.zona}</span></>}
                    <br />
                    <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>
                      {new Date(c.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </td>
                  <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>{c.porque_tema}</td>
                  <td>
                    <div className="pc-estados">
                      {ESTADOS.map(e => (
                        <button key={e} type="button"
                          className={`pc-estado ${c.estado === e ? 'is-on' : ''}`}
                          onClick={() => mudarEstado(c.id, e)}>
                          {e}
                        </button>
                      ))}
                    </div>
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
