'use client'

import { useState } from 'react'

// Maquetes mestre da Proposta Criativa (as mesmas que /crm/portais e o sync-template usam)
const MAQUETES = [
  { label: 'Casamento', href: '/r/85343645-b0d3-4412-ae78-795fd7f8ddf1/proposta' },
  { label: 'Batizado',  href: '/b/batizado-maquete/proposta' },
]

// Botão do cabeçalho do CRM: abrir a maquete da Proposta Criativa de casamento ou batizado.
export default function PropostaPicker() {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="relative">
      <button type="button" onClick={() => setAberto(a => !a)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold tracking-[0.2em] uppercase border border-gold/40 text-gold bg-black/40 backdrop-blur hover:bg-gold/10 hover:border-gold/70 transition-colors">
        Proposta Criativa
        <span className={`text-[9px] transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-56 z-30 rounded-xl p-2 flex flex-col"
          style={{ background: '#14110c', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
          {MAQUETES.map(m => (
            <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-white/75 hover:text-gold hover:bg-white/[0.04] transition-colors">
              Maquete {m.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
