'use client'

import { useEffect, useState } from 'react'

// Interruptor global do envio automático de fotografias digitais.
// Lê/escreve /api/envio-auto-config. Reutilizável em qualquer página admin.
export default function EnvioAutoToggle() {
  const [ativo, setAtivo] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/envio-auto-config').then(r => r.json()).then(d => setAtivo(!!d.ativo)).catch(() => {})
  }, [])

  async function toggle() {
    if (ativo === null) return
    setSaving(true)
    try {
      const d = await fetch('/api/envio-auto-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      }).then(r => r.json())
      if (d.ok) setAtivo(!!d.ativo)
    } catch {}
    setSaving(false)
  }

  if (ativo === null) return null

  return (
    <button onClick={toggle} disabled={saving}
      title="Liga/desliga o envio automático das fotografias digitais"
      className={`inline-flex items-center gap-2 text-[11px] tracking-widest uppercase px-4 py-2 rounded-full border transition-all disabled:opacity-50 ${ativo ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15' : 'border-white/15 text-white/50 bg-white/[0.03] hover:border-white/30'}`}>
      <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-emerald-400' : 'bg-white/30'}`} />
      {saving ? '...' : `Envio automático: ${ativo ? 'Ligado' : 'Desligado'}`}
    </button>
  )
}
