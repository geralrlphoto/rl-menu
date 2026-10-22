'use client'
import { useState } from 'react'

/** Copia o link completo do formulário para mandar aos noivos */
export default function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button type="button" className="pill" style={{ cursor: 'pointer', background: 'transparent' }}
      onClick={() => navigator.clipboard.writeText(url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }).catch(() => window.prompt('Copiar link:', url))}>
      {copiado ? 'Copiado ✓' : 'Copiar link'}
    </button>
  )
}
