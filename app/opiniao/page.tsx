'use client'

import { Suspense, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { perguntasVisiveis, type Pergunta, type Respostas } from '@/lib/opiniao'

/* Página pública de opinião para os casais que não fecharam (link por WhatsApp).
   /opiniao?n=Nome dos noivos&id=<id da lead no CRM>, ambos opcionais.
   Linguagem visual do /photo, /crm e portal dos noivos: fundo #0b0b0b com foto
   a preto e branco, brilho dourado e grelha de pontos; cartão de vidro com
   barra dourada à esquerda; uma pergunta por ecrã. As respostas seguem por
   email para a RL (/api/opiniao). */

const GOLD = '#d8be93'
const HERO = '/eventos-hero-2026.webp'
const COND = { fontFamily: "var(--font-op-cond), 'Roboto Condensed', Arial, sans-serif" }
const JOST = { fontFamily: "var(--font-op-jost), 'Jost', sans-serif" }

/* "Como avaliam a nossa *reunião*?" → palavra entre asteriscos a dourado.
   Jost fino, como os nomes dos noivos no portal. */
function Titulo({ texto, grande }: { texto: string; grande?: boolean }) {
  const partes = texto.split('*')
  return (
    <h2 className={`font-extralight text-white leading-[1.08] tracking-[-0.02em] ${grande ? 'text-[44px] sm:text-[64px]' : 'text-[30px] sm:text-[38px]'}`} style={JOST}>
      {partes.map((p, i) => i % 2 ? <span key={i} style={{ color: GOLD }}>{p}</span> : <span key={i}>{p}</span>)}
    </h2>
  )
}

function Botao({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="group w-full inline-flex items-center justify-center gap-3 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-7 py-4 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all duration-300 hover:bg-[#d8be93]/30 hover:border-[#d8be93] shadow-[0_0_34px_-12px_rgba(216,190,147,0.7)] disabled:opacity-35 disabled:shadow-none disabled:hover:bg-[#d8be93]/15"
      style={COND}>
      {children}
      <span className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: GOLD }}>→</span>
    </button>
  )
}

function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mt-5 text-[12px] font-medium tracking-[0.2em] uppercase text-white/40 hover:text-white/75 transition-colors" style={COND}>
      ← Voltar
    </button>
  )
}

function Escala({ p, valor, escolher }: { p: Extract<Pergunta, { tipo: 'escala' }>; valor?: number; escolher: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between gap-2">
        {[1, 2, 3, 4, 5].map(n => {
          const ativo = valor === n
          return (
            <button key={n} onClick={() => escolher(n)} aria-label={`${n} de 5`}
              className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full border text-[24px] font-thin transition-all duration-300 active:scale-95 ${ativo
                ? 'border-[#d8be93] bg-[#d8be93] text-black shadow-[0_0_30px_-6px_rgba(216,190,147,0.75)] scale-105'
                : 'border-white/[0.12] bg-black/30 text-white/80 hover:border-[#d8be93]/50 hover:text-white'}`}
              style={COND}>
              {n}
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40" style={COND}>
        <span className="text-left">{p.legendas[0]}</span><span />
        <span className="text-center">{p.legendas[1]}</span><span />
        <span className="text-right">{p.legendas[2]}</span>
      </div>
    </div>
  )
}

function Opcoes({ p, valor, alternar }: { p: Extract<Pergunta, { tipo: 'unica' | 'multipla' }>; valor: string | string[] | undefined; alternar: (o: string) => void }) {
  const multipla = p.tipo === 'multipla'
  return (
    <div className="flex flex-col gap-2">
      {p.opcoes.map(o => {
        const ativo = multipla ? Array.isArray(valor) && valor.includes(o) : valor === o
        return (
          <button key={o} onClick={() => alternar(o)}
            className={`flex items-center gap-3.5 rounded-[18px] border px-4 py-3.5 text-left text-[16px] transition-all duration-300 active:scale-[0.99] ${ativo
              ? 'border-[#d8be93]/60 bg-[#d8be93]/15 text-[#d8be93] shadow-[0_0_28px_-14px_rgba(216,190,147,0.7)]'
              : 'border-white/[0.08] bg-black/30 text-white/80 hover:border-[#d8be93]/40'}`}
            style={COND}>
            <span className={`flex h-5 w-5 flex-none items-center justify-center border transition-colors ${multipla ? 'rounded-[5px]' : 'rounded-full'} ${ativo ? 'border-[#d8be93]' : 'border-white/25'}`}
              style={{ background: ativo && multipla ? GOLD : 'transparent' }}>
              {ativo && (multipla
                ? <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="#000" strokeWidth="2.4"><path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <span className="h-2.5 w-2.5 rounded-full" style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />)}
            </span>
            {o}
          </button>
        )
      })}
    </div>
  )
}

/* Fundo do /photo: foto a preto e branco, brilho dourado, grelha de pontos e anéis */
function Fundo() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover grayscale opacity-[0.22] animate-[opKenburns_20s_ease-out_forwards]" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(216,190,147,0.12), transparent 70%)' }} />
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, #000 20%, transparent 75%)',
        }} />
      <svg className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.09]" viewBox="0 0 900 900" fill="none">
        <circle cx="450" cy="450" r="220" stroke={GOLD} />
        <circle cx="450" cy="450" r="320" stroke={GOLD} strokeDasharray="3 7" />
        <circle cx="450" cy="450" r="430" stroke={GOLD} />
      </svg>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,#0b0b0b 0%,rgba(11,11,11,.45) 20%,rgba(11,11,11,.6) 65%,#0b0b0b 100%)' }} />
    </div>
  )
}

function Formulario() {
  const sp = useSearchParams()
  const nome = (sp.get('n') ?? '').trim().slice(0, 120)
  const leadId = (sp.get('id') ?? '').trim()

  const [respostas, setRespostas] = useState<Respostas>({})
  // -1 = ecrã inicial; 0..n-1 = perguntas; n = ecrã final
  const [passo, setPasso] = useState(-1)
  const [envio, setEnvio] = useState<'nada' | 'a-enviar' | 'erro' | 'ok'>('nada')

  const visiveis = perguntasVisiveis(respostas)
  const total = visiveis.length
  const p = passo >= 0 && passo < total ? visiveis[passo] : null
  const fim = passo >= total

  const enviar = async (r: Respostas) => {
    setEnvio('a-enviar')
    try {
      const res = await fetch('/api/opiniao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, leadId, respostas: r }),
      })
      const d = await res.json().catch(() => ({}))
      setEnvio(res.ok && d.ok ? 'ok' : 'erro')
    } catch {
      setEnvio('erro')
    }
  }

  const irPara = (n: number) => { setPasso(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const avancar = (r: Respostas) => {
    const n = perguntasVisiveis(r).length
    if (passo + 1 >= n) { irPara(n); enviar(r) } else irPara(passo + 1)
  }

  const responder = (id: string, v: Respostas[string], auto: boolean) => {
    const r = { ...respostas, [id]: v }
    setRespostas(r)
    if (auto) setTimeout(() => avancar(r), 300)
  }

  const progresso = passo < 0 ? 0 : fim ? 1 : passo / total
  const numero = (n: number) => String(n).padStart(2, '0')

  return (
    <main className="relative min-h-[100svh] w-full bg-[#0b0b0b] text-white" style={COND}>
      <Fundo />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[600px] flex-col px-4 sm:px-6 pb-8 pt-6">
        {/* ── Barra do topo ── */}
        <header>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</span>
            {passo >= 0 && (
              <span className="rounded-full border border-[#d8be93]/35 bg-[#d8be93]/10 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums" style={{ color: GOLD }}>
                {Math.min(passo + 1, total)} / {total}
              </span>
            )}
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d8be93]/50 to-[#d8be93] transition-[width] duration-700"
              style={{ width: `${progresso * 100}%` }} />
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          {/* ── Ecrã inicial ── */}
          {passo === -1 && (
            <div key="inicio" className="animate-[opFadeUp_.6s_cubic-bezier(.2,.85,.25,1)_both]">
              <p className="text-[12px] font-bold tracking-[0.5em] uppercase" style={{ color: GOLD }}>A vossa opinião</p>
              <div className="mt-4"><Titulo grande texto={`Obrigado por nos *conhecerem*${nome ? `, ${nome}` : ''}`} /></div>
              <div className="mt-6 flex items-center gap-4">
                <span className="h-px w-12" style={{ background: GOLD }} />
                <span className="text-[12px] tracking-[0.22em] uppercase text-white/60">{total} perguntas · menos de 1 minuto</span>
              </div>
              <p className="mt-6 text-lg sm:text-xl font-light leading-relaxed text-white/60">
                Gostávamos muito de saber a vossa opinião sincera. Ajuda-nos a ser cada vez melhores.
              </p>
              <div className="mt-10"><Botao onClick={() => irPara(0)}>Começar</Botao></div>
            </div>
          )}

          {/* ── Pergunta (cartão de vidro com barra dourada) ── */}
          {p && (
            <div key={p.id}
              className="rounded-[22px] border border-[#d8be93]/20 border-l-2 border-l-[#d8be93]/70 bg-[#111111]/85 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)] animate-[opFadeUp_.5s_cubic-bezier(.2,.85,.25,1)_both]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#d8be93]/[0.14] text-[14px] font-semibold tabular-nums" style={{ color: GOLD }}>
                  {numero(passo + 1)}
                </span>
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">
                  {p.tipo === 'multipla' ? 'Podem escolher várias' : p.tipo === 'texto' ? 'Opcional' : p.tipo === 'escala' ? 'De 1 a 5' : 'Escolham uma'}
                </span>
              </div>
              <div className="mt-5"><Titulo texto={p.titulo} /></div>

              <div className="mt-7">
                {p.tipo === 'escala' && (
                  <Escala p={p} valor={respostas[p.id] as number | undefined} escolher={v => responder(p.id, v, true)} />
                )}
                {p.tipo === 'unica' && (
                  <Opcoes p={p} valor={respostas[p.id] as string | undefined} alternar={o => responder(p.id, o, true)} />
                )}
                {p.tipo === 'multipla' && (
                  <Opcoes p={p} valor={respostas[p.id] as string[] | undefined}
                    alternar={o => {
                      const atual = (respostas[p.id] as string[] | undefined) ?? []
                      responder(p.id, atual.includes(o) ? atual.filter(x => x !== o) : [...atual, o], false)
                    }} />
                )}
                {p.tipo === 'texto' && (
                  <div>
                    <textarea
                      value={(respostas[p.id] as string | undefined) ?? ''}
                      onChange={e => setRespostas({ ...respostas, [p.id]: e.target.value.slice(0, p.max) })}
                      rows={6} maxLength={p.max} placeholder="Escrevam aqui…"
                      className="w-full resize-y rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder-white/25 outline-none transition-colors focus:border-[#d8be93]/50"
                      style={COND} />
                    <p className="mt-1 text-right text-[11px] tabular-nums text-white/30">
                      {((respostas[p.id] as string | undefined) ?? '').length} / {p.max}
                    </p>
                  </div>
                )}
              </div>

              {(p.tipo === 'multipla' || p.tipo === 'texto') && (
                <div className="mt-7">
                  <Botao onClick={() => avancar(respostas)}
                    disabled={p.tipo === 'multipla' && !((respostas[p.id] as string[] | undefined)?.length)}>
                    {passo + 1 === total ? 'Enviar' : 'Seguinte'}
                  </Botao>
                </div>
              )}

              <Voltar onClick={() => irPara(passo - 1)} />
            </div>
          )}

          {/* ── Fim ── */}
          {fim && (
            <div key={`fim-${envio}`}
              className="rounded-[22px] border border-[#d8be93]/30 bg-[#111111]/80 backdrop-blur-xl p-6 sm:p-8 text-center shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)] animate-[opFadeUp_.5s_cubic-bezier(.2,.85,.25,1)_both]">
              {envio === 'a-enviar' && <p className="py-10 text-[13px] tracking-[0.3em] uppercase text-white/50">A enviar…</p>}
              {envio === 'ok' && (
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 96 96" className="w-20 h-20">
                    <circle cx="48" cy="48" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="277" strokeDashoffset="277" className="animate-[opDesenha_.8s_ease-out_forwards]" />
                    <path d="M30 49 l12 12 l24 -26" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="60" strokeDashoffset="60" className="animate-[opDesenha_.5s_.6s_ease-out_forwards]" />
                  </svg>
                  <div className="mt-6"><Titulo grande texto="A vossa resposta *chegou*" /></div>
                  <p className="mt-5 max-w-sm text-lg font-light leading-relaxed text-white/60">
                    Muito obrigado pelo tempo e pela sinceridade. Desejamos-vos um dia muito feliz.
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    <span className="h-px w-10" style={{ background: GOLD }} />
                    <span className="text-2xl font-extralight italic text-white/85" style={JOST}>Com carinho,</span>
                    <span className="h-px w-10" style={{ background: GOLD }} />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</p>
                </div>
              )}
              {envio === 'erro' && (
                <div className="flex flex-col items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f87171] shadow-[0_0_8px_#f87171]" />
                  <div className="mt-5"><Titulo texto="Não conseguimos *enviar*" /></div>
                  <p className="mt-4 max-w-sm text-[16px] font-light leading-relaxed text-white/60">
                    Algo correu mal do nosso lado. As vossas respostas continuam aqui.
                  </p>
                  <div className="mt-7 w-full max-w-sm"><Botao onClick={() => enviar(respostas)}>Tentar outra vez</Botao></div>
                  <Voltar onClick={() => { setEnvio('nada'); irPara(total - 1) }} />
                </div>
              )}
            </div>
          )}
        </section>

        <footer>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(216,190,147,.55),transparent)' }} />
          <p className="mt-4 text-center text-[11px] tracking-[0.12em] text-white/35">
            Menos de 1 minuto · as respostas seguem só para a equipa RL
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes opFadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes opKenburns { from { transform: scale(1.12) } to { transform: scale(1.03) } }
        @keyframes opDesenha { to { stroke-dashoffset: 0 } }
      `}</style>
    </main>
  )
}

export default function OpiniaoPage() {
  return (
    <Suspense fallback={<main className="min-h-[100svh] bg-[#0b0b0b]" />}>
      <Formulario />
    </Suspense>
  )
}
