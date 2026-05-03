'use client'
import { useRef, useState } from 'react'

interface Props {
  url: string
  isEditing: boolean
  onChange: (url: string) => void
}

export default function HeroUploadBlock({ url, isEditing, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) onChange(data.url)
    } catch {}
    setUploading(false)
  }

  return (
    <>
      {url && (
        <div className="w-full shrink-0 overflow-hidden" style={{ height: 320 }}>
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
            }}
          />
        </div>
      )}

      {isEditing && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 pt-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
          <div className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <span className="text-[11px] tracking-[0.4em] text-white/25 uppercase shrink-0">🖼 Foto cabeçalho</span>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-1 text-left text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
            >
              {uploading ? '⏳ A carregar...' : url ? '✓ Trocar foto' : '⬆ Carregar foto'}
            </button>
            {url && !uploading && (
              <button
                onClick={() => onChange('')}
                className="text-white/20 hover:text-white/50 text-sm transition-colors shrink-0"
              >
                ✕ Remover
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
