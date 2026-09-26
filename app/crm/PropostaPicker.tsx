'use client'

import { useState } from 'react'
import type { Contact } from './CrmBoard'

// Botão do cabeçalho do CRM: escolher os noivos e abrir a Proposta Criativa deles.
export default function PropostaPicker({ contacts }: { contacts: Contact[] }) {
  const [aberto, setAberto] = useState(false)
  const [q, setQ] = useState('')

  const termo = q.trim().toLowerCase()
  const lista = contacts
    .filter(c => c.page_token && (!termo || (c.nome ?? '').toLowerCase().includes(termo)))
    .slice(0, 40)

  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto(a => !a)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold tracking-[0.2em] uppercase border border-gold/40 text-gold bg-black/40 backdrop-blur hover:bg-gold/10 hover:border-gold/70 transition-colors">
        Proposta Criativa
        <span className={`text-[9px] transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-72 z-30 rounded-xl p-3 flex flex-col gap-2"
          style={{ background: '#14110c', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar noivos…"
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-gold/60" />
          <div className="max-h-72 overflow-y-auto flex flex-col">
            {lista.length === 0 && <p className="text-xs text-white/30 px-2 py-3">Sem leads com proposta</p>}
            {lista.map(c => (
              <a key={c.id} href={`/${c.page_tipo === 'batizado' ? 'b' : 'r'}/${c.page_token}/proposta`}
                target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}
                className="px-2 py-2 rounded-lg text-sm text-white/75 hover:text-gold hover:bg-white/[0.04] transition-colors truncate">
                {c.nome || 'Sem nome'}
                {c.page_tipo === 'batizado' && <span className="ml-2 text-[9px] tracking-widest uppercase text-white/30">Batizado</span>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
