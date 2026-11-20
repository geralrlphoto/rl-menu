'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/* NPS público para quem fechou e para quem não fechou (link por WhatsApp a partir da ficha do CRM).
   /nps?n=Nome dos noivos&id=<id da lead>. Uma pergunta de 0 a 10 e um "porquê" opcional.
   Mesma linguagem visual do /opiniao. As respostas ficam em crm_nps (/api/nps). */

const GOLD = '#d8be93'
const HERO = '/eventos-hero-2026.webp'
const COND = { fontFamily: "var(--font-op-cond), 'Roboto Condensed', Arial, sans-serif" }
const JOST = { fontFamily: "var(--font-op-jost), 'Jost', sans-serif" }

function Titulo({ texto }: { texto: string }) {
  const partes = texto.split('*')
  return (
    <h1 className="font-extralight text-white leading-[1.08] tracking-[-0.02em] text-[32px] sm:text-[44px]" style={JOST}>
      {partes.map((p, i) => i % 2 ? <span key={i} style={{ color: GOLD }}>{p}</span> : <span key={i}>{p}</span>)}
    </h1>
  )
}

function Formulario() {
  const sp = useSearchParams()
  const nome = (sp.get('n') ?? '').trim().slice(0, 120)
  const leadId = (sp.get('id') ?? '').trim()

  const [nota, setNota] = useState<number | null>(null)
  const [porque, setPorque] = useState('')
  const [envio, setEnvio] = useState<'nada' | 'a-enviar' | 'erro' | 'ok'>('nada')

  const enviar = async () => {
    if (nota === null) return
    setEnvio('a-enviar')
    try {
      const res = await fetch('/api/nps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, nota, porque }),
      })
      const d = await res.json().catch(() => ({}))
      setEnvio(res.ok && d.ok ? 'ok' : 'erro')
    } catch {
      setEnvio('erro')
    }
  }

  return (
    <main className="relative min-h-[100svh] w-full bg-[#0b0b0b] text-white" style={COND}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover grayscale opacity-[0.22]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(216,190,147,0.12), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,#0b0b0b 0%,rgba(11,11,11,.45) 20%,rgba(11,11,11,.6) 65%,#0b0b0b 100%)' }} />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[600px] flex-col px-4 sm:px-6 pb-8 pt-6">
        <span className="text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</span>

        <section className="flex flex-1 flex-col justify-center py-10">
          {envio === 'ok' ? (
            <div className="rounded-[22px] border border-[#d8be93]/30 bg-[#111111]/80 backdrop-blur-xl p-6 sm:p-8 text-center">
              <Titulo texto="A vossa resposta *chegou*" />
              <p className="mt-5 text-lg font-light leading-relaxed text-white/60">Muito obrigado pela sinceridade.</p>
              <p className="mt-8 text-2xl font-extralight italic text-white/85" style={JOST}>Com carinho,</p>
              <p className="mt-2 text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</p>
            </div>
          ) : (
            <div className="rounded-[22px] border border-[#d8be93]/20 border-l-2 border-l-[#d8be93]/70 bg-[#111111]/85 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)]">
              {nome && <p className="text-[12px] font-bold tracking-[0.4em] uppercase mb-4" style={{ color: GOLD }}>{nome}</p>}
              <Titulo texto="De 0 a 10, quanto recomendariam a RL Photo.Video a um *amigo*?" />

              <div className="mt-7 grid grid-cols-6 sm:grid-cols-11 gap-2">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} onClick={() => setNota(n)} aria-label={`${n} de 10`}
                    className={`aspect-square rounded-full border text-[20px] font-light transition-all duration-300 active:scale-95 ${nota === n
                      ? 'border-[#d8be93] bg-[#d8be93] text-black shadow-[0_0_30px_-6px_rgba(216,190,147,0.75)]'
                      : 'border-white/[0.12] bg-black/30 text-white/80 hover:border-[#d8be93]/50 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                <span>Nada provável</span><span>Muito provável</span>
              </div>

              <p className="mt-8 text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">Porquê? (opcional)</p>
              <textarea value={porque} onChange={e => setPorque(e.target.value.slice(0, 2000))} rows={4} maxLength={2000}
                placeholder="Escrevam aqui…"
                className="mt-2 w-full resize-y rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder-white/25 outline-none focus:border-[#d8be93]/50" />

              {envio === 'erro' && <p className="mt-4 text-sm text-[#f87171]">Não conseguimos enviar. Tentem outra vez, por favor.</p>}

              <button onClick={enviar} disabled={nota === null || envio === 'a-enviar'}
                className="mt-6 w-full rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-7 py-4 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all hover:bg-[#d8be93]/30 hover:border-[#d8be93] disabled:opacity-35">
                {envio === 'a-enviar' ? 'A enviar…' : 'Enviar'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function NpsPage() {
  return (
    <Suspense fallback={<main className="min-h-[100svh] bg-[#0b0b0b]" />}>
      <Formulario />
    </Suspense>
  )
}
