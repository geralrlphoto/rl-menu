'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/* Histórico do evento em fluxo: janela central com cada fase num cartão,
   ligados por uma linha, do primeiro contacto (lead no CRM) até às entregas.
   Ações seguidas da mesma fase ficam no mesmo cartão. Só mostra o que a
   secção Histórico já carregou (nada é pedido de novo). */

export type HistLinhaFluxo = {
  id: string; tipo: string; titulo: string; detalhe: string | null
  created_at: string; origem?: 'evento' | 'lead'
}

type Fase = { k: string; nome: string; desc: string; icone: string }

const FASES: Record<string, Fase> = {
  lead:       { k: 'lead',       nome: 'Lead no CRM',        desc: 'Primeiro contacto e acompanhamento', icone: 'M4 7h16v10H4zM4 7l8 6 8-6' },
  reuniao:    { k: 'reuniao',    nome: 'Reunião',            desc: 'Conversa com os noivos',             icone: 'M7 4v3M17 4v3M4 9h16M5 6h14v14H5z' },
  fecho:      { k: 'fecho',      nome: 'Fechou',             desc: 'Os noivos escolheram-nos',           icone: 'M5 12.5 10 17l9-10' },
  contrato:   { k: 'contrato',   nome: 'Contrato',           desc: 'Contrato CPS e dados',               icone: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5' },
  pagamento:  { k: 'pagamento',  nome: 'Pagamentos',         desc: 'Valores recebidos',                  icone: 'M4 7h16v11H4zM4 11h16M8 15h3' },
  portal:     { k: 'portal',     nome: 'Portal dos noivos',  desc: 'Acesso e envios do portal',          icone: 'M4 5h16v12H4zM9 21h6M12 17v4' },
  prewedding: { k: 'prewedding', nome: 'Pré-wedding',        desc: 'Sessão antes do casamento',          icone: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z' },
  evento:     { k: 'evento',     nome: 'Evento',             desc: 'Alterações na ficha',                icone: 'M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  casamento:  { k: 'casamento',  nome: 'Dia do casamento',   desc: '',                                    icone: 'M9 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM15 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  fotografia: { k: 'fotografia', nome: 'Fotografia',         desc: 'Departamento de fotografia',         icone: 'M4 8h4l2-3h4l2 3h4v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  album:      { k: 'album',      nome: 'Álbum',              desc: 'Maquete e aprovação',                icone: 'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12' },
  video:      { k: 'video',      nome: 'Vídeo',              desc: 'Departamento de vídeo',              icone: 'M4 7h11v10H4zM15 10l5-3v10l-5-3' },
  entrega:    { k: 'entrega',    nome: 'Entregas',           desc: 'Enviado aos noivos',                 icone: 'M12 4v11M7 10l5 5 5-5M5 20h14' },
}

// A fase do lead só avança com a mudança de estado (ou a própria reunião):
// os WhatsApp de "marcar reunião" ainda são da fase de lead.
const ORDEM_LEAD = ['lead', 'reuniao', 'fecho']
function faseLead(h: HistLinhaFluxo): string | null {
  if (/→\s*fech/i.test(h.titulo) || h.titulo === 'Fechou contrato') return 'fecho'
  if (/→\s*reuni[aã]o agendada/i.test(h.titulo) || /^Reuni[aã]o( \(|$)/i.test(h.titulo)) return 'reuniao'
  return null
}

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function Icone({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="15" height="15"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function HistoricoFluxo({ hist, cliente, dataEvento, onFechar }: {
  hist: HistLinhaFluxo[]; cliente?: string | null; dataEvento?: string | null; onFechar: () => void
}) {
  const [abertos, setAbertos] = useState<Set<number>>(new Set())

  useEffect(() => {
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onFechar() }
    document.addEventListener('keydown', esc)
    const ov = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ov }
  }, [onFechar])

  // Do mais antigo para o mais recente, com o dia do casamento no sítio certo
  const casamento = dataEvento ? `${dataEvento.slice(0, 10)}T10:00:00` : null
  const passou = !!casamento && new Date(casamento).getTime() <= Date.now()
  const linhas = [...hist, ...(casamento && passou ? [{ id: 'casamento', tipo: 'casamento', titulo: 'Casamento', detalhe: null, created_at: casamento }] : [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Ações seguidas da mesma fase ficam no mesmo cartão
  const blocos: { fase: Fase; itens: HistLinhaFluxo[] }[] = []
  let estagio = 'lead'
  for (const h of linhas) {
    let k: string
    if (h.id === 'casamento') k = 'casamento'
    else if (h.origem === 'lead') {
      const novo = faseLead(h)
      if (novo && ORDEM_LEAD.indexOf(novo) > ORDEM_LEAD.indexOf(estagio)) estagio = novo
      k = estagio
    } else k = FASES[h.tipo] ? h.tipo : 'evento'
    const f = FASES[k]
    const ult = blocos[blocos.length - 1]
    if (ult && ult.fase.k === f.k) ult.itens.push(h)
    else blocos.push({ fase: f, itens: [h] })
  }

  const nome = (cliente ?? '').trim()

  // Vai para o body: dentro da ficha, as secções seguintes ficavam por cima da janela
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Histórico do evento" onClick={onFechar}
      className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div onClick={ev => ev.stopPropagation()}
        className="relative w-full max-w-[760px] max-h-[92vh] flex flex-col rounded-[22px] border border-[#d8be93]/20 bg-[#0b0b0b] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(201,168,76,0.45)] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#d8be93]/15">
          <div>
            <p className="text-[9px] tracking-[0.42em] uppercase text-[#d8be93] font-semibold">Histórico</p>
            <h2 className="mt-1.5 text-[26px] leading-none font-light text-[#f3ede2]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {nome || 'Evento'}
            </h2>
            <p className="mt-2 text-[11px] text-white/40">
              {hist.length} {hist.length === 1 ? 'ação' : 'ações'}{linhas.length ? ` · desde ${data(linhas[0].created_at)}` : ''}{dataEvento ? ` · casamento a ${data(`${dataEvento.slice(0, 10)}T12:00:00`)}` : ''}
            </p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar"
            className="w-9 h-9 rounded-full border border-white/10 text-white/50 hover:text-[#d8be93] hover:border-[#d8be93]/50 grid place-items-center">✕</button>
        </div>

        {/* Fluxo sobre grelha de pontos */}
        <div className="flex-1 overflow-y-auto px-4 py-8"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
          <div className="mx-auto w-full max-w-[400px] flex flex-col items-stretch">
            {blocos.map((b, i) => {
              const aberto = abertos.has(i)
              const visiveis = aberto ? b.itens : b.itens.slice(0, 4)
              const ehCasamento = b.fase.k === 'casamento'
              const primeiro = b.itens[0], ultimo = b.itens[b.itens.length - 1]
              const quando = data(primeiro.created_at) === data(ultimo.created_at) ? data(primeiro.created_at) : `${data(primeiro.created_at)} → ${data(ultimo.created_at)}`
              return (
                <div key={i} className="flex flex-col items-stretch" style={{ animation: `hfEntra .4s ${Math.min(i, 10) * 50}ms both cubic-bezier(.2,.8,.2,1)` }}>
                  {i > 0 && <div className="mx-auto w-px h-9 bg-gradient-to-b from-[#d8be93]/50 to-[#d8be93]/25" />}
                  <div className="relative">
                    {/* Feito */}
                    <span className="absolute -top-[18px] right-1 flex items-center gap-1 text-[10px] text-white/40">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#d8be93] text-[#15120c] grid place-items-center text-[8px] font-bold">✓</span>
                      Feito
                    </span>
                    <div className={`rounded-2xl border bg-[#121212]/95 ${ehCasamento ? 'border-[#d8be93]/70 shadow-[0_0_30px_-12px_rgba(216,190,147,0.6)]' : 'border-[#d8be93]/35'}`}>
                      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
                        <span className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] text-[#d8be93] grid place-items-center"><Icone d={b.fase.icone} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-[#f3ede2] leading-tight">{b.fase.nome}</p>
                          <p className="text-[11px] text-white/40 leading-tight mt-0.5">{ehCasamento ? quando : `${b.fase.desc} · ${quando}`}</p>
                        </div>
                        {b.itens.length > 1 && <span className="text-[10px] text-white/35 tabular-nums">{b.itens.length}</span>}
                      </div>
                      {!ehCasamento && (
                        <div className="px-3 py-2.5 flex flex-col gap-1.5">
                          {visiveis.map(h => (
                            <div key={h.id} className="rounded-lg bg-white/[0.035] border border-white/[0.05] px-3 py-2">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className="text-[12.5px] text-[#e6e0d4] leading-snug">{h.titulo}</p>
                                <span className="text-[10px] text-white/30 whitespace-nowrap tabular-nums">{dataHora(h.created_at)}</span>
                              </div>
                              {h.detalhe && (
                                <span className="inline-block mt-1.5 text-[10.5px] text-[#d8be93] border border-[#d8be93]/30 rounded-md px-2 py-0.5">{h.detalhe}</span>
                              )}
                            </div>
                          ))}
                          {b.itens.length > 4 && (
                            <button type="button" onClick={() => setAbertos(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })}
                              className="self-start text-[10px] tracking-[0.2em] uppercase text-[#d8be93]/70 hover:text-[#d8be93] px-1 pt-0.5">
                              {aberto ? 'Mostrar menos' : `+ ${b.itens.length - 4} ${b.itens.length - 4 === 1 ? 'ação' : 'ações'}`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* O que ainda falta: o casamento */}
            {casamento && !passou && (
              <div className="flex flex-col items-stretch">
                {blocos.length > 0 && <div className="mx-auto w-px h-9 border-l border-dashed border-[#d8be93]/30" />}
                <div className="rounded-2xl border border-dashed border-[#d8be93]/35 bg-[#0e0e0e]/90 px-4 py-3.5 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg border border-dashed border-[#d8be93]/40 text-[#d8be93]/70 grid place-items-center"><Icone d={FASES.casamento.icone} /></span>
                  <div>
                    <p className="text-[14px] font-semibold text-white/70 leading-tight">Dia do casamento</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{data(`${dataEvento!.slice(0, 10)}T12:00:00`)} · por acontecer</p>
                  </div>
                </div>
              </div>
            )}

            {!blocos.length && <p className="text-center text-sm text-white/35 py-10">Sem ações registadas.</p>}
          </div>
        </div>
      </div>
      <style>{`@keyframes hfEntra { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`}</style>
    </div>,
    document.body,
  )
}
