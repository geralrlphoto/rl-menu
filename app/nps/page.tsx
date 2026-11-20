'use client'

import { Suspense, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { PERGUNTAS_NPS, NOTA_INDICAR, type PerguntaNps, type RespostasNps } from '@/lib/nps'

/* NPS público só para quem fechou (link por WhatsApp a partir da ficha do CRM).
   /nps?n=Nome dos noivos&id=<id da lead>. 8 perguntas, uma por ecrã (mesma linguagem do /opiniao);
   a última é a recomendação de 0 a 10. Com nota 7 ou mais aparece a caixa para indicarem outros noivos,
   com a oferta de um serviço se esses noivos fecharem. As respostas ficam em crm_nps (/api/nps). */

const GOLD = '#d8be93'
const HERO = '/eventos-hero-2026.webp'
const COND = { fontFamily: "var(--font-op-cond), 'Roboto Condensed', Arial, sans-serif" }
const JOST = { fontFamily: "var(--font-op-jost), 'Jost', sans-serif" }

function Titulo({ texto, grande }: { texto: string; grande?: boolean }) {
  const partes = texto.split('*')
  return (
    <h2 className={`font-extralight text-white leading-[1.08] tracking-[-0.02em] ${grande ? 'text-[40px] sm:text-[60px]' : 'text-[30px] sm:text-[38px]'}`} style={JOST}>
      {partes.map((p, i) => i % 2 ? <span key={i} style={{ color: GOLD }}>{p}</span> : <span key={i}>{p}</span>)}
    </h2>
  )
}

function Botao({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="group w-full inline-flex items-center justify-center gap-3 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 px-7 py-4 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all duration-300 hover:bg-[#d8be93]/30 hover:border-[#d8be93] shadow-[0_0_34px_-12px_rgba(216,190,147,0.7)] disabled:opacity-35 disabled:shadow-none"
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

function Circulos({ de, ate, valor, escolher }: { de: number; ate: number; valor?: number; escolher: (v: number) => void }) {
  const nums = Array.from({ length: ate - de + 1 }, (_, i) => de + i)
  return (
    <div className={ate === 10 ? 'grid grid-cols-6 sm:grid-cols-11 gap-2' : 'flex justify-between gap-2'}>
      {nums.map(n => {
        const ativo = valor === n
        return (
          <button key={n} onClick={() => escolher(n)} aria-label={`${n} de ${ate}`}
            className={`${ate === 10 ? 'aspect-square text-[20px]' : 'h-14 w-14 sm:h-16 sm:w-16 text-[24px]'} rounded-full border font-light transition-all duration-300 active:scale-95 ${ativo
              ? 'border-[#d8be93] bg-[#d8be93] text-black shadow-[0_0_30px_-6px_rgba(216,190,147,0.75)] scale-105'
              : 'border-white/[0.12] bg-black/30 text-white/80 hover:border-[#d8be93]/50 hover:text-white'}`}
            style={COND}>
            {n}
          </button>
        )
      })}
    </div>
  )
}

function Legendas({ textos }: { textos: string[] }) {
  return (
    <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-white/40" style={COND}>
      {textos.map(t => <span key={t}>{t}</span>)}
    </div>
  )
}

function Opcoes({ p, valor, alternar }: { p: Extract<PerguntaNps, { tipo: 'multipla' }>; valor: string[] | undefined; alternar: (o: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {p.opcoes.map(o => {
        const ativo = !!valor?.includes(o)
        return (
          <button key={o} onClick={() => alternar(o)}
            className={`flex items-center gap-3.5 rounded-[18px] border px-4 py-3.5 text-left text-[16px] transition-all duration-300 ${ativo
              ? 'border-[#d8be93]/60 bg-[#d8be93]/15 text-[#d8be93]'
              : 'border-white/[0.08] bg-black/30 text-white/80 hover:border-[#d8be93]/40'}`}
            style={COND}>
            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-[5px] border ${ativo ? 'border-[#d8be93]' : 'border-white/25'}`}
              style={{ background: ativo ? GOLD : 'transparent' }}>
              {ativo && <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="#000" strokeWidth="2.4"><path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            {o}
          </button>
        )
      })}
    </div>
  )
}

const CAMPO = 'w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder-white/25 outline-none transition-colors focus:border-[#d8be93]/50'

function Formulario() {
  const sp = useSearchParams()
  const nome = (sp.get('n') ?? '').trim().slice(0, 120)
  const leadId = (sp.get('id') ?? '').trim()

  const [respostas, setRespostas] = useState<RespostasNps>({})
  const [indNome, setIndNome] = useState('')
  const [indContacto, setIndContacto] = useState('')
  // -1 = início; 0..7 = perguntas; 8 = indicar noivos (só com nota alta); 9 = fim
  const [passo, setPasso] = useState(-1)
  const [envio, setEnvio] = useState<'nada' | 'a-enviar' | 'erro' | 'ok'>('nada')

  const total = PERGUNTAS_NPS.length
  const PASSO_INDICAR = total, PASSO_FIM = total + 1
  const p = passo >= 0 && passo < total ? PERGUNTAS_NPS[passo] : null
  const nota = typeof respostas.recomendar === 'number' ? respostas.recomendar : null

  const irPara = (n: number) => { setPasso(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const enviar = async (r: RespostasNps, comIndicacao: boolean) => {
    irPara(PASSO_FIM)
    setEnvio('a-enviar')
    try {
      const res = await fetch('/api/nps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, respostas: r, indicacao: comIndicacao ? { nome: indNome, contacto: indContacto } : null }),
      })
      const d = await res.json().catch(() => ({}))
      setEnvio(res.ok && d.ok ? 'ok' : 'erro')
    } catch {
      setEnvio('erro')
    }
  }

  const avancar = (r: RespostasNps) => {
    if (passo + 1 < total) return irPara(passo + 1)
    // Última pergunta: com nota alta pergunta pelos noivos a indicar, senão envia logo
    if (typeof r.recomendar === 'number' && r.recomendar >= NOTA_INDICAR) irPara(PASSO_INDICAR)
    else enviar(r, false)
  }

  const responder = (id: string, v: RespostasNps[string], auto: boolean) => {
    const r = { ...respostas, [id]: v }
    setRespostas(r)
    if (auto) setTimeout(() => avancar(r), 300)
  }

  const progresso = passo < 0 ? 0 : passo >= PASSO_FIM ? 1 : passo / total
  const numero = (n: number) => String(n).padStart(2, '0')

  return (
    <main className="relative min-h-[100svh] w-full bg-[#0b0b0b] text-white" style={COND}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover grayscale opacity-[0.22]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(216,190,147,0.12), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,#0b0b0b 0%,rgba(11,11,11,.45) 20%,rgba(11,11,11,.6) 65%,#0b0b0b 100%)' }} />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[600px] flex-col px-4 sm:px-6 pb-8 pt-6">
        <header>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</span>
            {passo >= 0 && passo < total && (
              <span className="rounded-full border border-[#d8be93]/35 bg-[#d8be93]/10 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums" style={{ color: GOLD }}>
                {passo + 1} / {total}
              </span>
            )}
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d8be93]/50 to-[#d8be93] transition-[width] duration-700" style={{ width: `${progresso * 100}%` }} />
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          {/* Início */}
          {passo === -1 && (
            <div>
              <p className="text-[12px] font-bold tracking-[0.5em] uppercase" style={{ color: GOLD }}>A vossa opinião</p>
              <div className="mt-4"><Titulo grande texto={`Obrigado${nome ? `, ${nome}` : ''}. Como *correu*?`} /></div>
              <div className="mt-6 flex items-center gap-4">
                <span className="h-px w-12" style={{ background: GOLD }} />
                <span className="text-[12px] tracking-[0.22em] uppercase text-white/60">{total} perguntas · cerca de 1 minuto</span>
              </div>
              <p className="mt-6 text-lg sm:text-xl font-light leading-relaxed text-white/60">
                Do primeiro contacto à proposta, queremos saber o que sentiram. Ajuda-nos a ser cada vez melhores.
              </p>
              <div className="mt-10"><Botao onClick={() => irPara(0)}>Começar</Botao></div>
            </div>
          )}

          {/* Pergunta */}
          {p && (
            <div key={p.id} className="rounded-[22px] border border-[#d8be93]/20 border-l-2 border-l-[#d8be93]/70 bg-[#111111]/85 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#d8be93]/[0.14] text-[14px] font-semibold tabular-nums" style={{ color: GOLD }}>
                  {numero(passo + 1)}
                </span>
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">
                  {p.tipo === 'multipla' ? 'Podem escolher várias' : p.tipo === 'texto' ? 'Opcional' : p.tipo === 'nps' ? 'De 0 a 10' : 'De 1 a 5'}
                </span>
              </div>
              <div className="mt-5"><Titulo texto={p.titulo} /></div>

              <div className="mt-7">
                {p.tipo === 'escala' && (
                  <>
                    <Circulos de={1} ate={5} valor={respostas[p.id] as number | undefined} escolher={v => responder(p.id, v, true)} />
                    <Legendas textos={p.legendas} />
                  </>
                )}
                {p.tipo === 'nps' && (
                  <>
                    <Circulos de={0} ate={10} valor={respostas[p.id] as number | undefined} escolher={v => responder(p.id, v, true)} />
                    <Legendas textos={['Nada provável', 'Muito provável']} />
                  </>
                )}
                {p.tipo === 'multipla' && (
                  <Opcoes p={p} valor={respostas[p.id] as string[] | undefined}
                    alternar={o => {
                      const atual = (respostas[p.id] as string[] | undefined) ?? []
                      responder(p.id, atual.includes(o) ? atual.filter(x => x !== o) : [...atual, o], false)
                    }} />
                )}
                {p.tipo === 'texto' && (
                  <textarea value={(respostas[p.id] as string | undefined) ?? ''}
                    onChange={e => setRespostas({ ...respostas, [p.id]: e.target.value.slice(0, p.max) })}
                    rows={5} maxLength={p.max} placeholder="Escrevam aqui…" className={`${CAMPO} resize-y`} style={COND} />
                )}
              </div>

              {(p.tipo === 'multipla' || p.tipo === 'texto') && (
                <div className="mt-7">
                  <Botao onClick={() => avancar(respostas)} disabled={p.tipo === 'multipla' && !((respostas[p.id] as string[] | undefined)?.length)}>
                    Seguinte
                  </Botao>
                </div>
              )}
              {passo > 0 && <Voltar onClick={() => irPara(passo - 1)} />}
            </div>
          )}

          {/* Indicar outros noivos (só com nota alta) */}
          {passo === PASSO_INDICAR && (
            <div className="rounded-[22px] border border-[#d8be93]/30 border-l-2 border-l-[#d8be93]/70 bg-[#111111]/85 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)]">
              <p className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: GOLD }}>Obrigado{nota !== null ? ` pelo ${nota}` : ''}</p>
              <div className="mt-4"><Titulo texto="Conhecem *noivos* que se vão casar?" /></div>
              <p className="mt-4 text-[16px] font-light leading-relaxed text-white/70">
                Deixem-nos o nome e o contacto deles. <span style={{ color: GOLD }}>Se estes noivos fecharem connosco, oferecemos-vos um serviço</span> como agradecimento.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <input value={indNome} onChange={e => setIndNome(e.target.value.slice(0, 160))} placeholder="Nome dos noivos" className={CAMPO} style={COND} />
                <input value={indContacto} onChange={e => setIndContacto(e.target.value.slice(0, 160))} placeholder="Telemóvel ou email" className={CAMPO} style={COND} />
              </div>
              <div className="mt-7">
                <Botao onClick={() => enviar(respostas, true)} disabled={!indNome.trim() || !indContacto.trim()}>Enviar</Botao>
              </div>
              <button onClick={() => enviar(respostas, false)}
                className="mt-4 w-full text-center text-[12px] font-medium tracking-[0.2em] uppercase text-white/45 hover:text-white/80" style={COND}>
                Agora não, enviar só as respostas
              </button>
              <Voltar onClick={() => irPara(total - 1)} />
            </div>
          )}

          {/* Fim */}
          {passo === PASSO_FIM && (
            <div className="rounded-[22px] border border-[#d8be93]/30 bg-[#111111]/80 backdrop-blur-xl p-6 sm:p-8 text-center">
              {envio === 'a-enviar' && <p className="py-10 text-[13px] tracking-[0.3em] uppercase text-white/50">A enviar…</p>}
              {envio === 'ok' && (
                <>
                  <Titulo grande texto="A vossa resposta *chegou*" />
                  <p className="mt-5 text-lg font-light leading-relaxed text-white/60">Muito obrigado pelo tempo e pela sinceridade.</p>
                  <p className="mt-8 text-2xl font-extralight italic text-white/85" style={JOST}>Com carinho,</p>
                  <p className="mt-2 text-[11px] font-semibold tracking-[0.45em] uppercase" style={{ color: GOLD }}>RL Photo.Video</p>
                </>
              )}
              {envio === 'erro' && (
                <>
                  <Titulo texto="Não conseguimos *enviar*" />
                  <p className="mt-4 text-[16px] font-light leading-relaxed text-white/60">Algo correu mal do nosso lado. As vossas respostas continuam aqui.</p>
                  <div className="mt-7"><Botao onClick={() => enviar(respostas, !!(indNome.trim() && indContacto.trim()))}>Tentar outra vez</Botao></div>
                </>
              )}
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
