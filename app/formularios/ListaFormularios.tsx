'use client'

import { useState } from 'react'

type Evento = { id: string; nome: string; data: string }
type Link_ = { rotulo: string; href: string }
type Formulario = {
  nome: string
  quando: string
  abrir: Link_[] | ((eventoId: string) => Link_[])  // função: precisa do casamento escolhido
  respostas?: Link_ | ((eventoId: string) => Link_)
}

const FORMULARIOS: Formulario[] = [
  {
    nome: 'Dados para Contrato CPS',
    quando: 'Depois de fecharem, para fazer o contrato',
    abrir: [{ rotulo: 'Casamento', href: '/contrato-cps/casamento' }, { rotulo: 'Batizado', href: '/contrato-cps/batizado' }],
    respostas: { rotulo: 'Ver respostas', href: '/contrato-cps' },
  },
  {
    nome: 'Registo de Pagamento',
    quando: 'Sempre que fazem um pagamento',
    abrir: [{ rotulo: 'Abrir', href: 'https://tally.so/r/A72PQB' }],
    respostas: { rotulo: 'Ver pagamentos', href: '/financas' },
  },
  {
    nome: 'Marcação do Pré-Wedding',
    quando: '30 dias antes do casamento',
    abrir: id => [{ rotulo: 'Abrir', href: `/prewedding/${id}` }],
    respostas: id => ({ rotulo: 'Ver na ficha', href: `/eventos-2026/${id}` }),
  },
  {
    nome: 'Briefing pré-casamento e reunião de preparação',
    quando: '15 dias antes do casamento',
    abrir: id => [{ rotulo: 'Abrir', href: `/preparacao/${id}` }],
    respostas: id => ({ rotulo: 'Ver na ficha', href: `/eventos-2026/${id}` }),
  },
  {
    nome: 'Seleção de Fotografias',
    quando: 'Depois do casamento, com as fotos para seleção',
    abrir: [{ rotulo: 'Casamento', href: '/form-selecao-fotos/casamento' }, { rotulo: 'Batizado', href: '/form-selecao-fotos/batizado' }],
    respostas: { rotulo: 'Ver seleções', href: '/fotos-selecao' },
  },
  {
    nome: 'Satisfação',
    quando: 'No fim, depois das entregas',
    abrir: [{ rotulo: 'Abrir', href: 'https://tally.so/r/pbKJry' }],
  },
]

const fmtData = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

export default function ListaFormularios({ eventos }: { eventos: Evento[] }) {
  const [eventoId, setEventoId] = useState('')

  return (
    <div>
      {/* Casamento para os formulários que são de cada casal */}
      <label className="flabel" style={{ display: 'block', marginBottom: '8px' }}>Casamento (para os formulários de cada casal)</label>
      <select value={eventoId} onChange={e => setEventoId(e.target.value)} className="finput"
        style={{ width: '100%', maxWidth: '420px', marginBottom: '36px', background: 'var(--ink-3)', color: 'inherit' }}>
        <option value="">Escolher casamento…</option>
        {eventos.map(e => <option key={e.id} value={e.id}>{fmtData(e.data)} · {e.nome}</option>)}
      </select>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {FORMULARIOS.map((f, i) => {
          const precisaEvento = typeof f.abrir === 'function'
          const abrir = typeof f.abrir === 'function' ? (eventoId ? f.abrir(eventoId) : []) : f.abrir
          const resp = typeof f.respostas === 'function' ? (eventoId ? f.respostas(eventoId) : null) : f.respostas
          return (
            <div key={f.nome} className="pilar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
              <span style={{ fontFamily: 'var(--fs, serif)', color: 'var(--g)', fontSize: '22px', width: '32px' }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <p style={{ fontSize: '18px', margin: 0 }}>{f.nome}</p>
                <p className="meta" style={{ marginTop: '6px' }}>{f.quando}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {precisaEvento && !eventoId && <span className="hint">Escolhe um casamento acima</span>}
                {abrir.map(l => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="pill"
                    style={{ borderColor: 'var(--g)', color: 'var(--g)' }}>
                    {l.rotulo} ↗
                  </a>
                ))}
                {resp && <a href={resp.href} className="pill">{resp.rotulo}</a>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
