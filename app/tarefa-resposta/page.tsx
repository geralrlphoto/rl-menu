'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ──────────────────────────────────────────────────────────────────────
//  TAREFA RESPOSTA — página pública aberta a partir do email
//  O freelancer responde + escolhe estado (Aguardar / Resolvido).
//  "Resolvido" não pode ser submetido sem resposta escrita.
// ──────────────────────────────────────────────────────────────────────

type TaskPayload = {
  titulo: string
  projeto?: string
  prazo: string
  hora?: string
  prioridade: 'Alta' | 'Média' | 'Baixa'
  freelancerNome: string
  freelancerEmail: string
  adminEmail: string
}

function decodePayload(b64: string | null): TaskPayload | null {
  if (!b64) return null
  try {
    const base64 = b64.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(base64)))
    return JSON.parse(json)
  } catch { return null }
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <RespostaPage />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white/30 text-sm" style={{ background: '#0A0A0A' }}>
      A carregar…
    </div>
  )
}

function RespostaPage() {
  const params = useSearchParams()
  const dParam = params?.get('d') ?? null
  const [payload, setPayload] = useState<TaskPayload | null>(null)
  const [resposta, setResposta] = useState('')
  const [status, setStatus] = useState<'Aguardar' | 'Resolvido'>('Aguardar')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ status: 'Aguardar' | 'Resolvido' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPayload(decodePayload(dParam))
  }, [dParam])

  // Resolvido só permitido com resposta não vazia
  const podeResolvido = resposta.trim().length > 0
  const podeSubmeter = status === 'Aguardar' || podeResolvido

  async function submit() {
    if (!payload || !podeSubmeter) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/painel-editor/responder-tarefa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: payload.titulo,
          projeto: payload.projeto,
          prazo: payload.prazo,
          prioridade: payload.prioridade,
          freelancerNome: payload.freelancerNome,
          freelancerEmail: payload.freelancerEmail,
          adminEmail: payload.adminEmail,
          resposta: resposta.trim(),
          novoStatus: status,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro a enviar resposta')
      setDone({ status })
    } catch (err: any) {
      setError(err?.message ?? 'Erro desconhecido')
    } finally {
      setSending(false)
    }
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-md text-center">
          <p className="text-4xl text-gold/40 font-serif mb-3">✉</p>
          <h1 className="text-2xl font-light text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Link inválido</h1>
          <p className="text-[13px] text-white/55">O link da tarefa parece estar incompleto ou expirado. Abre novamente a partir do email recebido.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: '#0A0A0A' }}>
        <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,164,92,0.08), transparent 70%)' }} />
        <div className="relative max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: done.status === 'Resolvido' ? 'rgba(52,211,153,0.55)' : 'rgba(250,204,21,0.55)',
              background: done.status === 'Resolvido' ? 'rgba(52,211,153,0.1)' : 'rgba(250,204,21,0.08)',
              boxShadow: done.status === 'Resolvido' ? '0 0 30px rgba(52,211,153,0.25)' : '0 0 30px rgba(250,204,21,0.18)',
            }}>
            <span className={`text-3xl ${done.status === 'Resolvido' ? 'text-emerald-300' : 'text-yellow-300'}`}>
              {done.status === 'Resolvido' ? '✓' : '⏳'}
            </span>
          </div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold/70 font-bold mb-2">Resposta Enviada</p>
          <h1 className="text-3xl font-light text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Tarefa <span className="italic text-gold">{done.status === 'Resolvido' ? 'resolvida' : 'em espera'}</span>
          </h1>
          <p className="text-[13px] text-white/55 leading-relaxed mb-6">
            A tua resposta foi enviada ao admin por email. Já podes fechar esta janela.
          </p>
          <p className="text-[10px] tracking-widest uppercase text-white/15">RL PROD · Wedding Moments Films</p>
        </div>
      </div>
    )
  }

  const corPrio =
    payload.prioridade === 'Alta'  ? 'border-red-500/40 bg-red-500/10 text-red-300'        :
    payload.prioridade === 'Média' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' :
                                     'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#0A0A0A' }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 15%, rgba(201,164,92,0.07), transparent 65%)' }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 15% 85%, rgba(201,164,92,0.05), transparent 70%)' }} />

      <main className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 py-10 sm:py-16">

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-serif italic text-gold" style={{ fontFamily: 'Georgia, serif' }}>W</span>
          <p className="text-[10px] tracking-[0.4em] text-gold/70 font-light uppercase">Wedding Moments Films</p>
        </div>
        <p className="text-[11px] tracking-[0.4em] uppercase text-gold/60 font-bold mb-3 mt-8">Responder à Tarefa</p>
        <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          Nova <span className="italic text-gold">tarefa</span>
        </h1>
        <p className="text-[13px] text-white/55 leading-relaxed max-w-md">
          Olá <span className="text-gold/85">{payload.freelancerNome}</span>, recebeste uma tarefa.
          Responde abaixo e escolhe o estado.
        </p>

        {/* Card da tarefa */}
        <div className="mt-8 rounded-2xl border border-white/[0.08] p-5 sm:p-6"
          style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.5), rgba(11,11,11,0.8))', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)' }}>
          <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full border tracking-widest uppercase font-bold ${corPrio}`}>
            {payload.prioridade} Prioridade
          </span>
          <p className="mt-3 text-[20px] sm:text-[22px] font-light text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {payload.titulo}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
            {payload.projeto && (
              <Meta label="Projeto" value={payload.projeto} />
            )}
            <Meta label="Prazo" value={`${payload.prazo}${payload.hora ? ` · ${payload.hora}` : ''}`} />
          </div>
        </div>

        {/* Resposta */}
        <div className="mt-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-gold/65 font-bold mb-2">
            A tua resposta {status === 'Resolvido' && <span className="text-red-400 normal-case tracking-normal text-[10px] ml-1">(obrigatória para marcar Resolvido)</span>}
          </p>
          <textarea value={resposta} onChange={e => setResposta(e.target.value)}
            placeholder="Escreve a tua resposta, dúvida ou nota de progresso…"
            rows={6}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 resize-none leading-relaxed" />
          <p className="text-[10px] text-white/30 mt-1.5">
            {resposta.trim().length > 0 ? `${resposta.trim().length} caracteres` : 'Pode ficar em branco apenas se marcares "Aguardar".'}
          </p>
        </div>

        {/* Estado */}
        <div className="mt-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/45 font-medium mb-3">Estado da tarefa</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setStatus('Aguardar')}
              className={`p-4 rounded-xl border text-left transition-all ${
                status === 'Aguardar'
                  ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-200'
                  : 'border-white/10 text-white/55 hover:border-yellow-500/30 hover:bg-yellow-500/[0.04]'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">⏳</span>
                <span className="text-[13px] font-bold tracking-wider uppercase">Aguardar</span>
              </div>
              <p className={`text-[11px] leading-snug ${status === 'Aguardar' ? 'text-yellow-200/80' : 'text-white/40'}`}>
                Ainda a trabalhar / a aguardar info adicional.
              </p>
            </button>

            <button type="button" onClick={() => setStatus('Resolvido')} disabled={!podeResolvido}
              title={!podeResolvido ? 'Tens de escrever uma resposta antes de marcar como Resolvido.' : undefined}
              className={`p-4 rounded-xl border text-left transition-all disabled:cursor-not-allowed ${
                status === 'Resolvido'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                  : podeResolvido
                    ? 'border-white/10 text-white/55 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04]'
                    : 'border-white/5 text-white/20 bg-white/[0.01]'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{podeResolvido ? '✓' : '🔒'}</span>
                <span className="text-[13px] font-bold tracking-wider uppercase">Resolvido</span>
              </div>
              <p className={`text-[11px] leading-snug ${status === 'Resolvido' ? 'text-emerald-200/80' : 'text-white/40'}`}>
                {podeResolvido ? 'Tarefa concluída.' : 'Escreve a resposta primeiro.'}
              </p>
            </button>
          </div>
        </div>

        {/* Feedback erro */}
        {error && (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-[12px]">
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button type="button" onClick={submit} disabled={!podeSubmeter || sending}
            className="w-full sm:w-auto sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold text-black text-[12px] font-bold tracking-wider hover:bg-gold/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 0 22px -4px rgba(201,164,92,0.5)' }}>
            {sending ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                A enviar resposta…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M21 3L3 10l7 3 3 7 8-17z" /></svg>
                Enviar resposta
              </>
            )}
          </button>
          <p className="text-[10px] tracking-widest uppercase text-white/30 sm:ml-auto text-center sm:text-right">
            Para: <span className="text-white/55">{payload.adminEmail}</span>
          </p>
        </div>

        <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-16">
          RL PROD · Wedding Moments Films
        </p>
      </main>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase text-white/35 mb-0.5">{label}</p>
      <p className="text-[13px] text-white/85 truncate">{value}</p>
    </div>
  )
}
