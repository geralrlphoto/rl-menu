'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NovoPortalButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ref, setRef] = useState('')
  const [step, setStep] = useState<'input' | 'loading' | 'confirm' | 'creating' | 'error'>('input')
  const [evento, setEvento] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')

  function reset() {
    setOpen(false)
    setRef('')
    setStep('input')
    setEvento(null)
    setErrorMsg('')
  }

  async function handleVerificar() {
    if (!ref.trim()) return
    setStep('loading')
    setErrorMsg('')
    try {
      const d = await fetch(`/api/evento-by-ref?ref=${encodeURIComponent(ref.trim())}`).then(r => r.json())
      if (!d.found) {
        setErrorMsg(`Referência "${ref.trim()}" não encontrada em Eventos 2026.`)
        setStep('error')
        return
      }
      setEvento(d.evento)
      setStep('confirm')
    } catch {
      setErrorMsg('Erro de ligação. Tenta novamente.')
      setStep('error')
    }
  }

  async function handleCriar() {
    setStep('creating')
    try {
      const res = await fetch('/api/portais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia: evento.referencia,
          noiva: evento.nome_noiva ?? '',
          noivo: evento.nome_noivo ?? '',
          data: evento.data_evento ?? null,
          local: evento.local ?? '',
          valorFoto: evento.valor_foto ?? null,
          valorVideo: evento.valor_video ?? null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar portal')
      reset()
      router.push(`/portal-cliente/ref/${encodeURIComponent(evento.referencia)}`)
    } catch {
      setErrorMsg('Erro ao criar portal. Tenta novamente.')
      setStep('error')
    }
  }

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  function fmtDate(d: string | null) {
    if (!d) return '—'
    try { const dt = new Date(d + 'T00:00:00'); return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}` }
    catch { return d }
  }

  return (
    <>
      {/* Botão Novo Portal */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A84C] text-black font-bold text-xs tracking-widest hover:bg-[#C9A84C]/80 transition-all uppercase"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Novo Portal
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) reset() }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-playfair font-black text-xl text-white">Novo Portal</h2>
              <button onClick={reset} className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none">✕</button>
            </div>

            {/* Step: input */}
            {(step === 'input' || step === 'error') && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mb-2">Referência do Evento</p>
                  <input
                    autoFocus
                    type="text"
                    value={ref}
                    onChange={e => setRef(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleVerificar()}
                    placeholder="ex: CAS_034_26_KP"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-[#C9A84C]/40 placeholder:text-white/20"
                  />
                </div>
                {step === 'error' && (
                  <p className="text-xs text-red-400/80">{errorMsg}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={reset} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition-all">Cancelar</button>
                  <button onClick={handleVerificar} disabled={!ref.trim()} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#C9A84C]/80 transition-all disabled:opacity-40">
                    Verificar
                  </button>
                </div>
              </div>
            )}

            {/* Step: loading */}
            {step === 'loading' && (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm animate-pulse tracking-widest">A verificar referência...</p>
              </div>
            )}

            {/* Step: confirm */}
            {step === 'confirm' && evento && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4 space-y-2">
                  <p className="text-[10px] tracking-widest text-[#C9A84C]/60 uppercase">Evento encontrado</p>
                  <p className="font-mono text-[#C9A84C] text-sm font-bold">{evento.referencia}</p>
                  {(evento.nome_noiva || evento.nome_noivo) && (
                    <p className="font-playfair text-white text-lg">{[evento.nome_noiva, evento.nome_noivo].filter(Boolean).join(' & ')}</p>
                  )}
                  <div className="flex gap-4 pt-1 text-xs text-white/40">
                    {evento.data_evento && <span>📅 {fmtDate(evento.data_evento)}</span>}
                    {evento.local && <span>📍 {evento.local}</span>}
                  </div>
                </div>
                <p className="text-xs text-white/30">Vais criar um portal independente com este design para este cliente.</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep('input')} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition-all">← Voltar</button>
                  <button onClick={handleCriar} className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#C9A84C]/80 transition-all">
                    ✓ Criar Portal
                  </button>
                </div>
              </div>
            )}

            {/* Step: creating */}
            {step === 'creating' && (
              <div className="text-center py-8">
                <p className="text-white/40 text-sm animate-pulse tracking-widest">A criar portal...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
