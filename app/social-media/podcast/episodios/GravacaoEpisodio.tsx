'use client'

import { useEffect, useState } from 'react'

/* ============================================================
   Marcação da gravação: data, hora e local.

   Não confundir com a data de publicação, que já existia e é o dia em
   que o episódio sai. Estes três são o dia em que se grava.
   ============================================================ */

type Gravacao = {
  gravacao_data: string | null
  gravacao_hora: string | null
  gravacao_local: string | null
}

export default function GravacaoEpisodio({ episodioId }: { episodioId: string }) {
  const [dados, setDados] = useState<Gravacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    fetch('/api/podcast-episodios')
      .then(r => r.json())
      .then(j => {
        if (cancelado) return
        const ep = (j.episodios ?? []).find((e: any) => e.id === episodioId)
        setDados({
          gravacao_data: ep?.gravacao_data ?? null,
          gravacao_hora: ep?.gravacao_hora ?? null,
          gravacao_local: ep?.gravacao_local ?? null,
        })
      })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar a marcação.') })
    return () => { cancelado = true }
  }, [episodioId])

  async function guardar(patch: Partial<Gravacao>) {
    setDados(prev => ({ ...(prev ?? { gravacao_data: null, gravacao_hora: null, gravacao_local: null }), ...patch }))
    await fetch('/api/podcast-episodios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: episodioId, ...patch }),
    }).catch(() => setErro('Não foi possível guardar.'))
  }

  if (!dados) return <p className="pc-dica">A carregar a marcação…</p>

  return (
    <div className="pc-campo">
      <label className="pc-label">Gravação</label>
      {erro && <p className="pc-erro" style={{ margin: 0 }}>{erro}</p>}

      <div className="pc-sub">
        <div className="pc-dois">
          <Campo label="Data" tipo="date" valor={dados.gravacao_data ?? ''}
            onChange={v => guardar({ gravacao_data: v || null })} />
          <Campo label="Hora" tipo="time" valor={dados.gravacao_hora ?? ''}
            onChange={v => guardar({ gravacao_hora: v || null })} />
        </div>
        <Campo label="Local" valor={dados.gravacao_local ?? ''}
          marcador="Estúdio, quinta, atelier…"
          onChange={v => guardar({ gravacao_local: v || null })} />
      </div>
    </div>
  )
}

function Campo({ label, valor, onChange, tipo = 'text', marcador }: {
  label: string; valor: string; onChange: (v: string) => void; tipo?: string; marcador?: string
}) {
  const [local, setLocal] = useState(valor)
  useEffect(() => { setLocal(valor) }, [valor])
  return (
    <div className="pc-campo">
      <label className="pc-label">{label}</label>
      <input className="pc-input" type={tipo} value={local} placeholder={marcador}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== valor) onChange(local) }} />
    </div>
  )
}
