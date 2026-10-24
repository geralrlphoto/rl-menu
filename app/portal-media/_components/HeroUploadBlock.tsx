'use client'
import { useRef, useState } from 'react'

interface Props {
  url: string
  isEditing: boolean
  onChange: (url: string) => void
}

// Foto do topo das páginas do portal (o admin pode trocar). Sem foto, uma faixa
// com o logótipo da RL PROD sobre o fundo do portal.
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
      <div className="w-full shrink-0 overflow-hidden" style={{ height: url ? 260 : 96 }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover object-center"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)',
            }} />
        ) : (
          <div className="w-full h-full flex items-end justify-center pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="" className="w-9 h-9 object-contain opacity-25" />
          </div>
        )}
      </div>

      {isEditing && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 pt-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-4 py-3">
            <span className="rlp-m shrink-0 text-[9.5px] text-[#5a8bff]">Foto do topo</span>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex-1 text-left text-[14px] text-white/70 hover:text-white transition-colors disabled:opacity-40">
              {uploading ? 'A carregar…' : url ? 'Trocar foto' : 'Carregar foto'}
            </button>
            {url && !uploading && (
              <button onClick={() => onChange('')} className="shrink-0 text-[13px] text-white/45 hover:text-[#ff4747] transition-colors">
                Remover
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
