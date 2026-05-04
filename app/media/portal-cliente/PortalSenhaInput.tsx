'use client'
import { useState } from 'react'

interface Props {
  portalRef: string
  senhaInicial?: string
}

export default function PortalSenhaInput({ portalRef, senhaInicial }: Props) {
  const [senha, setSenha]       = useState(senhaInicial ?? '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [editing, setEditing]   = useState(false)

  const temSenha = !!senhaInicial

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${portalRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senha.trim() || null }),
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await fetch(`/api/media-portal/${portalRef}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: null }),
      })
      setSenha('')
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!editing ? (
        <>
          {/* Status badge */}
          <div className="flex items-center gap-1.5">
            {temSenha || senha ? (
              <>
                <span className="text-[9px] text-amber-400/60">🔒</span>
                <span className="text-[8px] tracking-[0.25em] text-amber-400/50 uppercase">Senha activa</span>
              </>
            ) : (
              <>
                <span className="text-[9px] text-white/20">🔓</span>
                <span className="text-[8px] tracking-[0.25em] text-white/20 uppercase">Acesso livre</span>
              </>
            )}
          </div>

          {saved && (
            <span className="text-[8px] tracking-[0.25em] text-emerald-400/60 uppercase">✓ Guardado</span>
          )}

          <button
            onClick={() => setEditing(true)}
            className="text-[8px] tracking-[0.3em] text-white/20 hover:text-white/50 uppercase transition-colors border border-white/[0.06] hover:border-white/20 px-2 py-1"
          >
            {temSenha || senha ? 'Alterar' : 'Definir senha'}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 border border-white/[0.08] bg-black/20 px-2">
            <span className="text-white/20 text-[10px]">🔑</span>
            <input
              type="text"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
              placeholder="Senha..."
              autoFocus
              className="bg-transparent py-1.5 text-[10px] tracking-[0.15em] text-white/60 placeholder:text-white/15 focus:outline-none w-28"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[8px] tracking-[0.3em] text-emerald-400/60 hover:text-emerald-400 uppercase transition-colors border border-emerald-400/20 hover:border-emerald-400/50 px-2 py-1.5 disabled:opacity-40"
          >
            {saving ? '...' : 'Guardar'}
          </button>

          {(temSenha || senha) && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="text-[8px] tracking-[0.3em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors border border-red-400/10 hover:border-red-400/30 px-2 py-1.5 disabled:opacity-40"
            >
              Remover
            </button>
          )}

          <button
            onClick={() => { setEditing(false); setSenha(senhaInicial ?? '') }}
            className="text-[8px] tracking-[0.3em] text-white/20 hover:text-white/45 uppercase transition-colors"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  )
}
