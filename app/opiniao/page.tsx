'use client'

import { Suspense, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { perguntasVisiveis, type Pergunta, type Respostas } from '@/lib/opiniao'

/* Página pública de opinião para os casais que não fecharam (link por WhatsApp).
   /opiniao?n=Nome dos noivos&id=<id da lead no CRM>, ambos opcionais.
   Uma pergunta por ecrã; as respostas seguem por email para a RL (/api/opiniao). */

const C = {
  fundo: '#0A0907', ouro: '#C9A84C', ouroClaro: '#E2C27A', texto: '#F3EDE2', sec: '#A69676',
}
const SERIF = { fontFamily: "var(--font-op-serif), 'Cormorant Garamond', Georgia, serif" }
const COND = { fontFamily: "var(--font-op-cond), 'Roboto Condensed', Arial, sans-serif" }

/* "Como avaliam a nossa *reunião*?" → palavra entre asteriscos em itálico dourado */
function Titulo({ texto }: { texto: string }) {
  const partes = texto.split('*')
  return (
    <h1 className="text-[34px] sm:text-[42px] leading-[1.12] font-light" style={{ ...SERIF, color: C.texto }}>
      {partes.map((p, i) => i % 2
        ? <em key={i} className="italic" style={{ color: C.ouroClaro }}>{p}</em>
        : <span key={i}>{p}</span>)}
    </h1>
  )
}

function BotaoOuro({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full rounded-full py-4 text-[13px] font-medium tracking-[0.3em] uppercase transition-opacity disabled:opacity-35"
      style={{ ...COND, background: `linear-gradient(90deg, ${C.ouro}, ${C.ouroClaro})`, color: C.fundo }}>
      {children}
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
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border text-xl transition-all duration-200 active:scale-95"
              style={{
                ...SERIF,
                borderColor: ativo ? C.ouroClaro : 'rgba(201,168,76,.35)',
                background: ativo ? `linear-gradient(135deg, ${C.ouro}, ${C.ouroClaro})` : 'rgba(255,255,255,.02)',
                color: ativo ? C.fundo : C.texto,
                boxShadow: ativo ? '0 0 18px rgba(226,194,122,.45)' : 'none',
              }}>
              {n}
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-5 text-[11px] uppercase tracking-[0.12em]" style={{ ...COND, color: C.sec }}>
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
    <div className="flex flex-col gap-2.5">
      {p.opcoes.map(o => {
        const ativo = multipla ? Array.isArray(valor) && valor.includes(o) : valor === o
        return (
          <button key={o} onClick={() => alternar(o)}
            className="flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left text-[16px] transition-all duration-200 active:scale-[0.99]"
            style={{
              ...COND,
              borderColor: ativo ? C.ouro : 'rgba(255,255,255,.12)',
              background: ativo ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.02)',
              color: C.texto,
            }}>
            <span className={`flex h-5 w-5 flex-none items-center justify-center border ${multipla ? 'rounded-[5px]' : 'rounded-full'}`}
              style={{ borderColor: ativo ? C.ouroClaro : 'rgba(166,150,118,.6)', background: ativo && multipla ? C.ouro : 'transparent' }}>
              {ativo && (multipla
                ? <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={C.fundo} strokeWidth="2.4"><path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <span className="h-2.5 w-2.5 rounded-full" style={{ background: C.ouroClaro }} />)}
            </span>
            {o}
          </button>
        )
      })}
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

  const avancar = (r: Respostas) => {
    const n = perguntasVisiveis(r).length
    if (passo + 1 >= n) { setPasso(n); enviar(r) } else setPasso(passo + 1)
  }

  const responder = (id: string, v: Respostas[string], auto: boolean) => {
    const r = { ...respostas, [id]: v }
    setRespostas(r)
    if (auto) setTimeout(() => avancar(r), 280)
  }

  const contador = p ? `${passo + 1} / ${total}` : passo >= total ? `${total} / ${total}` : ''
  const progresso = passo < 0 ? 0 : Math.min(1, passo / total)

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden" style={{ background: C.fundo, color: C.texto }}>
      {/* brilho dourado suave no topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh]"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,.18), rgba(201,168,76,.05) 45%, transparent 75%)' }} />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col px-6 pb-8 pt-7">
        {/* topo */}
        <header>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em]" style={{ ...COND, color: C.ouro }}>
            <span>RL Photo · Video</span>
            <span className="tracking-[0.15em]" style={{ color: C.sec }}>{contador}</span>
          </div>
          <div className="mt-3 h-[2px] w-full rounded-full" style={{ background: 'rgba(201,168,76,.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(passo >= total ? 1 : progresso) * 100}%`, background: `linear-gradient(90deg, ${C.ouro}, ${C.ouroClaro})` }} />
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          {/* ecrã inicial */}
          {passo === -1 && (
            <div key="inicio" className="op-entrar text-center">
              <Titulo texto={`Obrigado por nos *conhecerem*${nome ? `, ${nome}` : ''}`} />
              <div className="mx-auto my-6 h-px w-14" style={{ background: C.ouro }} />
              <p className="mx-auto max-w-[380px] text-[16px] leading-relaxed" style={{ ...COND, color: C.sec }}>
                Gostávamos muito de saber a vossa opinião sincera. São só umas perguntas rápidas e ajudam-nos a ser cada vez melhores.
              </p>
              <div className="mt-10"><BotaoOuro onClick={() => setPasso(0)}>Começar</BotaoOuro></div>
            </div>
          )}

          {/* perguntas */}
          {p && (
            <div key={p.id} className="op-entrar">
              <Titulo texto={p.titulo} />
              {p.tipo === 'multipla' && <p className="mt-2 text-[13px]" style={{ ...COND, color: C.sec }}>Podem escolher várias.</p>}
              {p.tipo === 'texto' && <p className="mt-2 text-[13px]" style={{ ...COND, color: C.sec }}>Opcional.</p>}
              <div className="mt-8">
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
                      className="w-full resize-none rounded-2xl border bg-transparent p-4 text-[16px] outline-none placeholder:opacity-40"
                      style={{ ...COND, borderColor: 'rgba(201,168,76,.35)', color: C.texto }} />
                    <p className="mt-1 text-right text-[11px]" style={{ ...COND, color: C.sec }}>
                      {((respostas[p.id] as string | undefined) ?? '').length} / {p.max}
                    </p>
                  </div>
                )}
              </div>

              {(p.tipo === 'multipla' || p.tipo === 'texto') && (
                <div className="mt-8">
                  <BotaoOuro onClick={() => avancar(respostas)}
                    disabled={p.tipo === 'multipla' && !((respostas[p.id] as string[] | undefined)?.length)}>
                    {passo + 1 === total ? 'Enviar' : 'Seguinte'}
                  </BotaoOuro>
                </div>
              )}

              <button onClick={() => setPasso(passo - 1)}
                className="mt-6 text-[13px] tracking-[0.1em]" style={{ ...COND, color: C.sec }}>
                ← Voltar
              </button>
            </div>
          )}

          {/* fim */}
          {passo >= total && (
            <div key={`fim-${envio}`} className="op-entrar text-center">
              {envio === 'a-enviar' && <p className="text-[15px]" style={{ ...COND, color: C.sec }}>A enviar…</p>}
              {envio === 'ok' && (
                <>
                  <Titulo texto="A vossa resposta *chegou*" />
                  <div className="mx-auto my-6 h-px w-14" style={{ background: C.ouro }} />
                  <p className="mx-auto max-w-[380px] text-[16px] leading-relaxed" style={{ ...COND, color: C.sec }}>
                    Muito obrigado pelo tempo e pela sinceridade. Desejamos-vos um dia muito feliz.
                  </p>
                  <p className="mt-10 text-[24px] italic" style={{ ...SERIF, color: C.ouroClaro }}>Com carinho,</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.35em]" style={{ ...COND, color: C.ouro }}>RL Photo · Video</p>
                </>
              )}
              {envio === 'erro' && (
                <>
                  <Titulo texto="Não conseguimos *enviar*" />
                  <p className="mx-auto mt-5 max-w-[360px] text-[16px] leading-relaxed" style={{ ...COND, color: C.sec }}>
                    Algo correu mal do nosso lado. As vossas respostas continuam aqui.
                  </p>
                  <div className="mt-8"><BotaoOuro onClick={() => enviar(respostas)}>Tentar outra vez</BotaoOuro></div>
                  <button onClick={() => { setEnvio('nada'); setPasso(total - 1) }}
                    className="mt-6 text-[13px] tracking-[0.1em]" style={{ ...COND, color: C.sec }}>
                    ← Voltar
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        <footer className="text-center text-[11px] tracking-[0.08em]" style={{ ...COND, color: 'rgba(166,150,118,.7)' }}>
          Menos de 1 minuto · as respostas seguem só para a equipa RL
        </footer>
      </div>

      <style>{`
        @keyframes opEntrar { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        .op-entrar { animation: opEntrar .45s cubic-bezier(.2,.7,.2,1) both }
      `}</style>
    </main>
  )
}

export default function OpiniaoPage() {
  return (
    <Suspense fallback={<main className="min-h-[100svh]" style={{ background: C.fundo }} />}>
      <Formulario />
    </Suspense>
  )
}
