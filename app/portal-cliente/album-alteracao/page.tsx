'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const TIPOS = [
  'Trocar fotografias',
  'Alterar ordem',
  'Remover fotografias',
  'Ajustar cores',
  'Outro',
]

function Content() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''

  const [paginas, setPaginas] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTipo(t: string) {
    setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ref) { setError('Referência em falta.'); return }
    if (tipos.length === 0) { setError('Selecione pelo menos um tipo de alteração.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/album-alteracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_evento: ref, paginas_alterar: paginas, tipos_alteracao: tipos, observacoes }),
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
      <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-0.5 h-12 bg-white/20 mb-2" />
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase">RL PHOTO.VIDEO</p>
        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-light tracking-[0.3em] text-white uppercase">Pedido Enviado</h1>
        <p className="text-sm text-white/40 max-w-sm leading-relaxed">
          O seu pedido de alteração foi registado. A nossa equipa irá iniciar as alterações em breve.
        </p>
        {ref && <p className="text-[10px] text-white/20 tracking-widest font-mono">{ref}</p>}
        <div className="w-0.5 h-12 bg-white/20 mt-2" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center px-6 py-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <div className="w-0.5 h-10 bg-white/20" />
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl font-light tracking-[0.3em] text-white uppercase">Fazer Alteração</h1>
        <p className="text-xs text-white/30 max-w-xs leading-relaxed">
          Descreva as alterações que pretende realizar ao seu álbum.
        </p>
        {ref && <p className="text-[10px] text-white/20 tracking-widest font-mono">{ref}</p>}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-8">

        {/* 1. Páginas */}
        <div className="flex flex-col gap-3">
          <label className="text-[9px] tracking-[0.4em] text-white/30 uppercase">
            Páginas a Alterar
          </label>
          <input
            type="text"
            value={paginas}
            onChange={e => setPaginas(e.target.value)}
            placeholder="ex: páginas 3, 7, 12–15"
            className="bg-transparent border border-white/10 rounded-none px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* 2. Tipo de alteração */}
        <div className="flex flex-col gap-3">
          <label className="text-[9px] tracking-[0.4em] text-white/30 uppercase">
            Tipo de Alteração <span className="text-white/20">(selecione todos os que se aplicam)</span>
          </label>
          <div className="flex flex-col gap-2">
            {TIPOS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTipo(t)}
                className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${
                  tipos.includes(t)
                    ? 'border-white/40 bg-white/[0.06] text-white'
                    : 'border-white/[0.08] bg-transparent text-white/35 hover:border-white/20 hover:text-white/50'
                }`}
              >
                <span className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all ${
                  tipos.includes(t) ? 'border-white/50 bg-white/10' : 'border-white/15'
                }`}>
                  {tipos.includes(t) && (
                    <svg className="w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-xs tracking-wider">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Observações */}
        <div className="flex flex-col gap-3">
          <label className="text-[9px] tracking-[0.4em] text-white/30 uppercase">
            Observações Adicionais
          </label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Descreva em detalhe as alterações pretendidas..."
            rows={5}
            className="bg-transparent border border-white/10 rounded-none px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-400/70 tracking-wide text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="border border-white/30 bg-white/[0.04] text-white text-[10px] tracking-[0.4em] uppercase px-6 py-4 hover:bg-white/[0.08] hover:border-white/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'A enviar...' : 'Enviar Pedido de Alteração'}
        </button>

      </form>

      <div className="w-0.5 h-10 bg-white/20 mt-12" />
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
