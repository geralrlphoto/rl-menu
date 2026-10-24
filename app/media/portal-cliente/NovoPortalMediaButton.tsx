'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'idle' | 'form' | 'creating' | 'done'
type TipoPortal = 'casamento' | 'batizado'

export default function NovoPortalMediaButton() {
  const [step, setStep]           = useState<Step>('idle')
  const [ref, setRef]             = useState('')
  const [nome, setNome]           = useState('')
  const [tipoPortal, setTipoPortal] = useState<TipoPortal>('casamento')
  const [err, setErr]             = useState('')
  const router = useRouter()
  const refInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'form') setTimeout(() => refInput.current?.focus(), 80)
  }, [step])

  // Fechar com Escape
  useEffect(() => {
    if (step === 'idle') return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') reset() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [step])

  function reset() {
    setStep('idle'); setRef(''); setNome(''); setTipoPortal('casamento'); setErr('')
  }

  async function criar() {
    if (!ref.trim()) { setErr('A referência é obrigatória'); return }
    setErr('')
    setStep('creating')

    const res = await fetch('/api/media-portal/novo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: ref.trim(), nome: nome.trim(), tipoPortal }),
    })

    const data = await res.json()
    if (!res.ok) {
      setErr(data.error || 'Erro ao criar portal')
      setStep('form')
      return
    }

    setStep('done')
    setTimeout(() => {
      router.push(`/portal-media/${data.ref}`)
    }, 600)
  }

  const LABEL = 'rlp-m block text-[9.5px] text-[#5a8bff] mb-2'
  const INPUT = 'w-full rounded-xl border border-white/[0.12] bg-[#00141f]/80 px-4 py-3 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#2e6cf6]/80 transition-colors'

  return (
    <>
      {/* Botão */}
      <button
        onClick={() => setStep('form')}
        className="inline-flex items-center gap-2 rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors"
        style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}
      >
        <span aria-hidden>+</span> Novo portal
      </button>

      {/* Modal */}
      {step !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75"
          onClick={(e) => { if (e.target === e.currentTarget) reset() }}
        >
          <div className="rlp w-full max-w-md relative rounded-2xl border border-white/[0.1] bg-[#0c2236] text-white p-7 sm:p-8"
            style={{ boxShadow: '0 30px 80px -30px rgba(46,108,246,0.55)' }}>

            {/* Cabeçalho */}
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Portais</p>
            <h2 className="rlp-t mt-3 text-[32px] leading-none">
              Novo portal<span className="text-[#5a8bff]">.</span>
            </h2>

            {step === 'creating' || step === 'done' ? (
              <div className="py-10 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.12] flex items-center justify-center">
                  {step === 'done'
                    ? <span className="text-lg text-[#a9c1ff]">✓</span>
                    : <span className="text-xs tracking-widest animate-pulse text-[#5a8bff]">···</span>
                  }
                </div>
                <p className="rlp-m text-[10px] text-white/55">
                  {step === 'done' ? 'Portal criado' : 'A criar…'}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-7 flex flex-col gap-5">
                  {/* Referência */}
                  <div>
                    <label className={LABEL}>
                      Referência <span className="text-[#ff4747]">*</span>
                    </label>
                    <input
                      ref={refInput}
                      value={ref}
                      onChange={e => setRef(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && criar()}
                      placeholder="Ex: EMPRESA_X"
                      className={`${INPUT} font-mono tracking-wider`}
                    />
                    <p className="mt-1.5 text-[11.5px] text-white/40">
                      Identificador único, sem espaços (ex: OLEOBIO, MARCA_PT)
                    </p>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className={LABEL}>Nome do projeto</label>
                    <input
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && criar()}
                      placeholder="Ex: Campanha Verão 2026"
                      className={INPUT}
                    />
                  </div>

                  {/* Tipo de portal */}
                  <div>
                    <label className={LABEL}>Tipo de portal</label>
                    <div className="flex gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1">
                      {([
                        { key: 'casamento', label: 'Casamento' },
                        { key: 'batizado',  label: 'Batizado' },
                      ] as { key: TipoPortal; label: string }[]).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTipoPortal(key)}
                          className={`flex-1 rounded-full px-4 py-2 text-[13px] transition-colors ${
                            tipoPortal === key ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Erro */}
                {err && <p className="mt-4 text-[12.5px] text-[#ff4747]">{err}</p>}

                {/* Botões */}
                <div className="mt-7 flex items-center gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-full border border-white/25 hover:border-white/50 py-3 text-[13px] text-white/75 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={criar}
                    className="flex-1 rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] py-3 text-[13px] font-medium text-white transition-colors"
                  >
                    Criar portal →
                  </button>
                </div>
              </>
            )}

            {/* Fechar */}
            <button
              onClick={reset}
              aria-label="Fechar"
              className="absolute top-4 right-5 text-[20px] leading-none text-white/40 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
