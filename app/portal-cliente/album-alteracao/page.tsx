'use client'

import { Suspense, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const TIPOS = [
  'Trocar fotografias',
  'Alterar ordem',
  'Remover fotografias',
  'Ajustar cores',
  'Outro',
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-black/10 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.07]">
      <span className="text-[9px] font-mono text-black/25 tracking-widest">{number}</span>
      <div className="w-px h-3 bg-black/15" />
      <span className="text-[9px] tracking-[0.4em] text-black/40 uppercase">{label}</span>
    </div>
  )
}

function Content() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''

  const [paginas, setPaginas] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleTipo(t: string) {
    setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFoto(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setFotoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFotoPreview(null)
    }
  }

  function removeFoto() {
    setFoto(null)
    setFotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ref) { setError('Referência em falta.'); return }
    if (tipos.length === 0) { setError('Selecione pelo menos um tipo de alteração.'); return }

    setLoading(true)
    setError(null)

    try {
      let foto_url: string | null = null
      if (foto) {
        const fd = new FormData()
        fd.append('file', foto)
        const upRes = await fetch('/api/upload-image', { method: 'POST', body: fd })
        const upJson = await upRes.json()
        if (!upRes.ok) throw new Error(upJson.error ?? 'Erro ao carregar foto')
        foto_url = upJson.url
      }

      const res = await fetch('/api/album-alteracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_evento: ref, paginas_alterar: paginas, tipos_alteracao: tipos, observacoes, foto_url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-black/10" />
        <p className="text-[9px] tracking-[0.5em] text-black/30 uppercase">RL PHOTO.VIDEO</p>
        <Card className="w-full max-w-sm px-8 py-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border border-black/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-light tracking-[0.3em] text-black uppercase">Pedido Enviado</h1>
          <p className="text-xs text-black/40 leading-relaxed text-center">
            O seu pedido foi registado. A nossa equipa irá iniciar as alterações em breve.
          </p>
          {ref && <p className="text-[9px] text-black/20 tracking-widest font-mono mt-1">{ref}</p>}
        </Card>
        <div className="w-px h-16 bg-gradient-to-b from-black/10 to-transparent" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-5 py-14">

      {/* Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center gap-3 mb-10">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-black/15" />
        <p className="text-[9px] tracking-[0.5em] text-black/30 uppercase">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-[0.3em] text-black uppercase">Fazer Alteração</h1>
        <p className="text-[10px] text-black/35 tracking-wider">
          Descreva as alterações ao seu álbum
        </p>
        {ref && (
          <span className="text-[9px] text-black/25 font-mono tracking-widest border border-black/10 px-3 py-1">
            {ref}
          </span>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">

        {/* Card 1 — Páginas */}
        <Card>
          <SectionLabel number="01" label="Páginas a Alterar" />
          <div className="px-5 py-4">
            <input
              type="text"
              value={paginas}
              onChange={e => setPaginas(e.target.value)}
              placeholder="ex: páginas 3, 7, 12–15"
              className="w-full bg-transparent text-sm text-black/70 placeholder:text-black/20 focus:outline-none border-b border-black/10 focus:border-black/30 pb-2 transition-colors"
            />
          </div>
        </Card>

        {/* Card 2 — Tipo */}
        <Card>
          <SectionLabel number="02" label="Tipo de Alteração" />
          <div className="px-5 py-4 flex flex-col gap-2">
            {TIPOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTipo(t)}
                className={`flex items-center gap-3 px-4 py-3 border transition-all text-left ${
                  tipos.includes(t)
                    ? 'border-black/25 bg-black/[0.04]'
                    : 'border-black/[0.08] hover:border-black/15'
                }`}
              >
                <span className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all ${
                  tipos.includes(t) ? 'border-black/40 bg-black/[0.06]' : 'border-black/15'
                }`}>
                  {tipos.includes(t) && (
                    <svg className="w-2.5 h-2.5 text-black/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={`text-xs tracking-wide transition-colors ${tipos.includes(t) ? 'text-black/80' : 'text-black/35'}`}>
                  {t}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Card 3 — Observações */}
        <Card>
          <SectionLabel number="03" label="Observações Adicionais" />
          <div className="px-5 py-4">
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Descreva em detalhe as alterações pretendidas..."
              rows={4}
              className="w-full bg-transparent text-sm text-black/70 placeholder:text-black/20 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </Card>

        {/* Card 4 — Foto */}
        <Card>
          <SectionLabel number="04" label="Foto de Referência · Opcional" />
          <div className="px-5 py-4">
            {fotoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Pré-visualização"
                  className="w-full max-h-56 object-cover border border-black/10"
                />
                <button
                  type="button"
                  onClick={removeFoto}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 border border-black/15 text-black/50 hover:text-black/80 flex items-center justify-center text-xs transition-colors"
                >
                  ✕
                </button>
                <p className="text-[9px] text-black/25 mt-2 truncate font-mono">{foto?.name}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-black/12 py-8 flex flex-col items-center gap-2 hover:border-black/25 hover:bg-black/[0.02] transition-all group"
              >
                <svg className="w-5 h-5 text-black/20 group-hover:text-black/35 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[9px] tracking-[0.35em] uppercase text-black/25 group-hover:text-black/40 transition-colors">Adicionar Foto</p>
                <p className="text-[8px] text-black/18">JPG, PNG ou HEIC · máx. 10MB</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
          </div>
        </Card>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-500/70 tracking-wide text-center px-2">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-black/20 bg-black text-white text-[10px] tracking-[0.4em] uppercase py-4 hover:bg-black/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'A enviar...' : 'Enviar Pedido de Alteração'}
        </button>

      </form>

      <div className="w-px h-12 bg-gradient-to-b from-black/10 to-transparent mt-12" />
    </main>
  )
}

export default function AlbumAlteracaoPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  )
}
