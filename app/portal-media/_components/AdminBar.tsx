'use client'
import { useState } from 'react'

interface Props {
  isEditing: boolean
  saving: boolean
  onToggle: () => void
  onSave: () => void
  onCancel: () => void
}

export default function AdminBar({ isEditing, saving, onToggle, onSave, onCancel }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {isEditing ? (
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-white/15 bg-[#050507] text-white/40 hover:text-white/60 text-sm tracking-[0.3em] uppercase transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 border border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20
                       text-emerald-400/80 hover:text-emerald-400 text-sm tracking-[0.3em] uppercase
                       transition-all disabled:opacity-40"
          >
            {saving ? 'A guardar...' : '✓ Guardar'}
          </button>
        </>
      ) : (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-[#050507]/90
                     hover:border-white/25 backdrop-blur-sm text-white/30 hover:text-white/60
                     text-sm tracking-[0.3em] uppercase transition-all"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Admin
        </button>
      )}
    </div>
  )
}
