'use client'
import { useState } from 'react'

interface Props {
  isEditing: boolean
  saving: boolean
  onToggle: () => void
  onSave: () => void
  onCancel: () => void
  isMaster?: boolean
}

// Botões de edição do admin no canto do portal (só aparecem com sessão de admin)
export default function AdminBar({ isEditing, saving, onToggle, onSave, onCancel, isMaster }: Props) {
  const [publishing, setPublishing] = useState(false)
  const [published,  setPublished]  = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    try {
      // 1. Guardar primeiro
      await onSave()
      // 2. Sincronizar para todos
      const res = await fetch('/api/media-portal/sync-template', { method: 'POST' })
      const data = await res.json()
      if (data.ok) { setPublished(true); setTimeout(() => setPublished(false), 3000) }
    } catch {}
    setPublishing(false)
  }

  const base = 'rlp-m rounded-full px-4 py-2.5 text-[10px] transition-colors disabled:opacity-40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]'

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-wrap justify-end items-center gap-2 print:hidden">
      {isEditing ? (
        <>
          <button onClick={onCancel} className={`${base} border border-white/20 bg-[#00141f] text-white/70 hover:text-white hover:border-white/40`}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving} className={`${base} bg-[#2e6cf6] hover:bg-[#3d79ff] text-white`}>
            {saving ? 'A guardar…' : '✓ Guardar'}
          </button>
          {/* Publicar: só na maquete mestre, sincroniza para todos os portais */}
          {isMaster && (
            <button onClick={handlePublish} disabled={publishing} className={`${base} border border-[#a9c1ff]/60 bg-[#00141f] text-[#a9c1ff] hover:border-[#a9c1ff]`}>
              {published ? '✓ Publicado' : publishing ? 'A publicar…' : 'Publicar em todos'}
            </button>
          )}
        </>
      ) : (
        <>
          {isMaster && (
            <span className="rlp-m rounded-full border border-[#a9c1ff]/40 bg-[#00141f] px-3 py-2 text-[9px] text-[#a9c1ff]">Maquete mestre</span>
          )}
          <button onClick={onToggle} className={`${base} flex items-center gap-2 border border-white/15 bg-[#00141f] text-white/70 hover:text-white hover:border-[#2e6cf6]`}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </>
      )}
    </div>
  )
}
