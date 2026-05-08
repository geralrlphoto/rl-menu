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

  return (
    <>
      {/* Botão */}
      <button
        onClick={() => setStep('form')}
        className="flex items-center gap-2 px-4 py-2 border transition-all duration-200"
        style={{
          background: 'rgba(70,120,255,0.08)',
          border: '1px solid rgba(70,120,255,0.35)',
          color: 'rgba(130,170,255,0.85)',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span className="text-[9px] tracking-[0.45em] uppercase">Novo Portal</span>
      </button>

      {/* Modal overlay */}
      {step !== 'idle' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) reset() }}
        >
          <div
            className="w-full max-w-md relative overflow-hidden"
            style={{
              background: '#06090f',
              border: '1px solid rgba(70,120,255,0.18)',
              boxShadow: '0 0 60px rgba(30,80,255,0.12)',
            }}
          >
            {/* Grid bg */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(70,120,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.04) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="mb-7">
                <p className="text-[8px] tracking-[0.6em] uppercase mb-2" style={{ color: 'rgba(130,170,255,0.4)' }}>
                  RL PROD · Photography &amp; Video
                </p>
                <h2 className="text-xl font-extralight tracking-[0.25em] uppercase" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Novo Portal
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-px w-10" style={{ background: 'rgba(70,120,255,0.4)' }} />
                  <div className="h-px flex-1" style={{ background: 'rgba(70,120,255,0.08)' }} />
                </div>
              </div>

              {step === 'creating' || step === 'done' ? (
                <div className="py-8 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border flex items-center justify-center"
                    style={{ borderColor: 'rgba(70,120,255,0.35)' }}>
                    {step === 'done'
                      ? <span className="text-lg" style={{ color: 'rgba(100,200,130,0.9)' }}>✓</span>
                      : <span className="text-xs tracking-widest animate-pulse" style={{ color: 'rgba(130,170,255,0.6)' }}>···</span>
                    }
                  </div>
                  <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {step === 'done' ? 'Portal criado' : 'A criar…'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Campos */}
                  <div className="flex flex-col gap-4 mb-6">
                    {/* Ref */}
                    <div>
                      <label className="block text-[8px] tracking-[0.45em] uppercase mb-2" style={{ color: 'rgba(130,170,255,0.45)' }}>
                        Referência <span style={{ color: 'rgba(255,100,100,0.7)' }}>*</span>
                      </label>
                      <input
                        ref={refInput}
                        value={ref}
                        onChange={e => setRef(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && criar()}
                        placeholder="Ex: EMPRESA_X"
                        className="w-full bg-transparent outline-none text-sm tracking-wider placeholder:opacity-20"
                        style={{
                          border: 'none',
                          borderBottom: '1px solid rgba(70,120,255,0.25)',
                          color: 'rgba(255,255,255,0.75)',
                          padding: '8px 0',
                          fontFamily: 'monospace',
                        }}
                      />
                      <p className="text-[8px] mt-1.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        Identificador único · sem espaços (ex: OLEOBIO, MARCA_PT)
                      </p>
                    </div>

                    {/* Nome */}
                    <div>
                      <label className="block text-[8px] tracking-[0.45em] uppercase mb-2" style={{ color: 'rgba(130,170,255,0.45)' }}>
                        Nome do Projeto
                      </label>
                      <input
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && criar()}
                        placeholder="Ex: Campanha Verão 2026"
                        className="w-full bg-transparent outline-none text-sm tracking-wide placeholder:opacity-20"
                        style={{
                          border: 'none',
                          borderBottom: '1px solid rgba(70,120,255,0.15)',
                          color: 'rgba(255,255,255,0.75)',
                          padding: '8px 0',
                        }}
                      />
                    </div>

                    {/* Tipo de Portal */}
                    <div>
                      <label className="block text-[8px] tracking-[0.45em] uppercase mb-3" style={{ color: 'rgba(130,170,255,0.45)' }}>
                        Tipo de Portal
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: 'casamento', label: 'CASAMENTO', icon: '◈' },
                          { key: 'batizado',  label: 'BATIZADO',  icon: '◎' },
                        ] as { key: TipoPortal; label: string; icon: string }[]).map(({ key, label, icon }) => {
                          const active = tipoPortal === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setTipoPortal(key)}
                              className="flex flex-col items-center gap-1.5 py-3 transition-all duration-200"
                              style={{
                                border: active
                                  ? '1px solid rgba(70,120,255,0.55)'
                                  : '1px solid rgba(70,120,255,0.12)',
                                background: active
                                  ? 'rgba(70,120,255,0.12)'
                                  : 'rgba(70,120,255,0.03)',
                                boxShadow: active
                                  ? '0 0 18px rgba(70,120,255,0.15)'
                                  : 'none',
                              }}
                            >
                              <span
                                className="text-base"
                                style={{ color: active ? 'rgba(130,170,255,0.9)' : 'rgba(255,255,255,0.2)' }}
                              >
                                {icon}
                              </span>
                              <span
                                className="text-[8px] tracking-[0.45em]"
                                style={{ color: active ? 'rgba(130,170,255,0.85)' : 'rgba(255,255,255,0.2)' }}
                              >
                                {label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Erro */}
                  {err && (
                    <p className="text-[10px] tracking-wide mb-4" style={{ color: 'rgba(255,100,100,0.8)' }}>
                      {err}
                    </p>
                  )}

                  {/* Botões */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 text-[9px] tracking-[0.4em] uppercase transition-all duration-200"
                      style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.25)',
                        background: 'transparent',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={criar}
                      className="flex-1 py-3 text-[9px] tracking-[0.4em] uppercase transition-all duration-200"
                      style={{
                        background: 'rgba(70,120,255,0.15)',
                        border: '1px solid rgba(70,120,255,0.45)',
                        color: 'rgba(130,170,255,0.9)',
                      }}
                    >
                      Criar Portal →
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Fechar */}
            <button
              onClick={reset}
              className="absolute top-4 right-4 text-[16px] transition-opacity"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
